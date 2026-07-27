import Link from 'next/link';
import { Container, Section } from '@/components/ui/Container';
import { PhoneCta } from '@/components/ui/Cta';
import { SITE } from '@/content/site';

/**
 * 404 page.
 *
 * Blueprint page 20, graceful degradation: "If CMS, chat, CRM, translation,
 * analytics, or map fails, the page still loads and the phone remains usable."
 * A 404 is the most common way a visitor ends up somewhere unintended — often
 * from a stale link in a referral email — so the phone number is the first thing
 * on it, not an afterthought.
 *
 * `notFound()` is called before the locale is known in some paths, so this page
 * renders bilingually rather than guessing.
 */
export default function NotFound() {
  return (
    <Section>
      <Container width="narrow">
        <h1 className="text-3xl font-bold text-navy-900">
          Page not found · Página no encontrada
        </h1>

        <p className="mt-4 text-lg text-ink-700">
          The page you are looking for does not exist or has moved.
        </p>
        <p className="mt-2 text-lg text-ink-700" lang="es">
          La página que busca no existe o ha sido movida.
        </p>

        <div className="mt-8 rounded-panel border-2 border-urgent-600 bg-urgent-50 p-6">
          <h2 className="text-xl font-bold text-navy-900">
            If you need a transport now
          </h2>
          <p className="mt-2 text-ink-900">
            Flight coordinators are available 24 hours a day at {SITE.phone.display}.
          </p>
          <PhoneCta label="Call a Flight Coordinator" className="mt-4" />
        </div>

        <nav aria-label="Suggested pages" className="mt-10">
          <h2 className="text-lg font-bold text-navy-900">Try one of these</h2>
          <ul className="mt-3 space-y-2">
            {[
              { href: '/en', label: 'Home · Inicio' },
              { href: '/en/partners/hospitals', label: 'Hospitals and Case Managers' },
              { href: '/en/partners/cruise', label: 'Cruise and Maritime' },
              { href: '/en/patients-families', label: 'Patients and Families' },
              { href: '/en/coverage', label: 'Coverage' },
              { href: '/en/contact', label: 'Contact' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center text-support-700 underline underline-offset-4 hover:text-navy-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </Section>
  );
}
