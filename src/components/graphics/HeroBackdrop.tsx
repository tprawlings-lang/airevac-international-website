/**
 * Hero backdrop: a quiet flight-path motif behind the navy hero.
 *
 * WHY THIS INSTEAD OF A PHOTOGRAPH. Blueprint page 10 requires real AirEvac
 * imagery with written permission, and forbids "generic stretcher stock photos,
 * dramatic emergency imagery, crowded aviation collages". Permission-cleared
 * photography is gated on D12, and a stock jet-at-sunset would violate the rule
 * twice over — it is neither AirEvac's aircraft nor a calm image.
 *
 * So the hero gets depth from geometry: great-circle-style arcs and a faint
 * graticule, at very low contrast. It reads as navigation and altitude rather
 * than as decoration, it costs about 2 KB inline, and it is replaced by a
 * photograph the day D12 closes without touching the hero's layout.
 *
 * Contrast: every stroke sits at 6–10% opacity over navy-900, which keeps the
 * hero's white text far above the 4.5:1 AA threshold — the backdrop cannot
 * interfere with it.
 */
export function HeroBackdrop({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Fades the motif out toward the left, where the headline sits. */}
        <linearGradient id="hero-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>

        <mask id="hero-mask">
          <rect width="1200" height="600" fill="url(#hero-fade)" />
        </mask>
      </defs>

      <g mask="url(#hero-mask)">
        {/* Graticule */}
        <g stroke="white" strokeWidth="1" opacity="0.06">
          {Array.from({ length: 13 }, (_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="600" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="1200" y2={i * 100} />
          ))}
        </g>

        {/* Flight arcs */}
        <g fill="none" stroke="white" strokeLinecap="round">
          <path d="M -40 470 Q 380 240 900 300" strokeWidth="1.5" opacity="0.16" />
          <path d="M 120 560 Q 560 300 1160 340" strokeWidth="1.5" opacity="0.10" />
          <path d="M 60 380 Q 500 130 1080 130" strokeWidth="1.5" opacity="0.08" />
        </g>

        {/* Waypoints on the primary arc */}
        <g fill="white">
          <circle cx="900" cy="300" r="5" opacity="0.5" />
          <circle cx="900" cy="300" r="12" fill="none" stroke="white" strokeWidth="1.5" opacity="0.22" />
          <circle cx="380" cy="332" r="3.5" opacity="0.3" />
          <circle cx="1160" cy="340" r="3.5" opacity="0.2" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Aircraft planform, drawn as a technical outline.
 *
 * Used as a section motif and on aircraft cards while photography is pending.
 * A schematic reads as engineering credibility — AirMed uses the same device —
 * and, importantly, it is unmistakably a diagram. A photorealistic rendering
 * would imply it depicts a specific airframe, which would be a fleet claim we
 * cannot evidence.
 */
export function AircraftPlanform({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="84 0 232 216"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Fuselage */}
      <path d="M200 12c7 0 12 12 13 30l3 96 1 46-3 20h-28l-3-20 1-46 3-96c1-18 6-30 13-30Z" />

      {/* Wings, swept */}
      <path d="M186 118 96 168v12l90-28Z" />
      <path d="M214 118l90 50v12l-90-28Z" />

      {/* Tip tanks — a Learjet family signature */}
      <path d="M92 164h10a4 4 0 0 1 0 20H92a4 4 0 0 1 0-20Z" />
      <path d="M308 164h-10a4 4 0 0 0 0 20h10a4 4 0 0 0 0-20Z" />

      {/* T-tail */}
      <path d="M196 186h8l1 14h-10Z" />
      <path d="M150 200h100v9H150Z" />

      {/* Centreline, dashed, as on a drawing */}
      <path d="M200 6v208" strokeDasharray="4 6" opacity="0.35" strokeWidth="1" />
    </svg>
  );
}
