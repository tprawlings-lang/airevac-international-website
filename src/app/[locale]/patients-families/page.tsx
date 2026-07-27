import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { PATIENT_PAGES } from '@/content/pages/patients';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';

/**
 * Patients and Families landing page. Blueprint page 11, "Patient and family"
 * template: "Calm hero | What happens next | Medical review | Cost and insurance
 * | Bedside-to-bedside | Rights | FAQ | Contact".
 */

const PAGE = PATIENT_PAGES.find((page) => page.path === '/patients-families');

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || PAGE === undefined) return {};
  return contentPageMetadata(PAGE, locale);
}

export default async function PatientsFamiliesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || PAGE === undefined) notFound();

  const dictionary = getDictionary(locale);

  return <ContentPage page={PAGE} locale={locale} breadcrumbs={[{ name: dictionary.common.home, path: '/' }]} />;
}
