import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HubPage } from '@/components/HubPage';
import { PageGraph } from '@/components/PageGraph';
import { getDictionary } from '@/content/dictionary';
import { SERVICE_PAGES } from '@/content/pages/services';
import { isLocale, localePath, LOCALES, type Locale } from '@/lib/i18n';

/**
 * Section landing page for `/services`. Blueprint section 3 gives each
 * top-level navigation group a landing page so a visitor who clicks the group
 * label lands somewhere useful rather than on the first child by accident.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Title and description, defined once and used by both the page metadata and
 * the structured-data graph. Two copies of these strings is how a page ends up
 * telling a crawler one thing in its <title> and another in its JSON-LD.
 */
function servicesMeta(locale: Locale) {
  return {
    title: locale === 'es' ? 'Servicios' : 'Services',
    description: locale === 'es'
        ? 'Ambulancia aérea, repatriación médica y transporte de cuidados críticos: qué cubre cada uno y a quién corresponde.'
        : 'Air ambulance, medical repatriation, and critical care transport: what each covers and who it suits.',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    ...servicesMeta(locale),
    alternates: {
      canonical: localePath(locale, '/services'),
      languages: {
        'en-US': localePath('en', '/services'),
        'es-419': localePath('es', '/services'),
        'x-default': localePath('en', '/services'),
      },
    },
  };
}

export default async function ServicesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <>
      <PageGraph
        locale={locale}
        path={'/services'}
        {...servicesMeta(locale)}
        breadcrumbs={[{ name: getDictionary(locale).common.home, path: '/' }]}
      />

      <HubPage
        locale={locale}
        title={locale === 'es' ? 'Servicios' : 'Services'}
        intro={
          locale === 'es'
            ? 'Tres tipos de transporte, y cómo saber cuál corresponde a un paciente.'
            : 'Three transport types, and how to tell which one fits a patient.'
        }
        pages={SERVICE_PAGES}
      
      />
    </>
  );
}
