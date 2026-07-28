import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE } from '@/content/site';

/**
 * Call-to-action primitives.
 *
 * Blueprint page 7 fixes the conversion hierarchy, and page 10 fixes the colour
 * rule: red is reserved for urgent actions. `PhoneCta` is the only component
 * that renders the urgent variant by default, which is what keeps the phone
 * visually primary on every page without relying on each page author to
 * remember.
 *
 * All targets are >= 44x44 CSS px (WCAG 2.2 SC 2.5.8 Target Size Minimum).
 */

type Variant = 'urgent' | 'primary' | 'secondary' | 'quiet';

const VARIANTS: Record<Variant, string> = {
  // Urgent: phone and emergency only.
  urgent:
    'cta-urgent bg-urgent-600 text-white hover:bg-urgent-700 ' +
    'border border-transparent',
  primary:
    'cta-primary bg-navy-800 text-white hover:bg-navy-900 ' +
    'border border-transparent',
  secondary:
    'bg-white text-navy-800 border border-navy-800 ' +
    'hover:bg-support-50',
  quiet:
    'bg-transparent text-support-700 underline underline-offset-4 ' +
    'hover:text-navy-900 border border-transparent',
};

const BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-panel ' +
  'px-5 py-3 text-center font-semibold leading-tight transition-colors';

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Set for links that leave the site, so the icon and rel are applied. */
  external?: boolean;
}

export function CtaLink({
  href,
  children,
  variant = 'primary',
  className = '',
  external = false,
}: CtaLinkProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        // noopener/noreferrer on every external link: `rel="noreferrer"` also
        // stops the referrer leaking which AirEvac page a referrer came from.
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

interface PhoneCtaProps {
  /** Visible label. Defaults are supplied by the caller from the dictionary. */
  label: string;
  /** Rendered under the label. Usually the number itself. */
  sublabel?: string;
  variant?: Variant;
  className?: string;
}

/**
 * The primary conversion, blueprint page 7.
 *
 * This is a plain `<a href="tel:">` with no JavaScript, no click handler, and no
 * tracking wrapper - three deliberate choices:
 *
 *  1. Page 20 requires the phone path to survive when "CMS, chat, CRM,
 *     translation, analytics, or map fails". A markup-only link survives a
 *     total JS failure.
 *  2. Page 19 gates call tracking behind "approved notice, consent, vendor
 *     contract and data handling" - none of which exist yet, so no dynamic
 *     number insertion and no click interception.
 *  3. Page 13 forbids ad use of contact data; an onClick that fired a pixel
 *     would be exactly that.
 */
export function PhoneCta({
  label,
  sublabel = SITE.phone.display,
  variant = 'urgent',
  className = '',
}: PhoneCtaProps) {
  return (
    <a href={SITE.phone.href} className={`${BASE} ${VARIANTS[variant]} flex-col gap-0.5! ${className}`}>
      <span>{label}</span>
      <span className="text-sm font-normal opacity-95">{sublabel}</span>
    </a>
  );
}
