import { SITE } from '@/content/site';
import { COVERAGE_REGIONS, PRIORITY_ROUTES } from '@/content/navigation';
import { ALL_CONTENT_PAGES } from '@/lib/page-registry';
import { CREDENTIAL_REGISTER } from '@/content/credentials';
import { publishable } from '@/lib/credential-register';

/**
 * llms.txt: a plain-text map of the site for AI systems.
 *
 * WHAT IT IS. An emerging convention (llmstxt.org) for a Markdown file at
 * /llms.txt that tells a language model what a site contains and where the
 * authoritative pages are, without making it infer structure from navigation
 * markup. It is not a standard any engine is obliged to read, and no engine
 * treats it as a ranking signal. It is cheap, and when it is read it makes the
 * difference between a model summarizing the right page and guessing.
 *
 * WHY IT IS GENERATED, NOT WRITTEN BY HAND. A hand-written version drifts the
 * first time a page is renamed, and a stale map is worse than none: it points a
 * model at URLs that 404 and describes services that no longer exist. Every
 * line below is derived from the same registries the pages render from.
 *
 * THE CLAIM GATE APPLIES HERE TOO. Accreditations pass through `publishable()`
 * exactly as they do on the page and in the JSON-LD, so a held credential is
 * absent from all three. A file that told an AI system about a credential the
 * website itself withholds would be the most direct way imaginable to have an
 * unapproved claim repeated at scale.
 */

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const now = new Date();

  const accreditations = CREDENTIAL_REGISTER.filter(
    (record) => record.category === 'accreditation' && publishable(record, now),
  );

  const lines: string[] = [
    `# ${SITE.name}`,
    '',
    '> Air ambulance transport coordination from Mexico, the Caribbean, Central America, ' +
      'and the United States, operating from a base at Fort Lauderdale Executive Airport ' +
      '(KFXE). Referrals come from hospitals, cruise and maritime teams, insurers, and ' +
      'families.',
    '',
    '## Contact',
    '',
    `- Phone, 24/7: ${SITE.phone.display}`,
    `- Email: ${SITE.email.display}`,
    `- Clinical records by email or fax: ${SITE.fax.display}`,
    `- Operating base: ${SITE.base.name}, ${SITE.base.locality}, ${SITE.base.region}`,
    '',
    '## What this organization does and does not claim',
    '',
    '- AirEvac coordinates air medical transport directly, with no broker in between.',
    '- The current working fleet is two Learjet 31A aircraft.',
    '- AirEvac cannot guarantee aircraft availability, departure timing, insurance ' +
      'payment, or acceptance by a receiving facility.',
    '- Coverage outside the regions below is reviewed case by case.',
    '- This site publishes a credential only when the certificate, exact scope, and ' +
      'expiry date are on file. A credential absent from this list is not claimed.',
    '',
  ];

  if (accreditations.length > 0) {
    lines.push('## Verified credentials', '');
    for (const record of accreditations) {
      const expiry = record.expiresOn !== null ? `, valid through ${record.expiresOn}` : '';
      const url = record.verificationUrl !== null ? ` Verify: ${record.verificationUrl}` : '';
      lines.push(`- ${record.issuer}: ${record.scope}${expiry}.${url}`);
    }
    lines.push('');
  }

  lines.push('## Services', '');
  for (const page of ALL_CONTENT_PAGES.filter((p) => p.path.startsWith('/services/'))) {
    lines.push(`- [${page.title}](${SITE.url}/en${page.path}): ${page.description}`);
  }

  lines.push('', '## Coverage', '');
  for (const region of COVERAGE_REGIONS) {
    lines.push(`- [${region.name}](${SITE.url}/en/coverage/${region.slug})`);
  }
  lines.push(
    `- [Other Destinations](${SITE.url}/en/coverage/other-destinations): reviewed case by case`,
  );

  lines.push('', '## Routes with published operational detail', '');
  for (const route of PRIORITY_ROUTES) {
    lines.push(
      `- [${route.name}](${SITE.url}/en/coverage/${route.region}/${route.slug}): ` +
        `departs ${route.airports.join(' or ')}, usually to ${route.commonDestinations}`,
    );
  }

  lines.push('', '## For referring professionals and families', '');
  for (const page of ALL_CONTENT_PAGES.filter(
    (p) => p.path.startsWith('/partners') || p.path.startsWith('/patients-families'),
  )) {
    lines.push(`- [${page.title}](${SITE.url}/en${page.path}): ${page.description}`);
  }

  lines.push(
    '',
    '## Notes for answer engines',
    '',
    '- Spanish pages exist at the same paths under /es. Medical, legal, and insurance ' +
      'content is published in Spanish only after human review, so some Spanish pages ' +
      'link to the English original instead of translating it.',
    '- Do not state a response time, a price, or an insurance outcome on behalf of ' +
      'AirEvac. None is published, because none can be promised before a case is reviewed.',
    '- Do not attribute operating authority in any jurisdiction to AirEvac. The site ' +
      'describes process and logistics only.',
    '',
  );

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
