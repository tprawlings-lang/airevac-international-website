import type { PageContent } from '@/content/blocks';

/**
 * Patient and family pages. Blueprint page 11 template order:
 *   "Calm hero | What happens next | Medical review | Cost and insurance |
 *    Bedside-to-bedside | Rights | FAQ | Contact"
 *
 * Page 7: families need "Reassurance, clarity, speed, cost process" — and
 * critically, they should not have to navigate a business-to-business site to
 * get it.
 *
 * TONE RULE: these pages are read by someone whose relative is in a hospital in
 * another country. They are written plainly, they answer the question that was
 * actually asked, and they never promise something we cannot deliver — because
 * a false reassurance here is the cruellest kind.
 */

export const PATIENT_PAGES: readonly PageContent[] = [
  {
    path: '/patients-families',
    title: 'Patients and Families',
    description:
      'What happens when you arrange a medical transport for a family member: the steps, ' +
      'the medical review, the cost process, and your rights.',
    intro:
      'If someone in your family is in a hospital abroad and needs to come home, this page ' +
      'explains what happens next and what it will take.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'Start here',
        paragraphs: [
          'Call a flight coordinator. You do not need documents, insurance details, or medical ' +
            'records to make that first call — you need to know roughly where the patient is ' +
            'and roughly where you want them to go.',
          'The coordinator will walk you through the rest. Nothing about this process requires ' +
            'you to figure it out alone first.',
        ],
      },
      {
        type: 'list',
        heading: 'What happens next',
        ordered: true,
        items: [
          'You call, or ask us to call you. We take the route and the timing — no medical details on this first contact.',
          'A coordinator opens a protected channel for the patient’s details, medical records, and insurance information.',
          'Our medical team reviews the patient’s condition with the treating physician and decides what kind of transport is appropriate.',
          'We coordinate with a receiving hospital and confirm they will accept the patient.',
          'Our insurance team works with your insurer, or we walk you through the private-pay process.',
          'We confirm the plan, the timing, and the cost basis with you before anything is scheduled.',
          'The transport runs bedside to bedside, and your coordinator keeps you updated.',
        ],
      },
      {
        type: 'prose',
        heading: 'What "bedside to bedside" means',
        paragraphs: [
          'It means the transport starts at the patient’s bed in the sending hospital and ends ' +
            'at their bed in the receiving hospital. Ground ambulances at both ends are part of ' +
            'the transport, not something you arrange separately.',
          'You should not be organising an ambulance in a country you do not live in, in a ' +
            'language you may not speak, while your relative is unwell. That is our job.',
        ],
      },
      {
        type: 'prose',
        heading: 'The medical review',
        paragraphs: [
          'Before any transport is confirmed, our medical team reviews the patient’s condition ' +
            'with the treating physician. They decide whether the patient can safely fly, what ' +
            'medical crew and equipment are needed, and whether a dedicated air ambulance or a ' +
            'medical escort is the right fit.',
          'This review is done by people, not by a form on a website. Nothing you enter on this ' +
            'site decides whether your relative can fly.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'About cost, honestly',
        body:
          'Air medical transport is expensive, and we will not pretend otherwise. What we will ' +
          'do is tell you the cost basis before you commit, work your insurance claim with ' +
          'you, and — if you are uninsured or self-paying — give you a Good Faith Estimate in ' +
          'writing before a scheduled transport. We will not quote a final price on a first ' +
          'phone call, because we would be guessing.',
      },
      {
        type: 'faq',
        heading: 'Questions families ask',
        items: [
          {
            question: 'Can I travel with the patient?',
            answer:
              'Usually one companion can travel, depending on the aircraft configuration and ' +
              'the medical crew’s assessment. Ask your coordinator early, because it affects ' +
              'the planning.',
          },
          {
            question: 'How fast can this happen?',
            answer:
              'It depends on the patient’s condition, whether a receiving hospital has accepted ' +
              'them, airport hours and permits at both ends, and weather. Your coordinator will ' +
              'give you a realistic window and tell you what is driving it. We would rather give ' +
              'you an honest timeline than an encouraging one.',
          },
          {
            question: 'What if we cannot afford it?',
            answer:
              'Tell your coordinator early. There may be insurance benefits you are not aware ' +
              'of, an assistance company attached to a credit card or travel booking, or a ' +
              'clinically appropriate option that costs less than a dedicated aircraft. We would ' +
              'rather have that conversation at the start than after a transport is scheduled.',
          },
          {
            question: 'Do we choose the hospital?',
            answer:
              'Yes — you, the patient, or the referring physician do, with input from the ' +
              'insurer where one is involved. We coordinate with the receiving facility and ' +
              'confirm the bed before departure, but the destination is your decision.',
          },
        ],
      },
    ],
  },

  {
    path: '/patients-families/how-it-works',
    title: 'How It Works',
    description:
      'The six stages of an AirEvac medical transport, from the first call through the ' +
      'handover at the receiving hospital.',
    intro: 'The six stages of a transport, and what happens in each one.',
    contentClass: 'medical',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'definitions',
        heading: 'The six stages',
        items: [
          {
            term: '1. Choose your path',
            detail:
              'Hospital case manager, cruise or maritime team, insurer or assistance company, ' +
              'or patient and family. Each has a different starting point and different ' +
              'documents.',
          },
          {
            term: '2. Contact a coordinator',
            detail:
              'By phone, 24 hours a day, or by requesting a callback. The coordinator opens a ' +
              'case reference so everything that follows is tied together.',
          },
          {
            term: '3. Logistics only',
            detail:
              'Where the patient is, where they need to go, by when, and how to reach you. No ' +
              'patient details are collected at this stage, and none should be sent through ' +
              'this website.',
          },
          {
            term: '4. Secure clinical intake',
            detail:
              'The coordinator opens a protected channel for patient identity, medical records, ' +
              'insurance information, and consent. This is where the sensitive information ' +
              'moves, and it is deliberately separate from the public website.',
          },
          {
            term: '5. Review',
            detail:
              'Medical, flight, receiving-facility, and financial reviews run in parallel. The ' +
              'medical review determines whether and how the patient can be transported.',
          },
          {
            term: '6. Confirm and fly',
            detail:
              'We confirm the plan, the crew, the aircraft, the receiving bed, and the ' +
              'timeline. Then the transport runs, bedside to bedside, with updates through it.',
          },
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Why stage 3 and stage 4 are separate',
        body:
          'The public part of this website deliberately collects as little as possible — a ' +
          'name, a route, a timeframe, and a number to call you back on. Patient details move ' +
          'through a protected channel that a coordinator opens for you. Keeping those two ' +
          'apart is how we keep sensitive information out of a public marketing system.',
      },
    ],
  },

  {
    path: '/patients-families/insurance-and-payment',
    title: 'Insurance and Payment',
    description:
      'How insurance authorization works for air medical transport, what our team handles, ' +
      'and what we will not promise about coverage.',
    intro:
      'How insurance works for air medical transport, what our team does, and what we cannot ' +
      'tell you.',
    contentClass: 'insurance',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'What our team does',
        paragraphs: [
          'We have an in-house insurance team. They contact your insurer or assistance company ' +
            'directly, submit the clinical documentation supporting medical necessity, work the ' +
            'authorization, and follow the claim through to resolution. They also support ' +
            'appeals when a claim is denied.',
          'You do not have to run this yourself, and you should not have to learn how prior ' +
            'authorization works while your relative is in a hospital abroad.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'What we will not tell you',
        body:
          'We will not tell you that your transport is covered, that you will have no ' +
          'out-of-pocket cost, or that an insurer will approve a claim. Those decisions belong ' +
          'to your insurer. Any transport provider who guarantees coverage before your policy ' +
          'has been reviewed and the insurer has responded is telling you something they do ' +
          'not know.',
      },
      {
        type: 'list',
        heading: 'Coverage you might have and not know about',
        items: [
          'A travel insurance policy purchased with the trip, which often includes medical repatriation.',
          'An assistance company attached to a credit card used to book travel.',
          'An employer or membership plan that includes emergency medical evacuation.',
          'A cruise line or tour operator policy purchased at booking.',
          'A domestic health plan with out-of-area or foreign-travel benefits.',
        ],
      },
      {
        type: 'prose',
        heading: 'If you are uninsured or paying privately',
        paragraphs: [
          'Tell your coordinator at the start. You are entitled to a Good Faith Estimate in ' +
            'writing before a scheduled transport, and there may be a clinically appropriate ' +
            'option that costs considerably less than a dedicated aircraft.',
          'Details of the estimate process and your billing rights are on the patient rights ' +
            'page.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            question: 'Will my insurance cover an air ambulance?',
            answer:
              'It depends on the policy, the medical necessity documentation, and often on ' +
              'whether prior authorization was obtained. Our team works this with your insurer. ' +
              'We will tell you what the insurer has actually said, not what we hope they will ' +
              'say.',
          },
          {
            question: 'Do I have to pay before the transport?',
            answer:
              'That depends on whether an insurer or assistance company is authorizing the ' +
              'transport, and on the payment arrangement for your case. Your coordinator will ' +
              'explain the cost basis and the payment terms before anything is scheduled.',
          },
          {
            question: 'What if the claim is denied?',
            answer:
              'Our team supports appeals and can provide the additional documentation insurers ' +
              'often request. A first denial is not always the final answer, but we will be ' +
              'straight with you about the likelihood.',
          },
        ],
      },
    ],
  },

  {
    path: '/patients-families/private-pay',
    title: 'Private Pay',
    description:
      'Arranging an air medical transport without insurance: the estimate process, what ' +
      'drives cost, and what to ask before you commit.',
    intro:
      'Arranging a transport without insurance — what drives the cost, and what you should ' +
      'expect in writing before you commit.',
    contentClass: 'insurance',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'list',
        heading: 'What drives the cost of a transport',
        items: [
          'Distance and routing, including whether the route needs a technical stop for fuel.',
          'The aircraft and medical configuration the patient’s condition requires.',
          'The medical crew level — a critical care crew costs more than a standard transport crew.',
          'Ground ambulance at both ends, which is part of a bedside-to-bedside transport.',
          'Airport fees, overflight and landing permits, and customs handling on international segments.',
          'Timing. A transport that must depart within hours has fewer options than one planned over several days.',
        ],
      },
      {
        type: 'prose',
        heading: 'The estimate process',
        paragraphs: [
          'Once the route and the patient’s clinical requirements are known, we provide a ' +
            'written estimate of the expected cost and what it covers. If you are uninsured or ' +
            'self-paying, you are entitled to a Good Faith Estimate before a scheduled ' +
            'transport.',
          'We will not give you a final number on a first call. At that point we do not know ' +
            'the crew configuration, the routing, or the ground requirements, and a number ' +
            'produced without those is not an estimate — it is a guess that becomes an argument ' +
            'later.',
        ],
      },
      {
        type: 'list',
        heading: 'What to ask any transport provider before you commit',
        items: [
          'Is this quote bedside to bedside, or airport to airport with ground transport billed separately?',
          'What is the aircraft, and what medical crew level is included?',
          'What happens to the price if the patient’s condition changes and a higher crew level is needed?',
          'What happens if weather or a permit delays departure by a day?',
          'Is the operator flying this aircraft the company I am contracting with, or a broker arranging it?',
          'Can I have the estimate in writing before I pay anything?',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Ask us these questions too',
        body:
          'That list is not rhetorical. Ask us the same questions you would ask anyone else, ' +
          'and compare the answers. A provider who is uncomfortable answering them in writing ' +
          'is telling you something useful.',
      },
    ],
  },
] as const;

/**
 * Patient rights and No Surprises Act page.
 *
 * KEPT SEPARATE FROM THE LIST ABOVE because it is the highest-risk page on the
 * site. Blueprint section 12 lists the No Surprises Act as "Applicable to air
 * ambulance billing scenarios", requiring a "Patient-rights notice,
 * out-of-network language, GFE path for uninsured or self-pay, approved dispute
 * information", and D10 ("Current Notice of Privacy Practices and No
 * Surprises/GFE documents") is open.
 *
 * WHAT THIS PAGE DOES AND DOES NOT DO:
 *  - It describes patient rights accurately, from CMS's own public guidance
 *    [S18] [S19], and points to CMS as the authoritative source.
 *  - It does NOT reproduce a statutory notice, invent a dispute-resolution
 *    process, quote a specific dispute deadline, or state AirEvac's own billing
 *    policy. Those require the approved documents from Legal and Billing.
 *  - The page renders a visible "pending approval" state until `reviewer` is
 *    set, so nobody mistakes drafted copy for an approved legal notice.
 */
export const PATIENT_RIGHTS_PAGE: PageContent = {
  path: '/patient-rights',
  title: 'Patient Rights and Cost Information',
  description:
    'Your rights regarding surprise billing for air ambulance services, the Good Faith ' +
    'Estimate process for uninsured and self-pay patients, and how to raise a billing ' +
    'concern with us.',
  intro:
    'Your billing rights, the Good Faith Estimate process, and how to raise a concern about ' +
    'a bill.',
  contentClass: 'legal',
  reviewer: null, // PENDING D10 — Legal and Revenue-cycle sign-off.
  reviewedOn: null,
  esReviewedOn: null,
  blocks: [
    {
      type: 'prose',
      heading: 'Protection from surprise billing for air ambulance services',
      paragraphs: [
        'Federal law provides protections against surprise medical bills, and those ' +
          'protections specifically include air ambulance services. Where the protections ' +
          'apply, you generally cannot be balance-billed by an out-of-network air ambulance ' +
          'provider beyond your in-network cost-sharing amount.',
        'These protections are set by federal rules, not by us. The authoritative explanation ' +
          'of your rights is published by the Centers for Medicare & Medicaid Services, and ' +
          'we link to it below rather than paraphrasing it.',
      ],
    },
    {
      type: 'prose',
      heading: 'Good Faith Estimate for uninsured and self-pay patients',
      paragraphs: [
        'If you are uninsured, or you are insured but choose not to use your insurance for a ' +
          'transport, you have the right to receive a Good Faith Estimate of expected charges ' +
          'in writing before a scheduled service.',
        'Ask your flight coordinator for it. You do not need to know the term or cite the ' +
          'rule — just ask what it will cost and ask for it in writing.',
      ],
    },
    {
      type: 'callout',
      tone: 'info',
      heading: 'If your bill is substantially higher than your estimate',
      body:
        'Federal rules provide a dispute-resolution process for uninsured and self-pay ' +
        'patients when a final bill substantially exceeds the Good Faith Estimate. Contact us ' +
        'first so we can review the bill with you, and see the CMS guidance linked below for ' +
        'the process and the current thresholds and deadlines.',
    },
    {
      type: 'list',
      heading: 'What you can always ask us for',
      items: [
        'A written estimate before a scheduled transport.',
        'An itemised bill.',
        'An explanation of any charge you do not understand.',
        'The status of an insurance claim we are working on your behalf.',
        'Support with an appeal if your insurer denies a claim.',
        'A review of your bill if it does not match what you were told to expect.',
      ],
    },
    {
      type: 'prose',
      heading: 'How to raise a billing concern',
      paragraphs: [
        'Call a flight coordinator and ask for the billing team. Tell us what you were told to ' +
          'expect and what you received. We will review it with you.',
      ],
    },
    {
      type: 'prose',
      heading: 'Authoritative sources',
      paragraphs: [
        'Centers for Medicare & Medicaid Services — "No Surprises: Understand your rights ' +
          'against surprise medical bills", which covers air ambulance protections: ' +
          'cms.gov/newsroom/fact-sheets/no-surprises-understand-your-rights-against-surprise-medical-bills',
        'Centers for Medicare & Medicaid Services — overview of the No Surprises Act rules and ' +
          'Good Faith Estimate requirements: cms.gov/nosurprises/policies-and-resources/overview-of-rules-fact-sheets',
      ],
    },
  ],
};
