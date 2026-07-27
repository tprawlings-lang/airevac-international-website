import Link from 'next/link';
import { BASE_AIRPORT, MAPPED_AIRPORTS, type MappedAirport } from '@/content/airports';
import { COASTLINE_PATHS, COASTLINE_VIEW } from '@/content/coastlines';
import { PRIORITY_ROUTES } from '@/content/navigation';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Route map: the operating base and the priority markets, drawn from real
 * coordinates.
 *
 * WHY THIS GRAPHIC EXISTS. Competitor research (REVA, AirMed — the two largest
 * fixed-wing international operators) found neither publishes a coverage map;
 * both list countries as text. AirEvac's entire position is regional
 * concentration rather than claimed global reach, so a map is the one graphic
 * that argues the positioning instead of decorating around it.
 *
 * WHY IT IS DRAWN, NOT PHOTOGRAPHED. It is inline SVG generated from
 * `airports.ts`: no licensing, no third-party tile server (which `connect-src
 * 'self'` would block and which would leak visitor IPs to a map vendor —
 * section 13), no image weight, and it scales perfectly at any zoom, which
 * matters for the 400% reflow requirement on page 21.
 *
 * WHAT IT CLAIMS. Where the base is and where the priority route pages are.
 * It does NOT assert operating authority anywhere — that is gated on D6 — and
 * the caption says so.
 */

/** Equirectangular projection. Accurate enough at this scale and easy to verify. */
const PADDING = { x: 3.5, y: 3 };

function bounds() {
  const points = [BASE_AIRPORT, ...MAPPED_AIRPORTS];
  return {
    minLon: Math.min(...points.map((p) => p.lon)) - PADDING.x,
    maxLon: Math.max(...points.map((p) => p.lon)) + PADDING.x,
    minLat: Math.min(...points.map((p) => p.lat)) - PADDING.y,
    maxLat: Math.max(...points.map((p) => p.lat)) + PADDING.y,
  };
}

const VIEW_WIDTH = 1000;

const { minLon, maxLon, minLat, maxLat } = bounds();
const lonSpan = maxLon - minLon;
const latSpan = maxLat - minLat;

/**
 * Height derived from the data's aspect ratio, corrected by cos(latitude) so
 * the region is not visibly stretched. Mid-latitude here is ~18°N.
 */
const MID_LAT_RADIANS = (((minLat + maxLat) / 2) * Math.PI) / 180;
const VIEW_HEIGHT = Math.round(
  (VIEW_WIDTH * latSpan) / (lonSpan * Math.cos(MID_LAT_RADIANS)),
);

/**
 * Guards the generated geometry against this component's projection drifting.
 * If someone changes PADDING or VIEW_WIDTH without regenerating the coastlines,
 * the land would silently slide out from under the markers — so fail loudly at
 * import time instead. Asserted again in tests.
 */
if (COASTLINE_VIEW.width !== VIEW_WIDTH || COASTLINE_VIEW.height !== VIEW_HEIGHT) {
  throw new Error(
    `Coastline geometry was generated for ${COASTLINE_VIEW.width}x${COASTLINE_VIEW.height} but ` +
      `the map projects to ${VIEW_WIDTH}x${VIEW_HEIGHT}. ` +
      'Run: node scripts/generate-coastlines.mjs',
  );
}

function project(airport: { lat: number; lon: number }) {
  return {
    x: ((airport.lon - minLon) / lonSpan) * VIEW_WIDTH,
    // SVG y grows downward; latitude grows upward.
    y: VIEW_HEIGHT - ((airport.lat - minLat) / latSpan) * VIEW_HEIGHT,
  };
}

/**
 * Quadratic arc from base to destination, bowed perpendicular to the path.
 *
 * A straight line would read as a schematic; a gentle arc reads as a flight
 * path. The bow scales with distance so short hops stay nearly straight.
 */
function arcPath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Perpendicular unit vector, scaled to a fraction of the distance.
  const bow = distance * 0.12;
  const nx = -dy / (distance || 1);
  const ny = dx / (distance || 1);

  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${(midX + nx * bow).toFixed(1)} ${(
    midY +
    ny * bow
  ).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

const REGION_COLOR: Record<MappedAirport['region'], string> = {
  base: 'var(--color-urgent-600)',
  mexico: 'var(--color-support-500)',
  caribbean: 'var(--color-support-500)',
  'central-america': 'var(--color-support-500)',
};

export function CoverageMap({
  locale,
  className = '',
  /** `full` labels and links the priority markets; `quiet` is a backdrop. */
  variant = 'full',
}: {
  locale: Locale;
  className?: string;
  variant?: 'full' | 'quiet';
}) {
  const base = project(BASE_AIRPORT);
  const routeSlugs = new Map(PRIORITY_ROUTES.map((route) => [route.slug, route]));

  const isQuiet = variant === 'quiet';

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="coverage-map-title coverage-map-desc"
      >
        <title id="coverage-map-title">
          {locale === 'es'
            ? 'Mapa de rutas prioritarias de AirEvac'
            : 'Map of AirEvac priority routes'}
        </title>
        {/*
         * The description carries the same information as the graphic, so a
         * screen-reader user is not told merely "a map" (WCAG 1.1.1). The
         * airport list below the figure is the real equivalent, and it is
         * visible to everyone rather than hidden — an accessible alternative
         * that sighted users also benefit from.
         */}
        <desc id="coverage-map-desc">
          {locale === 'es'
            ? `Base de operaciones en Fort Lauderdale, Florida, con rutas hacia ${MAPPED_AIRPORTS.length} aeropuertos en México, el Caribe y Centroamérica.`
            : `Operating base at Fort Lauderdale, Florida, with routes to ${MAPPED_AIRPORTS.length} airports across Mexico, the Caribbean, and Central America.`}
        </desc>

        {/*
         * Landmasses. Generated from Natural Earth (public domain) by
         * scripts/generate-coastlines.mjs, using this exact projection, so the
         * coastlines sit under the airport markers rather than beside them.
         *
         * Filled rather than outlined: a coordinator needs to recognise the Gulf
         * and the Yucatán at a glance, and outlines at this scale read as noise.
         * Low contrast keeps land as context and the routes as the subject.
         */}
        <g
          fill="currentColor"
          fillOpacity="0.10"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="0.75"
          strokeLinejoin="round"
        >
          {COASTLINE_PATHS.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>

        {/* Graticule: 5° grid. Establishes that this is a real projection. */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.12">
          {Array.from({ length: Math.ceil(lonSpan / 5) + 1 }, (_, i) => {
            const lon = Math.ceil(minLon / 5) * 5 + i * 5;
            if (lon > maxLon) return null;
            const { x } = project({ lat: 0, lon });
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={VIEW_HEIGHT} />;
          })}
          {Array.from({ length: Math.ceil(latSpan / 5) + 1 }, (_, i) => {
            const lat = Math.ceil(minLat / 5) * 5 + i * 5;
            if (lat > maxLat) return null;
            const { y } = project({ lat, lon: 0 });
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={VIEW_WIDTH} y2={y} />;
          })}
        </g>

        {/* Route arcs, drawn under the markers. */}
        <g
          fill="none"
          stroke="var(--color-support-500)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        >
          {MAPPED_AIRPORTS.map((airport) => (
            <path key={`arc-${airport.code}`} d={arcPath(base, project(airport))} />
          ))}
        </g>

        {/* Destination markers. */}
        {MAPPED_AIRPORTS.map((airport) => {
          const { x, y } = project(airport);
          const showLabel = airport.labelled && !isQuiet;

          return (
            <g key={airport.code}>
              <circle cx={x} cy={y} r={5} fill={REGION_COLOR[airport.region]} />
              <circle cx={x} cy={y} r={9} fill="none" stroke={REGION_COLOR[airport.region]} strokeWidth="1" opacity="0.4" />

              {showLabel && (
                <text
                  x={x + (airport.labelDx ?? 13)}
                  y={y + 4 + (airport.labelDy ?? 0)}
                  textAnchor={airport.labelAnchor ?? 'start'}
                  fill="currentColor"
                  fontSize="17"
                  fontWeight="600"
                  opacity="0.85"
                >
                  {airport.code}
                </text>
              )}
            </g>
          );
        })}

        {/* Base marker, deliberately distinct: red is the reserved urgent tone,
            and the base is the one point on this map that is about us. */}
        <g>
          <circle cx={base.x} cy={base.y} r={7} fill="var(--color-urgent-600)" />
          <circle
            cx={base.x}
            cy={base.y}
            r={14}
            fill="none"
            stroke="var(--color-urgent-600)"
            strokeWidth="2"
            opacity="0.5"
          />
          {!isQuiet && (
            <text
              x={base.x + 20}
              y={base.y + 5}
              fill="currentColor"
              fontSize="19"
              fontWeight="700"
            >
              FXE
            </text>
          )}
        </g>
      </svg>

      {!isQuiet && (
        <figcaption className="mt-4">
          {/*
           * The text equivalent of the map. Visible rather than sr-only: it is
           * genuinely useful — a coordinator scanning for a market finds it
           * faster here than by reading a map — and it gives every route page an
           * internal link, which the map's SVG text cannot.
           */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {MAPPED_AIRPORTS.filter((airport) => airport.routeSlug !== undefined).map((airport) => {
              const route = airport.routeSlug ? routeSlugs.get(airport.routeSlug) : undefined;
              if (route === undefined) return null;

              return (
                <li key={airport.code}>
                  <Link
                    href={localePath(locale, `/coverage/${route.region}/${route.slug}`)}
                    className="underline underline-offset-4 opacity-80 hover:opacity-100"
                  >
                    <span className="font-semibold">{airport.code}</span> {airport.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs opacity-70">
            {locale === 'es'
              ? 'Base de operaciones y mercados prioritarios. Este mapa muestra dónde ' +
                'trabajamos con mayor frecuencia; no es una lista exhaustiva ni una ' +
                'declaración de autoridad operativa en ninguna jurisdicción.'
              : 'Operating base and priority markets. This map shows where we work most ' +
                'often. It is not an exhaustive list, and it is not a statement of operating ' +
                'authority in any jurisdiction.'}
          </p>
        </figcaption>
      )}
    </figure>
  );
}
