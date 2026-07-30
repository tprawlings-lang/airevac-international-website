import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';

import { safeLog } from '@/lib/redact';

/**
 * Message translation.
 *
 * THE RULE THIS MODULE EXISTS TO ENFORCE: translation is additive, never
 * substitutive. Nothing here returns a translation *instead of* the original.
 * It returns both, and the interface makes it awkward to do otherwise, because
 * a mistranslated clinical detail in an air ambulance conversation can change a
 * decision and hiding the original removes the only means anyone has of
 * catching it. A bilingual coordinator glancing at the Spanish will spot an
 * error the system cannot.
 *
 * WHY THE AWS SDK, when `src/server/mail.ts` deliberately avoids one. Resend is
 * a bearer token on a POST, so an SDK there would be a supply-chain dependency
 * bought for nothing. AWS requires SigV4: a canonical request, a derived
 * signing key, and a signature, none of which can be verified as correct
 * without calling the real service. Hand-rolling that and being subtly wrong
 * produces authentication failures at runtime rather than at build time. The
 * official client is the supported path for a HIPAA-eligible service, and this
 * is the one place where "written by the vendor" is worth a dependency.
 *
 * AWS TRANSLATE IS HIPAA-ELIGIBLE, and eligibility only applies under an
 * executed AWS Business Associate Addendum. Message text leaves our systems for
 * theirs, so that agreement is required before this is switched on with real
 * conversations. See docs/plans/coordinator-chat-plan.md section 7.1.
 */

export type TranslationOutcome =
  | {
      status: 'translated';
      body: string;
      language: string;
      engine: string;
    }
  | {
      /** Sender and recipient already share a language. */
      status: 'not_needed';
    }
  | {
      status: 'failed';
      /** Shown to both sides so a missing translation is visible, not silent. */
      reason: string;
    };

/** Languages the site supports. Anything else is not offered. */
const SUPPORTED = new Set(['en', 'es']);

/**
 * A single client, created lazily.
 *
 * Credentials come from the standard AWS chain (environment, or an instance
 * role), so nothing here reads a secret directly and no key needs to appear in
 * application code.
 */
let client: TranslateClient | undefined;

/**
 * Stub translation, for exercising the interface before AWS exists.
 *
 * WHY IT IS DELIBERATELY UGLY. The whole point of the translated view is that
 * a coordinator can see both the translation and the original and notice when
 * one does not match the other. A stub that returned plausible-looking text
 * would make that view untestable in the only way that matters, and would be
 * genuinely dangerous if it ever reached a real conversation: a family reading
 * fake Spanish about a patient transfer is worse than reading nothing.
 *
 * So the output is marked, in brackets, in capitals, on both ends. Nobody can
 * look at it and believe a translation happened.
 *
 * REFUSED ON THE PRODUCTION ORIGIN, in code rather than by instruction. See
 * `stubAllowed`.
 */
function stubAllowed(): boolean {
  // Never on production, whatever the environment says.
  if ((process.env.SITE_URL ?? '') === 'https://airevacinternational.com') return false;

  if (process.env.TRANSLATION_MODE === 'stub') return true;
  if (process.env.TRANSLATION_MODE === 'off') return false;

  /*
   * Default on a preview: stub in, but only when AWS is not configured. So a
   * demo shows the translated view working with no setup, and the moment real
   * credentials appear they take over without anyone remembering to remove a
   * variable. Real translation always wins over the stub.
   */
  return (
    (process.env.AWS_REGION ?? '') === '' ||
    (process.env.AWS_ACCESS_KEY_ID ?? '') === '' ||
    (process.env.AWS_SECRET_ACCESS_KEY ?? '') === ''
  );
}

function stubTranslate(text: string, from: string, to: string): TranslationOutcome {
  return {
    status: 'translated',
    body: `[TEST TRANSLATION ${from.toUpperCase()} to ${to.toUpperCase()}] ${text} [NOT A REAL TRANSLATION]`,
    language: to,
    engine: 'stub',
  };
}

export function translationConfigured(): boolean {
  if (stubAllowed()) return true;

  return (
    (process.env.AWS_REGION ?? '') !== '' &&
    (process.env.AWS_ACCESS_KEY_ID ?? '') !== '' &&
    (process.env.AWS_SECRET_ACCESS_KEY ?? '') !== ''
  );
}

function getClient(): TranslateClient {
  client ??= new TranslateClient({
    region: process.env.AWS_REGION,
    // Two attempts, not the default three. A coordinator waiting on a message
    // needs an answer quickly; a translation that takes four seconds to fail is
    // worse than one that fails in one and shows the original with a notice.
    maxAttempts: 2,
  });
  return client;
}

/**
 * Translates one message.
 *
 * NEVER THROWS. A translation failure must not lose a message: the caller
 * stores the original either way and records the failure alongside it, so both
 * sides see the untranslated text with an explicit marker rather than one side
 * seeing nothing. Silence would be the dangerous outcome, because a coordinator
 * cannot tell the difference between "they said nothing" and "their words did
 * not arrive".
 */
export async function translateMessage(
  text: string,
  from: string,
  to: string,
): Promise<TranslationOutcome> {
  if (from === to) return { status: 'not_needed' };
  if (!SUPPORTED.has(from) || !SUPPORTED.has(to)) {
    return { status: 'failed', reason: 'unsupported_language' };
  }
  if (text.trim() === '') return { status: 'not_needed' };

  if (stubAllowed()) return stubTranslate(text, from, to);

  if (!translationConfigured()) {
    /*
     * Unconfigured is a working state. Chat runs without translation and both
     * sides are told so; it is not an error and must not read as one. This is
     * what lets the feature ship before the AWS account and the Business
     * Associate Addendum are in place.
     */
    return { status: 'failed', reason: 'translation_unavailable' };
  }

  try {
    const response = await getClient().send(
      new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: from,
        TargetLanguageCode: to,
      }),
    );

    const translated = response.TranslatedText;
    if (translated === undefined || translated === '') {
      return { status: 'failed', reason: 'empty_translation' };
    }

    return {
      status: 'translated',
      body: translated,
      language: to,
      engine: 'aws-translate',
    };
  } catch (error) {
    /*
     * The message text is never logged, not even on failure. A log line
     * quoting what failed to translate would put a patient's details in the
     * application logs, which is the one place this system is built to keep
     * them out of. Only the error class is recorded.
     */
    safeLog('warn', 'translate.failed', {
      error: (error as Error).name,
      from,
      to,
    });
    return { status: 'failed', reason: 'translation_error' };
  }
}

/**
 * Which language a message should be translated into, if any.
 *
 * Returns null when the coordinator already speaks the visitor's language,
 * which is the case worth getting right: a Spanish speaker who reaches a
 * Spanish-speaking coordinator should not be told a machine is translating
 * them, and their words should not make a round trip through one.
 */
export function targetLanguageFor(
  senderLanguage: string,
  recipientLanguages: readonly string[],
): string | null {
  if (recipientLanguages.includes(senderLanguage)) return null;
  const target = recipientLanguages.find((language) => SUPPORTED.has(language));
  return target ?? null;
}

/** Test-only reset, so a test can change the environment and re-evaluate it. */
export function __resetTranslateClient(): void {
  client = undefined;
}
