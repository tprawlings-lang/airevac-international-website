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
import { sslConfig } from '../src/server/db/ssl.mjs';

const url = process.env.DATABASE_URL;

/*
 * No database is a legitimate deployment, not an error.
 *
 * This runs from `npm start`, so a non-zero exit here would stop the whole
 * site booting. The public marketing site has no database and must keep
 * serving without one: the phone number on every page is the thing that must
 * never go down, and it should certainly not go down over a coordinator
 * console that this deploy is not running.
 */
if (!url) {
  console.log('No DATABASE_URL. Skipping migrations; the coordinator console is unavailable.');
  process.exit(0);
}

/*
 * --boot marks the invocation that runs from `npm start`, immediately before
 * the web server. In that mode a failure here must not stop the server, for the
 * same reason a missing DATABASE_URL does not: the marketing site does not need
 * a database, and the phone number on every page is the thing that must never
 * go down. Failing loudly and serving beats failing silently, but both beat a
 * crash loop that takes the whole site off the internet over the coordinator
 * console.
 *
 * Run without the flag, by CI or by hand, it stays strict and exits non-zero,
 * because there the exit code is the entire point.
 */
const bootMode = process.argv.includes('--boot');

function fail(message, error) {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'db.migrations_failed',
      message,
      error: error === undefined ? undefined : String(error.message ?? error),
    }),
  );
  if (bootMode) {
    console.error(
      'Starting the web server anyway. The public site will serve normally; the ' +
        'coordinator console and chat will be unavailable until this is fixed.',
    );
    process.exit(0);
  }
  process.exit(1);
}

let pool;
try {
  pool = new pg.Pool({
    connectionString: url,
    // stdout, not stderr: an intentional configuration is not a failure, and a
    // deploy log that shows red for a healthy boot teaches people to ignore it.
    ssl: sslConfig(url, (message) => console.log(message)),
    /*
     * Bounded, because this runs immediately before the web server starts. The
     * driver's default is to wait indefinitely, so an unreachable database held
     * the whole site offline for as long as the operating system took to give
     * up on the socket: minutes of the public site being down over a console
     * that was not going to work either way. Ten seconds is longer than a
     * healthy database ever needs and short enough that nobody watching a
     * deploy assumes it has wedged.
     */
    connectionTimeoutMillis: 10_000,
  });
} catch (error) {
  // Thrown by sslConfig for a refused configuration, e.g. TLS disabled against
  // a remote host. Never a reason to serve nothing.
  fail('Database TLS configuration refused.', error);
}

try {
  const result = await runMigrations(pool, (message) => console.log(message));
  console.log(
    result.applied.length === 0
      ? `No pending migrations. ${result.alreadyApplied.length} already applied.`
      : `Applied ${result.applied.length} migration(s).`,
  );
} catch (error) {
  await pool.end().catch(() => {});
  fail('Could not apply migrations.', error);
} finally {
  await pool.end().catch(() => {});
}
