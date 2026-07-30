# Open decisions

The blueprint's section 21 decision list (D1–D14), the decisions raised by the
crawl of the current site (D15–D17), and the decisions raised by building the
coordinator chat (D18–D22). Each is annotated with **what the code does today**
while it is open, and **exactly what changes** when it closes.

These are engineering's tracking of open questions. The list of what needs a
**named signature** before launch is
[executive-sign-off-register.md](executive-sign-off-register.md).

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
  `ownershipLanguageCleared: false`, and a test asserts it. Public copy is now
  model and quantity only per the AEI handoff (G-03/G-04): *"The current
  working fleet is two Learjet 31A aircraft."* Registrations live in
  `docs/fleet-register.md`, never in `src/`. The hero says AirEvac coordinates
  directly "with no broker in between" rather than claiming to be the operator.
- **To close:** clear the `part-135` record, and set
  `ownershipLanguageCleared: true` only for aircraft whose leases and operating
  control are documented. Approved wording once cleared (page 6): *"Operated
  under Dorato Jets LLC certificate D0JA860L."*

## D5 — Status of Learjet 35 N277MK and whether EURAMI should be updated
**Owner:** Aviation · **Needed by:** before sitemap freeze

- **Impact:** a public inconsistency — EURAMI lists the aircraft, the current
  site does not.
- **Safe default in code:** `aircraft-35-reserve` (internal ref AC-35-R) is
  `hold` with `statusLabel: 'Under review'`. It renders nowhere. Copy never states a fleet
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
**Owner:** Operations and privacy · **Needed by:** built; blocked on the BAA (L6)

- **REOPENED 2026-07-30.** The July handoff removed chat and put the clinical
  route on email and fax. AirEvac has now confirmed that **chat supersedes
  email-and-fax-only**. See docs/plans/coordinator-chat-plan.md.
- **What the supersession does and does not cover.** Chat replaces email and
  fax as the route for *conversation*. It does **not** replace them as the route
  for *documents*: a chat window is a poor place to receive a 40-page medical
  record, and no upload exists in the chat by design. Records continue to go to
  ops@aeiamericas.com or (619) 330-4551. If AirEvac intends documents to move
  through chat as well, that is a separate decision and needs saying.
- **BUILT AND RUNNING 2026-07-30.** Phases A, B, and C are complete and a full
  two-sided conversation has been held on the preview deploy against a real
  database: intake, queue, claim, reply, marked test translation, and the
  transcript notification.
- **Safe default in code, restated for what now exists.** `FEATURES.secureChat`
  is no longer a constant. It is **off on the production origin unless someone
  opts in**, on for any preview, and **refused outright when `DATABASE_URL` is
  absent**, because there is then nowhere for a conversation to exist. The
  database check outranks an explicit `CHAT_ENABLED=true`: the presence of a
  database is a fact about the deployment, not a preference.
  `FEATURES.clinicalUpload: false` is unchanged, and no upload exists.
- **What still keeps it off the public site** is the BAA (L6 in the sign-off
  register), not a hardcoded flag. That is a deliberate change: a flag someone
  can flip is a weaker guarantee than an origin check they would have to
  deliberately override, and the override is logged loudly on every boot.
- **Copy that changes when chat goes live**, all currently stating email and
  fax as the only route: `src/content/dictionary.ts`, `src/content/pages/`
  (`services.ts`, `patients.ts`, `legal.ts`), the homepage clinical-intake
  section, the contact page, `src/app/api/callback/route.ts`, and
  `/llms.txt`. These are deliberately NOT changed yet: telling visitors to use
  a chat that is not running would be worse than the current copy.
- **Still open, and now the only things standing between this and the public:**
  the hosting BAA (L6), a privacy notice rewritten to describe a site that
  receives clinical information (L4 — the current one says the opposite, which
  a chat makes untrue in the first minute of the first real conversation),
  retention rules (D9), and the 30-day staffing test the blueprint required
  (A5). Tracked for signature in `docs/executive-sign-off-register.md`.

## D9 — Approved data retention and deletion schedule
**Owner:** Privacy and records · **Needed by:** before production config

- **Impact:** whether any inquiry may be stored at all, and for how long a chat
  transcript survives.
- **CHANGED 2026-07-30: a store now exists.** The callback form is unchanged and
  still persists nothing — `recordInquiry` holds only an idempotency key and a
  minted reference, in memory, for 24 hours. But chat writes conversations to
  Postgres, so "nothing is stored" is no longer true of the system as a whole
  and must not be repeated as though it were.
- **Safe default in code:** transcripts carry a `delete_after` stamp set from
  `CHAT_RETENTION_DAYS`, defaulting to **30 days, provisional and unapproved**.
  A sweep deletes past it. The number is deliberately a variable rather than a
  constant so approving a different one is a configuration change, not a
  deploy.
- **To close:** the privacy officer approves the period, it is set explicitly,
  and the privacy notice states the approved figure. Until then the notice
  cannot name a number, because none has been approved.
- **Still owed:** a documented legal-hold path, and confirmation of how long
  deleted rows persist in the provider's backups. Deletion from the database is
  not deletion from a backup taken yesterday.

## D10 — Current Notice of Privacy Practices and No Surprises/GFE documents
**Owner:** Legal and billing · **Needed by:** before legal page build

- **Impact:** three live pages — privacy, NPP, terms. The patient rights and
  cost information page was removed by the AEI handoff (I-05); its drafted
  content is archived at `docs/archive/patient-rights-and-cost-info.md`
  pending AEI's billing and legal decision on required notices.
- **Safe default in code:** the live pages have `reviewer: null`, so
  `ContentPage` renders a visible "Under review — not yet signed off by a
  qualified reviewer" banner above the content.
- **To close:** set `reviewer` and `reviewedOn` on each page and replace the
  drafted body with the approved text; decide whether any No Surprises Act /
  GFE notice must return before launch.

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
- **CHANGED 2026-07-30: machine translation now exists in chat, and it does not
  close this.** A coordinator records the languages they speak. When a visitor's
  language is covered by someone on shift, no machine is involved. When it is
  not, messages are machine translated and **both sides are told so before the
  conversation starts**, not after. Translation is additive throughout: the
  original text is always shown beneath the translation, never replaced by it,
  so a bilingual coordinator can catch an error the system cannot.
- **What that means for the promise.** A machine in the loop is not bilingual
  staffing and must not be described as it. The `bilingual-coordination` claim
  stays `gap`. If AirEvac wants to publish a Spanish guarantee, the thing being
  guaranteed has to be people, and D11 is still the decision that says whether
  those people exist.

## D12 — Approved statistics, reviews, case stories and image permissions
**Owner:** Marketing and compliance · **Needed by:** before proof modules

- **Impact:** all photography, the partner-proof block, and Mission Stories.
- **Partially addressed.** AirEvac's own photography was recovered from the live
  WordPress media library and is now registered in `src/content/media.ts` with
  provenance, alt text, and a publication status. Five images publish; one is
  held. Aircraft cards still show the schematic, and Mission Stories and
  Leadership still ship as honest empty states.
- **What is still open, and it is not small:** "it was already on our website"
  is not the same as "we own the copyright and hold model releases". For each
  image Marketing must confirm who shot it, whether AirEvac owns or licenses it,
  and whether the identifiable crew consented to continued commercial use. Until
  then `permissionId` is null and status is `inherited-from-live-site` — it
  renders, because the image is already public on AirEvac's own site so
  republishing changes nothing about its exposure, but the question stays
  tracked.
- **One image is held outright** (`crewIsolationLoading`), on two independent
  grounds: it asserts an isolation transport capability with no clinical owner
  approval (page 6), and the isolation unit appears to contain a person, which
  would need authorization under page 10. It is currently live on
  airevacinternational.com — that is an existing exposure worth reviewing there,
  not a clearance.
- **No photo is attributed to a tail number.** No registration is legible in any
  available frame, so pairing one with N322PR or N669MD would be a fleet claim.
  A test enforces this.
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
- **UNCHANGED BY THE CHAT SHIPPING, deliberately.** Chat exists now, and it
  still publishes no response time in any state, including while a visitor is
  queued. The queue says a coordinator will join and shows the phone number; it
  does not estimate. Building the feature was never the thing that would make a
  number true.

---

## Decisions raised by the crawl of the current site

Full detail in [migration-findings.md](migration-findings.md).

| ID | Decision | Owner |
|---|---|---|
| D15 | Is `(888) 761-2253` current, and should it be published alongside `619-754-6755`? If both, which is primary? | Operations |
| D16 | Rebuild the six private cruise-island pages with operations-informed content, or let the redirects stand? | Operations and Marketing |
| D17 | Confirm the contracting entity for Terms and the Privacy Notice — the 2021 press release says "Medical Logistics Management, Inc. dba AirEvac International" | Legal |

## Decisions raised by building the chat

Opened 2026-07-30. These did not exist before there was a console, a database,
and a conversation store, and none of them is a coding question.

| ID | Decision | Owner |
|---|---|---|
| D18 | Who receives the transcript notification in production? It is pointed at a testing address today and carries a reference number with no conversation text. | Operations |
| D19 | May a coordinator discuss clinical detail in chat? Copy currently directs records to email and fax and there is no upload, but the boundary for *conversation* has not been stated. | Clinical and privacy |
| D20 | Who gets a coordinator account, and who is the administrator that creates them? Each person sets their own password on first sign-in, so no administrator knows a working password. | Operations |
| D21 | Is the audit log retention the same as the transcript retention? It records reads as well as writes, so it is evidence about staff conduct as well as about patients, and the two may warrant different periods. | Privacy and HR |
| D22 | **ANSWERED 2026-07-30: chat is staffed around the clock**, matching the phone line. Coordinators are marked available automatically on sign-in, the console warns whenever nobody is, and ops is emailed if a gap passes three minutes. What remains open is whether the *public copy* may say chat is 24/7, which is a claim and therefore needs A5 and the staffing trial behind it. | Operations |

Two findings from the same crawl need attention on the **live site**, regardless
of this project's timeline:

- `/case-managers/` promises transports "typically with **no money out of
  pocket** for the patient" — the exact claim page 24 forbids and section 12
  treats as a misleading insurance claim under the FTC Act.
- `robots.txt` advertises a `www.` sitemap while every canonical URL is non-www.
  Pick one host and 301 the other before cutover.

The crawl also recovered the likely answer to a question D10 has been waiting
on: **who signs off medical content.** A 2021 press release names Dr. Dan Quan
as Chief Medical Director and Dr. Adriana Yates as Medical Director for Florida.
If still current, that is the `reviewer` for every medical page in
`src/content/pages/**`.

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
