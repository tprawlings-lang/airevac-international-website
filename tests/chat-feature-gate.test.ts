import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The gate that decides whether the chat launcher is offered at all.
 *
 * These are cheap tests guarding an expensive mistake. A deploy that advertises
 * chat it cannot hold produces a launcher opening onto a failing endpoint, and
 * the visitor who taps it is someone arranging a medical transport. The rules
 * below are the ones that must survive a refactor.
 *
 * FEATURES is a getter over process.env, so each test re-imports the module to
 * re-evaluate it rather than reading a value captured at import time.
 */

async function secureChat(): Promise<boolean> {
  vi.resetModules();
  const { FEATURES } = await import('@/content/site');
  return FEATURES.secureChat;
}

const PRODUCTION = 'https://airevacinternational.com';
const PREVIEW = 'https://airevac-international-website.onrender.com';

describe('chat feature gate', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('is off without a database, even when explicitly enabled', async () => {
    /*
     * The rule that matters most here, and the one a real deploy broke: every
     * part of chat reads or writes Postgres, so DATABASE_URL is a fact about
     * the deployment rather than a preference, and no preference may override
     * it. CHAT_ENABLED=true is the strongest possible opt-in and it still
     * loses to having nowhere to put a conversation.
     */
    delete process.env.DATABASE_URL;
    process.env.CHAT_ENABLED = 'true';
    process.env.SITE_URL = PREVIEW;

    expect(await secureChat()).toBe(false);
  });

  it('is on for a preview once a database exists, with nothing else set', async () => {
    process.env.DATABASE_URL = 'postgres://example/db';
    delete process.env.CHAT_ENABLED;
    process.env.SITE_URL = PREVIEW;

    expect(await secureChat()).toBe(true);
  });

  it('is off on the production origin when nothing is set', async () => {
    // Reaching the public must require someone to ask for it, not to forget.
    process.env.DATABASE_URL = 'postgres://example/db';
    delete process.env.CHAT_ENABLED;
    process.env.SITE_URL = PRODUCTION;

    expect(await secureChat()).toBe(false);
  });

  it('honours an explicit false on a preview', async () => {
    process.env.DATABASE_URL = 'postgres://example/db';
    process.env.CHAT_ENABLED = 'false';
    process.env.SITE_URL = PREVIEW;

    expect(await secureChat()).toBe(false);
  });

  it('honours an explicit true on production, which the BAA gates', async () => {
    // Allowed, and `assertChatConfigurationIsSane()` logs loudly about it.
    process.env.DATABASE_URL = 'postgres://example/db';
    process.env.CHAT_ENABLED = 'true';
    process.env.SITE_URL = PRODUCTION;

    expect(await secureChat()).toBe(true);
  });
});

describe('SITE_URL normalisation', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  async function siteUrl(): Promise<string> {
    vi.resetModules();
    const { SITE } = await import('@/content/site');
    return SITE.url;
  }

  it('strips a trailing slash', async () => {
    /*
     * `SITE.url` is concatenated with paths that already start with a slash, so
     * an unstripped one produces `https://host//sitemap.xml` everywhere at once.
     * A dashboard field is exactly where a trailing slash gets pasted.
     */
    process.env.SITE_URL = 'https://example.onrender.com/';

    expect(await siteUrl()).toBe('https://example.onrender.com');
  });

  it('strips whitespace picked up by copy and paste', async () => {
    process.env.SITE_URL = '  https://example.onrender.com  ';

    expect(await siteUrl()).toBe('https://example.onrender.com');
  });

  it('falls back to localhost when unset or blank, keeping a preview noindex', async () => {
    process.env.SITE_URL = '   ';
    expect(await siteUrl()).toBe('http://localhost:3000');

    delete process.env.SITE_URL;
    expect(await siteUrl()).toBe('http://localhost:3000');
  });

  it('still recognises production when it arrives with a trailing slash', async () => {
    // Otherwise the live site would serve noindex over a punctuation mark.
    process.env.SITE_URL = 'https://airevacinternational.com/';
    process.env.DATABASE_URL = 'postgres://example/db';
    delete process.env.CHAT_ENABLED;

    expect(await siteUrl()).toBe('https://airevacinternational.com');
    expect(await secureChat()).toBe(false);
  });
});
