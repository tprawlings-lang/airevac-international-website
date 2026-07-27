/**
 * Log redaction. Blueprint page 13 ("Redact logs"), page 15 (Sensitive PII is
 * "Encrypted, minimized, short retention, no ad use"), and page 16 ("never echo
 * submitted data").
 *
 * The rule this module enforces: an inquiry may be *counted* and *traced*, never
 * *reproduced*. Logs carry an inquiry ID and shape metadata so operations can
 * debug a failure, and carry no value a person could be identified by.
 */

/** Keys whose values are never written to a log, in any environment. */
const SENSITIVE_KEYS = new Set([
  'contactname',
  'organization',
  'origincity',
  'destinationcity',
  'phone',
  'email',
  'note',
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'apikey',
  'api_key',
  'secret',
  'password',
]);

export const REDACTED = '[redacted]';

/**
 * Recursively replaces sensitive values with `[redacted]`.
 *
 * Non-sensitive scalars pass through so that role, timeframe, language, and
 * status codes remain queryable — those are the fields operations actually needs
 * and none of them identifies a person.
 */
export function redact(value: unknown, depth = 0): unknown {
  // Depth cap prevents a hostile deeply-nested body from turning logging into a
  // stack overflow.
  if (depth > 6) return REDACTED;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? REDACTED
        : redact(nested, depth + 1);
    }
    return output;
  }

  return value;
}

/**
 * Coarsens an IP for rate-limit bookkeeping.
 *
 * Section 15 caps raw IP retention at 30 days; truncating to the /24 (IPv4) or
 * /48 (IPv6) keeps abuse controls effective while shrinking what is retained.
 * Returns a stable placeholder when the address is absent or unparseable so the
 * limiter still has a bucket key.
 */
export function coarsenIp(ip: string | null | undefined): string {
  if (!ip) return 'unknown';

  const trimmed = ip.trim();

  if (trimmed.includes(':')) {
    const groups = trimmed.split(':').filter(Boolean);
    return groups.length >= 3 ? `${groups.slice(0, 3).join(':')}::/48` : 'unknown';
  }

  const octets = trimmed.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d{1,3}$/.test(part))) {
    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
  }

  return 'unknown';
}

/**
 * Structured, redaction-safe log line.
 *
 * Every server-side log in this application goes through here. Direct
 * `console.log(body)` is what leaks PHI, so it is banned by the lint rule in
 * eslint.config.mjs and by review.
 */
export function safeLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...(redact(fields) as Record<string, unknown>),
  });

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
