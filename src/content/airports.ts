/**
 * Airport coordinates for the coverage map.
 *
 * Real latitude/longitude, so the map is a projection of actual geography
 * rather than a decorative arrangement. Section 12 (FTC Act) forbids misleading
 * coverage claims, and a map is a coverage claim — a prettier layout that put
 * airports in the wrong place would be exactly that.
 *
 * Coordinates are the published airport reference points, rounded to three
 * decimals (~100 m), which is far finer than the map renders.
 *
 * NOTE ON WHAT THIS MAP ASSERTS: it shows where the priority route pages are,
 * and where the operating base is. It does NOT assert operating authority in
 * any jurisdiction — that is gated on D6.
 */

export interface MappedAirport {
  /** IATA code. */
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
   * Label placement nudges, in SVG units, for the handful of markets whose
   * labels would otherwise overlap a neighbour's marker. Defaults place the
   * label to the right of the point.
   */
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: 'start' | 'end';
}

export const BASE_AIRPORT: MappedAirport = {
  code: 'FXE',
  name: 'Fort Lauderdale Executive',
  lat: 26.197,
  lon: -80.171,
  region: 'base',
  labelled: true,
};

export const MAPPED_AIRPORTS: readonly MappedAirport[] = [
  // --- Mexico -----------------------------------------------------------
  { code: 'CUN', name: 'Cancún', lat: 21.036, lon: -86.877, routeSlug: 'cancun', region: 'mexico', labelled: true, labelDy: -12 },
  { code: 'CZM', name: 'Cozumel', lat: 20.522, lon: -86.926, routeSlug: 'cozumel', region: 'mexico', labelled: false },
  { code: 'SJD', name: 'Los Cabos', lat: 23.152, lon: -109.721, routeSlug: 'los-cabos', region: 'mexico', labelled: true },
  { code: 'PVR', name: 'Puerto Vallarta', lat: 20.68, lon: -105.254, routeSlug: 'puerto-vallarta', region: 'mexico', labelled: true },

  // --- Caribbean --------------------------------------------------------
  { code: 'NAS', name: 'Nassau', lat: 25.039, lon: -77.466, routeSlug: 'bahamas', region: 'caribbean', labelled: true },
  { code: 'FPO', name: 'Freeport', lat: 26.558, lon: -78.696, region: 'caribbean', labelled: false },
  { code: 'PUJ', name: 'Punta Cana', lat: 18.567, lon: -68.363, routeSlug: 'dominican-republic', region: 'caribbean', labelled: true },
  { code: 'SDQ', name: 'Santo Domingo', lat: 18.43, lon: -69.669, region: 'caribbean', labelled: false },
  { code: 'MBJ', name: 'Montego Bay', lat: 18.504, lon: -77.913, routeSlug: 'jamaica', region: 'caribbean', labelled: true, labelDy: -12 },
  { code: 'KIN', name: 'Kingston', lat: 17.936, lon: -76.787, region: 'caribbean', labelled: false },
  { code: 'PLS', name: 'Providenciales', lat: 21.774, lon: -72.266, routeSlug: 'turks-and-caicos', region: 'caribbean', labelled: true },
  { code: 'GCM', name: 'Grand Cayman', lat: 19.293, lon: -81.358, routeSlug: 'cayman-islands', region: 'caribbean', labelled: true, labelDy: -12 },

  // --- Central America --------------------------------------------------
  { code: 'BZE', name: 'Belize City', lat: 17.539, lon: -88.308, routeSlug: 'belize', region: 'central-america', labelled: true, labelDx: -13, labelAnchor: 'end' },
  { code: 'SJO', name: 'San José', lat: 9.994, lon: -84.209, routeSlug: 'costa-rica', region: 'central-america', labelled: true, labelDy: 16 },
  { code: 'LIR', name: 'Liberia', lat: 10.593, lon: -85.544, region: 'central-america', labelled: false },
  { code: 'RTB', name: 'Roatán', lat: 16.317, lon: -86.523, routeSlug: 'honduras', region: 'central-america', labelled: true, labelDy: 16 },
  { code: 'SAP', name: 'San Pedro Sula', lat: 15.453, lon: -87.924, region: 'central-america', labelled: false },
] as const;
