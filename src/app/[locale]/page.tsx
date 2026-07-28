import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container, Section } from '@/components/ui/Container';
import { CtaLink, PhoneCta } from '@/components/ui/Cta';
import { ContactBlock } from '@/components/ContactBlock';
import { CredentialList } from '@/components/CredentialCard';
import { EmergencyNotice } from '@/components/EmergencyNotice';
import { ProcessSteps } from '@/components/ProcessSteps';
import { VerifiedFacts } from '@/components/VerifiedFacts';
import { CoverageMap } from '@/components/graphics/CoverageMap';
import { HeroBackdrop } from '@/components/graphics/HeroBackdrop';
import { BackdropPhoto } from '@/components/graphics/Photo';
import { TranslationPendingNotice } from '@/components/TranslationPendingNotice';

import { CREDENTIAL_REGISTER } from '@/content/credentials';
import { getDictionary } from '@/content/dictionary';
import { COVERAGE_REGIONS, PRIORITY_ROUTES } from '@/content/navigation';
import { SITE } from '@/content/site';
import { isLocale, localePath } from '@/lib/i18n';
import { organizationJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Homepage, in the AEI handoff's recommended order (Section 04):
 *
 *   contact bar (header) > hero (phone + email actions) > proof and fleet >
 *   Next Steps > Focused Coverage > featured map > insurance and private pay >
 *   final contact
 *
 * Removed without replacement per H-01: the audience selector section, its
 * cards, and every control that pointed at it. The partner band went with it;
 * its three cards pointed at routes this handoff merges into /partners, which
 * the navigation now links directly.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title:
      locale === 'es'
        ? 'Ambulancia aérea para México y el Caribe'
        : 'Air Ambulance for Mexico and the Caribbean',
    alternates: {
      canonical: localePath(locale, '/'),
      languages: {
        'en-US': localePath('en', '/'),
        'es-419': localePath('es', '/'),
        'x-default': localePath('en', '/'),
      },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  /*
   * One evaluation instant for the whole page. Passing a shared `now` into every
   * gated component means a credential cannot be publishable in the proof block
   * and expired in the structured data of the same response.
   */
  const now = new Date();

  const proofRecords = CREDENTIAL_REGISTER;

  // Nonce for the JSON-LD tag; see src/lib/nonce.ts.
  const nonce = await getNonce();

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        // Generated from the credential register, so gated claims are absent
        // here exactly as they are absent from the page.
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd(locale, now)),
        }}
      />

      {/* ================= HERO ==========================================
          Page 10: "Direct operator position, Mexico and Caribbean focus, calm
          medical transport imagery. Primary action: Call a Flight Coordinator."

          NOTE ON "DIRECT OPERATOR": the blueprint's recommended position is
          "Direct air ambulance coordination". It is NOT "direct operator" in the
          certificate sense; page 6 forbids describing AirEvac as a direct
          operator until certificate D0JA860L and its OpSpecs are in the launch
          file (D4). The copy below says what is true today: AirEvac coordinates
          the transport directly, with no broker in between.
          ============================================================== */}
      <Section
        tone="navy"
        className="relative overflow-hidden py-0!"
        ariaLabelledBy="hero-heading"
      >
        {/*
         * AirEvac's own aircraft at dusk, from their live site. Page 10 wants
         * "calm medical transport imagery" and forbids dramatic emergency
         * imagery - a quiet golden-hour ramp shot is exactly the former.
         *
         * THE GRADIENT IS DOING THE ACCESSIBILITY WORK, NOT THE OPACITY.
         * An earlier version dimmed the whole photo to 30%, which protected the
         * text but wasted the only strong image available - the aircraft was
         * barely legible. Instead the photo now runs at full strength and a
         * hard left-to-right scrim keeps the headline column on solid navy:
         * opaque through 45%, then falling away so the airframe reads clearly
         * on the right. Text contrast is unchanged; the picture is visible.
         *
         * The second, vertical gradient stops the photo colliding with the
         * section below it.
         */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <BackdropPhoto
            id="aircraftGoldenHour"
            sizes="100vw"
            priority
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 from-30% via-navy-950/95 via-55% to-navy-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/70" />
          <HeroBackdrop className="absolute inset-0 h-full w-full opacity-60" />
        </div>

        <Container className="relative">
          <div className="grid gap-10 pt-16 pb-10 lg:grid-cols-[1.15fr_1fr] lg:items-center sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-14">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-support-500">
                {locale === 'es'
                  ? 'México · Caribe · Centroamérica · Estados Unidos'
                  : 'Mexico · Caribbean · Central America · United States'}
              </p>

              <h1
                id="hero-heading"
                className="mt-5 max-w-[15ch] text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]"
              >
                {locale === 'es'
                  ? 'Coordinación directa de ambulancia aérea, sin intermediarios.'
                  : 'Direct air ambulance coordination, with no broker in between.'}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
                {locale === 'es'
                  ? 'Trabajamos con hospitales, equipos de crucero y marítimos, aseguradoras ' +
                    'y familias que necesitan mover a un paciente desde México, el Caribe y ' +
                    'Centroamérica. Hable directamente con un coordinador de vuelo, no con un ' +
                    'centro de llamadas.'
                  : 'We work with hospitals, cruise and maritime teams, insurers, and families ' +
                    'moving a patient from Mexico, the Caribbean, and Central America. You ' +
                    'speak directly to a flight coordinator, not a call center.'}
              </p>

              {/* Phone and email actions (handoff, homepage order item 2). */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
                <PhoneCta label={dictionary.common.callCoordinator} className="sm:min-w-64" />
                <CtaLink href={SITE.email.href} variant="secondary" className="sm:min-w-56">
                  {SITE.email.display}
                </CtaLink>
                <CtaLink
                  href={localePath(locale, '/request-transport')}
                  variant="quiet"
                  className="!text-white/85"
                >
                  {dictionary.common.requestTransport}
                </CtaLink>
              </div>

              <p className="mt-4 text-sm text-white/75">{dictionary.common.call24_7}</p>
            </div>

            {/*
             * Page 10 forbids rotating hero carousels, dramatic emergency
             * imagery, and generic stretcher stock photos. Until permission-
             * cleared operational photography exists (D12), the hero's second
             * column carries the facts a referrer actually needs to see -
             * which is a better answer to "can they do the route?" than a stock
             * image would be.
             */}
            <aside
              aria-label={locale === 'es' ? 'Datos operativos' : 'Operational facts'}
              className="rounded-panel border border-white/25 bg-navy-950/70 p-6"
            >
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-white/70">
                    {locale === 'es' ? 'Base de operaciones' : 'Operating base'}
                  </dt>
                  <dd className="mt-1 text-base">
                    {SITE.base.name}
                    <br />
                    {SITE.base.locality}, {SITE.base.region}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-white/70">
                    {locale === 'es' ? 'Aeronaves' : 'Aircraft'}
                  </dt>
                  {/* Model and quantity only (AEI handoff G-04). */}
                  <dd className="mt-1 text-base">{dictionary.fleet.statement}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white/70">
                    {locale === 'es' ? 'Coordinación' : 'Coordination'}
                  </dt>
                  <dd className="mt-1 text-base">
                    {locale === 'es'
                      ? 'Coordinadores disponibles 24/7 por teléfono y correo electrónico.'
                      : 'Our coordinators are available 24/7 by phone and email.'}
                  </dd>
                </div>
              </dl>

              <p className="mt-6 border-t border-white/20 pt-4">
                <Link
                  href={localePath(locale, '/credentials')}
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {locale === 'es' ? 'Ver credenciales verificadas' : 'View verified credentials'}
                </Link>
              </p>
            </aside>
          </div>

          <div className="pb-10">
            <EmergencyNotice locale={locale} />
          </div>
        </Container>
      </Section>

      {/* ================= VERIFIED FACTS ================================
          Sits between the hero and the referral selector: the fastest
          credibility signal in the category, built only from claims the
          register can evidence. See VerifiedFacts for why the numbers are
          deliberately modest. */}
      <VerifiedFacts locale={locale} now={now} />

      {/* ================= VERIFIED PROOF ===============================
          Page 10: "EURAMI status, two Learjet 31As, 24/7 English and Spanish,
          Fort Lauderdale base."

          Rendered through the register, so anything not cleared is simply
          absent, including the "24/7 English and Spanish" claim, which is
          gated on D11 and therefore does not appear.
          ============================================================== */}
      <Section ariaLabelledBy="proof-heading">
        <Container>
          <h2 id="proof-heading" className="text-3xl font-bold text-navy-900">
            {locale === 'es' ? 'Pruebas verificadas' : 'Verified proof'}
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-ink-700">
            {locale === 'es'
              ? 'Publicamos una credencial únicamente cuando tenemos el certificado, el ' +
                'alcance exacto y la fecha de vencimiento. Si no aparece aquí, no lo afirmamos.'
              : 'We publish a credential only when we hold the certificate, the exact scope, ' +
                'and the expiry date. If it is not shown here, we do not claim it.'}
          </p>

          <div className="mt-8">
            <CredentialList records={proofRecords} locale={locale} now={now} />
          </div>

          {/* Fleet statement: model and quantity only (handoff G-04). */}
          <p className="mt-6 text-lg font-semibold text-navy-900">{dictionary.fleet.statement}</p>

          <p className="mt-4">
            <Link
              href={localePath(locale, '/credentials')}
              className="font-semibold text-support-700 underline underline-offset-4"
            >
              {dictionary.credentials.heading} →
            </Link>
          </p>
        </Container>
      </Section>

      {/* ================= NEXT STEPS ===================================
          Handoff Section 04, homepage order item 4: "Next steps - use the
          revised process below." Case documents move by email or fax, and
          financial clearance completes before confirmation (H-06, H-07).
          ============================================================== */}
      <Section tone="tint" ariaLabelledBy="process-heading">
        <Container>
          <h2 id="process-heading" className="text-3xl font-bold text-navy-900">
            {locale === 'es' ? 'Próximos pasos' : 'Next Steps'}
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-ink-700">
            {locale === 'es'
              ? 'Seis pasos desde la primera llamada hasta el despegue. Los documentos del ' +
                'caso se envían por correo electrónico o fax, y la autorización financiera ' +
                'se completa antes de confirmar el vuelo.'
              : 'Six steps from first contact to wheels up. Case documents move by email or ' +
                'fax, and financial clearance is completed before the flight is confirmed.'}
          </p>

          <div className="mt-8">
            {locale === 'es' ? (
              <TranslationPendingNotice locale={locale} englishPath="/" />
            ) : (
              <ProcessSteps locale={locale} />
            )}
          </div>
        </Container>
      </Section>

      {/* ================= FOCUSED COVERAGE =============================
          Handoff Section 05, "Concentrated service areas": exact approved copy,
          followed by the featured map (order items 5 and 6). The region and
          route lists below the map are the required text alternative: the map
          cannot be the only way users receive coverage information.
          ============================================================== */}
      <Section ariaLabelledBy="markets-heading">
        <Container>
          <h2 id="markets-heading" className="text-3xl font-bold text-navy-900">
            {locale === 'es' ? 'Cobertura enfocada' : 'Focused Coverage'}
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-ink-700">
            {locale === 'es'
              ? 'AEI coordina transporte en ambulancia aérea en México, el Caribe, ' +
                'Centroamérica y Estados Unidos. Otros destinos se evalúan caso por caso.'
              : 'AEI coordinates air ambulance transport across Mexico, the Caribbean, ' +
                'Central America, and the United States. Other destinations are reviewed ' +
                'case by case.'}
          </p>

          {/* The route map. Competitor research found neither REVA nor AirMed
              publishes one, and regional concentration is the position this
              site argues, so the map does argumentative work, not decoration. */}
          <CoverageMap locale={locale} className="mt-8 text-navy-900" />

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_2fr]">
            <nav aria-label={locale === 'es' ? 'Regiones' : 'Regions'}>
              <ul className="space-y-2">
                {COVERAGE_REGIONS.map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={localePath(locale, `/coverage/${region.slug}`)}
                      className="flex min-h-[44px] items-center rounded-panel border border-ink-300 px-4 py-2 font-semibold text-navy-900 hover:bg-support-50"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={localePath(locale, '/coverage/other-destinations')}
                    className="flex min-h-[44px] items-center rounded-panel border border-ink-300 px-4 py-2 font-semibold text-navy-900 hover:bg-support-50"
                  >
                    {locale === 'es' ? 'Otros destinos' : 'Other Destinations'}
                  </Link>
                </li>
              </ul>
            </nav>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">
                {locale === 'es' ? 'Rutas frecuentes' : 'Frequent routes'}
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {PRIORITY_ROUTES.map((route) => (
                  <li key={route.slug}>
                    <Link
                      href={localePath(locale, `/coverage/${route.region}/${route.slug}`)}
                      className="flex min-h-[44px] items-center text-support-700 underline underline-offset-4 hover:text-navy-900"
                    >
                      {route.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ================= INSURANCE AND PRIVATE PAY ====================
          Handoff order item 7: "Keep only revised approved copy." The
          guarantee sentence is the exact Section 05 wording (H-08); the Good
          Faith Estimate sentence is removed (I-05).
          ============================================================== */}
      <Section ariaLabelledBy="insurance-heading">
        <Container width="narrow">
          <h2 id="insurance-heading" className="text-3xl font-bold text-navy-900">
            {locale === 'es' ? 'Seguro y pago privado' : 'Insurance and private pay'}
          </h2>

          {locale === 'es' ? (
            <div className="mt-6">
              <TranslationPendingNotice locale={locale} englishPath="/patients-families/insurance-and-payment" />
            </div>
          ) : (
            <div className="prose-content mt-6 text-ink-700">
              <p>
                Our in-house team works directly with insurers and assistance companies on
                authorization, documentation, and billing. We will tell you what we know about
                your case and what we do not.
              </p>
              <p>
                <strong className="text-ink-900">
                  We cannot guarantee aircraft availability, departure timing, insurance
                  payment, or acceptance by a receiving facility.
                </strong>{' '}
                Coverage is decided by your insurer, not by us.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink
              href={localePath(locale, '/patients-families/insurance-and-payment')}
              variant="secondary"
            >
              {locale === 'es' ? 'Entender el pago' : 'Understand payment'}
            </CtaLink>
          </div>
        </Container>
      </Section>

      {/* ================= CLINICAL INTAKE ==============================
          Handoff H-06 and Section 05 "Clinical intake": email or fax
          instructions, exact approved copy. No secure-channel or upload
          wording appears in this section.
          ============================================================== */}
      <Section tone="tint" ariaLabelledBy="clinical-intake-heading">
        <Container width="narrow">
          <h2 id="clinical-intake-heading" className="text-3xl font-bold text-navy-900">
            {locale === 'es'
              ? 'Envíe los documentos del caso por correo o fax'
              : 'Email or Fax Case Documents'}
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-ink-700">
            {locale === 'es'
              ? 'Envíe los registros clínicos y los documentos del transporte a ' +
                `${SITE.email.display} o por fax al ${SITE.fax.display}. Nuestros ` +
                'coordinadores confirmarán la recepción y solicitarán lo que aún falte.'
              : `Email clinical records and transport documents to ${SITE.email.display} or ` +
                `fax them to ${SITE.fax.display}. Our coordinators will confirm receipt and ` +
                'request anything still needed.'}
          </p>
          <div className="mt-6">
            <CtaLink href={SITE.email.href} variant="secondary">
              {dictionary.common.emailCoordinator}
            </CtaLink>
          </div>
        </Container>
      </Section>

      {/* ================= FINAL CONTACT ================================
          Handoff order item 8 and Section 05 "Bottom contact block":
          "Call or Email a Flight Coordinator / Available 24/7 by phone and
          email. / (619) 754-6755 | ops@aeiamericas.com". ContactBlock renders
          exactly that copy, so the homepage closes the same way every content
          page does (H-09).
          ============================================================== */}
      <ContactBlock locale={locale} />
    </>
  );
}
