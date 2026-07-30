import { NextResponse, type NextRequest } from 'next/server';

import { currentUser } from '@/server/auth/guard';
import { goOffline, heartbeat } from '@/server/chat/presence';
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

  const body = (await request.json().catch(() => ({}))) as { available?: unknown };
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
