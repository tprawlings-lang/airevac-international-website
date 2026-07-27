import { NextResponse, type NextRequest } from 'next/server';
import { detectForbiddenFields, publicIntakeSchema } from '@/lib/intake-schema';
import { consume } from '@/lib/rate-limit';
import { coarsenIp, safeLog } from '@/lib/redact';
import { recordInquiry } from '@/lib/inquiry-queue';

/**
 * Secure callback endpoint. Blueprint section 6 (stage: Triage) — the website's
 * responsibility is to "Collect role, origin, destination, timing, language and
 * callback consent" and the system's responsibility is to "Create an inquiry ID".
 *
 * WHAT THIS ENDPOINT DELIBERATELY DOES NOT DO
 *  - It does not accept clinical data. `.strict()` on the schema plus
 *    `detectForbiddenFields` make a PHI submission an error and a logged privacy
 *    event, not a silently-stored record.
 *  - It does not write to JetInsight. Page 14: no integration until the BAA
 *    position, API documents, and data-flow answers exist (D7).
 *  - It does not echo submitted data back in any response. Page 16 requires
 *    "never echo submitted data" — the success body carries only an inquiry ID.
 *  - It does not set a cookie or fire an analytics event. Page 19 prohibits
 *    pixels, tag managers, and ad cookies on intake.
 *
 * `force-dynamic` because every response depends on rate-limit state and must
 * never be cached; `next.config.ts` also sets `no-store` on /api/*.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Max body size. Larger payloads are rejected before parsing (page 16). */
const MAX_BODY_BYTES = 8 * 1024;

function clientIp(request: NextRequest): string {
  // Behind the CDN/WAF, the left-most XFF entry is the client. The proxy chain
  // must be trusted and the header stripped at the edge — recorded in
  // docs/adr/0003-rate-limiting.md as a deployment requirement, because an
  // un-stripped XFF lets a caller forge their own rate-limit bucket.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const first = forwarded.split(',')[0];
    if (first !== undefined) return first.trim();
  }
  return request.headers.get('x-real-ip') ?? '';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipBucket = coarsenIp(clientIp(request));

  // --- 1. Rate limit before parsing --------------------------------------
  // Page 16: "Callback creation — 5 per 15 minutes per IP". Checked first so a
  // flood costs us a map lookup rather than a JSON parse.
  const limit = await consume('callbackPerIp', ipBucket);

  if (!limit.allowed) {
    safeLog('warn', 'callback.rate_limited', { ipBucket, retryAfter: limit.retryAfterSeconds });

    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds),
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  // --- 2. Content type and size ------------------------------------------
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // --- 3. PHI tripwire -----------------------------------------------------
  // Runs before schema validation so a clinical submission is recognised as a
  // privacy event rather than a generic 400. The field NAMES are logged; the
  // values never are.
  const forbidden = detectForbiddenFields(body);
  if (forbidden.length > 0) {
    safeLog('warn', 'callback.forbidden_fields_rejected', { ipBucket, fields: forbidden });

    return NextResponse.json(
      {
        error: 'forbidden_fields',
        message:
          'This form does not accept medical, insurance, identification, or payment ' +
          'information. A flight coordinator will open a protected channel for those details.',
        fields: forbidden,
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // --- 4. Allowlist validation --------------------------------------------
  const parsed = publicIntakeSchema.safeParse(body);

  if (!parsed.success) {
    // Field NAMES and messages only. The submitted values are never returned or
    // logged (page 16: "never echo submitted data").
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && fieldErrors[field] === undefined) {
        fieldErrors[field] = issue.message;
      }
    }

    safeLog('info', 'callback.validation_failed', {
      ipBucket,
      fields: Object.keys(fieldErrors),
    });

    return NextResponse.json(
      { error: 'validation_failed', fieldErrors },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const intake = parsed.data;

  // --- 5. Idempotent accept ------------------------------------------------
  // Section 14: a retry or double-submit must not create a second transport
  // case. The same key returns the same inquiry ID with 200.
  const result = await recordInquiry(intake);

  safeLog('info', result.duplicate ? 'callback.duplicate_suppressed' : 'callback.accepted', {
    ipBucket,
    inquiryId: result.inquiryId,
    // Non-identifying operational dimensions, per the measurement plan on
    // page 19: referral type, timing, language. No name, phone, email, or route.
    role: intake.role,
    timeframe: intake.timeframe,
    preferredLanguage: intake.preferredLanguage,
  });

  return NextResponse.json(
    { inquiryId: result.inquiryId },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

/** Any other method is rejected explicitly rather than falling through. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } });
}
