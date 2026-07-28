import type { Locale } from '@/lib/i18n';

/**
 * The transport process ("Next Steps"), shown on the homepage.
 *
 * Updated per the AEI handoff: the old audience-selector step is removed and
 * the remaining steps renumbered (Section 11); case documents move by email or
 * fax (H-06, exact copy); the documents-and-financial-clearance step is added
 * before final confirmation (H-07, exact copy). The How It Works page mirrors
 * this sequence so the two never disagree.
 */

interface Step {
  title: string;
  detail: string;
}

const STEPS: Record<Locale, Step[]> = {
  en: [
    {
      title: 'Contact a coordinator',
      detail:
        'Call (619) 754-6755 or email ops@aeiamericas.com. Our coordinators are ' +
        'available 24/7 by phone and email, and open a case reference for you.',
    },
    {
      title: 'Share the transport logistics',
      detail:
        'Where the patient is, where they need to go, by when, and how to reach you. No ' +
        'patient details are needed at this stage.',
    },
    {
      title: 'Email or Fax Case Documents',
      detail:
        'Email clinical records and transport documents to ops@aeiamericas.com or fax ' +
        'them to (619) 330-4551. Our coordinators will confirm receipt and request ' +
        'anything still needed.',
    },
    {
      title: 'Case review',
      detail:
        'Medical, flight, receiving-facility, and financial review run in parallel. ' +
        'Confirmed bed acceptance at the receiving location is required before transport.',
    },
    {
      title: 'Complete Documents and Financial Clearance',
      detail:
        'Sign the required documents. Private-pay cases complete payment before ' +
        'transport. Insurance cases proceed through AEI’s approved billing process.',
    },
    {
      title: 'Confirm and fly',
      detail:
        'We confirm the transport plan, the receiving facility, and the timeline. The ' +
        'transport runs bed-to-bed, and our coordinators keep you updated through it.',
    },
  ],

  // Process copy describes the clinical and billing workflow, so it is treated
  // as medical content: Spanish ships only after human review (D11). Until then
  // the Spanish page renders TranslationPendingNotice instead of this component.
  es: [],
};

export function ProcessSteps({ locale }: { locale: Locale }) {
  const steps = STEPS[locale];

  if (steps.length === 0) return null;

  return (
    <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-panel border border-ink-300 bg-white p-5">
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
        </li>
      ))}
    </ol>
  );
}
