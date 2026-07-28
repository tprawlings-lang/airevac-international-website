import type { PageContent } from '@/content/blocks';

/**
 * Fleet sub-pages.
 *
 * The equipment page is removed per the AEI handoff (Section 14):
 * its route 301s to Critical Care Transport, and general capability copy stays
 * on approved service pages only. Only the Flight Medical Team page remains.
 *
 * Both pages describe clinical capability, which page 6 places under the
 * Medical Director's approval: "Medical director, crew, equipment, service-line,
 * pediatric, neonatal, isolation, and specialty claims approved by the
 * responsible clinical owner."
 *
 * No such approval exists yet, so neither page lists specific equipment models,
 * crew certifications, or specialty capabilities. They describe how capability
 * is determined per case - which is accurate, useful, and unfalsifiable in the
 * way an unapproved equipment list is not.
 */

export const FLEET_PAGES: readonly PageContent[] = [
  {
    path: '/fleet/flight-medical-team',
    title: 'Flight Medical Team',
    description:
      'How AirEvac assigns the medical crew for a transport, and how to confirm the crew ' +
      'configuration for a specific patient.',
    intro: 'How the medical crew for a transport is assigned, and how to confirm it.',
    contentClass: 'medical',
    reviewer: null,
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
            'during the medical review, before the transport is accepted. Ask our coordinators ' +
            'to connect you with the medical team: call (619) 754-6755 or email ' +
            'ops@aeiamericas.com.',
        ],
      },
    ],
  },
] as const;
