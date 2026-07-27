# ADR 0004 — Strict CSP via per-response nonce, at the cost of static HTML

**Status:** Accepted · **Date:** 2026-07-27

## Context

Blueprint page 16 requires, as a build requirement with test evidence:

> Context encoding, strict CSP with nonces or hashes, Trusted Types where
> supported, no unsafe inline scripts, secure MIME types.

Page 21 makes "No open critical or high security finding" a launch gate.

Blueprint section 8 separately says: "Keep the public website fast and mostly
static", and page 20 requires that disabling the origin still leaves "cached
public pages and phone paths" available.

These two requirements are in direct tension, and the tension is not obvious.

## The problem, stated precisely

Next.js emits roughly 40 inline `<script>` elements per page — the bootstrap and
the streamed RSC payload. A strict CSP must permit exactly those and nothing
else. There are two mechanisms:

**Nonce.** Next stamps a nonce onto its inline scripts by reading the
`Content-Security-Policy` *request* header during render. This only works while
rendering a request. A statically prerendered page is rendered at build time,
when no request and no nonce exist.

**Hash.** The inline payload differs per page, so a single static header would
need the union of every page's script hashes — roughly 3,000 entries across the
74 routes here. Not deliverable in a header, and it would change on every build.

## The failure mode this ADR exists to prevent

An earlier iteration of this codebase set the nonce in the proxy while pages
stayed statically prerendered. The result:

- `curl -I` showed a textbook-perfect CSP with a fresh nonce on every response.
- Every automated header scan passed.
- **All 40 inline scripts in the served HTML had no nonce at all**, so a real
  browser would have blocked every one of them and the page would never have
  hydrated.

A header scan cannot detect this. It is only visible by fetching the document
and comparing the nonce in the header against the nonce on the scripts.

## Decision

1. Use a **per-response nonce**, minted in `src/proxy.ts`.
2. Force **dynamic rendering** for all HTML documents (`export const dynamic =
   'force-dynamic'` in the root layout, plus `getNonce()` reading `headers()`),
   so the nonce Next stamps matches the nonce in the response header.
3. Apply the nonce to first-party `<script type="application/ld+json">` tags too.
4. Add a CI gate that fetches representative documents and asserts every inline
   script carries the response's own nonce, and that a nonce-bearing document is
   never shared-cacheable.

## Directives, and why

| Directive | Value | Reason |
|---|---|---|
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` | `strict-dynamic` propagates trust to scripts Next loads at runtime without enumerating them, and makes host allowlists inert — intended, since section 13 forbids third-party ad and analytics code outright. |
| `style-src` | `'self' 'nonce-…' 'unsafe-inline'` | Next injects a small inline `<style>` for streamed CSS. Browsers ignore `unsafe-inline` when a nonce is present in the same directive, so this does not weaken anything; styles carry no script capability. |
| `connect-src` | `'self'` | Makes a browser-direct write to JetInsight or a vendor impossible by accident (page 14). |
| `frame-ancestors` | `'none'` | Clickjacking. Paired with `X-Frame-Options: DENY` for older agents. |
| `object-src`, `base-uri` | `'none'` | Removes plugin and base-tag injection vectors. |
| `img-src` | `'self' data: blob:` | `data:` for inline SVG icons. No remote hosts — all imagery is AirEvac-owned and permission-cleared. |

`upgrade-insecure-requests` is set. Trusted Types are **not** yet enforced;
Next's own runtime is not fully Trusted-Types-compatible, so that remains
outstanding against the page 16 requirement.

## Consequences

**Given up:** shared CDN caching of the HTML document. The nonce must differ per
response, so a cached document cannot be reused. `Cache-Control` on HTML is
`private, no-store`.

**Kept:** everything under `/_next/static` — JavaScript, CSS, fonts — is still
immutably cached at the edge. That is where the Core Web Vitals budget on
page 21 is actually won. The HTML document is small and renders from server
components with no I/O, no database, and no network calls.

**Required of the deployment, and currently outstanding:**

- The CDN must be configured with `stale-if-error` (and ideally
  `stale-while-revalidate`) on the HTML response, so an origin outage still
  serves the last good document. **This is what satisfies the page 20 failure
  drill** — "Disable the CMS origin and confirm cached public pages and phone
  paths remain available." Without it, that drill fails.
- HSTS is set to one year with `includeSubDomains` but **without `preload`**.
  Preload is irreversible in practice and must not be enabled until every
  subdomain is confirmed HTTPS-only.

## Alternative to revisit

If HTML caching later becomes a measured problem, the option is a post-build
step that extracts each page's inline-script hashes and emits a per-route CSP at
the CDN. That restores static HTML at the cost of a fragile build step, and
should only be taken with field data showing the current approach is inadequate.
