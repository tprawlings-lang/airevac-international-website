import type { PageContent } from '@/content/blocks';

/**
 * Air medical transport glossary.
 *
 * WHY THIS PAGE EXISTS. Two audiences arrive at this site speaking different
 * languages. A case manager says "bed acceptance" and "fit to fly" as routine
 * vocabulary; a family member who has never arranged a transport before hears
 * those words for the first time in the worst week of their life and does not
 * ask what they mean. Every term below is one the rest of this site uses in
 * passing and explains only in context.
 *
 * WHY IT IS ALSO THE MOST CITABLE PAGE ON THE SITE. Definitional content is
 * what an answer engine reaches for when someone asks "what is bed acceptance"
 * or "what does financial clearance mean for a medical flight". It carries no
 * capability claim, no price, and no promise, so it can be quoted in full
 * without misrepresenting AirEvac. That combination is rare and worth having.
 *
 * WHAT MAY GO IN HERE. Definitions of industry vocabulary, and descriptions of
 * how a step works in general practice. NOT: anything specific to AirEvac's
 * capability, authority, staffing, equipment, or pricing. Those belong on the
 * pages that carry the claim gates. A definition is safe precisely because it
 * describes the field rather than the company.
 */

export const GLOSSARY_PAGE: PageContent = {
  path: '/resources/glossary',
  title: 'Air Medical Transport Glossary',
  description:
    'Plain-language definitions of the terms used when arranging an air ambulance: bed ' +
    'acceptance, financial clearance, repatriation, fit to fly, technical stop, and more.',
  intro: 'The words used when arranging a medical flight, in plain language.',
  contentClass: 'general',
  reviewer: null,
  reviewedOn: null,
  esReviewedOn: null,
  blocks: [
    {
      type: 'prose',
      paragraphs: [
        'Arranging a medical flight involves vocabulary that is routine for hospital case ' +
          'managers and completely unfamiliar to most families. The terms below are the ' +
          'ones that come up most often, defined as they are generally used in air medical ' +
          'transport rather than as any one company uses them.',
        'If a coordinator uses a word that is not here, ask them to explain it. Nobody ' +
          'arranging a transport for the first time is expected to know this language, and ' +
          'a coordinator who will not explain a term plainly is not doing their job.',
      ],
    },

    {
      type: 'definitions',
      heading: 'Arranging the transport',
      items: [
        {
          term: 'Bed acceptance',
          detail:
            'Written confirmation from the receiving hospital that it has a bed and will ' +
            'take the patient, usually naming the accepting physician. No responsible ' +
            'transport departs without it: a patient who arrives at a hospital that has ' +
            'not accepted them has nowhere to go. It is frequently the single step that ' +
            'sets the timeline, because it depends on a hospital neither the family nor ' +
            'the transport provider controls.',
        },
        {
          term: 'Financial clearance',
          detail:
            'Confirmation that the transport will be paid for, either by an insurer that ' +
            'has authorized it or by the payer completing payment. It is a separate step ' +
            'from the medical review and typically runs in parallel with it.',
        },
        {
          term: 'Letter of guarantee, or guarantee of payment',
          detail:
            'A written commitment from an insurer or assistance company that it will pay a ' +
            'hospital or a transport provider. Hospitals abroad often require one before ' +
            'discharging a patient. The term is insurance vocabulary and refers to the ' +
            'insurer’s commitment, not to any promise by a transport provider.',
        },
        {
          term: 'Medical review',
          detail:
            'The assessment, using the patient’s records and usually a conversation with ' +
            'the treating physician, of whether the patient can safely make the flight and ' +
            'what level of care they need in the air. It determines the crew and the ' +
            'equipment, and it can conclude that a transport should wait.',
        },
        {
          term: 'Case reference or case number',
          detail:
            'The identifier a coordinator opens on the first call, so that every later ' +
            'call, record, and document is tied to the same case. Quoting it saves ' +
            'repeating the whole story to whoever answers the phone.',
        },
      ],
    },

    {
      type: 'definitions',
      heading: 'The patient and the flight',
      items: [
        {
          term: 'Fit to fly',
          detail:
            'A clinical judgment that a patient can tolerate flight. It is not a single ' +
            'test: altitude affects oxygenation, expands gas in body cavities, and can ' +
            'worsen specific conditions, so the assessment depends on the diagnosis. The ' +
            'treating physician and the transport’s medical team make this call together.',
        },
        {
          term: 'Medical repatriation',
          detail:
            'Returning a patient to their home country for continued care, as distinct ' +
            'from an emergency transfer to the nearest capable hospital. Repatriations are ' +
            'usually planned over days rather than hours.',
        },
        {
          term: 'Critical care transport',
          detail:
            'Transport of a patient who needs intensive-care-level monitoring and ' +
            'intervention throughout the flight, rather than a patient who is stable and ' +
            'simply needs to travel lying down.',
        },
        {
          term: 'Decompression illness',
          detail:
            'A diving injury caused by dissolved gas coming out of solution as pressure ' +
            'drops. It matters for air transport because flying lowers cabin pressure ' +
            'further: after treatment, a physician usually sets a waiting period before a ' +
            'patient may fly, which can delay a transport by days rather than hours.',
        },
        {
          term: 'Stretcher configuration',
          detail:
            'An aircraft cabin arranged so a patient travels lying flat, with the medical ' +
            'crew and equipment positioned to reach them throughout the flight.',
        },
      ],
    },

    {
      type: 'definitions',
      heading: 'Aircraft, airports, and routing',
      items: [
        {
          term: 'ICAO code',
          detail:
            'The four-letter international airport identifier used in flight planning, ' +
            'such as KFXE for Fort Lauderdale Executive or MMUN for Cancún. It differs ' +
            'from the three-letter IATA code passengers see on a boarding pass, and ' +
            'aviation documents use the four-letter form.',
        },
        {
          term: 'Technical stop, or tech stop',
          detail:
            'A landing made for fuel or crew requirements rather than to pick anyone up. ' +
            'On longer routes a technical stop is normal and adds a predictable amount of ' +
            'time, which a coordinator should tell you about in advance.',
        },
        {
          term: 'Ground leg',
          detail:
            'The ambulance journey at either end, between the hospital and the aircraft. ' +
            'On some routes the ground legs take longer than the flight, which is why ' +
            'coordinators plan them against the aircraft slot rather than afterward.',
        },
        {
          term: 'Overflight and landing permits',
          detail:
            'Permissions required to cross or land in a country’s airspace. Lead times ' +
            'vary by country, which is one reason an international transport cannot always ' +
            'depart as quickly as a domestic one.',
        },
        {
          term: 'Airport operating hours',
          detail:
            'Smaller regional airports are not all open 24 hours, and some require prior ' +
            'permission or a callout for a departure outside normal hours. A short flight ' +
            'can still involve an overnight wait when the departure airport is closed.',
        },
        {
          term: 'Ground handling',
          detail:
            'The services an airport provides to an arriving or departing aircraft, ' +
            'including ramp access for an ambulance to reach the aircraft directly.',
        },
      ],
    },

    {
      type: 'definitions',
      heading: 'Paperwork and payment',
      items: [
        {
          term: 'Medical summary, or discharge summary',
          detail:
            'The sending hospital’s written account of the patient’s condition, treatment, ' +
            'and current status. It is the primary document the medical review depends on, ' +
            'and hospitals generally prepare it during business hours, so requesting it ' +
            'early is usually worthwhile.',
        },
        {
          term: 'Assistance company',
          detail:
            'A company that coordinates medical help for travelers on behalf of an insurer ' +
            'or an employer. Where one is involved, it is often the party that authorizes ' +
            'and pays for a transport.',
        },
        {
          term: 'Private pay',
          detail:
            'Arranging a transport without insurance covering it, whether because the ' +
            'patient is uninsured, the policy excludes it, or the family chooses not to ' +
            'wait for an insurance decision.',
        },
        {
          term: 'Prior authorization',
          detail:
            'An insurer’s approval of a service before it happens. Insurers commonly ' +
            'require it for air medical transport, and obtaining it is normally the ' +
            'longest part of an insurance-funded case.',
        },
      ],
    },

    {
      type: 'callout',
      tone: 'info',
      heading: 'A definition is not a commitment',
      body:
        'Everything above describes how these terms are generally used in air medical ' +
        'transport. It does not describe what will happen in a particular case. Whether a ' +
        'specific patient can fly, when, on what aircraft, and who pays are all decided ' +
        'case by case, and our coordinators will tell you what applies to yours.',
    },
  ],
};
