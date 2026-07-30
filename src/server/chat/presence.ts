import { query, queryOne } from '@/server/db/client';

/**
 * Coordinator presence, and the question the whole chat feature turns on:
 * is anyone actually there?
 *
 * WHY THIS IS A HEARTBEAT AND NOT A FLAG. A coordinator who marks themselves
 * available and then closes their laptop sends nothing. A flag would leave them
 * available forever, the widget would keep offering chat, and a visitor at
 * 03:00 would sit watching a spinner instead of calling the line that is
 * genuinely answered around the clock. On an air ambulance site that is not a
 * cosmetic bug; it is the feature actively causing harm.
 *
 * So availability expires. The open console renews it, and anything that stops
 * renewing reads as offline within one window. Failure mode is "we think nobody
 * is here" rather than "we think someone is", which is the correct direction.
 */

/**
 * How long one heartbeat vouches for a coordinator.
 *
 * Short enough that a closed laptop is noticed before a visitor has typed a
 * second message, long enough that a brief network stall does not drop someone
 * out of a live conversation.
 */
const PRESENCE_TTL_SECONDS = 75;

/**
 * How often the console should renew. Defined in src/lib/chat-constants.ts and
 * re-exported here, because the client component that runs the heartbeat
 * cannot import this module: it would pull the Postgres client into the
 * browser bundle.
 */
export { HEARTBEAT_INTERVAL_SECONDS } from '@/lib/chat-constants';

export interface AvailableCoordinator {
  userId: string;
  displayName: string;
  languages: string[];
}

/** Marks a coordinator available, or renews an existing window. */
export async function heartbeat(userId: string, available: boolean): Promise<void> {
  await query(
    `INSERT INTO coordinator_presence (user_id, available, expires_at, updated_at)
     VALUES ($1, $2, now() + ($3 || ' seconds')::interval, now())
     ON CONFLICT (user_id) DO UPDATE
       SET available  = EXCLUDED.available,
           expires_at = EXCLUDED.expires_at,
           updated_at = now()`,
    [userId, available, String(PRESENCE_TTL_SECONDS)],
  );
}

/** Explicit sign-off. Distinct from letting the window lapse. */
export async function goOffline(userId: string): Promise<void> {
  await query(
    `UPDATE coordinator_presence
        SET available = FALSE, expires_at = now(), updated_at = now()
      WHERE user_id = $1`,
    [userId],
  );
}

/**
 * Coordinators available right now.
 *
 * Joined against `users` and filtered on status, so a coordinator disabled
 * mid-shift disappears from availability immediately rather than when their
 * heartbeat happens to lapse.
 */
export async function availableCoordinators(): Promise<AvailableCoordinator[]> {
  const rows = await query<{ user_id: string; display_name: string; languages: string[] }>(
    `SELECT p.user_id, u.display_name, u.languages
       FROM coordinator_presence p
       JOIN users u ON u.id = p.user_id
      WHERE p.available
        AND p.expires_at > now()
        AND u.status = 'active'`,
  );

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    languages: row.languages,
  }));
}

/**
 * Whether the chat entry point may be offered at all.
 *
 * The public widget calls this before showing anything. When it returns false
 * the widget does not open a chat, does not queue silently, and shows the phone
 * number instead. That copy lives in the component; this function only answers
 * the question.
 */
export async function chatIsStaffed(): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM coordinator_presence p
       JOIN users u ON u.id = p.user_id
      WHERE p.available AND p.expires_at > now() AND u.status = 'active'`,
  );
  return row !== undefined && Number(row.count) > 0;
}

/**
 * Whether anyone available can hold a conversation in this language without
 * machine translation.
 *
 * Used to decide whether translation is engaged, and to tell the visitor
 * honestly which is happening. A Spanish speaker reaching a Spanish-speaking
 * coordinator should not be told their words are being machine translated.
 */
export async function hasCoordinatorForLanguage(language: string): Promise<boolean> {
  const coordinators = await availableCoordinators();
  return coordinators.some((coordinator) => coordinator.languages.includes(language));
}
