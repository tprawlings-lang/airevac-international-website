import { getDictionary } from '@/content/dictionary';
import type { AircraftRecord } from '@/content/fleet';
import { formatDate, type Locale } from '@/lib/i18n';
import { publishable } from '@/lib/credential-register';
import { AircraftPlanform } from '@/components/graphics/HeroBackdrop';

/**
 * Aircraft record, blueprint page 11.
 *
 * Same gating contract as `CredentialCard`: an aircraft whose claim is not
 * publishable renders nothing. That is what keeps Learjet 35 N277MK off the site
 * while D5 is open, without any page needing to know N277MK exists.
 *
 * The component also enforces the ownership language rule from page 6 — the word
 * "operates" or "owns" never appears unless `ownershipLanguageCleared` is true,
 * which requires leases, OpSpecs, and operating control on file (D4).
 */
export function AircraftCard({
  aircraft,
  locale,
  now,
}: {
  aircraft: AircraftRecord;
  locale: Locale;
  now: Date;
}) {
  if (!publishable(aircraft.claim, now)) return null;

  const dictionary = getDictionary(locale);
  const { fleet } = dictionary;
  const photo = aircraft.photos[0];

  return (
    <article className="overflow-hidden rounded-panel border border-ink-300 bg-white">
      {/*
       * Photography is permission-gated (D12). Rather than fall back to stock
       * imagery — page 10 explicitly forbids generic stretcher photos and
       * dramatic emergency imagery — the empty state is a typographic panel
       * showing the registration. It reads as deliberate, not broken.
       */}
      {photo !== undefined ? (
        /*
         * A plain <img>, not next/image. The permission record supplies the
         * asset and its caption; running approved operational photography
         * through the optimiser would re-encode it, and page 10 requires
         * published imagery to match what was approved. Sizing is fixed by the
         * aspect-ratio class, so this does not cost layout stability.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.src}
          alt={photo.alt}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      ) : (
        /*
         * Photography is permission-gated (D12). The placeholder is a technical
         * schematic rather than stock imagery — page 10 forbids generic
         * stretcher and dramatic emergency photos, and a schematic is
         * unmistakably a diagram, so it cannot be mistaken for a depiction of
         * this specific airframe.
         */
        <div className="relative flex aspect-[16/9] w-full items-center justify-between gap-4 overflow-hidden bg-navy-900 px-7">
          <p>
            <span className="block text-3xl font-bold tracking-tight text-white">
              {aircraft.tailNumber}
            </span>
            <span className="mt-1 block text-sm text-white/70">{aircraft.model}</span>
          </p>
          <AircraftPlanform className="h-[84%] w-auto shrink-0 text-white/20" />
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-navy-900">
          {aircraft.manufacturer} {aircraft.model}
        </h3>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink-500">{fleet.tailNumber}</dt>
            <dd className="text-ink-900">{aircraft.tailNumber}</dd>
          </div>

          <div>
            <dt className="font-semibold text-ink-500">{fleet.status}</dt>
            <dd className="text-ink-900">{aircraft.statusLabel}</dd>
          </div>

          {/*
           * Registered owner is a public FAA fact and is shown as such. It is
           * NOT presented as AirEvac ownership: page 6 forbids "owned and
           * operated" language until leases, OpSpecs, and operating control are
           * documented.
           */}
          <div>
            <dt className="font-semibold text-ink-500">{fleet.registeredOwner}</dt>
            <dd className="text-ink-900">{aircraft.registeredOwner}</dd>
          </div>

          {aircraft.registrationExpiresOn !== '' && (
            <div>
              <dt className="font-semibold text-ink-500">{fleet.registrationExpires}</dt>
              <dd className="text-ink-900">
                {formatDate(aircraft.registrationExpiresOn, locale)}
              </dd>
            </div>
          )}
        </dl>

        {/* Clinical configuration copy is Medical Director-owned (page 6). */}
        <p className="mt-4 text-sm text-ink-500">
          {aircraft.medicalConfiguration ?? fleet.configurationPending}
        </p>

        {aircraft.claim.verificationUrl !== null && (
          <p className="mt-3">
            <a
              href={aircraft.claim.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-support-700 underline underline-offset-4 hover:text-navy-900"
            >
              {dictionary.credentials.verifyLink}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
