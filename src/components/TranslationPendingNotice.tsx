import Link from 'next/link';
import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Blueprint page 24, "Do not build":
 *   "Unreviewed automatic Spanish translation for medical, legal, insurance, or
 *    emergency content."
 *
 * When a page's Spanish body copy has not passed human review, this renders in
 * its place. The alternative — machine-translating a patient-rights page or a
 * Notice of Privacy Practices — is the thing the blueprint explicitly forbids,
 * and it is also the version that could mislead a Spanish-speaking family about
 * a legal right.
 *
 * The notice always offers two live paths: a Spanish-speaking coordinator by
 * phone, and the reviewed English text. It is never a dead end.
 */
export function TranslationPendingNotice({
  locale,
  englishPath,
}: {
  locale: Locale;
  /** Canonical English path for this page, e.g. `/patient-rights`. */
  englishPath: string;
}) {
  const dictionary = getDictionary(locale);
  const { translation } = dictionary;

  return (
    <div
      className="rounded-panel border-2 border-support-500 bg-support-50 p-6"
      // `region` gives screen-reader users a landmark to jump to, since this
      // replaces the page's main content rather than supplementing it.
      role="region"
      aria-labelledby="translation-pending-heading"
    >
      <h2
        id="translation-pending-heading"
        className="text-xl font-bold text-navy-900"
      >
        {translation.pendingTitle}
      </h2>

      <p className="mt-3 text-ink-900">{translation.pendingBody}</p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <a
          href={SITE.phone.href}
          className="inline-flex min-h-[44px] items-center rounded-panel bg-urgent-600 px-5 py-3 font-semibold text-white hover:bg-urgent-700"
        >
          {dictionary.common.callCoordinator}: {SITE.phone.display}
        </a>

        <Link
          href={localePath('en', englishPath)}
          hrefLang="en"
          lang="en"
          className="inline-flex min-h-[44px] items-center font-semibold text-support-700 underline underline-offset-4 hover:text-navy-900"
        >
          {translation.viewEnglish}
        </Link>
      </div>
    </div>
  );
}
