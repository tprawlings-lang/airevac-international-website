# AirEvac International — website

Phase 1 implementation of the *AirEvac International Website, Security and
Compliance Blueprint* (2026-07-27): a referral-first public site for hospital,
cruise, insurer, and family transport coordination across Mexico, the Caribbean,
and Central America.

Since built to the blueprint, the site has absorbed two further specifications:
the **AEI Sample Site Coding Change Handoff** (2026-07-27), which reshaped the
content, contact model, and fleet language, and the **AI Searchability Coding
Handoff** (2026-07-30), which added crawler policy, structured data, and
retrieval content.

**This site is not ready to launch.** Everything coding owns is done. What
remains is facts, approvals, and account access that only AirEvac can supply.
See [Before launch](#before-launch) below, and
[docs/readiness-matrix.md](docs/readiness-matrix.md) for scored detail.

---

## Quick start

```bash
npm ci
npm run dev            # http://localhost:3000 → redirects to /en
```

```bash
npm run check          # typecheck + tests + build (run this before pushing)
npm run test           # 234 unit and integration tests across 8 files
npm run test:coverage  # enforces 100% coverage on the security decision paths
npx eslint .
```

Browser-driven checks. Each needs the site running (`npm start`), and each
exits non-zero on failure so CI can gate on it:

```bash
npm run test:a11y         # axe, 17 pages, WCAG 2.2 AA tags, 0 serious/critical
npm run test:crawlers     # 16 pages x 7 crawler agents vs a browser baseline
npm run test:vitals       # LCP / CLS / TBT against the performance budget
npm run test:nav          # dropdown open, hover, idle-close, keyboard
npm run test:screenshots  # 320 / 375 / 768 / 1024 / 1440
```

Copy `.env.example` to `.env.local`. There are no secrets in the repository.
Two optional variables change behaviour when set:

| Variable | Effect when set |
|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Activates measurement, and only then does the CSP admit the analytics beacon host. Absent, no third-party request is made and the strict policy stands. |
| `INDEXNOW_KEY` | Enables IndexNow submission, and only on the production origin. |
| `DATABASE_URL` | Enables the coordinator console. Absent, the site runs without one and migrations skip. |
| `CHAT_ENABLED` | Overrides the default. Chat is **on** by default on any preview and **off** by default on the production origin, so it stays off there until the BAA is executed and someone opts in deliberately. |
| `TRANSLATION_MODE` | `off` disables translation; `stub` forces visibly marked placeholder translations. The stub is the default on a preview whenever AWS is unconfigured, and is refused outright on the production origin. |

---

## The one rule that shapes this codebase

Blueprint page 2, the non-negotiable launch rule:

> No badge, license, fleet, insurance, safety, response-time, clinical, or
> coverage claim goes live without an owner, source document, approval date,
> review date, and expiration date in the credential and claims register.

This is **enforced in code**, not by review discipline.

`src/lib/credential-register.ts` exposes `publishable(record, now)`. It returns
false unless the record has an owner, a source document, an approval date, a
review date, a valid unexpired expiry, and — for accreditations, certificates,
safety ratings, licences, and clinical claims — a second approver who is a
different person from the owner.

`CredentialCard` calls it internally and returns `null` when it fails. There is
no prop, flag, or environment variable that bypasses it. A new page that renders
a credential inherits the rule automatically.

The same register generates the JSON-LD **and `/llms.txt`**, so a claim withheld
from the page is absent from the structured data and from the file AI systems
read — which is how sites usually end up asserting an expired accreditation to
search engines after removing it from the visible page.

**What this means today: the site publishes no accreditation at all.** NAAMTA,
ARGUS, the Part 135 certificate, the reserve Learjet 35, the 24/7 Spanish
guarantee, and any response-time figure are held and render nowhere.

EURAMI is held on a **missing approval date only**. Its scope, its expiry
(2027-08-25), and a public verification URL are already on file; what is absent
is the certificate itself (D2). This is the single highest-value unblock on the
list: an accreditation from a named body with a verifiable third-party URL is
the strongest corroboration signal the site could carry, and it currently
appears nowhere.

**Fleet language.** Public copy is model and quantity only — "two Learjet 31A
aircraft". Registrations appear nowhere in `src/` or in built HTML, enforced by
a source scan in CI. The registration-to-internal-reference mapping lives in
`docs/fleet-register.md`, which is not published.

---

## Layout

```
src/
├── app/[locale]/          Routes. Locale is a path prefix; English is canonical.
│   ├── page.tsx           Homepage, in the AEI handoff's section 04 order
│   ├── request-transport/ Callback form (noindex, never measured, no third-party code)
│   ├── partners/          One merged referral page (hospital · cruise · insurer)
│   ├── coverage/          4 regions + 12 route pages + other-destinations
│   ├── resources/         Glossary (DefinedTermSet markup)
│   ├── credentials/       The register's public face
│   └── legal/             Privacy · NPP · terms · accessibility · cookies
├── app/api/callback/      The only endpoint. Allowlist, PHI tripwire, rate limit
├── app/robots.ts          Search vs training crawler policy, per named agent
├── app/llms.txt/          Generated site map for AI systems; obeys the claim gate
├── components/            Server components; the client ones are the form,
│                          the nav menu, and the (inert) analytics listener
├── content/               Typed block content — the CMS-shaped source of truth
│   ├── credentials.ts     THE CREDENTIAL AND CLAIMS REGISTER
│   ├── fleet.ts           Masked aircraft records, each wrapping a claim
│   ├── navigation.ts      Nav tree + PRIORITY_ROUTES with per-route detail
│   └── pages/             Services · partners · patients · coverage · legal ·
│                          about · fleet · glossary
├── lib/                   credential-register · intake-schema · rate-limit ·
│                          redact · inquiry-queue · structured-data · analytics ·
│                          indexnow · nonce · i18n
└── proxy.ts               CSP nonce and locale prefix

tests/                     234 tests in 8 files. See "What the tests protect".
scripts/                   a11y · crawler access · web vitals · nav · screenshots ·
                           coastline generation · IndexNow · handoff PDFs
docs/                      Readiness matrix · open decisions · ADRs ·
                           completion report · the two AirEvac handback PDFs
```

---

## Data boundaries

The public layer is built so that protected health information cannot reach it.

**The callback form** accepts exactly the fields blueprint page 12 permits:
contact name, organization, role, origin, destination, timeframe, phone, email,
preferred language, callback consent, and a 280-character logistics note.

There is no diagnosis field, no patient name, no date of birth, no record
number, no insurance ID, and no file upload. The server schema is `.strict()`,
so adding an input without changing the schema produces a validation error
rather than a silent PHI pathway. A separate tripwire runs *before* validation
and names any PHI-shaped key, so a clinical submission is logged as a privacy
event rather than a generic 400 — field names only, never values.

**Logging.** Every server log goes through `safeLog`, which redacts name,
organization, phone, email, origin, destination, and note. Role, timeframe, and
language survive, because those are what operations queries on and none
identifies a person. A lint rule bans direct `console` in `src/`.

**No third-party code loads unless measurement is explicitly configured.**
AirEvac approved GA4 (decision A2), and it activates only when
`NEXT_PUBLIC_GA4_MEASUREMENT_ID` is present. With no ID — the current state —
nothing third-party loads, no cookie is set, and `connect-src 'self'` makes a
browser-direct call to a vendor impossible by accident.

When an ID is set, three things move together by construction, because all
three read the same variable: the measurement layer activates, the CSP admits
the beacon host in `connect-src` and `img-src` only, and the privacy notice's
wording is accurate. `script-src` is never widened; the nonce and
`strict-dynamic` carry the loader without any host allowlist.

The tag is configured against GA4's defaults: `anonymize_ip` on, Google signals
and ad personalization **off** (that setting is what would turn visitors to an
air ambulance site into a medical-interest advertising audience), and
`send_page_view` off so page views route through the same path rules as every
other event. There is no session replay, and there should not be.

`UNMEASURED_PATHS` in `src/lib/analytics.ts` enforces the privacy notice's
promise that nothing is measured on the transport request form. `categoryOf`
deliberately reduces `/en/coverage/mexico/cancun` to `coverage`: a single
family's transport from one island is identifiable when combined with timing,
and an analytics property is not the place to hold that.

### ⚠️ The form does not deliver anywhere yet

`recordInquiry` mints a reference, records the idempotency key, and logs an
acceptance event. **It does not persist or notify.** This is deliberate — D7
(JetInsight), D8 (intake vendor), and D9 (retention schedule) are open, and
writing contact details into an unapproved store would create exactly the
Sensitive PII record that section 9 says must live in an encrypted,
retention-bounded system chosen first.

**Operationally: the phone line is the delivery mechanism.** The site must not
go live presenting the form as a working channel. When the vendor is chosen,
replace the body of `recordInquiry` — its signature, its idempotency contract,
and every caller stay the same.

---

## Discoverability and AI retrieval

Built to the AI Searchability Coding Handoff. The premise it states plainly, and
this codebase agrees with: coding owns eligibility, access, clarity, structure,
and speed. **No code can make an answer engine recommend AirEvac.** That comes
from independent listings, references, press, and real client feedback, which
are business actions.

**Crawler policy** (`src/app/robots.ts`) names agents in two groups, because
they answer different questions:

- **Search and answer engines** — Googlebot, Bingbot, OAI-SearchBot,
  ChatGPT-User, Claude-SearchBot, ClaudeBot, Claude-User, PerplexityBot,
  DuckDuckBot. Blocking any of these removes AirEvac from that engine's results.
- **Model training** — GPTBot, Google-Extended, Applebot-Extended, CCBot,
  meta-externalagent. **Allowed**, per decision A1, so a model can describe
  AirEvac without searching at the moment it is asked. Blocking them would not
  affect search visibility.

  ⚠️ **This one is not fully reversible.** Content collected into a training
  corpus cannot be withdrawn from a model already trained on it. Re-blocking
  stops future collection only.

The disallow list is repeated in every group deliberately: a crawler obeys only
its most specific matching group and ignores the wildcard, so a named group
without those paths would *grant* that crawler the secure flow the wildcard
forbids. A test asserts it.

**robots.txt states intent, not access.** A CDN rule or bot challenge can serve
a crawler a 403 or an empty shell while a browser sees the real page, and
nothing in the code would reveal it. `npm run test:crawlers` fetches real URLs
as each agent and compares status, text volume, H1, canonical, structured data,
and indexability against a browser baseline.

**Structured data** is generated from the same registries the pages render from:
a linked WebSite + WebPage + BreadcrumbList graph on every page, Organization
with the gated credentials, Service on the three service pages, FAQPage from
each page's own visible questions, and DefinedTermSet on the glossary with a
resolvable `@id` per term. A question that is not rendered cannot be marked up.

**`/llms.txt`** is generated, never hand-written — a stale map is worse than
none. It includes a "notes for answer engines" section stating what must not be
said on AirEvac's behalf: no response time, no price, no insurance outcome, no
operating-authority claim.

**`/resources/glossary`** is the most safely citable page on the site.
Definitional content carries no capability claim, so it can be quoted in full
without misrepresenting the company.

**IndexNow** submits only URLs changed within the sitemap lookback window, and
stays dormant unless `INDEXNOW_KEY` is set *and* the origin is production, so a
preview deploy cannot ask to be indexed. Note that Google does not participate;
this reaches Bing and, through it, Microsoft Copilot.

---

## Before launch

Everything the build team owns is complete and verified. What follows is owned
by AirEvac, and the site should not go public until each is closed.

**[docs/executive-sign-off-register.md](docs/executive-sign-off-register.md) is
the authoritative list**: twenty-five numbered items, each with a named signer,
what they are approving, and what the site does while it is unsigned. It also
states plainly what is safe to demonstrate today, which is everything, because
the preview is `noindex` and disallowed to crawlers. The printable version to
put in front of a signer is
[AirEvac_Executive_Sign_Off_Register.pdf](docs/AirEvac_Executive_Sign_Off_Register.pdf)
(regenerate with `python3 scripts/generate-signoff-pdf.py`).

Two handback documents track the same ground in non-technical language:
[Facts and Approvals Still Required](docs/AirEvac_Facts_and_Approvals.pdf) and
[Sign-Ups and Accounts Required](docs/AirEvac_Signups_and_Accounts.pdf)
(revision 2.0, regenerate with `python3 scripts/generate-handoff-pdfs.py`).

### Blockers — the site must not go live with these open

| | What is needed | Why it blocks |
|---|---|---|
| **The form does not deliver** | D7/D8/D9: intake vendor with a BAA, retention schedule, and delivery path. | A visitor could submit a transport request that reaches nobody. Either wire delivery or remove the form and lead with phone and email. |
| **Rate limiting is single-instance** | Move to the CDN/WAF, and have the edge strip inbound `X-Forwarded-For`. | In-memory counters multiply by replica count, so the documented limits are not the effective limits. See [ADR 0003](docs/adr/0003-rate-limiting.md). |
| **No legal page is approved** | D10: legal sign-off on privacy, NPP, and terms, plus the billing and legal decision on patient cost notices. | All three render an "under review" banner today. That banner is correct and must not be removed to look finished. |
| **Custom domain not attached** | DNS records at the registrar pointing at Render, and a decision between `www` and non-`www`. | The site is on an `onrender.com` address. Until the real domain is live and canonical, indexing it would train search engines on a URL that is going to change. |
| **Manual accessibility testing not done** | Screen-reader, keyboard-matrix, and 400% zoom review by a human. | axe covers roughly a third of WCAG failures. The accessibility statement says so rather than claiming conformance nobody verified. |
| **Chat has no BAA and no matching privacy notice** | An executed Business Associate Agreement covering the database (L6), and a privacy notice rewritten to describe a site that receives clinical information (L4). | Chat is on by default on previews and off by default on production for exactly this reason. The published privacy notice currently says the site receives no clinical information, which a chat makes false in the first minute. |
| **Chat runs on one instance only** | Move fan-out from the in-process bus to Postgres `LISTEN`/`NOTIFY` before scaling past `numInstances: 1`. | A second instance would leave each side of a conversation seeing only their own messages, which reads as the other person having stopped replying. |

### Unblocks that materially change the result

| | What is needed | Effect while open |
|---|---|---|
| **EURAMI certificate (D2)** | The certificate itself, to set `approvedOn`. Scope, expiry, and a public verification URL are already on file. | **The largest single AI-trust unlock available.** The site currently publishes no accreditation anywhere — not on the page, not in JSON-LD, not in `/llms.txt`. |
| **GA4 measurement ID** | Create the property; set `NEXT_PUBLIC_GA4_MEASUREMENT_ID`. | No measurement of any kind. Approved and wired; waiting only on the ID. |
| **Clinical reviewer identities (F3)** | Named reviewers with credentials, willing to be published. | Medical pages show "under review" banners, no `Person` schema, and guide articles are not worth publishing without one. |
| **`sameAs` profile URLs** | Confirmed current profile and directory URLs. | The strongest entity-corroboration property is absent from Organization schema. |
| **Route detail confirmation (F5)** | Operations read-through of the twelve route pages. | Ground, hospital, and paperwork detail is live but drafted from regional knowledge rather than AEI case data. |
| **Search Console and Bing** | Verify the domain; submit the sitemap. | No visibility into what is indexed or what is broken. |
| **Google Business Profile** | Claim and verify, for the KFXE base only. | A named, verified business location is a strong corroboration signal. Do not create listings for destinations served. |
| **Photography (F6)** | Images AirEvac has permission to publish, people cleared. | Current images came from the old WordPress site. |

### Already done

Render is on a paid production instance, so the site no longer sleeps and
crawler and 2 a.m. caller alike get a warm response. The redirect map is
complete from a full crawl of the old site and verified one-hop. Analytics,
IndexNow, and the crawler policy are built and waiting only on the inputs above.

---

## Security

Strict CSP with a per-response nonce, `strict-dynamic`, `object-src 'none'`,
`base-uri 'none'`, `frame-ancestors 'none'`, plus HSTS, nosniff, DENY,
Referrer-Policy, COOP/CORP, and a restrictive Permissions-Policy.

**Read [ADR 0004](docs/adr/0004-security-headers.md) before changing anything
about rendering.** A nonce only works on dynamically rendered HTML. An earlier
iteration served a textbook-perfect CSP header over statically prerendered
pages — every header scan passed, and every inline script in the served document
would have been blocked in a real browser. CI now fetches documents and asserts
the nonce on the scripts matches the nonce in the header, because a header scan
cannot catch that.

Rate limits use the blueprint's starting thresholds. **They are in-memory and
single-instance** — see [ADR 0003](docs/adr/0003-rate-limiting.md). Before
launch this must move to the CDN/WAF, and the edge must strip inbound
`X-Forwarded-For`.

---

## Accessibility

Target: WCAG 2.2 AA. Keyboard-operable throughout, a visible focus ring that is
never removed and never obscured by the mobile call bar, uncapped zoom, real
labels, an error summary that receives focus on submit, `<details>`-based
navigation and FAQ that work without JavaScript, and reduced motion honoured
globally.

axe runs in CI against 17 representative pages, both locales. **Manual screen-reader,
keyboard-matrix, and 400% zoom testing has not been done**, and the accessibility
statement says so rather than claiming a conformance nobody has verified.

---

## Bilingual content

English is canonical. Spanish UI chrome is translated as a draft (D11).

Medical, legal, insurance, and coverage body copy renders a
"translation pending" notice in Spanish rather than machine translation —
blueprint page 24 forbids unreviewed automatic translation of exactly that
content. The notice always offers a Spanish-speaking coordinator by phone and a
link to the reviewed English page.

The emergency notice is the one deliberate exception and *is* translated:
withholding an emergency instruction from a Spanish reader is more dangerous
than shipping one sentence ahead of formal sign-off.

---

## What the tests actually protect

`npm run test` is not a smoke test. It fails the build if:

- a held claim (NAAMTA, ARGUS, Part 135, the reserve Learjet 35) becomes publishable
- any of those terms appears in page copy, where the gate cannot see it
- an aircraft registration appears anywhere in `src/` or `public/`
- an em dash or a retired phrasing appears in source (AEI handoff §16)
- a credential is missing evidence, an approval, or a second approver
- an expired credential still renders, or an unparseable date slips through
- the intake schema accepts an unknown or PHI-shaped field
- callback consent can be satisfied by anything other than an affirmative check
- a log line or an API response echoes submitted data
- a duplicate submission creates a second transport case
- structured data asserts a claim the page withholds
- a page promises coverage, a price, or a response time *in our own voice*
  (pages may still warn against such promises — the check is sentence-scoped and
  negation-aware, with a test guarding the guard)
- Spanish content renders without a recorded human review
- a navigation link, content page, or redirect destination does not resolve
- the redirect map grows a chain
- a dictionary key exists in one locale but not the other
- a route page becomes a template with the place name swapped in (each of the
  twelve must stay >50% textually unique against the other eleven)
- a page opens without a substantive answer in its first block
- structured data marks up a question the page does not render
- a named crawler group loses the disallow list, which would *grant* that
  crawler the secure flow
- measurement reaches the transport request form
- **a source file exists on disk but is not committed** — see below

---

### The bug that motivated `tests/repo-integrity.test.ts`

`.gitignore` carried a bare `coverage` entry, meant for istanbul output. Git
matches that pattern at any depth, so it also matched
`src/app/[locale]/coverage/` — the entire coverage route tree. Those four pages
compiled, rendered, and passed every route test, because all of those read the
working directory. They had never been committed, so the deployed site returned
a hard 404 for every region, country, and route link.

Filesystem-based tests cannot catch that class of bug by construction. The
repo-integrity test asks **git** instead: every route and source module on disk
must actually be in the repository.

---

## Contributing

1. `npm run check` must pass.
2. New regulated claims go in `src/content/credentials.ts` with full evidence, or
   they do not go live. Do not delete a held record — the hold is the audit
   trail.
3. New form fields require a schema change, and the schema change requires a
   test. If the field could carry PHI, the answer is the protected channel, not
   this form.
4. Medical, legal, and insurance content needs `reviewer` and `reviewedOn`, or it
   renders an "under review" banner. That banner is correct — do not remove it to
   make a page look finished.
5. Spanish translations need `esReviewedOn`. A test enforces this.
6. Route page detail describes tendencies, never commitments, and never
   operating authority, price, or response time. A test enforces this too.
7. Structured data is generated from rendered content. Never hand-write JSON-LD:
   that is how a page ends up telling a crawler something it does not say.

---

## Documents

| | |
|---|---|
| [Executive sign-off register](docs/executive-sign-off-register.md) | **Every approval required before the site is public**, with named signers |
| [Sign-off register (PDF)](docs/AirEvac_Executive_Sign_Off_Register.pdf) | The same register, printable and signable |
| [Readiness matrix](docs/readiness-matrix.md) | Scored status, severity, evidence, owner |
| [Open decisions](docs/open-decisions.md) | D1–D14, what the code does while each is open |
| [Handoff completion report](docs/handoff-completion-report.md) | Sign-off matrix for both handoffs, conflicts, open approvals |
| [Facts and Approvals](docs/AirEvac_Facts_and_Approvals.pdf) | Handback: documents, names, and sign-offs AirEvac owes |
| [Sign-Ups and Accounts](docs/AirEvac_Signups_and_Accounts.pdf) | Handback: Google, Bing, DNS, and profile actions |
| [Fleet register](docs/fleet-register.md) | Internal registration mapping. Not published. |
| [Coordinator chat plan](docs/plans/coordinator-chat-plan.md) | Live chat and console. Phases A, B, and C built and exercised end to end |
| [AWS Translate setup](docs/aws-translate-setup.md) | **Ready to action.** BAA, IAM policy, env vars, verification |
| [Testing on Render](docs/testing-on-render.md) | **Start here to try the chat.** Works without AWS |
| [ADR 0001](docs/adr/0001-framework.md) | Next.js App Router |
| [ADR 0002](docs/adr/0002-content-model.md) | Typed block content, CMS-shaped |
| [ADR 0003](docs/adr/0003-rate-limiting.md) | Rate limits and their known limits |
| [ADR 0004](docs/adr/0004-security-headers.md) | CSP nonce vs static HTML |
| [ADR 0005](docs/adr/0005-localization.md) | Locale routing and the Spanish gate |

The blueprint is a build and review specification. It is not legal advice, an
accreditation certificate, a security audit, or proof that this implementation
is compliant. Launch approval requires AirEvac's legal, privacy, medical,
aviation, billing, and operations owners.
