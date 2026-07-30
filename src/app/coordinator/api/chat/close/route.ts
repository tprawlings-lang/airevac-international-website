import { NextResponse, type NextRequest } from 'next/server';

import { currentUser, csrfValid, CSRF_FIELD } from '@/server/auth/guard';
import { closeChat, findById } from '@/server/chat/sessions';
import { publish } from '@/server/chat/events';

/**
 * Ends a conversation.
 *
 * Closing triggers the operations notification, which carries a reference and a
 * link and no conversation content. See `closeChat`.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) {
    return NextResponse.redirect(new URL('/coordinator', request.nextUrl.origin), 303);
  }

  const form = await request.formData();
  const chatId = String(form.get('chat_id') ?? '');

  if (!(await csrfValid(form.get(CSRF_FIELD))) || chatId === '') {
    // Says why. Redirecting silently here meant a coordinator clicking "End
    // conversation" on a stale page landed back on the queue with the chat
    // still open and no explanation, which reads as the button being broken.
    return NextResponse.redirect(
      new URL('/coordinator/chats?error=csrf', request.nextUrl.origin),
      303,
    );
  }

  const chat = await findById(chatId);
  // Only the assigned coordinator, or an admin, may end a conversation.
  if (chat === undefined || (chat.assignedUserId !== user.id && user.role !== 'admin')) {
    return NextResponse.redirect(
      new URL('/coordinator/chats?error=not_yours', request.nextUrl.origin),
      303,
    );
  }

  await closeChat(chatId, 'coordinator_ended', user.id);
  publish({ kind: 'closed', chatId });
  publish({ kind: 'queue' });

  return NextResponse.redirect(new URL('/coordinator/chats', request.nextUrl.origin), 303);
}
