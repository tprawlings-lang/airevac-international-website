'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keeps a server-rendered page current without the coordinator reloading it.
 *
 * WHY NOT SERVER-SENT EVENTS, when the conversation view already uses them.
 * The stream is per-conversation: it exists because a message must appear in
 * under a second, and it carries message payloads. The queue is a different
 * problem. It is a list that changes when somebody else acts, it has no
 * payload worth pushing, and being three seconds stale costs nothing. A second
 * long-lived connection per coordinator, plus a queue-wide channel on the
 * in-process bus, would be real machinery bought for a list of four rows.
 *
 * `router.refresh()` re-runs the server component and patches the result in.
 * It is not a page reload: scroll position survives, focus survives, and
 * client state survives, which matters because the availability heartbeat runs
 * in a sibling component on this page and must not be torn down every few
 * seconds. It also reuses the page's existing authorisation exactly, because
 * it *is* the page, so there is no new endpoint deciding who may see a queue.
 *
 * PAUSED WHEN THE TAB IS HIDDEN. A coordinator leaves this open all shift. A
 * background tab polling a database forever is how a quiet feature becomes an
 * expensive one, and a hidden tab has nobody looking at it to serve.
 */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const start = () => {
      stop();
      timer = setInterval(() => router.refresh(), seconds * 1000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
        return;
      }
      // Refresh immediately on return: someone coming back to the tab wants
      // what is true now, not what was true when they left plus a wait.
      router.refresh();
      start();
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [router, seconds]);

  return null;
}
