import { getDictionary } from '@/content/dictionary';
import { localePath, type Locale } from '@/lib/i18n';
import { Container, Section } from '@/components/ui/Container';
import { CtaLink, PhoneCta } from '@/components/ui/Cta';
import { EmergencyNotice } from '@/components/EmergencyNotice';
import { SITE } from '@/content/site';

/**
 * The closing contact block, appended to every content page.
 *
 * Blueprint section 5: every template's required order ends with "Contact".
 * Blueprint page 7 fixes the order of the actions themselves - call, secure
 * chat, callback - with the emergency notice always present.
 *
 * Rendering it from one component (rather than per page) is what guarantees the
 * hierarchy is identical everywhere. A referrer who learns the phone number sits
 * at the bottom-left of one page should find it in the same place on all of them.
 */
export function ContactBlock({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <Section tone="navy" ariaLabelledBy="contact-block-heading">
      <Container>
        <h2 id="contact-block-heading" className="text-3xl font-bold">
          {locale === 'es'
            ? 'Llame o escriba a un coordinador de vuelo'
            : 'Call or Email a Flight Coordinator'}
        </h2>

        {/* Approved bottom contact block copy, AEI handoff Section 05. */}
        <p className="mt-3 max-w-2xl text-lg text-white/90">
          {locale === 'es'
            ? 'Disponibles 24/7 por teléfono y correo electrónico.'
            : 'Available 24/7 by phone and email.'}
        </p>
        <p className="mt-1 text-lg font-semibold text-white">
          {SITE.phone.display} | {SITE.email.display}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
          <PhoneCta label={dictionary.common.callCoordinator} className="sm:min-w-64" />

          <CtaLink href={SITE.email.href} variant="secondary" className="sm:min-w-56">
            {dictionary.common.emailCoordinator}
          </CtaLink>

          <CtaLink
            href={localePath(locale, '/request-transport')}
            variant="quiet"
            className="self-center !text-white/85"
          >
            {dictionary.common.requestCallback}
          </CtaLink>
        </div>

        <div className="mt-8 max-w-3xl">
          <EmergencyNotice locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
