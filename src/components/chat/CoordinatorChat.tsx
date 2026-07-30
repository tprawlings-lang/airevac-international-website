'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  sender: 'visitor' | 'coordinator' | 'system';
  body: string;
  language: string;
  translated: string | null;
  translatedLanguage: string | null;
  translationError: string | null;
  at: string;
}

/**
 * The coordinator's side of a conversation.
 *
 * TRANSLATION IS SHOWN IN THE OPPOSITE ORDER TO THE VISITOR'S WIDGET, and
 * deliberately. The visitor reads the translation first because it is in their
 * language. The coordinator reads the translation first too, but the original
 * is given more weight here: a coordinator is the person who might actually
 * notice that a translation has gone wrong, and they are the one who can pick
 * up the phone about it. The original is never collapsed or hidden behind a
 * control.
 */
export function CoordinatorChat({
  chatId,
  visitorLanguage,
  visitorName,
}: {
  chatId: string;
  visitorLanguage: string;
  visitorName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ended, setEnded] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource(
      `/coordinator/api/chat/stream?chatId=${encodeURIComponent(chatId)}`,
    );
    sourceRef.current = source;

    source.addEventListener('message', (event) => {
      const message = JSON.parse((event as MessageEvent).data) as Message;
      setMessages((current) =>
        current.some((existing) => existing.id === message.id) ? current : [...current, message],
      );
    });
    source.addEventListener('closed', () => setEnded(true));

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (text === '' || sending) return;

    setSending(true);
    setDraft('');
    try {
      const response = await fetch('/coordinator/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text }),
      });
      // Put the text back rather than losing it. A coordinator retyping a
      // message they already sent is a nuisance; losing one mid-case is not.
      if (!response.ok) setDraft(text);
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  }, [chatId, draft, sending]);

  return (
    <div className="mt-6 flex h-[60vh] flex-col rounded-panel border border-ink-300 bg-white">
      <ul className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.sender === 'coordinator'
                ? 'ml-10 rounded-panel bg-navy-900 px-3 py-2 text-sm text-white'
                : 'mr-10 rounded-panel bg-ink-100 px-3 py-2 text-sm text-ink-900'
            }
          >
            <span className="block text-xs font-semibold opacity-80">
              {message.sender === 'coordinator' ? 'You' : visitorName}
            </span>

            {message.translated !== null ? (
              <>
                <span className="mt-1 block">{message.translated}</span>
                <span className="mt-2 block border-t border-current/20 pt-1 text-xs opacity-80">
                  <span className="font-semibold">
                    Original ({message.language === 'es' ? 'Spanish' : 'English'}):{' '}
                  </span>
                  {message.body}
                </span>
                <span className="mt-1 block text-xs italic opacity-70">
                  Machine translated. Confirm anything clinical by phone.
                </span>
              </>
            ) : (
              <>
                <span className="mt-1 block">{message.body}</span>
                {message.translationError !== null && (
                  <span className="mt-1 block text-xs italic opacity-70">
                    Not translated ({message.translationError}). Shown as written.
                  </span>
                )}
              </>
            )}
          </li>
        ))}
        <div ref={endRef} />
      </ul>

      {ended ? (
        <p className="border-t border-ink-200 px-4 py-3 text-sm text-ink-700">
          This conversation has ended. The transcript stays in the console.
        </p>
      ) : (
        <div className="border-t border-ink-200 p-3">
          <label htmlFor="coordinator-composer" className="sr-only">
            Your reply
          </label>
          <div className="flex gap-2">
            <textarea
              id="coordinator-composer"
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              maxLength={4000}
              placeholder={
                visitorLanguage === 'es'
                  ? 'Write in English; it is translated for them'
                  : 'Type your reply'
              }
              className="flex-1 rounded-panel border border-ink-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || draft.trim() === ''}
              className="min-h-[44px] rounded-panel bg-navy-900 px-4 font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
