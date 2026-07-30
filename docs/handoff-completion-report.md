# Coding Completion Report

Required handback for the **AirEvac Sample Site Coding Change Handoff, Revision
1.0, July 27, 2026** (Section 17 format). Implemented 2026-07-28.

## Completion summary

| Field | Coding agent response |
| --- | --- |
| Branch or commit | `claude/air-evac-website-6c03r7` (this commit) |
| Framework and build command | Next.js 16 App Router, TypeScript. `npm run build`; tests `npx vitest run`; serve `npx next start`. |
| Preview URL | https://airevac-international-website.onrender.com (redeploy latest commit via Render Manual Deploy) |
| Changed file list | See "Changed files" below and the commit diff. |
| Deleted route list | `/services/commercial-medical-escort`, `/partners/hospitals`, `/partners/cruise`, `/partners/insurance` (merged into `/partners`), `/patient-rights`, `/fleet/medical-equipment`, `/patients-families/travel-and-family-support`. Added: `/partners` (single page), `/coverage/other-destinations`. |
| Added redirect file or configuration | `src/content/redirects.ts` ("Routes removed by the AEI handoff" section): each removed route redirects from the unprefixed, `/en`, and `/es` forms in a single 308 hop to its final destination. Chained legacy destinations updated so no chain exists (verified by test and by curl). |
| Tests run | `npx vitest run`: 181/181 pass, including new "AEI handoff source scans" suite (em dash, tail number, retired phrasings, required phrasings). ESLint clean. `npm run build` clean. `scripts/a11y-audit.mjs`: 17/17 pages, zero serious/critical axe issues. `scripts/nav-behaviour-check.mjs`: 12/12. Rendered-HTML scan of all 56 pages (28 routes x 2 locales): all 200, no em dash, no tail number, no retired phrasing, no IATA code. |
| Known remaining issue | None blocking. Open production approvals listed below must close before public launch (this is a sample build for executive review). |

## Change signoff matrix

| Area | Status | File references | Evidence |
| --- | --- | --- | --- |
| Global em dash and tail-number sweep | PASS | all of `src/`, `public/` | CI scan in `tests/content-governance.test.ts` ("AEI handoff source scans"); rendered-HTML grep over 56 pages clean. Registrations survive only in `docs/fleet-register.md` (internal, per G-03) and nowhere in `src/`. |
| Homepage and map | PASS | `src/app/[locale]/page.tsx`, `src/components/graphics/CoverageMap.tsx`, `src/content/airports.ts`, `src/content/coastlines.ts` | Section order matches Section 04 items 1-8. Exact Section 05 copy for Focused Coverage, clinical intake, guarantee language, bottom contact block. Map: ICAO labels only, base KFXE, MHRO + MDPP added, SJD/PVR removed, east frame keeps Puerto Rico / Lesser Antilles / DR visible; screenshots at 320/375/768/1024/1440. |
| Services and FAQ | PASS | `src/content/pages/services.ts` | Three service pages; "Next Steps" lists; bed-acceptance callout and FAQ (exact copy); conditional 90-minute response FAQ (exact copy); "We cannot guarantee insurance payment."; commercial-alternative sentence deleted (S-06). |
| Critical Care Transport | PASS | `src/content/pages/services.ts` | C-01..C-05 applied; no equipment-model claims; no escort references. |
| For Partners merge | PASS | `src/content/pages/partners.ts`, `src/app/[locale]/partners/page.tsx`, `src/content/navigation.ts` | Single `/partners` page with the exact 5-step process and both FAQs; nav renders For Partners as a direct link (no dropdown); old partner routes 308 to `/partners`. |
| How It Works, Insurance, Private Pay | PASS | `src/content/pages/patients.ts`, `src/components/ProcessSteps.tsx` | 6-stage process with email/fax document step and Complete Documents and Financial Clearance before confirmation (H-06/H-07 exact copy); insurance I-01..I-05 applied; Private Pay carries the Price Lock Guarantee exact copy; Good Faith Estimate and denied-claim content removed. |
| Coverage and Other Destinations | PASS | `src/content/pages/coverage.ts`, `src/app/[locale]/coverage/page.tsx`, `src/app/[locale]/coverage/other-destinations/page.tsx` | Region cards fully clickable (reported defect fixed); Other Destinations page with exact "Ask About Another Location" copy; "reviewed case by case" language present; United States listed as a service area (H-02). |
| Deleted pages and redirects | PASS | `src/content/redirects.ts`, `next.config.ts` | All removed routes 308 once to a final page in all three URL forms; no chains (asserted by tests + curl one-hop check). |
| Responsive and accessibility review | PASS | `scripts/a11y-audit.mjs`, `scripts/screenshot-check.mjs` | axe (WCAG 2.2 AA tags): 0 serious/critical across 17 representative pages; screenshots at 5 widths show all required map labels without overlapping page copy; map has a visible text alternative listing every airport and service area. |
| Build and route tests | PASS | `tests/`, `npm run build` | 181 tests green, build green, every nav link / legal link / priority route resolves, dictionary parity holds in both locales. |

## Changed files

- **Homepage**: `src/app/[locale]/page.tsx` (audience selector removed; hero phone+email; fleet statement; Next Steps; Focused Coverage; revised insurance copy; clinical intake block; ContactBlock closing).
- **Content**: `src/content/pages/{services,partners,patients,coverage,fleet,legal,about}.ts`, `src/content/{site,dictionary,navigation,airports,fleet,credentials,redirects}.ts`.
- **Components**: `ProcessSteps`, `ContactBlock`, `SiteHeader`, `SiteFooter`, `NavMenu`, `VerifiedFacts`, `CoverageMap`, `IntakeForm`, `not-found`. Deleted: `AircraftCard`, `ReferralSelector`, `SecureChatButton`.
- **Routes**: deleted `partners/[slug]`, `patient-rights`; added `partners/page.tsx`, `coverage/other-destinations/page.tsx`.
- **Docs**: `docs/fleet-register.md` (internal registration mapping), `docs/archive/patient-rights-and-cost-info.md` (archived page content).
- **Tests/scripts**: handoff source scans added; fleet and viewBox tests updated; a11y/nav/screenshot scripts updated for the new routes.

## Conflicts with prior specification (handoff wins; recorded per Section 01)

1. **Tail numbers vs. blueprint launch file.** The original blueprint's approved
   fleet copy named both registrations. Handoff G-03/G-04 forbids any public
   registration; the launch-gate register now runs on masked internal refs and
   the mapping moved to `docs/fleet-register.md`.
2. **90-minute response copy vs. D14.** The blueprint barred publishing response
   times until a 30-day measurement. The handoff's conditional "standard
   response time" FAQ copy is published verbatim; operations approval remains
   open (below).
3. **Price Lock Guarantee vs. FTC caution.** The blueprint's no-guarantee rule
   is narrowed: the promise-pattern test now allowlists the exact Price Lock
   Guarantee sentence while still catching any other guarantee claim.
4. **PHI by email/fax vs. protected channel.** The blueprint routed clinical
   records through an approved secure channel (D8). The handoff replaces this
   with email/fax instructions; privacy approval for that statement is open.
5. **Patient Rights / Good Faith Estimate removal vs. No Surprises Act
   posture.** The page content is archived, not lost
   (`docs/archive/patient-rights-and-cost-info.md`) pending AEI's billing and
   legal decision on required notices.
6. **I-04 not applicable.** The membership/employer-plan item had no matching
   content in this build; nothing to remove.
7. **"Common Questions" mapping.** The handoff's FAQ heading requirements were
   applied to the air-ambulance service FAQ, the closest existing block.
8. **308 vs. 301.** The handoff says "301"; this build issues 308 (permanent,
   method-preserving), the modern equivalent Next.js emits for
   `permanent: true`. Link equity treatment is identical.

## Follow-up: coverage routes (2026-07-28)

Two things happened after the handoff pass.

**A packaging defect, fixed.** `.gitignore` carried a bare `coverage` entry for
istanbul output. Git matches that at any depth, so it also matched
`src/app/[locale]/coverage/`, and the four coverage route files were never
committed. They compiled, rendered, and passed the route-integrity tests
locally, because those read the working directory. The deployed site had no
coverage routes at all: every region, country, and route link returned a hard
404. The ignore rule is now anchored to the repository root, the files are
committed, and `tests/repo-integrity.test.ts` asks git rather than the
filesystem whether every route and source module is present.

**Route pages deepened.** Each of the twelve priority routes now carries three
authored, route-specific sections in addition to the existing context and
airport blocks:

- **Getting to the aircraft** — road distances and travel times from the areas
  where patients are actually treated, island first-legs, ramp and handling
  realities at the departure field.
- **Hospitals, discharge, and the account** — local treatment patterns,
  where tertiary capacity sits, and the account-settlement step that most often
  sets the timeline.
- **Documents and border paperwork** — travel documents, consular replacement
  of a lost or hospital-held passport, ship-held document sets for cruise
  cases, and the customs and permit work our coordinators handle.

Rules enforced in `tests/content-governance.test.ts`: tendencies rather than
commitments, no operating-authority claim in any jurisdiction (D6 is open), no
price, no response time, no named partner or receiving-hospital relationship,
and every route at least 50% textually unique so no page is a template with the
name swapped in (current range 58% to 92%).

**These route specifics are drafted from general regional knowledge and are not
yet confirmed by AEI.** They are the kind of thing an operations lead can
verify quickly, and they should be verified before launch. This is added to the
approvals list below.

## Follow-up: AI Searchability Coding Handoff (2026-07-30)

Items 1 through 7 of the agreed build plan, implemented against the AI Search
Coding Handoff (Revision of 2026-07-30). Two companion documents were produced
for AirEvac and are not in this repository: *Required Inputs and Approvals*
(decisions A1 to A7 and fact sets F1 to F7) and *External Accounts and Platform
Setup* (DNS, Render, Search Console, Bing, Google Business Profile).

**Architecture decision.** The handoff prefers static generation. This build
stays server-rendered: the strict CSP issues a per-response nonce (ADR 0004),
which static output cannot carry. Crawlers receive identical complete HTML
either way, and the Core Web Vitals budget passes with room to spare, so the
handoff's underlying goal is met without weakening the CSP.

| Handoff item | Implementation |
| --- | --- |
| §4 Crawler policy | `src/app/robots.ts` names ten search and answer-engine crawlers explicitly (adding `ChatGPT-User`, `Claude-User`, `PerplexityBot`, and `DuckDuckBot`, which the handoff omits) and blocks three training-only crawlers (`GPTBot`, plus `Google-Extended` and `Applebot-Extended`, which the handoff omits). The disallow list is repeated in every group because a crawler obeys only its most specific group; asserted in tests. |
| §4 Access vs permission | `scripts/crawler-access-check.mjs` fetches 16 pages as each of 7 agents and compares status, text volume, H1, canonical, structured data, and indexability against a browser baseline. 112/112 pass. This is the check robots.txt cannot substitute for. |
| §7 Structured data | `pageGraphJsonLd` emits a linked WebSite + WebPage + BreadcrumbList `@graph` on every page via the reusable `PageGraph` component; `serviceJsonLd` adds Service with `areaServed` read from the published coverage regions; `faqPageJsonLd` generates FAQPage from the page's own visible FAQ blocks. No offers, ratings, review markup, or LocalBusiness on destinations. |
| §6 Opening answer | Audited all 18 content pages. Three opened with a bare list or definition set and answered nothing: How It Works, Why AirEvac, and Flight Medical Team now open with a direct prose answer. A test enforces a minimum opening on every page. |
| §5 IndexNow | `src/lib/indexnow.ts`, the key-file route, and `scripts/indexnow-submit.mjs`, which submits only URLs whose sitemap `lastmod` falls in the lookback window. Dormant until `INDEXNOW_KEY` is set **and** the origin is production, so a preview deploy cannot ask to be indexed. Note: Google does not participate in IndexNow. |
| §9 Analytics | `src/lib/analytics.ts` and `AnalyticsListener`, implementing the handoff's exact event list and answer-engine referral classification. **Disabled** behind `FEATURES.analytics`. One delegated listener derives events from `tel:`/`mailto:` hrefs, so phone and email links stay plain anchors that work without JavaScript. `categoryOf` discards the route slug deliberately. |
| §8 Performance | `lighthouserc.json` with the handoff's thresholds for pipelines that run Lighthouse CI, plus `scripts/web-vitals-check.mjs`, which measures LCP, CLS, and TBT directly in the installed browser. 6/6 pages inside budget (LCP under 250ms, CLS 0.000, TBT under 30ms). |

**Also fixed while auditing:** the services landing page still said "Four
transport types" after the July 27 handoff reduced them to three.

**Not implemented, with reasons.** The handoff's proposed URL scheme
(`/air-ambulance/`, `/destinations/`) is not adopted: it explicitly allows
different labels provided the information model is structured, and renaming
would invalidate the verified redirect map. Its page list restores pages the
July 27 change handoff removed (escort, equipment, cost, separate hospital and
case-manager sections); the newer company-approved document governs, pending
confirmation as item A5. A headless CMS is deferred pending item A7: content
currently lives behind publication gates that block unapproved claims
automatically, and moving it to a CMS moves it outside those gates.

## Follow-up: approvals applied (2026-07-30)

AirEvac approved the changes needed to maximize AI searchability and
recommendability. Applied:

- **A1, crawler policy.** Model-training crawlers are now allowed alongside
  search crawlers (`GPTBot`, `Google-Extended`, `Applebot-Extended`, plus
  `CCBot` and `meta-externalagent`), on the reasoning that a model trained on
  these pages can describe AirEvac without searching at the moment it is asked.
  The two groups stay separately listed in `src/app/robots.ts` because they
  answer different questions. **Recorded trade-off:** content collected into a
  training corpus cannot be withdrawn from a model already trained on it;
  re-blocking later stops future collection only. Acceptable because every
  published page is gated marketing copy and the secure flow stays disallowed
  to every agent.
- **A2, measurement.** GA4 is wired and activates on the presence of
  `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, rather than on a hardcoded boolean, so the
  code, the CSP, and the privacy notice cannot drift apart. Configured with
  `anonymize_ip`, Google signals and ad personalization off, and
  `send_page_view: false`. The CSP relaxes `connect-src` and `img-src` only
  when an ID is present; `script-src` is untouched because the nonce and
  `strict-dynamic` carry the loader without any host allowlist. Session replay
  is not implemented and should not be. The privacy notice was rewritten to
  describe this accurately, and `UNMEASURED_PATHS` enforces its promise that
  nothing is measured on the transport request form.

New work in service of AI retrieval, built only from already-published,
already-gated content:

- **`/llms.txt`** generated from the same registries the pages render from,
  including a "notes for answer engines" section that states plainly what must
  not be said on AirEvac's behalf: no response time, no price, no insurance
  outcome, no operating-authority claim. Accreditations pass through
  `publishable()` here exactly as on the page.
- **`/resources/glossary`** with `DefinedTermSet` markup and a resolvable
  `@id` per term. Twenty definitions of the vocabulary the site uses in passing
  and explains only in context (bed acceptance, financial clearance, fit to
  fly, technical stop, ground leg). Definitional content carries no capability
  claim, so it can be quoted in full without misrepresenting AirEvac, which
  makes it the most safely citable page on the site.
- **Organization schema enriched** with `description`, `knowsAbout`,
  `areaServed`, and `faxNumber`. `sameAs` is deliberately absent: see below.

### Still blocked, and why approval does not unblock it

A blanket approval authorizes changes. It does not supply facts, and the
following cannot be published without them. Each is a one-line change once the
underlying document or list exists.

| Item | What is missing | Effect |
| --- | --- | --- |
| **EURAMI accreditation** | `approvedOn` is null pending D2: the certificate PDF itself, not the public directory entry. The scope, expiry (2027-08-25), and a public verification URL are already on file. | **The single largest AI-trust unlock available.** An accreditation from a named body with a verifiable URL is the strongest corroboration signal this site could carry, and it currently renders nowhere: not on the page, not in JSON-LD, not in llms.txt. |
| `sameAs` profiles | Confirmed current URLs for AirEvac's own profiles and directory listings. | Removes the strongest entity-corroboration property from Organization schema. |
| Clinical reviewer identities (F3) | Named reviewers willing to be published, with credentials. | Medical pages render "under review" banners; no `Person` schema; guide articles are not worth publishing without a reviewer per handoff §13. |
| Route operational detail (F5) | Operations read-through of the twelve route pages. | Content is live but unconfirmed. |
| Domestic service page (A6) | Whether AirEvac accepts domestic-only transports, and the operational facts. | No page published. |

## Handback documents (revision 2.0, 2026-07-30)

The revision 1.0 pair is superseded. Regenerate both with
`python3 scripts/generate-handoff-pdfs.py`.

| Document | Audience | Covers |
| --- | --- | --- |
| `docs/AirEvac_Facts_and_Approvals.pdf` | Leadership, operations, clinical, legal | The EURAMI certificate (led, because it outweighs everything else), six fact sets, launch-tied approvals, the undelivered form, the domestic-page decision, and the authority-building work no code can do. |
| `docs/AirEvac_Signups_and_Accounts.pdf` | Whoever owns the accounts | DNS and custom domain, Search Console, Bing Webmaster, Google Business Profile, Bing Places, the GA4 measurement ID, listing consistency, and the access checklist. |

Changes from revision 1.0: Render hosting is complete (paid production
instance), decisions A1 and A2 are approved and applied so they are no longer
asks, and the GA4 measurement ID is now an account item rather than a decision.
`README.md` carries the same content as a "Before launch" section for the
engineering audience.

## Open production approvals

- AEI operations approval for the conditional 90-minute response copy.
- AEI pricing and legal approval for the Price Lock Guarantee.
- AEI privacy approval for the email and fax handling statement.
- AEI billing and legal decision on required patient and cost notices before launch.
- AEI operations approval for the two Learjet 31A public fleet statement.
- AEI operations confirmation of the per-route ground, hospital, and paperwork
  detail on the twelve priority route pages (`PRIORITY_ROUTES` in
  `src/content/navigation.ts`). Drafted from general regional knowledge, not
  from AEI case data.
