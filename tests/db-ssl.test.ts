import { afterEach, describe, expect, it } from 'vitest';

import { sslConfig } from '@/server/db/ssl.mjs';

/**
 * How the database connection presents TLS.
 *
 * This is the configuration a real deploy got wrong: a managed Postgres
 * presented a self-signed certificate, strict verification refused it, and the
 * migration step took the entire site down with it. The rules below are the
 * ones that must not drift, in either direction: no silent downgrade, and no
 * configuration that can only be satisfied by turning TLS off.
 */

const LOCAL = 'postgres://u:p@localhost:5432/db';
const REMOTE = 'postgres://u:p@db.example.com:5432/db';

describe('database TLS configuration', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('verifies the certificate by default', () => {
    delete process.env.DATABASE_SSL;
    delete process.env.DATABASE_CA_CERT;

    expect(sslConfig(REMOTE)).toEqual({ rejectUnauthorized: true });
  });

  it('refuses to disable TLS against a remote host', () => {
    // The guard that stops a local convenience becoming a production posture.
    process.env.DATABASE_SSL = 'disable';

    expect(() => sslConfig(REMOTE)).toThrow(/only permitted for a local database/);
  });

  it('allows TLS to be disabled for a local database', () => {
    process.env.DATABASE_SSL = 'disable';

    expect(sslConfig(LOCAL)).toBe(false);
  });

  it('announces itself when verification is switched off', () => {
    process.env.DATABASE_SSL = 'no-verify';
    const lines: string[] = [];

    expect(sslConfig(REMOTE, (m) => lines.push(m))).toEqual({ rejectUnauthorized: false });

    /*
     * The point of the log line: a weakened mode must be visible in the deploy
     * output every time, not only in someone's memory of a dashboard setting.
     */
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('without verifying');
    expect(lines[0]).toContain('DATABASE_CA_CERT');
  });

  it('never weakens verification without being asked', () => {
    // No mode set: the absence of configuration must not mean the weak option.
    const lines: string[] = [];
    delete process.env.DATABASE_SSL;

    expect(sslConfig(REMOTE, (m) => lines.push(m))).toEqual({ rejectUnauthorized: true });
    expect(lines).toEqual([]);
  });

  it('prefers a supplied CA over no-verify, so the strong setting wins', () => {
    /*
     * Ordering that matters operationally: someone fixes the deploy by adding
     * the provider CA and should not have to remember to also remove the
     * weakening variable. Adding security takes effect on its own.
     */
    process.env.DATABASE_SSL = 'no-verify';
    process.env.DATABASE_CA_CERT = '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----';
    const lines: string[] = [];

    expect(sslConfig(REMOTE, (m) => lines.push(m))).toEqual({
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA_CERT,
    });
    expect(lines).toEqual([]);
  });

  it('still refuses a disabled remote connection even with a CA present', () => {
    // `disable` means no TLS at all, so a CA cannot rescue it.
    process.env.DATABASE_SSL = 'disable';
    process.env.DATABASE_CA_CERT = 'anything';

    expect(() => sslConfig(REMOTE)).toThrow(/only permitted for a local database/);
  });
});
