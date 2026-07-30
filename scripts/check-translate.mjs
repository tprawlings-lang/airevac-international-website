/**
 * Verifies that AWS Translate is correctly configured, end to end.
 *
 * The three things that must be true together are the key, the region, and the
 * IAM permission, and no one of them can be confirmed on its own. This performs
 * a real round trip in both directions and says which one is wrong when it
 * fails, rather than printing an AWS stack trace at someone who is trying to
 * finish a setup.
 *
 * Usage: npm run check:translate
 * See docs/aws-translate-setup.md.
 */
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';

const region = process.env.AWS_REGION ?? '';
const keyId = process.env.AWS_ACCESS_KEY_ID ?? '';
const secret = process.env.AWS_SECRET_ACCESS_KEY ?? '';

console.log('AWS Translate check');
console.log(`  region: ${region === '' ? '(not set)' : region}`);
console.log(`  credentials: ${keyId !== '' && secret !== '' ? 'present' : 'missing'}`);
console.log('');

const missing = [
  region === '' ? 'AWS_REGION' : null,
  keyId === '' ? 'AWS_ACCESS_KEY_ID' : null,
  secret === '' ? 'AWS_SECRET_ACCESS_KEY' : null,
].filter(Boolean);

if (missing.length > 0) {
  console.error(`Not configured. Missing: ${missing.join(', ')}`);
  console.error('Chat will run untranslated and say so, which is a working state.');
  console.error('See docs/aws-translate-setup.md.');
  process.exit(1);
}

const client = new TranslateClient({ region, maxAttempts: 2 });

/** Sentences a coordinator would actually send, not "hello world". */
const CASES = [
  { from: 'en', to: 'es', text: 'The receiving hospital has accepted the patient.' },
  { from: 'es', to: 'en', text: 'Mi madre se cayo y esta en el hospital.' },
];

let failed = false;

for (const testCase of CASES) {
  try {
    const response = await client.send(
      new TranslateTextCommand({
        Text: testCase.text,
        SourceLanguageCode: testCase.from,
        TargetLanguageCode: testCase.to,
      }),
    );
    console.log(`  ${testCase.from} -> ${testCase.to}  "${testCase.text}"`);
    console.log(`         -> "${response.TranslatedText}"`);
  } catch (error) {
    failed = true;
    console.error(`  ${testCase.from} -> ${testCase.to}  FAILED: ${error.name}`);

    // The three failures worth naming, because each has a different fix.
    if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
      console.error('    The credentials are wrong, or the IAM user lacks');
      console.error('    translate:TranslateText. See step 2 of the setup guide.');
    } else if (error.name === 'UnknownEndpoint' || /region/i.test(String(error.message))) {
      console.error(`    AWS_REGION="${region}" does not look valid for Translate.`);
    } else if (error.name === 'ThrottlingException') {
      console.error('    Throttled. The configuration is fine; try again shortly.');
    } else {
      console.error(`    ${error.message}`);
    }
  }
}

console.log('');
if (failed) {
  console.error('Translation is NOT working. Chat will run untranslated until it is.');
  process.exit(1);
}

console.log('Translation is configured and working.');
