import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { PageGraph } from '@/components/PageGraph';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';
import { getDictionary } from '@/content/dictionary';
import { FLEET_PAGES } from '@/content/pages/fleet';
import { isLocale, localePath, LOCALES, type Locale } from '@/lib/i18n';
import { Photo } from '@/components/graphics/Photo';
import { AircraftPlanform } from '@/components/graphics/HeroBackdrop';

/**
 * Fleet page. The AEI handoff (G-03/G-04) supersedes the blueprint's original
 * fleet copy: registrations never appear publicly, in text or alt text. The
 * only approved public statement is model and quantity - "The current working
 * fleet is two Learjet 31A aircraft." The registration-to-internal-reference
 * mapping lives in docs/fleet-register.md, which is not published.
 *
 * The masked register still gates what renders: the reserve Learjet 35 is on
 * hold pending D5 and therefore is not counted, and no ownership language
 * appears while `ownershipLanguageCleared` is false.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Title and description, defined once and used by both the page metadata and
 * the structured-data graph. Two copies of these strings is how a page ends up
 * telling a crawler one thing in its <title> and another in its JSON-LD.
 */
function fleetMeta(locale: Locale) {
  return {
    title: locale === 'es' ? 'Flota Learjet 31A' : 'Learjet 31A Fleet',
    description: locale === 'es'
        ? 'La flota de trabajo actual de AirEvac International consta de dos aeronaves ' +
          'Learjet 31A configuradas para transporte médico.'
        : 'AirEvac International’s current working fleet is two Learjet 31A aircraft ' +
          'configured for medical transport.',
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
    ...fleetMeta(locale),
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

  return (
    <>
      <PageGraph
        locale={locale}
        path={'/fleet'}
        {...fleetMeta(locale)}
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <PageHeader
        locale={locale}
        title={locale === 'es' ? 'Flota Learjet 31A' : 'Learjet 31A Fleet'}
        // Model and quantity only (AEI handoff G-04). No registrations.
        intro={
          locale === 'es'
            ? dictionary.fleet.statement
            : dictionary.fleet.statement
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container>
          {/*
           * General fleet imagery. It is NOT placed on the individual aircraft
           * cards: no registration is legible in any available frame, and
           * pairing a photo with a tail number would assert that it depicts
           * that airframe - a fleet claim we cannot evidence. The cards keep
           * the schematic until a photo of a known registration exists.
           */}
          <Photo
            id="aircraftHangar"
            sizes="(min-width: 1280px) 1152px, 100vw"
            priority
            className="mb-10 aspect-[16/7] w-full rounded-panel object-cover"
          />

          {/*
           * Model and quantity only (AEI handoff G-03/G-04): no per-airframe
           * cards, registrations, or registry links. The verification trail
           * lives in the internal fleet register, not in public output.
           */}
          <div className="relative mt-10 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-panel bg-navy-900 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {locale === 'es' ? 'Dos Learjet 31A' : 'Two Learjet 31A aircraft'}
              </h2>
              <p className="mt-3 max-w-xl text-white/85">
                {locale === 'es'
                  ? 'Cada transporte se realiza en una aeronave dedicada, configurada para el ' +
                    'nivel de atención aceptado del paciente.'
                  : 'Every transport runs on a dedicated aircraft, configured to the ' +
                    'patient’s accepted level of care.'}
              </p>
            </div>
            <AircraftPlanform className="h-40 w-auto shrink-0 text-white/25" />
          </div>

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
