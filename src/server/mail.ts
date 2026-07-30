import { safeLog } from '@/lib/redact';

/**
 * Outbound email.
 *
 * WHAT MAY BE SENT THROUGH HERE, AND WHAT MAY NOT.
 *
 * Notifications: yes. "A chat transcript is ready, case AE-..., open it in the
 * console." A reference and a link carry no patient information.
 *
 * Transcripts, message bodies, clinical detail: NO, and not by policy alone.
 * `assertNoPhiShape` below inspects every outgoing body and refuses to send one
 * that looks clinical. The reasoning is in docs/plans/coordinator-chat-plan.md
 * section 4.5: an email cannot be deleted on a retention schedule, cannot be
 * audited for who read it, and cannot be stopped from being forwarded. Sending
 * a transcript converts a controlled record into an uncontrolled one.
 *
 * THE CURRENT RECIPIENT IS A TESTING ADDRESS. `OPS_NOTIFICATION_EMAIL` is set
 * to a personal inbox during testing, at AirEvac's direction. Two consequences
 * follow and neither is hypothetical:
 *
 *   1. A personal consumer mailbox is not covered by a Business Associate
 *      Agreement. Nothing resembling patient information may be routed there,
 *      which is exactly what the guard below enforces.
 *   2. Callback-form notifications DO contain ordinary personal data: a name, a
 *      phone number, and the cities involved. That is acceptable for test
 *      submissions and is not acceptable for real enquiries. Before this site
 *      accepts real traffic, the recipient must move to the operations mailbox.
 *
 * NO SDK. Sending is an HTTPS POST, so a provider integration is a fetch call
 * and a dependency here would be a supply-chain risk in the path that carries
 * case notifications.
 */

export interface MailMessage {
  subject: string;
  /** Plain text. No HTML: nothing sent from here needs formatting. */
  body: string;
  /** Defaults to OPS_NOTIFICATION_EMAIL. */
  to?: string;
}

export type MailOutcome =
  | { sent: true; provider: 'resend' }
  | { sent: false; reason: 'unconfigured' | 'no_recipient' | 'rejected' | 'blocked_phi_shape' };

/**
 * Patterns that must never appear in an outgoing message.
 *
 * Deliberately blunt, and deliberately biased toward false positives: the cost
 * of refusing to send a notification is that someone opens the console instead,
 * and the cost of a miss is patient information in an uncontrolled mailbox.
 * Those are not comparable, so this errs hard in one direction.
 */
const PHI_SHAPED = [
  /\bdiagnos/i,
  /\bpatient (name|is|was|has)\b/i,
  /\bdate of birth\b/i,
  /\bDOB\b/,
  /\bmedical record\b/i,
  /\bMRN\b/,
  /\binsurance (id|number|policy)\b/i,
  /\bpassport\b/i,
  /\bICU\b/,
  /\bventilat/i,
  /\bintubat/i,
  /\bsurgery\b/i,
  /\bfracture/i,
  /\bstroke\b/i,
  /\bcardiac\b/i,
  /\bsedat/i,
  /\bprognosis\b/i,
  // A transcript would carry speaker labels.
  /^(visitor|coordinator):/im,
];

export function assertNoPhiShape(text: string): { ok: boolean; matched?: string } {
  for (const pattern of PHI_SHAPED) {
    if (pattern.test(text)) return { ok: false, matched: pattern.source };
  }
  return { ok: true };
}

/**
 * Sends a message, or explains why it did not.
 *
 * NEVER THROWS. A failed notification must not fail the request that triggered
 * it: a visitor submitting a callback form should get their confirmation
 * whether or not the mail provider is reachable, and a chat should close
 * cleanly even if the notification does not go out. Failures are logged so they
 * are visible rather than silent.
 */
export async function sendMail(message: MailMessage): Promise<MailOutcome> {
  const to = message.to ?? process.env.OPS_NOTIFICATION_EMAIL ?? '';
  if (to === '') {
    safeLog('warn', 'mail.no_recipient', { subject: message.subject });
    return { sent: false, reason: 'no_recipient' };
  }

  const guard = assertNoPhiShape(`${message.subject}\n${message.body}`);
  if (!guard.ok) {
    /*
     * The pattern is logged, never the body. A log line quoting the text that
     * tripped a PHI check would put that text in the logs, which is the thing
     * the check exists to prevent.
     */
    safeLog('error', 'mail.blocked_phi_shape', { pattern: guard.matched });
    return { sent: false, reason: 'blocked_phi_shape' };
  }

  const apiKey = process.env.RESEND_API_KEY ?? '';
  const from = process.env.MAIL_FROM ?? 'AirEvac Website <onboarding@resend.dev>';

  if (apiKey === '') {
    /*
     * Unconfigured is a working state, not an error. The subject and recipient
     * are logged so a developer can see that a notification would have gone
     * out, and the body is withheld because this path is also used by the chat.
     */
    safeLog('info', 'mail.unconfigured_would_send', { subject: message.subject, to });
    return { sent: false, reason: 'unconfigured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject: message.subject, text: message.body }),
    });

    if (!response.ok) {
      safeLog('error', 'mail.rejected', { status: response.status, subject: message.subject });
      return { sent: false, reason: 'rejected' };
    }

    safeLog('info', 'mail.sent', { subject: message.subject });
    return { sent: true, provider: 'resend' };
  } catch (error) {
    safeLog('error', 'mail.failed', { message: (error as Error).message });
    return { sent: false, reason: 'rejected' };
  }
}
