import type { PageContent } from '@/content/blocks';

/**
 * Trust pages. Blueprint page 8: "Show only verified proof with dates and
 * sources."
 *
 * Leadership and Mission Stories are the two pages most likely to breach the
 * launch rule, because both are naturally written from unverified material:
 * biographies with unconfirmed credentials, and case stories with patient
 * detail. Page 10 is explicit - "Do not publish patient faces, clinical details,
 * documents, tail numbers, routes, or dates in stories without approved
 * authorization and operations review" - and page 11 requires a case story to
 * carry an authorization ID, a de-identification status, a revocation field, and
 * a publishing approval.
 *
 * Neither exists yet (D12), so both pages ship as honest empty states.
 */

export const ABOUT_PAGES: readonly PageContent[] = [
  {
    path: '/about',
    title: 'About AirEvac International',
    description:
      'Who AirEvac International is, where we operate from, and how we work with hospitals, ' +
      'cruise lines, insurers, and families.',
    intro:
      'An air medical transport company operating from Fort Lauderdale, concentrated on ' +
      'Mexico, the Caribbean, and Central America.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'What we do',
        paragraphs: [
          'We coordinate air medical transport for patients moving between Mexico, the ' +
            'Caribbean, Central America, and the United States. Most of our cases come from ' +
            'hospital case managers and cruise line medical teams; the rest come from insurers, ' +
            'assistance companies, and families.',
          'We operate from a hangar at Fort Lauderdale Executive Airport, which puts us close ' +
            'to the routes we fly most.',
        ],
      },
      {
        type: 'prose',
        heading: 'Coordination without a broker in between',
        paragraphs: [
          'When you call, you reach a flight coordinator who works the case, not a call ' +
            'center that passes your request to whoever answers next. That matters most in the ' +
            'first hour, when the questions are operational and the answers determine the ' +
            'timeline.',
        ],
      },
      {
        type: 'prose',
        heading: 'What we publish, and what we do not',
        paragraphs: [
          'Every credential, accreditation, and aircraft claim on this site is shown with its ' +
            'exact scope, the holder, the expiry date, and a link to the issuer’s own record ' +
            'where one exists. If we do not hold current documentation for something, it is not ' +
            'on this site, including things we may well be entitled to say.',
          'You can verify what we publish without asking us. That is the point.',
        ],
      },
    ],
  },

  {
    path: '/about/why-airevac',
    title: 'Why AirEvac',
    description:
      'What distinguishes AirEvac International: regional concentration, direct coordination, ' +
      'in-house insurance support, and verifiable claims.',
    intro: 'Four things that are actually true, rather than four things that sound good.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      // Opening answer, AI Search Coding Handoff section 6. The page used to
      // begin with the comparison list itself, which answered nothing until
      // the reader had worked through all four items.
      {
        type: 'prose',
        paragraphs: [
          'AirEvac International coordinates air ambulance transport from Mexico, the ' +
            'Caribbean, and Central America into the United States, from a base at Fort ' +
            'Lauderdale Executive Airport. Four things distinguish us: we concentrate on ' +
            'one region instead of claiming the world, you speak to the coordinator ' +
            'working your case rather than to a broker, our own team handles insurance ' +
            'authorization and billing, and we publish a credential only when we can ' +
            'evidence it.',
          'Each of those is checkable, which is the point. The sections below explain ' +
            'what each one means in practice.',
        ],
      },
      {
        type: 'definitions',
        heading: 'What sets us apart',
        items: [
          {
            term: 'Regional concentration',
            detail:
              'We concentrate on Mexico, the Caribbean, and Central America into the United ' +
              'States rather than claiming worldwide coverage. Knowing which regional airports ' +
              'have limited hours, where permits take time, and which shoreside facilities can ' +
              'accept a patient is knowledge you only get from flying the same region ' +
              'repeatedly.',
          },
          {
            term: 'Direct coordination',
            detail:
              'You speak to a flight coordinator who works your case. There is no broker layer ' +
              'between the person you are talking to and the operation.',
          },
          {
            term: 'In-house insurance support',
            detail:
              'Our own team works the authorization and the claim with your insurer, including ' +
              'appeals. You are not handed a bill and left to argue it alone.',
          },
          {
            term: 'Claims you can verify',
            detail:
              'Our credentials are published with their exact scope, holder, and expiry date, ' +
              'linked to the issuer’s own record. Anything we cannot evidence is absent from ' +
              'this site rather than phrased vaguely.',
          },
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'What we do not claim',
        body:
          'We do not claim global coverage, a guaranteed response time, or that your insurer ' +
          'will pay. Response times depend on your route, permits, and weather. Coverage is ' +
          'your insurer’s decision. A provider who promises either on a first call is telling ' +
          'you what you want to hear.',
      },
    ],
  },

  {
    path: '/about/leadership',
    title: 'Leadership',
    description: 'The medical, operational, and commercial leadership of AirEvac International.',
    intro: 'The people accountable for our medical, operational, and commercial decisions.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'This page is being prepared',
        body:
          'Leadership biographies are published only once each person’s role, licences, and ' +
          'qualifications have been confirmed and each individual has approved their own ' +
          'listing. Publishing an unverified clinical credential would breach the same standard ' +
          'we apply to every other claim on this site. To reach a specific member of our team, ' +
          'call a flight coordinator.',
      },
    ],
  },

  {
    path: '/about/mission-stories',
    title: 'Mission Stories',
    description:
      'Authorized accounts of transports AirEvac International has coordinated, published ' +
      'with permission and with patient details removed.',
    intro: 'Accounts of transports we have coordinated, published only with permission.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'No stories are published yet',
        body:
          'A mission story is published only when we hold written authorization, the account ' +
          'has been de-identified, and our medical and operations teams have approved the ' +
          'wording. We do not publish patient faces, clinical details, documents, tail numbers, ' +
          'routes, or dates without that authorization, and we would rather have an empty page ' +
          'than a story that identifies someone.',
      },
      {
        type: 'prose',
        heading: 'If you would like to share your experience',
        paragraphs: [
          'Patients, families, and referring teams sometimes ask to tell their story. If that ' +
            'is you, call a flight coordinator and ask for the marketing contact. We will walk ' +
            'you through what publishing would involve, what would be removed, and how you can ' +
            'withdraw permission later.',
        ],
      },
    ],
  },
] as const;
