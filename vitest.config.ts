import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],

    /**
     * Test FILES run one at a time.
     *
     * tests/auth.test.ts and tests/chat.test.ts both talk to the same Postgres
     * database and both TRUNCATE in `beforeEach`, so running them in parallel
     * has each one deleting the other's fixtures mid-test. That failed in a
     * particularly misleading way: every file passed when run alone and three
     * tests failed when run together, which reads as flakiness in the code
     * rather than a collision in the harness.
     *
     * The alternative is a database per worker, which is more machinery than a
     * suite this size earns. The whole run is a few seconds without a database
     * and about thirty with one, so serialising costs nothing worth having.
     */
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/content/**'],
      /**
       * Blueprint page 21, unit test launch gate:
       *   "All pass; 100% of security decision branches covered."
       *
       * The security decision surface is src/lib — the credential gate, the
       * intake allowlist, rate limiting, redaction, and idempotency. Presentation
       * components are covered by the accessibility and E2E gates instead.
       */
      thresholds: {
        'src/lib/credential-register.ts': { statements: 100, branches: 100, functions: 100 },
        'src/lib/intake-schema.ts': { statements: 100, branches: 90, functions: 100 },
        'src/lib/redact.ts': { statements: 95, branches: 90, functions: 100 },
      },
    },
  },
});
