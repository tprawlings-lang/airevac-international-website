import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmergencyNotice } from '@/components/EmergencyNotice';
import { PageHeader } from '@/components/PageHeader';
import { SecureChatButton } from '@/components/SecureChatButton';
import { Container, Section } from '@/components/ui/Container';
import { CtaLink, PhoneCta } from '@/components/ui/Cta';
import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';
import { organizationJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Contact page. Blueprint page 7 fixes the conversion hierarchy that this page
 * exists to present, in order: call, secure chat, callback, professional
 * referral, with the emergency notice always present.
 *
 * The address is the Fort Lauderdale one confirmed by the airport directory
 * [S4] — not the Scottsdale address that appears in the legacy WordPress privacy
 * policy [S11]. Correcting that mismatch is part of closing the privacy finding
 * on page 18.
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
    title: locale === 'es' ? 'Contacto' : 'Contact',
    description:
      locale === 'es'
        ? `Comuníquese con un coordinador de vuelo de AirEvac International al ${SITE.phone.display}, ` +
          'disponible las 24 horas. Base de operaciones en Fort Lauderdale.'
        : `Reach an AirEvac International flight coordinator at ${SITE.phone.display}, available ` +
          '24 hours a day. Operating base at Fort Lauderdale Executive Airport.',
    alternates: {
      canonical: localePath(locale, '/contact'),
      languages: {
        'en-US': localePath('en', '/contact'),
        'es-419': localePath('es', '/contact'),
        'x-default': localePath('en', '/contact'),
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const now = new Date();
  const nonce = await getNonce();

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd(locale, now)),
        }}
      />

      <PageHeader
        locale={locale}
        title={locale === 'es' ? 'Contacto' : 'Contact'}
        intro={
          locale === 'es'
            ? 'Los coordinadores de vuelo están disponibles por teléfono las 24 horas.'
            : 'Flight coordinators are reachable by phone 24 hours a day.'
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            {/* --- Conversion hierarchy, in order --------------------------- */}
            <div>
              <h2 className="text-2xl font-bold text-navy-900">
                {locale === 'es' ? 'Cómo comunicarse con nosotros' : 'How to reach us'}
              </h2>

              <ol className="mt-6 space-y-6">
                <li>
                  <h3 className="text-lg font-bold text-navy-900">
                    {locale === 'es' ? '1. Llame — lo más rápido' : '1. Call — fastest'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">
                    {locale === 'es'
                      ? 'No necesita documentos ni información del seguro para llamar.'
                      : 'You do not need documents or insurance information to call.'}
                  </p>
                  <PhoneCta label={dictionary.common.callCoordinator} className="mt-3" />
                </li>

                <li>
                  <h3 className="text-lg font-bold text-navy-900">
                    {locale === 'es' ? '2. Chat seguro' : '2. Secure chat'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">
                    {locale === 'es'
                      ? 'Con un coordinador de vuelo. No es una herramienta médica automatizada.'
                      : 'With a flight coordinator. Not an automated medical tool.'}
                  </p>
                  <SecureChatButton locale={locale} className="mt-3" />
                </li>

                <li>
                  <h3 className="text-lg font-bold text-navy-900">
                    {locale === 'es' ? '3. Solicite una llamada' : '3. Request a callback'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">
                    {locale === 'es'
                      ? 'Solo logística: origen, destino y plazo.'
                      : 'Logistics only: origin, destination, and timeframe.'}
                  </p>
                  <CtaLink
                    href={localePath(locale, '/request-transport')}
                    variant="primary"
                    className="mt-3"
                  >
                    {dictionary.common.requestCallback}
                  </CtaLink>
                </li>

                <li>
                  <h3 className="text-lg font-bold text-navy-900">
                    {locale === 'es'
                      ? '4. Remisión profesional'
                      : '4. Professional referral'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-700">
                    {locale === 'es'
                      ? 'Rutas específicas para hospitales, cruceros y aseguradoras.'
                      : 'Tailored paths for hospitals, cruise teams, and insurers.'}
                  </p>
                  <CtaLink
                    href={localePath(locale, '/partners')}
                    variant="secondary"
                    className="mt-3"
                  >
                    {dictionary.common.startReferral}
                  </CtaLink>
                </li>
              </ol>
            </div>

            {/* --- Base and privacy boundary -------------------------------- */}
            <div>
              <h2 className="text-2xl font-bold text-navy-900">
                {locale === 'es' ? 'Base de operaciones' : 'Operating base'}
              </h2>

              <address className="mt-4 rounded-panel border border-ink-300 bg-white p-6 not-italic leading-relaxed">
                <span className="block font-bold text-navy-900">{SITE.name}</span>
                {SITE.base.name}
                <br />
                {SITE.base.street}
                <br />
                {SITE.base.locality}, {SITE.base.region} {SITE.base.postalCode}
                <br />
                <a
                  href={SITE.phone.href}
                  className="mt-3 inline-block font-semibold text-support-700 underline underline-offset-4"
                >
                  {SITE.phone.display}
                </a>
              </address>

              <div className="mt-6 rounded-panel border-l-4 border-urgent-600 bg-urgent-50 p-5">
                <h3 className="font-bold text-navy-900">
                  {locale === 'es'
                    ? 'No envíe expedientes médicos por correo electrónico'
                    : 'Do not send medical records by email'}
                </h3>
                <p className="mt-2 text-sm text-ink-900">
                  {locale === 'es'
                    ? 'El correo electrónico ordinario no es un canal seguro. Llame a un ' +
                      'coordinador y abriremos un canal protegido para los expedientes, los ' +
                      'documentos del seguro y los datos del paciente.'
                    : 'Ordinary email is not a secure channel. Call a coordinator and we will ' +
                      'open a protected channel for records, insurance documents, and patient ' +
                      'details.'}
                </p>
              </div>

              <div className="mt-6">
                <EmergencyNotice locale={locale} />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
