/**
 * Behavioural check for the desktop navigation dropdown.
 *
 * The reported bug: menus opened on click and never closed, so several could be
 * open at once and one stayed over the page indefinitely on a tablet.
 *
 * These assertions are the acceptance criteria for that fix. They drive a real
 * browser because none of this is observable from unit tests — hover intent,
 * idle timeouts, and outside-click all depend on real event dispatch.
 *
 * Usage: node scripts/nav-behaviour-check.mjs [baseUrl]
 * Env:   CHROMIUM_PATH to use a preinstalled browser.
 */

import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const executablePath = process.env.CHROMIUM_PATH;

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });

const results = [];
function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const trigger = (label) => page.getByRole('button', { name: new RegExp(`^${label}`) });
const openCount = () =>
  page.locator('nav[aria-label="Main"] button[aria-expanded="true"]').count();

// --- 1. Click opens ------------------------------------------------------
await trigger('Services').click();
await page.waitForTimeout(150);
check('click opens the menu', (await openCount()) === 1);
// Scoped to the nav: the footer sitemap repeats these link labels.
check(
  'menu links are visible when open',
  await page
    .locator('nav[aria-label="Main"]')
    .getByRole('link', { name: 'Air Ambulance', exact: true })
    .isVisible(),
);

// --- 2. Click again closes (the original bug) ----------------------------
await trigger('Services').click();
await page.waitForTimeout(150);
check('clicking the trigger again closes it', (await openCount()) === 0);

// --- 3. Only one menu open at a time -------------------------------------
await trigger('Services').click();
await page.waitForTimeout(120);
await trigger('Coverage').click();
await page.waitForTimeout(180);
check('opening a second menu closes the first', (await openCount()) === 1);

// --- 4. Outside click closes ---------------------------------------------
await page.mouse.click(720, 700);
await page.waitForTimeout(150);
check('clicking outside closes the menu', (await openCount()) === 0);

// --- 5. Hover opens, moving away closes ----------------------------------
// "For Partners" became a direct link in the AEI handoff (no dropdown), so
// hover behaviour is exercised on a group that still has children.
await trigger('Patients and Families').hover();
await page.waitForTimeout(300);
check('hover opens the menu', (await openCount()) === 1);

await page.mouse.move(720, 700);
await page.waitForTimeout(600);
check('moving the pointer away closes the menu', (await openCount()) === 0);

// --- 6. Escape closes and restores focus ---------------------------------
await trigger('About').click();
await page.waitForTimeout(150);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('Escape closes the menu', (await openCount()) === 0);
check(
  'Escape returns focus to the trigger',
  await page.evaluate(
    () => document.activeElement?.textContent?.trim().startsWith('About') ?? false,
  ),
);

// --- 7. Idle timeout (the tablet case) -----------------------------------
// Tap with a touch pointer: there is no "move away" event, so only the idle
// timer can close it.
await page.evaluate(() => {
  const button = [...document.querySelectorAll('nav[aria-label="Main"] button')].find((b) =>
    b.textContent?.trim().startsWith('Coverage'),
  );
  button?.click();
});
await page.waitForTimeout(200);
check('tap opens the menu', (await openCount()) === 1);

console.log('  …waiting 11s for the idle timeout…');
await page.waitForTimeout(11_000);
check('menu auto-closes after 10s idle', (await openCount()) === 0);

// --- 8. Idle timer does NOT close while a link has keyboard focus --------
// WCAG 2.2 SC 2.2.1: a keyboard user reading the menu must not have it removed.
await trigger('Services').click();
await page.waitForTimeout(150);
await page.keyboard.press('Tab'); // into the first menu link
await page.waitForTimeout(11_000);
check(
  'menu stays open while a link holds keyboard focus',
  (await openCount()) === 1,
  'WCAG 2.2 SC 2.2.1',
);

await browser.close();

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} navigation checks passed.`);
if (failed.length > 0) process.exit(1);
