import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST, GET } from '@/app/api/callback/route';
import { __resetRateLimits } from '@/lib/rate-limit';
import { __resetInquiries } from '@/lib/inquiry-queue';

/**
 * Integration tests for the callback endpoint.
 *
 * Blueprint page 21 sets the integration launch gate: "All core and negative
 * paths pass." The negative paths are the ones that matter most here — a PHI
 * submission, an oversized body, a flood, and a duplicate.
 */

function request(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);

  return new NextRequest('https://airevacinternational.com/api/callback', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
      ...headers,
    },
    body: payload,
  });
}

let keyCounter = 0;
function freshKey(): string {
  keyCounter += 1;
  return `00000000-0000-4000-8000-${String(keyCounter).padStart(12, '0')}`;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    contactName: 'A. Case Manager',
    organization: 'Hospiten Cancun',
    role: 'hospital',
    originCity: 'Cancun',
    destinationCity: 'Tampa',
    timeframe: 'within-24-hours',
    phone: '+52 998 555 0100',
    email: 'casemgmt@example.org',
    preferredLanguage: 'en',
    callbackConsent: true,
    note: 'Ground transfer needed at both ends.',
    idempotencyKey: freshKey(),
    ...overrides,
  };
}

describe('POST /api/callback', () => {
  beforeEach(() => {
    __resetRateLimits();
    __resetInquiries();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('accepts a valid logistics-only submission and returns a reference', async () => {
    const response = await POST(request(validBody()));
    const body = (await response.json()) as { inquiryId: string };

    expect(response.status).toBe(200);
    expect(body.inquiryId).toMatch(/^AE-\d{8}-[0-9A-F]{6}$/);
  });

  it('never echoes submitted data back in the response', async () => {
    // Page 16: "never echo submitted data".
    const response = await POST(request(validBody()));
    const text = await response.text();

    for (const value of ['A. Case Manager', 'Hospiten', '998 555', 'casemgmt@example.org', 'Cancun']) {
      expect(text, `response echoed "${value}"`).not.toContain(value);
    }
  });

  it('sets no-store so a response is never cached', async () => {
    const response = await POST(request(validBody()));
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('rejects a submission carrying PHI, with an explanation', async () => {
    const response = await POST(
      request(validBody({ diagnosis: 'sepsis', patientName: 'J. Doe' })),
    );
    const body = (await response.json()) as { error: string; fields: string[] };

    expect(response.status).toBe(400);
    expect(body.error).toBe('forbidden_fields');
    expect(body.fields.sort()).toEqual(['diagnosis', 'patientName']);
  });

  it('logs a PHI rejection as a privacy event without logging the values', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await POST(request(validBody({ diagnosis: 'sepsis' })));

    const line = warn.mock.calls[0]?.[0] as string;
    expect(line).toContain('callback.forbidden_fields_rejected');
    expect(line).toContain('diagnosis'); // the field NAME
    expect(line).not.toContain('sepsis'); // never the VALUE
  });

  it('returns field-level errors without the submitted values', async () => {
    const response = await POST(request(validBody({ phone: '', callbackConsent: false })));
    const body = (await response.json()) as {
      error: string;
      fieldErrors: Record<string, string>;
    };

    expect(response.status).toBe(400);
    expect(body.error).toBe('validation_failed');
    expect(Object.keys(body.fieldErrors).sort()).toEqual(['callbackConsent', 'phone']);
  });

  it('rejects a non-JSON content type', async () => {
    const response = await POST(
      request('contactName=x', { 'content-type': 'application/x-www-form-urlencoded' }),
    );
    expect(response.status).toBe(415);
  });

  it('rejects malformed JSON', async () => {
    const response = await POST(request('{not json'));
    expect(response.status).toBe(400);
  });

  it('rejects an oversized body before parsing it', async () => {
    const response = await POST(request(validBody({ note: 'x'.repeat(20_000) })));
    expect(response.status).toBe(413);
  });

  it('is idempotent — a repeated key returns the same reference', async () => {
    const body = validBody();

    const first = (await (await POST(request(body))).json()) as { inquiryId: string };
    const second = (await (await POST(request(body))).json()) as { inquiryId: string };

    expect(second.inquiryId).toBe(first.inquiryId);
  });

  it('rate limits after five submissions from one address', async () => {
    // Page 16: "Callback creation — 5 per 15 minutes per IP".
    for (let i = 0; i < 5; i += 1) {
      const response = await POST(request(validBody()));
      expect(response.status, `submission ${i + 1}`).toBe(200);
    }

    const blocked = await POST(request(validBody()));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('buckets rate limits by coarsened address, not by exact IP', async () => {
    // 203.0.113.10 and .11 share a /24, so they share a bucket. This is what
    // stops a trivial rotation within one subnet from multiplying the limit.
    for (let i = 0; i < 5; i += 1) {
      await POST(request(validBody(), { 'x-forwarded-for': '203.0.113.10' }));
    }

    const response = await POST(request(validBody(), { 'x-forwarded-for': '203.0.113.11' }));
    expect(response.status).toBe(429);
  });

  it('uses the left-most forwarded address, not an appended one', async () => {
    // A caller can append to XFF but not prepend past the trusted proxy, so the
    // left-most entry is the client. Reading the wrong end lets a caller forge
    // their own bucket.
    for (let i = 0; i < 5; i += 1) {
      await POST(
        request(validBody(), { 'x-forwarded-for': '198.51.100.5, 10.0.0.1, 10.0.0.2' }),
      );
    }

    const sameClient = await POST(
      request(validBody(), { 'x-forwarded-for': '198.51.100.5, 172.16.0.9' }),
    );
    expect(sameClient.status).toBe(429);
  });
});

describe('GET /api/callback', () => {
  it('rejects the method explicitly rather than falling through', async () => {
    const response = await GET();
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});
