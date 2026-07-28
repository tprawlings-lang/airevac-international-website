import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { FOR_PARTNERS_PAGE } from '@/content/pages/partners';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';

/**
 * For Partners: the single merged page for hospitals, case managers, cruise
 * lines, and maritime callers (AEI handoff, Section 09). The old
 * /partners/hospitals, /partners/cruise, and /partners/insurance routes
 * redirect here in one hop.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return contentPageMetadata(FOR_PARTNERS_PAGE, locale);
}

export default async function ForPartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <ContentPage
      page={FOR_PARTNERS_PAGE}
      locale={locale}
      breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
    />
  );
}
