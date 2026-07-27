import Link from 'next/link';
import type { PageContent } from '@/content/blocks';
import { localePath, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/content/dictionary';
import { ContactBlock } from '@/components/ContactBlock';
import { PageHeader } from '@/components/PageHeader';
import { Container, Section } from '@/components/ui/Container';

/**
 * Section landing page.
 *
 * Section 19 requires "descriptive internal links" and warns against thin pages.
 * A hub that lists only titles is thin; each card here carries the child page's
 * own intro, so the hub is genuinely useful for choosing where to go and is not
 * merely a duplicate of the navigation menu.
 */
export function HubPage({
  locale,
  title,
  intro,
  pages,
  breadcrumbs = [],
  extraLinks = [],
}: {
  locale: Locale;
  title: string;
  intro: string;
  pages: readonly PageContent[];
  breadcrumbs?: { name: string; path: string }[];
  /** Links to routes that are not block-based content pages. */
  extraLinks?: { path: string; title: string; intro: string }[];
}) {
  const dictionary = getDictionary(locale);

  const cards = [
    ...pages.map((page) => ({ path: page.path, title: page.title, intro: page.intro })),
    ...extraLinks,
  ];

  return (
    <>
      <PageHeader
        locale={locale}
        title={title}
        intro={intro}
        breadcrumbs={[{ name: dictionary.common.home, path: '/' }, ...breadcrumbs]}
      />

      <Section>
        <Container>
          <ul className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <li key={card.path}>
                <Link
                  href={localePath(locale, card.path)}
                  className="flex h-full flex-col rounded-panel border border-ink-300 bg-white p-6 transition-colors hover:border-navy-800 hover:bg-support-50"
                >
                  <span className="text-xl font-bold text-navy-900">{card.title}</span>
                  <span className="mt-2 text-ink-700">{card.intro}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactBlock locale={locale} />
    </>
  );
}
