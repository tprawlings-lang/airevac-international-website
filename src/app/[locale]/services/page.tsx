import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HubPage } from '@/components/HubPage';
import { SERVICE_PAGES } from '@/content/pages/services';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';

/**
 * Section landing page for `/services`. Blueprint section 3 gives each
 * top-level navigation group a landing page so a visitor who clicks the group
 * label lands somewhere useful rather than on the first child by accident.
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

  return {
    title: locale === 'es' ? 'Servicios' : 'Services',
    description:
      locale === 'es'
        ? 'Ambulancia aérea, repatriación médica y transporte de cuidados críticos: qué cubre cada uno y a quién corresponde.'
        : 'Air ambulance, medical repatriation, and critical care transport: what each covers and who it suits.',
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
    <HubPage
      locale={locale}
      title={locale === 'es' ? 'Servicios' : 'Services'}
      intro={
        locale === 'es'
          ? 'Cuatro tipos de transporte, y cómo saber cuál corresponde a un paciente.'
          : 'Four transport types, and how to tell which one fits a patient.'
      }
      pages={SERVICE_PAGES}
      
    />
  );
}
