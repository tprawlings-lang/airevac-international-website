# Readiness matrix

Format per blueprint section 22 (*Repository scan and implementation report
format*): **category | pass, gap, or fail | severity | evidence | owner**.

Status terms follow the blueprint's own definitions: **Pass** means public
evidence or a defined control is present. **Gap** means evidence or
implementation is still needed. **Fail** means the current state creates a
launch blocker. **Conditional** means applicability depends on facts AirEvac
must confirm.

This matrix scores **this repository**, not the current live site. Where the
blueprint's provisional score has changed because of work in this repo, the
previous score is shown in parentheses.

Last updated: 2026-07-27.

---

## 1. Claims and credentials

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| EURAMI | Gap (was Pass) | Medium | Register entry present with correct scope and expiry, but `approvedOn` is null pending the certificate itself and logo-use terms (D2). The gate therefore withholds it, so the site currently publishes **no** accreditation. `tests/structured-data.test.ts` asserts this. | Compliance lead |
| NAAMTA | Pass (was Fail) | Low | Held in the register with `status: 'hold'`. Never renders. Enforced by `publishable()` and asserted in `tests/credential-register.test.ts`; prose is scanned for the word in `tests/content-governance.test.ts`. | Compliance lead |
| ARGUS | Pass (was Gap) | Low | Held with `status: 'gap'`. Never renders; prose scan blocks the term. | Director of Operations |
| Two Learjet 31As | Pass | Low | Both registrations verified against the FAA registry. Per the AEI handoff (G-03/G-04) public copy is model and quantity only; registrations are masked to internal refs, mapped in `docs/fleet-register.md`. `ownershipLanguageCleared: false` so no "owns and operates" wording is possible. | Director of Operations |
| Learjet 35 N277MK | Pass (was Medium risk) | Low | Held pending D5. Never renders; prose scan blocks both the tail number and "Learjet 35". | Director of Operations |
| FAA Part 135 claim | Pass (was Gap) | Low | Held pending D4. The site does not describe AirEvac as a certificate holder. | Director of Operations |
| Fort Lauderdale contact | Pass | Low | Published from `SITE.base`, matching the FXE directory [S4]. `tests/structured-data.test.ts` asserts the Scottsdale address never appears. | Director of Operations |
| Response-time claims | Pass with caveat | Medium | The AEI handoff publishes its exact conditional "standard response time" copy (90 minutes, hedged, no promise) in the service FAQ, overriding D14's blanket bar. The prose scan still blocks any unconditional response-time promise. Operations approval for the copy is open (docs/handoff-completion-report.md). | Director of Operations |
| 24/7 Spanish guarantee | Pass | Low | Not claimed in copy or in structured data, pending D11. | Director of Operations |
| Case stories / statistics | Gap | Medium | Mission Stories ships as an honest empty state. No case-story block is implemented yet — it needs the authorization ID, de-identification status, and revocation fields from page 11. | Marketing owner |

## 2. Conversion and layout

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| Conversion layout | Pass (was Fail) | Low | Homepage implements the section 4 block order. Phone is first in every contact block via `ContactBlock` and `PhoneCta`. | Marketing owner |
| Referral paths | Pass | Low | Hospital, cruise, and insurance pages implement the section 5 template order. | Marketing owner |
| Mobile call bar | Pass | Low | Fixed bar with reserved body padding so it never covers content or a focused element. | Marketing owner |
| Imagery | Gap (improved) | Medium | AirEvac's own operational photography recovered from their live site and placed on the hero, fleet, about, and partner sections, registered in `src/content/media.ts` with provenance and alt text. **Permission records are still outstanding (D12)** — "already on our site" is not proof of copyright ownership or crew model releases. The isolation-pod photo is held: it asserts an isolation capability with no clinical sign-off, and may show a real patient. | Marketing owner |

## 3. Privacy and data

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| Public intake isolation | Pass (was Fail/Critical) | Low | Strict allowlist schema, PHI tripwire, no upload path, no free-text beyond 280 chars, warning above the field. 30 assertions in `tests/intake-schema.test.ts` and `tests/callback-route.test.ts`. | HIPAA privacy owner |
| Privacy notice | Gap (was Fail/Critical) | High | Rewritten from the actual implementation and describes what the system does and does not collect. **Not yet approved by legal (D10)**, so it renders an "under review" state. | HIPAA privacy owner |
| Notice of Privacy Practices | Gap | High | Placeholder page explaining that the notice must be issued by the covered entity. Blocked on D10. | HIPAA privacy owner |
| No Surprises / GFE | Gap | High | Patient-rights page describes rights from CMS guidance and links to CMS as the authority. Does not reproduce a statutory notice or invent a dispute process. Blocked on D10. | Revenue-cycle lead |
| Tracking on sensitive pages | Pass (was Gap) | Low | No third-party script loads anywhere on the site. `connect-src 'self'` and `Permissions-Policy` block ad-tech surfaces. Intake sets `no-store`. | HIPAA privacy owner |
| Log redaction | Pass | Low | All server logging goes through `safeLog`; a lint rule bans direct `console` in `src/`. Asserted in `tests/privacy-controls.test.ts`. | Security or technology owner |
| Retention and deletion | Gap | High | Retention policy is documented in the privacy notice, but **no data store exists to enforce it** — see the inquiry-queue boundary below. Blocked on D9. | HIPAA privacy owner |

## 4. Security

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| Input validation | Pass (was Gap/Critical) | Low | Zod `.strict()` allowlist, length and type limits, character allowlist, size cap before parse, explicit method and content-type rejection. | Security or technology owner |
| Browser security / CSP | Pass (was Gap) | Low | Strict CSP with a per-response nonce, `strict-dynamic`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. **Verified end-to-end** — CI asserts every inline script carries the response's own nonce. See ADR 0004. | Security or technology owner |
| Security headers | Pass | Low | HSTS, nosniff, DENY, Referrer-Policy, COOP/CORP, Permissions-Policy. Asserted in CI against a running server. | Security or technology owner |
| Rate limiting | Gap | High | Blueprint's starting thresholds implemented and tested, but **in-memory and single-instance**. Multiplies by replica count in production. Must move to the CDN/WAF or a shared store. See ADR 0003. | Security or technology owner |
| Auth and RBAC | Gap | High | No accounts exist in phase 1, which is per plan. CMS SSO/MFA/RBAC is not built because no CMS is selected. | Security or technology owner |
| Secrets | Pass | Low | No secrets in the repo. Only `SITE_URL` is read, and it is non-secret. Gitleaks runs in CI. | Security or technology owner |
| Supply chain | Pass | Low | Lockfile committed, `npm ci` in CI, `npm audit --audit-level=high` fails the build, SBOM generated. **Zero advisories.** Three `overrides` in package.json pin patched transitives: `postcss` and `sharp` (Next.js), and `minimatch` (eslint's chain, which otherwise pulls a brace-expansion DoS). The minimatch override rather than a direct brace-expansion one is deliberate — overriding brace-expansion to v5 breaks eslint, because minimatch depends on the v1 CommonJS export shape. | Security or technology owner |
| Penetration test | Gap | High | Not performed. Launch gate on page 21. | Security or technology owner |
| DAST | Gap | High | Not run. Needs a staging environment. | Security or technology owner |

## 5. Reliability

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| Phone fallback | Pass | Low | `tel:` links are plain markup with no JavaScript, no click handler, and no tracking wrapper. Present in the header, footer, mobile bar, every contact block, the 404 page, the form's error state, and a `<noscript>` notice. | Director of Operations |
| Graceful degradation | Pass | Low | Navigation and FAQ use `<details>`, so they work without JavaScript. The referral selector is four plain links. | Security or technology owner |
| Idempotency | Pass | Low | Every inquiry carries a client-minted UUID; a repeat returns the same reference. Tested at unit and route level. | Security or technology owner |
| Inquiry delivery | **Fail** | **Critical** | **The callback form does not deliver anywhere.** `recordInquiry` mints a reference and logs an acceptance event; it does not persist or notify. This is deliberate — D7/D8/D9 are open and writing contact details into an unapproved store would breach section 9 — but the form must not be presented as a working channel until it is wired up. | Security or technology owner |
| RTO / RPO | Gap | High | No failover, backup, or restore configuration exists in this repo. Drills not run. | Security or technology owner |
| CDN / WAF | Gap | High | Not configured. HTML is per-request (see ADR 0004), so the CDN needs `stale-if-error` for the page 20 origin-outage drill. | Security or technology owner |

## 6. Quality and growth

| Category | Status | Severity | Evidence | Owner |
|---|---|---|---|---|
| Unit / integration tests | Pass | Low | 173 tests. 100% statement and branch coverage on the credential gate and the intake allowlist, enforced by threshold in `vitest.config.ts`. | Security or technology owner |
| End-to-end tests | Gap | High | Not implemented. Page 21 requires hospital, cruise, insurer, and family flows in both languages. | Security or technology owner |
| Accessibility (automated) | Pass | Low | axe runs against nine representative pages in CI at `wcag22aa`. Built for keyboard, focus visibility, zoom, labels, error summary focus, and reduced motion. | Marketing owner |
| Accessibility (manual) | Gap | High | No screen-reader, 400% zoom, or assistive-technology matrix testing. No independent audit. The accessibility statement says so rather than claiming conformance. | Marketing owner |
| Performance / Core Web Vitals | Gap | Medium | No budget enforcement in CI and no field data. Zero third-party scripts and minimal client JS give good headroom, but this is untested. | Marketing owner |
| Load and stress | Gap | High | Not run. Page 21 targets 100 rps public and 20 accepted callbacks/min. | Security or technology owner |
| Chaos and recovery | Gap | High | Not run. | Security or technology owner |
| SEO and redirects | Pass (was Fail) | Low | Canonical URLs, hreflang pairs, per-page unique title and description, sitemap generated from the page registry, robots blocking non-production by origin. **Redirect map is now complete** — all 88 legacy URLs from the live sitemap (43 pages, 44 posts, 1 author), with automated no-chain, locale-prefix, and destination-resolves checks, verified single-hop against a running server. See [migration-findings.md](migration-findings.md). Remaining: export the real URL list from Search Console, which shows indexed URLs a sitemap omits. | Marketing owner |
| Spanish content | Gap | High | UI chrome translated as a draft (D11). All medical, legal, insurance, and coverage body copy renders `TranslationPendingNotice` in Spanish rather than machine translation, per page 24. | Marketing owner |
| CMS | Gap | Medium | Content is typed data conforming to the section 5 block model, but no CMS, approval workflow, version history, or scheduled review is implemented. | Marketing owner |

---

## The three findings that most need attention

1. **The callback form is not connected to anything** (Fail/Critical). It
   validates, deduplicates, and issues a reference, then stops. Until D7/D8/D9
   close, the phone line is the only working channel, and the site should not go
   live with a form that implies otherwise.

2. **Rate limiting is per-instance** (Gap/High). The thresholds are correct and
   tested, but they do not hold across replicas. This must move to the CDN/WAF
   before launch, and the WAF must strip inbound `X-Forwarded-For` so a caller
   cannot forge their own bucket.

3. **No legal page is approved** (Gap/High). The privacy notice, Notice of
   Privacy Practices, and terms pages are drafted and render an "under review"
   state. The patient rights page was removed by the AEI handoff and archived
   (`docs/archive/patient-rights-and-cost-info.md`). D10 must close before
   launch.
