import type { PageContent } from '@/content/blocks';

/**
 * Governance pages. Blueprint section 12.
 *
 * THE FINDING THIS REPLACES (page 18):
 *   "The existing policy is a generic WordPress policy. It discusses comments,
 *    Gravatar, WordPress logins, indefinite comment retention, and the
 *    Scottsdale address. It does not explain the actual secure intake, live
 *    chat, analytics, claims, rights, vendors, retention, or Fort Lauderdale
 *    contact model. It cannot be copied into the new site without a full
 *    rewrite and legal approval."
 *
 * The privacy notice below is therefore written from the actual implementation
 * in this repository - the fields the form accepts, what the endpoint logs, what
 * it does not store, and which vendors are and are not connected. It describes
 * the system as built, which is the only kind of privacy notice that is true.
 *
 * ALL OF THESE PAGES CARRY `reviewer: null` UNTIL LEGAL SIGNS OFF (D10).
 * They render with a visible "pending approval" state. A drafted privacy notice
 * is not an approved privacy notice, and the page says so rather than implying
 * otherwise.
 */

export const LEGAL_PAGES: readonly PageContent[] = [
  {
    path: '/legal/privacy',
    title: 'Website Privacy Notice',
    description:
      'What this website collects, what it deliberately does not collect, how long it is ' +
      'kept, who it is shared with, and how to exercise your privacy rights.',
    intro:
      'What this website collects, what it deliberately does not collect, and what happens ' +
      'to it.',
    contentClass: 'legal',
    reviewer: null, // PENDING D10.
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Scope of this notice',
        paragraphs: [
          'This notice covers this public website only. It does not cover records you ' +
            'send directly to our coordinators by email or fax; those are governed ' +
            'separately, and where they involve protected health information they are ' +
            'covered by our Notice of Privacy Practices.',
          'The distinction matters, because this website is deliberately built so that ' +
            'protected health information never reaches it. The website does not proxy, ' +
            'parse, store, or log records sent by email or fax.',
        ],
      },
      {
        type: 'list',
        heading: 'What the callback form collects',
        items: [
          'Your name.',
          'Your organization or facility, if you give one.',
          'Whether you are contacting us as a hospital, cruise or maritime team, insurer, or patient and family.',
          'The origin city or facility and the destination city or facility.',
          'The timeframe you need.',
          'A phone number, and an email address if you give one.',
          'Your preferred language.',
          'Your consent for a coordinator to contact you at that number.',
          'An optional short logistics note.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'What this website refuses to collect',
        body:
          'The callback form does not have fields for patient name, date of birth, diagnosis, ' +
          'symptoms, medical record number, insurance ID, passport number, payment card ' +
          'details, or file uploads. The server rejects a submission containing any of them ' +
          'and does not store it. This is enforced in code, not by policy alone.',
      },
      {
        type: 'prose',
        heading: 'How your callback request is handled',
        paragraphs: [
          'When you submit the form, the server validates it against a fixed list of allowed ' +
            'fields, issues a reference number, and records that reference so that a repeated ' +
            'submission does not create a duplicate case.',
          'The server’s logs record the reference number, your stated role, the timeframe, and ' +
            'your preferred language. They do not record your name, phone number, email ' +
            'address, organization, the cities involved, or your note.',
        ],
      },
      {
        type: 'list',
        heading: 'What this website does not do',
        items: [
          'It does not run advertising trackers, retargeting pixels, or tag managers.',
          'It does not use session replay or record your interactions with the page.',
          'It does not build a profile of you, and it does not create medical-interest audiences.',
          'It does not send anything you enter to an advertising platform.',
          'It does not accept payment card details anywhere.',
          'It does not set advertising or profiling cookies.',
        ],
      },
      {
        type: 'prose',
        heading: 'Cookies and measurement',
        paragraphs: [
          'This website does not currently set analytics or advertising cookies. Where ' +
            'aggregate measurement is used on public information pages, it is limited to page ' +
            'views, referrer category, page performance, and broad geography, with no ' +
            'identifier tied to you.',
          'No measurement of any kind runs on the callback form or on any page carrying ' +
            'sensitive information.',
        ],
      },
      {
        type: 'prose',
        heading: 'Who your information is shared with',
        paragraphs: [
          'Your callback request is used by AirEvac flight coordinators to contact you about ' +
            'your transport request. It is not sold, and it is not used for advertising.',
          'Where a vendor processes information on our behalf, they are bound by contract to ' +
            'use it only for that purpose. Where a vendor could handle protected health ' +
            'information, a Business Associate Agreement is required before they are connected.',
        ],
      },
      {
        type: 'list',
        heading: 'How long information is kept',
        items: [
          'An abandoned callback request or chat session is deleted or de-identified after 30 days, unless it is linked to a case, a fraud review, or a legal hold.',
          'A request that becomes a case is transferred to the system of record, and the duplicate website copy is removed.',
          'Aggregate marketing measurement is retained in aggregate form; raw event and IP data is kept no longer than 30 days.',
          'Security logs are searchable for one year, with longer retention where a specific legal requirement applies.',
        ],
      },
      {
        type: 'prose',
        heading: 'Text messages and calls',
        paragraphs: [
          'We contact you at the number you provide only about the transport request you ' +
            'submitted. Message and data rates may apply. You can reply STOP to any text ' +
            'message to opt out, or tell our coordinators you prefer not to be texted.',
        ],
      },
      {
        type: 'prose',
        heading: 'Your rights and how to exercise them',
        paragraphs: [
          'Depending on where you live, you may have the right to access, correct, or delete ' +
            'the information we hold about you, and to object to certain uses of it.',
          'To make a request, call a flight coordinator and ask for the privacy contact. ' +
            'Include your reference number if you have one, because it lets us find your record ' +
            'without asking you for more personal information than necessary.',
        ],
      },
      {
        type: 'prose',
        heading: 'Changes to this notice',
        paragraphs: [
          'When this notice changes materially, the revised version is published here with a ' +
            'new review date.',
        ],
      },
    ],
  },

  {
    path: '/legal/notice-of-privacy-practices',
    title: 'Notice of Privacy Practices',
    description:
      'How AirEvac International uses and discloses protected health information, and your ' +
      'rights regarding that information.',
    intro:
      'How protected health information is used and disclosed, and what rights you have over ' +
      'it.',
    contentClass: 'legal',
    reviewer: null, // PENDING D10: required before this page can publish.
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'callout',
        tone: 'info',
        heading: 'This notice is being prepared',
        body:
          'A HIPAA Notice of Privacy Practices must be issued and approved by the covered ' +
          'entity, not drafted by a website. Our approved notice will be published here and ' +
          'provided in the manner required. To request a copy in the meantime, or to ask a ' +
          'question about how patient information is handled, call a flight coordinator and ' +
          'ask for the privacy contact.',
      },
      {
        type: 'prose',
        heading: 'What this notice will cover',
        paragraphs: [
          'How protected health information is used for treatment, payment, and health care ' +
            'operations; the disclosures permitted or required by law; your rights to access, ' +
            'amend, and receive an accounting of disclosures; how to file a complaint; and the ' +
            'contact for privacy questions.',
        ],
      },
      {
        type: 'prose',
        heading: 'In the meantime',
        paragraphs: [
          'The website privacy notice describes what this public website collects and, more ' +
            'importantly, what it deliberately does not. Protected health information does not ' +
            'move through this website at all. Records go directly to our coordinators by ' +
            'email at ops@aeiamericas.com or by fax at (619) 330-4551.',
        ],
      },
    ],
  },

  {
    path: '/legal/terms',
    title: 'Terms of Use',
    description: 'The terms that apply to your use of the AirEvac International website.',
    intro: 'The terms that apply to your use of this website.',
    contentClass: 'legal',
    reviewer: null, // PENDING D10.
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'This website is information, not medical advice',
        paragraphs: [
          'Everything on this website is general information about air medical transport. It ' +
            'is not medical advice, it is not a clinical assessment, and it does not establish ' +
            'a treating relationship.',
          'Whether a particular patient can be transported, and how, is a clinical decision ' +
            'made by our medical team together with the treating physician. Nothing on this ' +
            'site makes that decision or should be relied on as though it had.',
        ],
      },
      {
        type: 'prose',
        heading: 'This website does not create a transport agreement',
        paragraphs: [
          'Submitting a callback request does not book a transport, reserve an aircraft, or ' +
            'create a contract. A transport exists when a coordinator confirms it with you ' +
            'directly and the terms for your case are agreed.',
        ],
      },
      {
        type: 'prose',
        heading: 'No guarantee of coverage or price',
        paragraphs: [
          'Nothing on this website guarantees that an insurer will cover a transport, or ' +
            'establishes a final price. Coverage decisions belong to your insurer. Pricing ' +
            'depends on the route, the clinical requirements, and the operational factors for ' +
            'your specific case.',
        ],
      },
      {
        type: 'prose',
        heading: 'Emergencies',
        paragraphs: [
          'This website is not an emergency service. If there is an immediate emergency where ' +
            'the patient is, call local emergency services first.',
        ],
      },
      {
        type: 'list',
        heading: 'Acceptable use',
        items: [
          'Do not submit medical, insurance, identification, or payment information through this website. It is not a secure clinical channel.',
          'Do not attempt to gain unauthorised access to any part of this site or its supporting systems.',
          'Do not use automated tools to submit requests, scrape content, or place load on the contact paths that urgent cases depend on.',
        ],
      },
      {
        type: 'prose',
        heading: 'Content and accuracy',
        paragraphs: [
          'Credentials, accreditations, and aircraft information published on this site are ' +
            'shown with their scope, holder, and expiry date, and with a link to the issuer’s ' +
            'own record where one exists. If you believe something on this site is inaccurate, ' +
            'tell us: call a flight coordinator and ask for the compliance contact.',
        ],
      },
    ],
  },

  {
    path: '/legal/accessibility',
    title: 'Accessibility Statement',
    description:
      'Our accessibility target for this website, what has been tested, known limitations, ' +
      'and how to report a barrier.',
    intro:
      'What we are aiming for, what has been tested, what has not, and how to tell us about ' +
      'a barrier.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Our target',
        paragraphs: [
          'This website targets conformance with the Web Content Accessibility Guidelines ' +
            '(WCAG) 2.2 at Level AA.',
          'The people who use this site are often under stress, sometimes on a phone in a ' +
            'hospital corridor, and sometimes using a screen reader or significant zoom. An ' +
            'accessible site is not a compliance exercise here; it is the difference between ' +
            'reaching a coordinator and not.',
        ],
      },
      {
        type: 'list',
        heading: 'What has been built for',
        items: [
          'Every page works with a keyboard alone, with a visible focus indicator that is never removed or obscured.',
          'A skip link is the first focusable element on every page.',
          'Text can be zoomed to 200% and beyond without loss of content or function. Zoom is not capped.',
          'Colour is never the only way information is conveyed, and text meets AA contrast ratios.',
          'Form fields have real labels, errors are announced, and the error summary receives focus so a screen-reader user is told what went wrong.',
          'The mobile call bar reserves its own space so it never covers the content or the focused element beneath it.',
          'Navigation and the FAQ work without JavaScript.',
          'Motion is reduced automatically when your system requests it.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'What has not been verified yet',
        body:
          'A full independent audit, including manual screen-reader testing across browser ' +
          'and assistive-technology combinations, has not yet been completed for this site. ' +
          'Until it has, this statement describes what the site was built to do rather than ' +
          'what has been independently confirmed. We would rather tell you that than claim a ' +
          'conformance we have not tested.',
      },
      {
        type: 'prose',
        heading: 'Report a barrier',
        paragraphs: [
          'If any part of this site is difficult or impossible for you to use, call a flight ' +
            'coordinator. You will reach a person, and you do not need to explain the technical ' +
            'detail. Just tell us what you were trying to do.',
          'The phone line is always available as an alternative to anything on this website.',
        ],
      },
    ],
  },

  {
    path: '/legal/cookie-settings',
    title: 'Cookie Settings',
    description: 'What cookies this website sets, and what it deliberately does not set.',
    intro: 'What this website stores in your browser, and what it does not.',
    contentClass: 'general',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'There is nothing to configure here yet',
        paragraphs: [
          'This website does not currently set advertising cookies, analytics cookies, or ' +
            'profiling cookies, so there is no consent choice to offer you. A cookie banner ' +
            'that asks permission for something that does not happen would be theatre.',
          'If that changes, this page becomes the control for it, and the choice will be a ' +
            'real one, including the ability to decline non-essential cookies without losing ' +
            'access to any part of the site.',
        ],
      },
      {
        type: 'list',
        heading: 'What is stored in your browser today',
        items: [
          'Nothing required for advertising or profiling.',
          'No third-party cookies. This site loads no third-party scripts.',
          'Your language choice is expressed in the page address you are on, not stored as a tracking cookie.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'On the pages that matter most',
        body:
          'No measurement, tag manager, or advertising code runs on the callback form or any ' +
          'page carrying sensitive information, regardless of any setting on this page. That ' +
          'is not a preference; it is a rule the site is built around.',
      },
    ],
  },
] as const;
