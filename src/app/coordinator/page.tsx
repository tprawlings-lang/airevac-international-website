import { redirect } from 'next/navigation';

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
  loggedout: 'You have been signed out.',
  passwordchanged: 'Password updated. Sign in with your new password.',
};

export const dynamic = 'force-dynamic';

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
  await seedBootstrapAdmin();

  const user = await currentUser();
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
