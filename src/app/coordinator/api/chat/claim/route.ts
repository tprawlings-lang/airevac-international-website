import { NextResponse, type NextRequest } from 'next/server';

import { currentUser, csrfValid, CSRF_FIELD } from '@/server/auth/guard';
import { claimChat } from '@/server/chat/sessions';
import { publish } from '@/server/chat/events';
import { seeOther } from '@/server/http/redirect';

/** Claims a queued conversation. See `claimChat` for the atomicity argument. */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) {
    return seeOther('/coordinator');
  }

  const form = await request.formData();
  const chatId = String(form.get('chat_id') ?? '');

  if (!(await csrfValid(form.get(CSRF_FIELD))) || chatId === '') {
    return seeOther('/coordinator/chats', { error: 'csrf' });
  }

  const result = await claimChat(chatId, user.id);

  if (!result.ok) {
    return seeOther('/coordinator/chats', { error: result.reason });
  }

  // Wakes the visitor's stream so their widget stops saying "waiting".
  publish({ kind: 'claimed', chatId });
  publish({ kind: 'queue' });

  return seeOther(`/coordinator/chats/${chatId}`);
}
