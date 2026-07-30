/**
 * Types for the plain-JavaScript TLS configuration.
 *
 * JavaScript for the same reason as the migration runner: `scripts/migrate.mjs`
 * imports it under bare Node, with no build step and no path alias.
 */

export declare function sslConfig(
  url: string,
  log?: (message: string) => void,
): false | { rejectUnauthorized: boolean; ca?: string };
