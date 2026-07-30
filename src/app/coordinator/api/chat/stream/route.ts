import type { NextRequest } from 'next/server';

import { currentUser } from '@/server/auth/guard';
import { findById, messagesFor } from '@/server/chat/sessions';
import { subscribe } from '@/server/chat/events';

/**
 * The coordinator's live stream for one conversation.
 *
 * Same shape as the visitor stream, and the same three concerns apply: the
 * keepalive stops proxies closing a quiet conversation, the unsubscribe runs
 * on both the abort and cancel paths because only one fires, and replay is
 * served from the database so a reconnect after a restart still catches up.
 * See src/app/api/chat/stream/route.ts for the fuller reasoning.
 *
 * Ownership is checked before the stream opens: a coordinator cannot watch a
 * conversation assigned to somebody else.
 */

export const dynamic = 'force-dynamic';

const KEEPALIVE_MS = 20_000;

export async function GET(request: NextRequest): Promise<Response> {
  const user = await currentUser();
  if (user === null || user.mustChangePassword) return new Response('Unauthorized', { status: 401 });

  const chatId = request.nextUrl.searchParams.get('chatId') ?? '';
  const chat = await findById(chatId);

  if (chat === undefined) return new Response('Not found', { status: 404 });
  if (chat.assignedUserId !== user.id && user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const lastEventId =
    request.headers.get('last-event-id') ??
    request.nextUrl.searchParams.get('lastEventId') ??
    undefined;

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let cursor = lastEventId;

      const send = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          closed = true;
        }
      };

      const flush = async () => {
        const messages = await messagesFor(chatId, cursor);
        for (const message of messages) {
          cursor = message.id;
          send(
            `id: ${message.id}\nevent: message\ndata: ${JSON.stringify({
              id: message.id,
              sender: message.sender,
              body: message.bodyOriginal,
              language: message.languageOriginal,
              translated: message.bodyTranslated,
              translatedLanguage: message.languageTranslated,
              translationError: message.translationError,
              at: message.createdAt.toISOString(),
            })}\n\n`,
          );
        }
      };

      await flush();
      send(`event: ready\ndata: {}\n\n`);

      const unsubscribe = subscribe((event) => {
        if (event.chatId !== chatId) return;
        if (event.kind === 'message') void flush();
        if (event.kind === 'closed') send(`event: closed\ndata: {}\n\n`);
      });

      const keepalive = setInterval(() => send(': keepalive\n\n'), KEEPALIVE_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      };

      request.signal.addEventListener('abort', () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
