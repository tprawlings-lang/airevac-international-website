import type { PageContent } from '@/content/blocks';
import { ABOUT_PAGES } from '@/content/pages/about';
import { FLEET_PAGES } from '@/content/pages/fleet';
import { LEGAL_PAGES } from '@/content/pages/legal';
import { PARTNER_PAGES } from '@/content/pages/partners';
import { PATIENT_PAGES, PATIENT_RIGHTS_PAGE } from '@/content/pages/patients';
import { SERVICE_PAGES } from '@/content/pages/services';

/**
 * Every block-based content page in one place.
 *
 * The registry exists so that the sitemap, the route tests, and the CI content
 * report all read from a single source. Before this existed, adding a page meant
 * remembering to add it to the sitemap too — and a page missing from the sitemap
 * is exactly the silent SEO failure the readiness matrix flags on page 22.
 */
export const ALL_CONTENT_PAGES: readonly PageContent[] = [
  ...SERVICE_PAGES,
  ...PARTNER_PAGES,
  ...PATIENT_PAGES,
  PATIENT_RIGHTS_PAGE,
  ...ABOUT_PAGES,
  ...FLEET_PAGES,
  ...LEGAL_PAGES,
];

/** Looks up a page by its canonical English path. */
export function findPageByPath(path: string): PageContent | undefined {
  return ALL_CONTENT_PAGES.find((page) => page.path === path);
}

/**
 * Extracts the final path segment, for `generateStaticParams` on the dynamic
 * `[slug]` routes.
 */
export function slugOf(page: PageContent): string {
  const segments = page.path.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

/** Pages under a given path prefix, e.g. `/services`. */
export function pagesUnder(prefix: string): PageContent[] {
  return ALL_CONTENT_PAGES.filter((page) => page.path.startsWith(`${prefix}/`));
}
