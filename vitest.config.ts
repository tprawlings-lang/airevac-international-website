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
