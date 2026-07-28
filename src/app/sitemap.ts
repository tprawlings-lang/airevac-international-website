import type { MetadataRoute } from 'next';
import { SITE } from '@/content/site';
import { COVERAGE_REGIONS, PRIORITY_ROUTES } from '@/content/navigation';
import { ALL_CONTENT_PAGES } from '@/lib/page-registry';
import { LOCALES, localePath } from '@/lib/i18n';

/**
 * XML sitemap. Blueprint section 19:
 *   "XML sitemaps split by content type, clean robots rules, noindex for
 *    staging, search results, secure flows and portal pages."
 *
 * Generated from the same registries the pages render from, so a new page cannot
 * be published and silently omitted - the readiness matrix on page 22 records
 * SEO as Fail/High partly because of exactly that class of mismatch.
 *
 * EXCLUDED ON PURPOSE:
 *   /request-transport  - a secure flow, `noindex` in its own metadata.
 *   /api/*              - not content.
 *
 * `alternates.languages` gives each entry its hreflang pair, which section 3
 * requires for the bilingual content set.
 */

/**
 * Priorities express relative importance within this site only. The urgent
 * contact paths and the highest-volume referral pages rank above informational
 * and governance pages.
 */
function priorityFor(path: string): number {
  if (path === '/') return 1.0;
  if (path.startsWith('/partners')) return 0.9;
  if (path.startsWith('/services')) return 0.8;
  if (path.startsWith('/coverage')) return 0.8;
  if (path === '/credentials' || path === '/fleet') return 0.7;
  if (path.startsWith('/patient')) return 0.7;
  if (path.startsWith('/legal')) return 0.3;
  return 0.6;
}

function entry(path: string, lastModified: Date): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE.url}${localePath('en', path)}`,
    lastModified,
    changeFrequency: path.startsWith('/legal') ? 'yearly' : 'monthly',
    priority: priorityFor(path),
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((locale) => [
          locale === 'en' ? 'en-US' : 'es-419',
          `${SITE.url}${localePath(locale, path)}`,
        ]),
      ),
    },
  };
}

/**
 * Evaluated per request, not at build time.
 *
 * `SITE_URL` is read at runtime by canonical tags and hreflang. If this route
 * were statically generated it would capture whatever `SITE_URL` was set during
 * the build, and a deploy that changed the variable without rebuilding would
 * advertise one origin here and a different one in the page markup.
 */
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  /*
   * A single build timestamp for every entry. Per-page `lastModified` should
   * come from the CMS's own revision date once content moves there; a fabricated
   * per-page date would be worse than an honest build date, because crawlers
   * treat it as a recrawl signal.
   */
  const lastModified = new Date();

  const staticPaths = [
    '/',
    '/contact',
    '/credentials',
    '/fleet',
    '/services',
    '/partners',
    '/coverage',
    '/about',
    '/patients-families',
  ];

  const contentPaths = ALL_CONTENT_PAGES.map((page) => page.path);

  const coveragePaths = [
    ...COVERAGE_REGIONS.map((region) => `/coverage/${region.slug}`),
    // Other Destinations is a static coverage child (AEI handoff, Section 13).
    '/coverage/other-destinations',
    ...PRIORITY_ROUTES.map((route) => `/coverage/${route.region}/${route.slug}`),
  ];

  // De-duplicate: a path can appear in both the static list and the registry.
  const allPaths = [...new Set([...staticPaths, ...contentPaths, ...coveragePaths])];

  return allPaths.map((path) => entry(path, lastModified));
}
