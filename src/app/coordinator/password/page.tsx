import { csrfToken, requireUser, CSRF_FIELD } from '@/server/auth/guard';

/**
 * Change password.
 *
 * Reachable while `mustChangePassword` is set, which is the whole point:
 * `requireUser` sends a user in that state here from every other console page,
 * so a seeded or admin-reset credential can operate exactly one screen.
 */

const MESSAGES: Record<string, string> = {
  wrong_current: 'Your current password was not correct.',
  mismatch: 'The two new passwords did not match.',
  policy: 'That password does not meet the policy:',
  csrf: 'Your session expired before the form was submitted. Try again.',
  invalid: 'Something was missing from the form. Try again.',
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; problems?: string }>;
}) {
  const user = await requireUser({ allowPasswordChange: true });
  const token = await csrfToken();
  const { error, problems } = await searchParams;

  const message = error !== undefined ? MESSAGES[error] : undefined;
  const problemList = problems !== undefined ? problems.split('|').filter(Boolean) : [];

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">
        {user.mustChangePassword ? 'Choose a new password' : 'Change your password'}
      </h1>

      {user.mustChangePassword && (
        <p className="mt-3 rounded-panel border border-ink-300 bg-support-50 px-4 py-3 text-sm text-ink-900">
          This account is using a temporary password. Choose your own before continuing. Nobody
          else, including an administrator, will know it.
        </p>
      )}

      {message !== undefined && (
        <div
          role="alert"
          className="mt-6 rounded-panel border border-urgent-600 bg-urgent-50 px-4 py-3 text-sm text-ink-900"
        >
          <p>{message}</p>
          {problemList.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {problemList.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form method="POST" action="/coordinator/api/password" className="mt-8 space-y-5">
        <input type="hidden" name={CSRF_FIELD} value={token} />

        <div>
          <label htmlFor="current_password" className="block text-sm font-semibold text-navy-900">
            Current password
          </label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2 text-base"
          />
        </div>

        <div>
          <label htmlFor="new_password" className="block text-sm font-semibold text-navy-900">
            New password
          </label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            aria-describedby="password-help"
            className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2 text-base"
          />
          {/* Length, not symbol soup: NIST 800-63B withdrew composition rules
              because they push people toward Password1! and away from length. */}
          <p id="password-help" className="mt-1 text-xs text-ink-500">
            At least 12 characters. A short phrase you can remember beats a short string of
            symbols you cannot.
          </p>
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-semibold text-navy-900">
            Confirm new password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2 text-base"
          />
        </div>

        <button
          type="submit"
          className="min-h-[44px] w-full rounded-panel bg-navy-900 px-4 py-2 font-semibold text-white hover:bg-navy-950"
        >
          Update password
        </button>
      </form>

      <p className="mt-6 text-xs text-ink-500">
        You will be signed out of every device after this change, including this one.
      </p>
    </main>
  );
}
