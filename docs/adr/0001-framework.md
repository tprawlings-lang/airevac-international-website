# ADR 0001 — Next.js 16 App Router with TypeScript

**Status:** Accepted · **Date:** 2026-07-27

## Context

Blueprint section 8 specifies "Modern static or server-rendered application
behind CDN and WAF; headless CMS for approved content", with a separately
controlled secure contact layer and a future server-to-server JetInsight
adapter.

## Decision

Next.js 16 (App Router) with TypeScript in strict mode, `noUncheckedIndexedAccess`
enabled.

## Rationale

- Server components render the content model with no client JavaScript, which
  keeps the marketing layer close to static while leaving a server runtime
  available for the callback endpoint and the future adapter.
- The secure contact layer can start as an isolated route and move to a separate
  origin without rewriting pages, because every contact affordance already routes
  through `ContactBlock` and `SecureChatButton`.
- Widest hosting and CDN/WAF support, which matters for the availability target
  on page 20.

## Consequences

- HTML is rendered per request — see ADR 0004 for why, and what the CDN must do
  about it.
- `typedRoutes` is disabled because nearly every link is built by
  `localePath(locale, path)`. The guarantee is replaced by
  `tests/content-governance.test.ts`, which asserts every navigation link,
  content page, priority route, and redirect destination resolves to a real page
  directory — broader coverage than typed routes would have given.
