/**
 * Airport data for the coverage map.
 *
 * Updated per the AEI change handoff (Section 05):
 *  - Every displayed label is a four-letter ICAO code (G-02); the base displays
 *    as KFXE, and no three-letter IATA code appears on the map.
 *  - The Los Cabos and Puerto Vallarta markers are removed.
 *  - MHRO (Roatán) is labelled and MDPP (Puerto Plata) is added.
 *  - The frame extends east so Puerto Rico, the Lesser Antilles, and the
 *    Dominican Republic are not cropped.
 *
 * Coordinates are the published airport reference points, rounded to three
 * decimals. The map remains a projection of real geography: a prettier layout
 * that put airports in the wrong place would be a misleading coverage claim.
 *
 * WHAT THIS MAP ASSERTS: where the priority route pages are, and where the
 * operating base is. It does NOT assert operating authority in any
 * jurisdiction (open decision D6), and the caption says so.
 */

export interface MappedAirport {
  /** Four-letter ICAO code. The only code format displayed (G-02). */
  code: string;
  name: string;
  lat: number;
  lon: number;
  /** Matches a slug in PRIORITY_ROUTES, where the map should link. */
  routeSlug?: string;
  region: 'base' | 'mexico' | 'caribbean' | 'central-america';
  /** Label major markets only; the rest would collide at this scale. */
  labelled: boolean;

  /**
   * Label placement nudges, in SVG units, for markets whose labels would
   * otherwise overlap a neighbour. Defaults place the label to the right.
   */
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: 'start' | 'end';
}

export const BASE_AIRPORT: MappedAirport = {
  code: 'KFXE',
  name: 'Fort Lauderdale Executive',
  lat: 26.197,
  lon: -80.171,
  region: 'base',
  labelled: true,
};

/**
 * Eastern frame extent, in degrees longitude.
 *
 * The handoff requires the map frame to keep Puerto Rico, the Lesser Antilles,
 * and the Dominican Republic visible (H-10). No airport marker sits that far
 * east, so the frame is widened explicitly rather than by adding markers the
 * handoff forbids ("Do not add an airport solely because it appears in this
 * conversion list"). Barbados, the eastern end of the chain, sits near -59.5.
 */
export const EAST_FRAME_LON = -59.0;

export const MAPPED_AIRPORTS: readonly MappedAirport[] = [
  // --- Mexico -----------------------------------------------------------
  { code: 'MMUN', name: 'Cancún', lat: 21.036, lon: -86.877, routeSlug: 'cancun', region: 'mexico', labelled: true, labelDy: -14 },
  { code: 'MMCZ', name: 'Cozumel', lat: 20.522, lon: -86.926, routeSlug: 'cozumel', region: 'mexico', labelled: false },

  // --- Caribbean --------------------------------------------------------
  { code: 'MYNN', name: 'Nassau', lat: 25.039, lon: -77.466, routeSlug: 'bahamas', region: 'caribbean', labelled: true },
  { code: 'MYGF', name: 'Freeport', lat: 26.558, lon: -78.696, region: 'caribbean', labelled: false },
  { code: 'MDPC', name: 'Punta Cana', lat: 18.567, lon: -68.363, routeSlug: 'dominican-republic', region: 'caribbean', labelled: true, labelDy: 18 },
  { code: 'MDSD', name: 'Santo Domingo', lat: 18.43, lon: -69.669, region: 'caribbean', labelled: false },
  { code: 'MDPP', name: 'Puerto Plata', lat: 19.758, lon: -70.57, region: 'caribbean', labelled: true, labelDy: -14 },
  { code: 'MKJS', name: 'Montego Bay', lat: 18.504, lon: -77.913, routeSlug: 'jamaica', region: 'caribbean', labelled: true, labelDy: -14 },
  { code: 'MKJP', name: 'Kingston', lat: 17.936, lon: -76.787, region: 'caribbean', labelled: false },
  { code: 'MBPV', name: 'Providenciales', lat: 21.774, lon: -72.266, routeSlug: 'turks-and-caicos', region: 'caribbean', labelled: true },
  { code: 'MWCR', name: 'Grand Cayman', lat: 19.293, lon: -81.358, routeSlug: 'cayman-islands', region: 'caribbean', labelled: true, labelDy: -14 },
  /*
   * Added at AirEvac's request, 2026-07-30. Neither has a route page, so
   * neither carries a link; they appear as coverage points only.
   *
   * MUHA IS CUBA, and that is a compliance question rather than a mapping one.
   * A United States operator publishing Cuba as a served destination touches
   * OFAC sanctions, where medical evacuation is generally licensable but is not
   * automatically permitted. Flagged on the sign-off register; the marker
   * asserts a destination, never authority to fly there (D6).
   */
  { code: 'MUHA', name: 'Havana', lat: 22.989, lon: -82.409, region: 'caribbean', labelled: true, labelDy: -14 },
  { code: 'TQPF', name: 'Anguilla', lat: 18.205, lon: -63.055, region: 'caribbean', labelled: true, labelDy: -14 },

  // --- Central America --------------------------------------------------
  { code: 'MZBZ', name: 'Belize City', lat: 17.539, lon: -88.308, routeSlug: 'belize', region: 'central-america', labelled: true, labelDx: -15, labelAnchor: 'end' },
  { code: 'MROC', name: 'San José', lat: 9.994, lon: -84.209, routeSlug: 'costa-rica', region: 'central-america', labelled: true, labelDy: 18 },
  { code: 'MRLB', name: 'Liberia', lat: 10.593, lon: -85.544, region: 'central-america', labelled: false },
  { code: 'MHRO', name: 'Roatán', lat: 16.317, lon: -86.523, routeSlug: 'honduras', region: 'central-america', labelled: true, labelDy: 18 },
  { code: 'MHLM', name: 'San Pedro Sula', lat: 15.453, lon: -87.924, region: 'central-america', labelled: false },
] as const;
