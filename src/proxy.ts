import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';

/**
 * Blueprint page 16, XSS and browser controls:
 *   "Context encoding, strict CSP with nonces or hashes, Trusted Types where
 *    supported, no unsafe inline scripts, secure MIME types."
 *
 * WHY A NONCE AND NOT A HASH — see docs/adr/0004-security-headers.md.
 * Next.js emits inline bootstrap scripts whose content changes with every build
 * and with every streamed RSC payload, so a build-time hash allowlist is not
 * stable. A per-response nonce is the supported mechanism. The cost is that HTML
 * is rendered per request rather than served from the CDN's HTML cache; static
 * assets under /_next/static are still immutably cached, which is where the
 * Core Web Vitals budget on page 21 is actually won.
 *
 * `strict-dynamic` means the nonce propagates to scripts Next loads at runtime
 * without having to enumerate them, and it makes host allowlists inert — which
 * is intended: section 13 forbids third-party advertising and analytics code
 * outright, so there is no host to allow.
 */

const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|webmanifest|woff2?)$/i;

function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // 'unsafe-eval' is required only by the development refresh runtime and is
    // never present in a production response.
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],

    // Next injects a small inline <style> for streamed CSS. `unsafe-inline` is
    // ignored by browsers when a nonce is present in the same directive, so this
    // does not weaken script protection; styles carry no script capability.
    'style-src': ["'self'", `'nonce-${nonce}'`, "'unsafe-inline'"],

    // data: is needed for inline SVG data URIs used by the icon set.
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],

    // Same-origin only. Section 8: no advertising trackers in the public layer,
    // and the secure contact layer is a separately controlled origin that the
    // public pages link to rather than call from the browser.
    'connect-src': ["'self'"],

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

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // --- Locale prefix -----------------------------------------------------
  // Every page lives under /en or /es. Section 3 makes English canonical, so an
  // unprefixed URL redirects to English rather than guessing from Accept-Language:
  // a coordinator pasting a link into a hospital's chat must be able to predict
  // which language opens. Visitors switch explicitly via the header control.
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale && !pathname.startsWith('/api') && !PUBLIC_FILE.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
    // 308 preserves the method and is cacheable — section 3 requires permanent
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
