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
  /**
   * Live coordinator chat.
   *
   * DRIVEN BY CONFIGURATION so the feature can be exercised on a test deploy
   * without a code change, the same way analytics is. `CHAT_ENABLED=true`
   * turns on the public widget and every chat endpoint; absent, none of it is
   * reachable and the endpoints return 404.
   *
   * IT MUST STAY OFF ON THE PRODUCTION ORIGIN UNTIL THE BUSINESS ASSOCIATE
   * AGREEMENT IS EXECUTED. A chat receives patient details within the first
   * minute, and the executed agreement is what makes storing them lawful.
   * `assertChatConfigurationIsSane()` logs a loud warning when this is enabled
   * on the production origin, because a misconfiguration that quietly starts
   * collecting patient conversations is the worst failure this system has.
   */
  get secureChat(): boolean {
    return (process.env.CHAT_ENABLED ?? '') === 'true';
  },

  /** PENDING D8: protected clinical intake vendor. */
  clinicalUpload: false,

  /** PENDING D7: JetInsight adapter. No browser-direct write, ever. */
  jetInsightAdapter: false,

  /** PENDING D13: private-pay payment flow. Hosted page only when enabled. */
  hostedPayments: false,

  /**
   * Measurement. APPROVED by AirEvac (decision A2, 2026-07-30).
   *
   * DRIVEN BY CONFIGURATION RATHER THAN BY A HARDCODED BOOLEAN. Analytics is
   * active exactly when a GA4 measurement ID is present in the environment,
   * which means three things are true at once and cannot drift apart: the
   * measurement layer runs, the CSP permits the beacon host (src/proxy.ts),
   * and the privacy notice's conditional wording describes what is actually
   * happening. Flipping a boolean while no ID existed would have produced a
   * site that claimed to measure and did not; setting an ID while a boolean
   * stayed false would have produced the reverse.
   *
   * WHAT IS STILL DELIBERATELY OFF, and is not covered by decision A2:
   * session replay and heatmap recording. The approvals document recommended
   * declining Microsoft Clarity, and nothing here loads a replay tool. A page
   * where someone types a patient's situation into a form is not a page to
   * record.
   */
  get analytics(): boolean {
    return (process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '').length > 0;
  },
} as const;

/**
 * Shouts about configurations that are individually valid and dangerous
 * together. Called once at startup from the root layout.
 *
 * Neither case throws. Refusing to boot would take the whole marketing site
 * down over a chat setting, and the phone number on every page is the thing
 * that must never stop being served.
 */
export function assertChatConfigurationIsSane(): void {
  const isProduction = SITE.url === 'https://airevacinternational.com';

  if (FEATURES.secureChat && isProduction) {
    // `error`, not `warn`: the lint rule allows only error in src/, and a
    // chat quietly collecting patient conversations without an executed
    // agreement is an error rather than a caution.
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'config.chat_enabled_in_production',
        message:
          'Live chat is enabled on the production origin. This is only lawful once the ' +
          'Business Associate Agreement covering the database is executed, because the ' +
          'transcript store receives patient information. If it is not signed, set ' +
          'CHAT_ENABLED=false now.',
      }),
    );
  }

  if (process.env.TRANSLATION_MODE === 'stub' && isProduction) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'config.stub_translation_in_production',
        message:
          'TRANSLATION_MODE=stub is set on the production origin and has been IGNORED. ' +
          'Stub translation returns marked placeholder text, and showing that to a family ' +
          'arranging a medical transport would be worse than showing nothing.',
      }),
    );
  }
}
