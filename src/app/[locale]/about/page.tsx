import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HubPage } from '@/components/HubPage';
import { ABOUT_PAGES } from '@/content/pages/about';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';

/**
 * Section landing page for `/about`. Blueprint section 3 gives each
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
    title: locale === 'es' ? 'Acerca de AirEvac International' : 'About AirEvac International',
    description:
      locale === 'es'
        ? 'Una empresa de transporte médico aéreo con base en Fort Lauderdale, concentrada en México, el Caribe y Centroamérica.'
        : 'An air medical transport company operating from Fort Lauderdale, concentrated on Mexico, the Caribbean, and Central America.',
    alternates: {
      canonical: localePath(locale, '/about'),
      languages: {
        'en-US': localePath('en', '/about'),
        'es-419': localePath('es', '/about'),
        'x-default': localePath('en', '/about'),
      },
    },
  };
}

export default async function AboutHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <HubPage
      locale={locale}
      title={locale === 'es' ? 'Acerca de AirEvac International' : 'About AirEvac International'}
      intro={
        locale === 'es'
          ? 'Quiénes somos, desde dónde operamos y qué afirmamos y qué no.'
          : 'Who we are, where we operate from, and what we will and will not claim.'
      }
      pages={ABOUT_PAGES.filter((page) => page.path !== '/about')}
      extraLinks={[
        {
          path: '/contact',
          title: locale === 'es' ? 'Contacto' : 'Contact',
          intro:
            locale === 'es'
              ? 'Teléfono, base de operaciones y cómo comunicarse con un coordinador.'
              : 'Phone, operating base, and how to reach a coordinator.',
        },
      ]}
    />
  );
}
