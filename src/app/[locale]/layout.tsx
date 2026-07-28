import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '@/app/globals.css';

import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import { HTML_LANG, isLocale, LOCALES, localePath, type Locale } from '@/lib/i18n';
import { getNonce } from '@/lib/nonce';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCallBar } from '@/components/MobileCallBar';

/**
 * Root layout.
 *
 * This is the top-most layout in the segment tree - there is no `app/layout.tsx`
 * - so that `<html lang>` can be set from the route's locale. Getting `lang`
 * right is not cosmetic: WCAG 2.2 SC 3.1.1 (Language of Page) is a launch gate
 * on page 21, and a screen reader reading Spanish content with an `en` lang
 * attribute is unintelligible.
 */

export function generateStaticParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Every HTML document is rendered per request so that the CSP nonce in the
 * response header matches the nonce Next stamps on its inline scripts. See the
 * long note in src/lib/nonce.ts for the full reasoning and the CDN configuration
 * this requires.
 */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom is NOT capped. WCAG 2.2 SC 1.4.4 requires 200% resize, and the launch
  // gate on page 21 tests 400%. `maximum-scale` or `user-scalable=no` would fail
  // both.
  themeColor: '#0a1f3c',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const isSpanish = locale === 'es';

  return {
    metadataBase: new URL(SITE.url),

    title: {
      default: isSpanish
        ? 'AirEvac International: Ambulancia aérea para México y el Caribe'
        : 'AirEvac International: Air Ambulance for Mexico and the Caribbean',
      // Section 19: unique title per page. The template keeps the brand suffix
      // consistent without each page repeating it.
      template: '%s | AirEvac International',
    },

    description: isSpanish
      ? 'Coordinación directa de ambulancia aérea para hospitales, equipos de crucero y ' +
        'marítimos, aseguradoras y familias. Coordinadores de vuelo disponibles 24/7.'
      : 'Direct air ambulance coordination for hospitals, cruise and maritime teams, ' +
        'insurers, and families. Flight coordinators available 24/7.',

    // Section 3: "Spanish pages receive human review, their own metadata, and
    // proper hreflang tags."
    alternates: {
      canonical: localePath(locale, '/'),
      languages: {
        'en-US': localePath('en', '/'),
        'es-419': localePath('es', '/'),
        // x-default points at the canonical content set.
        'x-default': localePath('en', '/'),
      },
    },

    robots: {
      // Section 19: "noindex for staging". SITE_URL is only the production
      // origin in production, so staging emits noindex automatically rather than
      // relying on someone remembering to flip a flag.
      index: SITE.url === 'https://airevacinternational.com',
      follow: SITE.url === 'https://airevacinternational.com',
    },

    // No verification tokens, no third-party site associations: section 13
    // prohibits advertising and consumer-analytics code on the public layer.
    other: {
      'format-detection': 'telephone=no',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  // Reading the nonce is what makes the strict CSP hold; see src/lib/nonce.ts.
  await getNonce();

  return (
    <html lang={HTML_LANG[locale]}>
      <body>
        {/* First focusable element on the page (WCAG 2.4.1 Bypass Blocks). */}
        <a href="#main" className="skip-link">
          {dictionary.common.skipToContent}
        </a>

        <SiteHeader locale={locale} />

        <main id="main" tabIndex={-1}>
          {children}
        </main>

        <SiteFooter locale={locale} />

        <MobileCallBar locale={locale} />
      </body>
    </html>
  );
}
