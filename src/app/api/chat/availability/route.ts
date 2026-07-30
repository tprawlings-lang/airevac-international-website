import { NextResponse } from 'next/server';

import { FEATURES } from '@/content/site';
import { availableCoordinators, chatIsStaffed } from '@/server/chat/presence';
import { translationConfigured } from '@/server/chat/translate';

/**
 * Whether the widget may offer chat at all.
 *
 * THE MOST IMPORTANT ENDPOINT IN THE FEATURE. Everything else assumes a
 * conversation is possible; this decides whether to claim one is. If it ever
 * answers optimistically, a visitor at 3am waits on a chat nobody is watching
 * instead of calling a line that is genuinely answered, and on an air ambulance
 * site that is the feature causing harm rather than failing.
 *
 * So it reports what is true right now: a coordinator signed in, with a live
 * heartbeat, on an active account. Nothing is inferred from opening hours.
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  // The flag gates the public entry point until the Business Associate
  // Agreement is executed. The server side ships; the widget stays hidden.
  if (!FEATURES.secureChat) {
    return NextResponse.json(
      { enabled: false, staffed: false, languages: [], translation: false },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const [staffed, coordinators] = await Promise.all([
    chatIsStaffed(),
    availableCoordinators(),
  ]);

  /*
   * Languages actually covered by someone on shift, not languages the company
   * supports in principle. A Spanish speaker is told the truth about whether a
   * person or a machine will be reading them.
   */
  const languages = [...new Set(coordinators.flatMap((c) => c.languages))].sort();

  return NextResponse.json(
    {
      enabled: true,
      staffed,
      languages,
      translation: translationConfigured(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
