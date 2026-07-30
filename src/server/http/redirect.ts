import { NextResponse } from 'next/server';

/**
 * Redirects that survive being behind a proxy.
 *
 * WHAT BROKE. Every console redirect was built with
 * `new URL(path, request.nextUrl.origin)`. On a platform that terminates TLS at
 * an edge proxy and forwards to the application on an internal port, that
 * origin is the internal address. A coordinator signing in was sent to
 * `https://localhost:10000/coordinator/password`, their browser went nowhere,
 * and the symptom was "I type my password and nothing happens" with a 303 and a
 * valid session cookie in the logs to say it had worked.
 *
 * WHY RELATIVE RATHER THAN A CONFIGURED ORIGIN. The obvious repair is to read
 * `X-Forwarded-Host`, or to fall back to SITE_URL. Both work and both are worse.
 * A forwarded host is client-controlled unless every hop is trusted, which turns
 * a fixed internal redirect into an open redirect to any host an attacker can
 * put in a header. SITE_URL is safe but has to be correct in every environment,
 * and a wrong value fails in exactly this way again.
 *
 * A relative Location has neither problem. RFC 7231 permits it, every browser
 * resolves it against the request URL, and the request URL is by definition the
 * one the visitor actually used. There is no origin to get wrong and no header
 * to trust.
 *
 * 303 THROUGHOUT, because these all answer a POST. It turns the follow-up into
 * a GET, so a refresh on the destination cannot resubmit credentials or repeat
 * a state change.
 */

/**
 * A see-other redirect to a path on this site.
 *
 * @param path  absolute path beginning with `/`. Never a full URL: an
 *   off-site redirect is not something this application has any reason to
 *   perform, and refusing one here means no caller can be tricked into it.
 * @param params  optional query parameters. Undefined values are dropped, so a
 *   caller can pass an optional error without building the string itself.
 */
export function seeOther(
  path: string,
  params?: Record<string, string | undefined>,
): NextResponse {
  if (!path.startsWith('/') || path.startsWith('//')) {
    // `//host` is a protocol-relative URL and would leave the site.
    throw new Error(`seeOther expects a site-relative path, received: ${path}`);
  }

  let location = path;

  if (params !== undefined) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) search.set(key, value);
    }
    const query = search.toString();
    if (query !== '') location += (location.includes('?') ? '&' : '?') + query;
  }

  return new NextResponse(null, { status: 303, headers: { Location: location } });
}
