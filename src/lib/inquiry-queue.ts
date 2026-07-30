import type { PublicIntake } from '@/lib/intake-schema';
import { safeLog } from '@/lib/redact';
import { assertNoPhiShape, sendMail } from '@/server/mail';

/**
 * Inquiry acceptance and idempotency.
 *
 * Blueprint section 14:
 *   "Every inquiry and downstream write carries a unique idempotency key and
 *    visible status to prevent duplicate case creation."
 *   "Secure contact RTO 15 minutes; RPO 5 minutes for accepted inquiries. Queue
 *    only encrypted minimal requests."
 *
 * ============================ SCOPE BOUNDARY =============================
 * This module is the SEAM, not the system of record. It intentionally does not
 * persist contact details anywhere durable, because doing so requires decisions
 * that are still open:
 *
 *   D8  the approved secure intake vendor (BAA, encryption, audit, retention)
 *   D9  the approved retention and deletion schedule
 *   D7  whether and how JetInsight receives website data
 *
 * Writing a coordinator's name and callback number into an unapproved store
 * would create exactly the "Sensitive PII" record that section 9 says must live
 * in an encrypted, minimized, retention-bounded system - before that system has
 * been chosen. So the current implementation mints an inquiry ID, records the
 * idempotency key, and sends an email notification. Nothing is persisted.
 *
 * WHAT THIS MEANS OPERATIONALLY TODAY: the phone line is still the delivery
 * mechanism. An email notification is not a case queue - nobody is paged by it,
 * it has no acknowledgement, and it does not survive a full mailbox. The form
 * must not be presented as a working channel until D7/D8/D9 close, and the
 * confirmation screen accordingly tells the visitor to call if the case is
 * time-critical.
 *
 * When the vendor is chosen, replace `recordInquiry`'s body with the adapter
 * call. The signature, the idempotency contract, and every caller stay the same.
 * =========================================================================
 */

export interface InquiryResult {
  /** Reference the coordinator and the visitor can both quote. */
  inquiryId: string;
  /** True when this key was already accepted - no second case was created. */
  duplicate: boolean;
}

/**
 * Idempotency window. Section 14 sets RPO at 5 minutes for accepted inquiries;
 * 24 hours comfortably covers a visitor retrying a failed submit, a browser
 * back-navigation resubmit, and a mobile network handover.
 */
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Bounded so a flood of unique keys cannot grow memory without limit. */
const MAX_KEYS = 20_000;

interface SeenKey {
  inquiryId: string;
  expiresAt: number;
}

/**
 * In-memory only, and deliberately so - see the scope boundary above. This must
 * become the approved store's own idempotency mechanism before launch; a
 * single-instance map does not survive a restart or span replicas, which is a
 * launch blocker tracked in docs/readiness-matrix.md.
 */
const seen = new Map<string, SeenKey>();

/**
 * Human-quotable reference. Format: AE-YYYYMMDD-XXXXXX.
 *
 * Random suffix from `crypto.randomUUID`, not a counter: a sequential ID would
 * leak daily inquiry volume to anyone who submitted two forms, which is
 * commercially sensitive and serves no operational purpose.
 */
function mintInquiryId(now: Date): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `AE-${date}-${suffix}`;
}

function sweep(now: number): void {
  for (const [key, value] of seen) {
    if (value.expiresAt <= now) seen.delete(key);
  }
  if (seen.size > MAX_KEYS) seen.clear();
}

/**
 * Accepts an inquiry, or returns the existing reference for a repeated key.
 *
 * `intake` is accepted in full so the eventual adapter has what it needs, but
 * nothing identifying is retained or logged here today.
 */
export async function recordInquiry(
  intake: PublicIntake,
  now: Date = new Date(),
): Promise<InquiryResult> {
  const nowMs = now.getTime();
  sweep(nowMs);

  const existing = seen.get(intake.idempotencyKey);
  if (existing !== undefined && existing.expiresAt > nowMs) {
    return { inquiryId: existing.inquiryId, duplicate: true };
  }

  const inquiryId = mintInquiryId(now);
  seen.set(intake.idempotencyKey, {
    inquiryId,
    expiresAt: nowMs + IDEMPOTENCY_WINDOW_MS,
  });

  /*
   * Delivery. Section 14 (Circuit breaker / fallback): staff must be able to
   * see that an inquiry arrived even when no case system is connected.
   *
   * THIS IS EMAIL NOTIFICATION, NOT A CASE RECORD. The blueprint's requirement
   * for a durable, retention-bounded store (D7/D8/D9) is still open and this
   * does not close it: nothing here persists. It exists so that a submission
   * during testing reaches a person rather than only a log line.
   *
   * WHAT IS IN THE MESSAGE. The fields the form already allowlists: role,
   * timeframe, language, cities, and a callback name and number. That is
   * ordinary personal data, and the intake schema's tripwire guarantees it
   * carries no patient detail. It is going to a testing mailbox at AirEvac's
   * direction; see the recipient note in src/server/mail.ts, which must change
   * before the site accepts real enquiries.
   *
   * `await`ed rather than fired and forgotten so the response is not sent
   * before the notification has been attempted, and `sendMail` never throws, so
   * a mail outage cannot fail a visitor's submission.
   */
  /*
   * The note is the one free-text field on the form, so it is the one field
   * that can carry clinical detail regardless of what the label asks for.
   *
   * It is screened separately rather than left to the check inside `sendMail`.
   * That check refuses the whole message, which is right for a chat transcript
   * and wrong here: dropping the entire notification because a worried relative
   * wrote "broken leg" would mean nobody learns the enquiry arrived at all. So
   * a note that looks clinical is withheld and the notification still goes,
   * carrying the reference and the callback number - which is what a
   * coordinator needs to pick up the phone.
   */
  const note = intake.note ?? '';
  const noteIsSafe = note !== '' && assertNoPhiShape(note).ok;
  const noteLine =
    note === ''
      ? '(none)'
      : noteIsSafe
        ? note
        : '(withheld: the note looked clinical, so it was not emailed. ' +
          'Call the sender back using the number above.)';

  await sendMail({
    subject: `Callback request ${inquiryId} (${intake.role})`,
    body: [
      `A callback request was submitted on the AirEvac website.`,
      ``,
      `Reference:    ${inquiryId}`,
      `From:         ${intake.contactName}`,
      `Role:         ${intake.role}`,
      `Organization: ${intake.organization !== '' ? intake.organization : 'not given'}`,
      `Phone:        ${intake.phone}`,
      `Email:        ${intake.email !== '' ? intake.email : 'not given'}`,
      `Route:        ${intake.originCity} to ${intake.destinationCity}`,
      `Timeframe:    ${intake.timeframe}`,
      `Language:     ${intake.preferredLanguage}`,
      ``,
      `Note from the sender:`,
      noteLine,
      ``,
      `This form does not create a case record, and nothing about it is stored.`,
      `The phone line remains the delivery mechanism until an approved intake`,
      `system is connected.`,
    ].join('\n'),
  });

  safeLog('info', 'inquiry.accepted', {
    inquiryId,
    role: intake.role,
    timeframe: intake.timeframe,
    preferredLanguage: intake.preferredLanguage,
  });

  return { inquiryId, duplicate: false };
}

/** Test-only reset. Not reachable from any route. */
export function __resetInquiries(): void {
  seen.clear();
}
