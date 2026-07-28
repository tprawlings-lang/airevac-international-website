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

## Open production approvals

- AEI operations approval for the conditional 90-minute response copy.
- AEI pricing and legal approval for the Price Lock Guarantee.
- AEI privacy approval for the email and fax handling statement.
- AEI billing and legal decision on required patient and cost notices before launch.
- AEI operations approval for the two Learjet 31A public fleet statement.
