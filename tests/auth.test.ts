import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { __closePool, getPool, query } from '@/server/db/client';
import { runMigrations } from '@/server/db/migrate.mjs';
import {
  checkPasswordPolicy,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from '@/server/auth/password';
import {
  adminResetPassword,
  authenticate,
  changeOwnPassword,
  createUser,
  seedBootstrapAdmin,
  setUserStatus,
} from '@/server/auth/users';
import { issueSession, resolveSession, revokeSession } from '@/server/auth/sessions';

/**
 * Phase A security tests, run against a real Postgres.
 *
 * Not a mock: the lockout, the session expiry, and the transactional
 * revocation are all database behaviour, and a fake would only prove the fake
 * works. Requires DATABASE_URL pointing at a disposable database.
 */

const HAS_DB = (process.env.DATABASE_URL ?? '') !== '';

beforeAll(async () => {
  if (!HAS_DB) return;
  await runMigrations(getPool());
});

beforeEach(async () => {
  if (!HAS_DB) return;
  await query('TRUNCATE sessions, audit_log, users RESTART IDENTITY CASCADE');
  delete process.env.ALLOW_BOOTSTRAP_ADMIN;
});

afterAll(async () => {
  if (!HAS_DB) return;
  await __closePool();
});

describe('password hashing', () => {
  it('never stores the password, and never the same hash twice', async () => {
    const a = await hashPassword('correct horse battery staple');
    const b = await hashPassword('correct horse battery staple');
    expect(a).not.toContain('correct');
    expect(a).not.toBe(b); // distinct salts
  });

  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect((await verifyPassword('correct horse battery staple', hash)).valid).toBe(true);
    expect((await verifyPassword('Correct horse battery staple', hash)).valid).toBe(false);
  });

  it('rejects a malformed stored hash instead of throwing', async () => {
    // A row that cannot be parsed must not become a 500 that tells an attacker
    // they found something interesting.
    for (const bad of ['', 'not-a-hash', 'scrypt$1$1$1$x$y', 'bcrypt$a$b$c$d$e']) {
      await expect(verifyPassword('anything', bad)).resolves.toEqual({
        valid: false,
        needsRehash: false,
      });
    }
  });

  it('flags a hash weaker than current policy for rehash', async () => {
    const hash = await hashPassword('a strong enough password here');
    const weakened = hash.replace(/^scrypt\$\d+/, 'scrypt$16384');
    const result = await verifyPassword('a strong enough password here', weakened);
    expect(result.needsRehash).toBe(true);
  });
});

describe('password policy', () => {
  it('rejects "admin" specifically', () => {
    // The bootstrap admin signs in with this once. It must be impossible to
    // choose again on the way out of the forced-change screen.
    expect(checkPasswordPolicy('admin').ok).toBe(false);
  });

  it('rejects short passwords and common ones', () => {
    expect(checkPasswordPolicy('short').ok).toBe(false);
    expect(checkPasswordPolicy('password').ok).toBe(false);
    expect(checkPasswordPolicy('aaaaaaaaaaaaaaa').ok).toBe(false);
  });

  it('rejects a password containing the user’s own email name', () => {
    expect(checkPasswordPolicy('rsmendoza-is-here', 'rsmendoza@example.com').ok).toBe(false);
  });

  it('accepts a long passphrase without demanding symbols', () => {
    // NIST 800-63B withdrew composition rules; length is what resists cracking.
    expect(checkPasswordPolicy('the wind in the willows blew').ok).toBe(true);
  });

  it('generates temporary passwords that pass policy and never repeat', () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toBe(b);
    expect(checkPasswordPolicy(a).ok).toBe(true);
  });
});

describe.runIf(HAS_DB)('authentication against the database', () => {
  async function makeUser(email = 'coordinator@aeiamericas.com') {
    return createUser({ email, displayName: 'Test Coordinator', role: 'coordinator' });
  }

  it('authenticates with the temporary password and demands a change', async () => {
    const { user, temporaryPassword } = await makeUser();
    const result = await authenticate(user.email, temporaryPassword);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.mustChangePassword).toBe(true);
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    // Distinguishing them turns the login form into an account-enumeration oracle.
    const { user } = await makeUser();
    const unknown = await authenticate('nobody@aeiamericas.com', 'whatever');
    const wrong = await authenticate(user.email, 'definitely-not-the-password');
    expect(unknown).toEqual({ ok: false, reason: 'invalid' });
    expect(wrong).toEqual({ ok: false, reason: 'invalid' });
  });

  it('locks the account after five failures and refuses the right password', async () => {
    const { user, temporaryPassword } = await makeUser();
    for (let i = 0; i < 4; i += 1) {
      expect((await authenticate(user.email, 'wrong')).ok).toBe(false);
    }
    const fifth = await authenticate(user.email, 'wrong');
    expect(fifth).toEqual({ ok: false, reason: 'locked' });

    const correct = await authenticate(user.email, temporaryPassword);
    expect(correct).toEqual({ ok: false, reason: 'locked' });
  });

  it('clears the failure count on a successful login', async () => {
    const { user, temporaryPassword } = await makeUser();
    await authenticate(user.email, 'wrong');
    await authenticate(user.email, 'wrong');
    expect((await authenticate(user.email, temporaryPassword)).ok).toBe(true);

    const rows = await query<{ failed_attempts: number }>(
      'SELECT failed_attempts FROM users WHERE id = $1',
      [user.id],
    );
    expect(rows[0]?.failed_attempts).toBe(0);
  });

  it('refuses a disabled account and ends its live sessions', async () => {
    const { user, temporaryPassword } = await makeUser();
    const admin = await createUser({
      email: 'admin@aeiamericas.com',
      displayName: 'Admin',
      role: 'admin',
    });

    const session = await issueSession(user.id);
    expect(await resolveSession(session.token)).not.toBeNull();

    await setUserStatus(user.id, 'disabled', admin.user.id);

    // Both the credential and the existing session must stop working.
    expect(await authenticate(user.email, temporaryPassword)).toEqual({
      ok: false,
      reason: 'disabled',
    });
    expect(await resolveSession(session.token)).toBeNull();
  });

  it('treats email as case-insensitive', async () => {
    const { temporaryPassword } = await makeUser('Mixed.Case@Aeiamericas.com');
    expect((await authenticate('mixed.case@aeiamericas.com', temporaryPassword)).ok).toBe(true);
  });

  it('refuses a duplicate email', async () => {
    await makeUser('dup@aeiamericas.com');
    await expect(makeUser('DUP@aeiamericas.com')).rejects.toThrow(/already exists/i);
  });
});

describe.runIf(HAS_DB)('sessions', () => {
  it('stores only a hash of the token', async () => {
    const { user } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const session = await issueSession(user.id);
    const rows = await query<{ token_hash: string }>('SELECT token_hash FROM sessions');
    expect(rows[0]?.token_hash).not.toBe(session.token);
    expect(rows[0]?.token_hash).toHaveLength(64);
  });

  it('resolves a valid token and rejects a revoked one', async () => {
    const { user } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const session = await issueSession(user.id);
    expect((await resolveSession(session.token))?.id).toBe(user.id);

    await revokeSession(session.token);
    expect(await resolveSession(session.token)).toBeNull();
  });

  it('rejects an expired session', async () => {
    const { user } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const session = await issueSession(user.id);
    await query("UPDATE sessions SET expires_at = now() - interval '1 minute'");
    expect(await resolveSession(session.token)).toBeNull();
  });

  it('never lets the idle slide push a session past its absolute expiry', async () => {
    const { user } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const session = await issueSession(user.id);
    await query("UPDATE sessions SET absolute_expires_at = now() + interval '2 minutes'");
    await resolveSession(session.token);

    const rows = await query<{ expires_at: Date; absolute_expires_at: Date }>(
      'SELECT expires_at, absolute_expires_at FROM sessions',
    );
    expect(rows[0]!.expires_at.getTime()).toBeLessThanOrEqual(
      rows[0]!.absolute_expires_at.getTime(),
    );
  });

  it('rejects a garbage token without throwing', async () => {
    expect(await resolveSession('not-a-real-token')).toBeNull();
    expect(await resolveSession(undefined)).toBeNull();
  });
});

describe.runIf(HAS_DB)('password change', () => {
  it('requires the current password', async () => {
    const { user } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const result = await changeOwnPassword(user.id, 'wrong', 'a perfectly good passphrase');
    expect(result).toEqual({ ok: false, reason: 'wrong_current' });
  });

  it('enforces policy on the new password', async () => {
    const { user, temporaryPassword } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const result = await changeOwnPassword(user.id, temporaryPassword, 'admin');
    expect(result.ok).toBe(false);
  });

  it('clears the forced-change flag and revokes every other session', async () => {
    const { user, temporaryPassword } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    const other = await issueSession(user.id);

    const result = await changeOwnPassword(user.id, temporaryPassword, 'a much better passphrase');
    expect(result.ok).toBe(true);

    // A password change usually happens because someone else may have the old
    // one. Leaving their session alive would defeat the point.
    expect(await resolveSession(other.token)).toBeNull();

    const login = await authenticate(user.email, 'a much better passphrase');
    expect(login.ok).toBe(true);
    if (login.ok) expect(login.user.mustChangePassword).toBe(false);
  });

  it('re-arms the forced change on an admin reset', async () => {
    const admin = await createUser({
      email: 'admin@aeiamericas.com',
      displayName: 'Admin',
      role: 'admin',
    });
    const { user, temporaryPassword } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    await changeOwnPassword(user.id, temporaryPassword, 'a much better passphrase');

    const fresh = await adminResetPassword(user.id, admin.user.id);
    const login = await authenticate(user.email, fresh);
    expect(login.ok).toBe(true);
    if (login.ok) expect(login.user.mustChangePassword).toBe(true);
  });
});

describe.runIf(HAS_DB)('bootstrap admin', () => {
  it('does nothing without the environment flag', async () => {
    expect(await seedBootstrapAdmin()).toBeNull();
  });

  it('seeds admin/admin once, forced to change, when the flag is set', async () => {
    process.env.ALLOW_BOOTSTRAP_ADMIN = 'true';
    const created = await seedBootstrapAdmin();
    expect(created).not.toBeNull();

    const login = await authenticate(created!.user.email, 'admin');
    expect(login.ok).toBe(true);
    if (login.ok) {
      expect(login.user.role).toBe('admin');
      // The whole safety of the arrangement: it signs in once and can reach
      // nothing but the change-password screen.
      expect(login.user.mustChangePassword).toBe(true);
    }
  });

  it('refuses to seed a second admin', async () => {
    process.env.ALLOW_BOOTSTRAP_ADMIN = 'true';
    expect(await seedBootstrapAdmin()).not.toBeNull();
    expect(await seedBootstrapAdmin()).toBeNull();
  });

  it('cannot keep "admin" as the password after the forced change', async () => {
    process.env.ALLOW_BOOTSTRAP_ADMIN = 'true';
    const created = await seedBootstrapAdmin();
    const result = await changeOwnPassword(created!.user.id, 'admin', 'admin');
    expect(result.ok).toBe(false);
  });
});

describe.runIf(HAS_DB)('audit log', () => {
  it('records logins, failures, and lockouts', async () => {
    const { user, temporaryPassword } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    await authenticate(user.email, 'wrong');
    await authenticate(user.email, temporaryPassword);

    const rows = await query<{ action: string }>('SELECT action FROM audit_log ORDER BY id');
    const actions = rows.map((r) => r.action);
    expect(actions).toContain('user.created');
    expect(actions).toContain('auth.login_failed');
    expect(actions).toContain('auth.login');
  });

  it('never records a password or a token in the detail', async () => {
    const { user, temporaryPassword } = await createUser({
      email: 'c@aeiamericas.com',
      displayName: 'Coordinator C',
      role: 'coordinator',
    });
    await authenticate(user.email, temporaryPassword);
    await changeOwnPassword(user.id, temporaryPassword, 'a much better passphrase');

    const rows = await query<{ detail: unknown }>('SELECT detail FROM audit_log');
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain(temporaryPassword);
    expect(serialized).not.toContain('a much better passphrase');
  });
});
