import { chatIsStaffed } from '@/server/chat/presence';
import { sendMail } from '@/server/mail';
import { safeLog } from '@/lib/redact';

/**
 * Watches whether anybody is actually signed in to answer chat.
 *
 * WHY THIS EXISTS. AirEvac staffs coordinators around the clock, so the
 * expected state is "someone is available" at every hour of every day. The
 * failure this guards against is therefore not an empty office; it is a full
 * office where nobody clicked the switch, or where the last person to leave
 * closed the tab that was holding the window open. From the outside those look
 * identical to an unstaffed service: the widget stops offering chat and shows
 * the phone number, quietly and correctly, and nobody inside learns that it
 * did.
 *
 * The widget behaving well is exactly what makes this necessary. A feature that
 * degrades silently degrades unnoticed.
 *
 * THREE MINUTES, chosen by AirEvac. Short enough that a forgotten shift is
 * caught while it still matters, long enough to sit out a normal handover where
 * one coordinator signs out a moment before the next signs in.
 *
 * ONE ALERT PER GAP, not one per check. An alert that repeats every minute
 * teaches people to filter it, and the second copy carries no information the
 * first did not. The flag clears when somebody becomes available, so the next
 * gap alerts again.
 */

/** How long chat may be unstaffed before anyone is told. */
const UNSTAFFED_ALERT_AFTER_MS = 3 * 60 * 1000;

/**
 * Gap state, held in memory.
 *
 * SAME SINGLE-INSTANCE CONSTRAINT as the chat event bus, and it fails in the
 * tolerable direction: a restart mid-gap restarts the clock, so the alert is
 * late rather than absent or duplicated. Persisting it would mean a table and a
 * migration to hold two fields that matter for three minutes. If chat ever runs
 * on more than one instance this moves to Postgres alongside the bus, and the
 * note in render.yaml covers both.
 */
let unstaffedSince: number | null = null;
let alertedForThisGap = false;

export interface StaffingCheck {
  staffed: boolean;
  /** Milliseconds chat has been unstaffed, or null when somebody is available. */
  unstaffedForMs: number | null;
  alertSent: boolean;
}

/**
 * One pass of the watch. Safe to call on a timer or on demand.
 *
 * NEVER THROWS. It runs from a background timer with nobody to catch it, and an
 * unhandled rejection there takes the process down: a monitor that can end the
 * service it monitors is worse than no monitor.
 */
export async function checkStaffing(now: number = Date.now()): Promise<StaffingCheck> {
  let staffed: boolean;
  try {
    staffed = await chatIsStaffed();
  } catch (error) {
    /*
     * A database we cannot reach is not evidence that nobody is on shift, and
     * alerting on it would send an email about staffing that is really about
     * the database. The console's own failure path reports that separately.
     */
    safeLog('error', 'staffing.check_failed', { error: (error as Error).name });
    return { staffed: false, unstaffedForMs: null, alertSent: false };
  }

  if (staffed) {
    if (unstaffedSince !== null) {
      safeLog('info', 'staffing.recovered', {
        gapSeconds: Math.round((now - unstaffedSince) / 1000),
      });
    }
    unstaffedSince = null;
    alertedForThisGap = false;
    return { staffed: true, unstaffedForMs: null, alertSent: false };
  }

  unstaffedSince ??= now;
  const unstaffedForMs = now - unstaffedSince;

  if (alertedForThisGap || unstaffedForMs < UNSTAFFED_ALERT_AFTER_MS) {
    return { staffed: false, unstaffedForMs, alertSent: false };
  }

  alertedForThisGap = true;
  const minutes = Math.round(unstaffedForMs / 60_000);

  /*
   * No conversation content, no visitor details, nothing about who was or was
   * not signed in. This is an operational alert about a switch, and naming a
   * coordinator would make it a performance record that nobody agreed to keep.
   */
  await sendMail({
    subject: 'AirEvac chat is unstaffed',
    body:
      `No coordinator has been signed in and available for chat for ${minutes} ` +
      `minute(s).\n\n` +
      `Visitors are currently shown the phone number instead of a chat window. ` +
      `Nothing is lost and nobody is waiting on an unanswered chat, but chat is ` +
      `not being offered.\n\n` +
      `To restore it, a coordinator signs in to the console. Coordinators are ` +
      `marked available automatically on sign-in.\n\n` +
      `This is sent once per gap, not repeatedly.`,
  });

  safeLog('warn', 'staffing.unstaffed_alert', { minutes });

  return { staffed: false, unstaffedForMs, alertSent: true };
}

/** Current gap length without performing a check. For the console banner. */
export function unstaffedForMs(now: number = Date.now()): number | null {
  return unstaffedSince === null ? null : now - unstaffedSince;
}

/** Test-only reset, so a test can drive the clock from a known state. */
export function __resetStaffingState(): void {
  unstaffedSince = null;
  alertedForThisGap = false;
}
