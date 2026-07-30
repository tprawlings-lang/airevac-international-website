'use client';

import { useEffect } from 'react';

import { HEARTBEAT_INTERVAL_SECONDS } from '@/lib/chat-constants';

/**
 * Keeps an available coordinator available, from anywhere in the console.
 *
 * WHY THIS IS SEPARATE FROM THE TOGGLE. The toggle lives on the chat queue, so
 * before this existed the window was only renewed while that one page was open.
 * A coordinator marked available on sign-in who then sat on the console or the
 * user list would lapse in seventy-five seconds, and the site would report
 * nobody available while they were at the desk waiting for a conversation.
 * That is the exact failure the staffing alert was added to catch, and it would
 * have been our own bug setting it off.
 *
 * IT ONLY RENEWS. The request cannot mark anyone available; the server extends
 * an existing window and does nothing otherwise. So mounting this in the shared
 * layout is safe: a coordinator who has gone offline stays offline, and an
 * administrator who never went available never becomes so.
 *
 * It stops on the first response saying the window is gone, and on a 401, so a
 * signed-out tab left open overnight is not still calling in the morning.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;

    const stop = () => {
      stopped = true;
      clearInterval(timer);
    };

    const renew = async () => {
      if (stopped) return;
      try {
        const response = await fetch('/coordinator/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ renew: true }),
          keepalive: true,
        });

        if (response.status === 401) {
          stop();
          return;
        }

        const data = (await response.json()) as { available?: boolean };
        // Nothing to renew. Going available again is the toggle's job.
        if (data.available !== true) stop();
      } catch {
        // A dropped request is not evidence of anything. The window has a
        // seventy-five second tolerance precisely so one miss is survivable.
      }
    };

    const timer = setInterval(() => void renew(), HEARTBEAT_INTERVAL_SECONDS * 1000);
    void renew();

    return stop;
  }, []);

  return null;
}
