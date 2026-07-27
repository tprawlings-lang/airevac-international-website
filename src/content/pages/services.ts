import type { PageContent } from '@/content/blocks';

/**
 * Service pages. Blueprint page 11 fixes the required block order:
 *
 *   "Who it is for | What is included | Medical review | Aircraft and equipment |
 *    Process | Limits | FAQ | Contact"
 *
 * The "Limits" block is the one most sites omit and the one this blueprint makes
 * mandatory. Section 12 (FTC Act) requires "No misleading privacy, insurance,
 * price, medical, safety, availability, review, or accreditation claims" — the
 * most common misleading claim in this industry is silence about what a service
 * cannot do.
 *
 * All service pages are `contentClass: 'medical'`, so Spanish is gated on human
 * review (D11).
 */

export const SERVICE_PAGES: readonly PageContent[] = [
  {
    path: '/services/air-ambulance',
    title: 'Air Ambulance',
    description:
      'Dedicated fixed-wing air ambulance transport from Mexico, the Caribbean, and ' +
      'Central America, coordinated directly with your receiving facility.',
    intro:
      'A dedicated aircraft configured for patient transport, with a medical crew, flown ' +
      'bedside to bedside between the sending and receiving facilities.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Who this is for',
        paragraphs: [
          'A patient whose condition, equipment needs, or clinical risk makes commercial ' +
            'flight unsuitable, and who needs to move between hospitals across a border or ' +
            'over water.',
          'Most of our air ambulance cases begin with a hospital case manager, a cruise or ' +
            'port medical team, or an insurer coordinating a member abroad. Families arrange ' +
            'transports directly as well.',
        ],
      },
      {
        type: 'list',
        heading: 'What is included',
        items: [
          'A dedicated aircraft for your patient — the flight is not shared and is not routed around other cases.',
          'A medical crew configured to the patient’s accepted level of care.',
          'Ground ambulance coordination at both ends, so the transport is bedside to bedside rather than airport to airport.',
          'Coordination with the sending physician and the receiving facility, including bed confirmation before departure.',
          'Flight planning, permits, customs and immigration handling for international segments.',
          'A named flight coordinator who stays with the case and gives you status updates.',
        ],
      },
      {
        type: 'prose',
        heading: 'Medical review',
        paragraphs: [
          'Every request goes through a medical review before a transport is confirmed. The ' +
            'review looks at the patient’s current condition, the equipment and medications ' +
            'needed in flight, altitude considerations, the sending facility’s report, and ' +
            'whether the receiving facility can accept the patient.',
          'That review is done by our medical and operations team, not by this website and ' +
            'not by an automated tool. Nothing you enter on this site determines whether a ' +
            'patient is fit to fly.',
        ],
      },
      {
        type: 'prose',
        heading: 'Aircraft and equipment',
        paragraphs: [
          'The current working fleet includes Learjet 31A aircraft N322PR and N669MD, both ' +
            'listed on our EURAMI provider record. Aircraft registration details and ' +
            'verification links are on the fleet page.',
        ],
      },
      {
        type: 'list',
        heading: 'How the process runs',
        ordered: true,
        items: [
          'You call a flight coordinator, or request a callback with the route and timing only.',
          'We confirm the logistics: where the patient is, where they need to go, and by when.',
          'A coordinator opens a protected channel for patient details, records, and insurance documents. This never happens through a public form on this site.',
          'Medical, flight, receiving-facility, and financial review run in parallel.',
          'We confirm the transport plan, the crew, the aircraft, and the timeline with you.',
          'The transport runs, and your coordinator updates you through it.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'What we will not tell you before a review',
        body:
          'We will not confirm that a specific patient is fit to fly, quote a final price, or ' +
          'tell you that an insurer will pay, before the medical, operational, and financial ' +
          'reviews are complete. Any provider who does those things on a first phone call is ' +
          'guessing.',
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'We are not a local emergency response service. For an immediate emergency where the patient is, call local emergency services first.',
          'We do not guarantee insurance payment. Coverage is decided by the insurer.',
          'Transport feasibility depends on the patient’s condition, weather, airport hours and permits, aircraft availability, and the receiving facility accepting the patient.',
          'Some patients are better served by a commercial medical escort than by a dedicated air ambulance. We will say so when that is the case.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            question: 'How quickly can a transport happen?',
            answer:
              'It depends on the patient’s condition, the receiving facility accepting them, ' +
              'permits and airport hours at both ends, and weather. Your coordinator will give ' +
              'you a realistic window once the route is known, and will tell you what is ' +
              'driving it. We do not publish a standard response time, because a number that ' +
              'is not true for your route is worse than no number.',
          },
          {
            question: 'Can a family member fly with the patient?',
            answer:
              'Usually one companion can travel, subject to the aircraft configuration, weight ' +
              'and balance, and the medical crew’s assessment. Confirm it with your coordinator ' +
              'early, because it affects planning.',
          },
          {
            question: 'Who decides which hospital the patient goes to?',
            answer:
              'The patient, family, or referring physician does, with input from the insurer ' +
              'where one is involved. We coordinate with the receiving facility and confirm ' +
              'the bed before departure, but we do not choose the destination.',
          },
        ],
      },
    ],
  },

  {
    path: '/services/medical-repatriation',
    title: 'Medical Repatriation',
    description:
      'Returning a patient to their home country or home region for continued care, ' +
      'coordinated with the sending facility, the receiving hospital, and the insurer.',
    intro:
      'Bringing a patient home after illness or injury abroad, to a hospital that can ' +
      'continue their care rather than to an airport.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Who this is for',
        paragraphs: [
          'A traveller, expatriate, cruise passenger, or seasonal resident who became ill or ' +
            'was injured away from home and needs to return for continued treatment.',
          'Repatriation differs from an emergency transfer in one important way: there is ' +
            'usually time to do it properly. That time is best spent confirming the receiving ' +
            'bed, aligning the insurer, and assembling records — not waiting.',
        ],
      },
      {
        type: 'list',
        heading: 'What is included',
        items: [
          'Assessment of whether a dedicated air ambulance or a commercial medical escort fits the patient’s condition and the route.',
          'Coordination with the sending facility for records, current status, and discharge planning.',
          'Receiving hospital coordination and bed confirmation before departure.',
          'Documentation support for insurers and assistance companies.',
          'Ground transfers at both ends.',
          'Customs, immigration, and permit handling for the international segments.',
        ],
      },
      {
        type: 'prose',
        heading: 'Medical review',
        paragraphs: [
          'A repatriation is planned around the patient’s stability over a longer route. The ' +
            'medical review considers whether the patient can tolerate the flight duration, ' +
            'what monitoring and equipment are needed, medication schedules in flight, and ' +
            'whether a technical stop changes the picture.',
        ],
      },
      {
        type: 'prose',
        heading: 'Aircraft and equipment',
        paragraphs: [
          'The current working fleet includes Learjet 31A aircraft N322PR and N669MD. Longer ' +
            'routes may require a technical stop for fuel; your coordinator will tell you if ' +
            'your route does, and what it adds to the timeline.',
        ],
      },
      {
        type: 'list',
        heading: 'How the process runs',
        ordered: true,
        items: [
          'Call or request a callback with the patient’s current city and the destination city.',
          'We confirm the route, the timing you need, and who is coordinating on your side.',
          'A coordinator opens a protected channel for records, insurance, and consent.',
          'Medical and operational review determines the right transport type and configuration.',
          'We confirm the receiving bed, the plan, and the cost basis before the transport is scheduled.',
          'The transport runs bedside to bedside.',
        ],
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'A receiving facility must accept the patient before a repatriation can be confirmed. We help coordinate this, but we cannot compel a hospital to accept.',
          'Travel insurance and health plans differ on repatriation benefits. We support the claim; we do not decide it.',
          'Some destinations have limited airport hours, permit lead times, or seasonal constraints that affect scheduling.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            question: 'Is repatriation covered by travel insurance?',
            answer:
              'Sometimes, and it depends entirely on the policy. Many travel policies include ' +
              'medical repatriation; many domestic health plans do not cover transport ' +
              'originating abroad. Our team works the authorization with your insurer and will ' +
              'tell you plainly what the policy says. We do not promise coverage.',
          },
          {
            question: 'What is the difference between repatriation and an air ambulance transport?',
            answer:
              'Air ambulance describes the transport type — a dedicated, medically configured ' +
              'aircraft. Repatriation describes the purpose — returning a patient home. A ' +
              'repatriation may be flown as an air ambulance or, for a stable patient, as a ' +
              'commercial medical escort.',
          },
        ],
      },
    ],
  },

  {
    path: '/services/critical-care-transport',
    title: 'Critical Care Transport',
    description:
      'Transport for critically ill and injured patients, with a critical care crew and ' +
      'in-flight monitoring, under our EURAMI Critical Care Transports endorsement.',
    intro:
      'Transport for patients who need critical care continued in the air, not interrupted ' +
      'by it.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Who this is for',
        paragraphs: [
          'Patients under intensive care who need to move between facilities — including ' +
            'ventilated patients, patients on multiple infusions, and patients requiring ' +
            'continuous haemodynamic monitoring — where the sending facility cannot provide ' +
            'the definitive care needed.',
          'These cases almost always come from an ICU physician or a hospital case manager, ' +
            'and they are the cases where early coordination matters most.',
        ],
      },
      {
        type: 'prose',
        heading: 'Accreditation scope',
        paragraphs: [
          'AirEvac International USA holds EURAMI accreditation as a Regional Fixed Wing Air ' +
            'Ambulance with a Critical Care Transports endorsement. The exact scope, holder, ' +
            'expiry date, and a link to EURAMI’s own record are published on our credentials ' +
            'page so you can verify it independently.',
        ],
      },
      {
        type: 'prose',
        heading: 'Medical review',
        paragraphs: [
          'Critical care cases receive a physician-level review before acceptance. That review ' +
            'covers current haemodynamic and respiratory status, ventilator and infusion ' +
            'requirements, altitude physiology, the equipment and drugs required in flight, ' +
            'and the handover plan at both ends.',
          'The review is a clinical decision made by our medical team in consultation with ' +
            'the sending physician. It is not made by this website, and no part of this site ' +
            'assesses a patient or determines fitness to fly.',
        ],
      },
      {
        type: 'list',
        heading: 'What coordination looks like',
        items: [
          'Direct physician-to-physician contact between the sending facility and our medical team where the case warrants it.',
          'Confirmation of the receiving ICU bed and accepting physician before departure.',
          'A documented handover at both ends, so nothing is lost between teams.',
          'Continuous monitoring appropriate to the patient’s accepted level of care throughout the transport.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'Send clinical information through the protected channel',
        body:
          'Do not send patient records, imaging, or clinical detail through this website’s ' +
          'forms or by ordinary email. Call a coordinator and we will open a protected ' +
          'channel for the clinical handoff.',
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'Not every critically ill patient is transportable. If the medical review concludes that moving the patient carries more risk than benefit, we will say so.',
          'Some equipment and therapies cannot be supported in flight. The medical review establishes what can.',
          'We do not accept a critical care transport without an accepting physician and a confirmed bed at the receiving facility.',
        ],
      },
    ],
  },

  {
    path: '/services/commercial-medical-escort',
    title: 'Commercial Medical Escort',
    description:
      'A medical escort accompanying a stable patient on a scheduled commercial flight, ' +
      'when a dedicated air ambulance is not clinically necessary.',
    intro:
      'For a stable patient who can travel on a scheduled airline with a medical professional ' +
      'alongside them.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'Service availability is being confirmed',
        body:
          'This page describes how a commercial medical escort works. Confirm current ' +
          'availability with a flight coordinator before planning around it.',
      },
      {
        type: 'prose',
        heading: 'Who this is for',
        paragraphs: [
          'A patient who is medically stable, does not need continuous monitoring or in-flight ' +
            'intervention, and can be safely accommodated in an airline cabin — but who should ' +
            'not travel alone.',
          'A commercial escort is often the right answer for a patient recovering after a ' +
            'stabilised event, returning home over a long route where a dedicated aircraft ' +
            'would require multiple fuel stops.',
        ],
      },
      {
        type: 'definitions',
        heading: 'How it differs from an air ambulance',
        items: [
          {
            term: 'Clinical threshold',
            detail:
              'An escort suits stable patients. A patient needing continuous monitoring, ' +
              'ventilation, or in-flight intervention needs a dedicated air ambulance.',
          },
          {
            term: 'Schedule',
            detail:
              'An escort runs on the airline’s schedule, not yours. An air ambulance departs ' +
              'when the patient and crew are ready.',
          },
          {
            term: 'Route',
            detail:
              'An escort can use long-haul routes without technical stops, which sometimes ' +
              'makes it faster overall on very long distances.',
          },
          {
            term: 'Cost',
            detail:
              'An escort generally costs substantially less than a dedicated aircraft. Your ' +
              'coordinator will explain the cost basis for both once the route and the ' +
              'patient’s status are known.',
          },
        ],
      },
      {
        type: 'list',
        heading: 'What is included',
        items: [
          'Assessment of whether the patient is suitable for commercial travel.',
          'Airline medical clearance coordination, which most carriers require in advance.',
          'A medical escort travelling with the patient for the full journey.',
          'Ground transfers and airport assistance at both ends.',
          'Seating, oxygen, and equipment arrangements with the carrier where applicable.',
        ],
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'The airline decides whether to carry the patient. Medical clearance is the carrier’s decision, and it takes lead time.',
          'A patient whose condition changes before departure may no longer be suitable for commercial travel.',
          'Oxygen, stretcher, and equipment provisions vary considerably between carriers and routes.',
        ],
      },
    ],
  },
] as const;
