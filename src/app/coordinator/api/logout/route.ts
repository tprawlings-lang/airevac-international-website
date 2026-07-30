import { NextResponse, type NextRequest } from 'next/server';

import { clearSessionCookie, csrfValid, CSRF_FIELD } from '@/server/auth/guard';
import { currentUser } from '@/server/auth/guard';
import { audit } from '@/server/audit';
import { seeOther } from '@/server/http/redirect';

/**
 * Sign-out.
 *
 * POST, not GET, and CSRF-checked. A GET logout can be triggered by any image
 * tag on any page, which is a nuisance rather than a breach but a trivially
 * avoidable one. The session row is revoked server-side rather than only
 * clearing the cookie: a cookie a browser forgets is still a valid credential
 * to anyone who captured it.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const user = await currentUser();

  if (await csrfValid(form.get(CSRF_FIELD))) {
    await clearSessionCookie();
    if (user !== null) {
      await audit({ actorUserId: user.id, action: 'auth.logout' });
    }
  }

  return seeOther('/coordinator', { notice: 'loggedout' });
}
