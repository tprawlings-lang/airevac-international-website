# ARCHIVED: Patient Rights and Cost Information page

Removed from the public site per the AEI Sample Site Coding Change Handoff
(Section 14) on 2026-07-27. The route 301s to Insurance and Payment.

**Production gate, per the handoff:** "AEI billing and legal owners must decide
where required federal or state notices appear before launch. Do not discard
the source material." This file is that source material. It is not built, not
in the sitemap, not in navigation, and not indexed.

The page described, from CMS's own public guidance: federal surprise-billing
protections for air ambulance services, the Good Faith Estimate right for
uninsured and self-pay patients, the dispute path when a bill substantially
exceeds an estimate, what patients can always ask AEI for (written estimate,
itemised bill, claim status, bill review), and links to the authoritative CMS
pages:

- cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills
- cms.gov/nosurprises/policies-and-resources/overview-of-rules-fact-sheets

The full drafted copy is preserved in git history at
`src/content/pages/patients.ts` prior to commit "Apply the AEI sample site
change handoff" (see `git log --follow -- src/content/pages/patients.ts`).

NOTE FOR LAUNCH REVIEW: the No Surprises Act remains applicable to air
ambulance billing (blueprint section 12). Removing the page from the sample
does not remove the obligation; it defers the placement decision to AEI's
billing and legal owners. The Good Faith Estimate flow also disappeared from
Private Pay in the same handoff (replaced by the Price Lock Guarantee), so at
launch the required notices have no home anywhere on the site until this
decision is made.
