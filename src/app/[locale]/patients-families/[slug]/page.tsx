import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { PATIENT_PAGES } from '@/content/pages/patients';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { slugOf } from '@/lib/page-registry';

/**
 * Patient and family sub-pages. Blueprint page 8, "Patient support" template:
 * "Explain process, estimates, rights, and payment timing."
 *
 * The `/patients-families` landing page itself is a static route, so it is
 * excluded here to avoid two routes claiming the same URL.
 */

const PAGES = PATIENT_PAGES.filter((page) => page.path !== '/patients-families');

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

export default async function PatientPage({
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
        { name: dictionary.nav.patientsFamilies, path: '/patients-families' },
      ]}
    />
  );
}
