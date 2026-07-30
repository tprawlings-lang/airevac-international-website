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

/**
 * Page-level graph: WebSite, WebPage, and (where the page has a trail)
 * BreadcrumbList, emitted as one `@graph` per the AI Search Coding Handoff
 * section 7 ("All pages: WebSite, WebPage, BreadcrumbList").
 *
 * WHY ONE GRAPH RATHER THAN THREE SCRIPT TAGS. Stable `@id` values let the
 * nodes reference each other, so a consumer reading the WebPage node can
 * resolve its publisher and its site without guessing. Three disconnected
 * blobs make an answer engine infer relationships that it can simply be told.
 *
 * Every value here is structural (URL, title, language, trail). No claim about
 * AirEvac enters through this function; claims come from the credential
 * register via `organizationJsonLd`, which stays gated.
 */
export function pageGraphJsonLd(
  locale: Locale,
  page: {
    path: string;
    title: string;
    description: string;
    /** ISO date the content was last reviewed, when the page records one. */
    reviewedOn?: string | null;
    breadcrumbs?: { name: string; path: string }[];
  },
): JsonLd {
  const url = `${SITE.url}${localePath(locale, page.path)}`;
  const language = locale === 'es' ? 'es-419' : 'en-US';

  const nodes: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: SITE.name,
      inLanguage: language,
      publisher: { '@id': `${SITE.url}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: language,
      isPartOf: { '@id': `${SITE.url}/#website` },
      about: { '@id': `${SITE.url}/#organization` },
      // Only stated when the page actually shows a review date, so the markup
      // cannot claim a review the visible page does not display (section 7:
      // "All marked-up facts must also appear in visible page content").
      ...(page.reviewedOn != null ? { dateModified: page.reviewedOn } : {}),
      ...(page.breadcrumbs !== undefined && page.breadcrumbs.length > 0
        ? { breadcrumb: { '@id': `${url}#breadcrumb` } }
        : {}),
    },
  ];

  if (page.breadcrumbs !== undefined && page.breadcrumbs.length > 0) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${SITE.url}${localePath(locale, crumb.path)}`,
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': nodes };
}

/**
 * Service schema for the three service pages (handoff section 7).
 *
 * `areaServed` is built from the coverage regions the site already publishes,
 * not from an aspirational list: the handoff forbids claiming service areas
 * that operations has not confirmed, and these are the same four regions the
 * visible Focused Coverage copy names.
 *
 * NO `offers`, NO `aggregateRating`, NO `Review`. Pricing is not published, and
 * the handoff explicitly bars rating markup built from testimonials.
 */
export function serviceJsonLd(
  locale: Locale,
  service: { path: string; title: string; description: string },
  areaServed: readonly string[],
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE.url}${localePath(locale, service.path)}#service`,
    name: service.title,
    description: service.description,
    serviceType: 'Air ambulance transport coordination',
    url: `${SITE.url}${localePath(locale, service.path)}`,
    provider: {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: `${SITE.url}/`,
    },
    areaServed: areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
  };
}

/**
 * FAQPage, generated from the page's own visible FAQ blocks.
 *
 * The handoff's rule is "mark up only visible questions and answers" and "do
 * not use FAQ schema as a ranking trick". Generating from the rendered block
 * is what makes that structurally true rather than a promise: a question that
 * is not on the page cannot reach this function.
 *
 * Returns null when the page has no FAQ block, so callers emit nothing rather
 * than an empty FAQPage.
 */
export function faqPageJsonLd(
  locale: Locale,
  path: string,
  items: readonly { question: string; answer: string }[],
): JsonLd | null {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE.url}${localePath(locale, path)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
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
 * Serializes JSON-LD for a `<script type="application/ld+json">` tag.
 *
 * `<` is escaped so a value containing `</script>` cannot break out of the
 * script element - the standard XSS vector for JSON embedded in HTML. Values
 * here are authored, but the escape is unconditional because the next
 * contributor's values might not be.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
