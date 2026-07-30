import type { NextRequest } from 'next/server';

import { FEATURES } from '@/content/site';
import { findByVisitorToken, messagesFor } from '@/server/chat/sessions';
import { readChatCookie } from '@/server/chat/visitor-cookie';
import { subscribe } from '@/server/chat/events';

/**
 * The visitor's live message stream.
 *
 * SERVER-SENT EVENTS, NOT A WEBSOCKET. A chat needs one direction of streaming
 * and ordinary POSTs for the other, and SSE is plain HTTP: it survives the
 * corporate proxies that break WebSocket upgrades, which matters when a large
 * share of the users are hospital case managers behind enterprise firewalls.
 * It also needs nothing added to `connect-src 'self'`.
 *
 * THREE THINGS HERE ARE EASY TO GET WRONG AND HARD TO NOTICE:
 *
 * 1. The keepalive. Proxies and load balancers close an idle connection after
 *    30 to 60 seconds. A comment line every 20 keeps it open, and without it a
 *    quiet conversation drops exactly when neither party is typing, which reads
 *    to both of them as the other having left.
 *
 * 2. The unsubscribe. Every stream registers a listener; if a closed connection
 *    does not remove its own, the listener holds the request closure for the
 *    life of the process. On a long-running server that is a slow leak rather
 *    than a visible failure, so it is done in `cancel` and in the abort
 *    handler, because only one of them fires depending on how the client left.
 *
 * 3. The replay. A reconnecting browser sends `Last-Event-ID`; without honouring
 *    it, every message sent during the gap is lost silently. Messages are
 *    re-read from the database rather than buffered in memory, so a reconnect
 *    after a server restart still catches up.
 */

export const dynamic = 'force-dynamic';

const KEEPALIVE_MS = 20_000;

export async function GET(request: NextRequest): Promise<Response> {
  if (!FEATURES.secureChat) return new Response('Not found', { status: 404 });

  const token = await readChatCookie();
  const chat = await findByVisitorToken(token);
  if (chat === undefined) return new Response('No session', { status: 401 });

  const chatId = chat.id;
  const lastEventId =
    request.headers.get('last-event-id') ??
    request.nextUrl.searchParams.get('lastEventId') ??
    undefined;

  const encoder = new TextEncoder();

  /*
   * Cleanup is held here rather than inside `start`, because both `start`'s
   * abort handler and `cancel` need to call it and only one of them fires
   * depending on how the client went away. An earlier version defined it
   * inside `start` and left `cancel` unable to reach it, which leaked a
   * listener on every stream torn down by the consumer rather than aborted.
   */
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
          // The client vanished between the check and the write. Nothing to do.
          closed = true;
        }
      };

      /** Reads anything newer than the cursor and emits it. */
      const flush = async () => {
        const messages = await messagesFor(chatId, cursor);
        for (const message of messages) {
          cursor = message.id;
          send(
            `id: ${message.id}\n` +
              `event: message\n` +
              `data: ${JSON.stringify({
                id: message.id,
                sender: message.sender,
                body: message.bodyOriginal,
                language: message.languageOriginal,
                // Both are sent. The interface shows the original alongside any
                // translation; it never replaces one with the other.
                translated: message.bodyTranslated,
                translatedLanguage: message.languageTranslated,
                translationError: message.translationError,
                at: message.createdAt.toISOString(),
              })}\n\n`,
          );
        }
      };

      // Catch up first, so a reconnect never loses what happened in the gap.
      await flush();
      send(`event: ready\ndata: {"chatId":"${chatId}"}\n\n`);

      const unsubscribe = subscribe((event) => {
        if (event.chatId !== chatId) return;
        if (event.kind === 'message') void flush();
        if (event.kind === 'claimed') send(`event: claimed\ndata: {}\n\n`);
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
      // Fires when the consumer tears the stream down rather than aborting the
      // request. Idempotent, so it is safe for both paths to run.
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      // Tells nginx-style proxies not to buffer, which would hold every message
      // until the buffer filled and make the chat appear frozen.
      'X-Accel-Buffering': 'no',
    },
  });
}
