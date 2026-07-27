import type { PublicIntake } from '@/lib/intake-schema';
import { safeLog } from '@/lib/redact';

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
 * in an encrypted, minimized, retention-bounded system — before that system has
 * been chosen. So the current implementation mints an inquiry ID, records the
 * idempotency key, and logs a non-identifying acceptance event.
 *
 * WHAT THIS MEANS OPERATIONALLY TODAY: the phone line is the delivery mechanism.
 * The form is not connected to a coordinator queue and must not be presented as
 * if it were until D7/D8/D9 close. The UI reflects this — the confirmation
 * screen tells the visitor to call if the case is time-critical.
 *
 * When the vendor is chosen, replace `recordInquiry`'s body with the adapter
 * call. The signature, the idempotency contract, and every caller stay the same.
 * =========================================================================
 */

export interface InquiryResult {
  /** Reference the coordinator and the visitor can both quote. */
  inquiryId: string;
  /** True when this key was already accepted — no second case was created. */
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
 * In-memory only, and deliberately so — see the scope boundary above. This must
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

  // Section 14 (Circuit breaker / fallback): staff must be able to see that an
  // inquiry arrived even when no downstream system is connected. This is the
  // alert seam — wire it to the on-call channel when D8 closes.
  safeLog('info', 'inquiry.accepted_pending_delivery', {
    inquiryId,
    role: intake.role,
    timeframe: intake.timeframe,
    preferredLanguage: intake.preferredLanguage,
    deliveryConnected: false,
  });

  return { inquiryId, duplicate: false };
}

/** Test-only reset. Not reachable from any route. */
export function __resetInquiries(): void {
  seen.clear();
}
