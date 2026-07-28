import type { Dictionary } from '@/content/dictionary';

/**
 * Sitemap. Blueprint section 3:
 *   "The navigation should make professional referral paths visible without
 *    burying patient and family support."
 *
 * Order is the blueprint's own top-level order. `For Partners` sits second
 * because ninety percent of current referrals come from cruise lines and
 * hospitals (page 7), and `Patients and Families` sits immediately after it so
 * family support is one item away rather than buried in a footer.
 *
 * Paths are canonical English slugs and are NOT translated - see
 * `localePath` in src/lib/i18n.ts for why.
 */

export interface NavLink {
  href: string;
  label: string;
  /**
   * Set when the destination exists but its content is blocked on an open
   * decision. Rendered with a "in review" state rather than a dead link, so a
   * referrer never lands on an empty page.
   */
  pending?: string;
}

export interface NavGroup {
  label: string;
  /** Landing page for the group, when it has one. */
  href?: string;
  links: NavLink[];
}

export function buildNavigation(dictionary: Dictionary): NavGroup[] {
  const { nav } = dictionary;

  return [
    {
      label: nav.services,
      href: '/services',
      links: [
        { href: '/services/air-ambulance', label: 'Air Ambulance' },
        { href: '/services/medical-repatriation', label: 'Medical Repatriation' },
        { href: '/services/critical-care-transport', label: 'Critical Care Transport' },
      ],
    },
    {
      /*
       * One top-level For Partners item, per the AEI handoff (Section 03):
       * hospitals, case managers, cruise lines, and maritime callers share a
       * single merged page. No child links: an empty `links` array renders the
       * group as a direct link in the header, mobile menu, and footer.
       */
      label: nav.partners,
      href: '/partners',
      links: [],
    },
    {
      label: nav.patientsFamilies,
      href: '/patients-families',
      links: [
        { href: '/patients-families/how-it-works', label: 'How It Works' },
        { href: '/patients-families/insurance-and-payment', label: 'Insurance and Payment' },
        { href: '/patients-families/private-pay', label: 'Private Pay' },
      ],
    },
    {
      label: nav.coverage,
      href: '/coverage',
      links: [
        { href: '/coverage/mexico', label: 'Mexico' },
        { href: '/coverage/caribbean', label: 'Caribbean' },
        { href: '/coverage/central-america', label: 'Central America' },
        { href: '/coverage/united-states', label: 'United States' },
        { href: '/coverage/other-destinations', label: 'Other Destinations' },
      ],
    },
    {
      label: nav.fleetSafety,
      href: '/fleet',
      links: [
        { href: '/fleet', label: 'Learjet 31A Fleet' },
        { href: '/fleet/flight-medical-team', label: 'Flight Medical Team' },
        { href: '/credentials', label: 'Credentials and Licenses' },
      ],
    },
    {
      label: nav.about,
      href: '/about',
      links: [
        { href: '/about', label: 'Company' },
        { href: '/about/leadership', label: 'Leadership' },
        { href: '/about/why-airevac', label: 'Why AirEvac' },
        { href: '/about/mission-stories', label: 'Mission Stories' },
        { href: '/contact', label: 'Contact' },
      ],
    },
  ];
}

/**
 * Governance pages. Section 12 requires these to exist and be reachable; they
 * live in the footer rather than the primary nav so they do not compete with the
 * urgent contact paths.
 */
export function buildLegalNavigation(): NavLink[] {
  // Patient Rights and Cost Info is removed from the public site per the AEI
  // handoff (Section 14); its copy is archived pending the billing and legal
  // decision on required notices.
  return [
    { href: '/legal/privacy', label: 'Privacy Notice' },
    { href: '/legal/notice-of-privacy-practices', label: 'Notice of Privacy Practices' },
    { href: '/legal/terms', label: 'Terms of Use' },
    { href: '/legal/accessibility', label: 'Accessibility Statement' },
    { href: '/legal/cookie-settings', label: 'Cookie Settings' },
  ];
}

/**
 * Priority route pages, blueprint page 8.
 *
 * "Do not build thin pages for every state, city, airport, island, or diagnosis.
 *  Each indexable page must add local or audience-specific utility."
 *
 * Each entry therefore carries the operational specifics that justify it as an
 * indexable page. A route with no distinct operational content should be removed
 * from this list rather than published thin.
 */
export interface RouteMarket {
  slug: string;
  name: string;
  region: 'mexico' | 'caribbean' | 'central-america';
  /** Primary departure airports coordinators actually use. */
  airports: string[];
  /** Typical receiving corridor. */
  commonDestinations: string;

  /*
   * The three detail sets below are what make each route page worth indexing
   * rather than a template with the place name swapped in. They describe how
   * transports from this specific place tend to run: the road and airport
   * realities, the hospital and discharge picture, and the paperwork that
   * moves the timeline.
   *
   * RULES FOR THIS CONTENT (enforced by tests/content-governance.test.ts):
   *  - Describe tendencies, never commitments. "Usually", "commonly", "often".
   *  - No operating-authority claim in any jurisdiction, no named partner or
   *    receiving hospital relationship, no price, no response time.
   *  - Geography, distance, and travel time are the differentiators. They are
   *    verifiable, they genuinely differ per route, and they are the questions
   *    a family or case manager actually asks.
   *
   * DRAFTED FROM GENERAL REGIONAL KNOWLEDGE. AEI operations must confirm each
   * set before launch; tracked in docs/handoff-completion-report.md.
   */

  /** Ground transfer and airport handoff realities on this route. */
  groundAndAirport: string[];
  /** Hospital, discharge, and account-settlement realities. */
  hospitalAndDischarge: string[];
  /** Documents and border paperwork that affect the timeline. */
  documentsAndBorder: string[];
}

export const PRIORITY_ROUTES: readonly RouteMarket[] = [
  {
    slug: 'cancun',
    name: 'Cancún and the Riviera Maya',
    region: 'mexico',
    airports: ['MMUN (Cancún International)'],
    commonDestinations: 'Florida, Texas, and the patient’s home region in the United States or Canada',
    groundAndAirport: [
      'MMUN is the departure field for the whole corridor, including patients treated in Playa del Carmen and Tulum.',
      'Road time to the airport is the variable most people underestimate. Cancún hotel zone is usually under an hour; Playa del Carmen is commonly around an hour; Tulum often runs closer to two.',
      'Highway 307 traffic and construction can add to all three, so our coordinators plan the ground leg against the aircraft slot rather than the other way around.',
      'MMUN is a large international field with full ground handling, which usually makes the ramp handoff itself one of the faster parts of the day.',
    ],
    hospitalAndDischarge: [
      'Visitors are usually stabilized at private hospitals in Cancún or Playa del Carmen rather than at public facilities.',
      'Private hospitals in Mexico commonly require the account to be settled before they will discharge a patient. On this route that step, not the aircraft, is the most frequent cause of delay.',
      'Where a travel insurer or assistance company is involved, the hospital typically wants written confirmation of payment from the insurer before it will release the patient.',
      'Our coordinators can work the receiving bed and the discharge account in parallel, which is why calling early matters more here than almost anywhere else we fly.',
    ],
    documentsAndBorder: [
      'The sending hospital issues a medical summary and discharge paperwork. Requesting it early is usually worthwhile, because it is prepared during business hours.',
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'A lost, stolen, or hospital-held passport is often the single longest item on this route, because a replacement or emergency travel document has to come from the consulate.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'cozumel',
    name: 'Cozumel',
    region: 'mexico',
    airports: ['MMCZ (Cozumel International)', 'MMUN (Cancún International)'],
    commonDestinations: 'Florida and the United States Gulf Coast',
    groundAndAirport: [
      'Cozumel is an island, so the passenger ferry that most visitors know is generally not an option for a patient on a stretcher or on oxygen.',
      'MMCZ sits close to the town center, so ground time from the island hospitals to the aircraft is usually short.',
      'Departing directly from MMCZ normally avoids a mainland transfer altogether, which is the main reason it is the preferred field for island cases.',
      'MMUN is used when aircraft, timing, or the receiving plan makes the mainland the better departure point.',
    ],
    hospitalAndDischarge: [
      'On-island critical care capacity is limited compared with Cancún, so patients are sometimes moved to the mainland or flown out earlier in their course than they would be elsewhere.',
      'Diving is a common injury pattern here, and decompression cases are usually treated on the island before any flight is considered.',
      'Altitude restrictions after a decompression illness are a real constraint on this route, and the treating physician sets them, not us.',
      'Private hospital accounts commonly need to be settled before discharge, as elsewhere in Mexico.',
    ],
    documentsAndBorder: [
      'Cruise passengers are usually traveling on a ship-held document set, so the ship or the port agent has to release it before departure.',
      'The ship medical record is frequently the most useful clinical document available, and getting it early speeds the medical review.',
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'los-cabos',
    name: 'Los Cabos',
    region: 'mexico',
    airports: ['MMSD (Los Cabos International)'],
    commonDestinations: 'California, Arizona, Texas, and the United States West Coast',
    groundAndAirport: [
      'MMSD sits north of San José del Cabo, so the ground leg from the Cabo San Lucas end of the corridor is commonly the longer part of the day.',
      'The resort corridor between the two towns is a single highway, and traffic on it is the main thing that moves the ground estimate.',
      'MMSD is a full international field with established ground handling, so the ramp handoff is usually straightforward.',
      'Patients treated at the East Cape or further north may have a substantially longer road transfer, which our coordinators plan for explicitly.',
    ],
    hospitalAndDischarge: [
      'Visitors are usually treated at private hospitals in San José del Cabo or Cabo San Lucas.',
      'Private hospitals in Mexico commonly require the account to be settled before discharge, and that step is a frequent cause of delay here.',
      'Complex cases are sometimes moved to a larger mainland Mexican center before an international flight is arranged, depending on what the treating physician advises.',
      'Where an insurer is involved, the hospital typically wants written confirmation of payment from the insurer before releasing the patient.',
    ],
    documentsAndBorder: [
      'Most patients on this route are traveling to the United States West Coast, and entry requires valid travel documents for the patient and any accompanying family member.',
      'A lost or hospital-held passport usually has to be replaced through the consulate, which is often the longest single item on the timeline.',
      'The sending hospital issues the medical summary and discharge paperwork; requesting it early is generally worthwhile.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'puerto-vallarta',
    name: 'Puerto Vallarta',
    region: 'mexico',
    airports: ['MMPR (Licenciado Gustavo Díaz Ordaz International)'],
    commonDestinations: 'California, Texas, and the United States West and Mountain regions',
    groundAndAirport: [
      'MMPR is close to the city, so ground time from the Puerto Vallarta hospitals is usually short.',
      'Patients treated in Nuevo Vallarta, Bucerías, or Punta de Mita are across the state line to the north, and that road leg commonly adds time.',
      'The airport handles regular international traffic and has established ground handling, so the ramp handoff is normally quick.',
      'Our coordinators confirm the ground ambulance against the aircraft slot, because the road time varies more than the flight does.',
    ],
    hospitalAndDischarge: [
      'Visitors are usually stabilized at private hospitals in Puerto Vallarta or Nuevo Vallarta.',
      'Private hospital accounts commonly need to be settled before discharge, which is the most frequent delay on Mexican routes.',
      'Where a travel insurer or assistance company is involved, the hospital typically wants written confirmation of payment from the insurer first.',
      'Our coordinators can work the receiving bed and the discharge account at the same time rather than in sequence.',
    ],
    documentsAndBorder: [
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'A lost, stolen, or hospital-held passport usually requires a consular replacement, which is often the longest item on the timeline.',
      'The sending hospital issues the medical summary and discharge paperwork, prepared during business hours.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'bahamas',
    name: 'The Bahamas',
    region: 'caribbean',
    airports: ['MYNN (Lynden Pindling International)', 'MYGF (Grand Bahama International)'],
    commonDestinations: 'South Florida receiving hospitals',
    groundAndAirport: [
      'This is one of the shortest international transports we run, and the flight itself is commonly a small part of the total time.',
      'MYNN serves New Providence and Nassau; MYGF serves Grand Bahama and Freeport.',
      'Patients on the Family Islands usually need a first leg to Nassau or Freeport before the international departure, and that leg often sets the schedule.',
      'Ground time from the Nassau hospitals to MYNN is normally short.',
    ],
    hospitalAndDischarge: [
      'Critical care capacity is concentrated in Nassau, so patients from the Family Islands are frequently moved there first.',
      'Because South Florida is close, patients are sometimes transferred earlier in their course than they would be from a more distant location.',
      'The receiving hospital in Florida still has to accept the patient before departure, and that acceptance is usually the gating item on this route.',
      'Hospital accounts and any deposit requirements are settled before discharge, as they are elsewhere in the region.',
    ],
    documentsAndBorder: [
      'United States entry requires valid travel documents for the patient and any accompanying family member.',
      'Cruise passengers are often traveling on a ship-held document set, which the ship or port agent has to release.',
      'The sending facility issues the medical summary; the ship medical record serves the same purpose for cruise cases.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'dominican-republic',
    name: 'Dominican Republic',
    region: 'caribbean',
    airports: ['MDPC (Punta Cana International)', 'MDSD (Las Américas International)', 'MDPP (Gregorio Luperón International)'],
    commonDestinations: 'Florida, the United States Northeast, and Puerto Rico',
    groundAndAirport: [
      'The country is served by three fields on this route, and choosing between them is usually a road-time decision rather than an aircraft one.',
      'MDPC is close to the Punta Cana and Bávaro resort corridor, so ground time there is normally short.',
      'MDSD serves Santo Domingo, where the larger tertiary hospitals are. The road between the capital and the eastern resorts commonly runs a couple of hours or more.',
      'MDPP serves the north coast, including Puerto Plata, Sosúa, and Cabarete, which are a long road transfer from either of the other two fields.',
    ],
    hospitalAndDischarge: [
      'Resort-area hospitals stabilize patients, and the larger tertiary centers are generally in Santo Domingo.',
      'A patient may therefore be moved within the country before an international flight, and that internal leg is often the part that sets the schedule.',
      'Private hospitals commonly require the account settled, or written confirmation of payment from the insurer, before discharge.',
      'Our coordinators work the receiving bed and the discharge account in parallel wherever the hospital allows it.',
    ],
    documentsAndBorder: [
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'A lost or hospital-held passport usually requires a consular replacement, which is frequently the longest single item.',
      'Cruise passengers are often traveling on a ship-held document set that the ship or port agent has to release.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'jamaica',
    name: 'Jamaica',
    region: 'caribbean',
    airports: ['MKJS (Sangster International)', 'MKJP (Norman Manley International)'],
    commonDestinations: 'Florida and the United States East Coast',
    groundAndAirport: [
      'MKJS at Montego Bay serves the north coast resort corridor, including Negril, Falmouth, and Ocho Rios.',
      'MKJP at Kingston serves the capital and the south of the island.',
      'The cross-island road transfer between the two is long, commonly several hours, so the departure field is usually chosen to avoid it.',
      'Where the patient is already in Kingston for tertiary care, departing from MKJP normally saves more time than repositioning the aircraft costs.',
    ],
    hospitalAndDischarge: [
      'The larger tertiary hospitals are concentrated around Kingston, while most visitor injuries happen on the north coast.',
      'Patients are therefore sometimes moved across the island before an international flight, and that internal transfer often sets the timeline.',
      'The receiving hospital in the United States has to accept the patient before departure.',
      'Hospital accounts and any deposit requirements are settled before discharge.',
    ],
    documentsAndBorder: [
      'United States entry requires valid travel documents for the patient and any accompanying family member.',
      'Cruise passengers calling at Falmouth or Ocho Rios are often traveling on a ship-held document set that the ship or port agent has to release.',
      'The sending facility issues the medical summary and discharge paperwork.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'turks-and-caicos',
    name: 'Turks and Caicos',
    region: 'caribbean',
    airports: ['MBPV (Providenciales International)'],
    commonDestinations: 'South Florida receiving hospitals',
    groundAndAirport: [
      'Providenciales is the practical departure point for the territory, and ground time from the island facilities to MBPV is normally short.',
      'The flight to South Florida is short, so the ground and clearance steps commonly account for most of the elapsed time.',
      'Patients on the smaller islands usually need a first leg to Providenciales before the international departure.',
      'Airport operating hours and permit lead times are worth confirming early, because they can set the departure slot on a small field.',
    ],
    hospitalAndDischarge: [
      'On-island critical care capacity is limited, so patients needing sustained intensive care are frequently transferred off-island earlier than they would be from a larger center.',
      'Diving and watersports injuries are a common pattern here, and altitude restrictions after decompression illness are set by the treating physician.',
      'The receiving hospital in Florida has to accept the patient before departure, and that acceptance is usually the gating item.',
      'Hospital accounts and any deposit requirements are settled before discharge.',
    ],
    documentsAndBorder: [
      'United States entry requires valid travel documents for the patient and any accompanying family member.',
      'The sending facility issues the medical summary and discharge paperwork.',
      'Cruise passengers are often traveling on a ship-held document set that the ship or port agent has to release.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'cayman-islands',
    name: 'Cayman Islands',
    region: 'caribbean',
    airports: ['MWCR (Owen Roberts International)'],
    commonDestinations: 'Florida receiving hospitals',
    groundAndAirport: [
      'MWCR is close to George Town, so ground time from the Grand Cayman hospitals is usually short.',
      'The flight to Florida is short, which means the clearance and ground steps commonly dominate the timeline.',
      'Patients on Cayman Brac or Little Cayman generally need a first leg to Grand Cayman before the international departure.',
      'Cruise calls at George Town are tendered rather than docked, so a patient coming off a ship may need the tender arranged before anything else can start.',
    ],
    hospitalAndDischarge: [
      'Grand Cayman has more on-island tertiary capacity than most of the region, and some patients are treated locally rather than transferred at all.',
      'Where a transfer is appropriate, the short hop to Florida means the decision is often driven by the family or the insurer rather than by distance.',
      'Diving injuries are a common pattern, and altitude restrictions after decompression illness are set by the treating physician.',
      'The receiving hospital has to accept the patient before departure, and hospital accounts are settled before discharge.',
    ],
    documentsAndBorder: [
      'United States entry requires valid travel documents for the patient and any accompanying family member.',
      'Cruise passengers are often traveling on a ship-held document set that the ship or port agent has to release.',
      'The sending facility issues the medical summary and discharge paperwork.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'belize',
    name: 'Belize',
    region: 'central-america',
    airports: ['MZBZ (Philip S. W. Goldson International)'],
    commonDestinations: 'Florida, Texas, and the United States Gulf Coast',
    groundAndAirport: [
      'MZBZ near Belize City is the international departure field for the country.',
      'Patients on Ambergris Caye, Caye Caulker, or the southern cayes usually need a first leg by boat or light aircraft, and that leg commonly sets the schedule.',
      'Inland patients, including those injured at the western resorts or the Maya sites, face a road transfer that can run several hours.',
      'Airport operating hours and permit lead times are confirmed early, because they can determine the departure slot.',
    ],
    hospitalAndDischarge: [
      'Critical care capacity is concentrated in Belize City, so patients are frequently moved there before an international transport.',
      'Diving injuries are a recognized pattern on the cayes and the reef, and altitude restrictions after decompression illness are set by the treating physician.',
      'Where an insurer is involved, the hospital typically wants written confirmation of payment before discharge.',
      'The receiving hospital in the United States has to accept the patient before departure.',
    ],
    documentsAndBorder: [
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'Belize applies departure requirements to travelers, and our coordinators confirm what applies to the patient before the day of the flight.',
      'The sending facility issues the medical summary and discharge paperwork.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'costa-rica',
    name: 'Costa Rica',
    region: 'central-america',
    airports: ['MROC (Juan Santamaría International)', 'MRLB (Daniel Oduber Quirós International)'],
    commonDestinations: 'Florida, Texas, and the patient’s home region',
    groundAndAirport: [
      'MROC serves the Central Valley and San José, where the larger private hospitals are, and ground time from them is usually short.',
      'MRLB at Liberia serves the Guanacaste coast, including Tamarindo, Papagayo, and the northern beach towns.',
      'The road between Guanacaste and San José commonly runs four hours or more, so the departure field is normally chosen to avoid that transfer.',
      'Patients injured on the Pacific coast south of Jacó or on the Caribbean side may face a long road leg to either field, which our coordinators plan explicitly.',
    ],
    hospitalAndDischarge: [
      'Costa Rica has substantial private hospital capacity in the Central Valley, and visitors are usually treated there rather than transferred immediately.',
      'Patients stabilized on the coast are frequently moved to San José first, and that internal transfer often sets the timeline.',
      'Private hospitals commonly require the account settled, or written confirmation of payment from the insurer, before discharge.',
      'The receiving hospital has to accept the patient before departure.',
    ],
    documentsAndBorder: [
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'A lost or hospital-held passport usually requires a consular replacement, which is frequently the longest single item.',
      'The sending hospital issues the medical summary and discharge paperwork, prepared during business hours.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
  {
    slug: 'honduras',
    name: 'Honduras',
    region: 'central-america',
    airports: ['MHRO (Juan Manuel Gálvez International, Roatán)', 'MHLM (Ramón Villeda Morales International)'],
    commonDestinations: 'Florida, Texas, and the United States Gulf Coast',
    groundAndAirport: [
      'MHRO on Roatán serves the Bay Islands, where most visitor cases originate.',
      'MHLM at San Pedro Sula serves the mainland and has the larger hospital capacity.',
      'Roatán is an island, so a mainland transfer means a flight rather than a road leg, and that step commonly sets the schedule.',
      'Ground time on Roatán from the West End and West Bay dive areas to MHRO is normally short.',
    ],
    hospitalAndDischarge: [
      'Roatán is a major dive destination, and decompression illness is a recognized pattern there. Hyperbaric treatment is available on the island and is generally completed before any flight is considered.',
      'Altitude restrictions after decompression illness are set by the treating physician, not by us, and they can delay a transport by days rather than hours.',
      'Sustained critical care capacity is greater on the mainland, so patients are sometimes moved to San Pedro Sula before an international flight.',
      'Hospital accounts and any deposit requirements are settled before discharge, and written confirmation from the insurer is commonly required first.',
    ],
    documentsAndBorder: [
      'The patient and any accompanying family member need valid travel documents for entry to the destination country.',
      'Cruise passengers calling at Roatán are often traveling on a ship-held document set that the ship or port agent has to release.',
      'The sending facility issues the medical summary; the ship medical record serves the same purpose for cruise cases.',
      'Customs, immigration, and the international flight permits are handled by our coordinators as part of the transport.',
    ],
  },
] as const;

export const COVERAGE_REGIONS = [
  { slug: 'mexico', name: 'Mexico' },
  { slug: 'caribbean', name: 'Caribbean' },
  { slug: 'central-america', name: 'Central America' },
  { slug: 'united-states', name: 'United States' },
] as const;

export type CoverageRegionSlug = (typeof COVERAGE_REGIONS)[number]['slug'];
