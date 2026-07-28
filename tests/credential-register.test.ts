import { describe, expect, it } from 'vitest';

import {
  blockingReasons,
  daysUntilExpiry,
  expiryNotices,
  isExpired,
  publishable,
  publishableRecords,
  type ClaimRecord,
} from '@/lib/credential-register';
import { CREDENTIAL_REGISTER, findClaim } from '@/content/credentials';
import { FLEET, FLEET_CLAIMS } from '@/content/fleet';

/**
 * Tests for the non-negotiable launch rule (blueprint page 2).
 *
 * These are the highest-value tests in the repository. If the gate regresses,
 * the site publishes an expired accreditation or an unevidenced safety rating —
 * which is the specific failure the readiness matrix rates High/Critical.
 */

const NOW = new Date('2026-07-27T12:00:00Z');

/** A fully-evidenced record, used as the baseline to subtract from. */
function validRecord(overrides: Partial<ClaimRecord> = {}): ClaimRecord {
  return {
    id: 'test',
    category: 'coverage', // not in the two-person set, so the baseline is minimal
    scope: 'Test scope',
    holder: 'Test Holder',
    issuer: 'Test Issuer',
    owner: 'Compliance lead',
    sourceDocument: 'Test document',
    verificationUrl: null,
    approvedOn: '2026-01-01',
    lastReviewedOn: '2026-01-01',
    expiresOn: '2027-01-01',
    secondApprover: null,
    status: 'cleared',
    ...overrides,
  };
}

describe('publishable — the launch gate', () => {
  it('publishes a fully evidenced, in-date, cleared record', () => {
    expect(publishable(validRecord(), NOW)).toBe(true);
    expect(blockingReasons(validRecord(), NOW)).toEqual([]);
  });

  it.each([
    ['owner', { owner: null }],
    ['source document', { sourceDocument: null }],
    ['approval date', { approvedOn: null }],
    ['review date', { lastReviewedOn: null }],
  ] as const)('refuses to publish a record missing its %s', (_label, override) => {
    expect(publishable(validRecord(override), NOW)).toBe(false);
  });

  it.each(['hold', 'gap'] as const)('refuses to publish a record with status "%s"', (status) => {
    expect(publishable(validRecord({ status }), NOW)).toBe(false);
  });

  it('refuses to publish an expired record', () => {
    const record = validRecord({ expiresOn: '2026-07-26' });
    expect(publishable(record, NOW)).toBe(false);
    expect(blockingReasons(record, NOW)).toContain('Expired on 2026-07-26.');
  });

  it('publishes a record expiring today — expiry is end-of-day, not start', () => {
    // A certificate valid "through" a date is valid on that date.
    expect(publishable(validRecord({ expiresOn: '2026-07-27' }), NOW)).toBe(true);
  });

  it('treats a malformed expiry date as blocking rather than coercing it', () => {
    // Date.parse('not-a-date') is NaN; a naive comparison would silently pass.
    const record = validRecord({ expiresOn: 'not-a-date' });
    expect(publishable(record, NOW)).toBe(false);
    expect(blockingReasons(record, NOW).join(' ')).toContain('not a valid ISO date');
  });

  it('blocks a date that is ISO-shaped but not a real calendar date', () => {
    // '2026-13-45' passes the shape check but Date.parse returns NaN. Without
    // the explicit NaN guard this would compare as false and publish.
    const record = validRecord({ expiresOn: '2026-13-45' });
    expect(publishable(record, NOW)).toBe(false);
    expect(blockingReasons(record, NOW).join(' ')).toContain('not a valid ISO date');
  });

  it('allows a null expiry only as a deliberate never-expires statement', () => {
    expect(publishable(validRecord({ expiresOn: null }), NOW)).toBe(true);
  });
});

describe('two-person approval (blueprint page 17)', () => {
  it.each(['accreditation', 'certificate', 'safety-rating', 'license', 'clinical'] as const)(
    'requires a second approver for category "%s"',
    (category) => {
      const record = validRecord({ category, secondApprover: null });
      expect(publishable(record, NOW)).toBe(false);
      expect(blockingReasons(record, NOW).join(' ')).toContain('second approver');
    },
  );

  it('rejects self-approval — the second approver must be a different person', () => {
    const record = validRecord({
      category: 'accreditation',
      owner: 'Compliance lead',
      secondApprover: 'Compliance lead',
    });
    expect(publishable(record, NOW)).toBe(false);
    expect(blockingReasons(record, NOW).join(' ')).toContain('different person');
  });

  it('publishes a regulated record with two distinct approvers', () => {
    const record = validRecord({
      category: 'accreditation',
      owner: 'Compliance lead',
      secondApprover: 'Executive sponsor',
    });
    expect(publishable(record, NOW)).toBe(true);
  });

  it('does not require a second approver for aircraft or coverage records', () => {
    expect(publishable(validRecord({ category: 'aircraft' }), NOW)).toBe(true);
    expect(publishable(validRecord({ category: 'coverage' }), NOW)).toBe(true);
  });
});

describe('expiry arithmetic', () => {
  it('counts whole days to expiry', () => {
    expect(daysUntilExpiry(validRecord({ expiresOn: '2026-08-26' }), NOW)).toBe(30);
    expect(daysUntilExpiry(validRecord({ expiresOn: '2026-07-27' }), NOW)).toBe(0);
    expect(daysUntilExpiry(validRecord({ expiresOn: '2026-07-20' }), NOW)).toBe(-7);
  });

  it('returns null for a record with no expiry', () => {
    expect(daysUntilExpiry(validRecord({ expiresOn: null }), NOW)).toBeNull();
    expect(isExpired(validRecord({ expiresOn: null }), NOW)).toBe(false);
  });

  it('returns null rather than NaN for an unparseable expiry', () => {
    // Callers branch on `null`; leaking NaN would make every comparison false
    // and quietly treat the record as in-date.
    expect(daysUntilExpiry(validRecord({ expiresOn: 'not-a-date' }), NOW)).toBeNull();
    expect(daysUntilExpiry(validRecord({ expiresOn: '2026-13-45' }), NOW)).toBeNull();
    expect(isExpired(validRecord({ expiresOn: 'not-a-date' }), NOW)).toBe(false);
    expect(expiryNotices([validRecord({ expiresOn: 'not-a-date' })], NOW)).toEqual([]);
  });

  it('ignores the time of day — expiry is a calendar fact', () => {
    const lateInDay = new Date('2026-07-27T23:59:59Z');
    expect(isExpired(validRecord({ expiresOn: '2026-07-27' }), lateInDay)).toBe(false);
  });
});

describe('expiryNotices — 120/90/60/30 day warnings (page 24)', () => {
  it('reports the tightest window a record falls inside', () => {
    const records = [
      validRecord({ id: 'in-100-days', expiresOn: '2026-11-04' }), // 100 days
      validRecord({ id: 'in-25-days', expiresOn: '2026-08-21' }), //  25 days
    ];

    const notices = expiryNotices(records, NOW);

    expect(notices.map((notice) => notice.record.id)).toEqual(['in-25-days', 'in-100-days']);
    expect(notices[0]?.threshold).toBe(30);
    expect(notices[1]?.threshold).toBe(120);
  });

  it('does not warn about a record outside every window', () => {
    expect(expiryNotices([validRecord({ expiresOn: '2027-12-31' })], NOW)).toEqual([]);
  });

  it('does not warn about an already-expired record — that is a blocker, not a warning', () => {
    expect(expiryNotices([validRecord({ expiresOn: '2026-01-01' })], NOW)).toEqual([]);
  });
});

/* ==========================================================================
   The real register. These assertions encode the evidence findings from
   blueprint section 1 and must fail loudly if someone relaxes a hold.
   ========================================================================== */

describe('the real credential register', () => {
  it('never publishes NAAMTA — the accreditation date has passed (D1)', () => {
    const naamta = findClaim('naamta');
    expect(naamta).toBeDefined();
    expect(publishable(naamta!, NOW)).toBe(false);
  });

  it('never publishes ARGUS — no current rating evidence (D3)', () => {
    const argus = findClaim('argus');
    expect(argus).toBeDefined();
    expect(publishable(argus!, NOW)).toBe(false);
  });

  it('never publishes the Part 135 certificate claim — OpSpecs not reviewed (D4)', () => {
    const part135 = findClaim('part-135');
    expect(part135).toBeDefined();
    expect(publishable(part135!, NOW)).toBe(false);
  });

  it('never publishes the reserve Learjet 35, fleet status unresolved (D5)', () => {
    const reserve = FLEET.find((aircraft) => aircraft.internalRef === 'AC-35-R');
    expect(reserve).toBeDefined();
    expect(publishable(reserve!.claim, NOW)).toBe(false);
  });

  it('never publishes a 24/7 Spanish staffing promise before D11 closes', () => {
    const bilingual = findClaim('bilingual-coordination');
    expect(bilingual).toBeDefined();
    expect(publishable(bilingual!, NOW)).toBe(false);
  });

  it('never publishes a chat response-time promise before the 30-day test (D14)', () => {
    const chat = findClaim('chat-response-time');
    expect(chat).toBeDefined();
    expect(publishable(chat!, NOW)).toBe(false);
  });

  it('publishes both working Learjet 31As and only those', () => {
    // The publishable count is what backs the public "two Learjet 31A
    // aircraft" statement (handoff G-04).
    const published = publishableRecords(FLEET_CLAIMS, NOW).map((record) => record.id);
    expect(published).toContain('aircraft-31a-1');
    expect(published).toContain('aircraft-31a-2');
    expect(published).not.toContain('aircraft-35-reserve');
    expect(published).toHaveLength(2);
  });

  it('never carries a registration or tail number in the fleet register source (G-03)', () => {
    // Identifying details belong in docs/fleet-register.md, never in src/.
    const serialized = JSON.stringify(FLEET);
    expect(serialized).not.toMatch(/\bN[0-9][0-9A-Z]{1,4}\b/);
  });

  it('keeps every held and gapped record in the file for the audit trail', () => {
    // Deleting a hold loses the record of what was deliberately not published.
    const ids = CREDENTIAL_REGISTER.map((record) => record.id);
    for (const id of ['naamta', 'argus', 'part-135', 'state-ems-licenses']) {
      expect(ids).toContain(id);
    }
  });

  it('gives every register entry a note explaining its status', () => {
    // A hold without a reason becomes a mystery six months later.
    for (const record of [...CREDENTIAL_REGISTER, ...FLEET_CLAIMS]) {
      if (record.status !== 'cleared') {
        expect(record.note, `${record.id} has no note`).toBeTruthy();
      }
    }
  });

  it('never marks the fleet ownership language as cleared before D4', () => {
    // Page 6 forbids "owned and operated" without leases, OpSpecs, and
    // operating control on file.
    for (const aircraft of FLEET) {
      expect(aircraft.ownershipLanguageCleared, aircraft.internalRef).toBe(false);
    }
  });
});
