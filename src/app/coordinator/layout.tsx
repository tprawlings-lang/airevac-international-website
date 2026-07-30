import type { Metadata } from 'next';

import '@/app/globals.css';
import { PresenceHeartbeat } from '@/components/chat/PresenceHeartbeat';

/**
 * Coordinator console shell.
 *
 * SEPARATE FROM THE PUBLIC SITE ON PURPOSE. This tree sits outside
 * `[locale]/`, so it inherits none of the marketing layout: no site header, no
 * navigation, no contact bar, no footer. Staff software and public marketing
 * have different audiences, and sharing a chrome would mean every change to one
 * risked the other.
 *
 * It is also monolingual. The public site's Spanish gate exists because medical
 * and legal copy must not be machine-translated; an internal admin screen has
 * no such content and no such audience. Coordinator language preference is a
 * property of the *user*, used for chat translation in Phase C, not a URL
 * prefix.
 */

export const metadata: Metadata = {
  title: 'Coordinator Console | AirEvac International',
  /*
   * Not indexable, in three independent ways: this tag, the Disallow rule in
   * robots.txt, and the absence of any inbound link. `nofollow` is included so
   * a crawler that reaches a session URL some other way does not walk further
   * into the console.
   */
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50">
        {/*
         * A visible band saying what this is. A coordinator switching between
         * the public site and the console in adjacent tabs should never be in
         * doubt about which one they are typing into, and after Phase B one of
         * them contains patient information.
         */}
        <div className="border-b-4 border-navy-900 bg-navy-950 px-4 py-2 text-center text-sm font-semibold text-white">
          AirEvac Coordinator Console · internal use
        </div>
        {/*
         * Renews an availability window from every console page, not only the
         * chat queue. It cannot create one, so mounting it here is safe even on
         * the sign-in page, where it stops on the first 401.
         */}
        <PresenceHeartbeat />
        {children}
      </body>
    </html>
  );
}
