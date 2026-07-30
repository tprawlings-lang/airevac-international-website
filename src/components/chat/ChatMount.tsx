'use client';

import { usePathname } from 'next/navigation';

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
 * `enabled` ARRIVES AS A PROP, DECIDED ON THE SERVER, and must not be read from
 * the environment here. This is a client component: Next inlines only
 * `NEXT_PUBLIC_*` variables into the browser bundle, so every server-only name
 * is `undefined` once this code runs in a browser. Evaluating the feature gate
 * here therefore answered a different question than the same gate answered in
 * the endpoints, and answered it from no information at all.
 *
 * That is not hypothetical. When the gate began requiring a database, this
 * component started reading an undefined `DATABASE_URL`, concluded chat was
 * off, and removed the launcher from every page of a deployment where chat was
 * running perfectly well. Nothing failed and nothing was logged; the button
 * simply was not there.
 *
 * The endpoints still check the real gate, so this prop decides only whether to
 * offer the entry point, never whether a conversation may start.
 */

const EXCLUDED = ['/request-transport'];

export function ChatMount({ locale, enabled }: { locale: Locale; enabled: boolean }) {
  const pathname = usePathname();

  if (!enabled) return null;
  if (EXCLUDED.some((path) => pathname.endsWith(path))) return null;

  return <ChatWidget locale={locale} />;
}
