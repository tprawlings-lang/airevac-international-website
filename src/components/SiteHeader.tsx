import Link from 'next/link';
import { getDictionary } from '@/content/dictionary';
import { buildNavigation } from '@/content/navigation';
import { SITE } from '@/content/site';
import { localePath, LOCALE_LABEL, LOCALES, type Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { CtaLink } from '@/components/ui/Cta';
import { NavMenu } from '@/components/NavMenu';

/**
 * Blueprint page 9, the 24/7 contact bar: "Phone, EN/ES, secure chat", sitting
 * above the hero on every page.
 *
 * NAVIGATION IS A SERVER COMPONENT WITH NO JAVASCRIPT.
 * The full menu is disclosed with a `<details>` element on small screens rather
 * than a React state toggle. Page 20 requires the page to remain usable when
 * scripts fail, and `<details>` is keyboard-accessible, screen-reader-announced,
 * and works with JS disabled. It also keeps the header off the hydration path,
 * which protects the INP budget on page 21.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const navigation = buildNavigation(dictionary);

  return (
    <header className="no-print">
      {/* --- 24/7 contact bar ------------------------------------------- */}
      <div className="on-navy bg-navy-950 text-white">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2 text-sm">
            <a
              href={SITE.phone.href}
              className="inline-flex min-h-[44px] items-center gap-2 font-semibold"
            >
              <span aria-hidden="true">☎</span>
              <span>
                {dictionary.common.call24_7}:{' '}
                <span className="underline underline-offset-4">{SITE.phone.display}</span>
              </span>
            </a>

            <nav aria-label={dictionary.common.languageSwitch} className="flex items-center gap-1">
              {LOCALES.map((candidate) => {
                const isCurrent = candidate === locale;
                return (
                  <Link
                    key={candidate}
                    href={localePath(candidate, '/')}
                    hrefLang={candidate}
                    lang={candidate}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`inline-flex min-h-[44px] items-center px-3 ${
                      isCurrent ? 'font-semibold underline underline-offset-4' : 'hover:underline'
                    }`}
                  >
                    {LOCALE_LABEL[candidate]}
                  </Link>
                );
              })}
            </nav>
          </div>
        </Container>
      </div>

      {/* --- Primary navigation ------------------------------------------ */}
      <div className="border-b border-ink-300 bg-white">
        <Container>
          <div className="flex items-center justify-between gap-4 py-3">
            <Link
              href={localePath(locale, '/')}
              className="flex flex-col leading-tight"
              aria-label={`${SITE.name} — ${dictionary.common.home}`}
            >
              <span className="text-xl font-bold tracking-tight text-navy-900">
                AirEvac
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-ink-500">
                International
              </span>
            </Link>

            {/* Desktop navigation.
                Interactive (hover intent, click, 10s idle close, Escape) so it
                lives in NavMenu, the only client component in the header. The
                mobile disclosure below stays script-free. */}
            <nav aria-label="Main" className="hidden lg:block">
              <NavMenu groups={navigation} locale={locale} />
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <CtaLink href={localePath(locale, '/request-transport')} variant="primary">
                {dictionary.common.requestTransport}
              </CtaLink>
            </div>

            {/* Mobile disclosure */}
            <details className="lg:hidden">
              <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded border border-navy-800 px-4 py-2 font-semibold text-navy-900">
                <span aria-hidden="true">☰</span>
                {dictionary.common.menu}
              </summary>
              <nav
                aria-label="Main"
                className="absolute left-0 right-0 z-30 border-b border-ink-300 bg-white px-4 py-4 shadow-lg"
              >
                <ul className="space-y-4">
                  {navigation.map((group) => (
                    <li key={group.label}>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-500">
                        {group.label}
                      </p>
                      <ul className="space-y-1">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={localePath(locale, link.href)}
                              className="block min-h-[44px] py-2 text-ink-900"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          </div>
        </Container>
      </div>
    </header>
  );
}
