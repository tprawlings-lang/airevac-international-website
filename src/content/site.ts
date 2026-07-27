/**
 * Site-wide constants. Blueprint section 2 (Market position and conversion plan)
 * and the Fort Lauderdale contact record confirmed by the airport directory [S4].
 */

export const SITE = {
  name: 'AirEvac International',

  /**
   * Canonical production origin. Used for canonical tags, hreflang, sitemap, and
   * structured data. Override per-environment with SITE_URL so staging never
   * emits production canonicals (section 19: "noindex for staging").
   */
  url: process.env.SITE_URL ?? 'https://airevacinternational.com',

  /**
   * The primary conversion. Blueprint page 7: "Primary: Call a Flight
   * Coordinator 24/7 at 619-754-6755." Confirmed against the FXE directory [S4].
   *
   * This number must remain reachable when every other component fails — see
   * `PhoneFallback` and the graceful-degradation rule on page 20.
   */
  phone: {
    display: '619-754-6755',
    /** E.164, for `tel:` links. */
    href: 'tel:+16197546755',
  },

  base: {
    name: 'Fort Lauderdale Executive Airport (FXE)',
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
} as const;
