/**
 * Rate limiting. Blueprint page 16, "Starting rate limits, then tune with
 * observed traffic":
 *
 *   Public pages      120 requests / minute / IP at origin
 *   Callback creation 5 per 15 minutes per IP, 10 per day per contact
 *   Chat starts       3 per 10 minutes per IP
 *   Admin login       5 failures per 15 minutes per user and IP
 *   Upload session    10 signed sessions per hour per authorized case
 *
 *   "These are safe starting values, not permanent limits."
 *
 * IMPLEMENTATION NOTE — this is an in-memory limiter. It is correct for a single
 * origin instance and is NOT sufficient for the multi-instance production
 * deployment: each instance would keep its own counters, multiplying the
 * effective limit by the instance count. Production must back this with a shared
 * store (the CDN/WAF rate limiter, or Redis). See
 * docs/adr/0003-rate-limiting.md. The interface is deliberately async so that
 * swap requires no caller changes.
 */

export interface RateLimitRule {
  /** Requests permitted inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const RATE_LIMITS = {
  publicPage: { limit: 120, windowMs: MINUTE },
  callbackPerIp: { limit: 5, windowMs: 15 * MINUTE },
  callbackPerContact: { limit: 10, windowMs: DAY },
  chatStart: { limit: 3, windowMs: 10 * MINUTE },
  adminLoginFailure: { limit: 5, windowMs: 15 * MINUTE },
  uploadSession: { limit: 10, windowMs: HOUR },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
  /** Seconds to wait, for the `Retry-After` header. Only set when blocked. */
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Bounds memory so a distributed source of unique keys cannot grow the map
 * without limit. When exceeded, expired buckets are dropped first; if that is
 * not enough the map is cleared, which fails OPEN for one window.
 *
 * Failing open is the deliberate choice: the blueprint requires the urgent
 * contact path to stay usable (page 20, graceful degradation). A limiter that
 * fails closed under memory pressure would block real hospital referrals. The
 * CDN/WAF layer is the backstop that must fail closed instead.
 */
const MAX_BUCKETS = 50_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_BUCKETS) buckets.clear();
}

/**
 * Consumes one unit against `name` for `identifier`.
 *
 * `identifier` must already be coarsened/hashed by the caller — see
 * `coarsenIp`. Never pass a raw email or phone number: this map would then hold
 * identifiable contact data outside the retention schedule.
 */
export async function consume(
  name: RateLimitName,
  identifier: string,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const rule = RATE_LIMITS[name];
  const key = `${name}:${identifier}`;

  // Amortised cleanup: sweep roughly once every 500 calls rather than on every
  // request, so the hot path stays O(1).
  if (buckets.size > 0 && Math.floor(now / 1000) % 500 === 0) sweep(now);

  const existing = buckets.get(key);

  if (existing === undefined || existing.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: rule.limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;

  const allowed = existing.count <= rule.limit;

  return {
    allowed,
    remaining: Math.max(0, rule.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Test-only reset. Not exported through any route. */
export function __resetRateLimits(): void {
  buckets.clear();
}
