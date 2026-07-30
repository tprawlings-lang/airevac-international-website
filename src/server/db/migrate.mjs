import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Migration runner.
 *
 * PLAIN JAVASCRIPT, AND IMPORTED BY BOTH THE CLI AND THE TESTS. It was
 * TypeScript first, which meant the command-line entry point could not import
 * it: `node` does not resolve the `@/` path alias, and the obvious workaround
 * is to duplicate the runner in a script. Two implementations of "apply
 * migrations in order, exactly once" is precisely the kind of duplication that
 * drifts silently and is discovered when a production database is missing a
 * table. One file, no alias, importable everywhere.
 *
 * Deliberately about sixty lines rather than a migration framework. What it
 * needs is two properties, and both are cheap to get right by hand:
 *
 *   APPLIED EXACTLY ONCE, recorded by filename in `schema_migrations`.
 *   APPLIED IN A TRANSACTION, so a migration that fails halfway leaves no
 *   partial schema. Postgres supports transactional DDL, which is why this is
 *   safe to do simply.
 *
 * A migration is never edited after it has run anywhere. Change the schema by
 * adding a file.
 */

export const MIGRATIONS_DIR = join(process.cwd(), 'src', 'server', 'db', 'migrations');

/**
 * @param {import('pg').Pool} pool
 * @param {(message: string) => void} [log]
 * @returns {Promise<{ applied: string[], alreadyApplied: string[] }>}
 */
export async function runMigrations(pool, log = () => {}) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const existing = await pool.query('SELECT filename FROM schema_migrations');
  const done = new Set(existing.rows.map((row) => row.filename));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const applied = [];
  const alreadyApplied = [];

  for (const file of files) {
    if (done.has(file)) {
      alreadyApplied.push(file);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      applied.push(file);
      log(`applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed and was rolled back: ${error.message}`);
    } finally {
      client.release();
    }
  }

  return { applied, alreadyApplied };
}
