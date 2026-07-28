import Link from 'next/link';
import { CREDENTIAL_REGISTER } from '@/content/credentials';
import { FLEET } from '@/content/fleet';
import { COVERAGE_REGIONS } from '@/content/navigation';
import { getDictionary } from '@/content/dictionary';
import { publishable } from '@/lib/credential-register';
import { localePath, type Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { AircraftIcon, ClockIcon, PhoneIcon, VerifiedIcon } from '@/components/graphics/Icons';

/**
 * The figure band directly under the hero.
 *
 * WHY IT EXISTS. Competitor research found REVA and AirMed both lead with large
 * numbers - "30,000 missions", "90+ countries", "33,000 transports". It is the
 * fastest credibility device in the category, and the homepage had nothing
 * equivalent between the hero and a wall of text cards.
 *
 * WHY THE NUMBERS ARE SMALL. Every figure here is one this repository can
 * evidence. AirEvac's mission counts, years in operation, and response times are
 * all gated (D12, D14), and inventing a big number to match a competitor is
 * exactly the misleading claim section 12 prohibits.
 *
 * That constraint is turned into the point of the block. Four modest, verifiable
 * facts under a heading that says we publish only what we can evidence lands
 * harder with a hospital compliance officer than "30,000 missions" does - and it
 * is the one claim on the page a competitor cannot copy.
 *
 * COUNTS ARE DERIVED, NOT TYPED. The aircraft count comes from the fleet
 * register filtered through the same `publishable()` gate the fleet page uses,
 * so it can never disagree with the cards. If an aircraft goes on hold, this
 * number drops by itself.
 */
export function VerifiedFacts({ locale, now }: { locale: Locale; now: Date }) {
  const dictionary = getDictionary(locale);
  const isSpanish = locale === 'es';

  const publishableAircraft = FLEET.filter((aircraft) => publishable(aircraft.claim, now)).length;

  // The concentrated service areas: Mexico, Caribbean, Central America, and the
  // United States (handoff H-02 adds the domestic United States).
  const regionCount = COVERAGE_REGIONS.length;

  const baseCleared = CREDENTIAL_REGISTER.some(
    (record) => record.id === 'fort-lauderdale-base' && publishable(record, now),
  );

  const facts: { Icon: typeof AircraftIcon; figure: string; label: string }[] = [
    {
      Icon: AircraftIcon,
      figure: String(publishableAircraft),
      label: isSpanish
        ? 'Aeronaves Learjet 31A en la flota de trabajo actual'
        : 'Learjet 31A aircraft in the current working fleet',
    },
    {
      Icon: PhoneIcon,
      figure: '24/7',
      label: isSpanish
        ? 'Coordinadores de vuelo disponibles por teléfono y correo, todos los días'
        : 'Flight coordination available by phone and email, every day of the year',
    },
    {
      Icon: ClockIcon,
      figure: String(regionCount),
      label: isSpanish
        ? 'Áreas de servicio: México, el Caribe, Centroamérica y Estados Unidos'
        : 'Focused service areas: Mexico, the Caribbean, Central America, and the United States',
    },
    // Only shown when the base record itself passes the gate.
    ...(baseCleared
      ? [
          {
            Icon: VerifiedIcon,
            figure: 'KFXE',
            label: isSpanish
              ? 'Base de operaciones en Fort Lauderdale Executive, confirmada en el directorio del aeropuerto'
              : 'Operating base at Fort Lauderdale Executive, confirmed by the airport directory',
          },
        ]
      : []),
  ];

  return (
    <section aria-labelledby="verified-facts-heading" className="border-b border-ink-300 bg-white py-12">
      <Container>
        <h2 id="verified-facts-heading" className="sr-only">
          {isSpanish ? 'Datos verificados' : 'Verified facts'}
        </h2>

        {/*
         * MARKUP CONSTRAINT: a <dl> may only directly contain <dt>, <dd>, or a
         * <div> wrapping a dt/dd pair. An earlier version put the icon as a
         * sibling of that wrapper and nested the dt/dd one level deeper, which
         * axe flagged as `definition-list` and `dlitem` - the pairing is what
         * makes a screen reader announce "2, Learjet 31A aircraft…" rather than
         * two unrelated fragments.
         *
         * So each wrapper holds exactly dt then dd, and the icon lives inside
         * the dt alongside the figure it belongs to.
         */}
        <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.figure}>
              <dt className="flex items-center gap-3">
                <fact.Icon className="size-7 shrink-0 text-support-700" />
                <span className="text-4xl font-bold leading-none tracking-tight text-navy-900">
                  {fact.figure}
                </span>
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-700">{fact.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 border-t border-ink-300 pt-6 text-sm text-ink-500">
          {isSpanish
            ? 'Publicamos únicamente cifras que podemos respaldar con documentación. '
            : 'We publish only figures we can evidence. '}
          <Link
            href={localePath(locale, '/credentials')}
            className="font-semibold text-support-700 underline underline-offset-4 hover:text-navy-900"
          >
            {dictionary.credentials.heading}
          </Link>
        </p>
      </Container>
    </section>
  );
}
