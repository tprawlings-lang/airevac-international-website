import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { ABOUT_PAGES } from '@/content/pages/about';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';

/**
 * About sub-pages. Blueprint page 8, "Trust" template: "Show only verified proof
 * with dates and sources."
 *
 * The `/about` landing page is a static route and is excluded here.
 */

const PAGES = ABOUT_PAGES.filter((page) => page.path !== '/about');

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => PAGES.map((page) => ({ locale, slug: slugOf(page) })));
}

/** Unknown slugs 404 rather than rendering an empty shell. */
export const dynamicParams = false;

function find(slug: string) {
  return PAGES.find((page) => slugOf(page) === slug);
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

export default async function AboutSubPage({
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
        { name: dictionary.nav.about, path: '/about' },
      ]}
    />
  );
}
