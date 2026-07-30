import { NextResponse, type NextRequest } from 'next/server';

import { FEATURES } from '@/content/site';
import { findByVisitorToken, postMessage } from '@/server/chat/sessions';
import { findUserById } from '@/server/auth/users';
import { readChatCookie } from '@/server/chat/visitor-cookie';
import { publish } from '@/server/chat/events';
import { targetLanguageFor, translateMessage } from '@/server/chat/translate';

/**
 * A visitor sends a message.
 *
 * Translation happens here, before the write, so the original and its
 * translation land in one row and can never drift apart. A failure is recorded
 * on the message rather than discarding it: both sides then see the original
 * with an explicit marker, because a coordinator cannot tell the difference
 * between "they said nothing" and "their words did not arrive".
 */

const MAX_LENGTH = 4000;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!FEATURES.secureChat) {
    return NextResponse.json({ error: 'chat_disabled' }, { status: 404 });
  }

  const token = await readChatCookie();
  const chat = await findByVisitorToken(token);

  if (chat === undefined) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }
  if (chat.status === 'closed' || chat.status === 'abandoned') {
    return NextResponse.json({ error: 'chat_ended' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const text = (body as { text?: unknown }).text;
  if (typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  /*
   * Translate into the assigned coordinator's language, if they do not already
   * speak the visitor's. While the chat is still queued there is no
   * coordinator to translate for, so the message is stored untranslated and
   * whoever claims it reads the original; translating for a hypothetical
   * recipient would be guessing.
   */
  let translated = null;
  let translationError: string | null = null;

  if (chat.assignedUserId !== null) {
    const coordinator = await findUserById(chat.assignedUserId);
    const target =
      coordinator === undefined
        ? null
        : targetLanguageFor(chat.visitorLanguage, coordinator.languages);

    if (target !== null) {
      const outcome = await translateMessage(text, chat.visitorLanguage, target);
      if (outcome.status === 'translated') {
        translated = { body: outcome.body, language: outcome.language, engine: outcome.engine };
      } else if (outcome.status === 'failed') {
        translationError = outcome.reason;
      }
    }
  }

  const message = await postMessage({
    chatId: chat.id,
    sender: 'visitor',
    body: text,
    language: chat.visitorLanguage,
    translated,
    translationError,
  });

  publish({ kind: 'message', chatId: chat.id });

  return NextResponse.json({ id: message.id, createdAt: message.createdAt });
}
