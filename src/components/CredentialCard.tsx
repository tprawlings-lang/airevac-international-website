import { getDictionary } from '@/content/dictionary';
import { formatDate, type Locale } from '@/lib/i18n';
import { publishable, type ClaimRecord } from '@/lib/credential-register';

/**
 * Credential record, blueprint page 11:
 *   "Credential name | Exact scope | Holder | Issuer | Effective and expiry
 *    dates | Certificate image | Verification link | Last reviewed"
 *
 * THE GATE IS INSIDE THE COMPONENT, NOT AT THE CALL SITE.
 *
 * Every render path checks `publishable()` and returns `null` when the record is
 * not cleared. Putting the check here rather than in each page means a new page
 * that renders a credential inherits the launch rule automatically — a page
 * author cannot forget it, and there is no prop that bypasses it.
 *
 * `now` is passed in by the page so the whole page shares one evaluation instant
 * and a credential cannot expire midway through a render.
 */
export function CredentialCard({
  record,
  locale,
  now,
}: {
  record: ClaimRecord;
  locale: Locale;
  now: Date;
}) {
  // The non-negotiable launch rule, enforced.
  if (!publishable(record, now)) return null;

  const dictionary = getDictionary(locale);
  const { credentials } = dictionary;

  return (
    <article className="rounded-panel border border-ink-300 bg-white p-6">
      <h3 className="text-xl font-bold text-navy-900">{record.issuer}</h3>

      {/* Exact issuer wording. Never a marketing paraphrase (page 6). */}
      <p className="mt-2 text-ink-900">{record.scope}</p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-ink-500">{credentials.holder}</dt>
          <dd className="text-ink-900">{record.holder}</dd>
        </div>

        {record.expiresOn !== null && (
          <div>
            <dt className="font-semibold text-ink-500">{credentials.expires}</dt>
            <dd className="text-ink-900">{formatDate(record.expiresOn, locale)}</dd>
          </div>
        )}

        {record.lastReviewedOn !== null && (
          <div>
            <dt className="font-semibold text-ink-500">{credentials.lastReviewed}</dt>
            <dd className="text-ink-900">{formatDate(record.lastReviewedOn, locale)}</dd>
          </div>
        )}
      </dl>

      {/*
       * Verification link. Section 19 asks for a correction path on reviewed
       * content; for a credential the strongest correction path is the issuer's
       * own record, so a reader can check the claim without asking us.
       */}
      {record.verificationUrl !== null && (
        <p className="mt-4">
          <a
            href={record.verificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-support-700 underline underline-offset-4 hover:text-navy-900"
          >
            {credentials.verifyLink}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </article>
  );
}

/**
 * Renders the publishable subset of a register, or an honest empty state.
 *
 * The empty state matters: a credentials page that renders nothing at all looks
 * broken, while one that explains the standard being applied turns the gate into
 * a trust signal.
 */
export function CredentialList({
  records,
  locale,
  now,
}: {
  records: readonly ClaimRecord[];
  locale: Locale;
  now: Date;
}) {
  const dictionary = getDictionary(locale);
  const visible = records.filter((record) => publishable(record, now));

  if (visible.length === 0) {
    return (
      <p className="rounded-panel border border-ink-300 bg-support-50 p-6 text-ink-700">
        {dictionary.credentials.noneAvailable}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visible.map((record) => (
        <CredentialCard key={record.id} record={record} locale={locale} now={now} />
      ))}
    </div>
  );
}
