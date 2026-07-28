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
}

export const PRIORITY_ROUTES: readonly RouteMarket[] = [
  {
    slug: 'cancun',
    name: 'Cancún and the Riviera Maya',
    region: 'mexico',
    airports: ['MMUN (Cancún International)'],
    commonDestinations: 'Florida, Texas, and the patient’s home region in the United States or Canada',
  },
  {
    slug: 'cozumel',
    name: 'Cozumel',
    region: 'mexico',
    airports: ['MMCZ (Cozumel International)', 'MMUN (Cancún International)'],
    commonDestinations: 'Florida and the United States Gulf Coast',
  },
  {
    slug: 'los-cabos',
    name: 'Los Cabos',
    region: 'mexico',
    airports: ['MMSD (Los Cabos International)'],
    commonDestinations: 'California, Arizona, Texas, and the United States West Coast',
  },
  {
    slug: 'puerto-vallarta',
    name: 'Puerto Vallarta',
    region: 'mexico',
    airports: ['MMPR (Licenciado Gustavo Díaz Ordaz International)'],
    commonDestinations: 'California, Texas, and the United States West and Mountain regions',
  },
  {
    slug: 'bahamas',
    name: 'The Bahamas',
    region: 'caribbean',
    airports: ['MYNN (Lynden Pindling International)', 'MYGF (Grand Bahama International)'],
    commonDestinations: 'South Florida receiving hospitals',
  },
  {
    slug: 'dominican-republic',
    name: 'Dominican Republic',
    region: 'caribbean',
    airports: ['MDPC (Punta Cana International)', 'MDSD (Las Américas International)'],
    commonDestinations: 'Florida, the United States Northeast, and Puerto Rico',
  },
  {
    slug: 'jamaica',
    name: 'Jamaica',
    region: 'caribbean',
    airports: ['MKJS (Sangster International)', 'MKJP (Norman Manley International)'],
    commonDestinations: 'Florida and the United States East Coast',
  },
  {
    slug: 'turks-and-caicos',
    name: 'Turks and Caicos',
    region: 'caribbean',
    airports: ['MBPV (Providenciales International)'],
    commonDestinations: 'South Florida receiving hospitals',
  },
  {
    slug: 'cayman-islands',
    name: 'Cayman Islands',
    region: 'caribbean',
    airports: ['MWCR (Owen Roberts International)'],
    commonDestinations: 'Florida receiving hospitals',
  },
  {
    slug: 'belize',
    name: 'Belize',
    region: 'central-america',
    airports: ['MZBZ (Philip S. W. Goldson International)'],
    commonDestinations: 'Florida, Texas, and the United States Gulf Coast',
  },
  {
    slug: 'costa-rica',
    name: 'Costa Rica',
    region: 'central-america',
    airports: ['MROC (Juan Santamaría International)', 'MRLB (Daniel Oduber Quirós International)'],
    commonDestinations: 'Florida, Texas, and the patient’s home region',
  },
  {
    slug: 'honduras',
    name: 'Honduras',
    region: 'central-america',
    airports: ['MHRO (Juan Manuel Gálvez International, Roatán)', 'MHLM (Ramón Villeda Morales International)'],
    commonDestinations: 'Florida, Texas, and the United States Gulf Coast',
  },
] as const;

export const COVERAGE_REGIONS = [
  { slug: 'mexico', name: 'Mexico' },
  { slug: 'caribbean', name: 'Caribbean' },
  { slug: 'central-america', name: 'Central America' },
  { slug: 'united-states', name: 'United States' },
] as const;

export type CoverageRegionSlug = (typeof COVERAGE_REGIONS)[number]['slug'];
