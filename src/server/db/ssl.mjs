/**
 * How we present TLS to Postgres, in one place.
 *
 * This lived in two files that had to agree: the pool used by the application
 * and the pool used by the migration CLI. They did agree, right up until the
 * moment a real managed database presented a certificate neither of them would
 * accept, and then both were wrong in the same way at once. One function now,
 * imported by both.
 *
 * PLAIN JAVASCRIPT because `scripts/migrate.mjs` runs under bare Node before
 * any TypeScript build output exists. `ssl.d.mts` gives the TypeScript side its
 * types.
 *
 * THE DEFAULT IS FULL VERIFICATION. This database holds patient conversations,
 * so every weaker mode below has to be asked for by name and says so in the
 * log every time the process starts. Nothing here degrades silently.
 */

/** Hosts where unencrypted Postgres is acceptable, which is a developer laptop. */
function isLocalHost(url) {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

/**
 * Builds the `ssl` option for a `pg` Pool.
 *
 * @param {string} url  the connection string
 * @param {(message: string) => void} [log]  receives one line when a weakened
 *   mode is selected, so the choice is visible in the deploy log rather than
 *   only in someone's memory of the dashboard
 * @returns {false | { rejectUnauthorized: boolean, ca?: string }}
 * @throws if TLS is disabled against a host that is not local
 */
export function sslConfig(url, log = () => {}) {
  const mode = process.env.DATABASE_SSL ?? '';

  if (mode === 'disable') {
    if (!isLocalHost(url)) {
      throw new Error(
        'DATABASE_SSL=disable is only permitted for a local database. Refusing to ' +
          'connect to a remote host without TLS.',
      );
    }
    return false;
  }

  /*
   * A supplied CA is the only configuration that both encrypts AND proves what
   * it is talking to. Managed providers publish one; this is the setting to use
   * before the database holds anything real.
   */
  const ca = process.env.DATABASE_CA_CERT ?? '';
  if (ca !== '') return { rejectUnauthorized: true, ca };

  if (mode === 'no-verify') {
    /*
     * Encrypted, but the certificate is not checked against a trust anchor.
     *
     * WHY THIS EXISTS. Managed Postgres providers commonly present a
     * self-signed certificate, and on a private network the internal hostname
     * would not match a public certificate anyway. Full verification there
     * requires the provider's CA, which is a file somebody has to fetch. Until
     * they do, the realistic choice is encrypted-but-unverified or no database
     * at all, and refusing to start would take the marketing site down with it.
     *
     * WHAT IT COSTS. Traffic is protected from a passive observer but not from
     * an active attacker positioned between this process and the database. On a
     * provider's internal network that means trusting the provider's network,
     * which is a smaller assumption than it sounds like given they also run the
     * database, but it is not nothing.
     *
     * It must be asked for by name, it is announced on every boot, and
     * supplying DATABASE_CA_CERT overrides it. Do not ship a launch on it: see
     * docs/executive-sign-off-register.md.
     */
    log(
      'DATABASE_SSL=no-verify: connecting over TLS without verifying the database ' +
        'certificate. Set DATABASE_CA_CERT to the provider CA before this holds real data.',
    );
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
}
