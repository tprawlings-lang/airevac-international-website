import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { SERVICE_PAGES } from '@/content/pages/services';
import { getDictionary } from '@/content/dictionary';
import { COVERAGE_REGIONS } from '@/content/navigation';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';
import { serializeJsonLd, serviceJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Service pages. Blueprint page 8, "Service" template: explain fit, process,
 * medical review, and limits. The AEI handoff reduces the set to three pages:
 * Air Ambulance, Repatriation, and Critical Care.
 *
 * Statically generated for both locales so the CDN serves them without touching
 * an origin, which is what the availability target on page 20 depends on.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    SERVICE_PAGES.map((page) => ({ locale, slug: slugOf(page) })),
  );
}

/** Unknown slugs 404 rather than rendering an empty shell. */
export const dynamicParams = false;

function find(slug: string) {
  return SERVICE_PAGES.find((page) => slugOf(page) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = find(slug);
  if (!isLocale(locale) || page === undefined) return {};
  return contentPageMetadata(page, locale);
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const page = find(slug);
  if (page === undefined) notFound();

  const dictionary = getDictionary(locale);
  const nonce = await getNonce();

  /*
   * Service schema (AI Search Coding Handoff section 7). `areaServed` is the
   * same four regions the visible Focused Coverage copy names, read from the
   * navigation registry rather than restated here, so the markup cannot drift
   * from the page. No offers or ratings: pricing is not published and the
   * handoff bars review markup built from testimonials.
   */
  const areaServed = COVERAGE_REGIONS.map((region) => region.name);

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            serviceJsonLd(
              locale,
              { path: page.path, title: page.title, description: page.description },
              areaServed,
            ),
          ),
        }}
      />

      <ContentPage
        page={page}
        locale={locale}
        breadcrumbs={[
          { name: dictionary.common.home, path: '/' },
          { name: dictionary.nav.services, path: '/services' },
        ]}
      />
    </>
  );
}
