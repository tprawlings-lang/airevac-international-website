import type { PageContent } from '@/content/blocks';

/**
 * Professional referral pages. Blueprint page 11 fixes the block order per
 * template:
 *
 *   Hospital: Professional hero | Fast referral checklist | Secure records path |
 *             Medical scope | Process | Coverage | Referral resources | Contact
 *   Cruise:   Cruise hero | Port response workflow | Passenger transfer steps |
 *             Regional coverage | Documentation | Case communication | Contact
 *   Insurer:  Partner hero | Authorization and documentation | Billing workflow |
 *             Updates | Coverage | Contract inquiry | Contact
 *
 * Ninety percent of current referrals come from cruise lines and hospitals
 * (page 7), so these are the highest-value pages on the site. They are written
 * for someone with a patient in front of them and no time to browse.
 */

export const PARTNER_PAGES: readonly PageContent[] = [
  {
    path: '/partners/hospitals',
    title: 'Hospitals and Case Managers',
    description:
      'Referral checklist, secure records path, and receiving-facility coordination for ' +
      'hospital case managers arranging patient transport from Mexico and the Caribbean.',
    intro:
      'What we need from you, what we handle, and where the clinical handoff happens. Written ' +
      'for a case manager with a patient waiting.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'list',
        heading: 'Fast referral checklist',
        ordered: true,
        items: [
          'Call a flight coordinator. Have the sending facility, the destination city or facility, and the timeframe ready.',
          'Give us logistics only on that first call — we will open a protected channel before any patient information moves.',
          'Tell us whether a receiving facility and accepting physician are already confirmed, or whether you need help finding one.',
          'Tell us who is paying: insurer, assistance company, employer, or private pay. This runs in parallel and does not delay the medical review.',
          'Identify your point of contact and the hours they are reachable, so updates reach a person rather than a voicemail box.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'Where to send records',
        body:
          'Do not send patient records, imaging, face sheets, or insurance cards through this ' +
          'website or by ordinary email. Call a coordinator and we will open a protected ' +
          'channel for the clinical handoff, or use an approved secure fax if that is your ' +
          'facility’s established method.',
      },
      {
        type: 'list',
        heading: 'What we handle',
        items: [
          'Medical review and determination of the appropriate transport type and crew configuration.',
          'Receiving facility coordination and bed confirmation before departure.',
          'Ground ambulance at both ends, so the transport is bedside to bedside.',
          'Flight planning, international permits, customs, and immigration.',
          'Insurer and assistance company documentation, handled by our in-house team.',
          'Status updates to your named contact through the case.',
        ],
      },
      {
        type: 'list',
        heading: 'What we need from the sending facility',
        items: [
          'A current clinical summary and the sending physician’s report.',
          'Current vital signs, ventilator settings and infusions where applicable, and recent labs and imaging relevant to transport.',
          'Isolation status and any infection-control precautions.',
          'Weight and any mobility or equipment considerations that affect loading.',
          'Discharge readiness and the window in which the patient can be released.',
        ],
      },
      {
        type: 'prose',
        heading: 'Medical scope',
        paragraphs: [
          'AirEvac International USA holds EURAMI accreditation as a Regional Fixed Wing Air ' +
            'Ambulance with a Critical Care Transports endorsement. The exact scope and expiry ' +
            'date, with a link to EURAMI’s own record, are on our credentials page.',
          'Acceptance of any individual patient is a clinical decision made by our medical ' +
            'team in consultation with the sending physician.',
        ],
      },
      {
        type: 'prose',
        heading: 'Coverage',
        paragraphs: [
          'Our concentration is Mexico, the Caribbean, and Central America into the United ' +
            'States, operating from a Fort Lauderdale base. Route-specific detail — departure ' +
            'airports, typical receiving corridors, and the factors that drive timing — is on ' +
            'the coverage pages.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions from case managers',
        items: [
          {
            question: 'How early should I call?',
            answer:
              'As soon as transport looks likely, even before discharge planning is settled. ' +
              'The long poles are usually the receiving bed and the insurer authorization, not ' +
              'the aircraft. Calling early lets those run in parallel.',
          },
          {
            question: 'Can you help find a receiving facility?',
            answer:
              'We can coordinate with facilities and support the search, and we confirm the ' +
              'bed and accepting physician before departure. The decision on destination rests ' +
              'with the patient, family, or referring physician.',
          },
          {
            question: 'Do you handle the insurer authorization?',
            answer:
              'Our in-house team works authorization and documentation directly with insurers ' +
              'and assistance companies. We support the claim. The coverage decision is the ' +
              'insurer’s, and we will not tell you a transport is covered before they say so.',
          },
        ],
      },
    ],
  },

  {
    path: '/partners/cruise',
    title: 'Cruise and Maritime',
    description:
      'Port-to-hospital planning and passenger transfer coordination for cruise line and ' +
      'maritime medical teams across Mexico, the Caribbean, and Central America.',
    intro:
      'Disembarkation, port-to-hospital planning, and onward transport for a passenger or ' +
      'crew member who cannot continue the voyage.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'list',
        heading: 'Port response workflow',
        ordered: true,
        items: [
          'Call a flight coordinator as soon as a disembarkation looks likely — ideally while the ship is still en route to the port.',
          'Give us the port, the expected arrival time, and the passenger’s home region. Logistics only at this stage.',
          'We assess airport access, hours, and permit lead times for that port and confirm what is realistic.',
          'A coordinator opens a protected channel for the ship physician’s clinical handoff.',
          'We coordinate the shoreside receiving facility, or the direct port-to-airport transfer if the patient is going straight out.',
          'Ground ambulance meets the ship or the shoreside facility, and the transport runs.',
        ],
      },
      {
        type: 'prose',
        heading: 'Why timing works differently at a port',
        paragraphs: [
          'A cruise case has constraints a hospital case does not. The ship has a departure ' +
            'time. The port has agent and clearance procedures. Many regional airports have ' +
            'limited operating hours and require permit lead time. Shoreside facilities vary ' +
            'considerably in what they can accept.',
          'Calling while the ship is still inbound is worth more than any other single thing ' +
            'you can do, because it lets permits, ground transport, and the receiving facility ' +
            'be arranged before the patient is on the pier.',
        ],
      },
      {
        type: 'list',
        heading: 'Passenger transfer steps',
        items: [
          'Coordination with the ship’s agent and port authority for the shoreside handover.',
          'Ground ambulance from the pier to the shoreside facility or directly to the aircraft.',
          'Shoreside stabilisation coordination where the patient needs it before flying.',
          'Onward air ambulance or commercial medical escort to the patient’s home region.',
          'Coordination with the passenger’s family and, where involved, their travel insurer.',
        ],
      },
      {
        type: 'list',
        heading: 'Documentation we need',
        items: [
          'The ship physician’s clinical summary and current status, through the protected channel.',
          'Passenger identity and travel documents — handled in the protected channel, never on this website.',
          'The passenger’s home city and, where known, their preferred receiving facility.',
          'The insurer or assistance company handling the case, if one is involved.',
          'Your onboard and shoreside points of contact, and how to reach them after the ship sails.',
        ],
      },
      {
        type: 'prose',
        heading: 'Case communication',
        paragraphs: [
          'A named coordinator stays with the case and provides updates to the contact you ' +
            'nominate. Because your medical team may sail before the transport completes, we ' +
            'confirm at handover who continues to receive updates once the ship departs.',
        ],
      },
      {
        type: 'prose',
        heading: 'Regional coverage',
        paragraphs: [
          'We operate throughout the Caribbean, Mexico, and Central America from a Fort ' +
            'Lauderdale base. Port-specific detail is on the coverage pages, including ' +
            'departure airports and the factors that drive timing for each region.',
        ],
      },
    ],
  },

  {
    path: '/partners/insurance',
    title: 'Insurance and Assistance Companies',
    description:
      'Authorization, documentation, billing workflow, and case communication for insurers ' +
      'and assistance companies coordinating air medical transport.',
    intro:
      'How we handle authorization, documentation, and billing, and what you can expect from ' +
      'our case communication.',
    contentClass: 'insurance',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'list',
        heading: 'Authorization and documentation',
        items: [
          'A named contact on our in-house team handles the case from first notification through final documentation.',
          'Clinical documentation supporting medical necessity is supplied through the protected channel, not by email.',
          'We provide the transport plan, aircraft and crew configuration, and route detail needed for your authorization file.',
          'We confirm what has been authorized in writing, and we do not proceed on a verbal assurance alone unless you instruct us to.',
        ],
      },
      {
        type: 'list',
        heading: 'Billing workflow',
        items: [
          'Documentation is assembled during the case rather than reconstructed afterwards, which shortens the claim cycle for both of us.',
          'Itemised billing referencing the authorized transport plan.',
          'A single point of contact for claim questions, appeals support, and additional documentation requests.',
          'Where a patient has out-of-pocket exposure, we tell the patient what we know — we do not leave them to discover it from a bill.',
        ],
      },
      {
        type: 'prose',
        heading: 'Case updates',
        paragraphs: [
          'You receive updates at the points that matter to a claim file: acceptance after ' +
            'medical review, receiving-facility confirmation, departure, arrival, and handover ' +
            'at the receiving facility. If a case changes materially — a delay, a routing ' +
            'change, a change in the patient’s status affecting the transport — you hear it ' +
            'from us rather than from the member.',
        ],
      },
      {
        type: 'prose',
        heading: 'Coverage',
        paragraphs: [
          'Mexico, the Caribbean, Central America, and the United States, operating from a ' +
            'Fort Lauderdale base with Learjet 31A aircraft. Regional detail is on the ' +
            'coverage pages.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Contract and network inquiries',
        body:
          'For preferred-provider arrangements, rate agreements, or network participation, ' +
          'call a flight coordinator and ask for the commercial team. Contract discussions are ' +
          'handled directly rather than through a web form.',
      },
    ],
  },
] as const;
