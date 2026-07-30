import { NextResponse, type NextRequest } from 'next/server';

import { currentUser } from '@/server/auth/guard';
import { goOffline, heartbeat, renewIfAvailable } from '@/server/chat/presence';
import { publish } from '@/server/chat/events';

/**
 * Presence heartbeat.
 *
 * Called by the open console every 30 seconds while a coordinator is marked
 * available. Anything that stops calling reads as offline within one window,
 * which is the entire point: a closed laptop sends no goodbye, and a visitor
 * must never be offered a chat nobody is watching.
 *
 * No CSRF token. This is idempotent, carries no data, and changes nothing an
 * attacker would want changed: the worst a forged request achieves is keeping
 * an already-signed-in coordinator marked available, which they are.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    available?: unknown;
    renew?: unknown;
  };

  /*
   * A renew extends an existing window and cannot open one. The console now
   * beats from every page rather than only the chat queue, so that a
   * coordinator marked available on sign-in does not lapse while sitting on the
   * user list. That renew fires wherever they are, and must therefore never be
   * able to *make* somebody available: only the toggle below, or signing in as
   * a coordinator, does that.
   */
  if (body.renew === true) {
    const stillAvailable = await renewIfAvailable(user.id);
    return NextResponse.json({ available: stillAvailable });
  }

  const available = body.available === true;

  if (available) {
    await heartbeat(user.id, true);
  } else {
    await goOffline(user.id);
  }

  // Tells any waiting visitor's widget that availability may have changed.
  publish({ kind: 'queue' });

  return NextResponse.json({ available });
}
