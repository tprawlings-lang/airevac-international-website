import { SITE } from '@/content/site';
import { CREDENTIAL_REGISTER } from '@/content/credentials';
import { publishable } from '@/lib/credential-register';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Structured data. Blueprint section 19 (Technical SEO rules):
 *   "Organization, LocalBusiness where accurate, Article, Person, Breadcrumb,
 *    FAQ only when eligible, and service structured data validated against
 *    visible content."
 *
 * "Validated against visible content" is the constraint that shapes this module:
 * structured data is generated FROM the same credential register the pages
 * render from, so a claim that is gated out of the page is also absent from the
 * JSON-LD. Hand-written JSON-LD is how sites end up asserting an expired
 * accreditation to search engines after removing it from the visible page.
 */

export interface JsonLd {
  '@context': 'https://schema.org';
  [key: string]: unknown;
}

/**
 * Organization. `LocalBusiness` is deliberately NOT used: the Fort Lauderdale
 * hangar is an operating base, not a walk-in place of business, and marking it
 * as a local business invites "open now" and directions treatments that would
 * misrepresent how a transport is actually arranged.
 */
export function organizationJsonLd(locale: Locale, now: Date): JsonLd {
  // Only cleared accreditations become `hasCredential`.
  const credentials = CREDENTIAL_REGISTER.filter(
    (record) => record.category === 'accreditation' && publishable(record, now),
  ).map((record) => ({
    '@type': 'EducationalOccupationalCredential',
    name: record.issuer,
    credentialCategory: record.scope,
    recognizedBy: { '@type': 'Organization', name: record.issuer },
    ...(record.expiresOn !== null ? { validThrough: record.expiresOn } : {}),
    ...(record.verificationUrl !== null ? { url: record.verificationUrl } : {}),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: `${SITE.url}${localePath(locale, '/')}`,
    telephone: SITE.phone.display,
    email: SITE.email.display,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.base.street,
      addressLocality: SITE.base.locality,
      addressRegion: SITE.base.region,
      postalCode: SITE.base.postalCode,
      addressCountry: SITE.base.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE.phone.display,
        contactType: 'Flight coordination',
        // Hours are a verifiable operational fact about the phone line.
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
        },
        /*
         * availableLanguage is NOT asserted here. A 24/7 Spanish guarantee is
         * gated on D11 (staffing and translator policy); asserting it in
         * structured data would publish the claim to search engines while the
         * visible page correctly withholds it.
         */
      },
    ],
    ...(credentials.length > 0 ? { hasCredential: credentials } : {}),
  };
}

/** Breadcrumb, per section 19. Paths are locale-prefixed to match canonicals. */
export function breadcrumbJsonLd(
  locale: Locale,
  trail: { name: string; path: string }[],
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE.url}${localePath(locale, crumb.path)}`,
    })),
  };
}

/**
 * Serialises JSON-LD for a `<script type="application/ld+json">` tag.
 *
 * `<` is escaped so a value containing `</script>` cannot break out of the
 * script element - the standard XSS vector for JSON embedded in HTML. Values
 * here are authored, but the escape is unconditional because the next
 * contributor's values might not be.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
