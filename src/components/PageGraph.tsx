import { faqPageJsonLd, pageGraphJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { getNonce } from '@/lib/nonce';
import type { Locale } from '@/lib/i18n';

/**
 * The WebSite + WebPage + BreadcrumbList graph every public page carries,
 * per the AI Search Coding Handoff section 7 ("All pages: WebSite, WebPage,
 * BreadcrumbList") and its section 12 deliverable, "reusable JSON-LD
 * components and schema generators".
 *
 * WHY A COMPONENT RATHER THAN A CALL IN EACH PAGE. Every emission needs the
 * CSP nonce, and `getNonce()` is async. Inlining that in a dozen pages is a
 * dozen chances to forget the nonce and have the browser silently drop the
 * markup - which would be invisible in review and only surface as missing
 * structured data weeks later in Search Console.
 *
 * `faqItems` is optional and must be passed from the page's own visible
 * questions. The handoff's rule is "mark up only visible questions and
 * answers"; passing anything a reader cannot see on the page violates it.
 */
export async function PageGraph({
  locale,
  path,
  title,
  description,
  reviewedOn = null,
  breadcrumbs,
  faqItems = [],
}: {
  locale: Locale;
  /** Canonical English path, without the locale prefix. */
  path: string;
  title: string;
  description: string;
  reviewedOn?: string | null;
  breadcrumbs?: { name: string; path: string }[];
  faqItems?: readonly { question: string; answer: string }[];
}) {
  const nonce = await getNonce();
  const faqGraph = faqPageJsonLd(locale, path, faqItems);

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            pageGraphJsonLd(locale, { path, title, description, reviewedOn, breadcrumbs }),
          ),
        }}
      />

      {faqGraph !== null && (
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqGraph) }}
        />
      )}
    </>
  );
}
