# AirEvac International — website

Phase 1 implementation of the *AirEvac International Website, Security and
Compliance Blueprint* (2026-07-27): a referral-first public site for hospital,
cruise, insurer, and family transport coordination across Mexico, the Caribbean,
and Central America.

**This site is not ready to launch.** See
[docs/readiness-matrix.md](docs/readiness-matrix.md) for what is done, what is
outstanding, and the three findings that most need attention.

---

## Quick start

```bash
npm ci
npm run dev            # http://localhost:3000 → redirects to /en
```

```bash
npm run check          # typecheck + tests + build (run this before pushing)
npm run test           # 173 unit and integration tests
npm run test:coverage  # enforces 100% coverage on the security decision paths
npx eslint .
```

Copy `.env.example` to `.env.local`. There are no secrets.

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

`CredentialCard` and `AircraftCard` call it internally and return `null` when it
fails. There is no prop, flag, or environment variable that bypasses it. A new
page that renders a credential inherits the rule automatically.

The same register generates the JSON-LD, so a claim withheld from the page is
also absent from the structured data — which is how sites usually end up
asserting an expired accreditation to search engines after removing it from the
visible page.

**What this means today:** the site publishes the two verified Learjet 31A
registrations and nothing else. NAAMTA, ARGUS, the Part 135 certificate, Learjet
35 N277MK, the 24/7 Spanish guarantee, and any response-time figure are all held
and render nowhere. EURAMI is held too, on a missing approval date only — see
D2, the highest-value single unblock on the list.

---

## Layout

```
src/
├── app/[locale]/          Routes. Locale is a path prefix; English is canonical.
│   ├── page.tsx           Homepage — the 8 blocks from blueprint section 4, in order
│   ├── request-transport/ Callback form (noindex, no analytics, no third-party code)
│   ├── partners/          Hospital · cruise · insurer referral paths
│   ├── coverage/          4 regions + 12 priority routes
│   ├── credentials/       The register's public face
│   └── legal/             Privacy · NPP · terms · accessibility · cookies
├── app/api/callback/      The only endpoint. Allowlist, PHI tripwire, rate limit
├── components/            Server components; the only client component is the form
├── content/               Typed block content — the CMS-shaped source of truth
│   ├── credentials.ts     THE CREDENTIAL AND CLAIMS REGISTER
│   ├── fleet.ts           Aircraft records, each wrapping a claim
│   └── pages/             Services · partners · patients · coverage · legal · about
├── lib/                   credential-register · intake-schema · rate-limit ·
│                          redact · inquiry-queue · structured-data · nonce · i18n
└── proxy.ts               CSP nonce and locale prefix

tests/                     173 tests. See "What the tests actually protect" below.
docs/                      Readiness matrix · open decisions · ADRs
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

**No third-party code loads anywhere on this site.** No analytics, no tag
manager, no session replay, no ad pixels, no remote fonts. `connect-src 'self'`
makes a browser-direct call to a vendor impossible by accident.

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

axe runs in CI against nine representative pages. **Manual screen-reader,
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

- a held claim (NAAMTA, ARGUS, Part 135, N277MK) becomes publishable
- any of those terms appears in page copy, where the gate cannot see it
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

---

## Documents

| | |
|---|---|
| [Readiness matrix](docs/readiness-matrix.md) | Scored status, severity, evidence, owner |
| [Open decisions](docs/open-decisions.md) | D1–D14, what the code does while each is open |
| [ADR 0001](docs/adr/0001-framework.md) | Next.js App Router |
| [ADR 0002](docs/adr/0002-content-model.md) | Typed block content, CMS-shaped |
| [ADR 0003](docs/adr/0003-rate-limiting.md) | Rate limits and their known limits |
| [ADR 0004](docs/adr/0004-security-headers.md) | CSP nonce vs static HTML |
| [ADR 0005](docs/adr/0005-localization.md) | Locale routing and the Spanish gate |

The blueprint is a build and review specification. It is not legal advice, an
accreditation certificate, a security audit, or proof that this implementation
is compliant. Launch approval requires AirEvac's legal, privacy, medical,
aviation, billing, and operations owners.
