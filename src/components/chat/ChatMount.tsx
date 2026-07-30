'use client';

import { usePathname } from 'next/navigation';

import { FEATURES } from '@/content/site';
import { ChatWidget } from '@/components/chat/ChatWidget';
import type { Locale } from '@/lib/i18n';

/**
 * Decides whether the widget appears on this page.
 *
 * EXCLUDED FROM /request-transport, per the placement decision. Two reasons,
 * and the second is the one that would be easy to get wrong later: the privacy
 * notice states that no measurement of any kind runs on that page, and a second
 * contact path floating over a form someone is already completing competes with
 * it rather than helping.
 *
 * Also absent from the coordinator console, which is a different application
 * and does not include this layout at all.
 *
 * Renders nothing while `FEATURES.secureChat` is false, which is its state
 * until the Business Associate Agreement is executed. The check is here as well
 * as in every endpoint, so the entry point cannot appear because someone
 * mounted the component somewhere new.
 */

const EXCLUDED = ['/request-transport'];

export function ChatMount({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  if (!FEATURES.secureChat) return null;
  if (EXCLUDED.some((path) => pathname.endsWith(path))) return null;

  return <ChatWidget locale={locale} />;
}
