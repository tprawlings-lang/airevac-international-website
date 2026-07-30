import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetTranslateClient,
  targetLanguageFor,
  translateMessage,
  translationConfigured,
} from '@/server/chat/translate';

/**
 * Translation routing and failure behaviour.
 *
 * The AWS call itself is not exercised here: it needs credentials and a
 * Business Associate Addendum, and a mocked SDK would only prove the mock
 * works. What is tested is everything around it, which is where the decisions
 * that matter live.
 */

describe('targetLanguageFor', () => {
  it('does not translate when the coordinator already speaks the language', () => {
    // The case worth getting right. A Spanish speaker who reaches a
    // Spanish-speaking coordinator should not be told a machine is translating
    // them, and their words should not make a round trip through one.
    expect(targetLanguageFor('es', ['en', 'es'])).toBeNull();
    expect(targetLanguageFor('en', ['en'])).toBeNull();
  });

  it('translates into the coordinator language when they do not share one', () => {
    expect(targetLanguageFor('es', ['en'])).toBe('en');
    expect(targetLanguageFor('en', ['es'])).toBe('es');
  });

  it('returns null rather than guessing when no supported language is on offer', () => {
    expect(targetLanguageFor('es', [])).toBeNull();
    expect(targetLanguageFor('es', ['fr'])).toBeNull();
  });
});

describe('translateMessage', () => {
  const original = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    __resetTranslateClient();
  });

  afterEach(() => {
    process.env = { ...original };
    vi.restoreAllMocks();
    __resetTranslateClient();
  });

  it('reports not_needed for a same-language message', async () => {
    expect(await translateMessage('hello', 'en', 'en')).toEqual({ status: 'not_needed' });
  });

  it('reports not_needed for empty text rather than calling out', async () => {
    expect(await translateMessage('   ', 'es', 'en')).toEqual({ status: 'not_needed' });
  });

  it('refuses a language the site does not support', async () => {
    expect(await translateMessage('bonjour', 'fr', 'en')).toEqual({
      status: 'failed',
      reason: 'unsupported_language',
    });
  });

  it('treats missing credentials as unavailable when the stub is off', async () => {
    /*
     * This is what lets chat ship before the AWS account exists. Both sides
     * see the original with a notice; nothing breaks and nothing is lost.
     * TRANSLATION_MODE=off is set explicitly because a preview origin now
     * defaults to the stub, which is the behaviour the next test covers.
     */
    process.env.TRANSLATION_MODE = 'off';
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;

    expect(translationConfigured()).toBe(false);
    expect(await translateMessage('hola', 'es', 'en')).toEqual({
      status: 'failed',
      reason: 'translation_unavailable',
    });
  });

  it('needs all three credentials before it uses the real service', async () => {
    // A half-configured deployment must not attempt real calls that fail on
    // every message. On a preview it falls back to the stub; the assertion
    // that matters is that it does not reach AWS.
    process.env.TRANSLATION_MODE = 'off';
    process.env.AWS_REGION = 'us-east-1';
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    expect(translationConfigured()).toBe(false);
  });

  it('defaults to the stub on a preview when AWS is not configured', async () => {
    /*
     * So a demo shows the translated view working with no setup at all. The
     * output is unmistakably marked, and production is excluded separately.
     */
    delete process.env.TRANSLATION_MODE;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    process.env.SITE_URL = 'https://airevac-preview.onrender.com';

    const result = await translateMessage('hola', 'es', 'en');
    expect(result.status).toBe('translated');
    if (result.status === 'translated') expect(result.engine).toBe('stub');
  });

  it('never defaults to the stub on the production origin', async () => {
    delete process.env.TRANSLATION_MODE;
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    process.env.SITE_URL = 'https://airevacinternational.com';

    expect(translationConfigured()).toBe(false);
    expect(await translateMessage('hola', 'es', 'en')).toEqual({
      status: 'failed',
      reason: 'translation_unavailable',
    });
  });

  it('prefers real credentials over the stub', async () => {
    // The stub must never shadow a working configuration; it exists only to
    // fill the gap before one arrives.
    delete process.env.TRANSLATION_MODE;
    process.env.SITE_URL = 'https://airevac-preview.onrender.com';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    __resetTranslateClient();

    // Reaches the real client, which fails without valid credentials rather
    // than quietly returning stub text.
    const result = await translateMessage('hola', 'es', 'en');
    expect(result.status).toBe('failed');
  }, 30_000);

  it('never throws, whatever the service does', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    __resetTranslateClient();

    // A translation failure must not lose a message. The caller stores the
    // original either way and records the failure alongside it.
    const result = await translateMessage('hola', 'es', 'en');
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(typeof result.reason).toBe('string');
  }, 30_000);

  it('never logs the message text on failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    __resetTranslateClient();

    await translateMessage('mi hijo tiene una fractura', 'es', 'en');

    // Logging what failed to translate would put a patient's details in the
    // application logs, which is the one place this system keeps them out of.
    const logged = warn.mock.calls.map((call) => String(call[0])).join(' ');
    expect(logged).not.toContain('fractura');
    expect(logged).not.toContain('hijo');
  }, 30_000);
});

describe('stub translation', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    __resetTranslateClient();
  });

  it('produces text nobody could mistake for a real translation', async () => {
    process.env.TRANSLATION_MODE = 'stub';
    process.env.SITE_URL = 'http://localhost:3000';

    const result = await translateMessage('mi madre se cayo', 'es', 'en');
    expect(result.status).toBe('translated');
    if (result.status !== 'translated') return;

    // Marked on both ends, in capitals. The translated view is only worth
    // testing if a wrong translation is visibly wrong.
    expect(result.body).toContain('TEST TRANSLATION');
    expect(result.body).toContain('NOT A REAL TRANSLATION');
    expect(result.body).toContain('mi madre se cayo');
    expect(result.engine).toBe('stub');
  });

  it('is refused on the production origin, whatever the environment says', async () => {
    /*
     * In code, not by instruction. Showing marked placeholder text to a family
     * arranging a medical transport would be worse than showing nothing, so
     * this cannot be switched on by a stray environment variable.
     */
    process.env.TRANSLATION_MODE = 'stub';
    process.env.SITE_URL = 'https://airevacinternational.com';
    delete process.env.AWS_REGION;

    expect(translationConfigured()).toBe(false);
    expect(await translateMessage('hola', 'es', 'en')).toEqual({
      status: 'failed',
      reason: 'translation_unavailable',
    });
  });

  it('still skips translation when the languages already match', async () => {
    process.env.TRANSLATION_MODE = 'stub';
    process.env.SITE_URL = 'http://localhost:3000';
    expect(await translateMessage('hello', 'en', 'en')).toEqual({ status: 'not_needed' });
  });
});
