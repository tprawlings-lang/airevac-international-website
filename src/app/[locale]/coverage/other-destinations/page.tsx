import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';
import { CtaLink, PhoneCta } from '@/components/ui/Cta';
import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';

/**
 * Other Destinations: new coverage child page per the AEI handoff (Section 13).
 * Hero and contact copy are the handoff's exact published text. This static
 * folder takes precedence over the dynamic [region] route, so the slug does not
 * need to join COVERAGE_REGIONS.
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

  const path = '/coverage/other-destinations';
  return {
    title: locale === 'es' ? 'Otros destinos' : 'Other Destinations',
    description:
      locale === 'es'
        ? 'Rutas fuera de las áreas principales de servicio de AEI, revisadas caso por caso ' +
          'según disponibilidad de aeronave, acceso a aeropuertos, permisos y necesidades médicas.'
        : 'Routes outside AEI’s primary service areas, reviewed case by case based on ' +
          'aircraft availability, airport access, permits, medical needs, and receiving bed ' +
          'acceptance.',
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        'en-US': localePath('en', path),
        'es-419': localePath('es', path),
        'x-default': localePath('en', path),
      },
    },
  };
}

export default async function OtherDestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        title={locale === 'es' ? 'Otros destinos' : 'Other Destinations'}
        intro={
          locale === 'es'
            ? 'Necesita transporte fuera de las áreas principales de servicio de AEI? ' +
              'Nuestros coordinadores revisan otras rutas nacionales e internacionales según ' +
              'la disponibilidad de aeronave, el acceso a aeropuertos, los permisos, las ' +
              'necesidades médicas y la aceptación de cama en el centro receptor.'
            : 'Need transport outside AEI’s primary service areas? Our coordinators review ' +
              'other domestic and international routes based on aircraft availability, ' +
              'airport access, permits, medical needs, and receiving bed acceptance.'
        }
        breadcrumbs={[
          { name: dictionary.common.home, path: '/' },
          { name: dictionary.nav.coverage, path: '/coverage' },
        ]}
      />

      <Section>
        <Container width="narrow">
          <h2 className="text-2xl font-bold text-navy-900">
            {locale === 'es' ? 'Consulte por otra ubicación' : 'Ask About Another Location'}
          </h2>
          <p className="mt-3 text-ink-700">
            {locale === 'es'
              ? 'Llame al (619) 754-6755 o escriba a ops@aeiamericas.com. No podemos ' +
                'garantizar disponibilidad de aeronave ni servicio a todas las ubicaciones.'
              : 'Call (619) 754-6755 or email ops@aeiamericas.com. We cannot guarantee ' +
                'aircraft availability or service to every location.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <PhoneCta label={dictionary.common.callCoordinator} />
            <CtaLink href={SITE.email.href} variant="secondary">
              {SITE.email.display}
            </CtaLink>
          </div>
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}
