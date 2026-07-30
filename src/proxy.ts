import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';

/**
 * Blueprint page 16, XSS and browser controls:
 *   "Context encoding, strict CSP with nonces or hashes, Trusted Types where
 *    supported, no unsafe inline scripts, secure MIME types."
 *
 * WHY A NONCE AND NOT A HASH - see docs/adr/0004-security-headers.md.
 * Next.js emits inline bootstrap scripts whose content changes with every build
 * and with every streamed RSC payload, so a build-time hash allowlist is not
 * stable. A per-response nonce is the supported mechanism. The cost is that HTML
 * is rendered per request rather than served from the CDN's HTML cache; static
 * assets under /_next/static are still immutably cached, which is where the
 * Core Web Vitals budget on page 21 is actually won.
 *
 * `strict-dynamic` means the nonce propagates to scripts Next loads at runtime
 * without having to enumerate them, and it makes host allowlists inert - which
 * is intended: section 13 forbids third-party advertising and analytics code
 * outright, so there is no host to allow.
 */

/** Name shared with src/server/auth/guard.ts, which reads and verifies it. */
const CSRF_COOKIE = 'aei_csrf';

const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|webmanifest|woff2?)$/i;

/**
 * Hosts the analytics beacon needs, added to `connect-src` and `img-src` ONLY
 * when a GA4 measurement ID is configured.
 *
 * The relaxation is conditional on purpose. AirEvac approved analytics
 * (decision A2), but approval is not a reason to widen the policy on a
 * deployment that is not actually running analytics: a preview build, or
 * production before the measurement ID is supplied, keeps the strict policy it
 * has today. The allowance appears the moment the ID does and not before.
 *
 * `script-src` is untouched. The GTM loader is a nonced script and
 * 'strict-dynamic' lets it load its own dependencies, so no script host needs
 * listing. Trust flows from the nonce rather than from a hostname allowlist,
 * which is the stronger arrangement and the reason it was built this way.
 */
const ANALYTICS_HOSTS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://analytics.google.com',
  'https://region1.google-analytics.com',
];

function buildCsp(nonce: string, isDev: boolean): string {
  const analyticsEnabled = (process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '').length > 0;

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // 'unsafe-eval' is required only by the development refresh runtime and is
    // never present in a production response.
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],

    // Next injects a small inline <style> for streamed CSS. `unsafe-inline` is
    // ignored by browsers when a nonce is present in the same directive, so this
    // does not weaken script protection; styles carry no script capability.
    'style-src': ["'self'", `'nonce-${nonce}'`, "'unsafe-inline'"],

    // data: is needed for inline SVG data URIs used by the icon set. GA4 falls
    // back to an image beacon in some browsers, hence the same conditional.
    'img-src': ["'self'", 'data:', 'blob:', ...(analyticsEnabled ? ANALYTICS_HOSTS : [])],
    'font-src': ["'self'"],

    // Same-origin only, plus the analytics beacon when and only when a
    // measurement ID is configured. Section 8 forbids advertising trackers in
    // the public layer, and nothing here permits one: these hosts carry the
    // GA4 event beacon and no ad network.
    'connect-src': ["'self'", ...(analyticsEnabled ? ANALYTICS_HOSTS : [])],

    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([directive, values]) => (values.length > 0 ? `${directive} ${values.join(' ')}` : directive))
    .join('; ');
}

/**
 * Constant-time string comparison.
 *
 * `crypto.timingSafeEqual` is Node-only and this runs in the edge runtime, so
 * the comparison is written out. A plain `===` on a credential leaks its length
 * and its matching prefix through response timing.
 */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);

  // Compare a fixed number of bytes regardless of input length.
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Optional HTTP Basic auth for non-production deploys.
 *
 * ===================== WHY THIS EXISTS =====================
 * A hosted preview of this site looks like the live AirEvac site and carries the
 * real 24/7 coordinator phone number - while the legal pages are unapproved
 * drafts (D10) and the callback form does not reach a coordinator (D7/D8/D9).
 *
 * A link that escapes to a hospital, a partner, or a family is exactly the harm
 * the blueprint's launch rule exists to prevent. So a preview gets a lock.
 *
 * Set PREVIEW_USERNAME and PREVIEW_PASSWORD to enable. Leave them unset in
 * production, where the site is meant to be public.
 *
 * This is preview-gating, NOT an application authentication system. Blueprint
 * page 16 requires SSO with phishing-resistant MFA for anything privileged;
 * Basic auth over TLS is appropriate only for keeping an unfinished marketing
 * site off the open web.
 */
function previewAuthFailed(request: NextRequest): boolean {
  const username = process.env.PREVIEW_USERNAME;
  const password = process.env.PREVIEW_PASSWORD;

  // Disabled unless both are set.
  if (!username || !password) return false;

  const header = request.headers.get('authorization');
  if (header === null || !header.startsWith('Basic ')) return true;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return true;
  }

  // Split on the FIRST colon only - a password may legitimately contain one.
  const separator = decoded.indexOf(':');
  if (separator === -1) return true;

  const givenUser = decoded.slice(0, separator);
  const givenPassword = decoded.slice(separator + 1);

  // Both comparisons always run, so a wrong username and a wrong password cost
  // the same time.
  const userOk = safeEqual(givenUser, username);
  const passwordOk = safeEqual(givenPassword, password);
  return !(userOk && passwordOk);
}

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // --- Preview lock ------------------------------------------------------
  // `/healthz` is exempt so the host's health check does not see a 401 and
  // restart the service in a loop. It returns no site content.
  if (pathname !== '/healthz' && previewAuthFailed(request)) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="AirEvac preview", charset="UTF-8"',
        'Cache-Control': 'no-store',
        // A locked preview must never be indexed even if a crawler is given
        // credentials by some intermediary.
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  // --- Locale prefix -----------------------------------------------------
  // Every page lives under /en or /es. Section 3 makes English canonical, so an
  // unprefixed URL redirects to English rather than guessing from Accept-Language:
  // a coordinator pasting a link into a hospital's chat must be able to predict
  // which language opens. Visitors switch explicitly via the header control.
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (
    !hasLocale &&
    !pathname.startsWith('/api') &&
    // /healthz is infrastructure, not content. Redirecting it to /en/healthz
    // sends the host's uptime probe to a 404 and the service flaps.
    pathname !== '/healthz' &&
    // The coordinator console is staff software, not published content. It has
    // no Spanish edition to route between, and a locale prefix on it would put
    // a login form inside the public URL space the sitemap and hreflang
    // describe. It is `noindex` and disallowed in robots.txt for the same
    // reason: it is not part of the website's audience.
    pathname !== '/coordinator' &&
    !pathname.startsWith('/coordinator/') &&
    // Covers /llms.txt and /indexnow-key.txt, which external systems fetch by
    // exact URL and which a locale prefix would break.
    !PUBLIC_FILE.test(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
    // 308 preserves the method and is cacheable - section 3 requires permanent
    // redirects with no chains.
    return NextResponse.redirect(url, 308);
  }

  // --- CSP ---------------------------------------------------------------
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  // Next reads this header to stamp the nonce onto the scripts it emits, and
  // `headers()` exposes it to components that need it for their own tags.
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);

  /*
   * CSRF token for the coordinator console.
   *
   * ISSUED HERE BECAUSE A PAGE CANNOT DO IT. Next permits cookie writes only
   * from a Server Action or a Route Handler, so a server component rendering
   * the login form cannot mint its own token. Middleware runs before the page
   * and can set cookies on the response, which makes this the one place the
   * token can be established for a form that is rendered, not fetched.
   *
   * The value carries no authority on its own: it is half of a double-submit
   * pair, and an attacker on another origin can set neither half. `sameSite:
   * strict` is the primary defence and this is the backstop.
   */
  if (pathname === '/coordinator' || pathname.startsWith('/coordinator/')) {
    if (request.cookies.get(CSRF_COOKIE) === undefined) {
      response.cookies.set(CSRF_COOKIE, crypto.randomUUID().replace(/-/g, ''), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        // Scoped to the console, matching the session cookie. The endpoints
        // live at /coordinator/api/* rather than /api/coordinator/* precisely
        // so that both cookies can be path-scoped this tightly: a session
        // cookie on '/' would ride along with every public marketing request
        // for no benefit.
        path: '/coordinator',
      });
    }
  }

  return response;
}

export const config = {
  /**
   * Skip Next's own static output and image optimiser. Those responses carry no
   * HTML and no script context, and running middleware on them would add
   * per-asset latency against the performance budget on page 21.
   */
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
