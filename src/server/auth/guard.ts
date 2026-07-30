import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveSession, revokeSession, SESSION_COOKIE, type SessionUser } from '@/server/auth/sessions';

/**
 * Session cookies, CSRF, and the route guards the console is built on.
 *
 * COOKIE FLAGS, AND WHY EACH ONE. `httpOnly` keeps the token out of reach of
 * any script, so an XSS bug cannot exfiltrate a live session. `secure` stops it
 * traversing plain HTTP. `sameSite: 'strict'` is the important one here: it
 * means the browser never attaches this cookie to a request originating from
 * another site, which removes the entire class of cross-site request forgery
 * before the token check below even runs. Strict is usable precisely because
 * nothing links into the console from elsewhere.
 *
 * The CSRF token is belt to that braces. `sameSite` is enforced by the browser,
 * and a browser old enough or configured oddly enough to ignore it should not
 * be the only thing standing between a coordinator and an attacker.
 */

const CSRF_COOKIE = 'aei_csrf';
export const CSRF_FIELD = 'csrf_token';

/** Reads the caller's IP as the proxy reports it. Hashed before storage. */
export async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return {
    // Left-most entry is the client; the rest are proxies. This is only ever
    // used hashed, and the edge must strip inbound X-Forwarded-For (ADR 0003).
    ip: forwarded?.split(',')[0]?.trim() ?? null,
    userAgent: headerList.get('user-agent'),
  };
}

export async function setSessionCookie(token: string, absoluteExpiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/coordinator',
    expires: absoluteExpiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token !== undefined) await revokeSession(token);
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

/**
 * Returns the signed-in user, or null.
 *
 * Never throws and never distinguishes failure modes: an absent cookie, a
 * revoked session, an expired one, and a since-disabled account all return
 * null. The caller has no legitimate use for the difference.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return resolveSession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Reads the CSRF token for this browser.
 *
 * READ ONLY. The cookie is issued by the proxy (src/proxy.ts), because Next
 * permits cookie writes only from a Server Action or a Route Handler and this
 * is called while rendering a page. Returning an empty string when the cookie
 * is somehow absent is deliberate: the form then submits a token that cannot
 * match, and the POST is rejected. Failing closed on a missing token is the
 * correct direction to fail.
 *
 * Double-submit: the value lives in a cookie and in a hidden form field, and an
 * attacker on another origin can set neither. The cookie is script-readable by
 * design, since it carries no authority on its own.
 */
export async function csrfToken(): Promise<string> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? '';
}

/** Constant-time comparison of the submitted token against the cookie. */
export async function csrfValid(submitted: FormDataEntryValue | null): Promise<boolean> {
  if (typeof submitted !== 'string' || submitted === '') return false;

  const store = await cookies();
  const expected = store.get(CSRF_COOKIE)?.value;
  if (expected === undefined || expected === '') return false;

  const a = createHash('sha256').update(submitted).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Guards a console page.
 *
 * Redirects rather than 404s, because the person hitting it is staff who let a
 * session lapse, not an attacker probing for a hidden route: the path is
 * already `noindex` and disallowed, so hiding its existence buys nothing while
 * a confusing 404 costs a coordinator time.
 *
 * The `mustChangePassword` branch is what makes the bootstrap admin password
 * safe. A user in that state is routed to the password page from every other
 * page, so the seeded `admin`/`admin` credential can reach exactly one screen.
 */
export async function requireUser(options: { allowPasswordChange?: boolean } = {}): Promise<SessionUser> {
  const user = await currentUser();
  if (user === null) redirect('/coordinator');

  if (user.mustChangePassword && options.allowPasswordChange !== true) {
    redirect('/coordinator/password');
  }

  return user;
}

/** Guards an admin-only page. Coordinators are sent to the console, not a 403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/coordinator/console');
  return user;
}
