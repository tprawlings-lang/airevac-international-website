import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';

/**
 * Robots rules. Blueprint section 19: "clean robots rules, noindex for staging,
 * search results, secure flows and portal pages."
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
 */

const IS_PRODUCTION = SITE.url === 'https://airevacinternational.com';

/**
 * Evaluated per request, not at build time.
 *
 * `SITE_URL` is read at runtime by canonical tags and hreflang. If this route
 * were statically generated it would capture whatever `SITE_URL` was set during
 * the build, and a deploy that changed the variable without rebuilding would
 * advertise one origin here and a different one in the page markup.
 */
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Secure flow - see the note above about crawling vs indexing.
          '/en/request-transport',
          '/es/request-transport',
          // Not content.
          '/api/',
          // Legacy WordPress paths that now redirect; no reason to crawl them.
          '/wp-admin/',
          '/wp-content/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
