/**
 * Generates the coastline paths behind the coverage map.
 *
 * WHY BAKE RATHER THAN RENDER AT RUNTIME.
 * A tile server is out — `connect-src 'self'` blocks it, and it would leak every
 * visitor's IP to a map vendor, which section 13 forbids on a health-related
 * site. Shipping a TopoJSON file and converting in the browser would mean
 * shipping ~700 KB and a projection library for a static picture. So the
 * geometry is projected once, here, and committed as plain SVG path strings.
 *
 * DATA SOURCE AND LICENCE.
 * Natural Earth 1:50m Cultural Vectors, via the `world-atlas` npm package
 * (ISC). Natural Earth itself is **public domain** — "no permission needed" —
 * so there is no attribution obligation and no licence to track. That is the
 * same reason the rest of the site's artwork is original: nothing on this site
 * should carry a licence someone has to remember.
 *
 * Run: node scripts/generate-coastlines.mjs
 * Output: src/content/coastlines.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const world = feature(topo, topo.objects.countries);

/**
 * Bounding box must match CoverageMap's projection exactly, so the coastlines
 * land under the airport markers rather than beside them. Derived from the same
 * airport set and padding.
 */
const AIRPORTS = [
  [-80.171, 26.197], // FXE, the base
  [-86.877, 21.036], [-86.926, 20.522], [-109.721, 23.152], [-105.254, 20.68],
  [-77.466, 25.039], [-78.696, 26.558], [-68.363, 18.567], [-69.669, 18.43],
  [-77.913, 18.504], [-76.787, 17.936], [-72.266, 21.774], [-81.358, 19.293],
  [-88.308, 17.539], [-84.209, 9.994], [-85.544, 10.593], [-86.523, 16.317],
  [-87.924, 15.453],
];

const PAD = { x: 3.5, y: 3 };
const minLon = Math.min(...AIRPORTS.map((a) => a[0])) - PAD.x;
const maxLon = Math.max(...AIRPORTS.map((a) => a[0])) + PAD.x;
const minLat = Math.min(...AIRPORTS.map((a) => a[1])) - PAD.y;
const maxLat = Math.max(...AIRPORTS.map((a) => a[1])) + PAD.y;

const lonSpan = maxLon - minLon;
const latSpan = maxLat - minLat;
const VIEW_WIDTH = 1000;
const MID_LAT = (((minLat + maxLat) / 2) * Math.PI) / 180;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * latSpan) / (lonSpan * Math.cos(MID_LAT)));

const project = ([lon, lat]) => [
  ((lon - minLon) / lonSpan) * VIEW_WIDTH,
  VIEW_HEIGHT - ((lat - minLat) / latSpan) * VIEW_HEIGHT,
];

/** Generous margin so shapes crossing the edge still render their visible part. */
const MARGIN = 8;
const inView = ([lon, lat]) =>
  lon >= minLon - MARGIN && lon <= maxLon + MARGIN && lat >= minLat - MARGIN && lat <= maxLat + MARGIN;

/**
 * Ramer–Douglas–Peucker simplification in projected space.
 *
 * At this scale the 50m source carries far more vertices than 1000px can show.
 * Simplifying after projection (rather than in degrees) means the tolerance is
 * in the units that actually matter — rendered pixels.
 */
function simplify(points, tolerance) {
  if (points.length < 3) return points;

  let maxDist = 0;
  let index = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const norm = Math.hypot(dx, dy) || 1;

  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const dist = Math.abs(dy * px - dx * py + bx * ay - by * ax) / norm;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];

  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

/**
 * Simplification tolerance in rendered pixels.
 *
 * The map displays around 1100px wide from a 1000-unit viewBox, so anything
 * finer than ~1px of detail is invisible but still costs bytes in every page
 * that renders the map. At 0.6 the inlined geometry added ~45 KB gzipped to the
 * homepage; 1.2 with integer coordinates roughly halves that for no visible
 * difference at this scale.
 */
const TOLERANCE = 1.2; // px
/** Drop specks — islands too small to read, which only add file size. */
const MIN_AREA = 6; // px²

/** How far past the viewBox geometry is allowed to extend before clamping. */
const BLEED = 120; // px

function ringArea(points) {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
  }
  return Math.abs(area / 2);
}

/**
 * Simplifies a CLOSED ring.
 *
 * Plain RDP cannot be applied to a ring directly: its first and last points are
 * the same, so the baseline has zero length, every perpendicular distance
 * computes to zero, and the whole shape collapses to two points. (That bug
 * silently produced an empty map on the first run of this script.)
 *
 * The fix is the standard one — split the ring at the vertex farthest from the
 * start, simplify the two open halves independently, and rejoin.
 */
function simplifyRing(points, tolerance) {
  if (points.length < 4) return points;

  const [sx, sy] = points[0];
  let farthest = 0;
  let maxDist = -1;

  for (let i = 1; i < points.length; i += 1) {
    const dist = Math.hypot(points[i][0] - sx, points[i][1] - sy);
    if (dist > maxDist) {
      maxDist = dist;
      farthest = i;
    }
  }

  const first = simplify(points.slice(0, farthest + 1), tolerance);
  const second = simplify(points.slice(farthest), tolerance);
  return [...first.slice(0, -1), ...second];
}

function ringToPath(ring) {
  if (!ring.some(inView)) return null;

  const projected = ring.map(project);
  const simplified = simplifyRing(projected, TOLERANCE);
  if (simplified.length < 3) return null;
  if (ringArea(simplified) < MIN_AREA) return null;

  /*
   * Clamp to a modest bleed margin. A ring is kept if ANY of its points is in
   * view, so a large landmass (South America, the continental US) drags its
   * whole outline along — coordinates hundreds of units off-canvas that can
   * never render but still cost bytes on every page. Clamping flattens those
   * excursions against the bleed box, which is invisible and smaller.
   */
  const clampX = (n) => Math.max(-BLEED, Math.min(VIEW_WIDTH + BLEED, n));
  const clampY = (n) => Math.max(-BLEED, Math.min(VIEW_HEIGHT + BLEED, n));

  // Integer coordinates: the viewBox is 1000 units wide and renders near 1:1.
  const round = (n) => Math.round(n);

  const coords = simplified.map(([x, y]) => `${round(clampX(x))} ${round(clampY(y))}`);

  // Collapse runs of identical clamped points, which the clamp creates along
  // the bleed edges.
  const deduped = coords.filter((c, i) => i === 0 || c !== coords[i - 1]);
  if (deduped.length < 3) return null;

  return `M${deduped.join('L')}Z`;
}

const paths = [];
for (const country of world.features) {
  const geom = country.geometry;
  if (geom === null) continue;

  const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const polygon of polygons) {
    // Outer ring only. Holes (lakes) are invisible at this weight and scale.
    const path = ringToPath(polygon[0]);
    if (path !== null) paths.push(path);
  }
}

const output = `/**
 * Coastline geometry for the coverage map. GENERATED — do not edit by hand.
 *
 * Regenerate with: node scripts/generate-coastlines.mjs
 *
 * Source: Natural Earth 1:50m cultural vectors via the world-atlas package.
 * Natural Earth is PUBLIC DOMAIN — no attribution required, no licence to
 * track. Projected with the same equirectangular transform CoverageMap uses, so
 * these paths align with the airport markers, then simplified to ${TOLERANCE}px
 * and stripped of shapes under ${MIN_AREA}px².
 *
 * ${paths.length} paths, ${(Buffer.byteLength(paths.join(''), 'utf8') / 1024).toFixed(1)} KB of geometry.
 */

export const COASTLINE_VIEW = { width: ${VIEW_WIDTH}, height: ${VIEW_HEIGHT} } as const;

export const COASTLINE_PATHS: readonly string[] = [
${paths.map((p) => `  '${p}',`).join('\n')}
];
`;

writeFileSync('src/content/coastlines.ts', output);
console.log(
  `wrote src/content/coastlines.ts — ${paths.length} paths, ` +
    `${(Buffer.byteLength(output, 'utf8') / 1024).toFixed(1)} KB, viewBox ${VIEW_WIDTH}x${VIEW_HEIGHT}`,
);
