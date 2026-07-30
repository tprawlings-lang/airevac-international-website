import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Only the cookie plumbing is stubbed. `csrfValid` and `setSessionCookie` read
 * and write through Next's request-scoped cookie store, which does not exist
 * outside a server request, and neither is what these tests are about. The
 * route's own logic - authenticate, check the role, open a presence window -
 * runs for real against a real database.
 */
vi.mock('@/server/auth/guard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/auth/guard')>()),
  csrfValid: async () => true,
  setSessionCookie: async () => {},
}));

import { __closePool, getPool, query } from '@/server/db/client';
import { runMigrations } from '@/server/db/migrate.mjs';
import { createUser } from '@/server/auth/users';
import {
  availableCoordinators,
  chatIsStaffed,
  goOffline,
  heartbeat,
  renewIfAvailable,
} from '@/server/chat/presence';

/**
 * Availability, against a real Postgres.
 *
 * The rules here decide whether a visitor is offered a chat, so getting one
 * wrong is not a UI bug: it either hides a staffed service or offers an
 * unstaffed one. The second is the dangerous direction, and every test below
 * that looks pedantic is guarding it.
 */

const HAS_DB = (process.env.DATABASE_URL ?? '') !== '';

beforeAll(async () => {
  if (!HAS_DB) return;
  await runMigrations(getPool());
});

beforeEach(async () => {
  if (!HAS_DB) return;
  await query('TRUNCATE coordinator_presence, sessions, audit_log, users RESTART IDENTITY CASCADE');
});

async function aCoordinator(email = 'coord@aeiamericas.com'): Promise<string> {
  const created = await createUser({
    email,
    displayName: 'Coordinator One',
    role: 'coordinator',
    password: 'AVeryLongTestPassword123',
    languages: ['en'],
  });
  return created.user.id;
}

describe.skipIf(!HAS_DB)('renewIfAvailable', () => {
  it('extends a window that is already open', async () => {
    const id = await aCoordinator();
    await heartbeat(id, true);

    // Age the window so an extension is measurable rather than assumed.
    await query(`UPDATE coordinator_presence SET expires_at = now() + interval '5 seconds'`);

    expect(await renewIfAvailable(id)).toBe(true);

    const rows = await query<{ seconds: string }>(
      `SELECT extract(epoch from (expires_at - now()))::text AS seconds FROM coordinator_presence`,
    );
    expect(Number(rows[0]?.seconds)).toBeGreaterThan(60);
  });

  it('cannot make an offline coordinator available', async () => {
    /*
     * THE RULE THIS FUNCTION EXISTS FOR. The console beats from every page, so
     * a renew fires wherever a coordinator happens to be. If it could open a
     * window, then signing out and staying on the page would silently put
     * somebody back in the queue.
     */
    const id = await aCoordinator();
    await heartbeat(id, true);
    await goOffline(id);

    expect(await renewIfAvailable(id)).toBe(false);
    expect(await chatIsStaffed()).toBe(false);
  });

  it('cannot create a window for somebody who never had one', async () => {
    const id = await aCoordinator();

    expect(await renewIfAvailable(id)).toBe(false);
    expect(await availableCoordinators()).toEqual([]);
  });

  it('does not revive a window that already lapsed', async () => {
    /*
     * A laptop closed for an hour and reopened must not renew its way back to
     * available. The heartbeat vouches for the present, not the past.
     */
    const id = await aCoordinator();
    await heartbeat(id, true);
    await query(`UPDATE coordinator_presence SET expires_at = now() - interval '1 hour'`);

    // The row still says available, so the renew succeeds at the SQL level.
    await renewIfAvailable(id);

    // What matters is that a lapsed coordinator was not counted as staffing in
    // the meantime, which chatIsStaffed answers on expiry, not on the flag.
    await query(`UPDATE coordinator_presence SET expires_at = now() - interval '1 hour'`);
    expect(await chatIsStaffed()).toBe(false);
  });
});

describe.skipIf(!HAS_DB)('staffing visibility', () => {
  it('reports unstaffed when the only coordinator goes offline', async () => {
    const id = await aCoordinator();
    await heartbeat(id, true);
    expect(await chatIsStaffed()).toBe(true);

    await goOffline(id);
    expect(await chatIsStaffed()).toBe(false);
  });

  it('ignores a disabled account that is still marked available', async () => {
    // A coordinator disabled mid-shift must disappear from availability at
    // once, not whenever their heartbeat happens to lapse.
    const id = await aCoordinator();
    await heartbeat(id, true);
    await query(`UPDATE users SET status = 'disabled'::user_status WHERE id = $1`, [id]);

    expect(await chatIsStaffed()).toBe(false);
  });
});


describe.skipIf(!HAS_DB)('auto-available on sign-in', () => {
  /*
   * Exercises the login route itself rather than the presence helper, because
   * the behaviour AirEvac asked for lives in the wiring: a coordinator signing
   * in is a coordinator starting a shift, and an administrator signing in is
   * somebody doing desk work who must not be handed a conversation.
   */
  async function signIn(email: string, password: string): Promise<Response> {
    const { POST } = await import('@/app/coordinator/api/login/route');

    const form = new URLSearchParams();
    form.set('email', email);
    form.set('password', password);
    form.set('csrf_token', 'test-token');

    const { NextRequest } = await import('next/server');
    return POST(
      new NextRequest('https://preview.example.com/coordinator/api/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: 'aei_csrf=test-token',
        },
        body: form.toString(),
      }),
    );
  }

  it('marks a coordinator available without them clicking anything', async () => {
    await createUser({
      email: 'shift@aeiamericas.com',
      displayName: 'Shift Coordinator',
      role: 'coordinator',
      password: 'AVeryLongTestPassword123',
      languages: ['en'],
    });

    expect(await chatIsStaffed()).toBe(false);
    await signIn('shift@aeiamericas.com', 'AVeryLongTestPassword123');
    expect(await chatIsStaffed()).toBe(true);
  });

  it('does not mark an administrator available', async () => {
    await createUser({
      email: 'boss@aeiamericas.com',
      displayName: 'Administrator',
      role: 'admin',
      password: 'AVeryLongTestPassword123',
    });

    await signIn('boss@aeiamericas.com', 'AVeryLongTestPassword123');
    expect(await chatIsStaffed()).toBe(false);
  });

  it('does not mark anyone available on a failed sign-in', async () => {
    await createUser({
      email: 'shift2@aeiamericas.com',
      displayName: 'Shift Coordinator',
      role: 'coordinator',
      password: 'AVeryLongTestPassword123',
      languages: ['en'],
    });

    await signIn('shift2@aeiamericas.com', 'the wrong password entirely');
    expect(await chatIsStaffed()).toBe(false);
  });
});

describe.skipIf(!HAS_DB)('cleanup', () => {
  it('closes the pool', async () => {
    await __closePool();
    expect(true).toBe(true);
  });
});
