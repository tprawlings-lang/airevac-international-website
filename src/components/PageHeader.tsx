import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Standard page header. Section 19: "One clear H1, unique title and description,
 * canonical URL, breadcrumb, descriptive internal links."
 *
 * The H1 lives here so every template gets exactly one, and the breadcrumb is
 * rendered as a real `<nav>` with `aria-current` on the final crumb.
 */
export function PageHeader({
  locale,
  title,
  intro,
  breadcrumbs = [],
  tone = 'navy',
}: {
  locale: Locale;
  title: string;
  intro?: string;
  /** Ancestors only — the current page is appended automatically. */
  breadcrumbs?: { name: string; path: string }[];
  tone?: 'navy' | 'paper';
}) {
  const isNavy = tone === 'navy';

  return (
    <div
      className={
        isNavy
          ? 'on-navy bg-navy-900 py-12 text-white sm:py-16'
          : 'border-b border-ink-300 bg-white py-10'
      }
    >
      <Container>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              {breadcrumbs.map((crumb) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  <Link
                    href={localePath(locale, crumb.path)}
                    className={`underline underline-offset-4 ${
                      isNavy ? 'text-white/85 hover:text-white' : 'text-support-700'
                    }`}
                  >
                    {crumb.name}
                  </Link>
                  <span aria-hidden="true" className={isNavy ? 'text-white/50' : 'text-ink-300'}>
                    /
                  </span>
                </li>
              ))}
              <li aria-current="page" className={isNavy ? 'text-white/70' : 'text-ink-500'}>
                {title}
              </li>
            </ol>
          </nav>
        )}

        <h1
          className={`max-w-4xl text-3xl font-bold leading-tight sm:text-4xl ${
            isNavy ? 'text-white' : 'text-navy-900'
          }`}
        >
          {title}
        </h1>

        {intro !== undefined && (
          <p
            className={`mt-4 max-w-3xl text-lg leading-relaxed ${
              isNavy ? 'text-white/90' : 'text-ink-700'
            }`}
          >
            {intro}
          </p>
        )}
      </Container>
    </div>
  );
}
