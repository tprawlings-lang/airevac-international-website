import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentPage, contentPageMetadata } from '@/components/ContentPage';
import { GLOSSARY_PAGE } from '@/content/pages/glossary';
import { getDictionary } from '@/content/dictionary';
import { isLocale, LOCALES } from '@/lib/i18n';
import { definedTermSetJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';

/**
 * Glossary. See src/content/pages/glossary.ts for why this page exists.
 *
 * It carries `DefinedTermSet` markup in addition to the standard page graph.
 * That is the schema type built for exactly this: a set of terms with
 * definitions, each addressable by its own URL fragment. An answer engine
 * asked "what is bed acceptance" can resolve a single term rather than being
 * handed a page and left to find it.
 */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return contentPageMetadata(GLOSSARY_PAGE, locale);
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = getDictionary(locale);
  const nonce = await getNonce();

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(definedTermSetJsonLd(locale, GLOSSARY_PAGE)),
        }}
      />

      <ContentPage
        page={GLOSSARY_PAGE}
        locale={locale}
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }]}
      />
    </>
  );
}
