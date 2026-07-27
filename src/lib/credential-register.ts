/**
 * Blueprint page 2, the non-negotiable launch rule:
 *
 *   "No badge, license, fleet, insurance, safety, response-time, clinical, or
 *    coverage claim goes live without an owner, source document, approval date,
 *    review date, and expiration date in the credential and claims register."
 *
 * This module is the machine enforcement of that rule. Every regulated claim in
 * the site renders through `publishable()`. A record that is missing evidence,
 * missing an approval, or past its expiry returns `false` and the component
 * renders nothing — there is no prop, flag, or environment variable that
 * overrides it.
 *
 * The gate is deliberately a pure function of (record, now) so the launch
 * behaviour is unit-testable and identical in every environment.
 */

/** Who is accountable for a claim. Maps to the RACI table on blueprint page 26. */
export type ClaimOwner =
  | 'Medical Director'
  | 'Director of Operations'
  | 'Compliance lead'
  | 'Revenue-cycle lead'
  | 'HIPAA privacy owner'
  | 'Security or technology owner'
  | 'Marketing owner'
  | 'Executive sponsor';

/**
 * Publication status.
 *
 * - `cleared`   Evidence is in the launch file and approvals are recorded.
 * - `hold`      Evidence is absent, expired, or contradictory. Never renders.
 * - `gap`       Known to be needed, not yet collected. Never renders.
 */
export type ClaimStatus = 'cleared' | 'hold' | 'gap';

export type ClaimCategory =
  | 'accreditation'
  | 'aircraft'
  | 'certificate'
  | 'safety-rating'
  | 'license'
  | 'clinical'
  | 'statistic'
  | 'coverage';

/**
 * Categories where blueprint page 17 requires two-person approval before
 * publishing: "Credential, privacy, insurance, medical, and legal pages require
 * two-person approval before publishing."
 */
const TWO_PERSON_CATEGORIES: ReadonlySet<ClaimCategory> = new Set([
  'accreditation',
  'certificate',
  'safety-rating',
  'license',
  'clinical',
]);

export interface ClaimRecord {
  /** Stable key used by content and tests. */
  id: string;
  category: ClaimCategory;

  /** Exactly what the issuer's document says. Never a marketing paraphrase. */
  scope: string;

  /** Legal entity the credential is issued to. */
  holder: string;

  /** Issuing body. */
  issuer: string;

  /** Accountable owner from the RACI table. */
  owner: ClaimOwner | null;

  /** Reference to the retained source document in the launch file. */
  sourceDocument: string | null;

  /** Public verification link, where the issuer publishes one. */
  verificationUrl: string | null;

  /** ISO date the responsible owner approved the publication language. */
  approvedOn: string | null;

  /** ISO date of the most recent review. */
  lastReviewedOn: string | null;

  /** ISO expiry. `null` means the credential genuinely does not expire. */
  expiresOn: string | null;

  /**
   * Second approver for categories in TWO_PERSON_CATEGORIES.
   * Must differ from `owner`.
   */
  secondApprover: ClaimOwner | null;

  status: ClaimStatus;

  /**
   * Why a record is on hold or in gap. Rendered in the internal register view
   * and in the compliance report — never on a public page.
   */
  note?: string;
}

/** Days before expiry at which the compliance owner is notified (page 24). */
export const EXPIRY_NOTICE_DAYS = [120, 90, 60, 30] as const;

const MS_PER_DAY = 86_400_000;

function parseUtcDate(iso: string): number | null {
  // Reject anything that is not a plain ISO calendar date. A malformed date must
  // fail closed rather than coerce to NaN and slip past a comparison.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(time) ? null : time;
}

/**
 * Whole days from `now` until `expiresOn`.
 * Negative once expired. `null` when the record has no expiry or a bad date.
 */
export function daysUntilExpiry(record: ClaimRecord, now: Date): number | null {
  if (record.expiresOn === null) return null;
  const expiry = parseUtcDate(record.expiresOn);
  if (expiry === null) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((expiry - today) / MS_PER_DAY);
}

/** True once the credential's own expiry date has passed. */
export function isExpired(record: ClaimRecord, now: Date): boolean {
  const days = daysUntilExpiry(record, now);
  return days !== null && days < 0;
}

/**
 * Every reason a record is not publishable. Empty array means publishable.
 *
 * Returning reasons rather than a bare boolean lets the internal register and
 * the CI compliance report explain *what* is missing, which is what turns the
 * gate from an obstacle into a work list.
 */
export function blockingReasons(record: ClaimRecord, now: Date): string[] {
  const reasons: string[] = [];

  if (record.status !== 'cleared') {
    reasons.push(`Status is "${record.status}", not "cleared".`);
  }
  if (record.owner === null) reasons.push('No accountable owner recorded.');
  if (record.sourceDocument === null) reasons.push('No source document in the launch file.');
  if (record.approvedOn === null) reasons.push('No approval date recorded.');
  if (record.lastReviewedOn === null) reasons.push('No review date recorded.');

  // An explicit expiry is mandatory. `null` is allowed only as a deliberate
  // "does not expire" statement, so it is accepted here but must be justified in
  // `note`. Anything unparseable is treated as missing.
  if (record.expiresOn !== null && parseUtcDate(record.expiresOn) === null) {
    reasons.push(`Expiry date "${record.expiresOn}" is not a valid ISO date.`);
  } else if (isExpired(record, now)) {
    reasons.push(`Expired on ${record.expiresOn}.`);
  }

  if (TWO_PERSON_CATEGORIES.has(record.category)) {
    if (record.secondApprover === null) {
      reasons.push(`Category "${record.category}" requires a second approver.`);
    } else if (record.secondApprover === record.owner) {
      reasons.push('Second approver must be a different person from the owner.');
    }
  }

  return reasons;
}

/**
 * The launch gate. A claim renders publicly only when this returns true.
 *
 * `now` is injected so that expiry is evaluated at request time in production
 * and at a fixed instant in tests. Callers in app code pass `new Date()`.
 */
export function publishable(record: ClaimRecord, now: Date): boolean {
  return blockingReasons(record, now).length === 0;
}

/** Filters a register down to the records that may render publicly. */
export function publishableRecords(records: readonly ClaimRecord[], now: Date): ClaimRecord[] {
  return records.filter((record) => publishable(record, now));
}

export interface ExpiryNotice {
  record: ClaimRecord;
  daysRemaining: number;
  /** The 120/90/60/30 threshold this record has crossed. */
  threshold: (typeof EXPIRY_NOTICE_DAYS)[number];
}

/**
 * Records inside an expiry notice window (page 24: "notify owners 120, 90, 60
 * and 30 days before expiry"). Consumed by the CI compliance report so an
 * upcoming expiry surfaces as a build warning, not as a page that silently
 * empties itself on the expiry date.
 */
export function expiryNotices(records: readonly ClaimRecord[], now: Date): ExpiryNotice[] {
  const notices: ExpiryNotice[] = [];

  for (const record of records) {
    const daysRemaining = daysUntilExpiry(record, now);
    if (daysRemaining === null || daysRemaining < 0) continue;

    // Tightest window the record currently falls inside.
    const threshold = [...EXPIRY_NOTICE_DAYS]
      .sort((a, b) => a - b)
      .find((days) => daysRemaining <= days);

    if (threshold !== undefined) {
      notices.push({ record, daysRemaining, threshold });
    }
  }

  return notices.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
