/**
 * Accessibility audit. Blueprint page 21 launch gate:
 *
 *   "Automated WCAG checks plus keyboard, screen reader, 200% and 400% zoom,
 *    contrast, focus, errors and language — WCAG 2.2 AA target; zero serious or
 *    critical automated issue."
 *
 * This script covers the AUTOMATED half. It drives a real Chromium via
 * Playwright and injects axe-core, rather than using @axe-core/cli, because the
 * CLI requires a separate chromedriver that CI runners do not reliably have.
 *
 * IT DOES NOT COVER: manual screen-reader testing, the keyboard walkthrough, the
 * 400% zoom reflow check, or the browser/assistive-technology matrix. Automated
 * tooling catches roughly a third of WCAG failures. Those remain outstanding and
 * are tracked in docs/readiness-matrix.md — a green run here is not a passed
 * accessibility gate.
 *
 * Usage: node scripts/a11y-audit.mjs [baseUrl]
 */

import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.argv[2] ?? 'http://localhost:3000';

/** Representative of every template, in both locales. */
const PATHS = [
  '/en',
  '/es',
  '/en/request-transport',
  '/en/partners/hospitals',
  '/en/partners/cruise',
  '/en/patients-families',
  '/en/patient-rights',
  '/en/credentials',
  '/en/fleet',
  '/en/services/air-ambulance',
  '/en/coverage',
  '/en/coverage/mexico',
  '/en/coverage/mexico/cancun',
  '/en/legal/privacy',
  '/es/patient-rights',
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** The gate: zero serious or critical automated issues. */
const FAILING_IMPACTS = new Set(['serious', 'critical']);

/**
 * `CHROMIUM_PATH` lets an environment that already ships a Chromium (a sandbox,
 * a locked-down CI image) point at it instead of downloading a matching build.
 * Unset, Playwright resolves its own — which is what CI does.
 */
const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
let failures = 0;
let moderateCount = 0;

for (const path of PATHS) {
  const page = await browser.newPage();

  try {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });

    if (response === null || !response.ok()) {
      console.error(`✗ ${path} — HTTP ${response?.status() ?? 'no response'}`);
      failures += 1;
      continue;
    }

    await page.addScriptTag({ content: axeSource });

    const results = await page.evaluate(
      async (tags) => await window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
      TAGS,
    );

    const blocking = results.violations.filter((v) => FAILING_IMPACTS.has(v.impact));
    const moderate = results.violations.filter((v) => !FAILING_IMPACTS.has(v.impact));
    moderateCount += moderate.length;

    if (blocking.length === 0) {
      const note = moderate.length > 0 ? ` (${moderate.length} minor/moderate)` : '';
      console.log(`✓ ${path}${note}`);
    } else {
      failures += 1;
      console.error(`✗ ${path} — ${blocking.length} serious/critical`);
      for (const violation of blocking) {
        console.error(`    [${violation.impact}] ${violation.id}: ${violation.help}`);
        for (const node of violation.nodes.slice(0, 3)) {
          console.error(`      ${node.target.join(' ')}`);
        }
      }
    }

    // Report moderate findings without failing: they are real, but the launch
    // gate is scoped to serious and critical.
    for (const violation of moderate) {
      console.log(`    · [${violation.impact}] ${violation.id}: ${violation.help}`);
    }
  } finally {
    await page.close();
  }
}

await browser.close();

console.log(
  `\n${PATHS.length - failures}/${PATHS.length} pages clear of serious/critical issues.` +
    (moderateCount > 0 ? ` ${moderateCount} minor/moderate finding(s) reported above.` : ''),
);

if (failures > 0) {
  console.error('\nAccessibility gate FAILED (blueprint page 21: zero serious or critical).');
  process.exit(1);
}
