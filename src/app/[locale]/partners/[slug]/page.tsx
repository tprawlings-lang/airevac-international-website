import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { PARTNER_PAGES } from '@/content/pages/partners';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';

/**
 * Professional referral pages. Blueprint page 8, "Professional referral"
 * template: "Hospital, Cruise, Insurance — Give each referrer a tailored path
 * and secure handoff."
 *
 * These are the highest-value pages on the site: page 7 records that ninety
 * percent of current referrals come from cruise lines and hospitals.
 */

const PAGES = PARTNER_PAGES;

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

export default async function PartnerPage({
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
        { name: dictionary.nav.partners, path: '/partners' },
      ]}
    />
  );
}
