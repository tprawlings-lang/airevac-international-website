import type { ClaimRecord } from '@/lib/credential-register';

/**
 * The credential and claims register.
 *
 * Source of truth for every regulated claim on the site. Blueprint section 1
 * (Credential, aircraft, and operating-claim verification) recorded what public
 * evidence proves as of 2026-07-27; that is reproduced faithfully below.
 *
 * EDITING RULES
 *  - `status: 'cleared'` requires the source document to be in the launch file,
 *    an owner, an approval date, a review date, and (for the two-person
 *    categories) a second approver. `publishable()` enforces all of it.
 *  - Never widen `scope` beyond the issuer's own wording. Blueprint page 6
 *    forbids "broad global accreditation or medical scopes not listed on the
 *    certificate."
 *  - `hold` and `gap` records stay in this file on purpose. Deleting them loses
 *    the audit trail of what was deliberately not published.
 *
 * Records marked `gap`/`hold` are blocked on open decisions D1–D6 in
 * docs/open-decisions.md.
 */
export const CREDENTIAL_REGISTER: readonly ClaimRecord[] = [
  {
    id: 'eurami',
    category: 'accreditation',
    // Verbatim scope from the EURAMI provider record [S1]. Do not broaden.
    scope: 'Regional Fixed Wing Air Ambulance, with Critical Care Transports endorsement',
    holder: 'Air Evac International USA',
    issuer: 'European Aeromedical Institute (EURAMI)',
    owner: 'Compliance lead',
    sourceDocument: 'EURAMI provider record, retrieved 2026-07-27 [S1]',
    verificationUrl: 'https://eurami.org/provider/air-evac-international-usa/',

    // PENDING D2: these dates record verification of the *public directory*
    // entry. They must be re-stamped against the certificate PDF itself, with
    // EURAMI's logo-use terms attached, before this renders in production.
    approvedOn: null,
    lastReviewedOn: '2026-07-27',
    expiresOn: '2027-08-25',
    secondApprover: 'Executive sponsor',
    status: 'cleared',
    note:
      'Public evidence is current through 2027-08-25. Held from render only by the ' +
      'missing approval date, which unblocks when D2 supplies the certificate and ' +
      'logo-use rules.',
  },

  {
    id: 'naamta',
    category: 'accreditation',
    scope: 'Accreditation status unresolved',
    holder: 'AirEvac International',
    issuer: 'National Accreditation Alliance of Medical Transport Applications (NAAMTA)',
    owner: 'Compliance lead',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: '2026-07-27',
    // The public directory's own "Accredited Thru" date, already in the past.
    expiresOn: '2026-03-31',
    secondApprover: null,
    status: 'hold',
    note:
      'BLOCKER (D1). NAAMTA directory says "Accredited" but shows Accredited Thru: ' +
      '2026-03-31 [S5]. Blueprint page 6: omit until renewed evidence is received. ' +
      'Do not publish the seal or the word "accredited" for NAAMTA.',
  },

  {
    id: 'argus',
    category: 'safety-rating',
    scope: 'Safety rating unverified',
    holder: 'AirEvac International',
    issuer: 'ARGUS International',
    owner: 'Director of Operations',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: '2026-07-27',
    expiresOn: null,
    secondApprover: null,
    status: 'gap',
    note:
      'BLOCKER (D3). "ARGUS Gold" appears on the current site [S7] but no current ' +
      'independent rating evidence was located. Omit until a rating report or letter ' +
      'gives the exact level, holder name, and expiry. Never present ARGUS as a ' +
      'medical accreditation.',
  },

  {
    id: 'part-135',
    category: 'certificate',
    scope: 'FAA Part 135 air carrier certificate D0JA860L',
    holder: 'Dorato Jets LLC',
    issuer: 'Federal Aviation Administration',
    owner: 'Director of Operations',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: '2026-07-27',
    expiresOn: null,
    secondApprover: null,
    status: 'gap',
    note:
      'BLOCKER (D4). The company publishes the certificate number, but the current ' +
      'certificate and OpSpecs have not been reviewed. Until they are, the site may ' +
      'not describe AirEvac as a direct certificate holder. Approved language once ' +
      'cleared (page 6): "Operated under Dorato Jets LLC certificate D0JA860L."',
  },

  {
    id: 'fort-lauderdale-base',
    category: 'coverage',
    scope: 'Operating base at Fort Lauderdale Executive Airport (FXE), Hangar 24',
    holder: 'AirEvac International',
    issuer: 'Fort Lauderdale Executive Airport business directory',
    owner: 'Director of Operations',
    sourceDocument: 'FXE business directory listing, retrieved 2026-07-27 [S4]',
    verificationUrl:
      'https://www.flyfxe.com/Home/Components/BusinessDirectory/BusinessDirectory/174/99',
    approvedOn: '2026-07-27',
    lastReviewedOn: '2026-07-27',
    expiresOn: null,
    secondApprover: null,
    status: 'cleared',
    note:
      'Address and phone confirmed by the airport directory. No expiry: a base ' +
      'location is not a dated credential. Re-review if the hangar assignment changes.',
  },

  {
    id: 'state-ems-licenses',
    category: 'license',
    scope: 'State EMS and air-ambulance licenses for each marketed base',
    holder: 'AirEvac International',
    issuer: 'State EMS authorities',
    owner: 'Compliance lead',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: null,
    expiresOn: null,
    secondApprover: null,
    status: 'gap',
    note:
      'BLOCKER (D6). Required before any coverage page asserts operating authority ' +
      'in a specific state. Coverage pages currently describe process only.',
  },

  {
    id: 'bilingual-coordination',
    category: 'statistic',
    scope: '24/7 English and Spanish flight coordination',
    holder: 'AirEvac International',
    issuer: 'AirEvac International operations',
    owner: 'Director of Operations',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: null,
    expiresOn: null,
    secondApprover: null,
    status: 'gap',
    note:
      'BLOCKER (D11). The homepage proof block wants this claim, but a 24/7 Spanish ' +
      'staffing promise needs a documented staffing and translator policy first. ' +
      'Until then the site says coordinators are reached by phone 24/7 and does not ' +
      'promise a language guarantee.',
  },

  {
    id: 'chat-response-time',
    category: 'statistic',
    scope: 'Live coordinator chat response time',
    holder: 'AirEvac International',
    issuer: 'AirEvac International operations',
    owner: 'Director of Operations',
    sourceDocument: null,
    verificationUrl: null,
    approvedOn: null,
    lastReviewedOn: null,
    expiresOn: null,
    secondApprover: null,
    status: 'gap',
    note:
      'BLOCKER (D14). Page 13: internal handoff goal is under 60 seconds, but "no ' +
      'public promise until a 30-day staffing test proves it." No response-time ' +
      'number may appear on any page until that measurement exists.',
  },
] as const;

export function findClaim(id: string): ClaimRecord | undefined {
  return CREDENTIAL_REGISTER.find((record) => record.id === id);
}
