import { getDictionary } from '@/content/dictionary';
import { FEATURES } from '@/content/site';
import { localePath, type Locale } from '@/lib/i18n';
import { CtaLink } from '@/components/ui/Cta';

/**
 * Secure chat entry point. Blueprint section 7.
 *
 * The customer-facing label is fixed by page 13: "Secure Chat With a Flight
 * Coordinator". Chat is presented as human access, not an AI tool.
 *
 * WHY THIS RENDERS A FALLBACK TODAY — page 2 makes chat conditional on a
 * "BAA, security review, retention rules, and tested staffing", and D8 is open.
 * Shipping a chat button that opens a vendor widget before the BAA is signed
 * would put contact details into an unapproved processor, so `FEATURES.secureChat`
 * is false and this component degrades to the callback path instead. That is the
 * same shape page 13 requires on failure: "Show phone and callback."
 *
 * When D8 closes, flip the flag and mount the approved vendor's launcher here —
 * no page needs to change.
 */
export function SecureChatButton({
  locale,
  variant = 'secondary',
  className = '',
  fallback = 'callback',
}: {
  locale: Locale;
  variant?: 'primary' | 'secondary';
  className?: string;
  /**
   * What to render while chat is disabled.
   *
   * `callback` — offer the callback path. Use where this is the only affordance
   * in its slot, such as the homepage's three-option card.
   * `note` — render only the explanatory sentence. Use where the caller already
   * shows a callback button, so the page does not offer the same action twice.
   */
  fallback?: 'callback' | 'note';
}) {
  const dictionary = getDictionary(locale);

  if (!FEATURES.secureChat) {
    if (fallback === 'note') {
      return (
        <p className={`text-sm ${className}`}>{dictionary.common.secureChatUnavailable}</p>
      );
    }

    return (
      <div className={className}>
        <CtaLink
          href={localePath(locale, '/request-transport')}
          variant={variant}
          className="w-full"
        >
          {dictionary.common.requestCallback}
        </CtaLink>
        <p className="mt-2 text-sm text-ink-500">
          {dictionary.common.secureChatUnavailable}
        </p>
      </div>
    );
  }

  // Reached only once D8 closes and the approved launcher is wired in.
  return (
    <CtaLink href={localePath(locale, '/request-transport')} variant={variant} className={className}>
      {dictionary.common.secureChat}
    </CtaLink>
  );
}
