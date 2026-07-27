import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AircraftCard } from '@/components/AircraftCard';
import { ContactBlock } from '@/components/ContactBlock';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';
import { getDictionary } from '@/content/dictionary';
import { FLEET } from '@/content/fleet';
import { FLEET_PAGES } from '@/content/pages/fleet';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';
import { publishable } from '@/lib/credential-register';

/**
 * Fleet page. Blueprint page 2 sets the approved fleet copy — "Two Learjet 31As:
 * N322PR and N669MD" — and page 6 sets the exact allowed language:
 *
 *   Allowed: "AirEvac's current working fleet includes Learjet 31A aircraft
 *             N322PR and N669MD."
 *   Do not say: "Owned and operated unless leases, OpSpecs, and operating
 *               control are documented."
 *
 * The copy below uses the allowed wording verbatim. `AircraftCard` enforces the
 * rest: Learjet 35 N277MK is on hold pending D5 and therefore renders nowhere,
 * and no ownership language appears while `ownershipLanguageCleared` is false.
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
    title: locale === 'es' ? 'Flota Learjet 31A' : 'Learjet 31A Fleet',
    description:
      locale === 'es'
        ? 'La flota de trabajo actual de AirEvac International incluye los Learjet 31A ' +
          'N322PR y N669MD, con enlaces de verificación al registro de la FAA.'
        : 'AirEvac International’s current working fleet includes Learjet 31A aircraft N322PR ' +
          'and N669MD, with verification links to the FAA registry.',
    alternates: {
      canonical: localePath(locale, '/fleet'),
      languages: {
        'en-US': localePath('en', '/fleet'),
        'es-419': localePath('es', '/fleet'),
        'x-default': localePath('en', '/fleet'),
      },
    },
  };
}

export default async function FleetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const now = new Date();
  const visibleAircraft = FLEET.filter((aircraft) => publishable(aircraft.claim, now));

  return (
    <>
      <PageHeader
        locale={locale}
        title={locale === 'es' ? 'Flota Learjet 31A' : 'Learjet 31A Fleet'}
        // Approved wording from blueprint page 6, used verbatim.
        intro={
          locale === 'es'
            ? 'La flota de trabajo actual incluye los Learjet 31A N322PR y N669MD.'
            : 'The current working fleet includes Learjet 31A aircraft N322PR and N669MD.'
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {visibleAircraft.map((aircraft) => (
              <AircraftCard
                key={aircraft.tailNumber}
                aircraft={aircraft}
                locale={locale}
                now={now}
              />
            ))}
          </div>

          {/*
           * Registration is a public FAA fact and is presented as exactly that.
           * Page 5: "Registration does not by itself establish the current
           * operating certificate, medical configuration, beneficial ownership,
           * or Part 135 OpSpecs." Saying so is what stops a reader inferring
           * more from these cards than they support.
           */}
          <p className="mt-8 max-w-3xl rounded-panel border border-ink-300 bg-support-50 p-5 text-sm text-ink-700">
            {locale === 'es'
              ? 'Los datos de matrícula provienen del registro de aeronaves de la FAA y se ' +
                'pueden verificar en los enlaces anteriores. La matrícula por sí sola no ' +
                'establece el certificado operativo, la configuración médica ni la titularidad ' +
                'efectiva de una aeronave.'
              : 'Registration details come from the FAA Aircraft Registry and can be verified ' +
                'through the links above. Registration alone does not establish an aircraft’s ' +
                'operating certificate, medical configuration, or beneficial ownership.'}
          </p>

          <nav aria-label={locale === 'es' ? 'Más sobre la flota' : 'More about the fleet'} className="mt-12">
            <h2 className="text-2xl font-bold text-navy-900">
              {locale === 'es' ? 'Equipo y tripulación' : 'Equipment and crew'}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {FLEET_PAGES.map((page) => (
                <li key={page.path}>
                  <Link
                    href={localePath(locale, page.path)}
                    className="flex h-full flex-col rounded-panel border border-ink-300 bg-white p-5 hover:border-navy-800 hover:bg-support-50"
                  >
                    <span className="text-lg font-bold text-navy-900">{page.title}</span>
                    <span className="mt-2 text-sm text-ink-700">{page.intro}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={localePath(locale, '/credentials')}
                  className="flex h-full flex-col rounded-panel border border-ink-300 bg-white p-5 hover:border-navy-800 hover:bg-support-50"
                >
                  <span className="text-lg font-bold text-navy-900">
                    {dictionary.credentials.heading}
                  </span>
                  <span className="mt-2 text-sm text-ink-700">
                    {locale === 'es'
                      ? 'Acreditaciones y registros verificables.'
                      : 'Verifiable accreditations and registrations.'}
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}
