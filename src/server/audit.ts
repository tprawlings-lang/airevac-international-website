import { createHash } from 'node:crypto';

import { query } from '@/server/db/client';
import { redact } from '@/lib/redact';

/**
 * Audit log.
 *
 * WHY READS ARE RECORDED AND NOT JUST WRITES. This database will hold patient
 * conversations. When something goes wrong, the question asked is "who opened
 * this transcript", and a log that records only modifications cannot answer it.
 * So `chat.transcript_read` is as much an audit event as `user.disabled`.
 *
 * WHAT NEVER REACHES THIS TABLE. No message body, no password, no token, no
 * patient information, no raw IP address. The `detail` object is shape and
 * outcome only: a reason code, a count, a role. Every value passes through the
 * same `redact` used for server logs, so a field named `email` or `phone` is
 * replaced even if a future caller passes one by mistake.
 *
 * FAILURE BEHAVIOUR. An audit write that fails logs and returns rather than
 * throwing. That is a real trade-off and it is chosen deliberately: making the
 * audit write fatal would mean a database hiccup during `audit('auth.login')`
 * locks every coordinator out of the console. For a system whose users are
 * coordinating medical flights, availability of the console wins over
 * completeness of the log, and the gap is itself logged so it is visible.
 */

export interface AuditEntry {
  actorUserId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Record<string, unknown>;
  /** Raw IP. Hashed here so no caller has to remember to. */
  ipHash?: string | null;
}

function hashIp(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (actor_user_id, action, target_type, target_id, detail, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.actorUserId ?? null,
        entry.action,
        entry.targetType ?? null,
        entry.targetId ?? null,
        JSON.stringify(redact(entry.detail ?? {})),
        hashIp(entry.ipHash),
      ],
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'audit.write_failed',
        action: entry.action,
        message: (error as Error).message,
      }),
    );
  }
}

export interface AuditRow {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: Record<string, unknown>;
  at: Date;
}

/** Most recent entries, for the admin view. Reading this is itself audited. */
export async function recentAuditEntries(limit = 100): Promise<AuditRow[]> {
  const rows = await query<{
    id: string;
    actor_user_id: string | null;
    actor_email: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    detail: Record<string, unknown>;
    at: Date;
  }>(
    `SELECT a.id::text, a.actor_user_id, u.email AS actor_email, a.action,
            a.target_type, a.target_id, a.detail, a.at
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_user_id
      ORDER BY a.at DESC
      LIMIT $1`,
    [Math.min(limit, 500)],
  );

  return rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    detail: row.detail,
    at: row.at,
  }));
}
