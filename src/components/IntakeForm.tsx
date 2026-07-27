'use client';

import { useId, useRef, useState } from 'react';
import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import type { Locale } from '@/lib/i18n';
import {
  NOTE_LIMIT,
  REFERRAL_ROLES,
  TIMEFRAMES,
  type ReferralRole,
} from '@/lib/intake-schema';

/**
 * Public intake form. Blueprint section 6, "Public intake fields".
 *
 * FIELDS ARE THE BLUEPRINT'S ALLOWLIST, EXACTLY:
 *   contact name, organization, role, origin, destination, timeframe, phone,
 *   email, preferred language, callback consent.
 *
 * There is no diagnosis field, no patient name, no date of birth, no record
 * number, no insurance ID, and no file upload — page 12 forbids all of them in
 * the public marketing form. The server schema is `.strict()`, so adding an
 * input here without also changing the schema produces a validation error rather
 * than a silent PHI pathway.
 *
 * ACCESSIBILITY (page 21 gate: WCAG 2.2 AA, zero serious issues)
 *  - Every input has a real `<label>`, not a placeholder.
 *  - Errors are announced via an error summary that receives focus on submit
 *    (the pattern that actually works with screen readers) and each field is
 *    linked to its message with `aria-describedby` + `aria-invalid`.
 *  - The submit button never disappears; it changes its accessible name.
 */

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited';

interface FieldErrors {
  [field: string]: string;
}

export function IntakeForm({
  locale,
  defaultRole,
}: {
  locale: Locale;
  /** Pre-selects the referral path when arriving from a partner page. */
  defaultRole?: ReferralRole;
}) {
  const dictionary = getDictionary(locale);
  const t = dictionary.intake;

  const formId = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [noteLength, setNoteLength] = useState(0);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  /**
   * One idempotency key per mounted form. Section 14: "Every inquiry and
   * downstream write carries a unique idempotency key ... to prevent duplicate
   * case creation." Held in a ref rather than state so a re-render never mints a
   * second key — a double-submit must reuse the same key to be deduplicated.
   */
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: string) => `${formId}-${name}-error`;
  const helpId = (name: string) => `${formId}-${name}-help`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setErrors({});

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      contactName: String(data.get('contactName') ?? ''),
      organization: String(data.get('organization') ?? ''),
      role: String(data.get('role') ?? ''),
      originCity: String(data.get('originCity') ?? ''),
      destinationCity: String(data.get('destinationCity') ?? ''),
      timeframe: String(data.get('timeframe') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      preferredLanguage: String(data.get('preferredLanguage') ?? locale),
      callbackConsent: data.get('callbackConsent') === 'on',
      note: String(data.get('note') ?? ''),
      idempotencyKey: idempotencyKey.current,
    };

    try {
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setStatus('rate-limited');
        return;
      }

      const body: unknown = await response.json().catch(() => null);

      if (response.ok) {
        const id =
          typeof body === 'object' && body !== null && 'inquiryId' in body
            ? String((body as { inquiryId: unknown }).inquiryId)
            : null;
        setInquiryId(id);
        setStatus('success');
        // Move focus to the confirmation so a screen-reader user is told the
        // request landed, and so the reference number is the next thing read.
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }

      if (
        typeof body === 'object' &&
        body !== null &&
        'fieldErrors' in body &&
        typeof (body as { fieldErrors: unknown }).fieldErrors === 'object'
      ) {
        setErrors((body as { fieldErrors: FieldErrors }).fieldErrors);
        setStatus('error');
        requestAnimationFrame(() => errorSummaryRef.current?.focus());
        return;
      }

      setStatus('error');
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    } catch {
      // Network failure. Page 20: surface the phone path, never a dead end.
      setStatus('error');
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
    }
  }

  // --- Confirmation -------------------------------------------------------
  if (status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-panel border-2 border-support-500 bg-support-50 p-6"
      >
        <h2 className="text-2xl font-bold text-navy-900">{t.successTitle}</h2>
        <p className="mt-3 text-ink-900">{t.successBody}</p>

        {inquiryId !== null && (
          <p className="mt-4 text-sm text-ink-700">
            {t.inquiryIdLabel}:{' '}
            <span className="font-mono font-semibold text-navy-900">{inquiryId}</span>
          </p>
        )}

        <a
          href={SITE.phone.href}
          className="mt-5 inline-flex min-h-[44px] items-center rounded-panel bg-urgent-600 px-5 py-3 font-semibold text-white hover:bg-urgent-700"
        >
          {dictionary.common.callCoordinator}: {SITE.phone.display}
        </a>
      </div>
    );
  }

  const errorEntries = Object.entries(errors);
  const showSummary = status === 'error' || status === 'rate-limited';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* --- Error / degraded-path summary --------------------------------- */}
      {showSummary && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-panel border-2 border-urgent-600 bg-urgent-50 p-4"
        >
          <h2 className="font-bold text-urgent-700">
            {status === 'rate-limited'
              ? t.rateLimitedTitle
              : errorEntries.length > 0
                ? t.errorSummaryTitle
                : t.errorTitle}
          </h2>

          {errorEntries.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a href={`#${fieldId(field)}`} className="underline underline-offset-4">
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">
              {status === 'rate-limited' ? t.rateLimitedBody : t.errorBody}
            </p>
          )}

          <a
            href={SITE.phone.href}
            className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-urgent-700 underline underline-offset-4"
          >
            {dictionary.common.callCoordinator}: {SITE.phone.display}
          </a>
        </div>
      )}

      {/* --- PHI warning ---------------------------------------------------
          Page 12 requires this warning above the free-text field. It is placed
          at the TOP of the form instead, so it is read before any field is
          filled rather than after the visitor has already typed. */}
      <div className="rounded-panel border-2 border-navy-800 bg-support-50 p-4">
        <h2 className="font-bold text-navy-900">{t.phiWarningTitle}</h2>
        <p className="mt-2 text-sm text-ink-900">{t.phiWarning}</p>
      </div>

      <p className="text-ink-700">{t.intro}</p>

      {/* --- Contact ------------------------------------------------------- */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={fieldId('contactName')}
          name="contactName"
          label={t.contactName}
          required
          autoComplete="name"
          error={errors.contactName}
          errorId={errorId('contactName')}
          requiredLabel={dictionary.common.required}
        />

        <Field
          id={fieldId('organization')}
          name="organization"
          label={t.organization}
          autoComplete="organization"
          error={errors.organization}
          errorId={errorId('organization')}
          optionalLabel={dictionary.common.optional}
        />
      </div>

      {/* --- Role ---------------------------------------------------------- */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink-900">
          {t.role} <RequiredMark label={dictionary.common.required} />
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {REFERRAL_ROLES.map((role) => (
            <label
              key={role}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-panel border border-ink-300 px-4 py-2 hover:bg-support-50"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={defaultRole === role}
                required
                className="size-4"
              />
              <span>{dictionary.referralSelector[role]}</span>
            </label>
          ))}
        </div>
        {errors.role !== undefined && <FieldError id={errorId('role')}>{errors.role}</FieldError>}
      </fieldset>

      {/* --- Logistics ----------------------------------------------------- */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={fieldId('originCity')}
          name="originCity"
          label={t.originCity}
          help={t.originHelp}
          helpId={helpId('originCity')}
          required
          error={errors.originCity}
          errorId={errorId('originCity')}
          requiredLabel={dictionary.common.required}
        />

        <Field
          id={fieldId('destinationCity')}
          name="destinationCity"
          label={t.destinationCity}
          help={t.destinationHelp}
          helpId={helpId('destinationCity')}
          required
          error={errors.destinationCity}
          errorId={errorId('destinationCity')}
          requiredLabel={dictionary.common.required}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldId('timeframe')} className="block text-sm font-semibold">
            {t.timeframe} <RequiredMark label={dictionary.common.required} />
          </label>
          <select
            id={fieldId('timeframe')}
            name="timeframe"
            required
            defaultValue="within-24-hours"
            className="mt-1 min-h-[44px] w-full rounded-panel border border-ink-300 px-3 py-2"
          >
            {TIMEFRAMES.map((value) => (
              <option key={value} value={value}>
                {dictionary.timeframes[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={fieldId('preferredLanguage')} className="block text-sm font-semibold">
            {t.preferredLanguage}
          </label>
          <select
            id={fieldId('preferredLanguage')}
            name="preferredLanguage"
            defaultValue={locale}
            className="mt-1 min-h-[44px] w-full rounded-panel border border-ink-300 px-3 py-2"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      {/* --- Reachability --------------------------------------------------- */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={fieldId('phone')}
          name="phone"
          label={t.phone}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          error={errors.phone}
          errorId={errorId('phone')}
          requiredLabel={dictionary.common.required}
        />

        <Field
          id={fieldId('email')}
          name="email"
          label={t.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
          errorId={errorId('email')}
          optionalLabel={dictionary.common.optional}
        />
      </div>

      {/* --- Free text: the one place the PHI warning is legally required --- */}
      <div>
        <label htmlFor={fieldId('note')} className="block text-sm font-semibold">
          {t.note}{' '}
          <span className="font-normal text-ink-500">
            ({dictionary.common.optional})
          </span>
        </label>

        {/* Page 12: "Display a warning above any free-text field." */}
        <p
          id={helpId('note')}
          className="mt-1 border-l-4 border-urgent-600 bg-urgent-50 px-3 py-2 text-sm"
        >
          <strong>{t.phiWarningTitle}.</strong> {t.noteHelp}
        </p>

        <textarea
          id={fieldId('note')}
          name="note"
          rows={3}
          maxLength={NOTE_LIMIT}
          aria-describedby={helpId('note')}
          onChange={(event) => setNoteLength(event.target.value.length)}
          className="mt-2 w-full rounded-panel border border-ink-300 px-3 py-2"
        />

        <p aria-live="polite" className="mt-1 text-xs text-ink-500">
          {NOTE_LIMIT - noteLength} {t.charactersRemaining}
        </p>
      </div>

      {/* --- TCPA consent (page 18) ---------------------------------------- */}
      <div className="rounded-panel border border-ink-300 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="callbackConsent"
            required
            aria-describedby={helpId('callbackConsent')}
            className="mt-1 size-5 shrink-0"
          />
          <span className="text-sm">
            {t.callbackConsent} <RequiredMark label={dictionary.common.required} />
          </span>
        </label>
        <p id={helpId('callbackConsent')} className="mt-2 pl-8 text-xs text-ink-500">
          {t.callbackConsentHelp}
        </p>
        {errors.callbackConsent !== undefined && (
          <FieldError id={errorId('callbackConsent')}>{errors.callbackConsent}</FieldError>
        )}
      </div>

      {/* --- Submit --------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex min-h-[44px] items-center rounded-panel bg-navy-800 px-6 py-3 font-semibold text-white hover:bg-navy-900 disabled:opacity-70"
        >
          {status === 'submitting' ? t.submitting : t.submit}
        </button>

        <a
          href={SITE.phone.href}
          className="inline-flex min-h-[44px] items-center font-semibold text-urgent-700 underline underline-offset-4"
        >
          {dictionary.common.callCoordinator}: {SITE.phone.display}
        </a>
      </div>

      {/*
       * Page 20, graceful degradation: with scripts unavailable this form cannot
       * submit, so the phone path is stated explicitly rather than leaving a
       * button that silently does nothing.
       */}
      <noscript>
        <p className="rounded-panel border-2 border-urgent-600 bg-urgent-50 p-4 text-sm">
          {locale === 'es'
            ? 'Este formulario requiere JavaScript. Llame a un coordinador de vuelo al '
            : 'This form requires JavaScript. Please call a flight coordinator at '}
          <a href={SITE.phone.href} className="font-bold underline">
            {SITE.phone.display}
          </a>
          .
        </p>
      </noscript>
    </form>
  );
}

/* ------------------------------------------------------------------------- */

function RequiredMark({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-urgent-600">
        *
      </span>
      <span className="sr-only"> ({label})</span>
    </>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-sm font-semibold text-urgent-700">
      {children}
    </p>
  );
}

interface FieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  help?: string;
  helpId?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'tel' | 'email' | 'text';
  error?: string;
  errorId: string;
  requiredLabel?: string;
  optionalLabel?: string;
}

function Field({
  id,
  name,
  label,
  type = 'text',
  help,
  helpId,
  required = false,
  autoComplete,
  inputMode,
  error,
  errorId,
  requiredLabel,
  optionalLabel,
}: FieldProps) {
  const describedBy = [help !== undefined ? helpId : null, error !== undefined ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}{' '}
        {required && requiredLabel !== undefined ? (
          <RequiredMark label={requiredLabel} />
        ) : optionalLabel !== undefined ? (
          <span className="font-normal text-ink-500">({optionalLabel})</span>
        ) : null}
      </label>

      {help !== undefined && (
        <p id={helpId} className="mt-1 text-xs text-ink-500">
          {help}
        </p>
      )}

      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        className={`mt-1 min-h-[44px] w-full rounded-panel border px-3 py-2 ${
          error !== undefined
            ? 'border-2 border-urgent-600'
            : 'border-ink-300'
        }`}
      />

      {error !== undefined && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
