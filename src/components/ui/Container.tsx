import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  /** `narrow` is for long-form legal and route copy: ~70ch keeps it readable. */
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}

const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
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
