import { headers } from 'next/headers';

/**
 * Reads the per-response CSP nonce minted by `src/proxy.ts`.
 *
 * ===================== WHY THIS FUNCTION EXISTS ==========================
 *
 * Blueprint page 16 requires a "strict CSP with nonces or hashes, no unsafe
 * inline scripts". Next.js emits ~40 inline bootstrap and RSC-payload scripts
 * per page, and it stamps its nonce onto them by reading the
 * `Content-Security-Policy` REQUEST header - but only while rendering a request.
 *
 * A statically prerendered page is rendered at BUILD time, when no request and
 * no nonce exist. Serving such a page with a per-request nonce header produces a
 * CSP that matches nothing: every inline script is blocked and the page does not
 * hydrate. That failure is invisible in a header scan - the header looks
 * perfect - and only shows up in a browser console.
 *
 * Calling `headers()` here opts the route into dynamic rendering, which is what
 * makes the nonce real. This is a deliberate trade against section 8's
 * "keep the public website fast and mostly static":
 *
 *   - What we give up: shared CDN caching of the HTML document. The nonce must
 *     differ per response, so a cached document cannot be reused.
 *   - What we keep: every byte under /_next/static - the JavaScript, CSS, and
 *     fonts - is still immutably cached at the edge. That is where the LCP
 *     budget on page 21 is actually won; the HTML document is ~15 KB gzipped and
 *     renders from server components with no I/O.
 *   - What the deployment must add: `stale-if-error` (and ideally
 *     `stale-while-revalidate`) on the HTML cache at the CDN, so an origin
 *     outage still serves the last good document. That is what satisfies the
 *     page 20 failure drill - "Disable the CMS origin and confirm cached public
 *     pages and phone paths remain available."
 *
 * The alternative - hash-based CSP over statically generated HTML - was
 * rejected: Next's inline payload differs per page, so a single static header
 * would need the union of every page's hashes (~3,000 entries here), which is
 * neither maintainable nor deliverable in a header.
 *
 * Recorded in docs/adr/0004-security-headers.md.
 * =========================================================================
 */
export async function getNonce(): Promise<string | undefined> {
  const headerList = await headers();
  return headerList.get('x-nonce') ?? undefined;
}
