import type { PageContent } from '@/content/blocks';

/**
 * Patient and family pages.
 *
 * Updated per the AEI Sample Site Coding Change Handoff (2026-07-27):
 *  - How It Works: the old Step 1 (choosing a path) is deleted and the steps
 *    renumbered; the clinical intake step now directs records to email or fax;
 *    the documents-and-financial-clearance step is added before confirmation.
 *  - Insurance and Payment: I-01 removes only the out-of-pocket portion of the
 *    "what we will not tell you" callout; I-02/I-03 remove the employer,
 *    membership, and domestic-plan coverage items; I-05 removes the
 *    denied-claim question entirely.
 *  - Private Pay: the crew-level and delay bullets are removed, Good Faith
 *    Estimate content is removed, and the Price Lock Guarantee is published
 *    with the handoff's exact copy. The guarantee carries a production
 *    approval gate (pricing and legal owners).
 *  - Patient Rights and Cost Info is removed from the public site. The copy is
 *    archived at docs/archive/patient-rights-and-cost-info.md pending AEI's
 *    billing and legal decision on where required notices appear before launch.
 *
 * TONE RULE unchanged: these pages are read by someone whose relative is in a
 * hospital in another country. Plain language, no promise we cannot keep.
 */

export const PATIENT_PAGES: readonly PageContent[] = [
  {
    path: '/patients-families',
    title: 'Patients and Families',
    description:
      'What happens when you arrange a medical transport for a family member: the steps, ' +
      'the medical review, and the cost process.',
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
          'Call (619) 754-6755 or email ops@aeiamericas.com. You do not need documents, ' +
            'insurance details, or medical records to make that first contact. You need to ' +
            'know roughly where the patient is and roughly where you want them to go.',
          'Our coordinators will walk you through the rest. Nothing about this process ' +
            'requires you to figure it out alone first.',
        ],
      },
      {
        type: 'list',
        heading: 'What happens next',
        ordered: true,
        items: [
          'You call or email us, or ask us to call you. We take the route and the timing.',
          'Our coordinators identify the records needed. Email them to ops@aeiamericas.com or fax them to (619) 330-4551.',
          'Our medical team reviews the patient’s condition with the treating physician and decides what kind of transport is appropriate.',
          'We coordinate with a receiving hospital. Every patient must have confirmed bed acceptance at the receiving location before transport.',
          'Our insurance team works with your insurer, or we walk you through the private-pay process.',
          'You sign the required documents. Private-pay cases complete payment before transport; insurance cases proceed through AEI’s approved billing process.',
          'The transport runs bed-to-bed, and our coordinators keep you updated.',
        ],
      },
      {
        type: 'prose',
        heading: 'What "bed-to-bed" means',
        paragraphs: [
          'It means the transport starts at the patient’s bed in the sending hospital and ends ' +
            'at their bed in the receiving hospital. Ground ambulances at both ends are part of ' +
            'the transport, not something you arrange separately.',
          'You should not be organizing an ambulance in a country you do not live in, in a ' +
            'language you may not speak, while your relative is unwell. That is our job.',
        ],
      },
      {
        type: 'prose',
        heading: 'The medical review',
        paragraphs: [
          'Before any transport is confirmed, our medical team reviews the patient’s condition ' +
            'with the treating physician. They decide whether the patient can safely fly and ' +
            'what medical crew and equipment are needed.',
          'This review is done by people, not by a form on a website. Nothing you enter on this ' +
            'site decides whether your relative can fly.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'About cost, honestly',
        body:
          'Air medical transport is expensive, and we will not pretend otherwise. What we ' +
          'will do is tell you the cost basis before you commit and work your insurance ' +
          'claim with you. We will not quote a final price on a first phone call, because we ' +
          'would be guessing.',
      },
      {
        type: 'faq',
        heading: 'Questions families ask',
        items: [
          {
            question: 'Can I travel with the patient?',
            answer:
              'Usually one companion can travel, depending on the aircraft configuration and ' +
              'the medical crew’s assessment. Ask our coordinators early, because it affects ' +
              'the planning.',
          },
          {
            question: 'How fast can this happen?',
            answer:
              'It depends on the patient’s condition, confirmed bed acceptance at the ' +
              'receiving hospital, financial clearance, airport hours and permits at both ' +
              'ends, and weather. Our coordinators will give you a realistic window and tell ' +
              'you what is driving it.',
          },
          {
            question: 'What if we cannot afford it?',
            answer:
              'Tell our coordinators early. There may be insurance benefits you are not aware ' +
              'of, an assistance company attached to a credit card or travel booking, or a ' +
              'clinically appropriate option that costs less than a dedicated aircraft. We ' +
              'would rather have that conversation at the start than after a transport is ' +
              'scheduled.',
          },
          {
            question: 'Do we choose the hospital?',
            answer:
              'Yes. You, the patient, or the referring physician do, with input from the ' +
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
      'The stages of an AirEvac medical transport, from the first call or email through ' +
      'the arrival at the receiving hospital.',
    intro: 'The stages of a transport, and what happens in each one.',
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
            term: '1. Contact a coordinator',
            detail:
              'Call (619) 754-6755 or email ops@aeiamericas.com. Our coordinators are ' +
              'available 24/7 by phone and email, and open a case reference so everything ' +
              'that follows is tied together.',
          },
          {
            term: '2. Share the transport logistics',
            detail:
              'Where the patient is, where they need to go, by when, and how to reach you. ' +
              'No patient details are needed at this stage.',
          },
          {
            term: '3. Email or fax the case documents',
            detail:
              'Our coordinators will identify the records needed for review. Email them to ' +
              'ops@aeiamericas.com or fax them to (619) 330-4551. Our coordinators will ' +
              'confirm receipt and request anything still needed.',
          },
          {
            term: '4. Case review',
            detail:
              'Medical, flight, receiving-facility, and financial reviews run in parallel. ' +
              'The medical review determines whether and how the patient can be transported, ' +
              'and confirmed bed acceptance at the receiving location is required.',
          },
          {
            term: '5. Complete documents and financial clearance',
            detail:
              'Sign the required documents. Private-pay cases complete payment before ' +
              'transport. Insurance cases proceed through AEI’s approved billing process.',
          },
          {
            term: '6. Confirm and fly',
            detail:
              'We confirm the plan, the crew, the aircraft, the receiving bed, and the ' +
              'timeline. Then the transport runs, bed-to-bed, with updates through it.',
          },
        ],
      },
    ],
  },

  {
    path: '/patients-families/insurance-and-payment',
    title: 'Insurance and Payment',
    description:
      'How insurance works for air medical transport, what our team handles, and what we ' +
      'cannot promise about coverage.',
    intro:
      'How insurance works for air medical transport, what our team does, and what we ' +
      'cannot tell you.',
    contentClass: 'insurance',
    reviewer: null,
    reviewedOn: null,
    esReviewedOn: null,
    blocks: [
      {
        type: 'prose',
        heading: 'What our team does',
        paragraphs: [
          'We have an in-house insurance team. They contact your insurer or assistance ' +
            'company directly, submit the clinical documentation supporting medical ' +
            'necessity, and follow the claim through to resolution.',
          'You do not have to run this yourself, and you should not have to learn how ' +
            'insurance review works while your relative is in a hospital abroad.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        heading: 'What we will not tell you',
        body:
          'We will not tell you that your transport is covered or that an insurer will ' +
          'approve a claim. Those decisions belong to your insurer. We cannot guarantee ' +
          'insurance payment, and any transport provider who guarantees coverage before ' +
          'your policy has been reviewed and the insurer has responded is telling you ' +
          'something they do not know.',
      },
      {
        type: 'list',
        heading: 'Coverage you might have and not know about',
        items: [
          'A travel insurance policy purchased with the trip, which often includes medical repatriation.',
          'An assistance company attached to a credit card used to book travel.',
          'A cruise line or tour operator policy purchased at booking.',
        ],
      },
      {
        type: 'prose',
        heading: 'If you are uninsured or paying privately',
        paragraphs: [
          'Tell our coordinators at the start. Private-pay cases complete payment before ' +
            'transport, and the private pay page explains the estimate process and the ' +
            'Price Lock Guarantee.',
        ],
      },
      {
        type: 'faq',
        heading: 'Common questions',
        items: [
          {
            question: 'Will my insurance cover an air ambulance?',
            answer:
              'It depends on the policy and the medical necessity documentation. Our team ' +
              'works this with your insurer. We will tell you what the insurer has actually ' +
              'said, not what we hope they will say.',
          },
          {
            question: 'Do I have to pay before the transport?',
            answer:
              'Private-pay cases complete payment before transport. Insurance cases proceed ' +
              'through AEI’s approved billing process. Our coordinators will explain the ' +
              'cost basis and the payment terms before anything is scheduled.',
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
      'drives cost, and the Price Lock Guarantee.',
    intro:
      'Arranging a transport without insurance, what drives the cost, and what you should ' +
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
          'The aircraft and medical equipment the patient’s condition requires.',
          'Ground ambulance at both ends, which is part of a bed-to-bed transport.',
          'Airport fees, overflight and landing permits, and customs handling on international segments.',
          'Timing. A transport that must depart within hours has fewer options than one planned over several days.',
        ],
      },
      {
        type: 'prose',
        heading: 'The estimate process',
        paragraphs: [
          'Once the route and the patient’s clinical requirements are known, we provide a ' +
            'written estimate of the expected cost and what it covers.',
          'We will not give you a final number on a first call. At that point we do not know ' +
            'the crew configuration, the routing, or the ground requirements, and a number ' +
            'produced without those is not an estimate. It is a guess that becomes an ' +
            'argument later.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Price Lock Guarantee',
        body:
          'After AEI confirms the transport plan and receives any required private payment, ' +
          'the accepted price is locked. A price change may occur only if a material change ' +
          'in the patient’s medical condition requires a different transport plan or ' +
          'additional medical resources.',
      },
      {
        type: 'list',
        heading: 'What to ask any transport provider before you commit',
        items: [
          'Is this quote bed-to-bed, or airport to airport with ground transport billed separately?',
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
