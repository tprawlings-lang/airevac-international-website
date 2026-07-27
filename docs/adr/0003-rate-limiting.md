# ADR 0003 — In-memory rate limiting now, CDN/WAF before launch

**Status:** Accepted, with a launch blocker · **Date:** 2026-07-27

## Context

Blueprint page 16 gives starting rate limits and adds: "These are safe starting
values, not permanent limits. The build team must run controlled load and abuse
tests, review real volume, and record the chosen thresholds in an Architecture
Decision Record."

## Decision

Implement the documented thresholds in `src/lib/rate-limit.ts` as an in-memory
sliding window, behind an async interface.

## Thresholds as implemented

| Route | Limit | Window |
|---|---|---|
| Public pages | 120 | 1 minute |
| Callback creation (per IP) | 5 | 15 minutes |
| Callback creation (per contact) | 10 | 24 hours |
| Chat starts | 3 | 10 minutes |
| Admin login failures | 5 | 15 minutes |
| Upload sessions | 10 | 1 hour |

These are the blueprint's own starting values, unchanged. They have **not** been
validated against real traffic; the load and abuse tests on page 21 have not
been run.

## Known limitations — these block launch

1. **Single-instance.** Counters live in one process. With N replicas the
   effective limit is N×. Production must back this with the CDN/WAF rate
   limiter or a shared store.
2. **Fails open under memory pressure.** If the bucket map exceeds 50,000
   entries it is cleared, allowing one window through. This is deliberate:
   page 20 requires the urgent contact path to stay usable, and a limiter that
   fails closed would block real hospital referrals. **The CDN/WAF is the layer
   that must fail closed.**
3. **Trusts `X-Forwarded-For`.** The endpoint reads the left-most entry. The
   edge **must strip inbound `X-Forwarded-For`** and set its own, or a caller can
   forge their own bucket and bypass the limit entirely.

## Follow-up

Run the page 21 load and abuse tests, then revise this ADR with the observed
volumes and the chosen production thresholds.
