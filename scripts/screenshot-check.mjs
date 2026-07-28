/**
 * Viewport screenshots for the handoff verification pass (Section 16):
 * homepage at 320/375/768/1024/1440, full page, plus a map-only crop at each
 * width. Reviewed by eye for: Caribbean labels visible, MHRO and MDPP present,
 * no IATA codes, no label overlapping page copy.
 *
 * Usage: node scripts/screenshot-check.mjs [baseUrl] [outDir]
 * Env:   CHROMIUM_PATH to use a preinstalled browser.
 */

import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const OUT = process.argv[3] ?? 'screenshots';
mkdirSync(OUT, { recursive: true });

const WIDTHS = [320, 375, 768, 1024, 1440];

const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });

  await page.screenshot({ path: join(OUT, `home-${width}.png`), fullPage: true });

  const map = page.locator('figure:has(svg[role="img"])').first();
  if ((await map.count()) > 0) {
    await map.scrollIntoViewIfNeeded();
    await map.screenshot({ path: join(OUT, `map-${width}.png`) });
  }

  await page.close();
  console.log(`captured ${width}px`);
}

await browser.close();
