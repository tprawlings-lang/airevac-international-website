import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  /** `narrow` is for long-form legal and route copy: ~70ch keeps it readable. */
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}

/**
 * WHY THESE GROW IN STEPS, and why `narrow` barely does.
 *
 * `default` and `wide` hold grids, cards, and the map, which have more to show
 * when there is more room, so they widen on very large displays. Combined with
 * the root font scaling in globals.css they take a workable share of an
 * ultrawide screen instead of sitting in a 22% column.
 *
 * `narrow` holds long-form legal and route copy, and is measured in `ch` rather
 * than `rem` on purpose. Line length is bounded by reading, not by glass: past
 * roughly 75 characters the eye loses its place returning to the next line, and
 * that limit does not move because somebody bought a wider monitor. A `ch`
 * measure stays constant as the root scales, which a rem measure would not.
 */
const WIDTHS = {
  narrow: 'max-w-[68ch]',
  default: 'max-w-6xl 3xl:max-w-[84rem] 4xl:max-w-[96rem] 5xl:max-w-[108rem] 6xl:max-w-[126rem]',
  wide: 'max-w-7xl 3xl:max-w-[92rem] 4xl:max-w-[104rem] 5xl:max-w-[120rem] 6xl:max-w-[138rem]',
} as const;

export function Container({ children, width = 'default', className = '' }: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${WIDTHS[width]} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  /** Navy sections carry `.on-navy` so focus rings switch to the light variant. */
  tone?: 'paper' | 'tint' | 'navy';
  className?: string;
  id?: string;
  ariaLabelledBy?: string;
}

const TONES = {
  paper: 'bg-paper text-ink-900',
  tint: 'bg-support-50 text-ink-900',
  navy: 'on-navy bg-navy-900 text-white',
} as const;

export function Section({
  children,
  tone = 'paper',
  className = '',
  id,
  ariaLabelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`py-12 sm:py-16 ${TONES[tone]} ${className}`}
    >
      {children}
    </section>
  );
}
