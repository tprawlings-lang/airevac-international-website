import type { ClaimRecord } from '@/lib/credential-register';

/**
 * Aircraft register.
 *
 * PUBLIC COPY IS MODEL AND QUANTITY ONLY. The AEI change handoff (G-03, G-04)
 * removes every registration and tail number from public content and from site
 * source. The identifying details this file previously carried inline now live
 * in docs/fleet-register.md, keyed by the internal refs below. The register
 * still exists so the launch gate keeps working: the publishable count drives
 * the "two Learjet 31A aircraft" statement, and the reserve airframe stays held
 * (open decision D5) without being named anywhere.
 */
export interface AircraftRecord {
  claim: ClaimRecord;

  /** Key into docs/fleet-register.md. Never rendered. */
  internalRef: string;
  model: string;
  manufacturer: string;

  /** Public-facing status label. Never live availability. */
  statusLabel: 'Current working fleet' | 'Under review' | 'Not in marketed fleet';

  /**
   * False until leases, OpSpecs, and operating control are documented (D4).
   * Gates the words "owned" and "operated" everywhere in the UI.
   */
  ownershipLanguageCleared: boolean;
}

export const FLEET: readonly AircraftRecord[] = [
  {
    internalRef: 'AC-31A-1',
    model: 'Learjet 31A',
    manufacturer: 'Learjet Inc.',
    statusLabel: 'Current working fleet',
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-31a-1',
      category: 'aircraft',
      scope: 'Learjet 31A, registration verified against the FAA registry',
      holder: 'Registration on file',
      issuer: 'Federal Aviation Administration',
      owner: 'Director of Operations',
      sourceDocument: 'FAA registry check 2026-07-27; details in docs/fleet-register.md (AC-31A-1)',
      verificationUrl: null,
      approvedOn: '2026-07-27',
      lastReviewedOn: '2026-07-27',
      expiresOn: '2029-07-31',
      secondApprover: null,
      status: 'cleared',
      note:
        'Registration and model verified; identifying details are held in the internal ' +
        'fleet register per the AEI handoff. Registration alone does not establish the ' +
        'operating certificate or Part 135 OpSpecs (D4).',
    },
  },

  {
    internalRef: 'AC-31A-2',
    model: 'Learjet 31A',
    manufacturer: 'Learjet Inc.',
    statusLabel: 'Current working fleet',
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-31a-2',
      category: 'aircraft',
      scope: 'Learjet 31A, registration verified against the FAA registry',
      holder: 'Registration on file',
      issuer: 'Federal Aviation Administration',
      owner: 'Director of Operations',
      sourceDocument: 'FAA registry check 2026-07-27; details in docs/fleet-register.md (AC-31A-2)',
      verificationUrl: null,
      approvedOn: '2026-07-27',
      lastReviewedOn: '2026-07-27',
      expiresOn: '2028-05-31',
      secondApprover: null,
      status: 'cleared',
      note:
        'Registration and model verified; identifying details are held in the internal ' +
        'fleet register per the AEI handoff. Registration alone does not establish the ' +
        'operating certificate or Part 135 OpSpecs (D4).',
    },
  },

  {
    internalRef: 'AC-35-R',
    model: 'Learjet 35',
    manufacturer: 'Learjet Inc.',
    statusLabel: 'Under review',
    ownershipLanguageCleared: false,
    claim: {
      id: 'aircraft-35-reserve',
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
        'BLOCKER (D5). The EURAMI provider record lists a Learjet 35 (registration in ' +
        'docs/fleet-register.md, AC-35-R) that the site does not. AirEvac must decide ' +
        'whether it is active, reserve, partner-operated, or retired. Until then it ' +
        'renders nowhere, and public copy states only the two Learjet 31A aircraft.',
    },
  },
] as const;

/** Claims from the fleet, for the launch gate and derived counts. */
export const FLEET_CLAIMS: readonly ClaimRecord[] = FLEET.map((aircraft) => aircraft.claim);
