import { createHash, randomBytes } from 'node:crypto';

import { query, queryOne, transaction } from '@/server/db/client';
import { audit } from '@/server/audit';
import { sendMail } from '@/server/mail';
import { SITE } from '@/content/site';

/**
 * Chat sessions and messages.
 *
 * RETENTION IS SET AT CREATION, not decided later. `delete_after` is stamped on
 * every row when it is made, so deleting expired conversations is a sweep over
 * an index rather than a policy someone has to remember to apply. D9 has not
 * closed, so the default below is deliberately short: it is easier to lengthen
 * a retention window after a decision than to explain why six months of
 * patient conversations accumulated while one was pending.
 */

/**
 * Days a transcript is kept.
 *
 * PROVISIONAL, pending D9. Thirty days covers a case being worked, a follow-up
 * call, and a billing question, and is short enough that an unapproved
 * retention period cannot quietly become a permanent archive.
 */
const RETENTION_DAYS = Number(process.env.CHAT_RETENTION_DAYS ?? 30);

/** Queued chats with no coordinator and no activity are given up on. */
const ABANDON_AFTER_MINUTES = 30;

export type ChatStatus = 'intake' | 'queued' | 'active' | 'closed' | 'abandoned';
export type MessageSender = 'visitor' | 'coordinator' | 'system';

export interface ChatIntake {
  role: string;
  contactName: string;
  phone: string;
  organization?: string;
  originCity?: string;
  destinationCity?: string;
  timeframe?: string;
  preferredLanguage: string;
}

export interface ChatSessionRecord {
  id: string;
  publicRef: string;
  status: ChatStatus;
  intake: ChatIntake;
  visitorLanguage: string;
  assignedUserId: string | null;
  startedAt: Date;
  connectedAt: Date | null;
  closedAt: Date | null;
  lastActivityAt: Date;
}

interface SessionRow {
  id: string;
  public_ref: string;
  status: ChatStatus;
  intake: ChatIntake;
  visitor_language: string;
  assigned_user_id: string | null;
  started_at: Date;
  connected_at: Date | null;
  closed_at: Date | null;
  last_activity_at: Date;
}

function toRecord(row: SessionRow): ChatSessionRecord {
  return {
    id: row.id,
    publicRef: row.public_ref,
    status: row.status,
    intake: row.intake,
    visitorLanguage: row.visitor_language,
    assignedUserId: row.assigned_user_id,
    startedAt: row.started_at,
    connectedAt: row.connected_at,
    closedAt: row.closed_at,
    lastActivityAt: row.last_activity_at,
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Same shape as the callback form's reference, so staff learn one format. */
function mintPublicRef(now: Date): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `AE-${date}-${suffix}`;
}

export interface StartedChat {
  record: ChatSessionRecord;
  /** Held by the visitor's browser. Never stored in plaintext. */
  visitorToken: string;
}

/**
 * Opens a chat and puts it in the queue.
 *
 * The visitor is not authenticated, so the token returned here is the only
 * thing binding a browser to a conversation. It is stored hashed for the same
 * reason a session token is: a leaked backup must not let anyone resume
 * somebody else's chat.
 */
export async function startChat(
  intake: ChatIntake,
  context: { ip?: string | null } = {},
): Promise<StartedChat> {
  const visitorToken = randomBytes(32).toString('base64url');
  const now = new Date();

  const row = await queryOne<SessionRow>(
    `INSERT INTO chat_sessions
       (public_ref, visitor_token_hash, status, intake, visitor_language,
        delete_after, ip_hash)
     VALUES ($1, $2, 'queued', $3::jsonb, $4,
             now() + ($5 || ' days')::interval, $6)
     RETURNING *`,
    [
      mintPublicRef(now),
      hashToken(visitorToken),
      JSON.stringify(intake),
      intake.preferredLanguage,
      String(RETENTION_DAYS),
      context.ip === undefined || context.ip === null
        ? null
        : createHash('sha256').update(context.ip).digest('hex').slice(0, 32),
    ],
  );

  if (row === undefined) throw new Error('Failed to open chat session');

  await audit({
    action: 'chat.started',
    targetType: 'chat',
    targetId: row.id,
    detail: { role: intake.role, language: intake.preferredLanguage },
  });

  return { record: toRecord(row), visitorToken };
}

/** Resolves a visitor's token to their conversation. */
export async function findByVisitorToken(token: string): Promise<ChatSessionRecord | undefined> {
  if (token === '') return undefined;
  const row = await queryOne<SessionRow>(
    'SELECT * FROM chat_sessions WHERE visitor_token_hash = $1',
    [hashToken(token)],
  );
  return row === undefined ? undefined : toRecord(row);
}

export async function findById(id: string): Promise<ChatSessionRecord | undefined> {
  const row = await queryOne<SessionRow>('SELECT * FROM chat_sessions WHERE id = $1', [id]);
  return row === undefined ? undefined : toRecord(row);
}

/** Chats waiting for someone to pick them up. */
export async function queuedChats(): Promise<ChatSessionRecord[]> {
  const rows = await query<SessionRow>(
    `SELECT * FROM chat_sessions WHERE status = 'queued' ORDER BY started_at ASC`,
  );
  return rows.map(toRecord);
}

/** Chats a given coordinator is currently handling. */
export async function activeChatsFor(userId: string): Promise<ChatSessionRecord[]> {
  const rows = await query<SessionRow>(
    `SELECT * FROM chat_sessions
      WHERE assigned_user_id = $1 AND status = 'active'
      ORDER BY connected_at ASC`,
    [userId],
  );
  return rows.map(toRecord);
}

/**
 * Claims a queued chat.
 *
 * The UPDATE filters on `status = 'queued'`, which makes the claim atomic: two
 * coordinators clicking the same conversation at the same moment produce one
 * winner and one `undefined`, without a lock. First version of routing is
 * deliberately manual, because automatic assignment is not worth building for
 * a team this size.
 */
export async function claimChat(
  chatId: string,
  userId: string,
): Promise<ChatSessionRecord | undefined> {
  const row = await queryOne<SessionRow>(
    `UPDATE chat_sessions
        SET status = 'active', assigned_user_id = $2,
            connected_at = now(), last_activity_at = now()
      WHERE id = $1 AND status = 'queued'
      RETURNING *`,
    [chatId, userId],
  );

  if (row !== undefined) {
    await audit({
      actorUserId: userId,
      action: 'chat.claimed',
      targetType: 'chat',
      targetId: chatId,
    });
  }

  return row === undefined ? undefined : toRecord(row);
}

export interface ChatMessageRecord {
  id: string;
  sender: MessageSender;
  senderUserId: string | null;
  bodyOriginal: string;
  languageOriginal: string;
  bodyTranslated: string | null;
  languageTranslated: string | null;
  translationError: string | null;
  createdAt: Date;
}

interface MessageRow {
  id: string;
  sender: MessageSender;
  sender_user_id: string | null;
  body_original: string;
  language_original: string;
  body_translated: string | null;
  language_translated: string | null;
  translation_error: string | null;
  created_at: Date;
}

function toMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    sender: row.sender,
    senderUserId: row.sender_user_id,
    bodyOriginal: row.body_original,
    languageOriginal: row.language_original,
    bodyTranslated: row.body_translated,
    languageTranslated: row.language_translated,
    translationError: row.translation_error,
    createdAt: row.created_at,
  };
}

export interface PostMessageInput {
  chatId: string;
  sender: MessageSender;
  senderUserId?: string | null;
  body: string;
  language: string;
  translated?: { body: string; language: string; engine: string } | null;
  translationError?: string | null;
}

/**
 * Appends a message and marks the conversation active.
 *
 * The original and its translation are written together and the original is
 * never replaced. `last_activity_at` moves on every message, which is what
 * keeps a live conversation out of the abandoned sweep.
 */
export async function postMessage(input: PostMessageInput): Promise<ChatMessageRecord> {
  return transaction(async (client) => {
    const inserted = await client.query<MessageRow>(
      `INSERT INTO chat_messages
         (chat_session_id, sender, sender_user_id, body_original, language_original,
          body_translated, language_translated, translation_engine, translation_error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::text, sender, sender_user_id, body_original, language_original,
                 body_translated, language_translated, translation_error, created_at`,
      [
        input.chatId,
        input.sender,
        input.senderUserId ?? null,
        input.body,
        input.language,
        input.translated?.body ?? null,
        input.translated?.language ?? null,
        input.translated?.engine ?? null,
        input.translationError ?? null,
      ],
    );

    await client.query(
      `UPDATE chat_sessions SET last_activity_at = now() WHERE id = $1`,
      [input.chatId],
    );

    return toMessage(inserted.rows[0]!);
  });
}

/** Messages in a conversation, oldest first. `afterId` supports the stream. */
export async function messagesFor(
  chatId: string,
  afterId?: string,
): Promise<ChatMessageRecord[]> {
  const rows = await query<MessageRow>(
    `SELECT id::text, sender, sender_user_id, body_original, language_original,
            body_translated, language_translated, translation_error, created_at
       FROM chat_messages
      WHERE chat_session_id = $1
        AND ($2::bigint IS NULL OR id > $2::bigint)
      ORDER BY id ASC`,
    [chatId, afterId ?? null],
  );
  return rows.map(toMessage);
}

/**
 * Ends a conversation and notifies operations.
 *
 * THE NOTIFICATION CARRIES NO MESSAGE CONTENT. It says a transcript exists and
 * where to read it. `sendMail` would refuse a body containing clinical
 * vocabulary anyway, but the more important reason is the one in the plan: an
 * emailed transcript cannot be deleted on the retention schedule, audited for
 * who read it, or stopped from being forwarded.
 */
export async function closeChat(
  chatId: string,
  reason: string,
  actorUserId?: string | null,
): Promise<void> {
  const row = await queryOne<SessionRow>(
    `UPDATE chat_sessions
        SET status = 'closed', closed_at = now(), close_reason = $2
      WHERE id = $1 AND status IN ('queued', 'active')
      RETURNING *`,
    [chatId, reason],
  );

  if (row === undefined) return;

  const counted = await queryOne<{ count: string }>(
    'SELECT count(*)::text AS count FROM chat_messages WHERE chat_session_id = $1',
    [chatId],
  );

  await audit({
    actorUserId: actorUserId ?? null,
    action: 'chat.closed',
    targetType: 'chat',
    targetId: chatId,
    detail: { reason, messages: Number(counted?.count ?? 0) },
  });

  const minutes = Math.max(
    1,
    Math.round((Date.now() - row.started_at.getTime()) / 60_000),
  );

  await sendMail({
    subject: `Chat transcript ready ${row.public_ref}`,
    body: [
      `A website chat has ended and its transcript is available in the console.`,
      ``,
      `Reference: ${row.public_ref}`,
      `Started:   ${row.started_at.toISOString()}`,
      `Duration:  about ${minutes} minute(s)`,
      `Messages:  ${counted?.count ?? '0'}`,
      `Enquirer:  ${row.intake.role}`,
      `Language:  ${row.visitor_language}`,
      ``,
      `Read it here: ${SITE.url}/coordinator/chats/${row.id}`,
      ``,
      `The conversation itself is not included in this email, by design. It`,
      `stays in the console where access is controlled, reads are recorded, and`,
      `the retention schedule can delete it.`,
    ].join('\n'),
  });
}

/**
 * Housekeeping sweep.
 *
 * Two jobs in one pass, both of which must actually run on a schedule rather
 * than existing as good intentions:
 *
 *   Abandon conversations nobody joined and nobody is in, so the queue reflects
 *   reality rather than every browser tab ever closed.
 *
 *   Delete transcripts past their retention date. This is the mechanism that
 *   makes the retention promise true, and it is also what makes "purge
 *   everything if the BAA falls through" a single statement rather than a
 *   project.
 */
export async function sweepChats(): Promise<{ abandoned: number; deleted: number }> {
  const abandoned = await query(
    `UPDATE chat_sessions
        SET status = 'abandoned', closed_at = now(), close_reason = 'inactive'
      WHERE status IN ('intake', 'queued')
        AND last_activity_at < now() - ($1 || ' minutes')::interval
      RETURNING id`,
    [String(ABANDON_AFTER_MINUTES)],
  );

  const deleted = await query(
    `DELETE FROM chat_sessions WHERE delete_after < now() RETURNING id`,
  );

  if (deleted.length > 0) {
    await audit({
      action: 'chat.retention_deleted',
      detail: { count: deleted.length, retentionDays: RETENTION_DAYS },
    });
  }

  return { abandoned: abandoned.length, deleted: deleted.length };
}
