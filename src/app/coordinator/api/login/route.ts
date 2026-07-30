import { NextResponse, type NextRequest } from 'next/server';

import { authenticate } from '@/server/auth/users';
import { issueSession } from '@/server/auth/sessions';
import { csrfValid, setSessionCookie, CSRF_FIELD } from '@/server/auth/guard';
import { consume } from '@/lib/rate-limit';
import { coarsenIp, safeLog } from '@/lib/redact';
import { heartbeat } from '@/server/chat/presence';
import { publish } from '@/server/chat/events';
import { audit } from '@/server/audit';
import { seeOther } from '@/server/http/redirect';

/**
 * Sign-in endpoint.
 *
 * TWO RATE LIMITS, DOING DIFFERENT JOBS. `authenticate` counts failures per
 * user and locks that account; this route counts attempts per IP. Neither is
 * sufficient alone: the per-user counter never trips for an attacker spraying
 * one common password across many accounts, and the per-IP counter never trips
 * for a distributed attack on one account. Together they cover both shapes.
 *
 * The IP limiter runs BEFORE the password is verified, so an attacker cannot
 * make the server perform scrypt work by flooding it. That is a denial of
 * service vector specific to deliberately-slow password hashing.
 *
 * Redirects rather than returns JSON, because the form works without
 * JavaScript. Errors travel as a search parameter and the message lookup lives
 * on the page, so this handler never puts a user-supplied string in a URL.
 */

export const dynamic = 'force-dynamic';

function back(error: string): NextResponse {
  // 303 turns the POST into a GET, so a refresh on the error page does not
  // resubmit the credentials.
  return seeOther('/coordinator', { error });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();

  if (!(await csrfValid(form.get(CSRF_FIELD)))) {
    return back('csrf');
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? null;
  const bucket = coarsenIp(ip);

  const limit = await consume('adminLoginFailure', bucket);
  if (!limit.allowed) {
    await audit({ action: 'auth.rate_limited', detail: { scope: 'login' }, ipHash: ip });
    return back('ratelimited');
  }

  const email = form.get('email');
  const password = form.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return back('invalid');
  }

  let result: Awaited<ReturnType<typeof authenticate>>;
  let session: Awaited<ReturnType<typeof issueSession>>;
  try {
    result = await authenticate(email, password, { ip });
    if (!result.ok) {
      return back(result.reason);
    }

    session = await issueSession(result.user.id, {
      ip,
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    /*
     * The database is unreachable. Without this the form answered 500, which
     * tells a coordinator nothing and looks identical to a bug in their own
     * credentials. `unavailable` says the console is down rather than implying
     * they typed something wrong, and it must never be reported as `invalid`:
     * sending someone to re-check a correct password during a live case is a
     * worse failure than admitting the outage.
     */
    safeLog('error', 'auth.database_unavailable', { error: (error as Error).name });
    return back('unavailable');
  }

  await setSessionCookie(session.token, session.absoluteExpiresAt);

  /*
   * COORDINATORS ARE AVAILABLE ON SIGN-IN. AirEvac staffs the desk around the
   * clock, so a coordinator signing in is a coordinator starting a shift, and
   * making them click a second switch afterwards only creates a state where
   * somebody is at the desk and the site says nobody is.
   *
   * Admins are not, deliberately. An administrator signing in to add a user or
   * read the audit log is doing desk work, and putting them in the queue for it
   * would hand a conversation to someone who is not watching for one.
   *
   * This only opens the window. The console renews it while it stays open, so
   * closing the laptop still lapses within a minute: the heartbeat remains the
   * thing that decides whether somebody is really there.
   *
   * Never fatal. Being signed in matters more than being marked available, and
   * a presence write that fails must not cost someone their sign-in.
   */
  if (result.user.role === 'coordinator') {
    try {
      await heartbeat(result.user.id, true);
      publish({ kind: 'queue' });
    } catch (error) {
      safeLog('error', 'presence.auto_available_failed', { error: (error as Error).name });
    }
  }

  /*
   * A user who must change their password lands on the password page and
   * nothing else; `requireUser` enforces that on every other route. This is
   * what makes the seeded admin/admin credential safe to exist.
   */
  const destination = result.user.mustChangePassword
    ? '/coordinator/password'
    : '/coordinator/console';

  return seeOther(destination);
}
