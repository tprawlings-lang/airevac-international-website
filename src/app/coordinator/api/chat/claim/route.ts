import { NextResponse, type NextRequest } from 'next/server';

import { currentUser, csrfValid, CSRF_FIELD } from '@/server/auth/guard';
import { claimChat } from '@/server/chat/sessions';
import { publish } from '@/server/chat/events';

/** Claims a queued conversation. See `claimChat` for the atomicity argument. */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) {
    return NextResponse.redirect(new URL('/coordinator', request.nextUrl.origin), 303);
  }

  const form = await request.formData();
  const chatId = String(form.get('chat_id') ?? '');

  if (!(await csrfValid(form.get(CSRF_FIELD))) || chatId === '') {
    return NextResponse.redirect(new URL('/coordinator/chats?error=csrf', request.nextUrl.origin), 303);
  }

  const result = await claimChat(chatId, user.id);

  if (!result.ok) {
    const url = new URL('/coordinator/chats', request.nextUrl.origin);
    url.searchParams.set('error', result.reason);
    return NextResponse.redirect(url, 303);
  }

  // Wakes the visitor's stream so their widget stops saying "waiting".
  publish({ kind: 'claimed', chatId });
  publish({ kind: 'queue' });

  return NextResponse.redirect(
    new URL(`/coordinator/chats/${chatId}`, request.nextUrl.origin),
    303,
  );
}
