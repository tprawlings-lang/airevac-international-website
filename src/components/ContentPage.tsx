import { canRenderLocale, type PageContent } from '@/content/blocks';
import { getDictionary } from '@/content/dictionary';
import { formatDate, localePath, type Locale } from '@/lib/i18n';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { Container, Section } from '@/components/ui/Container';
import { ContentBlocks } from '@/components/ContentBlocks';
import { ContactBlock } from '@/components/ContactBlock';
import { PageHeader } from '@/components/PageHeader';
import { Photo } from '@/components/graphics/Photo';
import { TranslationPendingNotice } from '@/components/TranslationPendingNotice';
import { getNonce } from '@/lib/nonce';

/**
 * Standard content page template.
 *
 * Every template in blueprint section 5 ends with "Contact", so `ContactBlock`
 * is appended here rather than left to each page — a content page with no way to
 * reach a coordinator is a dead end, and the conversion hierarchy on page 7
 * applies to every page, not just the homepage.
 *
 * This component also enforces the two content-governance rules:
 *   1. The Spanish gate (`canRenderLocale`) — page 24.
 *   2. The reviewer byline — section 19 requires "Named authors and qualified
 *      reviewers for medical, billing, insurance, and patient-rights content"
 *      with a visible review date and correction path.
 */
/**
 * Lead image per content page. Only pages where a photograph genuinely adds
 * something appear here — a privacy notice does not want an aircraft above it.
 */
const LEAD_IMAGES: Record<string, 'aircraftRampFront' | 'aircraftHangar' | 'aircraftEngineDetail'> = {
  '/about': 'aircraftRampFront',
  '/about/why-airevac': 'aircraftEngineDetail',
};

export async function ContentPage({
  page,
  locale,
  breadcrumbs = [],
}: {
  page: PageContent;
  locale: Locale;
  breadcrumbs?: { name: string; path: string }[];
}) {
  const dictionary = getDictionary(locale);
  const renderable = canRenderLocale(page, locale);

  const isSpanishApproved = locale === 'es' && page.esReviewedOn !== null;
  const title = isSpanishApproved && page.esTitle !== undefined ? page.esTitle : page.title;
  const intro = isSpanishApproved && page.esIntro !== undefined ? page.esIntro : page.intro;
  const blocks = isSpanishApproved && page.esBlocks !== undefined ? page.esBlocks : page.blocks;

  /**
   * Content whose accuracy depends on a named reviewer. `general` pages
   * (navigation copy, accessibility statement) do not carry clinical, billing,
   * or legal assertions and therefore do not need one.
   */
  const needsReviewer = page.contentClass !== 'general';

  const nonce = await getNonce();

  return (
    <>
      {breadcrumbs.length > 0 && (
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              breadcrumbJsonLd(locale, [...breadcrumbs, { name: page.title, path: page.path }]),
            ),
          }}
        />
      )}

      <PageHeader locale={locale} title={title} intro={intro} breadcrumbs={breadcrumbs} />

      <Section>
        <Container width="narrow">
          {!renderable ? (
            <TranslationPendingNotice locale={locale} englishPath={page.path} />
          ) : (
            <>
              {/*
               * Review state, shown BEFORE the content rather than in a footer.
               * A reader deciding how much weight to give a medical or billing
               * page should know its review status before reading it, not after.
               */}
              {needsReviewer &&
                (page.reviewer === null ? (
                  <p className="mb-8 rounded-panel border border-ink-300 bg-support-50 px-4 py-3 text-sm text-ink-700">
                    <strong className="font-semibold text-navy-900">
                      {locale === 'es' ? 'En revisión. ' : 'Under review. '}
                    </strong>
                    {locale === 'es'
                      ? 'Esta página aún no ha sido aprobada por un revisor calificado. Para ' +
                        'obtener información confirmada sobre su caso, llame a un coordinador de vuelo.'
                      : 'This page has not yet been signed off by a qualified reviewer. For ' +
                        'confirmed information about your case, call a flight coordinator.'}
                  </p>
                ) : (
                  <p className="mb-8 text-sm text-ink-500">
                    {locale === 'es' ? 'Revisado por' : 'Reviewed by'}{' '}
                    <strong className="font-semibold text-ink-900">
                      {page.reviewer.name}
                    </strong>
                    , {page.reviewer.role}
                    {page.reviewedOn !== null && (
                      <>
                        {' · '}
                        {dictionary.common.lastReviewed} {formatDate(page.reviewedOn, locale)}
                      </>
                    )}
                  </p>
                ))}

              {/* One lead image, only where the registry names one for this
                  page. Content pages are mostly long-form and do not want
                  decoration between every heading. */}
              {LEAD_IMAGES[page.path] !== undefined && (
                <Photo
                  id={LEAD_IMAGES[page.path]!}
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="mb-8 aspect-[16/8] w-full rounded-panel object-cover"
                />
              )}

              <ContentBlocks blocks={blocks} />
            </>
          )}
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}

/**
 * Builds the localized metadata object for a content page.
 *
 * Centralised so that canonical URL and hreflang are consistent across every
 * page — section 19 requires both, and getting hreflang subtly wrong on a
 * bilingual site is a classic way to have the wrong language indexed.
 */
export function contentPageMetadata(page: PageContent, locale: Locale) {
  const isSpanishApproved = locale === 'es' && page.esReviewedOn !== null;

  return {
    title: isSpanishApproved && page.esTitle !== undefined ? page.esTitle : page.title,
    description: page.description,
    alternates: {
      canonical: localePath(locale, page.path),
      languages: {
        'en-US': localePath('en', page.path),
        'es-419': localePath('es', page.path),
        'x-default': localePath('en', page.path),
      },
    },
  };
}
