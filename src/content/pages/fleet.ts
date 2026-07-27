import type { PageContent } from '@/content/blocks';

/**
 * Fleet sub-pages. Blueprint page 8, "Trust" template: "Fleet, Medical Team and
 * Equipment, Credentials, About, Leadership — Show only verified proof with
 * dates and sources."
 *
 * Both pages describe clinical capability, which page 6 places under the
 * Medical Director's approval: "Medical director, crew, equipment, service-line,
 * pediatric, neonatal, isolation, and specialty claims approved by the
 * responsible clinical owner."
 *
 * No such approval exists yet, so neither page lists specific equipment models,
 * crew certifications, or specialty capabilities. They describe how capability
 * is determined per case — which is accurate, useful, and unfalsifiable in the
 * way an unapproved equipment list is not.
 */

export const FLEET_PAGES: readonly PageContent[] = [
  {
    path: '/fleet/medical-equipment',
    title: 'Medical Equipment',
    description:
      'How the medical equipment for an AirEvac transport is determined, and how to confirm ' +
      'what will be on board for a specific patient.',
    intro:
      'How the equipment for a transport is decided, and how to confirm what will be on board ' +
      'for your patient.',
    contentClass: 'medical',
    reviewer: null, // PENDING: Medical Director approval of specific capability claims.
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'Equipment is configured per case, not per aircraft',
        body:
          'Rather than publish a fixed equipment list, we confirm the configuration for your ' +
          'specific patient during the medical review. A published list would tell you what is ' +
          'usually carried, not what will be on your transport — and for a referring physician, ' +
          'only the second answer is useful.',
      },
      {
        type: 'prose',
        heading: 'How the configuration is decided',
        paragraphs: [
          'During the medical review, our medical team works from the sending physician’s ' +
            'report to determine the monitoring, respiratory support, infusion, and medication ' +
            'requirements for the flight, taking altitude physiology and the flight duration ' +
            'into account.',
          'The aircraft is then configured, and the crew is assigned, to that requirement.',
        ],
      },
      {
        type: 'list',
        heading: 'What a referring physician should confirm with us',
        items: [
          'The monitoring capability required for the patient’s current status.',
          'Ventilator or respiratory support requirements, including specific settings.',
          'Infusion pump requirements and the medications that must run in flight.',
          'Any specialised equipment the patient currently depends on.',
          'Isolation or infection-control requirements.',
          'Weight, mobility, and loading considerations.',
        ],
      },
      {
        type: 'prose',
        heading: 'Ask directly',
        paragraphs: [
          'If you are a physician or case manager and need to confirm a specific capability ' +
            'before referring a patient, call a flight coordinator and ask for the medical ' +
            'team. You will get a direct answer about your patient rather than a brochure.',
        ],
      },
    ],
  },

  {
    path: '/fleet/flight-medical-team',
    title: 'Flight Medical Team',
    description:
      'How AirEvac assigns the medical crew for a transport, and how to confirm the crew ' +
      'configuration for a specific patient.',
    intro: 'How the medical crew for a transport is assigned, and how to confirm it.',
    contentClass: 'medical',
    reviewer: null, // PENDING: Medical Director approval of crew credential claims.
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'Crew credentials are published only once verified',
        body:
          'Specific crew certifications and qualifications are published only after our ' +
          'Medical Director has approved them and each credential has been verified. Until ' +
          'that review is complete, this page describes how crews are assigned rather than ' +
          'listing qualifications we have not evidenced here.',
      },
      {
        type: 'prose',
        heading: 'Accreditation scope',
        paragraphs: [
          'AirEvac International USA holds EURAMI accreditation as a Regional Fixed Wing Air ' +
            'Ambulance with a Critical Care Transports endorsement. The exact scope, holder, ' +
            'expiry, and a link to EURAMI’s own record are on the credentials page — including ' +
            'the standards that accreditation covers.',
        ],
      },
      {
        type: 'prose',
        heading: 'How a crew is assigned',
        paragraphs: [
          'The medical review determines the level of care the patient requires in flight, and ' +
            'the crew is assigned to that level. A critically ill patient requiring continuous ' +
            'monitoring and in-flight intervention is crewed differently from a stable patient ' +
            'returning home after treatment.',
          'That assignment is a clinical decision made per case. It is not determined by the ' +
            'aircraft, by the route, or by anything on this website.',
        ],
      },
      {
        type: 'prose',
        heading: 'Confirming the crew for a specific patient',
        paragraphs: [
          'Referring physicians and case managers can confirm the proposed crew configuration ' +
            'during the medical review, before the transport is accepted. Ask your coordinator ' +
            'to connect you with the medical team.',
        ],
      },
    ],
  },
] as const;
