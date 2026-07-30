/**
 * Crawler access check. AI Search Coding Handoff section 10:
 *
 *   "Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, and ClaudeBot
 *    receive the same public content as a normal browser."
 *
 * WHY THIS IS A SEPARATE CHECK FROM robots.txt. The handoff is blunt about the
 * distinction: "robots.txt permission does not override a firewall block."
 * A welcoming robots.txt proves intent, not access. A CDN bot rule, a hosting
 * provider's DDoS protection, or a JavaScript challenge can serve a crawler a
 * 403, a challenge page, or an empty shell while a browser sees the real page,
 * and nothing in the codebase would reveal it.
 *
 * So this fetches real URLs with each declared user agent and compares what
 * comes back against a browser baseline: status, the H1, the presence of main
 * body copy, the canonical tag, the structured data, and the absence of a
 * noindex. A crawler that is quietly served less than a browser fails here.
 *
 * Usage: node scripts/crawler-access-check.mjs [baseUrl]
 * Exit code 1 on any failure, so CI can gate on it.
 */

const BASE = process.argv[2] ?? 'http://localhost:3000';

/**
 * This site emits `noindex` on every page whenever it is not served from the
 * production origin, so a preview deploy cannot be indexed by omission. That is
 * correct behaviour, not a crawler-access failure, so the noindex assertion
 * runs only when the target actually is production.
 *
 * To exercise the full check locally, start the server with the production
 * origin: SITE_URL=https://airevacinternational.com npx next start
 */
const PRODUCTION_ORIGIN = 'https://airevacinternational.com';

/** Kept in step with SEARCH_CRAWLERS in src/app/robots.ts. */
const AGENTS = [
  ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
  ['Bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
  ['OAI-SearchBot', 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'],
  ['ChatGPT-User', 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)'],
  ['Claude-SearchBot', 'Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://anthropic.com/searchbot)'],
  ['ClaudeBot', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'],
  ['PerplexityBot', 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'],
];

const BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/126.0 Safari/537.36';

/** One page per template, in both locales where the template differs. */
const PATHS = [
  '/en',
  '/es',
  '/en/services',
  '/en/services/air-ambulance',
  '/en/partners',
  '/en/patients-families/how-it-works',
  '/en/patients-families/insurance-and-payment',
  '/en/coverage',
  '/en/coverage/mexico',
  '/en/coverage/mexico/cancun',
  '/en/coverage/other-destinations',
  '/en/fleet',
  '/en/credentials',
  '/en/about',
  '/en/contact',
  '/en/legal/privacy',
];

const results = [];
let failures = 0;

function note(ok, label, detail = '') {
  results.push({ ok, label, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
}

/** Strips tags and collapses whitespace, to compare rendered text volume. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAs(path, userAgent) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': userAgent, Accept: 'text/html' },
    redirect: 'manual',
  });
  const html = response.status === 200 ? await response.text() : '';
  return { status: response.status, html };
}

/**
 * Whether the target is serving production metadata. Read from the page rather
 * than assumed from the URL, so a local server started with the production
 * SITE_URL is checked as strictly as the real site.
 */
const probe = await fetch(`${BASE}/en`, { headers: { 'User-Agent': BROWSER } });
const probeHtml = await probe.text();
const servesProductionMetadata =
  BASE === PRODUCTION_ORIGIN || probeHtml.includes(`${PRODUCTION_ORIGIN}/en`);

console.log(`Crawler access check against ${BASE}`);
console.log(
  servesProductionMetadata
    ? 'Target serves production metadata: indexability is checked.\n'
    : 'Target is a preview origin: site-wide noindex is expected, so that check is ' +
        'skipped. Access, content parity, H1, canonical, and schema are still checked.\n',
);

for (const path of PATHS) {
  const baseline = await fetchAs(path, BROWSER);

  if (baseline.status !== 200) {
    note(false, `${path} browser baseline`, `expected 200, got ${baseline.status}`);
    continue;
  }

  const baselineWords = visibleText(baseline.html).split(' ').length;

  for (const [name, userAgent] of AGENTS) {
    const crawler = await fetchAs(path, userAgent);

    if (crawler.status !== 200) {
      note(false, `${path} as ${name}`, `status ${crawler.status}`);
      continue;
    }

    const html = crawler.html;
    const words = visibleText(html).split(' ').length;

    const problems = [];
    // A challenge page or empty shell shows up as a large text shortfall. The
    // 15% tolerance absorbs the nonce and per-request markup differences.
    if (words < baselineWords * 0.85) {
      problems.push(`content shortfall: ${words} words vs ${baselineWords} for a browser`);
    }
    if (!/<h1[\s>]/i.test(html)) problems.push('no H1 in the initial HTML');
    if (!/<link[^>]+rel="canonical"/i.test(html)) problems.push('no canonical tag');
    if (!/application\/ld\+json/i.test(html)) problems.push('no structured data');
    if (servesProductionMetadata && /content="[^"]*noindex/i.test(html)) {
      problems.push('noindex present');
    }

    note(problems.length === 0, `${path} as ${name}`, problems.join('; '));
  }
}

console.log(
  `\n${results.length - failures}/${results.length} crawler access checks passed.`,
);

if (failures > 0) {
  console.error(
    '\nA crawler is being served something different from a browser. Check the CDN or ' +
      'hosting bot rules before launch: robots.txt cannot fix this.',
  );
  process.exit(1);
}
