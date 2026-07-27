import { beforeEach, describe, expect, it, vi } from 'vitest';

import { coarsenIp, redact, REDACTED, safeLog } from '@/lib/redact';
import { __resetRateLimits, consume, RATE_LIMITS } from '@/lib/rate-limit';
import { __resetInquiries, recordInquiry } from '@/lib/inquiry-queue';
import type { PublicIntake } from '@/lib/intake-schema';

/**
 * Tests for the privacy and abuse controls: log redaction (page 13, page 16),
 * rate limits (page 16), and inquiry idempotency (page 20).
 */

describe('redact — logs never reproduce an inquiry', () => {
  it('redacts every identifying field', () => {
    const result = redact({
      contactName: 'A. Case Manager',
      organization: 'Hospiten Cancun',
      phone: '+52 998 555 0100',
      email: 'x@example.org',
      originCity: 'Cancun',
      destinationCity: 'Tampa',
      note: 'anything at all',
    }) as Record<string, unknown>;

    for (const value of Object.values(result)) {
      expect(value).toBe(REDACTED);
    }
  });

  it('preserves non-identifying operational dimensions', () => {
    // Role, timeframe, and language are what operations actually queries on, and
    // none of them identifies a person.
    const result = redact({
      role: 'hospital',
      timeframe: 'within-24-hours',
      preferredLanguage: 'es',
      status: 200,
    }) as Record<string, unknown>;

    expect(result).toEqual({
      role: 'hospital',
      timeframe: 'within-24-hours',
      preferredLanguage: 'es',
      status: 200,
    });
  });

  it('redacts credentials and secrets', () => {
    const result = redact({
      authorization: 'Bearer abc',
      cookie: 'session=1',
      apiKey: 'k',
      password: 'p',
    }) as Record<string, unknown>;

    for (const value of Object.values(result)) {
      expect(value).toBe(REDACTED);
    }
  });

  it('redacts nested and arrayed values', () => {
    const result = redact({
      inquiries: [{ phone: '555', role: 'cruise' }],
    }) as { inquiries: { phone: string; role: string }[] };

    expect(result.inquiries[0]?.phone).toBe(REDACTED);
    expect(result.inquiries[0]?.role).toBe('cruise');
  });

  it('caps recursion so a deeply nested body cannot overflow the stack', () => {
    let deep: Record<string, unknown> = { role: 'hospital' };
    for (let i = 0; i < 50; i += 1) deep = { nested: deep };

    expect(() => redact(deep)).not.toThrow();
  });
});

describe('coarsenIp — abuse controls without retaining full addresses', () => {
  it('truncates IPv4 to a /24', () => {
    expect(coarsenIp('203.0.113.42')).toBe('203.0.113.0/24');
  });

  it('truncates IPv6 to a /48', () => {
    expect(coarsenIp('2001:db8:1234:5678::1')).toBe('2001:db8:1234::/48');
  });

  it('returns a stable bucket for a missing or unparseable address', () => {
    // The limiter still needs a key; it must not throw or fall open per-request.
    for (const value of [null, undefined, '', 'not-an-ip', '999']) {
      expect(coarsenIp(value)).toBe('unknown');
    }
  });
});

describe('safeLog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emits structured JSON with sensitive values redacted', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    safeLog('info', 'callback.accepted', { inquiryId: 'AE-1', phone: '555', role: 'family' });

    const line = JSON.parse(spy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(line.event).toBe('callback.accepted');
    expect(line.inquiryId).toBe('AE-1');
    expect(line.phone).toBe(REDACTED);
    expect(line.role).toBe('family');
  });

  it('routes warn and error to the matching console channel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    safeLog('warn', 'a');
    safeLog('error', 'b');

    expect(warn).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });
});

describe('rate limits — blueprint page 16 starting values', () => {
  beforeEach(() => {
    __resetRateLimits();
  });

  it('encodes the documented starting thresholds', () => {
    // If someone changes a limit, they must change this test — which is the
    // prompt to record the new threshold in an ADR, as page 16 requires.
    expect(RATE_LIMITS.callbackPerIp).toEqual({ limit: 5, windowMs: 15 * 60_000 });
    expect(RATE_LIMITS.chatStart).toEqual({ limit: 3, windowMs: 10 * 60_000 });
    expect(RATE_LIMITS.publicPage).toEqual({ limit: 120, windowMs: 60_000 });
    expect(RATE_LIMITS.adminLoginFailure).toEqual({ limit: 5, windowMs: 15 * 60_000 });
  });

  it('allows exactly the limit, then blocks', async () => {
    const now = 1_000_000;

    for (let i = 0; i < 5; i += 1) {
      const result = await consume('callbackPerIp', '203.0.113.0/24', now);
      expect(result.allowed, `request ${i + 1}`).toBe(true);
    }

    const blocked = await consume('callbackPerIp', '203.0.113.0/24', now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps separate buckets per identifier', async () => {
    const now = 2_000_000;
    for (let i = 0; i < 5; i += 1) await consume('callbackPerIp', 'a', now);

    expect((await consume('callbackPerIp', 'a', now)).allowed).toBe(false);
    expect((await consume('callbackPerIp', 'b', now)).allowed).toBe(true);
  });

  it('keeps separate buckets per limit name', async () => {
    const now = 3_000_000;
    for (let i = 0; i < 5; i += 1) await consume('callbackPerIp', 'x', now);

    expect((await consume('callbackPerIp', 'x', now)).allowed).toBe(false);
    expect((await consume('chatStart', 'x', now)).allowed).toBe(true);
  });

  it('resets after the window elapses', async () => {
    const start = 4_000_000;
    for (let i = 0; i < 5; i += 1) await consume('callbackPerIp', 'y', start);
    expect((await consume('callbackPerIp', 'y', start)).allowed).toBe(false);

    const afterWindow = start + RATE_LIMITS.callbackPerIp.windowMs + 1;
    expect((await consume('callbackPerIp', 'y', afterWindow)).allowed).toBe(true);
  });
});

describe('inquiry idempotency — no duplicate transport cases (page 20)', () => {
  beforeEach(() => {
    __resetInquiries();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  const intake = (key: string): PublicIntake => ({
    contactName: 'A. Case Manager',
    organization: '',
    role: 'hospital',
    originCity: 'Cancun',
    destinationCity: 'Tampa',
    timeframe: 'within-24-hours',
    phone: '555',
    email: '',
    preferredLanguage: 'en',
    callbackConsent: true,
    note: '',
    idempotencyKey: key,
  });

  it('mints a reference on first acceptance', async () => {
    const result = await recordInquiry(intake('key-1'), new Date('2026-07-27T00:00:00Z'));

    expect(result.duplicate).toBe(false);
    expect(result.inquiryId).toMatch(/^AE-20260727-[0-9A-F]{6}$/);
  });

  it('returns the same reference for a repeated key and creates no second case', async () => {
    const first = await recordInquiry(intake('key-2'));
    const second = await recordInquiry(intake('key-2'));

    expect(second.duplicate).toBe(true);
    expect(second.inquiryId).toBe(first.inquiryId);
  });

  it('treats different keys as different cases', async () => {
    const a = await recordInquiry(intake('key-3'));
    const b = await recordInquiry(intake('key-4'));

    expect(b.duplicate).toBe(false);
    expect(b.inquiryId).not.toBe(a.inquiryId);
  });

  it('accepts a new case once the idempotency window has passed', async () => {
    const day1 = new Date('2026-07-27T00:00:00Z');
    const day3 = new Date('2026-07-29T00:00:00Z');

    const first = await recordInquiry(intake('key-5'), day1);
    const later = await recordInquiry(intake('key-5'), day3);

    expect(later.duplicate).toBe(false);
    expect(later.inquiryId).not.toBe(first.inquiryId);
  });

  it('does not encode a sequential counter in the reference', async () => {
    // A sequential ID would leak daily inquiry volume to anyone who submitted
    // two forms.
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const ids = await Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map((key) => recordInquiry(intake(key))),
    );
    const suffixes = ids.map((result) => result.inquiryId.split('-')[2]);

    expect(new Set(suffixes).size).toBe(5);
  });
});
