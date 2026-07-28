/**
 * Legacy URL map. Blueprint section 3 (URL rules) and the SEO readiness finding
 * on page 22 ("Thin and mismatched pages plus legacy-domain links", Fail/High):
 *
 *   "Map every current URL to its new equivalent. Use permanent redirects,
 *    preserve inbound links, and avoid redirect chains."
 *
 * COMPLETE as of a crawl of airevacinternational.com on 2026-07-27, taken from
 * the live WordPress sitemap index: 43 pages, 44 posts, 1 author archive.
 * This closes the "Migration workbook and crawl" exit evidence for P2.
 *
 * RULES FOR THIS FILE
 *  - Every `destination` must be a FINAL URL, never another entry's `source`.
 *    `npm run test` asserts there are no chains and that every destination
 *    resolves to a real page.
 *  - Destinations are locale-prefixed. The proxy would otherwise add a second
 *    hop to reach /en/..., which is exactly the chain the blueprint forbids.
 *  - `permanent: true` emits 308, preserving the method and passing link equity.
 *
 * ON REDIRECTING TO THE NEAREST USEFUL PAGE RATHER THAN THE HOMEPAGE.
 * Mass-redirecting retired content to `/` is treated by search engines as a soft
 * 404 and loses the link equity the redirect was meant to preserve. So each
 * legacy URL points at the closest page that actually serves the same intent -
 * a Cabo travel post goes to the Los Cabos route page, because someone landing
 * there from an old link is in or headed to Cabo.
 */

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/** Shorthand: locale-prefix the destination once, here. */
const to = (source: string, path: string): RedirectRule => ({
  source,
  destination: `/en${path}`,
  permanent: true,
});

/**
 * A route this site itself shipped and later removed (AEI handoff, July 2026).
 * Three rules per route: the unprefixed path (an old saved link, matched here
 * before the proxy's locale redirect can add a hop) and both locale prefixes,
 * which the proxy would otherwise pass straight through to a 404.
 */
const removedRoute = (source: string, path: string): RedirectRule[] => [
  to(source, path),
  { source: `/en${source}`, destination: `/en${path}`, permanent: true },
  { source: `/es${source}`, destination: `/es${path}`, permanent: true },
];

export const legacyRedirects: RedirectRule[] = [
  // ===================== Core pages =====================================
  to('/company', '/about'),
  to('/about-us', '/about'),
  to('/air-ambulance', '/services/air-ambulance'),
  to('/accreditation', '/credentials'),
  to('/safety-and-care', '/fleet'),
  to('/insurance', '/patients-families/insurance-and-payment'),
  to('/request-a-quote', '/request-transport'),
  to('/thank-you', '/request-transport'),
  to('/contact-us', '/contact'),
  to('/services', '/services'),

  // Case-manager content is the referral path. The audience-specific partner
  // pages were merged into a single /partners page by the AEI handoff.
  to('/case-managers', '/partners'),
  to('/case-managers/request-promotional-items', '/partners'),

  /*
   * /patient-portal was not an authenticated portal - it was a marketing page
   * describing the transport process. Page 24 forbids "a public patient portal
   * inside the marketing application", so the name is not carried over; the
   * content's real equivalent is the patient and family landing page.
   */
  to('/patient-portal', '/patients-families'),

  // ===================== Locations → coverage ===========================
  to('/locations', '/coverage'),

  // Mexico
  to('/locations/mexico', '/coverage/mexico'),
  to('/locations/mexico/cancun', '/coverage/mexico/cancun'),
  to('/locations/mexico/cozumel', '/coverage/mexico/cozumel'),
  to('/locations/mexico/cabo-san-lucas', '/coverage/mexico/los-cabos'),
  to('/locations/mexico/puerto-vallarta', '/coverage/mexico/puerto-vallarta'),

  // Caribbean
  to('/locations/bahamas', '/coverage/caribbean/bahamas'),
  to('/locations/cayman-islands', '/coverage/caribbean/cayman-islands'),
  to('/locations/dominican-republic', '/coverage/caribbean/dominican-republic'),
  to('/locations/jamaica', '/coverage/caribbean/jamaica'),
  to('/locations/turks-caicos', '/coverage/caribbean/turks-and-caicos'),
  // No Cuba route page exists, and none should be created without a sanctions
  // and operating-authority review. The region page is the honest destination.
  to('/locations/cuba', '/coverage/caribbean'),

  // Central America
  to('/locations/belize', '/coverage/central-america/belize'),
  to('/locations/costa-rica-2', '/coverage/central-america/costa-rica'),
  to('/locations/honduras', '/coverage/central-america/honduras'),

  /*
   * US state pages. Eleven existed (Alabama, Arizona, California, Colorado,
   * Florida, Georgia, Illinois, Indiana, Louisiana, Massachusetts,
   * Mississippi). They are precisely what page 8 forbids - "Do not build thin
   * pages for every state, city, airport, island, or diagnosis" - so they are
   * not recreated. All fold into the United States coverage page.
   */
  ...[
    'alabama',
    'arizona',
    'california',
    'colorado',
    'florida',
    'georgia',
    'illinois',
    'indiana',
    'louisiana',
    'massachusetts',
    'mississippi',
  ].map((state) => to(`/locations/${state}`, '/coverage/united-states')),

  /*
   * Private cruise-line island pages. The targeting was smart - these are where
   * cruise passengers are injured - but the execution was tourism copy
   * ("tallest waterslide in North America", "swim-up bar") apparently lifted
   * from the cruise lines' own marketing, wrapped around a boilerplate block.
   *
   * Retained as redirects to the cruise referral path, which is what a port
   * medical team actually needs. See docs/open-decisions.md for the
   * recommendation to rebuild these properly.
   */
  ...[
    'castaway-cay-disney-cruise-lines',
    'great-stirrup-cay-norwegian-cruiselines',
    'half-moon-cay-carnival-cruise-line',
    'harvest-cay-carnival-cruise-line',
    'coco-cay-royal-caribbean-cruise-line',
    'ocean-cay-msc-cruise-line',
  ].map((island) => to(`/locations/${island}`, '/partners')),

  // ============ Routes removed by the AEI handoff (July 2026) ===========
  /*
   * These routes shipped in the first sample build and were removed or merged
   * by the coding change handoff: the escort service page (S-01), the three
   * audience-specific partner pages (P-01), the standalone patient rights page
   * (I-05), and the medical equipment page (F-04). Each maps to the surviving
   * page that serves the same intent.
   */
  ...removedRoute('/services/commercial-medical-escort', '/services'),
  ...removedRoute('/partners/hospitals', '/partners'),
  ...removedRoute('/partners/cruise', '/partners'),
  ...removedRoute('/partners/insurance', '/partners'),
  ...removedRoute('/patient-rights', '/patients-families/insurance-and-payment'),
  ...removedRoute('/fleet/medical-equipment', '/services/critical-care-transport'),
  ...removedRoute('/patients-families/travel-and-family-support', '/patients-families'),

  // ===================== Governance =====================================
  to('/privacy-policy', '/legal/privacy'),
  to('/terms-of-use', '/legal/terms'),
  to('/terms-and-conditions', '/legal/terms'),

  // ===================== Blog ===========================================
  /*
   * 44 posts existed. There is no blog in phase 1 - page 25 says "Delete or
   * combine weak pages instead of mass-producing more" - so each post redirects
   * to the page serving the same intent.
   */
  to('/blog', '/coverage'),
  to('/author/rsmendoza1gmail-com', '/about'),

  // Posts that are genuinely about the service.
  to('/what-is-an-air-ambulance', '/services/air-ambulance'),
  to('/what-services-does-an-air-ambulance-offer', '/services/air-ambulance'),
  to('/an-overview-of-medevac-what-you-need-to-know', '/services/air-ambulance'),
  to('/what-to-expect-during-an-air-ambulance-emergency-flight', '/patients-families/how-it-works'),
  to('/top-reasons-someone-needs-an-emergency-air-ambulance', '/services/air-ambulance'),
  to('/exploring-medical-repatriation', '/services/medical-repatriation'),
  // The escort service page was removed by the AEI handoff (S-01); the
  // services landing page is the closest surviving intent.
  to('/difference-between-air-ambulance-and-commercial-airline-medial-escorts', '/services'),
  to('/locate-air-medical-flights', '/coverage'),
  to('/medical-emergency-abroad-tips', '/patients-families'),
  to('/air-evac-international-training-programs', '/fleet/flight-medical-team'),
  to(
    '/airevac-international-selects-adriana-yates-as-medical-director-for-florida-operations',
    '/about/leadership',
  ),

  // Recruitment posts.
  ...[
    'how-to-become-an-air-ambulance-nurse',
    'how-to-become-an-air-ambulance-paramedic',
    'how-to-become-an-air-evac-pilot',
  ].map((post) => to(`/${post}`, '/fleet/flight-medical-team')),

  // Route-specific service posts → the matching route page.
  to('/air-ambulance-services-cozumel', '/coverage/mexico/cozumel'),
  to('/air-ambulance-services-in-cabo-san-lucas', '/coverage/mexico/los-cabos'),
  to('/air-ambulance-services-puerto-vallarta', '/coverage/mexico/puerto-vallarta'),
  to(
    '/best-air-ambulance-transport-services-for-belize-city-belize',
    '/coverage/central-america/belize',
  ),
  to('/how-to-find-hospitals-urgent-care-emergency-care-in-cozumel-mexico', '/coverage/mexico/cozumel'),
  to('/how-to-find-emergency-medical-services-in-mexico', '/coverage/mexico'),

  /*
   * Travel and tourism posts. These carry no medical-transport intent, but they
   * do carry geography - and someone arriving from an old "things to do in
   * Cabo" link is plausibly in Cabo. Each goes to the route page for its
   * destination rather than to the homepage.
   */
  ...[
    '5-fun-things-cabo-san-lucas',
    'best-restaurants-in-cabo-san-lucas-mexico',
    'top-extreme-excursions-in-cabo-san-lucas-mexico',
  ].map((post) => to(`/${post}`, '/coverage/mexico/los-cabos')),

  ...['5-things-to-do-in-cozumel-mexico'].map((post) => to(`/${post}`, '/coverage/mexico/cozumel')),

  ...['7-things-to-do-in-san-jose-costa-rica'].map((post) =>
    to(`/${post}`, '/coverage/central-america/costa-rica'),
  ),

  ...['top-5-belize-extreme-tours'].map((post) => to(`/${post}`, '/coverage/central-america/belize')),

  ...['top-5-roatan-honduras-excursions'].map((post) =>
    to(`/${post}`, '/coverage/central-america/honduras'),
  ),

  // Mexico-general travel posts.
  ...[
    'cenote-diving-in-mexico-what-should-you-know',
    'ensenada-mexico-2019-events-festivals',
    'eight-best-mexico-adrenaline-extreme-tours',
    'nine-things-to-discover-about-san-miguel',
    'top-safety-tips-for-traveling-to-mexico',
    'scuba-diving-playa-del-carmen-mexico',
    'best-places-to-spend-christmas-in-mexico',
  ].map((post) => to(`/${post}`, '/coverage/mexico')),

  // Generic travel-safety posts with no geography → patient and family support.
  ...[
    'extreme-sports-first-aid-kit-checklist',
    'international-travel-checklist',
    'safe-eating-tips-while-traveling-abroad',
    'airline-travel-restrictions-pets',
    'traveling-with-pets-in-style',
    '10-safety-tips-for-driving-in-a-foreign-country',
    'why-is-it-important-to-stay-hydrated-when-traveling',
    'best-san-diego-excursions',
    'top-extreme-sports-in-miami-florida',
  ].map((post) => to(`/${post}`, '/patients-families')),

  // ===================== WordPress infrastructure =======================
  // Not content. Redirecting removes a class of scanner noise from the logs and
  // stops /wp-admin from 404-ing into the error path on every automated probe.
  { source: '/wp-admin/:path*', destination: '/en', permanent: true },
  { source: '/wp-login.php', destination: '/en', permanent: true },
  { source: '/wp-content/:path*', destination: '/en', permanent: true },
  { source: '/feed', destination: '/en', permanent: true },
  { source: '/comments/feed', destination: '/en', permanent: true },
  { source: '/xmlrpc.php', destination: '/en', permanent: true },
];
