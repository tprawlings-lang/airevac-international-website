import { createHash, randomBytes } from 'node:crypto';

import { query, queryOne } from '@/server/db/client';
import type { PoolClient } from 'pg';

/**
 * Session issue, verification, and revocation.
 *
 * THE TOKEN IS NEVER STORED. What goes in the cookie is 32 random bytes; what
 * goes in the database is its SHA-256. A stolen database backup therefore
 * yields no usable sessions, which is the same reasoning that governs password
 * hashing and costs nothing here.
 *
 * SHA-256 rather than scrypt for this one: the token is already 256 bits of
 * randomness, so there is no low-entropy secret to slow an attacker down
 * against, and a slow hash on every authenticated request would be a
 * self-inflicted denial of service.
 *
 * TWO EXPIRIES, and they do different jobs. The idle expiry slides forward on
 * use, so a coordinator working a case is not logged out mid-conversation. The
 * absolute expiry never moves, so a session left open on an unattended machine
 * dies on its own regardless of activity.
 */

export const SESSION_COOKIE = 'aei_session';

const IDLE_MINUTES = 30;
const ABSOLUTE_HOURS = 12;

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'coordinator';
  status: 'active' | 'disabled';
  languages: string[];
  mustChangePassword: boolean;
}

export interface IssuedSession {
  /** The raw token. Goes in the cookie and is never persisted. */
  token: string;
  sessionId: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Hashes a coarsened client fingerprint.
 *
 * Stored so that a session suddenly used from a different network is
 * detectable, and hashed so the row is not a retained identifier. Section 15
 * caps raw IP retention; this keeps the signal without keeping the address.
 */
export function fingerprint(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

export async function issueSession(
  userId: string,
  context: { ip?: string | null; userAgent?: string | null } = {},
  client?: PoolClient,
): Promise<IssuedSession> {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const expiresAt = new Date(now + IDLE_MINUTES * 60_000);
  const absoluteExpiresAt = new Date(now + ABSOLUTE_HOURS * 3_600_000);

  const sql = `
    INSERT INTO sessions
      (user_id, token_hash, expires_at, absolute_expires_at, ip_hash, user_agent_hash)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const params = [
    userId,
    hashToken(token),
    expiresAt,
    absoluteExpiresAt,
    fingerprint(context.ip),
    fingerprint(context.userAgent),
  ];

  const row =
    client !== undefined
      ? (await client.query<{ id: string }>(sql, params)).rows[0]
      : await queryOne<{ id: string }>(sql, params);

  if (row === undefined) throw new Error('Failed to create session');

  return { token, sessionId: row.id, expiresAt, absoluteExpiresAt };
}

interface SessionRow {
  session_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'coordinator';
  status: 'active' | 'disabled';
  languages: string[];
  must_change_password: boolean;
}

/**
 * Resolves a cookie token to a user, sliding the idle expiry forward.
 *
 * Returns null for every failure mode without distinguishing them: no token, no
 * row, revoked, idle-expired, absolute-expired, or a user since disabled. The
 * caller has no legitimate use for the difference, and an attacker does.
 *
 * The disabled check is here rather than only at login on purpose. Disabling an
 * account has to end its live sessions, or a coordinator removed for cause
 * keeps working until their session happens to expire.
 */
export async function resolveSession(token: string | undefined): Promise<SessionUser | null> {
  if (token === undefined || token === '') return null;

  const row = await queryOne<SessionRow>(
    `
    UPDATE sessions s
       SET last_seen_at = now(),
           expires_at   = LEAST(now() + ($2 || ' minutes')::interval, s.absolute_expires_at)
      FROM users u
     WHERE s.token_hash = $1
       AND s.user_id = u.id
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND s.absolute_expires_at > now()
       AND u.status = 'active'
    RETURNING s.id            AS session_id,
              u.id            AS user_id,
              u.email,
              u.display_name,
              u.role,
              u.status,
              u.languages,
              u.must_change_password
    `,
    [hashToken(token), String(IDLE_MINUTES)],
  );

  if (row === undefined) return null;

  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    languages: row.languages,
    mustChangePassword: row.must_change_password,
  };
}

export async function revokeSession(token: string, reason = 'logout'): Promise<void> {
  await query(
    `UPDATE sessions
        SET revoked_at = now(), revoked_reason = $2
      WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(token), reason],
  );
}

/**
 * Revokes every session for a user.
 *
 * Called on password change, on disable, and on role change. A password change
 * that leaves other sessions alive is close to pointless: the usual reason
 * someone changes a password is that they think somebody else has it.
 */
export async function revokeAllUserSessions(
  userId: string,
  reason: string,
  client?: PoolClient,
): Promise<number> {
  const sql = `
    UPDATE sessions
       SET revoked_at = now(), revoked_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL
  `;
  if (client !== undefined) {
    const result = await client.query(sql, [userId, reason]);
    return result.rowCount ?? 0;
  }
  const rows = await query(`${sql} RETURNING id`, [userId, reason]);
  return rows.length;
}

/** Housekeeping. Expired rows carry a fingerprint and are not worth keeping. */
export async function purgeExpiredSessions(): Promise<number> {
  const rows = await query(
    `DELETE FROM sessions
      WHERE absolute_expires_at < now() - interval '7 days'
      RETURNING id`,
  );
  return rows.length;
}
