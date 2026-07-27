import { getDictionary } from '@/content/dictionary';
import type { Locale } from '@/lib/i18n';

/**
 * Blueprint page 7, conversion hierarchy:
 *   "Emergency notice: For an immediate local emergency, call local emergency
 *    services."
 *
 * Rendered on every page that offers a contact action. It is a `<p>` inside a
 * bordered region rather than `role="alert"`: an alert role fires the screen
 * reader's live region on page load and would interrupt a reader trying to
 * navigate, which is worse for the exact user this is meant to protect. The
 * left border and reserved red keep it visually distinct without the
 * "dramatic emergency" styling page 10 forbids.
 */
export function EmergencyNotice({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <div className="border-l-4 border-urgent-600 bg-urgent-50 px-4 py-3">
      <p className="text-sm text-ink-900">
        <strong className="font-semibold">
          {locale === 'es' ? 'Emergencia inmediata: ' : 'Immediate emergency: '}
        </strong>
        {dictionary.emergency.notice}
      </p>
    </div>
  );
}
