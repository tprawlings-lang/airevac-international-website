import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';

/**
 * Robots rules. Blueprint section 19 ("clean robots rules, noindex for staging,
 * search results, secure flows and portal pages") and the AI Search Coding
 * Handoff section 4, which separates two things this file must not confuse:
 *
 *   SEARCH AND ANSWER-ENGINE CRAWLERS fetch pages so the site can be found,
 *   summarized, and cited. Blocking them removes AirEvac from Google, Bing,
 *   ChatGPT search, Claude search, and Perplexity results. All are allowed.
 *
 *   MODEL-TRAINING CRAWLERS collect pages into training corpora. Blocking them
 *   has no effect on search visibility, which is why the handoff's default was
 *   to block them.
 *
 * AIREVAC APPROVED ALLOWING BOTH (decision A1, 2026-07-30), on the goal of
 * being as discoverable and citable by AI systems as possible. The reasoning
 * is that a model trained on these pages can describe AirEvac without needing
 * to search at the moment it is asked, which is a different and longer-lived
 * path to being recommended than live retrieval.
 *
 * THE TRADE-OFF THAT COMES WITH IT, recorded because it is not reversible in
 * the way most settings are: content collected into a training corpus cannot be
 * withdrawn from a model already trained on it. Re-blocking these agents later
 * stops future collection and does not undo past collection. That is acceptable
 * here specifically because every published page is already public marketing
 * copy that passes the claim gates; no page carries patient information, and
 * the secure flow is disallowed to every agent below.
 *
 * STAGING IS BLOCKED BY ORIGIN, NOT BY A FLAG. `SITE.url` comes from the
 * SITE_URL environment variable, whose default is deliberately NOT production -
 * so a preview or staging deploy that simply omits the variable serves a
 * disallow-all. Indexing is opt-in, and it cannot happen by omission.
 *
 * Note that `Disallow` controls crawling, not indexing. The secure flow at
 * /request-transport ALSO sets `robots: { index: false }` in its own metadata,
 * because a URL that is disallowed from crawling can still be indexed from an
 * external link. Belt and braces on the one page where it matters.
 *
 * ROBOTS.TXT PERMISSION IS NOT ACCESS. The handoff is emphatic about this: a
 * firewall, bot-protection rule, or JavaScript challenge can still block a
 * crawler that this file welcomes. scripts/crawler-access-check.mjs fetches the
 * live site as each agent below and fails if any of them is served something
 * different from a browser.
 */

const IS_PRODUCTION = SITE.url === 'https://airevacinternational.com';

/**
 * Crawlers that feed search results and AI answers. Named explicitly rather
 * than left to the wildcard because an explicit group is self-documenting: a
 * future contributor tightening the wildcard rule can see exactly which agents
 * the business depends on.
 */
export const SEARCH_CRAWLERS = [
  // Google Search, which also gates AI Overviews and AI Mode eligibility.
  'Googlebot',
  'Googlebot-Image',
  // Bing, which also supplies Microsoft Copilot.
  'Bingbot',
  // ChatGPT search results and citations.
  'OAI-SearchBot',
  // ChatGPT fetching a page because a user asked about it.
  'ChatGPT-User',
  // Claude search results and citations.
  'Claude-SearchBot',
  'ClaudeBot',
  // Claude fetching a page because a user asked about it.
  'Claude-User',
  // Perplexity, which the analytics channel rules also track as a referrer.
  'PerplexityBot',
  'DuckDuckBot',
];

/**
 * Model-training crawlers, allowed per decision A1. See the trade-off note at
 * the top of this file before changing this list.
 *
 * Kept as a separate array rather than merged into SEARCH_CRAWLERS because the
 * two groups answer different questions and carry different risks. Anyone
 * revisiting the policy needs to see which agents affect search visibility and
 * which affect training, and a single flat list hides exactly that.
 */
export const TRAINING_CRAWLERS = [
  // OpenAI model training.
  'GPTBot',
  // Google model training (Gemini). Separate from Googlebot, which is search.
  'Google-Extended',
  // Apple model training. Separate from Applebot, which is search.
  'Applebot-Extended',
  // Common Crawl, the corpus most open models are trained from.
  'CCBot',
  // Meta model training.
  'meta-externalagent',
];

/**
 * Paths no crawler should fetch.
 *
 * REPEATED IN EVERY GROUP ON PURPOSE. A robots.txt crawler obeys only the most
 * specific group matching its user agent and ignores every other group,
 * including the wildcard. A named `Googlebot` group without these disallows
 * would therefore let Googlebot crawl the secure flow that the wildcard group
 * forbids. Asserted in tests/content-governance.test.ts.
 */
export const DISALLOWED_PATHS = [
  // Secure flow - see the note above about crawling vs indexing.
  '/en/request-transport',
  '/es/request-transport',
  // Not content.
  '/api/',
  // Legacy WordPress paths that now redirect; no reason to crawl them.
  '/wp-admin/',
  '/wp-content/',
];

/**
 * Evaluated per request, not at build time.
 *
 * `SITE_URL` is read at runtime by canonical tags and hreflang. If this route
 * were statically generated it would capture whatever `SITE_URL` was set during
 * the build, and a deploy that changed the variable without rebuilding would
 * advertise one origin here and a different one in the page markup.
 */
export const dynamic = 'force-dynamic';

/**
 * The rules served in production.
 *
 * Split out from the default export so tests can assert their shape: the
 * default export returns a disallow-all under any non-production origin, which
 * includes the test environment, so calling it would only ever prove the
 * staging behaviour.
 */
export function productionRules(): MetadataRoute.Robots['rules'] {
  return [
    { userAgent: SEARCH_CRAWLERS, allow: '/', disallow: DISALLOWED_PATHS },
    { userAgent: TRAINING_CRAWLERS, allow: '/', disallow: DISALLOWED_PATHS },
    { userAgent: '*', allow: '/', disallow: DISALLOWED_PATHS },
  ];
}

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: productionRules(),
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
