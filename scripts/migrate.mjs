/**
 * Applies pending database migrations.
 *
 * Safe to run repeatedly and on every deploy: each migration is applied once,
 * recorded by filename, and wrapped in a transaction.
 *
 * Usage: DATABASE_URL=postgresql://... npm run db:migrate
 */
import pg from 'pg';

import { runMigrations } from '../src/server/db/migrate.mjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. See .env.example.');
  process.exit(1);
}

const sslDisabled = process.env.DATABASE_SSL === 'disable';
const host = new URL(url).hostname;
const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

if (sslDisabled && !isLocal) {
  console.error('DATABASE_SSL=disable is only permitted for a local database.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: sslDisabled ? undefined : { rejectUnauthorized: true },
});

try {
  const result = await runMigrations(pool, (message) => console.log(message));
  console.log(
    result.applied.length === 0
      ? `No pending migrations. ${result.alreadyApplied.length} already applied.`
      : `Applied ${result.applied.length} migration(s).`,
  );
} finally {
  await pool.end();
}
