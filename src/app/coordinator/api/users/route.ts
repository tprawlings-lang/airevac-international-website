import { NextResponse, type NextRequest } from 'next/server';

import { adminResetPassword, createUser, listUsers, setUserStatus } from '@/server/auth/users';
import { csrfValid, currentUser, CSRF_FIELD } from '@/server/auth/guard';
import { seeOther } from '@/server/http/redirect';

/**
 * Admin user management.
 *
 * ROLE IS CHECKED HERE, NOT ONLY IN THE UI. The console hides the admin card
 * from coordinators, which is presentation. This is enforcement: a coordinator
 * who posts to this endpoint directly gets the same answer as a stranger.
 *
 * THE TEMPORARY PASSWORD TRAVELS BACK IN A URL, ONCE. It is shown to the admin
 * on the next page render and is not stored anywhere. That is a deliberate
 * trade: putting it in the query string means it lands in the admin's browser
 * history, and the alternative designs are worse. Storing it plaintext to
 * display later would keep a live credential in the database; emailing it would
 * put it in two mailboxes. It is single-use, forced to change on first login,
 * and useless once used.
 */

export const dynamic = 'force-dynamic';

function back(params: Record<string, string>): NextResponse {
  return seeOther('/coordinator/users', params);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await currentUser();

  if (actor === null || actor.role !== 'admin' || actor.mustChangePassword) {
    return seeOther('/coordinator');
  }

  const form = await request.formData();
  if (!(await csrfValid(form.get(CSRF_FIELD)))) return back({ error: 'csrf' });

  const action = form.get('action');

  try {
    if (action === 'create') {
      const email = String(form.get('email') ?? '');
      const displayName = String(form.get('display_name') ?? '');
      const role = form.get('role') === 'admin' ? 'admin' : 'coordinator';
      const languages = form.getAll('languages').map(String).filter(Boolean);

      const created = await createUser({
        email,
        displayName,
        role,
        languages: languages.length > 0 ? languages : ['en'],
        createdBy: actor.id,
      });

      return back({
        created: created.user.email,
        temp: created.temporaryPassword,
      });
    }

    const targetId = String(form.get('user_id') ?? '');
    if (targetId === '') return back({ error: 'invalid' });

    if (action === 'disable' || action === 'enable') {
      /*
       * An admin disabling themselves would lock the console if they were the
       * last one. Checked here rather than hidden in the UI, because the UI is
       * not the security boundary.
       */
      if (targetId === actor.id) return back({ error: 'self' });

      if (action === 'disable') {
        const admins = (await listUsers()).filter(
          (u) => u.role === 'admin' && u.status === 'active',
        );
        if (admins.length <= 1 && admins[0]?.id === targetId) {
          return back({ error: 'lastadmin' });
        }
      }

      await setUserStatus(targetId, action === 'disable' ? 'disabled' : 'active', actor.id);
      return back({ notice: action === 'disable' ? 'disabled' : 'enabled' });
    }

    if (action === 'reset') {
      const temp = await adminResetPassword(targetId, actor.id);
      return back({ reset: targetId, temp });
    }

    return back({ error: 'invalid' });
  } catch (error) {
    return back({ error: 'failed', message: (error as Error).message });
  }
}
