import { NextResponse, type NextRequest } from 'next/server';

import { changeOwnPassword } from '@/server/auth/users';
import { clearSessionCookie, csrfValid, currentUser, CSRF_FIELD } from '@/server/auth/guard';
import { seeOther } from '@/server/http/redirect';

/**
 * Password change, for the signed-in user only.
 *
 * Requires the current password even when the account is in the forced-change
 * state. Possession of a half-authenticated session is not enough to take an
 * account over permanently, which matters most for exactly the account this
 * flow exists to fix: the seeded admin.
 *
 * On success every session for the user is revoked, including this one, so the
 * cookie is cleared and they sign in again with the new password. That is
 * mildly annoying and correct: a password change usually happens because
 * somebody else may have the old one.
 */

export const dynamic = 'force-dynamic';

function back(error: string, problems?: string[]): NextResponse {
  return seeOther('/coordinator/password', {
    error,
    problems: problems !== undefined && problems.length > 0 ? problems.join('|') : undefined,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null) {
    return seeOther('/coordinator');
  }

  const form = await request.formData();
  if (!(await csrfValid(form.get(CSRF_FIELD)))) return back('csrf');

  const current = form.get('current_password');
  const next = form.get('new_password');
  const confirm = form.get('confirm_password');

  if (typeof current !== 'string' || typeof next !== 'string' || typeof confirm !== 'string') {
    return back('invalid');
  }
  if (next !== confirm) return back('mismatch');

  const result = await changeOwnPassword(user.id, current, next);

  if (!result.ok) {
    return result.reason === 'policy'
      ? back('policy', result.problems)
      : back('wrong_current');
  }

  await clearSessionCookie();
  return seeOther('/coordinator', { notice: 'passwordchanged' });
}
