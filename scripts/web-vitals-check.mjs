/**
 * Core Web Vitals budget check. AI Search Coding Handoff section 8:
 *
 *   Largest Contentful Paint under 2.5 seconds
 *   Interaction to Next Paint under 200 milliseconds
 *   Cumulative Layout Shift under 0.1
 *
 * WHY THIS EXISTS ALONGSIDE lighthouserc.json. Lighthouse CI is the fuller
 * report and the config is committed for pipelines that want it, but it pulls
 * in a large dependency for what is, on this site, three numbers. This measures
 * the same three directly in the browser we already have installed, so the
 * budget is enforced on every run rather than only where Lighthouse is set up.
 *
 * WHAT THESE NUMBERS ARE AND ARE NOT. These are lab measurements on a local
 * server: no network latency, no CPU contention, no real device. They catch
 * regressions (an unsized image, a render-blocking font, a layout shift) and
 * they cannot tell you what a coordinator on hotel wifi in Cancun experiences.
 * The 75th-percentile field data in Search Console is the number that counts;
 * this is the guard that stops obvious regressions reaching it.
 *
 * INP needs real interaction and cannot be measured meaningfully here. Total
 * Blocking Time is the standard lab proxy and is what this checks.
 *
 * Usage: node scripts/web-vitals-check.mjs [baseUrl]
 * Env:   CHROMIUM_PATH to use a preinstalled browser.
 */

import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:3000';

/** One page per template that matters commercially. */
const PATHS = [
  '/en',
  '/en/services/air-ambulance',
  '/en/coverage',
  '/en/coverage/mexico/cancun',
  '/en/credentials',
  '/en/contact',
];

const BUDGETS = {
  // Handoff section 8. LCP and CLS are the handoff's own thresholds; TBT is
  // the lab proxy for its INP target.
  lcp: 2500,
  cls: 0.1,
  tbt: 200,
};

const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

/*
 * Warm the server before measuring.
 *
 * The first request to a freshly started Next server pays for module loading
 * and route compilation, which lands entirely on whichever page happens to be
 * measured first: it showed 337ms of blocking time cold and 15ms warm. Without
 * this pass the budget check reports a failure whose cause is the harness, and
 * a check that cries wolf is a check people learn to ignore.
 */
for (const path of PATHS) {
  await fetch(`${BASE}${path}`).catch(() => {});
}

let failures = 0;
const rows = [];

for (const path of PATHS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, longTasks: 0 };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__vitals.lcp = entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Shifts caused by a user interaction do not count against CLS.
        if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // TBT counts only the blocking portion beyond 50ms of each long task.
        window.__vitals.longTasks += Math.max(0, entry.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  // Let late-loading images settle so a shifting hero is caught rather than missed.
  await page.waitForTimeout(1200);

  const vitals = await page.evaluate(() => window.__vitals);
  await page.close();

  const problems = [];
  if (vitals.lcp > BUDGETS.lcp) problems.push(`LCP ${Math.round(vitals.lcp)}ms > ${BUDGETS.lcp}ms`);
  if (vitals.cls > BUDGETS.cls) problems.push(`CLS ${vitals.cls.toFixed(3)} > ${BUDGETS.cls}`);
  if (vitals.longTasks > BUDGETS.tbt) {
    problems.push(`TBT ${Math.round(vitals.longTasks)}ms > ${BUDGETS.tbt}ms`);
  }

  if (problems.length > 0) failures += 1;
  rows.push({ path, vitals, problems });

  console.log(
    `${problems.length === 0 ? '✓' : '✗'} ${path.padEnd(34)} ` +
      `LCP ${String(Math.round(vitals.lcp)).padStart(5)}ms  ` +
      `CLS ${vitals.cls.toFixed(3)}  ` +
      `TBT ${String(Math.round(vitals.longTasks)).padStart(4)}ms` +
      (problems.length > 0 ? `  <- ${problems.join('; ')}` : ''),
  );
}

await browser.close();

console.log(`\n${rows.length - failures}/${rows.length} pages within the Core Web Vitals budget.`);
if (failures > 0) process.exit(1);
