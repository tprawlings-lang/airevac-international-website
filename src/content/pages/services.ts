import type { PageContent } from '@/content/blocks';

/**
 * Service pages.
 *
 * Updated per the AEI Sample Site Coding Change Handoff (2026-07-27):
 *  - S-01/G-04: fleet described as two Learjet 31A aircraft, no registrations.
 *  - S-02: the old process heading is renamed "Next Steps".
 *  - S-03/G-08: records move by email or fax, never a protected channel or
 *    public upload.
 *  - S-04: "our coordinators" wherever the copy refers to AEI staff.
 *  - S-05: receiving bed acceptance callout, exact handoff copy.
 *  - S-06: the commercial-alternative sentence is deleted, not replaced.
 *  - Section 07: the response-time FAQ uses the conditional 90-minute copy and
 *    the bed-acceptance FAQ is added. Both carry a production approval gate
 *    (see docs/handoff-completion-report.md).
 *  - The escort service page is removed entirely; its route redirects to
 *    /services (Section 10).
 *
 * The blueprint's original rule against publishing response times (D14) is
 * overridden by this handoff for the conditional 90-minute copy; the conflict
 * is recorded in the completion report.
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
      'bed-to-bed between the sending and receiving facilities.',
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
          'A dedicated aircraft for your patient. The flight is not shared and is not routed around other cases.',
          'A medical crew configured to the patient’s accepted level of care.',
          'Ground ambulance coordination at both ends, so the transport is bed-to-bed rather than airport to airport.',
          'Coordination with the sending physician and the receiving facility, including bed confirmation before departure.',
          'Flight planning, permits, customs and immigration handling for international segments.',
          'Our coordinators stay with the case and give you status updates.',
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
          'The current working fleet is two Learjet 31A aircraft. Details about the fleet ' +
            'and the flight medical team are on the fleet pages.',
        ],
      },
      {
        type: 'list',
        heading: 'Next Steps',
        ordered: true,
        items: [
          'Call (619) 754-6755 or email ops@aeiamericas.com. Our coordinators are available 24/7 by phone and email.',
          'We confirm the logistics: where the patient is, where they need to go, and by when.',
          'Our coordinators will identify the records needed for review. Email them to ops@aeiamericas.com or fax them to (619) 330-4551.',
          'Medical, flight, receiving-facility, and financial review run in parallel.',
          'We confirm the transport plan, the crew, the aircraft, and the timeline with you.',
          'The transport runs, and our coordinators update you through it.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Receiving Bed Acceptance Is Required',
        body:
          'Every patient must have confirmed bed acceptance at the receiving location before ' +
          'transport. If acceptance has not been completed, AEI can send the case information ' +
          'and coordinate with the receiving facility to help complete the process.',
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
          'We cannot guarantee insurance payment. Coverage is decided by the insurer.',
          'Transport feasibility depends on the patient’s condition, weather, airport hours and permits, aircraft availability, and the receiving facility accepting the patient.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            question: 'How quickly can AEI respond?',
            answer:
              'AEI’s standard response time is 90 minutes once we have all required ' +
              'information, required payment or financial clearance, confirmed receiving bed ' +
              'acceptance, and an available aircraft. Weather, permits, airport access, and ' +
              'medical review may affect timing. Call (619) 754-6755 or email ' +
              'ops@aeiamericas.com.',
          },
          {
            question: 'Does the patient need bed acceptance?',
            answer:
              'Yes. Every patient must have confirmed bed acceptance at the receiving ' +
              'location before transport. If it has not been completed, AEI can send the case ' +
              'information and coordinate with the receiving facility to help complete it.',
          },
          {
            question: 'Can a family member fly with the patient?',
            answer:
              'Usually one companion can travel, subject to the aircraft configuration, weight ' +
              'and balance, and the medical crew’s assessment. Confirm it with our ' +
              'coordinators early, because it affects planning.',
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
            'bed, aligning the insurer, and assembling records, not waiting.',
        ],
      },
      {
        type: 'list',
        heading: 'What is included',
        items: [
          'Assessment of the transport plan that fits the patient’s condition and the route.',
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
          'The current working fleet is two Learjet 31A aircraft. Longer routes may require ' +
            'a technical stop for fuel; our coordinators will tell you if your route does, ' +
            'and what it adds to the timeline.',
        ],
      },
      {
        type: 'list',
        heading: 'Next Steps',
        ordered: true,
        items: [
          'Call (619) 754-6755 or email ops@aeiamericas.com with the patient’s current city and the destination city.',
          'We confirm the route, the timing you need, and who is coordinating on your side.',
          'Our coordinators will identify the records needed for review. Email them to ops@aeiamericas.com or fax them to (619) 330-4551.',
          'Medical and operational review determines the right transport configuration.',
          'We confirm the receiving bed, the plan, and the cost basis before the transport is scheduled.',
          'The transport runs bed-to-bed.',
        ],
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'A receiving facility must accept the patient before a repatriation can be confirmed. AEI can send the case information and coordinate with the receiving facility to help complete the process.',
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
              'medical repatriation; many domestic plans do not cover transport originating ' +
              'abroad. Our team works with your insurer and will tell you plainly what the ' +
              'policy says. We cannot guarantee coverage.',
          },
          {
            question: 'What is the difference between repatriation and an air ambulance transport?',
            answer:
              'Air ambulance describes the transport type: a dedicated, medically configured ' +
              'aircraft. Repatriation describes the purpose: returning a patient home for ' +
              'continued care.',
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
      'in-flight monitoring, coordinated bed-to-bed.',
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
          'Patients under intensive care who need to move between facilities, including ' +
            'ventilated patients, patients on multiple infusions, and patients requiring ' +
            'continuous haemodynamic monitoring, where the sending facility cannot provide ' +
            'the definitive care needed.',
          'These cases almost always come from an ICU physician or a hospital case manager, ' +
            'and they are the cases where early coordination matters most.',
        ],
      },
      {
        type: 'prose',
        heading: 'Medical review',
        paragraphs: [
          'Critical care cases receive a physician-level review before acceptance. That review ' +
            'covers current haemodynamic and respiratory status, ventilator and infusion ' +
            'requirements, altitude physiology, the equipment and drugs required in flight, ' +
            'and the plan at both ends.',
          'The review is a clinical decision made by our medical team in consultation with ' +
            'the sending physician. It is not made by this website, and no part of this site ' +
            'assesses a patient or determines fitness to fly.',
        ],
      },
      {
        type: 'list',
        heading: 'What coordination looks like',
        items: [
          'Bed-to-bed coordination between the sending and receiving facilities, with our medical team engaged where the case warrants it.',
          'Confirmation of the receiving bed and accepting physician before departure.',
          'A case report at both ends, so nothing is lost between teams.',
          'Continuous monitoring appropriate to the patient’s accepted level of care throughout the transport.',
        ],
      },
      {
        type: 'list',
        heading: 'Limits',
        items: [
          'Every case requires medical and operational review before transport can be confirmed.',
          'Confirmed bed acceptance at the receiving location is required before departure.',
          'We do not accept a critical care transport without an accepting physician and a confirmed bed at the receiving facility.',
        ],
      },
    ],
  },
] as const;
