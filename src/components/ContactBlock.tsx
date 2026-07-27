import { getDictionary } from '@/content/dictionary';
import { localePath, type Locale } from '@/lib/i18n';
import { Container, Section } from '@/components/ui/Container';
import { CtaLink, PhoneCta } from '@/components/ui/Cta';
import { EmergencyNotice } from '@/components/EmergencyNotice';
import { SecureChatButton } from '@/components/SecureChatButton';

/**
 * The closing contact block, appended to every content page.
 *
 * Blueprint section 5: every template's required order ends with "Contact".
 * Blueprint page 7 fixes the order of the actions themselves — call, secure
 * chat, callback — with the emergency notice always present.
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
          {locale === 'es' ? 'Hable con un coordinador de vuelo' : 'Talk to a flight coordinator'}
        </h2>

        <p className="mt-3 max-w-2xl text-lg text-white/90">
          {locale === 'es'
            ? 'Puede llamar sin tener documentos ni información del seguro a la mano. Eso es ' +
              'precisamente lo que le ayudamos a resolver.'
            : 'You can call without having documents or insurance details ready. Working those ' +
              'out is what we help you with.'}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
          <PhoneCta label={dictionary.common.callCoordinator} className="sm:min-w-64" />

          <CtaLink
            href={localePath(locale, '/request-transport')}
            variant="secondary"
            className="sm:min-w-56"
          >
            {dictionary.common.requestCallback}
          </CtaLink>

          {/*
           * `fallback="note"` because the callback CTA above is already this
           * block's callback affordance. Rendering the chat fallback's own
           * button here would show "Request a Callback" twice, side by side.
           */}
          <SecureChatButton locale={locale} fallback="note" className="self-center text-white/80" />
        </div>

        <div className="mt-8 max-w-3xl">
          <EmergencyNotice locale={locale} />
        </div>
      </Container>
    </Section>
  );
}
