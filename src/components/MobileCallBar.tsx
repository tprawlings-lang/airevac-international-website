import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Blueprint page 10: "a mobile call bar that does not cover content."
 *
 * The bar is `position: fixed`, and `body` reserves exactly
 * `--mobile-call-bar-height` of bottom padding for it (see globals.css). That
 * pairing is what satisfies "does not cover content" and WCAG 2.2 SC 2.4.11
 * (Focus Not Obscured) - without the reserved padding, the last focusable
 * element on a page would sit underneath this bar.
 *
 * Hidden at `md` and above, where the persistent header already carries the
 * phone number.
 */
export function MobileCallBar({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-navy-800 bg-navy-900 md:hidden">
      <div className="grid grid-cols-2">
        <a
          href={SITE.phone.href}
          className="flex min-h-[var(--mobile-call-bar-height)] flex-col items-center justify-center bg-urgent-600 px-3 py-2 text-center font-semibold text-white"
        >
          <span className="text-sm leading-tight">{dictionary.common.callCoordinator}</span>
          <span className="text-xs font-normal">{SITE.phone.display}</span>
        </a>

        <a
          href={localePath(locale, '/request-transport')}
          className="on-navy flex min-h-[var(--mobile-call-bar-height)] flex-col items-center justify-center px-3 py-2 text-center font-semibold text-white"
        >
          <span className="text-sm leading-tight">{dictionary.common.requestCallback}</span>
        </a>
      </div>
    </div>
  );
}
