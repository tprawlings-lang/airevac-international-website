import Link from 'next/link';
import { getDictionary } from '@/content/dictionary';
import { buildLegalNavigation, buildNavigation } from '@/content/navigation';
import { SITE } from '@/content/site';
import { localePath, type Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';

/**
 * Blueprint page 9, final contact block: "Call, secure chat, callback, Fort
 * Lauderdale address."
 *
 * The address is the one confirmed by the FXE airport directory [S4], not the
 * Scottsdale address that appears in the legacy WordPress privacy policy [S11].
 * That mismatch is one of the findings section 12 records; publishing the
 * verified address here is part of closing it.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const navigation = buildNavigation(dictionary);
  const legal = buildLegalNavigation();

  return (
    <footer className="on-navy bg-navy-900 text-white">
      <Container>
        <div className="py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* --- Contact ------------------------------------------------ */}
            <div>
              <h2 className="mb-3 text-lg font-bold">{SITE.name}</h2>

              <p className="mb-4">
                <a href={SITE.phone.href} className="text-xl font-bold underline underline-offset-4">
                  {SITE.phone.display}
                </a>
                <span className="mt-1 block text-sm text-white/80">
                  {dictionary.common.call24_7}
                </span>
              </p>

              {/* Address matches the airport directory record [S4]. */}
              <address className="text-sm not-italic leading-relaxed text-white/85">
                {SITE.base.name}
                <br />
                {SITE.base.street}
                <br />
                {SITE.base.locality}, {SITE.base.region} {SITE.base.postalCode}
              </address>
            </div>

            {/* --- Sitemap ------------------------------------------------ */}
            {navigation.slice(0, 3).map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/70">
                  {group.label}
                </h2>
                <ul className="space-y-2 text-sm">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={localePath(locale, link.href)}
                        className="inline-block py-1 text-white/90 hover:text-white hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* --- Governance -------------------------------------------- */}
          <div className="mt-12 border-t border-white/20 pt-6">
            <nav aria-label={dictionary.nav.legal}>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={localePath(locale, link.href)}
                      className="inline-block py-1 text-white/85 underline underline-offset-4 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <p className="mt-6 text-xs leading-relaxed text-white/70">
              {locale === 'es'
                ? 'AirEvac International coordina transporte médico aéreo. Este sitio no ofrece ' +
                  'asesoramiento médico ni garantiza cobertura del seguro. La viabilidad del ' +
                  'transporte la determina el equipo médico y de operaciones para cada caso.'
                : 'AirEvac International coordinates air medical transport. This site does not ' +
                  'provide medical advice and does not guarantee insurance coverage. Transport ' +
                  'feasibility is determined by the medical and operations team for each case.'}
            </p>

            <p className="mt-3 text-xs text-white/60">
              © {new Date().getUTCFullYear()} {SITE.name}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
