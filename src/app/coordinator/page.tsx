import { redirect } from 'next/navigation';

import { safeLog } from '@/lib/redact';
import { csrfToken, CSRF_FIELD, currentUser } from '@/server/auth/guard';
import { seedBootstrapAdmin } from '@/server/auth/users';

/**
 * Sign-in page for the coordinator console.
 *
 * A PLAIN FORM POSTING TO A ROUTE HANDLER. No client component, no fetch, no
 * JavaScript required to sign in. That is the same rule the public site's
 * contact paths follow, and it matters more here: a coordinator whose browser
 * blocks scripts, or whose bundle fails to load on a hospital's network, still
 * needs to reach the console during a live case.
 *
 * The error is passed as a search parameter rather than held in state, so the
 * page stays a server component and a refresh is harmless.
 */

const MESSAGES: Record<string, string> = {
  // One message for wrong password and unknown email alike. Distinguishing
  // them would turn this form into an account-enumeration oracle, and
  // `authenticate` deliberately returns the same reason for both.
  invalid: 'That email address and password combination was not recognized.',
  locked:
    'This account is temporarily locked after repeated failed sign-ins. Try again in 15 minutes, or ask an administrator to reset it.',
  disabled: 'This account has been disabled. Contact an administrator.',
  ratelimited: 'Too many sign-in attempts from this connection. Wait a few minutes and try again.',
  csrf: 'Your session expired before the form was submitted. Try again.',
  // Deliberately not phrased as a credential problem. See the login route.
  unavailable:
    'The console is temporarily unavailable and could not check your sign-in. This is not a problem with your password. Call (619) 754-6755 if a case needs coordinating now.',
  loggedout: 'You have been signed out.',
  passwordchanged: 'Password updated. Sign in with your new password.',
};

export const dynamic = 'force-dynamic';

/**
 * Shown when the console cannot reach its database.
 *
 * NOT `noindex`-sensitive and not a leak: this page is already behind no links
 * and disallowed to crawlers, and the reader is an administrator trying to fix
 * a deployment. `detail` carries the driver's message, which names the
 * configuration at fault and never contains a credential: `pg` reports the
 * failure class, and the connection string it was built from is not in it.
 */
function ConsoleUnavailable({ detail }: { detail: string }) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">The console is unavailable</h1>
      <p className="mt-3 text-sm text-ink-700">
        The coordinator console needs a database and could not reach one. The public site is
        unaffected and is serving normally.
      </p>

      <p className="mt-6 text-sm font-semibold text-navy-900">Most likely causes</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
        <li>
          <code className="font-mono text-xs">DATABASE_URL</code> is not set on this service.
        </li>
        <li>
          The database rejects our TLS settings. A managed database usually presents a self-signed
          certificate, which needs <code className="font-mono text-xs">DATABASE_SSL=no-verify</code>{' '}
          or, better, <code className="font-mono text-xs">DATABASE_CA_CERT</code>.
        </li>
        <li>The database exists but is still starting, or is in a different region.</li>
      </ul>

      <p className="mt-6 text-xs text-ink-500">
        Reported by the database driver: <span className="font-mono">{detail}</span>
      </p>

      <p className="mt-6 text-sm text-ink-700">
        Setup steps are in <span className="font-mono text-xs">docs/render-first-time-setup.md</span>
        . If you are trying to arrange a transport, call{' '}
        <a className="font-semibold text-support-700 underline" href="tel:+16197546755">
          (619) 754-6755
        </a>
        .
      </p>
    </main>
  );
}

export default async function CoordinatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  /*
   * Seeds the first administrator, if the environment permits it and none
   * exists. Done here rather than in a separate command so a fresh deployment
   * is usable without a shell: opening the login page is the one action anyone
   * is guaranteed to take.
   *
   * This is not a database call on every page view. `seedBootstrapAdmin`
   * checks ALLOW_BOOTSTRAP_ADMIN first and returns immediately when it is
   * absent, which is its state in production.
   */
  /*
   * A database that is missing, unreachable, or refusing our TLS settings used
   * to surface here as an unstyled 500 carrying an opaque error number: no
   * indication of what was wrong, and nothing to act on. The console genuinely
   * cannot work without a database, but "cannot work" and "cannot say why"
   * are different failures, and only one of them is necessary.
   *
   * `redirect()` throws by design in Next, so it must stay outside the try or
   * a successful sign-in would be caught here and reported as an outage.
   */
  let user: Awaited<ReturnType<typeof currentUser>>;
  try {
    await seedBootstrapAdmin();
    user = await currentUser();
  } catch (error) {
    safeLog('error', 'coordinator.database_unavailable', { error: (error as Error).name });
    return <ConsoleUnavailable detail={(error as Error).message} />;
  }

  if (user !== null) {
    redirect(user.mustChangePassword ? '/coordinator/password' : '/coordinator/console');
  }

  const { error, notice } = await searchParams;
  const token = await csrfToken();

  const errorMessage = error !== undefined ? MESSAGES[error] : undefined;
  const noticeMessage = notice !== undefined ? MESSAGES[notice] : undefined;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">Sign in</h1>
      <p className="mt-2 text-sm text-ink-700">
        For AirEvac flight coordinators. If you are trying to arrange a transport, call{' '}
        <a className="font-semibold text-support-700 underline" href="tel:+16197546755">
          (619) 754-6755
        </a>
        .
      </p>

      {errorMessage !== undefined && (
        <p
          role="alert"
          className="mt-6 rounded-panel border border-urgent-600 bg-urgent-50 px-4 py-3 text-sm text-ink-900"
        >
          {errorMessage}
        </p>
      )}

      {noticeMessage !== undefined && (
        <p className="mt-6 rounded-panel border border-ink-300 bg-support-50 px-4 py-3 text-sm text-ink-900">
          {noticeMessage}
        </p>
      )}

      <form method="POST" action="/coordinator/api/login" className="mt-8 space-y-5">
        <input type="hidden" name={CSRF_FIELD} value={token} />

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-navy-900">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2 text-base"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-navy-900">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2 text-base"
          />
        </div>

        <button
          type="submit"
          className="min-h-[44px] w-full rounded-panel bg-navy-900 px-4 py-2 font-semibold text-white hover:bg-navy-950"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
