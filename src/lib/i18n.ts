/**
 * Blueprint section 3 (URL rules) and section 18 (Customization):
 *   "English is the canonical content set. Spanish pages receive human review,
 *    their own metadata, and proper hreflang tags."
 *
 * Locale is a path prefix, never a cookie-driven redirect: a coordinator sending
 * a hospital a link must be able to guarantee which language opens.
 */

export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

/** English is canonical. Spanish is a reviewed translation of it. */
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 tags used for `lang`, `hreflang`, and Open Graph. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-419',
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

/**
 * Locale-aware path builder.
 *
 * `path` is always the canonical English route (e.g. `/services/air-ambulance`).
 * Route *slugs* are deliberately not translated: section 3 requires "short,
 * stable URLs", and translated slugs double the redirect map and break inbound
 * links every time a translation is revised.
 */
export function localePath(locale: Locale, path: string): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/** Strips the locale prefix, returning the canonical path. */
export function stripLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first !== undefined && isLocale(first)) {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }
  return pathname === '' ? '/' : pathname;
}

/**
 * Formats a date for display in the given locale.
 *
 * Always renders in UTC. Credential expiry dates are legal facts, not local
 * events - rendering "Aug 25, 2027" as "Aug 24" for a viewer west of UTC would
 * misstate a certificate.
 */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-419' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
