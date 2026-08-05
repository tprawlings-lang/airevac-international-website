/**
 * Fails the build if the Content Security Policy blocks anything the page needs.
 *
 * WHY THIS EXISTS. A CSP refusal is not an error. Nothing throws, no request
 * fails, no test goes red: the browser quietly declines to apply something and
 * carries on. The site therefore looked fine while every inline style attribute
 * on it was being dropped, which left the hero photograph rendering at its
 * intrinsic width instead of covering the section. It took someone asking about
 * ultrawide monitors to notice, because that is the width at which the image
 * ran out and the seam became visible.
 *
 * The browser had been saying so on every page load since the day it shipped.
 * Nothing was listening. This listens.
 *
 * Deliberately fails on ANY refusal rather than a known list. A CSP violation is
 * either something the page needs, in which case the policy is wrong, or
 * something the page should not be doing, in which case the page is wrong. Both
 * want a human, and neither should be waved through by an allowlist that grows
 * quietly.
 *
 * Usage: node scripts/csp-check.mjs [baseUrl]
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';

/** One of each page shape: hero photo, map, register, form, console, chat. */
const PAGES = [
  '/en',
  '/es',
  '/en/coverage',
  '/en/coverage/mexico',
  '/en/coverage/mexico/cancun',
  '/en/fleet',
  '/en/credentials',
  '/en/partners',
  '/en/request-transport',
  '/en/legal/privacy',
  '/coordinator',
];

const REFUSAL = /refused to (apply|load|execute|connect|frame)/i;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failures = 0;

for (const path of PAGES) {
  const violations = [];
  const onConsole = (message) => {
    const text = message.text();
    if (REFUSAL.test(text)) violations.push(text.split('\n')[0].slice(0, 160));
  };

  page.on('console', onConsole);
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  // Late violations: styles applied during hydration, images swapped in.
  await page.waitForTimeout(1200);
  page.off('console', onConsole);

  if (response === null || !response.ok()) {
    console.error(`✗ ${path} did not load (${response?.status() ?? 'no response'})`);
    failures += 1;
    continue;
  }

  const unique = [...new Set(violations)];
  if (unique.length > 0) {
    failures += 1;
    console.error(`✗ ${path}`);
    for (const violation of unique) console.error(`    ${violation}`);
  } else {
    console.log(`✓ ${path}`);
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} page(s) with Content Security Policy violations.`);
  process.exit(1);
}

console.log(`\n${PAGES.length}/${PAGES.length} pages free of CSP violations.`);
