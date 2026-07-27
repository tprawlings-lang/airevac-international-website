import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { SERVICE_PAGES } from '@/content/pages/services';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';

/**
 * Service pages. Blueprint page 8, "Service" template:
 *   "Air Ambulance, Repatriation, Critical Care, Medical Escort — Explain fit,
 *    process, medical review, and limits."
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

  return (
    <ContentPage
      page={page}
      locale={locale}
      breadcrumbs={[
        { name: dictionary.common.home, path: '/' },
        { name: dictionary.nav.services, path: '/services' },
      ]}
    />
  );
}
