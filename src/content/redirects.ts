/**
 * Legacy URL map. Blueprint section 3 (URL rules) and the SEO readiness finding
 * on page 22 ("Thin and mismatched pages plus legacy-domain links", Fail/High):
 *
 *   "Map every current URL to its new equivalent. Use permanent redirects,
 *    preserve inbound links, and avoid redirect chains."
 *
 * RULES FOR THIS FILE
 *  - Every `destination` must be a FINAL URL, never another entry's `source`.
 *    `npm run test` asserts there are no chains.
 *  - Destinations are locale-prefixed. Middleware would otherwise add a second
 *    hop to reach /en/..., which is exactly the chain the blueprint forbids.
 *  - `permanent: true` emits 308, preserving the method and passing link equity.
 *
 * INCOMPLETE BY DESIGN: this covers the URLs evidenced in the blueprint's source
 * list. Before DNS cutover the team must export the full URL inventory from
 * Search Console and the current sitemap and finish the map — that is the
 * "Migration workbook and crawl" exit evidence for P2.
 */

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

export const legacyRedirects: RedirectRule[] = [
  // --- Evidenced legacy WordPress URLs [S6] [S7] [S11] --------------------
  { source: '/accreditation', destination: '/en/credentials', permanent: true },
  { source: '/safety-and-care', destination: '/en/fleet', permanent: true },
  { source: '/privacy-policy', destination: '/en/legal/privacy', permanent: true },

  // --- Conventional WordPress paths that commonly carry inbound links ----
  { source: '/about-us', destination: '/en/about', permanent: true },
  { source: '/contact-us', destination: '/en/contact', permanent: true },
  { source: '/services', destination: '/en/services', permanent: true },
  { source: '/air-ambulance', destination: '/en/services/air-ambulance', permanent: true },
  {
    source: '/medical-repatriation',
    destination: '/en/services/medical-repatriation',
    permanent: true,
  },
  { source: '/fleet', destination: '/en/fleet', permanent: true },
  { source: '/terms-of-use', destination: '/en/legal/terms', permanent: true },
  { source: '/terms-and-conditions', destination: '/en/legal/terms', permanent: true },

  // --- WordPress infrastructure -------------------------------------------
  // These are not content. Redirecting them to the homepage removes a class of
  // scanner noise from the logs and stops /wp-admin from 404-ing into the
  // application's error path on every automated probe.
  { source: '/wp-admin/:path*', destination: '/en', permanent: true },
  { source: '/wp-login.php', destination: '/en', permanent: true },
  { source: '/wp-content/:path*', destination: '/en', permanent: true },
  { source: '/feed', destination: '/en', permanent: true },
  { source: '/comments/feed', destination: '/en', permanent: true },
  { source: '/xmlrpc.php', destination: '/en', permanent: true },
];
