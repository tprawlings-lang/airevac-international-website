# Executive sign-off register

**What must be approved by a named person at AirEvac before this site is public.**

The site is currently a preview: it serves `noindex`, it is disallowed in
`robots.txt`, and no search engine will list it. Executives can open it, use the
chat, and see the whole product working. None of that requires the approvals
below. **All of them are required before the site is public.**

Last updated 2026-07-30.

A printable, signable version of this file is
[AirEvac_Executive_Sign_Off_Register.pdf](AirEvac_Executive_Sign_Off_Register.pdf).
This file is the source of truth; regenerate the PDF with
`python3 scripts/generate-signoff-pdf.py` whenever an item here changes.

---

## How to read this

Three columns matter: who signs, what they are signing, and what happens if
they do not. Nothing here is a formality. Every item is something the build
team deliberately did not decide, because it is not ours to decide.

**What the build team has already signed off**, and does not need AirEvac to
confirm: framework and hosting choices, security architecture, database schema,
accessibility implementation, test coverage, the redirect map, and every
engineering trade-off recorded in `docs/adr/`. Those are ours. If one is wrong,
it is our mistake to fix.

**What we deliberately have not decided** is everything below. Where we had to
pick something to keep building, we picked the cautious option and wrote the
default in the "if unsigned" column.

---

## 1. Legal and privacy

| # | Signer | What they are approving | If unsigned |
| --- | --- | --- | --- |
| L1 | Legal counsel | **Website Privacy Notice.** Currently describes the site as it is built, including what it refuses to collect. | The page renders a visible "under review, not signed off by a qualified reviewer" banner. That banner is correct and must not be removed to make the site look finished. |
| L2 | Legal counsel | **Notice of Privacy Practices.** | Same banner. |
| L3 | Legal counsel | **Terms of Use.** | Same banner. |
| L4 | Legal and privacy | **Privacy notice rewritten to describe live chat.** Both L1 and L2 currently describe a website that receives *no* clinical information. A chat makes that false within the first minute of the first conversation. | **This is a hard gate on chat going public.** Chat is enabled on the preview and must not be enabled on the production domain until this is done. |
| L5 | Legal and billing | **Whether a patient cost notice is legally required.** The previous Patient Rights and Cost Information page was removed by the July handoff; its content is archived and can be restored in an hour. | No notice is published. If one is required and absent, that is a compliance exposure rather than a missing page. |
| L6 | Privacy officer | **Business Associate Agreement covering the database.** Available on the current Render plan; a BAA is a signed contract, not a plan feature, so it must be requested and executed. | Chat stays off on production. Only test data goes in the database. |
| L7 | Privacy officer | **Retention schedule for chat transcripts** (open decision D9). The build uses a provisional 30 days. | 30 days applies and the privacy notice cannot state a number AirEvac has approved. |
| L8 | Privacy officer | **Email and fax handling of clinical documents.** The site tells people to send records to ops@aeiamericas.com or fax (619) 330-4551. Someone must confirm how those are handled and retained once received. | The instruction is published without a documented process behind it. |

## 2. Clinical

| # | Signer | What they are approving | If unsigned |
| --- | --- | --- | --- |
| C1 | Medical Director | **Named clinical reviewers** for the medical pages, with credentials, and their agreement to be publicly named. | Every medical page shows the "under review" banner. No `Person` structured data. Search engines and AI systems see no named medical authority behind the clinical content, which is a real credibility gap in this industry. |
| C2 | Medical Director | **Crew credentials and equipment claims**, if any are to be published. | The site describes *how* crews are assigned and publishes no specific certification or equipment model. |
| C3 | Medical Director | **The conditional 90-minute response wording** in the service questions. | Published as written in the July handoff, unapproved. |

## 3. Aviation and operations

| # | Signer | What they are approving | If unsigned |
| --- | --- | --- | --- |
| A1 | Director of Operations | **The public fleet statement**, "two Learjet 31A aircraft". No registration appears anywhere on the site. | Published as written in the July handoff, unapproved. |
| A2 | Director of Operations | **Certificate-holder wording**, and whether the certificate number may be published (D4). | The site says AirEvac coordinates directly with no broker in between, and claims no operating authority anywhere. |
| A3 | Director of Operations | **Route detail on the twelve route pages** — ground transfer times, hospital and discharge realities, border paperwork. Drafted from general regional knowledge, not AirEvac case files. | Live and hedged throughout, but unconfirmed. Corrections take effect the same day. |
| A4 | Director of Operations | **Service area boundaries**: which regions are routine versus case-by-case (D6). | Four regions published, with "other destinations are reviewed case by case". |
| A5 | Operations | **Chat staffing.** Chat is offered only while a coordinator is signed into the console. The blueprint required a 30-day staffing test before chat became customer-facing. | The widget tells visitors nobody is available and shows the phone number. Honest, and it undercuts the value of having chat at all. |

## 4. Compliance and credentials

| # | Signer | What they are approving | If unsigned |
| --- | --- | --- | --- |
| K1 | Compliance lead + Executive sponsor | **EURAMI accreditation publication** (D2). The record holds the exact scope, an expiry of 2027-08-25, and a public verification URL. What is missing is confirmation that the certificate itself is on file. | **The site publishes no accreditation at all** — not on the credentials page, not in structured data, not in the file AI systems read. This is the single highest-value item on this register. |
| K2 | Compliance lead | **NAAMTA** (D1): renewed certificate, or a decision to omit. | Held. Renders nowhere. The word is blocked from page copy by a test. |
| K3 | Director of Operations | **ARGUS** (D3): current rating evidence, or a decision to omit. | Held. Renders nowhere. |
| K4 | Director of Operations | **Learjet 35 status** (D5): active, reserve, partner-operated, or retired. | Held. Public copy states only the two Learjet 31As. |
| K5 | Compliance lead | **State EMS licences and marketed-base authority** (D6). | No operating-authority claim appears on any page. |

## 5. Commercial

| # | Signer | What they are approving | If unsigned |
| --- | --- | --- | --- |
| M1 | Pricing and legal | **The Price Lock Guarantee wording** on the Private Pay page. | Published as written in the July handoff, unapproved. |
| M2 | Marketing | **Analytics.** Approved in principle (A2) and built; needs a GA4 measurement ID and the privacy notice updated to match. | No measurement of any kind runs. |
| M3 | Leadership | **Photography** AirEvac has permission to publish, with anyone identifiable cleared. | Images taken from the existing WordPress site. |
| M4 | Leadership | **Profile and directory URLs** for `sameAs` structured data. | The strongest entity-corroboration signal is absent. |

---

## 6. Not sign-offs, but hard launch blockers

These are engineering or account tasks, listed so nobody assumes the register
above is the whole list.

| | What | Why it blocks |
| --- | --- | --- |
| B1 | **The transport request form delivers nowhere.** It issues a reference and emails a notification; it does not create a case in any system of record. | A visitor can submit a request that reaches no queue. Either connect an approved intake system or remove the form and lead with phone and email. A form that silently reaches nobody is worse than no form. |
| B2 | **Rate limiting is single-instance and in memory.** | The documented limits are not the effective limits behind more than one instance. Must move to the CDN or WAF, and the edge must strip inbound `X-Forwarded-For`. |
| B3 | **The custom domain is not attached.** | The site answers on an `onrender.com` address. Indexing it would teach search engines a URL that is going to change. |
| B4 | **Manual accessibility testing has not been done.** Automated axe checks pass on 17 pages; screen-reader, keyboard-matrix, and 400% zoom review by a human have not happened. | Automated tooling catches roughly a third of WCAG failures. The accessibility statement says so rather than claiming conformance nobody verified. |
| B5 | **Chat runs on one instance only.** Messages fan out through an in-process bus. | A second instance would leave each side of a conversation seeing only their own messages, which looks like the other person stopped replying. Lifting this is a known change to Postgres `LISTEN`/`NOTIFY`. |

---

## 7. What is safe to demonstrate today

Everything. The preview is `noindex` and disallowed to crawlers, so nothing on
it reaches the public or a search engine.

Specifically safe to show executives:

- The full public site, in English and Spanish.
- The coordinator console: sign-in, user management, the audit log.
- **Live chat, end to end**, including the queue, claiming, replying, and the
  transcript notification.
- **Translation**, using clearly marked placeholder text until AWS is
  connected. It reads `[TEST TRANSLATION ES to EN] ... [NOT A REAL
  TRANSLATION]`, which is deliberately impossible to mistake for a real one.

Two things behave differently on the production domain, in code rather than by
instruction, so a demo configuration cannot leak into a launch:

- Chat is **off by default** on `airevacinternational.com` and **on by
  default** everywhere else.
- Stub translation is **refused entirely** on the production domain.

---

## 8. Sign-off record

| Item | Signed by | Role | Date |
| --- | --- | --- | --- |
| | | | |

Print, sign, and keep with the launch file. An item without a name on it is not
approved, whatever was said in a meeting.
