# Migration findings — crawl of airevacinternational.com

Crawled 2026-07-27 from the live WordPress sitemap index: **43 pages, 44 posts,
1 author archive**. This is the "Migration workbook and crawl" exit evidence for
P2, and the source for the complete map in `src/content/redirects.ts`.

Everything below is a finding about the **current live site**. Several are
compliance exposures that exist today, independent of this project.

---

## 1. Findings that need action on the live site now

### 1.1 The current site promises no out-of-pocket cost

`/case-managers/` states:

> "We can accommodate domestic and international transports **typically with no
> money out of pocket for the patient.**"

Blueprint page 24 lists among the things never to build: *"Automatic final
pricing, insurance approval, benefit guarantee, or **no-out-of-pocket
promise**."* Section 12 puts it under the FTC Act as a misleading insurance and
price claim.

The new site's governance tests fail the build if this phrasing ever appears
(`tests/content-governance.test.ts` matches `no out-of-pocket`). **But it is
live today**, and the exposure is on the current site regardless of what this
project ships. Worth raising with Legal and Revenue-cycle independently of the
launch timeline.

### 1.2 The isolation-transport photograph is published

`/patient-portal/` claims *"COVID19 patient isolation units"* and the homepage
carries a photograph of crew loading a patient isolation unit. In this
repository that image is held (`crewIsolationLoading`) pending clinical sign-off
and a check on whether the unit contains a real patient. It is live on the
current site now. See `src/content/media.ts`.

### 1.3 robots.txt points at a hostname the site does not serve

`robots.txt` declares `Sitemap: https://www.airevacinternational.com/sitemap_index.xml`
while every canonical URL is **non-www**. Whichever host is canonical, pick one
and 301 the other before cutover, or the migration will split link equity across
two hostnames.

---

## 2. Facts recovered that this project needs

| Fact | Value | Where it came from | Status |
|---|---|---|---|
| Legal entity | **Medical Logistics Management, Inc.** dba AirEvac International | Press release, 2021-07-07 | ⚠️ Not yet used. Legal pages currently say "AirEvac International". Confirm the correct contracting entity for Terms and the Privacy Notice. |
| Chief Medical Director | **Dr. Dan Quan** (Arizona) | Same press release | ⚠️ 2021 source. Confirm currency. |
| Medical Director, Florida | **Dr. Adriana Yates, M.D.** — ex-Carnival Cruise Line Ship's Physician, Medical Operations Manager, then Medical Director | Same press release | ⚠️ 2021 source. Confirm currency. |
| Second phone number | **(888) 761-2253** toll-free, alongside 619-754-6755 | `/case-managers/` | ⚠️ Not on the new site. See D15 below. |
| Arizona operations | Referenced repeatedly; explains the Scottsdale address in the legacy privacy policy | Press release, location pages | Informational |

**Why Dr. Yates matters beyond the Leadership page.** Ninety percent of
referrals come from cruise lines and hospitals, and the Florida Medical Director
was Carnival's Medical Director. That is the single strongest credential the
company has for its highest-value vertical, and it appears nowhere on the
current site outside a 2021 press release. Once confirmed current and approved,
it belongs on `/partners/cruise` and `/about/leadership`.

It also answers a question this repo has been carrying: **who signs off medical
content.** The `reviewer` field on every medical page is null pending D10; the
Medical Director is the person that field is waiting for.

---

## 3. Content structure: what was there, what we did

| Legacy | Count | Disposition |
|---|---|---|
| Core pages (company, air-ambulance, accreditation, safety-and-care, insurance, request-a-quote, case-managers, patient-portal) | 8 | Mapped to equivalents |
| Country/island location pages | 14 | Mapped to `/coverage/**` route pages |
| **US state pages** | 11 | **Not recreated.** Page 8: "Do not build thin pages for every state, city, airport, island, or diagnosis." All fold into `/coverage/united-states`. |
| **Private cruise-line island pages** | 6 | Redirected to `/partners/cruise`. See below. |
| Blog posts | 44 | No blog in phase 1. Each mapped to the page serving the same intent. |

### 3.1 The cruise-island pages: right idea, wrong execution

Six pages exist for private cruise-line islands — CocoCay (Royal Caribbean),
Castaway Cay (Disney), Half Moon Cay and Harvest Caye (Carnival), Great Stirrup
Cay (Norwegian), Ocean Cay (MSC).

**The targeting is genuinely smart.** These are private islands with limited
medical facilities where cruise passengers are injured, and cruise lines are the
number one referral source. No competitor found in the earlier research has
anything equivalent.

**The execution undermines it.** The pages are tourism copy — *"Conquer the
tallest waterslide in North America"*, *"Grab a drink at the swim-up bar"*,
*"get a taste of Bora Bora with your own Overwater Cabana"* — apparently taken
from the cruise lines' own marketing, wrapped around a boilerplate "Why choose
AirEvac" block. That is three problems at once: near-duplicate thin content,
probable copyright in the lifted descriptions, and a tone that reads as a travel
brochure on a medical transport site.

**Recommendation.** Rebuild them, for a port medical officer rather than a
holidaymaker: nearest receiving facility and its capability, the tender or
airfield access constraint, permit lead time, realistic timeline from
notification to wheels-up, and who to call. That page has no equivalent anywhere
in the market and would be a real asset for the cruise vertical. It needs
operations input, so it is not something to invent — logged as D16.

### 3.2 Blog posts

Of 44 posts, roughly ten are about air medical transport ("What is an air
ambulance", "Exploring medical repatriation", "Difference between air ambulance
and commercial airline medical escorts"). Those redirect to the matching service
or process page.

The rest are travel and tourism ("Best restaurants in Cabo San Lucas", "Cenote
diving in Mexico", "Traveling with pets in style"). Page 25 is explicit: *"Delete
or combine weak pages instead of mass-producing more."* They are not recreated.
Each redirects to the route page for its geography rather than to the homepage,
because a mass redirect to `/` is treated as a soft 404 and loses the link
equity the redirect exists to preserve.

---

## 4. Redirect map status

Complete for every URL in the sitemap. `npm run test` asserts:

- no chains — no destination is another rule's source
- every destination is locale-prefixed, so the proxy adds no second hop
- every destination resolves to a real page directory
- no duplicate sources
- all permanent (308)

Verified against a running server: every spot-checked legacy URL returns a
single 308 to a final 200.

**Still outstanding before cutover:** export the actual URL list from Search
Console rather than trusting the sitemap alone. A sitemap only lists what
WordPress chose to include; Search Console shows what Google actually has
indexed, including URLs with query strings, old category and tag archives, and
anything linked from outside that the sitemap omits.

---

## 5. New open decisions raised by this crawl

### D15 — The toll-free number
`(888) 761-2253` appears on the current site alongside `619-754-6755`. The new
site publishes only the 619 number, since the blueprint's conversion hierarchy
is built around a single primary line and the FXE airport directory confirms
that one. **Decision needed:** is the toll-free number current, and should it be
published? A US family calling from a landline may prefer it. If both are
published, decide which is primary — splitting the call-to-action weakens it.
*Owner: Operations.*

### D16 — Rebuild the cruise-island pages
Six private-island pages exist with the right targeting and the wrong content.
**Decision needed:** commission operations-informed replacements, or let the
redirects to `/partners/cruise` stand. *Owner: Operations and Marketing.*

### D17 — Confirm the legal entity for legal pages
Terms of Use and the Privacy Notice should name the contracting entity. The 2021
press release gives "Medical Logistics Management, Inc. dba AirEvac
International". **Decision needed:** confirm with Legal. *Owner: Legal.*
