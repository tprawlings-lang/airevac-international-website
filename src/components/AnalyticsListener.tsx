'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { FEATURES } from '@/content/site';
import { categoryOf, track, type AnalyticsEventName } from '@/lib/analytics';

/**
 * Qualified-action tracking, AI Search Coding Handoff section 9.
 *
 * ONE DELEGATED LISTENER RATHER THAN A HANDLER PER BUTTON. The blueprint
 * requires phone and email actions to work without JavaScript (page 20,
 * graceful degradation), and the handoff repeats it: "Make phone and email
 * actions usable without JavaScript." Attaching onClick to each CTA would turn
 * every one of them into a client component and put a script between a person
 * in an emergency and a phone number. A single document-level listener reads
 * clicks that have already happened on plain anchors; if it never loads, every
 * link still works exactly as it does today.
 *
 * The mapping is derived from the href, so a phone or email link added
 * anywhere later is measured without anyone remembering to instrument it.
 * `data-analytics-event` covers the cases a URL cannot express.
 *
 * Renders nothing at all while `FEATURES.analytics` is false, which is its
 * current state. See src/lib/analytics.ts for why that is not merely caution.
 */
export function AnalyticsListener() {
  const pathname = usePathname();

  /*
   * Explicit page view. GA4 is configured with `send_page_view: false` so the
   * tag never reports on its own, which is what lets `track` apply the
   * unmeasured-path rule to page views as well as to clicks. Sending it here
   * also makes client-side navigations countable, which an automatic page view
   * would miss in an App Router site.
   */
  useEffect(() => {
    if (!FEATURES.analytics) return;
    track({ name: 'page_view', path: pathname, category: categoryOf(pathname) });
  }, [pathname]);

  useEffect(() => {
    if (!FEATURES.analytics) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const explicit = anchor.dataset.analyticsEvent as AnalyticsEventName | undefined;
      const href = anchor.getAttribute('href') ?? '';

      const name: AnalyticsEventName | undefined =
        explicit ??
        (href.startsWith('tel:')
          ? 'click_phone'
          : href.startsWith('mailto:')
            ? 'click_email'
            : undefined);

      if (name === undefined) return;

      /*
       * The path and a coarse category only. Never the href itself: a mailto
       * or tel target is a contact detail, and `categoryOf` deliberately
       * discards the route slug so a single family's transport cannot be
       * identified from an analytics report.
       */
      track({ name, path: pathname, category: categoryOf(pathname) });
    }

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [pathname]);

  return null;
}
