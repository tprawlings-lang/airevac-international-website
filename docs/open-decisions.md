# Open decisions

The blueprint's section 21 decision list (D1–D14), annotated with **what the
code does today** while each decision is open, and **exactly what changes** when
it closes.

Format per section 22: *user choice, impact, safe default, deadline.*

---

## D1 — Renewed NAAMTA certificate, or decision to omit
**Owner:** Compliance · **Needed by:** before credential copy

- **Impact:** whether NAAMTA appears anywhere on the site.
- **Safe default in code:** `credentials.ts` → `naamta` has `status: 'hold'`.
  It renders nowhere. `tests/content-governance.test.ts` fails the build if the
  word "NAAMTA" appears in any page's copy.
- **To close:** set `status: 'cleared'`, add `sourceDocument`, `approvedOn`,
  `expiresOn` from the renewed certificate, and a `secondApprover`. Then remove
  the `NAAMTA` entry from the prohibited-claims list in the governance test.
- **If it is not renewed:** leave the record exactly as it is. Do not delete it —
  the hold is the audit trail.

## D2 — Current EURAMI certificate and logo-use rules
**Owner:** Compliance · **Needed by:** before visual design

- **Impact:** **this is currently blocking the site's only publishable
  accreditation.** The register has EURAMI's scope and expiry from the public
  provider record, but `approvedOn` is null, so the gate withholds it and the
  credentials page renders its empty state.
- **Safe default in code:** withheld. The homepage proof block and the
  credentials page both say we publish only what we can evidence, so the empty
  state reads as deliberate rather than broken.
- **To close:** set `approvedOn` on the `eurami` record from the certificate
  itself (not the directory listing). If EURAMI's logo-use terms permit the seal,
  add the artwork to the aircraft/credential photo fields with a permission ID.
- **Deadline note:** this is the highest-value single unblock on the list. It
  turns the proof block from an empty state into the site's main trust signal.

## D3 — Current ARGUS status evidence
**Owner:** Aviation · **Needed by:** before safety page

- **Impact:** whether a safety rating appears at all.
- **Safe default in code:** `status: 'gap'`, renders nowhere, term blocked in
  prose.
- **To close:** supply the rating report or letter with the exact level, holder
  name, and expiry or monitoring status. Note that `category: 'safety-rating'`
  requires a second approver.
- **Never:** present ARGUS as a medical accreditation.

## D4 — Current D0JA860L certificate and OpSpecs for N322PR and N669MD
**Owner:** Aviation · **Needed by:** before fleet copy

- **Impact:** two things — whether the site names the operating certificate, and
  whether any page may use ownership language.
- **Safe default in code:** the `part-135` record is `gap`. Every aircraft has
  `ownershipLanguageCleared: false`, and a test asserts it. Copy uses the
  blueprint's approved wording verbatim: *"The current working fleet includes
  Learjet 31A aircraft N322PR and N669MD."* The hero says AirEvac coordinates
  directly "with no broker in between" rather than claiming to be the operator.
- **To close:** clear the `part-135` record, and set
  `ownershipLanguageCleared: true` only for aircraft whose leases and operating
  control are documented. Approved wording once cleared (page 6): *"Operated
  under Dorato Jets LLC certificate D0JA860L."*

## D5 — Status of Learjet 35 N277MK and whether EURAMI should be updated
**Owner:** Aviation · **Needed by:** before sitemap freeze

- **Impact:** a public inconsistency — EURAMI lists the aircraft, the current
  site does not.
- **Safe default in code:** `aircraft-n277mk` is `hold` with
  `statusLabel: 'Under review'`. It renders nowhere. Copy never states a fleet
  *size*, only that the working fleet "includes" the two Learjet 31As, so
  resolving D5 either way requires no copy rewrite.
- **To close:** decide active / reserve / partner-operated / retired, align the
  EURAMI record, then either clear the aircraft record or leave it held.

## D6 — Current state licenses and marketed-base authority
**Owner:** Compliance · **Needed by:** before coverage copy

- **Impact:** whether coverage pages may assert operating authority anywhere.
- **Safe default in code:** `state-ems-licenses` is `gap`. Every coverage and
  route page describes *process, logistics, and timing factors only* and makes
  no licensing or authority claim. The coverage hub explicitly says the listed
  regions are "not an exhaustive list" rather than implying unlimited reach.
- **To close:** clear the record and add per-jurisdiction license records.

## D7 — JetInsight BAA position, contract, API and data-use approval
**Owner:** Technology and privacy · **Needed by:** before integration design

- **Impact:** whether website data reaches the system of record automatically.
- **Safe default in code:** `FEATURES.jetInsightAdapter: false`. There is no
  adapter, no client-side call, and no server-side call. `connect-src 'self'`
  makes a browser-direct write impossible even by accident.
- **To close:** obtain the contract, BAA position, API documents, data-flow
  answers, audit details, retention controls, and incident terms. Then implement
  the adapter **server-to-server only**, behind the existing `recordInquiry`
  seam, with the idempotency key propagated as the downstream write key.
- **Never:** a browser-direct write, per page 14.

## D8 — Secure chat and clinical intake vendors
**Owner:** Operations and privacy · **Needed by:** before sprint 7

- **Impact:** the secondary conversion (chat) and the entire clinical handoff.
- **Safe default in code:** `FEATURES.secureChat: false` and
  `FEATURES.clinicalUpload: false`. `SecureChatButton` degrades to the callback
  path with an honest explanatory line rather than rendering a dead widget —
  which is the same shape page 13 requires on chat failure.
- **To close:** sign the BAA, complete the security review, agree retention
  rules, run the 30-day staffing test, then flip `secureChat` and mount the
  approved launcher inside `SecureChatButton`. No page needs to change.

## D9 — Approved data retention and deletion schedule
**Owner:** Privacy and records · **Needed by:** before production config

- **Impact:** whether any inquiry may be stored at all.
- **Safe default in code:** **nothing is stored.** `recordInquiry` holds only an
  idempotency key and a minted reference, in memory, for 24 hours. The privacy
  notice states the intended schedule from page 15 but no store exists to
  enforce it.
- **To close:** approve the schedule, then implement it in the chosen store
  (D8), with automated deletion and a documented legal-hold path.

## D10 — Current Notice of Privacy Practices and No Surprises/GFE documents
**Owner:** Legal and billing · **Needed by:** before legal page build

- **Impact:** four pages — privacy, NPP, terms, patient rights.
- **Safe default in code:** all four have `reviewer: null`, so `ContentPage`
  renders a visible "Under review — not yet signed off by a qualified reviewer"
  banner above the content. The patient-rights page describes rights accurately
  from CMS guidance and links to CMS as the authority; it does **not** reproduce
  a statutory notice, invent a dispute process, or quote a deadline.
- **To close:** set `reviewer` and `reviewedOn` on each page and replace the
  drafted body with the approved text.

## D11 — Spanish 24/7 staffing and translator policy
**Owner:** Operations · **Needed by:** before language promise

- **Impact:** two things — whether the site may promise Spanish coordination, and
  when Spanish body copy may be published.
- **Safe default in code:** the `bilingual-coordination` claim is `gap`, so no
  language guarantee appears in copy or in structured data. Spanish UI chrome is
  marked `reviewStatus: 'draft'`. Every medical, legal, insurance, and coverage
  page renders `TranslationPendingNotice` in Spanish, offering a Spanish-speaking
  coordinator by phone and a link to the reviewed English page.
  - **One deliberate exception:** the emergency notice IS translated. Withholding
    an emergency instruction from a Spanish reader is more dangerous than
    shipping a single reviewed-but-unsigned sentence. Flag it for priority
    review.
- **To close:** approve the staffing policy, have a qualified reviewer sign off
  the chrome (`reviewStatus: 'approved'`), then add `esBlocks` and `esReviewedOn`
  per page as translations are reviewed. A test asserts `esBlocks` can never
  exist without `esReviewedOn`.

## D12 — Approved statistics, reviews, case stories and image permissions
**Owner:** Marketing and compliance · **Needed by:** before proof modules

- **Impact:** all photography, the partner-proof block, and Mission Stories.
- **Safe default in code:** `photos: []` on every aircraft, so cards render a
  typographic panel rather than stock imagery (page 10 forbids generic stretcher
  and dramatic emergency photos). Mission Stories and Leadership ship as honest
  empty states explaining the standard being applied.
- **To close:** supply images with written permission and a permission ID, then
  populate `photos`. For case stories, the block model on page 11 still needs
  building: authorization ID, de-identification status, expiration/revocation
  field, and publishing approval.

## D13 — Private-pay quote, estimate, payment and refund workflow
**Owner:** Billing and legal · **Needed by:** before payment page

- **Impact:** whether any payment surface exists.
- **Safe default in code:** `FEATURES.hostedPayments: false`. No payment page, no
  card field anywhere, and `payment=()` in `Permissions-Policy`.
- **To close:** implement as a hosted payment page only. No card number may touch
  AirEvac code or logs (page 14).

## D14 — Live-chat response-time promise after 30-day measurement
**Owner:** Operations · **Needed by:** after pilot

- **Impact:** whether any response-time number may be published.
- **Safe default in code:** the `chat-response-time` claim is `gap`. A prose scan
  blocks response-time promise patterns across all content. Copy explains why:
  *"We do not publish a standard response time, because a number that is not
  true for your route is worse than no number."*
- **To close:** run the 30-day staffing test, then publish only the measured
  figure.

---

## Decisions this repository made on its own

These were not on the blueprint's list but had to be settled to build. Each has
an ADR.

| Decision | Choice | ADR |
|---|---|---|
| Framework | Next.js 16, App Router, TypeScript | [0001](adr/0001-framework.md) |
| Content model | Typed block data in-repo, CMS-shaped | [0002](adr/0002-content-model.md) |
| Rate limiting | In-memory now, CDN/WAF before launch | [0003](adr/0003-rate-limiting.md) |
| CSP strategy | Per-response nonce, dynamic HTML | [0004](adr/0004-security-headers.md) |
| Locale routing | Path prefix, untranslated slugs, no auto-redirect | [0005](adr/0005-localization.md) |
