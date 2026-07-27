import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { PATIENT_RIGHTS_PAGE } from '@/content/pages/patients';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';

/**
 * Patient rights and No Surprises Act page. Blueprint section 12 lists the No
 * Surprises Act as applicable to air ambulance billing and requires a
 * "Patient-rights notice, out-of-network language, GFE path for uninsured or
 * self-pay, approved dispute information".
 *
 * The page is the site's highest-risk content and is gated on D10 (approved
 * No Surprises and Good Faith Estimate documents from Legal and Billing). Until
 * a reviewer is recorded, `ContentPage` renders a visible "under review" state
 * so drafted text is never mistaken for an approved legal notice.
 */

const PAGE = PATIENT_RIGHTS_PAGE;

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

export default async function PatientRightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || PAGE === undefined) notFound();

  const dictionary = getDictionary(locale);

  return <ContentPage page={PAGE} locale={locale} breadcrumbs={[
        { name: dictionary.common.home, path: '/' },
        { name: dictionary.nav.patientsFamilies, path: '/patients-families' },
      ]} />;
}
