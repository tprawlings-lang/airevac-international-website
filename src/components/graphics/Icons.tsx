/**
 * Icon set. Original line artwork, drawn on a 24×24 grid with a 1.75 stroke.
 *
 * WHY DRAWN RATHER THAN AN ICON LIBRARY: no dependency, no licence to track, no
 * font or sprite request, and consistent weight with the rest of the design.
 * They inherit `currentColor` so they work on navy and on white without
 * variants.
 *
 * All are `aria-hidden` - every icon here sits beside a visible text label, so
 * announcing it would just duplicate the label for screen-reader users.
 */

type IconProps = { className?: string };

function Svg({ className = '', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Hospital / case manager. */
export function HospitalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v15" />
      <path d="M12 9v6M9 12h6" />
      <path d="M9 21v-3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V21" />
    </Svg>
  );
}

/** Cruise and maritime. */
export function ShipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 18.5c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2" />
      <path d="M4.5 15.5 6 10h12l1.5 5.5" />
      <path d="M9 10V6.5h6V10" />
      <path d="M12 6.5V4" />
    </Svg>
  );
}

/** Insurance and assistance. A shield reads as coverage without a currency symbol. */
export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

/** Patient and family. */
export function FamilyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8.5" cy="7.5" r="2.75" />
      <circle cx="16.5" cy="9" r="2.25" />
      <path d="M3.5 19.5a5 5 0 0 1 10 0" />
      <path d="M14 19.5a4.2 4.2 0 0 1 6.5-3.5" />
    </Svg>
  );
}

/** Phone / 24-hour coordination. */
export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
    </Svg>
  );
}

/** Fixed-wing aircraft. Used for fleet and transport affordances. */
export function AircraftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c.9 0 1.6 1.4 1.6 3.2v3.1l7.4 4.3v2.2l-7.4-2.3v4l2.4 1.9v1.6L12 19.4l-4 .9v-1.6l2.4-1.9v-4L3 15.1v-2.2l7.4-4.3V5.7c0-1.8.7-3.2 1.6-3.2Z" />
    </Svg>
  );
}

/** Protected channel / secure handoff. */
export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.75a4 4 0 0 1 8 0V10.5" />
      <path d="M12 14.5v2.5" />
    </Svg>
  );
}

/** Verified credential. */
export function VerifiedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 2.5 2.3 1.7 2.8-.3 1 2.7 2.4 1.6-.9 2.7.9 2.7-2.4 1.6-1 2.7-2.8-.3L12 19.8l-2.3-1.7-2.8.3-1-2.7-2.4-1.6.9-2.7-.9-2.7 2.4-1.6 1-2.7 2.8.3L12 2.5Z" />
      <path d="m9.2 11.6 2 2 3.6-3.7" />
    </Svg>
  );
}

/** Clock / timing factors. */
export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}
