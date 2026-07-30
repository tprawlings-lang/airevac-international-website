import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/**
 * Lint configuration.
 *
 * Beyond the Next.js defaults, this adds the project-specific rules that encode
 * blueprint constraints the type system cannot express.
 */
const config = [
  ...coreWebVitals,
  ...typescript,

  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      /**
       * Blueprint page 13 ("Redact logs") and page 16 ("never echo submitted
       * data"). Direct console calls are how a request body ends up in a log
       * line; `safeLog` from src/lib/redact.ts redacts first.
       *
       * `console.error` stays allowed for genuinely unexpected failures that
       * carry no user data.
       */
      'no-console': ['error', { allow: ['error'] }],

      /**
       * `'/chats/${id}'` in single quotes is a literal, not an interpolation,
       * and TypeScript is perfectly happy with it: the type is string either
       * way. It shipped once, in a redirect, and sent coordinators to a URL
       * containing the characters `${chatId}` immediately after they claimed a
       * conversation.
       *
       * The rule has false positives on strings that legitimately contain
       * `${`, which in this codebase is nothing, so it stays an error.
       */
      'no-template-curly-in-string': 'error',

      // A stray `debugger` in a production bundle is both a security and a
      // performance problem.
      'no-debugger': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    // The redaction module and the queue seam are the intended console sinks.
    files: ['src/lib/redact.ts', 'src/lib/inquiry-queue.ts'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];

export default config;
