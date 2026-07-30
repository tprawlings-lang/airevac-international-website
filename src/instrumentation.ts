/**
 * Background work that runs for as long as the server does.
 *
 * Next calls `register()` once per server process. Two jobs live here, and they
 * share this file rather than each growing their own timer because a second
 * scheduling mechanism is a second thing to reason about when one of them
 * stops running.
 *
 * ONE INSTANCE ONLY, the same constraint the chat event bus carries and for a
 * related reason: on two instances both would run, so the retention sweep would
 * race itself harmlessly and the staffing alert would send twice. `render.yaml`
 * pins `numInstances: 1` and says why.
 *
 * NOTHING HERE MAY THROW. An unhandled rejection in a timer takes the process
 * down, which would turn a monitoring job into an outage of the site it
 * monitors. Both jobs catch their own failures; this file catches again anyway.
 */

/** How often to ask whether anyone is signed in to answer chat. */
const STAFFING_CHECK_MS = 60_000;

/**
 * How often to delete transcripts past their retention date.
 *
 * Hourly rather than daily. The retention period is measured in days, so the
 * exact minute is immaterial, but a job that runs once a day only gets 30
 * chances a month to prove it still works. Hourly means a broken sweep is
 * visible in the logs the same morning.
 */
const RETENTION_SWEEP_MS = 60 * 60 * 1000;

export async function register(): Promise<void> {
  /*
   * Node runtime only. `register` is also invoked for the edge runtime, which
   * has no Postgres driver, and during a build, where connecting to a database
   * would be both useless and surprising.
   */
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // No database, no console, no chat, nothing to sweep or watch.
  if ((process.env.DATABASE_URL ?? '') === '') return;

  const { safeLog } = await import('@/lib/redact');
  const { checkStaffing } = await import('@/server/chat/staffing');
  const { sweepChats } = await import('@/server/chat/sessions');

  const safely = (name: string, job: () => Promise<unknown>) => () => {
    void job().catch((error: unknown) => {
      safeLog('error', 'scheduler.job_failed', { job: name, error: (error as Error).name });
    });
  };

  const staffing = setInterval(safely('staffing', () => checkStaffing()), STAFFING_CHECK_MS);
  const retention = setInterval(safely('retention', () => sweepChats()), RETENTION_SWEEP_MS);

  /*
   * `unref` so neither timer holds the process open. Without it a deploy's
   * shutdown waits on the next tick rather than exiting, which turns every
   * restart into a slow one.
   */
  staffing.unref();
  retention.unref();

  safeLog('info', 'scheduler.started', {
    staffingCheckSeconds: STAFFING_CHECK_MS / 1000,
    retentionSweepMinutes: RETENTION_SWEEP_MS / 60_000,
  });
}
