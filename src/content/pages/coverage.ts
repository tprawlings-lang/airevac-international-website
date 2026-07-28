import type { Block } from '@/content/blocks';
import { PRIORITY_ROUTES, type CoverageRegionSlug, type RouteMarket } from '@/content/navigation';

/**
 * Coverage content. Blueprint page 11 fixes the template order:
 *   "Route context | Common origin points | Receiving coordination | Documents |
 *    Timing factors | Cost factors | Related routes | Contact"
 *
 * Page 8, the rule that governs whether a page should exist at all:
 *   "Do not build thin pages for every state, city, airport, island, or
 *    diagnosis. Each indexable page must add local or audience-specific utility."
 *
 * The generator below composes each route page from the operational specifics in
 * `PRIORITY_ROUTES` - real departure airports, real receiving corridors, and the
 * factors that actually drive timing in that region. A route with nothing
 * specific to say produces a thin page, which is the signal to remove it from
 * `PRIORITY_ROUTES` rather than publish it.
 *
 * NO OPERATING-AUTHORITY CLAIMS APPEAR HERE. D6 (state licences and marketed-base
 * authority) is open, so these pages describe process and logistics only. They
 * never assert that AirEvac is licensed to operate in a given jurisdiction.
 */

export interface RegionContent {
  slug: CoverageRegionSlug;
  name: string;
  title: string;
  description: string;
  intro: string;
  blocks: Block[];
}

export const REGION_CONTENT: readonly RegionContent[] = [
  {
    slug: 'mexico',
    name: 'Mexico',
    title: 'Air Ambulance from Mexico',
    description:
      'Medical transport from Mexico to the United States: common departure airports, ' +
      'receiving coordination, documentation, and the factors that drive timing.',
    intro:
      'Mexico is our highest-volume origin. Most cases are resort-area hospitalisations and ' +
      'cruise disembarkations returning to the United States or Canada.',
    blocks: [
      {
        type: 'prose',
        heading: 'Route context',
        paragraphs: [
          'Most Mexican transports we coordinate originate in a resort region (the Yucatán ' +
            'peninsula, Los Cabos, or Puerto Vallarta) where a visitor has been hospitalised ' +
            'and needs to return home for continued care.',
          'The clinical picture is usually clear by the time we are called. The variables that ' +
            'determine the timeline are documentation, the receiving bed, and the airport.',
        ],
      },
      {
        type: 'list',
        heading: 'Documents that affect timing',
        items: [
          'The patient’s passport or travel document, and the accompanying family member’s.',
          'The sending hospital’s clinical summary and discharge readiness.',
          'Payment or insurance clearance at the sending facility, which in Mexico frequently must be settled before discharge.',
          'Customs and immigration handling for the departure, which we arrange.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'The hospital bill is often the critical path',
        body:
          'In Mexico, private hospitals commonly require the account to be settled before ' +
          'they will discharge a patient. That step, not the aircraft, is what most often ' +
          'delays a transport. Raise it with our coordinators on the first call so it can be ' +
          'worked in parallel with everything else.',
      },
      {
        type: 'list',
        heading: 'What drives cost on Mexican routes',
        items: [
          'Distance to the receiving facility. A Cancún to Florida transport is a very different route from Los Cabos to the United States West Coast.',
          'The medical crew level the patient’s condition requires.',
          'Ground ambulance at both ends.',
          'Airport fees, permits, and customs handling.',
          'How quickly the transport must depart.',
        ],
      },
    ],
  },

  {
    slug: 'caribbean',
    name: 'Caribbean',
    title: 'Air Ambulance from the Caribbean',
    description:
      'Medical transport from Caribbean islands to Florida and the United States: island ' +
      'departure points, receiving coordination, and timing factors.',
    intro:
      'Short routes, close receiving hospitals, and airport operating hours that often ' +
      'determine the schedule more than anything clinical.',
    blocks: [
      {
        type: 'prose',
        heading: 'Route context',
        paragraphs: [
          'Caribbean transports are usually short. Most islands are within a few hours of ' +
            'South Florida, and our Fort Lauderdale base sits at the receiving end of that ' +
            'corridor.',
          'The constraint is rarely distance. It is island airport operating hours, permit ' +
            'lead times, and the capability of the sending facility.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Airport hours matter more than distance here',
        body:
          'Several regional Caribbean airports are not open 24 hours and require prior ' +
          'permission or a callout for an after-hours departure. A ninety-minute flight can ' +
          'still mean an overnight wait if the airport is closed. Your coordinator will tell ' +
          'you which constraint applies to your island.',
      },
      {
        type: 'list',
        heading: 'Receiving coordination',
        items: [
          'South Florida receives the majority of Caribbean transports, and our base is positioned for it.',
          'We confirm the receiving hospital and accepting physician before departure.',
          'Ground ambulance meets the aircraft at both ends.',
          'Where the patient’s home is elsewhere in the United States, we plan the onward routing as part of the same case.',
        ],
      },
      {
        type: 'list',
        heading: 'What drives cost on Caribbean routes',
        items: [
          'The medical crew level required.',
          'After-hours airport callout fees, where a departure cannot wait for normal operating hours.',
          'Ground ambulance at both ends.',
          'Landing, handling, and permit fees, which vary considerably between islands.',
        ],
      },
    ],
  },

  {
    slug: 'central-america',
    name: 'Central America',
    title: 'Air Ambulance from Central America',
    description:
      'Medical transport from Belize, Costa Rica, Honduras, and the wider region to the ' +
      'United States, including routing and permit considerations.',
    intro:
      'Longer routes than the Caribbean, more variable receiving facilities, and permit lead ' +
      'times that reward calling early.',
    blocks: [
      {
        type: 'prose',
        heading: 'Route context',
        paragraphs: [
          'Central American transports cover a wider range of distances and a wider range of ' +
            'sending-facility capability than our Caribbean work. A patient in San José has ' +
            'different options from one on Roatán.',
          'Routing sometimes requires a technical stop for fuel. Where it does, your ' +
            'coordinator will tell you and explain what it adds to the timeline.',
        ],
      },
      {
        type: 'list',
        heading: 'Timing factors',
        items: [
          'Overflight and landing permits, which have lead times that vary by country.',
          'Airport operating hours at smaller regional fields.',
          'Whether the sending facility can stabilise the patient for the flight duration.',
          'Whether the route requires a fuel stop.',
          'Customs and immigration handling at departure.',
        ],
      },
      {
        type: 'list',
        heading: 'What drives cost on Central American routes',
        items: [
          'Distance and whether a technical stop is required.',
          'Permit and handling fees, which vary by country.',
          'The medical crew level required.',
          'Ground ambulance at both ends, including transfers from remote or island locations.',
        ],
      },
    ],
  },

  {
    slug: 'united-states',
    name: 'United States',
    title: 'Air Ambulance within the United States',
    description:
      'Domestic medical transport and the receiving end of international repatriations, ' +
      'coordinated from our Fort Lauderdale base.',
    intro:
      'Domestic transports, and the receiving end of the international cases that make up ' +
      'most of our work.',
    blocks: [
      {
        type: 'prose',
        heading: 'Route context',
        paragraphs: [
          'Most of our United States activity is the receiving end of an international ' +
            'repatriation: a patient coming home from Mexico, the Caribbean, or Central ' +
            'America to a hospital near their family.',
          'We also coordinate domestic transports where a patient needs to move between ' +
            'facilities for specialist care.',
        ],
      },
      {
        type: 'list',
        heading: 'Receiving coordination',
        items: [
          'Confirmation of the receiving hospital and the accepting physician before departure.',
          'Ground ambulance from the arrival airport to the receiving facility.',
          'A case report at the receiving facility.',
          'Coordination with the family on arrival timing, so someone can be there.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        heading: 'Choosing the receiving hospital',
        body:
          'The destination is the patient’s, the family’s, or the referring physician’s ' +
          'decision, with input from the insurer where one is involved. We coordinate with the ' +
          'facility and confirm the bed, but we do not choose it for you, and you should be ' +
          'cautious of any provider who wants to.',
      },
    ],
  },
] as const;

export function findRegion(slug: string): RegionContent | undefined {
  return REGION_CONTENT.find((region) => region.slug === slug);
}

export function routesInRegion(slug: CoverageRegionSlug): RouteMarket[] {
  return PRIORITY_ROUTES.filter((route) => route.region === slug);
}

export function findRoute(region: string, slug: string): RouteMarket | undefined {
  return PRIORITY_ROUTES.find((route) => route.region === region && route.slug === slug);
}

/**
 * Composes a route page from its operational specifics.
 *
 * Written as a generator rather than 12 hand-written pages so that the *shape*
 * of every route page is identical and the *content* is necessarily specific -
 * a route with no distinct airports or receiving corridor cannot produce a page
 * that looks complete, which is exactly the signal page 8 asks for.
 */
export function buildRouteBlocks(route: RouteMarket, regionName: string): Block[] {
  return [
    {
      type: 'prose',
      heading: 'Route context',
      paragraphs: [
        `Transports from ${route.name} typically move patients to ${route.commonDestinations}.`,
        'Every case is planned individually. The notes below describe what usually drives the ' +
          'timeline on this route. Our coordinators will tell you which of them apply to your ' +
          'case.',
      ],
    },
    {
      type: 'list',
      heading: 'Departure airports we use',
      items: route.airports,
    },
    {
      type: 'list',
      heading: 'What we coordinate',
      items: [
        'Ground ambulance from the sending facility to the aircraft.',
        'Medical review with the treating physician before the transport is confirmed.',
        'Receiving facility coordination and bed confirmation before departure.',
        'Customs, immigration, and permit handling for the international segment.',
        'Ground ambulance from the arrival airport to the receiving hospital.',
      ],
    },
    {
      type: 'list',
      heading: 'What affects timing on this route',
      items: [
        'Whether the receiving hospital has accepted the patient.',
        'Airport operating hours and permit lead times at the departure field.',
        'Discharge readiness at the sending facility, including any account settlement it requires.',
        'The patient’s clinical stability for the flight duration.',
        'Weather, which in this region is seasonal and can move a departure by hours.',
      ],
    },
    {
      type: 'callout',
      tone: 'info',
      heading: 'Call before the details are settled',
      body:
        'You do not need records, insurance information, or a confirmed receiving hospital to ' +
        'make the first call. Those are the things we help you work through. Calling early ' +
        'lets the slow items, the receiving bed and the financial clearance, run in ' +
        'parallel instead of in sequence.',
    },
    {
      type: 'prose',
      heading: `More on ${regionName}`,
      paragraphs: [
        `The ${regionName} coverage page covers documentation, receiving coordination, and ` +
          'the cost factors that apply across the region.',
      ],
    },
  ];
}
