/**
 * Post-deploy IndexNow submission. AI Search Coding Handoff section 5.
 *
 * The handoff asks for submission "when a CMS record is published, updated,
 * unpublished, or deleted". This site has no CMS: content ships with the
 * deployment, so the deployment IS the publish event. Running this as a
 * post-deploy step is the equivalent trigger.
 *
 * "Submit only changed URLs" is the other half of the requirement. Blasting the
 * whole sitemap on every deploy is how a host gets its submissions throttled or
 * ignored. So this reads the sitemap's own `lastmod` dates and submits only
 * URLs modified within the lookback window, which for a content deploy is the
 * set that actually changed.
 *
 * Usage:  node scripts/indexnow-submit.mjs [siteUrl] [lookbackDays]
 * Env:    INDEXNOW_KEY must be set, and siteUrl must be the production origin.
 *
 * Exits 0 and explains itself when dormant, so a deploy pipeline can call it
 * unconditionally before the key or the domain exists.
 */

const SITE_URL = (process.argv[2] ?? process.env.SITE_URL ?? '').replace(/\/$/, '');
const LOOKBACK_DAYS = Number(process.argv[3] ?? 7);
const KEY = process.env.INDEXNOW_KEY;
const PRODUCTION_ORIGIN = 'https://airevacinternational.com';

if (!KEY || KEY.length < 8) {
  console.log('IndexNow: dormant, INDEXNOW_KEY is not set. Nothing submitted.');
  process.exit(0);
}

if (SITE_URL !== PRODUCTION_ORIGIN) {
  console.log(
    `IndexNow: dormant, site origin is "${SITE_URL || '(unset)'}" rather than ` +
      `${PRODUCTION_ORIGIN}. Refusing to ask search engines to index a preview deploy.`,
  );
  process.exit(0);
}

const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`);
if (!sitemapResponse.ok) {
  console.error(`IndexNow: could not read sitemap (${sitemapResponse.status}).`);
  process.exit(1);
}

const xml = await sitemapResponse.text();

const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
  const block = match[1];
  const loc = /<loc>(.*?)<\/loc>/.exec(block)?.[1];
  const lastmod = /<lastmod>(.*?)<\/lastmod>/.exec(block)?.[1];
  return { loc, lastmod };
});

const changed = entries
  .filter((entry) => entry.loc !== undefined)
  .filter((entry) => {
    if (entry.lastmod === undefined) return true;
    const time = Date.parse(entry.lastmod);
    return Number.isNaN(time) || time >= cutoff;
  })
  .map((entry) => entry.loc);

if (changed.length === 0) {
  console.log(`IndexNow: no URLs modified in the last ${LOOKBACK_DAYS} days. Nothing to submit.`);
  process.exit(0);
}

const host = new URL(SITE_URL).host;
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: KEY,
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
    urlList: changed,
  }),
});

if (response.ok || response.status === 202) {
  console.log(`IndexNow: submitted ${changed.length} changed URLs (${response.status}).`);
  process.exit(0);
}

console.error(`IndexNow: submission rejected with ${response.status}.`);
process.exit(1);
