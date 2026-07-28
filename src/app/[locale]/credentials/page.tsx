import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { CredentialList } from '@/components/CredentialCard';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';
import { CREDENTIAL_REGISTER } from '@/content/credentials';
import { getDictionary } from '@/content/dictionary';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';

/**
 * Credentials page. Blueprint page 11, "Credential" template:
 *   "Credential name | Exact scope | Holder | Issuer | Effective and expiry
 *    dates | Certificate image | Verification link | Last reviewed"
 *
 * This page is the public face of the non-negotiable launch rule. Everything on
 * it comes from the register through `publishable()`, so it can never show a
 * credential that has expired, lacks a source document, or lacks the required
 * approvals.
 *
 * The page deliberately explains the standard it applies. A visitor who
 * understands *why* the list is short trusts it more than one who is shown a
 * wall of badges - and a hospital compliance officer can verify every entry
 * against the issuer without contacting us.
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
    title: getDictionary(locale).credentials.heading,
    description:
      locale === 'es'
        ? 'Acreditaciones y registros de aeronaves de AirEvac International, con alcance ' +
          'exacto, titular, fecha de vencimiento y enlace de verificación del emisor.'
        : 'AirEvac International accreditations and aircraft registrations, with exact scope, ' +
          'holder, expiry date, and a verification link to the issuer’s own record.',
    alternates: {
      canonical: localePath(locale, '/credentials'),
      languages: {
        'en-US': localePath('en', '/credentials'),
        'es-419': localePath('es', '/credentials'),
        'x-default': localePath('en', '/credentials'),
      },
    },
  };
}

export default async function CredentialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const now = new Date();

  return (
    <>
      <PageHeader
        locale={locale}
        title={dictionary.credentials.heading}
        intro={
          locale === 'es'
            ? 'Cada credencial se publica con su alcance exacto, titular, fecha de ' +
              'vencimiento y un enlace al registro del propio emisor.'
            : 'Every credential is published with its exact scope, holder, expiry date, and a ' +
              'link to the issuer’s own record.'
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container>
          <div className="mb-10 max-w-3xl rounded-panel border border-ink-300 bg-support-50 p-6">
            <h2 className="text-xl font-bold text-navy-900">
              {locale === 'es' ? 'Nuestra norma de publicación' : 'Our publication standard'}
            </h2>
            <p className="mt-3 text-ink-900">
              {locale === 'es'
                ? 'Publicamos una credencial únicamente cuando tenemos el certificado, el ' +
                  'alcance exacto, el titular y la fecha de vencimiento, y cuando un revisor ' +
                  'responsable lo ha aprobado. Una credencial vencida desaparece de esta página ' +
                  'automáticamente en su fecha de vencimiento.'
                : 'We publish a credential only when we hold the certificate, the exact scope, ' +
                  'the holder, and the expiry date, and a responsible reviewer has approved it. ' +
                  'An expired credential is removed from this page automatically on its expiry ' +
                  'date.'}
            </p>
            <p className="mt-3 text-ink-900">
              {locale === 'es'
                ? 'Si una acreditación o calificación no aparece aquí, no la afirmamos en ' +
                  'ninguna parte de este sitio.'
                : 'If an accreditation or rating is not shown here, we do not claim it anywhere ' +
                  'on this site.'}
            </p>
          </div>

          <h2 className="text-2xl font-bold text-navy-900">
            {locale === 'es' ? 'Acreditaciones' : 'Accreditations'}
          </h2>
          <div className="mt-6">
            {/*
             * Only credential-shaped categories. The operating-base and
             * staffing records live in the same register but are not
             * accreditations, and grouping them here would overstate what has
             * been accredited.
             */}
            <CredentialList
              records={CREDENTIAL_REGISTER.filter((record) =>
                ['accreditation', 'certificate', 'safety-rating', 'license'].includes(
                  record.category,
                ),
              )}
              locale={locale}
              now={now}
            />
          </div>

          <h2 className="mt-12 text-2xl font-bold text-navy-900">
            {locale === 'es' ? 'Flota' : 'Fleet'}
          </h2>
          {/* Model and quantity only (AEI handoff G-03/G-04). Registration
              records are held internally, not published. */}
          <p className="mt-4 max-w-3xl text-ink-900">{dictionary.fleet.statement}</p>

          <h2 className="mt-12 text-2xl font-bold text-navy-900">
            {locale === 'es' ? 'Base de operaciones' : 'Operating base'}
          </h2>
          <div className="mt-6">
            <CredentialList
              records={CREDENTIAL_REGISTER.filter((record) => record.category === 'coverage')}
              locale={locale}
              now={now}
            />
          </div>

          <p className="mt-10 max-w-3xl text-sm text-ink-500">
            {locale === 'es'
              ? 'Si cree que algo en esta página es inexacto, llame a un coordinador de vuelo y ' +
                'pida hablar con el contacto de cumplimiento.'
              : 'If you believe anything on this page is inaccurate, call a flight coordinator ' +
                'and ask for the compliance contact.'}
          </p>
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}
