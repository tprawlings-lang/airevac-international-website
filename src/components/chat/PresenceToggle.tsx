'use client';

import { useCallback, useEffect, useState } from 'react';

import { HEARTBEAT_INTERVAL_SECONDS } from '@/lib/chat-constants';

/**
 * Availability switch and heartbeat.
 *
 * THE HEARTBEAT IS THE FEATURE, not the switch. Marking yourself available
 * sets a window that expires; this component renews it while the console is
 * open. Close the laptop and the window lapses, and within a minute the public
 * widget stops offering chat.
 *
 * That is why availability is not persisted as a flag. A flag would survive a
 * closed laptop, an asleep machine, and a browser crash, and every one of those
 * would leave a visitor at 3am watching a chat that nobody is watching back.
 *
 * Going offline is sent explicitly on unmount as well, so signing out or
 * navigating away releases availability immediately rather than after the
 * window expires.
 */
export function PresenceToggle({ initial }: { initial: boolean }) {
  const [available, setAvailable] = useState(initial);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async (next: boolean) => {
    await fetch('/coordinator/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: next }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!available) return;

    const id = setInterval(() => void send(true), HEARTBEAT_INTERVAL_SECONDS * 1000);
    return () => clearInterval(id);
  }, [available, send]);

  /*
   * `keepalive` on the request matters here: a normal fetch fired during
   * unload is cancelled with the page, which would leave the coordinator
   * marked available until their window lapsed.
   */
  useEffect(() => {
    const onHide = () => {
      if (available) void send(false);
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [available, send]);

  async function toggle() {
    setBusy(true);
    const next = !available;
    setAvailable(next);
    await send(next);
    setBusy(false);
  }

  return (
    <div className="rounded-panel border border-ink-300 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-navy-900">
            {available ? 'Available for chat' : 'Not available'}
          </p>
          <p className="mt-1 text-sm text-ink-700">
            {available
              ? 'Visitors can start a chat with you. Closing this tab makes you unavailable within a minute.'
              : 'Visitors are shown the phone number instead of a chat.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          aria-pressed={available}
          className={`min-h-[44px] shrink-0 rounded-panel px-4 py-2 font-semibold disabled:opacity-60 ${
            available
              ? 'border border-ink-300 bg-white text-navy-900 hover:bg-ink-50'
              : 'bg-navy-900 text-white hover:bg-navy-950'
          }`}
        >
          {available ? 'Go offline' : 'Go available'}
        </button>
      </div>
    </div>
  );
}
