import type { Pool } from 'pg';

/**
 * Types for the plain-JavaScript migration runner.
 *
 * The runner is JavaScript so that both the CLI (plain `node`, no path alias)
 * and the tests (vitest, with the alias) can import the same file. This
 * declaration gives the TypeScript side the types it would otherwise lose.
 */

export declare const MIGRATIONS_DIR: string;

export declare function runMigrations(
  pool: Pool,
  log?: (message: string) => void,
): Promise<{ applied: string[]; alreadyApplied: string[] }>;
