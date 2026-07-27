import type { Locale } from '@/lib/i18n';

/**
 * The six-step transport process, blueprint page 12:
 *
 *   1 Choose route  2 Contact  3 Logistics only  4 Secure intake
 *   5 Review        6 Confirm
 *
 * Step 3 and step 4 are drawn as a deliberate boundary. The whole point of the
 * workflow section is that "All routes begin with minimal logistics and move
 * patient details into a protected channel only after the visitor understands
 * where the information is going." Showing that boundary in the UI is how the
 * visitor comes to understand it — so the divider is content, not decoration.
 */

interface Step {
  title: string;
  detail: string;
}

const STEPS: Record<Locale, Step[]> = {
  en: [
    {
      title: 'Choose your path',
      detail: 'Hospital, cruise or maritime, insurer or assistance company, or patient and family.',
    },
    {
      title: 'Contact a coordinator',
      detail: 'Call 24/7, or request a callback. A coordinator opens a case reference for you.',
    },
    {
      title: 'Logistics only',
      detail:
        'Origin, destination, timing, and a callback number. No patient details are collected ' +
        'at this stage.',
    },
    {
      title: 'Secure clinical intake',
      detail:
        'The coordinator opens a protected channel for patient identity, records, insurance, ' +
        'and consent. This never happens through a public web form.',
    },
    {
      title: 'Review',
      detail:
        'Medical, flight, receiving-facility, and financial review. Feasibility is determined ' +
        'by the medical and operations team, not by the website.',
    },
    {
      title: 'Confirm and fly',
      detail:
        'The coordinator confirms the transport plan, the receiving facility, and the timeline, ' +
        'then keeps you updated through the case.',
    },
  ],

  // Process copy describes the clinical and privacy handoff, so it is treated as
  // medical content: Spanish ships only after human review (D11). Until then the
  // Spanish page renders TranslationPendingNotice instead of this component.
  es: [],
};

export function ProcessSteps({ locale }: { locale: Locale }) {
  const steps = STEPS[locale];

  if (steps.length === 0) return null;

  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => {
        // The privacy boundary sits between step 3 and step 4.
        const isSecureStage = index >= 3;

        return (
          <li
            key={step.title}
            className={`rounded-panel border p-5 ${
              isSecureStage
                ? 'border-support-500 bg-support-50'
                : 'border-ink-300 bg-white'
            }`}
          >
            <p className="flex items-baseline gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white"
              >
                {index + 1}
              </span>
              <span className="text-lg font-bold text-navy-900">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-700">{step.detail}</p>

            {index === 3 && (
              <p className="mt-3 border-t border-support-500 pt-3 text-xs font-semibold uppercase tracking-wide text-support-700">
                Protected channel begins here
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
