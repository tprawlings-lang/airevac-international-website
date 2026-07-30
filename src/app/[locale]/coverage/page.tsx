import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactBlock } from '@/components/ContactBlock';
import { PageGraph } from '@/components/PageGraph';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';
import { getDictionary } from '@/content/dictionary';
import { REGION_CONTENT } from '@/content/pages/coverage';
import { PRIORITY_ROUTES } from '@/content/navigation';
import { isLocale, localePath, LOCALES, type Locale } from '@/lib/i18n';
import { CoverageMap } from '@/components/graphics/CoverageMap';

/**
 * Coverage hub. Blueprint page 8, "Coverage pillar" template: "Mexico,
 * Caribbean, Central America, United States - Organize route content and
 * internal links."
 *
 * The hub's job is internal linking, so each region lists its routes inline
 * rather than hiding them one click deeper. That gives every route page a link
 * from a page one hop off the homepage, which is what makes them discoverable.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Title and description, defined once and used by both the page metadata and
 * the structured-data graph. Two copies of these strings is how a page ends up
 * telling a crawler one thing in its <title> and another in its JSON-LD.
 */
function coverageMeta(locale: Locale) {
  return {
    title: locale === 'es' ? 'Cobertura' : 'Coverage',
    description: locale === 'es'
        ? 'Regiones y rutas donde AirEvac International coordina transporte médico aéreo: ' +
          'México, el Caribe, Centroamérica y Estados Unidos.'
        : 'Regions and routes where AirEvac International coordinates air medical transport: ' +
          'Mexico, the Caribbean, Central America, and the United States.',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    ...coverageMeta(locale),
    alternates: {
      canonical: localePath(locale, '/coverage'),
      languages: {
        'en-US': localePath('en', '/coverage'),
        'es-419': localePath('es', '/coverage'),
        'x-default': localePath('en', '/coverage'),
      },
    },
  };
}

export default async function CoverageHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);

  return (
    <>
      <PageGraph
        locale={locale}
        path={'/coverage'}
        {...coverageMeta(locale)}
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <PageHeader
        locale={locale}
        title={dictionary.nav.coverage}
        intro={
          locale === 'es'
            ? 'Dónde operamos, y qué determina el tiempo en cada región.'
            : 'Where we operate, and what drives the timeline in each region.'
        }
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />

      <Section>
        <Container>
          <CoverageMap locale={locale} className="mb-12 text-navy-900" />

          {/*
           * The WHOLE region card is the link (AEI handoff, Section 13: "Use
           * real links or router links on the complete card, not a click
           * handler attached only to the card title"). The AEI review found the
           * region cards unresponsive because only the title text was
           * clickable; the card body did nothing. Route chips sit outside the
           * card link so nested anchors never occur.
           */}
          <div className="space-y-8">
            {[
              ...REGION_CONTENT.map((region) => ({
                slug: region.slug,
                title: region.title,
                intro: region.intro,
                href: `/coverage/${region.slug}`,
              })),
              {
                slug: 'other-destinations',
                title: locale === 'es' ? 'Otros destinos' : 'Other Destinations',
                intro:
                  locale === 'es'
                    ? 'Otras rutas nacionales e internacionales, revisadas caso por caso.'
                    : 'Other domestic and international routes, reviewed case by case.',
                href: '/coverage/other-destinations',
              },
            ].map((card) => {
              const routes = PRIORITY_ROUTES.filter((route) => route.region === card.slug);

              return (
                <div key={card.slug}>
                  <Link
                    href={localePath(locale, card.href)}
                    className="block rounded-panel border border-ink-300 bg-white p-6 transition-colors hover:border-navy-800 hover:bg-support-50"
                  >
                    <span className="text-2xl font-bold text-navy-900">{card.title}</span>
                    <span className="mt-2 block max-w-3xl text-ink-700">{card.intro}</span>
                  </Link>

                  {routes.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {routes.map((route) => (
                        <li key={route.slug}>
                          <Link
                            href={localePath(locale, `/coverage/${route.region}/${route.slug}`)}
                            className="inline-flex min-h-[44px] items-center rounded-panel border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:border-navy-800 hover:bg-support-50"
                          >
                            {route.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/*
           * The honest boundary. Page 8 forbids mass location pages, and a
           * coverage hub that implies unlimited reach invites exactly the
           * misleading-availability claim section 12 prohibits under the FTC Act.
           */}
          <p className="mt-12 max-w-3xl rounded-panel border border-ink-300 bg-support-50 p-5 text-ink-700">
            {locale === 'es'
              ? 'Estas son las regiones donde trabajamos con mayor frecuencia, no una lista ' +
                'exhaustiva. Otras rutas nacionales e internacionales se revisan caso por caso: ' +
                'consulte la página Otros destinos, llame o escríbanos.'
              : 'These are the regions we work in most, not an exhaustive list. If your route ' +
                'is not shown, it is reviewed case by case: see the Other Destinations page, ' +
                'or call or email our coordinators.'}
          </p>
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}
