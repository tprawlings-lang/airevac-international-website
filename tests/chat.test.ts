import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { __closePool, getPool, query } from '@/server/db/client';
import { runMigrations } from '@/server/db/migrate.mjs';
import { createUser } from '@/server/auth/users';
import {
  availableCoordinators,
  chatIsStaffed,
  goOffline,
  hasCoordinatorForLanguage,
  heartbeat,
} from '@/server/chat/presence';
import {
  claimChat,
  closeChat,
  findByVisitorToken,
  messagesFor,
  postMessage,
  queuedChats,
  startChat,
  sweepChats,
  type ChatIntake,
} from '@/server/chat/sessions';

const HAS_DB = (process.env.DATABASE_URL ?? '') !== '';

const INTAKE: ChatIntake = {
  role: 'hospital',
  contactName: 'Ana Ruiz',
  phone: '+52 998 555 0100',
  originCity: 'Cancun',
  destinationCity: 'Miami',
  timeframe: 'within 24 hours',
  preferredLanguage: 'es',
};

beforeAll(async () => {
  if (!HAS_DB) return;
  await runMigrations(getPool());
});

beforeEach(async () => {
  if (!HAS_DB) return;
  await query(
    'TRUNCATE chat_messages, chat_sessions, coordinator_presence, sessions, audit_log, users RESTART IDENTITY CASCADE',
  );
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(async () => {
  if (!HAS_DB) return;
  await __closePool();
});

async function makeCoordinator(email: string, languages: string[]) {
  const { user } = await createUser({
    email,
    displayName: 'Test Coordinator',
    role: 'coordinator',
    languages,
  });
  return user;
}

describe.runIf(HAS_DB)('coordinator presence', () => {
  it('reports nobody staffed when no heartbeat has arrived', async () => {
    // The state that matters most: if this is ever wrong in the optimistic
    // direction, a visitor waits on a chat instead of calling a staffed line.
    expect(await chatIsStaffed()).toBe(false);
  });

  it('reports staffed after a heartbeat', async () => {
    const user = await makeCoordinator('c1@aeiamericas.com', ['en']);
    await heartbeat(user.id, true);
    expect(await chatIsStaffed()).toBe(true);
  });

  it('treats a lapsed heartbeat as offline', async () => {
    // A closed laptop sends no goodbye. Availability has to expire on its own.
    const user = await makeCoordinator('c1@aeiamericas.com', ['en']);
    await heartbeat(user.id, true);
    await query("UPDATE coordinator_presence SET expires_at = now() - interval '1 second'");
    expect(await chatIsStaffed()).toBe(false);
  });

  it('drops a coordinator disabled mid-shift immediately', async () => {
    const user = await makeCoordinator('c1@aeiamericas.com', ['en']);
    await heartbeat(user.id, true);
    await query("UPDATE users SET status = 'disabled' WHERE id = $1", [user.id]);

    // Not when their heartbeat happens to lapse. Now.
    expect(await chatIsStaffed()).toBe(false);
    expect(await availableCoordinators()).toEqual([]);
  });

  it('honours an explicit sign-off', async () => {
    const user = await makeCoordinator('c1@aeiamericas.com', ['en']);
    await heartbeat(user.id, true);
    await goOffline(user.id);
    expect(await chatIsStaffed()).toBe(false);
  });

  it('knows which languages are actually covered right now', async () => {
    const english = await makeCoordinator('en@aeiamericas.com', ['en']);
    await heartbeat(english.id, true);

    expect(await hasCoordinatorForLanguage('en')).toBe(true);
    // Nobody Spanish-speaking is on, so a Spanish visitor will need
    // translation. Saying otherwise would misrepresent the service.
    expect(await hasCoordinatorForLanguage('es')).toBe(false);

    const spanish = await makeCoordinator('es@aeiamericas.com', ['en', 'es']);
    await heartbeat(spanish.id, true);
    expect(await hasCoordinatorForLanguage('es')).toBe(true);
  });
});

describe.runIf(HAS_DB)('chat sessions', () => {
  it('queues a new chat and returns a token that is not stored in the clear', async () => {
    const { record, visitorToken } = await startChat(INTAKE);
    expect(record.status).toBe('queued');
    expect(record.publicRef).toMatch(/^AE-\d{8}-[0-9A-F]{6}$/);

    const rows = await query<{ visitor_token_hash: string }>(
      'SELECT visitor_token_hash FROM chat_sessions',
    );
    expect(rows[0]?.visitor_token_hash).not.toBe(visitorToken);
    expect(rows[0]?.visitor_token_hash).toHaveLength(64);
  });

  it('resolves a visitor by their token and nobody else', async () => {
    const { record, visitorToken } = await startChat(INTAKE);
    expect((await findByVisitorToken(visitorToken))?.id).toBe(record.id);
    expect(await findByVisitorToken('someone-elses-token')).toBeUndefined();
    expect(await findByVisitorToken('')).toBeUndefined();
  });

  it('lets exactly one coordinator claim a chat', async () => {
    /*
     * Two coordinators clicking the same conversation in the same second is
     * the ordinary case on a small team, not an edge case. The claim filters
     * on status inside the UPDATE, so the database decides the winner.
     */
    const a = await makeCoordinator('a@aeiamericas.com', ['en']);
    const b = await makeCoordinator('b@aeiamericas.com', ['en']);
    const { record } = await startChat(INTAKE);

    const [first, second] = await Promise.all([
      claimChat(record.id, a.id),
      claimChat(record.id, b.id),
    ]);

    const winners = [first, second].filter((result) => result !== undefined);
    expect(winners).toHaveLength(1);
    expect(winners[0]!.status).toBe('active');
  });

  it('removes a claimed chat from the queue', async () => {
    const user = await makeCoordinator('a@aeiamericas.com', ['en']);
    const { record } = await startChat(INTAKE);
    expect(await queuedChats()).toHaveLength(1);

    await claimChat(record.id, user.id);
    expect(await queuedChats()).toHaveLength(0);
  });

  it('keeps the original message text alongside its translation', async () => {
    // A mistranslated clinical detail can change a decision. Overwriting the
    // original would remove the only means anyone has of catching it.
    const { record } = await startChat(INTAKE);
    await postMessage({
      chatId: record.id,
      sender: 'visitor',
      body: 'mi madre se cayo',
      language: 'es',
      translated: { body: 'my mother fell', language: 'en', engine: 'test' },
    });

    const messages = await messagesFor(record.id);
    expect(messages[0]?.bodyOriginal).toBe('mi madre se cayo');
    expect(messages[0]?.bodyTranslated).toBe('my mother fell');
  });

  it('records a translation failure rather than dropping the message', async () => {
    const { record } = await startChat(INTAKE);
    await postMessage({
      chatId: record.id,
      sender: 'visitor',
      body: 'hola',
      language: 'es',
      translationError: 'engine unavailable',
    });

    const messages = await messagesFor(record.id);
    expect(messages[0]?.bodyOriginal).toBe('hola');
    expect(messages[0]?.translationError).toBe('engine unavailable');
  });

  it('streams only messages after a given id', async () => {
    const { record } = await startChat(INTAKE);
    const first = await postMessage({
      chatId: record.id, sender: 'visitor', body: 'one', language: 'en',
    });
    await postMessage({ chatId: record.id, sender: 'visitor', body: 'two', language: 'en' });

    const since = await messagesFor(record.id, first.id);
    expect(since).toHaveLength(1);
    expect(since[0]?.bodyOriginal).toBe('two');
  });
});

describe.runIf(HAS_DB)('closing and housekeeping', () => {
  it('notifies without putting any conversation in the email', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    process.env.OPS_NOTIFICATION_EMAIL = 'test@example.com';
    delete process.env.RESEND_API_KEY;

    const { record } = await startChat(INTAKE);
    await postMessage({
      chatId: record.id,
      sender: 'visitor',
      body: 'my son has a fracture and is in the ICU',
      language: 'en',
    });
    await closeChat(record.id, 'coordinator_ended');

    /*
     * Unconfigured mail logs the subject, never the body. What this asserts is
     * that nothing from the conversation reached the notification path at all:
     * had the transcript been included, the PHI guard would have blocked the
     * send outright and the log would say so.
     */
    const logged = info.mock.calls.map((call) => String(call[0])).join(' ');
    expect(logged).toContain('mail.unconfigured_would_send');
    expect(logged).not.toContain('fracture');
    expect(logged).not.toContain('ICU');
    expect(logged).not.toContain('mail.blocked_phi_shape');

    delete process.env.OPS_NOTIFICATION_EMAIL;
  });

  it('closes only an open chat, and only once', async () => {
    const { record } = await startChat(INTAKE);
    await closeChat(record.id, 'first');
    await closeChat(record.id, 'second');

    const rows = await query<{ close_reason: string }>(
      'SELECT close_reason FROM chat_sessions WHERE id = $1',
      [record.id],
    );
    expect(rows[0]?.close_reason).toBe('first');
  });

  it('abandons a queued chat nobody joined', async () => {
    const { record } = await startChat(INTAKE);
    await query("UPDATE chat_sessions SET last_activity_at = now() - interval '2 hours'");

    const result = await sweepChats();
    expect(result.abandoned).toBe(1);

    const rows = await query<{ status: string }>('SELECT status FROM chat_sessions WHERE id = $1', [
      record.id,
    ]);
    expect(rows[0]?.status).toBe('abandoned');
  });

  it('leaves a live conversation alone', async () => {
    const user = await makeCoordinator('a@aeiamericas.com', ['en']);
    const { record } = await startChat(INTAKE);
    await claimChat(record.id, user.id);

    const result = await sweepChats();
    expect(result.abandoned).toBe(0);
  });

  it('deletes transcripts past their retention date, and their messages with them', async () => {
    /*
     * This is the mechanism that makes the retention promise true, and it is
     * also what makes "purge everything if the BAA falls through" one statement
     * rather than a project.
     */
    const { record } = await startChat(INTAKE);
    await postMessage({ chatId: record.id, sender: 'visitor', body: 'hello', language: 'en' });
    await query("UPDATE chat_sessions SET delete_after = now() - interval '1 day'");

    const result = await sweepChats();
    expect(result.deleted).toBe(1);
    expect(await query('SELECT id FROM chat_messages')).toHaveLength(0);
  });

  it('stamps a retention date on every chat at creation', async () => {
    // Set when the row is made, so deletion is a sweep over an index rather
    // than a decision someone has to remember to make later.
    await startChat(INTAKE);
    const rows = await query<{ delete_after: Date }>('SELECT delete_after FROM chat_sessions');
    expect(rows[0]!.delete_after.getTime()).toBeGreaterThan(Date.now());
  });
});
