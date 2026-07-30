import { query, queryOne, transaction } from '@/server/db/client';
import { audit } from '@/server/audit';
import {
  checkPasswordPolicy,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from '@/server/auth/password';
import { revokeAllUserSessions } from '@/server/auth/sessions';

/**
 * User records: creation, authentication, password change, and lifecycle.
 *
 * The lockout and timing behaviour in `authenticate` is the security-critical
 * part of this file; read the comments there before changing it.
 */

export type UserRole = 'admin' | 'coordinator';

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'disabled';
  languages: string[];
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  lockedUntil: Date | null;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: UserRole;
  status: 'active' | 'disabled';
  languages: string[];
  must_change_password: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  created_at: Date;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** Normalised so that Ops@ and ops@ are the same account, never two. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    languages: row.languages,
    mustChangePassword: row.must_change_password,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    lockedUntil: row.locked_until,
  };
}

export type AuthOutcome =
  | { ok: true; user: UserRecord }
  | { ok: false; reason: 'invalid' | 'locked' | 'disabled' };

/**
 * Authenticates an email and password.
 *
 * THREE THINGS HERE ARE DELIBERATE AND EASY TO BREAK BY TIDYING:
 *
 * 1. An unknown email still runs a full password hash against a dummy value.
 *    Returning early would make "no such user" measurably faster than "wrong
 *    password", which turns the login form into an account-enumeration oracle.
 *
 * 2. `invalid` is returned for both an unknown email and a wrong password, and
 *    the caller shows one message for both. Same reason.
 *
 * 3. Lockout is checked before the password is verified, so a locked account
 *    cannot be probed by watching which passwords take longer.
 *
 * The per-user counter here is only half the protection. It does nothing
 * against an attacker spraying one common password across many accounts, which
 * never trips a single user's counter; the per-IP rate limit on the route is
 * what covers that.
 */
export async function authenticate(
  email: string,
  password: string,
  context: { ip?: string | null } = {},
): Promise<AuthOutcome> {
  const normalized = normalizeEmail(email);
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [normalized]);

  if (row === undefined) {
    // Constant-work path for an unknown account. The hash is discarded; the
    // point is that the response takes the same time as a real attempt.
    await verifyPassword(password, await dummyHash());
    await audit({
      action: 'auth.login_failed',
      detail: { reason: 'unknown_email' },
      ipHash: context.ip ?? null,
    });
    return { ok: false, reason: 'invalid' };
  }

  if (row.status === 'disabled') {
    await verifyPassword(password, row.password_hash);
    await audit({
      actorUserId: row.id,
      action: 'auth.login_failed',
      detail: { reason: 'disabled' },
      ipHash: context.ip ?? null,
    });
    return { ok: false, reason: 'disabled' };
  }

  if (row.locked_until !== null && row.locked_until.getTime() > Date.now()) {
    await audit({
      actorUserId: row.id,
      action: 'auth.login_blocked',
      detail: { reason: 'locked' },
      ipHash: context.ip ?? null,
    });
    return { ok: false, reason: 'locked' };
  }

  const { valid, needsRehash } = await verifyPassword(password, row.password_hash);

  if (!valid) {
    const attempts = row.failed_attempts + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS;

    await query(
      `UPDATE users
          SET failed_attempts = $2,
              locked_until = CASE WHEN $3 THEN now() + ($4 || ' minutes')::interval ELSE locked_until END
        WHERE id = $1`,
      [row.id, lock ? 0 : attempts, lock, String(LOCKOUT_MINUTES)],
    );

    await audit({
      actorUserId: row.id,
      action: lock ? 'auth.account_locked' : 'auth.login_failed',
      detail: { reason: 'bad_password', attempts },
      ipHash: context.ip ?? null,
    });

    return { ok: false, reason: lock ? 'locked' : 'invalid' };
  }

  // Opportunistic upgrade: if the stored hash used weaker parameters than
  // current policy, rewrite it now that the plaintext is in hand. This is the
  // only moment it is available.
  const rehash = needsRehash ? await hashPassword(password) : null;

  await query(
    `UPDATE users
        SET failed_attempts = 0,
            locked_until = NULL,
            last_login_at = now(),
            password_hash = COALESCE($2, password_hash)
      WHERE id = $1`,
    [row.id, rehash],
  );

  await audit({
    actorUserId: row.id,
    action: 'auth.login',
    detail: { rehashed: needsRehash },
    ipHash: context.ip ?? null,
  });

  return { ok: true, user: toRecord({ ...row, last_login_at: new Date() }) };
}

/**
 * A hash to compare against when the account does not exist.
 *
 * Computed once per process and cached, because generating it costs the same
 * scrypt work as a real verification and doing it twice per unknown-email
 * attempt would make that path slower than the real one, reintroducing the
 * timing signal from the other direction.
 */
let cachedDummy: string | undefined;
async function dummyHash(): Promise<string> {
  cachedDummy ??= await hashPassword('there-is-no-such-account-here');
  return cachedDummy;
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return row === undefined ? undefined : toRecord(row);
}

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await query<UserRow>('SELECT * FROM users ORDER BY created_at ASC');
  return rows.map(toRecord);
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  languages?: string[];
  createdBy?: string | null;
  /** Omit to generate one. The caller must show it to the admin exactly once. */
  password?: string;
}

export interface CreatedUser {
  user: UserRecord;
  /** The one-time password to hand over. Never stored, never logged. */
  temporaryPassword: string;
}

/**
 * Creates a user with a one-time password and `must_change_password` set.
 *
 * The admin who creates the account sees the temporary password once, and the
 * new coordinator replaces it on first login. That sequence means no admin ends
 * up knowing a coordinator's working password, which matters when the audit log
 * has to distinguish who did something.
 */
export async function createUser(input: CreateUserInput): Promise<CreatedUser> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  if (input.displayName.trim().length < 2) {
    throw new Error('Enter the person’s name.');
  }

  const temporaryPassword = input.password ?? generateTemporaryPassword();
  const hash = await hashPassword(temporaryPassword);

  const row = await transaction(async (client) => {
    const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount !== null && existing.rowCount > 0) {
      throw new Error('An account with that email already exists.');
    }

    const inserted = await client.query<UserRow>(
      `INSERT INTO users (email, display_name, password_hash, role, languages,
                          must_change_password, created_by, password_changed_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, NULL)
       RETURNING *`,
      [
        email,
        input.displayName.trim(),
        hash,
        input.role,
        input.languages ?? ['en'],
        input.createdBy ?? null,
      ],
    );
    return inserted.rows[0]!;
  });

  await audit({
    actorUserId: input.createdBy ?? null,
    action: 'user.created',
    targetType: 'user',
    targetId: row.id,
    detail: { role: input.role },
  });

  return { user: toRecord(row), temporaryPassword };
}

export type ChangePasswordOutcome =
  | { ok: true }
  | { ok: false; reason: 'wrong_current' | 'policy'; problems?: string[] };

/**
 * Changes a user's own password.
 *
 * Requires the current password even when the account is in the forced-change
 * state, so possession of a half-authenticated session is not enough to take
 * the account over permanently.
 *
 * Every other session for the user is revoked in the same transaction. Doing
 * that outside the transaction would leave a window where the password is
 * already changed and the old sessions are still live, which is the exact
 * scenario a password change is usually a response to.
 */
export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordOutcome> {
  const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
  if (row === undefined) return { ok: false, reason: 'wrong_current' };

  const { valid } = await verifyPassword(currentPassword, row.password_hash);
  if (!valid) {
    await audit({
      actorUserId: userId,
      action: 'user.password_change_failed',
      detail: { reason: 'wrong_current' },
    });
    return { ok: false, reason: 'wrong_current' };
  }

  const policy = checkPasswordPolicy(newPassword, row.email);
  if (!policy.ok) return { ok: false, reason: 'policy', problems: policy.problems };

  const hash = await hashPassword(newPassword);

  await transaction(async (client) => {
    await client.query(
      `UPDATE users
          SET password_hash = $2,
              must_change_password = FALSE,
              password_changed_at = now(),
              failed_attempts = 0,
              locked_until = NULL
        WHERE id = $1`,
      [userId, hash],
    );
    await revokeAllUserSessions(userId, 'password_changed', client);
  });

  await audit({ actorUserId: userId, action: 'user.password_changed', targetId: userId });
  return { ok: true };
}

/** Disables an account and ends its sessions in the same transaction. */
export async function setUserStatus(
  userId: string,
  status: 'active' | 'disabled',
  actorUserId: string,
): Promise<void> {
  await transaction(async (client) => {
    /*
     * $2 is cast to user_status in both places it appears. Without the casts
     * Postgres sees the parameter used once as an enum and once against a text
     * literal, cannot deduce a single type, and rejects the statement.
     */
    await client.query(
      `UPDATE users
          SET status = $2::user_status,
              disabled_at = CASE WHEN $2::user_status = 'disabled'::user_status
                                 THEN now() ELSE NULL END
        WHERE id = $1`,
      [userId, status],
    );
    if (status === 'disabled') {
      await revokeAllUserSessions(userId, 'account_disabled', client);
    }
  });

  await audit({
    actorUserId,
    action: status === 'disabled' ? 'user.disabled' : 'user.enabled',
    targetType: 'user',
    targetId: userId,
  });
}

/**
 * Resets another user's password, as an admin.
 *
 * Produces a one-time password and re-arms the forced change, so the admin does
 * not end up knowing the credential the coordinator will actually use.
 */
export async function adminResetPassword(
  userId: string,
  actorUserId: string,
): Promise<string> {
  const temporaryPassword = generateTemporaryPassword();
  const hash = await hashPassword(temporaryPassword);

  await transaction(async (client) => {
    await client.query(
      `UPDATE users
          SET password_hash = $2,
              must_change_password = TRUE,
              failed_attempts = 0,
              locked_until = NULL,
              password_changed_at = NULL
        WHERE id = $1`,
      [userId, hash],
    );
    await revokeAllUserSessions(userId, 'admin_password_reset', client);
  });

  await audit({
    actorUserId,
    action: 'user.password_reset_by_admin',
    targetType: 'user',
    targetId: userId,
  });

  return temporaryPassword;
}

/**
 * Seeds the first administrator.
 *
 * THE `admin`/`admin` QUESTION, ANSWERED IN CODE.
 *
 * AirEvac asked for the admin password to be `admin`, which is reasonable for
 * opening a demo without a credential hunt and unshippable as a permanent
 * state: this console will hold patient conversations, and `admin`/`admin` is
 * the first pair every internet-wide scanner tries.
 *
 * The compromise implemented here:
 *   - The seed runs only when there is no admin at all AND
 *     ALLOW_BOOTSTRAP_ADMIN=true is set in the environment. It is absent in
 *     production by default, so this cannot ship by being forgotten.
 *   - The account is created with must_change_password, so `admin`/`admin`
 *     signs in exactly once and the only reachable page is "choose a new
 *     password".
 *   - `admin` is on the forbidden-password list, so it cannot be chosen again
 *     on the way out of that flow.
 *
 * Returns null when the conditions are not met, which is the ordinary case.
 */
export async function seedBootstrapAdmin(): Promise<CreatedUser | null> {
  if (process.env.ALLOW_BOOTSTRAP_ADMIN !== 'true') return null;

  const existing = await queryOne<{ count: string }>(
    "SELECT count(*)::text AS count FROM users WHERE role = 'admin'",
  );
  if (existing !== undefined && Number(existing.count) > 0) return null;

  const created = await createUser({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@aeiamericas.com',
    displayName: 'Administrator',
    role: 'admin',
    password: 'admin',
  });

  await audit({
    action: 'user.bootstrap_admin_seeded',
    targetType: 'user',
    targetId: created.user.id,
    detail: { forcedPasswordChange: true },
  });

  return created;
}
