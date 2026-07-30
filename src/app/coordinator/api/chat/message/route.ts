import { NextResponse, type NextRequest } from 'next/server';

import { currentUser } from '@/server/auth/guard';
import { findById, postMessage } from '@/server/chat/sessions';
import { findUserById } from '@/server/auth/users';
import { publish } from '@/server/chat/events';
import { targetLanguageFor, translateMessage } from '@/server/chat/translate';

/**
 * A coordinator sends a message.
 *
 * OWNERSHIP IS CHECKED, not just authentication. A signed-in coordinator may
 * only write to a conversation assigned to them. Without this any coordinator
 * could type into any live chat, and the visitor would have no way of knowing
 * they were suddenly talking to someone else.
 */

const MAX_LENGTH = 4000;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { chatId?: unknown; text?: unknown };
  const chatId = typeof body.chatId === 'string' ? body.chatId : '';
  const text = typeof body.text === 'string' ? body.text : '';

  if (chatId === '' || text.trim() === '') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const chat = await findById(chatId);
  if (chat === undefined) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (chat.assignedUserId !== user.id) {
    return NextResponse.json({ error: 'not_yours' }, { status: 403 });
  }
  if (chat.status !== 'active') {
    return NextResponse.json({ error: 'chat_ended' }, { status: 409 });
  }

  /*
   * Translate into the visitor's language when the coordinator does not speak
   * it. The coordinator's own languages come from their user record, so a
   * bilingual coordinator's Spanish is sent as written rather than round
   * tripped through a machine.
   */
  const coordinator = await findUserById(user.id);
  const senderLanguage = coordinator?.languages[0] ?? 'en';
  const target = targetLanguageFor(senderLanguage, [chat.visitorLanguage]);

  let translated = null;
  let translationError: string | null = null;

  if (target !== null) {
    const outcome = await translateMessage(text, senderLanguage, target);
    if (outcome.status === 'translated') {
      translated = { body: outcome.body, language: outcome.language, engine: outcome.engine };
    } else if (outcome.status === 'failed') {
      translationError = outcome.reason;
    }
  }

  const message = await postMessage({
    chatId,
    sender: 'coordinator',
    senderUserId: user.id,
    body: text,
    language: senderLanguage,
    translated,
    translationError,
  });

  publish({ kind: 'message', chatId });

  return NextResponse.json({ id: message.id });
}
