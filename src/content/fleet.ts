import type { ClaimRecord } from '@/lib/credential-register';

/**
 * Aircraft register. Blueprint page 11 requires an aircraft record to carry
 * "tail number, model, medical configuration, status label, photos, approval
 * source, and review date."
 *
 * Each aircraft wraps a `ClaimRecord`, so the same launch gate that governs
 * accreditations governs fleet copy. An aircraft whose claim is not publishable
 * does not appear on the fleet page.
 */
export interface AircraftRecord {
  claim: ClaimRecord;

  /** FAA N-number. */
  tailNumber: string;
  model: string;
  manufacturer: string;

  /**
   * Medical configuration. `null` until the Medical Director approves specific
   * configuration copy — page 6 requires clinical claims to be owner-approved.
   */
  medicalConfiguration: string | null;

  /** Public-facing status label. Never live availability (page 24: do not build). */
  statusLabel: 'Current working fleet' | 'Under review' | 'Not in marketed fleet';

  /** FAA registry entry. */
  registrationExpiresOn: string;
  registeredOwner: string;

  /**
   * Permission-cleared photography. Empty until Marketing and Compliance clear
   * images under D12. The fleet card renders a typographic placeholder rather
   * than a stock photo — page 10 forbids generic stretcher and dramatic
   * emergency stock imagery.
   */
  photos: readonly { src: string; alt: string; permissionId: string }[];

  /**
   * False until leases, OpSpecs, and operating control are documented (D4).
   * Gates the words "owned" and "operated" everywhere in the UI. Page 6:
   * do not say "owned and operated" without those documents.
   */
  ownershipLanguageCleared: boolean;
}

const FAA_REGISTRY = 'https://registry.faa.gov/AircraftInquiry/Search/NNumberResult';

export const FLEET: readonly AircraftRecord[] = [
  {
    tailNumber: 'N322PR',
    model: 'Learjet 31A',
    manufacturer: 'Learjet Inc.',
    medicalConfiguration: null, // PENDING: Medical Director approval.
    statusLabel: 'Current working fleet',
    registrationExpiresOn: '2029-07-31',
    registeredOwner: 'N322PR LLC',
    photos: [], // PENDING D12.
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-n322pr',
      category: 'aircraft',
      scope: 'Learjet 31A, FAA registration valid, listed on the EURAMI provider record',
      holder: 'N322PR LLC',
      issuer: 'Federal Aviation Administration',
      owner: 'Director of Operations',
      sourceDocument: 'FAA Aircraft Registry N322PR, retrieved 2026-07-27 [S2]',
      verificationUrl: `${FAA_REGISTRY}?nNumberTxt=322PR`,
      approvedOn: '2026-07-27',
      lastReviewedOn: '2026-07-27',
      expiresOn: '2029-07-31',
      secondApprover: null,
      status: 'cleared',
      note:
        'Registration and model are verified. Registration alone does not establish ' +
        'the operating certificate, medical configuration, beneficial ownership, or ' +
        'Part 135 OpSpecs — see the part-135 record (D4).',
    },
  },

  {
    tailNumber: 'N669MD',
    model: 'Learjet 31A',
    manufacturer: 'Learjet Inc.',
    medicalConfiguration: null, // PENDING: Medical Director approval.
    statusLabel: 'Current working fleet',
    registrationExpiresOn: '2028-05-31',
    registeredOwner: 'DMC Aviation LLC',
    photos: [], // PENDING D12.
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-n669md',
      category: 'aircraft',
      scope: 'Learjet 31A, FAA registration valid, listed on the EURAMI provider record',
      holder: 'DMC Aviation LLC',
      issuer: 'Federal Aviation Administration',
      owner: 'Director of Operations',
      sourceDocument: 'FAA Aircraft Registry N669MD, retrieved 2026-07-27 [S3]',
      verificationUrl: `${FAA_REGISTRY}?nNumberTxt=669MD`,
      approvedOn: '2026-07-27',
      lastReviewedOn: '2026-07-27',
      expiresOn: '2028-05-31',
      secondApprover: null,
      status: 'cleared',
      note:
        'Registration and model are verified. Registration alone does not establish ' +
        'the operating certificate, medical configuration, beneficial ownership, or ' +
        'Part 135 OpSpecs — see the part-135 record (D4).',
    },
  },

  {
    tailNumber: 'N277MK',
    model: 'Learjet 35',
    manufacturer: 'Learjet Inc.',
    medicalConfiguration: null,
    statusLabel: 'Under review',
    registrationExpiresOn: '',
    registeredOwner: 'Unconfirmed',
    photos: [],
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-n277mk',
      category: 'aircraft',
      scope: 'Fleet status unresolved',
      holder: 'Unconfirmed',
      issuer: 'Federal Aviation Administration',
      owner: 'Director of Operations',
      sourceDocument: null,
      verificationUrl: null,
      approvedOn: null,
      lastReviewedOn: '2026-07-27',
      expiresOn: null,
      secondApprover: null,
      status: 'hold',
      note:
        'BLOCKER (D5). EURAMI lists Learjet 35 N277MK [S1] but the current site does ' +
        'not. AirEvac must decide whether it is active, reserve, partner-operated, or ' +
        'retired, then align EURAMI and the website. Until then it renders nowhere, ' +
        'and the site says "Learjet 31A aircraft" rather than naming a fleet size.',
    },
  },
] as const;

/** Claims from the fleet, for the combined register view and CI report. */
export const FLEET_CLAIMS: readonly ClaimRecord[] = FLEET.map((aircraft) => aircraft.claim);
