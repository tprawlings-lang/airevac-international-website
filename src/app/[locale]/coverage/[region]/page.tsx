import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { ContentBlocks } from '@/components/ContentBlocks';
import { PageHeader } from '@/components/PageHeader';
import { TranslationPendingNotice } from '@/components/TranslationPendingNotice';
import { Container, Section } from '@/components/ui/Container';
import { getDictionary } from '@/content/dictionary';
import { COVERAGE_REGIONS } from '@/content/navigation';
import { findRegion, routesInRegion } from '@/content/pages/coverage';
import { isLocale, localePath, LOCALES } from '@/lib/i18n';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Regional coverage pages. Blueprint page 11, "Coverage" template:
 *   "Route context | Common origin points | Receiving coordination | Documents |
 *    Timing factors | Cost factors | Related routes | Contact"
 *
 * NO OPERATING-AUTHORITY CLAIM APPEARS ON THESE PAGES. D6 (state licences and
 * marketed-base authority) is open, so coverage pages describe process,
 * logistics, and the factors that drive timing - never a claim to be licensed
 * or authorized in a particular jurisdiction.
 *
 * Coverage content describes operational and clinical logistics, so Spanish is
 * gated on human review (D11).
 */

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    COVERAGE_REGIONS.map((region) => ({ locale, region: region.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}): Promise<Metadata> {
  const { locale, region } = await params;
  const content = findRegion(region);
  if (!isLocale(locale) || content === undefined) return {};

  const path = `/coverage/${content.slug}`;

  return {
    title: content.title,
    description: content.description,
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

export default async function CoverageRegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const { locale, region } = await params;
  if (!isLocale(locale)) notFound();

  const content = findRegion(region);
  if (content === undefined) notFound();

  const dictionary = getDictionary(locale);
  const routes = routesInRegion(content.slug);
  const path = `/coverage/${content.slug}`;

  // Spanish gate: operational and clinical logistics content (page 24).
  const renderable = locale === 'en';

  const nonce = await getNonce();

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
              { name: content.name, path },
            ]),
          ),
        }}
      />

      <PageHeader
        locale={locale}
        title={content.title}
        intro={content.intro}
        breadcrumbs={[
          { name: dictionary.common.home, path: '/' },
          { name: dictionary.nav.coverage, path: '/coverage' },
        ]}
      />

      <Section>
        <Container width="narrow">
          {renderable ? (
            <ContentBlocks blocks={content.blocks} />
          ) : (
            <TranslationPendingNotice locale={locale} englishPath={path} />
          )}
        </Container>
      </Section>

      {/* Related routes - the "Related routes" block from the page 11 template. */}
      {routes.length > 0 && (
        <Section tone="tint" ariaLabelledBy="related-routes-heading">
          <Container>
            <h2 id="related-routes-heading" className="text-2xl font-bold text-navy-900">
              {locale === 'es' ? 'Rutas en esta región' : 'Routes in this region'}
            </h2>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {routes.map((route) => (
                <li key={route.slug}>
                  <Link
                    href={localePath(locale, `${path}/${route.slug}`)}
                    className="flex h-full flex-col rounded-panel border border-ink-300 bg-white p-5 hover:border-navy-800"
                  >
                    <span className="text-lg font-bold text-navy-900">{route.name}</span>
                    {/*
                     * Departure airports are shown on the card, not just the
                     * page name. Section 19 asks for descriptive internal links,
                     * and for a coordinator scanning this list the airport code
                     * is the identifying detail.
                     */}
                    <span className="mt-2 text-sm text-ink-700">
                      {route.airports.join(' · ')}
                    </span>
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
