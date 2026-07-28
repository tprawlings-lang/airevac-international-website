import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { LEGAL_PAGES } from '@/content/pages/legal';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';

/**
 * Governance pages. Blueprint page 8, "Governance" template: "Privacy, Notice of
 * Privacy Practices, No Surprises and GFE, Terms, Accessibility, Cookie
 * Settings - Publish approved notices and rights paths."
 *
 * Every page here carries `reviewer: null` until Legal signs off (D10), so each
 * renders a visible "under review" state rather than presenting drafted text as
 * an approved notice.
 */

const PAGES = LEGAL_PAGES;

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

export default async function LegalPage({
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
        { name: dictionary.nav.legal, path: '/legal/privacy' },
      ]}
    />
  );
}
