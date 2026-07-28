import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { ContentBlocks } from '@/components/ContentBlocks';
import { PageHeader } from '@/components/PageHeader';
import { TranslationPendingNotice } from '@/components/TranslationPendingNotice';
import { Container, Section } from '@/components/ui/Container';
import { getDictionary } from '@/content/dictionary';
import { PRIORITY_ROUTES } from '@/content/navigation';
import { buildRouteBlocks, findRegion, findRoute, routesInRegion } from '@/content/pages/coverage';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Priority route pages. Blueprint page 8:
 *   "Cancun, Cozumel, Cabo, Puerto Vallarta, Bahamas, Dominican Republic,
 *    Jamaica, Turks and Caicos, Cayman, Belize, Costa Rica, Honduras - Capture
 *    real demand with local operational detail."
 *
 * And the rule that constrains them:
 *   "Do not build thin pages for every state, city, airport, island, or
 *    diagnosis. Each indexable page must add local or audience-specific utility."
 *
 * Each page is composed from that route's own departure airports and receiving
 * corridor, so the operational detail is genuinely local. A route with nothing
 * specific to say should be removed from PRIORITY_ROUTES rather than published.
 */

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    PRIORITY_ROUTES.map((route) => ({
      locale,
      region: route.region,
      route: route.slug,
    })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string; route: string }>;
}): Promise<Metadata> {
  const { locale, region, route: routeSlug } = await params;
  const route = findRoute(region, routeSlug);
  if (!isLocale(locale) || route === undefined) return {};

  const path = `/coverage/${region}/${routeSlug}`;

  return {
    title: `Air Ambulance from ${route.name}`,
    description:
      `Medical transport from ${route.name} to ${route.commonDestinations}. Departure ` +
      `airports, receiving coordination, and the factors that drive timing on this route.`,
    alternates: {
      canonical: localePath(locale, path),
      languages: {
        'en-US': localePath('en', path),
        'es-419': localePath('es', path),
        'x-default': localePath('en', path),
      },
    },
  };
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ locale: string; region: string; route: string }>;
}) {
  const { locale, region, route: routeSlug } = await params;
  if (!isLocale(locale)) notFound();

  const route = findRoute(region, routeSlug);
  const regionContent = findRegion(region);
  if (route === undefined || regionContent === undefined) notFound();

  const dictionary = getDictionary(locale);
  const path = `/coverage/${region}/${routeSlug}`;
  const title = `Air Ambulance from ${route.name}`;

  // Spanish gate: operational logistics content (page 24).
  const renderable = locale === 'en';

  const nonce = await getNonce();

  // Sibling routes, for internal linking within the region.
  const siblings = routesInRegion(regionContent.slug).filter((item) => item.slug !== route.slug);

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd(locale, [
              { name: dictionary.common.home, path: '/' },
              { name: dictionary.nav.coverage, path: '/coverage' },
              { name: regionContent.name, path: `/coverage/${regionContent.slug}` },
              { name: route.name, path },
            ]),
          ),
        }}
      />

      <PageHeader
        locale={locale}
        title={title}
        intro={`Transports from ${route.name} to ${route.commonDestinations}.`}
        breadcrumbs={[
          { name: dictionary.common.home, path: '/' },
          { name: dictionary.nav.coverage, path: '/coverage' },
          { name: regionContent.name, path: `/coverage/${regionContent.slug}` },
        ]}
      />

      <Section>
        <Container width="narrow">
          {renderable ? (
            <ContentBlocks blocks={buildRouteBlocks(route, regionContent.name)} />
          ) : (
            <TranslationPendingNotice locale={locale} englishPath={path} />
          )}

          <p className="mt-8">
            <Link
              href={localePath(locale, `/coverage/${regionContent.slug}`)}
              className="font-semibold text-support-700 underline underline-offset-4"
            >
              {regionContent.title} →
            </Link>
          </p>
        </Container>
      </Section>

      {siblings.length > 0 && (
        <Section tone="tint" ariaLabelledBy="sibling-routes-heading">
          <Container>
            <h2 id="sibling-routes-heading" className="text-2xl font-bold text-navy-900">
              {locale === 'es' ? 'Otras rutas en la región' : 'Other routes in this region'}
            </h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              {siblings.map((sibling) => (
                <li key={sibling.slug}>
                  <Link
                    href={localePath(locale, `/coverage/${sibling.region}/${sibling.slug}`)}
                    className="inline-flex min-h-[44px] items-center rounded-panel border border-ink-300 bg-white px-4 py-2 font-semibold text-navy-900 hover:border-navy-800"
                  >
                    {sibling.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <ContactBlock locale={locale} />
    </>
  );
}
