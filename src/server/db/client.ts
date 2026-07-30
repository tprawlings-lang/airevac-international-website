import { Pool, type PoolClient, type QueryResultRow } from 'pg';

import { sslConfig } from './ssl.mjs';

/**
 * Postgres access.
 *
 * ONE POOL PER PROCESS. Next route handlers run in a long-lived Node process on
 * Render, so a module-level pool is correct and a per-request client is not:
 * Postgres connections are expensive, and a handler that opens one per request
 * exhausts the server's connection limit under exactly the load you least want
 * to fail under.
 *
 * The pool is created lazily so that importing this module in a test, or during
 * a build that never touches the database, does not open a connection.
 *
 * TLS IS REQUIRED IN PRODUCTION. This database will hold patient conversations.
 * `DATABASE_SSL=disable` exists for local development only and is refused
 * against any non-local host. The modes and what each one actually protects
 * against are documented in `src/server/db/ssl.mjs`.
 */

let pool: Pool | undefined;

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. The coordinator console cannot start without it. ' +
        'See docs/plans/coordinator-chat-plan.md for local setup.',
    );
  }
  return url;
}

export function getPool(): Pool {
  if (pool !== undefined) return pool;

  const url = connectionString();

  pool = new Pool({
    connectionString: url,
    // Shared with the migration CLI so the two cannot disagree about what they
    // will accept. See src/server/db/ssl.mjs.
    ssl: sslConfig(url, (message) =>
      console.error(JSON.stringify({ level: 'warn', event: 'db.tls_mode', message })),
    ),
    // Small: this is a handful of coordinators, not a public API. A large pool
    // on a small Postgres plan is a way to hit the server's limit rather than
    // the pool's, which fails far less gracefully.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  /*
   * An idle client erroring (a network blip, a server restart) emits on the
   * pool. Without a handler, Node treats it as an unhandled 'error' event and
   * takes the process down, which would turn a transient database hiccup into
   * a site outage.
   */
  pool.on('error', (error) => {
    console.error(
      JSON.stringify({ level: 'error', event: 'db.idle_client_error', message: error.message }),
    );
  });

  return pool;
}

/**
 * Parameterised query. `params` is always a bound parameter list, never
 * interpolated: this is the only query path in the application, so there is no
 * second place where someone could concatenate a string into SQL.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as unknown[]);
  return result.rows;
}

/** First row, or undefined. The common shape for a lookup by id or email. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/**
 * Runs `fn` inside a transaction, rolling back on any throw.
 *
 * Used wherever two writes must not be observable separately: creating a user
 * and its audit entry, or rotating a password and revoking that user's other
 * sessions. A password change that succeeds while the session revocation fails
 * leaves an attacker logged in with the old password already changed, which is
 * the worst of both outcomes.
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** Test teardown. Not reachable from any route. */
export async function __closePool(): Promise<void> {
  if (pool !== undefined) {
    await pool.end();
    pool = undefined;
  }
}
