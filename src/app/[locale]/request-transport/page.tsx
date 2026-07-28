import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container, Section } from '@/components/ui/Container';
import { PhoneCta } from '@/components/ui/Cta';
import { EmergencyNotice } from '@/components/EmergencyNotice';
import { IntakeForm } from '@/components/IntakeForm';
import { PageHeader } from '@/components/PageHeader';
import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';
import { REFERRAL_ROLES, type ReferralRole } from '@/lib/intake-schema';

/**
 * Callback request page. Blueprint section 6, stage "Triage".
 *
 * NO STRUCTURED DATA, NO ANALYTICS, NO THIRD-PARTY CODE ON THIS PAGE.
 * Section 13 is explicit for the intake surface: allowed measurement is
 * "Server-side success count without content"; prohibited is "Pixels, tag
 * manager, ad cookies, session replay, query-string patient data."
 *
 * The phone path is rendered above the form, not below it. A visitor who reaches
 * this page with a time-critical case should see the faster option first - the
 * conversion hierarchy on page 7 puts the call ahead of the callback, and that
 * ordering is more important here than anywhere else on the site.
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

  const dictionary = getDictionary(locale);

  return {
    title: dictionary.intake.heading,
    description:
      locale === 'es'
        ? 'Solicite que un coordinador de vuelo lo llame. Solo información logística, sin ' +
          'datos médicos, de seguro ni de pago.'
        : 'Ask a flight coordinator to call you back. Logistics only, no medical, insurance, ' +
          'or payment information.',
    alternates: {
      canonical: localePath(locale, '/request-transport'),
      languages: {
        'en-US': localePath('en', '/request-transport'),
        'es-419': localePath('es', '/request-transport'),
        'x-default': localePath('en', '/request-transport'),
      },
    },
    robots: {
      /*
       * Section 19: "noindex for ... secure flows". This page is a contact
       * endpoint, not content. Keeping it out of the index also keeps it out of
       * automated crawlers' submission attempts.
       */
      index: false,
      follow: true,
    },
  };
}

function parseRole(value: string | undefined): ReferralRole | undefined {
  if (value === undefined) return undefined;
  return (REFERRAL_ROLES as readonly string[]).includes(value)
    ? (value as ReferralRole)
    : undefined;
}

export default async function RequestTransportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const query = await searchParams;

  /*
   * `?role=hospital` pre-selects the referral path when arriving from a partner
   * page. It is validated against the allowlist and used only to set a radio
   * default - an unrecognized value is discarded rather than reflected into the
   * page, which is what makes this safe.
   *
   * Section 13 forbids "query-string patient data" on intake. A role is not
   * patient data, and nothing else is read from the query string here.
   */
  const roleParam = query.role;
  const defaultRole = parseRole(typeof roleParam === 'string' ? roleParam : undefined);

  const dictionary = getDictionary(locale);

  return (
    <>
      <PageHeader
        locale={locale}
        title={dictionary.intake.heading}
        intro={
          locale === 'es'
            ? 'Un coordinador de vuelo lo llamará. Si el caso es urgente, llame ahora.'
            : 'A flight coordinator will call you. If your case is time-critical, call now instead.'
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container width="narrow">
          {/* The faster path, first. */}
          <div className="mb-10 rounded-panel border-2 border-urgent-600 bg-urgent-50 p-6">
            <h2 className="text-xl font-bold text-navy-900">
              {locale === 'es'
                ? 'La forma más rápida es llamar'
                : 'The fastest way is to call'}
            </h2>
            <p className="mt-2 text-ink-900">
              {locale === 'es'
                ? 'Los coordinadores de vuelo están disponibles las 24 horas. No necesita ' +
                  'documentos ni información del seguro para llamar.'
                : 'Flight coordinators are available 24 hours a day. You do not need documents ' +
                  'or insurance information to call.'}
            </p>
            <PhoneCta
              label={dictionary.common.callCoordinator}
              sublabel={SITE.phone.display}
              className="mt-4"
            />
          </div>

          <IntakeForm locale={locale} defaultRole={defaultRole} />

          <div className="mt-10">
            <EmergencyNotice locale={locale} />
          </div>
        </Container>
      </Section>
    </>
  );
}
