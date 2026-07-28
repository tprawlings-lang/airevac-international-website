import type { PageContent } from '@/content/blocks';

/**
 * For Partners: one page for hospitals, case managers, cruise lines, and
 * maritime callers.
 *
 * Created per the AEI Sample Site Coding Change Handoff (Section 09), which
 * merges the previous Hospitals and Case Managers page with Cruise and
 * Maritime, and deletes Insurance and Assistance Companies outright. The old
 * routes redirect here in one hop.
 *
 * The five-step process and both FAQ answers below are the handoff's exact
 * published copy. Deleted per the handoff and not to be reintroduced:
 *  - any record-submission method other than email on this page
 *  - "Do you handle the insurer authorization?" and its answer
 *  - default language about adding a new point of contact
 *  - any public mention of where insurance authorization runs (internal note)
 */
export const FOR_PARTNERS_PAGE: PageContent = {
  path: '/partners',
  title: 'For Partners',
  description:
    'One referral process for hospitals, case managers, cruise lines, ship medical teams, ' +
    'port agents, and maritime partners, with a direct phone and email path to AEI ' +
    'coordinators.',
  intro:
    'One referral process for hospitals, case managers, cruise lines, and maritime ' +
    'partners. You keep a direct phone and email path to our coordinators, and the caller ' +
    'remains the main point of contact.',
  contentClass: 'medical',
  reviewer: null,
  reviewedOn: null,
  esReviewedOn: null,
  blocks: [
    {
      type: 'list',
      heading: 'Who this page is for',
      items: [
        'Hospitals and case managers.',
        'Cruise lines, ship medical teams, port agents, and maritime partners.',
        'One common referral process for both groups.',
        'A direct phone and email path, without a separate partner intake platform on the public site.',
      ],
    },
    {
      type: 'definitions',
      heading: 'The referral process',
      items: [
        {
          term: '1. Contact AEI',
          detail:
            'Call (619) 754-6755 or email ops@aeiamericas.com. Our coordinators are ' +
            'available 24/7 by phone and email.',
        },
        {
          term: '2. Email the Records',
          detail:
            'Send all case records by email to ops@aeiamericas.com. Our coordinators will ' +
            'confirm receipt and request anything still needed.',
        },
        {
          term: '3. Case Review',
          detail:
            'AEI reviews the information, aircraft availability, transport needs, and the ' +
            'receiving location.',
        },
        {
          term: '4. Acceptance and Financial Clearance',
          detail:
            'Confirm receiving bed acceptance, complete required documents, and complete ' +
            'the applicable insurance or private-pay process.',
        },
        {
          term: '5. Mission Coordination',
          detail:
            'The caller remains the primary point of contact unless another contact is ' +
            'requested. AEI coordinates updates through departure and arrival.',
        },
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
      heading: 'What helps our coordinators review a case quickly',
      items: [
        'A current clinical summary and the sending physician’s report.',
        'Current vital signs, ventilator settings and infusions where applicable, and recent labs and imaging relevant to transport.',
        'Isolation status and any infection-control precautions.',
        'Weight and any mobility or equipment considerations that affect loading.',
        'Discharge readiness and the window in which the patient can be released.',
        'Your point of contact and the hours they are reachable.',
      ],
    },
    {
      type: 'faq',
      heading: 'Common questions from partners',
      items: [
        {
          question: 'Where should I send records?',
          answer:
            'Send all records by email to ops@aeiamericas.com. Our coordinators will ' +
            'confirm receipt and let you know if anything else is needed.',
        },
        {
          question: 'How early should I call?',
          answer:
            'Call as soon as transport is being considered. Once AEI receives the required ' +
            'insurance information, our team can usually determine the insurance path almost ' +
            'immediately.',
        },
      ],
    },
  ],
};
