/**
 * Site-wide constants. Blueprint section 2 (Market position and conversion plan)
 * and the Fort Lauderdale contact record confirmed by the airport directory [S4].
 */

export const SITE = {
  name: 'AirEvac International',

  /**
   * Origin used for canonical tags, hreflang, sitemap, and structured data.
   *
   * THE DEFAULT IS DELIBERATELY NOT PRODUCTION. Section 19 requires "noindex for
   * staging", and the only way to guarantee that is to make production the thing
   * you must opt into rather than the thing you get by forgetting a variable.
   *
   * A preview deploy that omits SITE_URL gets localhost here, which makes
   * `IS_PRODUCTION` false in robots.ts - so it serves a disallow-all robots.txt
   * and `noindex`, instead of advertising itself with production canonicals.
   */
  url: process.env.SITE_URL ?? 'http://localhost:3000',

  /**
   * The primary conversion. Blueprint page 7: "Primary: Call a Flight
   * Coordinator 24/7 at 619-754-6755." Confirmed against the FXE directory [S4].
   *
   * This number must remain reachable when every other component fails - see
   * `PhoneFallback` and the graceful-degradation rule on page 20.
   */
  phone: {
    display: '(619) 754-6755',
    /** E.164, for `tel:` links. */
    href: 'tel:+16197546755',
  },

  /**
   * Operations email and fax, per the AEI change handoff (G-05, G-06):
   * coordination is presented as available 24/7 by phone and email, and
   * clinical documents are directed to email or fax. The handoff cross-checks
   * the fax number against AirEvac's current public materials [R1] [R2].
   */
  email: {
    display: 'ops@aeiamericas.com',
    href: 'mailto:ops@aeiamericas.com',
  },
  fax: {
    display: '(619) 330-4551',
  },

  base: {
    name: 'Fort Lauderdale Executive Airport (KFXE)',
    street: '2525 NW 55th Court, Hangar 24',
    locality: 'Fort Lauderdale',
    region: 'FL',
    postalCode: '33309',
    country: 'US',
    /** Source for the address and phone. */
    source: '[S4] Fort Lauderdale Executive Airport business directory',
  },
} as const;

/**
 * Conversion hierarchy, blueprint page 7. Order is load-bearing: the phone is
 * always first, and the emergency notice is always present.
 */
export const CONVERSION_ORDER = [
  'call',
  'secure-chat',
  'callback',
  'professional-referral',
] as const;

export type ConversionAction = (typeof CONVERSION_ORDER)[number];

/**
 * Feature flags for capabilities that depend on an unsigned vendor agreement.
 *
 * Blueprint page 13 requires a signed BAA, a security review, retention rules,
 * and tested staffing before secure chat is customer-facing. Until D8 closes,
 * chat renders as a disabled affordance that routes to phone and callback
 * rather than as a broken widget.
 */
export const FEATURES = {
  /** PENDING D8: secure chat vendor selection and BAA. */
  secureChat: false,

  /** PENDING D8: protected clinical intake vendor. */
  clinicalUpload: false,

  /** PENDING D7: JetInsight adapter. No browser-direct write, ever. */
  jetInsightAdapter: false,

  /** PENDING D13: private-pay payment flow. Hosted page only when enabled. */
  hostedPayments: false,

  /**
   * PENDING approvals-document item A2: GA4 and Tag Manager.
   *
   * The measurement layer in src/lib/analytics.ts is written and tested but
   * inert while this is false. Enabling it requires more than this flag: the
   * privacy notice states the site sets no analytics cookies, and the Notice
   * of Privacy Practices describes a site running no measurement on pages
   * carrying sensitive information. Both must be revised and re-approved
   * first, or the site's own privacy notice becomes untrue.
   */
  analytics: false,
} as const;
