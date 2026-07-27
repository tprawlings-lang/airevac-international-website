import Link from 'next/link';
import { getDictionary } from '@/content/dictionary';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Blueprint page 9: "Referral selector — Hospital | Cruise | Insurance | Family".
 *
 * WHY THIS IS FOUR LINKS AND NOT A STATEFUL SELECTOR.
 *
 * Page 24 permits an audience selector that switches "page order and CTA labels
 * ... without creating a sensitive profile". Four plain links satisfy that with
 * no client state, no cookie, and nothing to store: choosing "Hospital" simply
 * navigates to the hospital page. A stateful selector would have to persist the
 * choice somewhere, and "this visitor is coordinating a patient transport" is
 * exactly the kind of medical-interest signal section 13 forbids building.
 *
 * It also means the selector works with JavaScript disabled, which the
 * degradation rule on page 20 requires.
 */
export function ReferralSelector({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const { referralSelector } = dictionary;

  const paths = [
    {
      href: '/partners/hospitals',
      label: referralSelector.hospital,
      description: referralSelector.hospitalDescription,
    },
    {
      href: '/partners/cruise',
      label: referralSelector.cruise,
      description: referralSelector.cruiseDescription,
    },
    {
      href: '/partners/insurance',
      label: referralSelector.insurance,
      description: referralSelector.insuranceDescription,
    },
    {
      href: '/patients-families',
      label: referralSelector.family,
      description: referralSelector.familyDescription,
    },
  ];

  return (
    <div>
      <h2 id="referral-selector-heading" className="text-3xl font-bold text-navy-900">
        {referralSelector.heading}
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-700">
        {referralSelector.description}
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paths.map((path) => (
          <li key={path.href}>
            <Link
              href={localePath(locale, path.href)}
              className="flex h-full flex-col rounded-panel border border-ink-300 bg-white p-5 transition-colors hover:border-navy-800 hover:bg-support-50"
            >
              <span className="text-lg font-bold text-navy-900">{path.label}</span>
              <span className="mt-2 text-sm text-ink-700">{path.description}</span>
              <span
                aria-hidden="true"
                className="mt-4 text-sm font-semibold text-support-700"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
