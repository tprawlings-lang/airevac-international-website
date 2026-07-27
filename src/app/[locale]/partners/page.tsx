import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HubPage } from '@/components/HubPage';
import { PARTNER_PAGES } from '@/content/pages/partners';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';

/**
 * Section landing page for `/partners`. Blueprint section 3 gives each
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
    title: locale === 'es' ? 'Para socios' : 'For Partners',
    description:
      locale === 'es'
        ? 'Recursos de remisión para gestores de casos hospitalarios, equipos médicos de cruceros y marítimos, y aseguradoras y compañías de asistencia.'
        : 'Referral resources for hospital case managers, cruise and maritime medical teams, and insurance and assistance companies.',
    alternates: {
      canonical: localePath(locale, '/partners'),
      languages: {
        'en-US': localePath('en', '/partners'),
        'es-419': localePath('es', '/partners'),
        'x-default': localePath('en', '/partners'),
      },
    },
  };
}

export default async function PartnersHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <HubPage
      locale={locale}
      title={locale === 'es' ? 'Para socios' : 'For Partners'}
      intro={
        locale === 'es'
          ? 'Rutas de remisión creadas para los equipos que nos envían la mayoría de nuestros casos.'
          : 'Referral paths built for the teams who send us most of our cases.'
      }
      pages={PARTNER_PAGES}
      
    />
  );
}
