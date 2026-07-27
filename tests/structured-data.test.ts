import { describe, expect, it } from 'vitest';

import { breadcrumbJsonLd, organizationJsonLd, serializeJsonLd } from '@/lib/structured-data';
import { SITE } from '@/content/site';

/**
 * Structured-data tests. Blueprint section 19 requires structured data
 * "validated against visible content."
 *
 * The failure mode this guards is specific and common: a site removes an expired
 * accreditation from the visible page but leaves it asserted in JSON-LD, where
 * nobody looks. Because the JSON-LD here is generated from the credential
 * register, the gate covers both — and these tests prove it.
 */

const NOW = new Date('2026-07-27T12:00:00Z');
const AFTER_EURAMI_EXPIRY = new Date('2027-08-26T12:00:00Z');

describe('organizationJsonLd', () => {
  it('emits Organization, not LocalBusiness', () => {
    // The hangar is an operating base, not a walk-in place of business.
    // LocalBusiness invites "open now" and directions treatments that would
    // misrepresent how a transport is arranged.
    expect(organizationJsonLd('en', NOW)['@type']).toBe('Organization');
  });

  it('publishes the verified Fort Lauderdale address and phone', () => {
    const data = organizationJsonLd('en', NOW) as Record<string, unknown>;
    const address = data.address as Record<string, string>;

    expect(data.telephone).toBe(SITE.phone.display);
    expect(address.addressLocality).toBe('Fort Lauderdale');
    expect(address.addressRegion).toBe('FL');
    // Not the Scottsdale address from the legacy WordPress policy [S11].
    expect(JSON.stringify(data)).not.toContain('Scottsdale');
  });

  it('never asserts a held credential to search engines', () => {
    const serialized = JSON.stringify(organizationJsonLd('en', NOW));

    for (const held of ['NAAMTA', 'ARGUS', 'D0JA860L']) {
      expect(serialized, `${held} leaked into structured data`).not.toContain(held);
    }
  });

  it('omits hasCredential entirely while every accreditation is gated', () => {
    /*
     * CURRENT STATE, and it is the correct one: EURAMI's public evidence is
     * current through 2027-08-25, but its `approvedOn` is null pending D2 (the
     * certificate itself plus logo-use terms). The gate therefore withholds it,
     * and the markup carries no `hasCredential` at all rather than an empty
     * array — an empty array would assert "this organization holds no
     * credentials", which is a different and false statement.
     *
     * When D2 closes and EURAMI publishes, this test flips to asserting its
     * presence and the expiry test below starts exercising the drop.
     */
    expect(organizationJsonLd('en', NOW)).not.toHaveProperty('hasCredential');
  });

  it('asserts no credential after every expiry date has passed', () => {
    // Whatever is publishable today must not be publishable in 2027-08-26.
    // This is the regression guard for the expiry drop at the markup layer;
    // the day-level arithmetic itself is covered in credential-register.test.ts.
    const after = organizationJsonLd('en', AFTER_EURAMI_EXPIRY);

    expect(after).not.toHaveProperty('hasCredential');
    expect(JSON.stringify(after)).not.toContain('EURAMI');
  });

  it('does not assert a 24/7 Spanish language guarantee (D11)', () => {
    // The visible page withholds this claim; the markup must too.
    const data = organizationJsonLd('en', NOW) as Record<string, unknown>;
    const contactPoints = data.contactPoint as Record<string, unknown>[];

    expect(contactPoints[0]).not.toHaveProperty('availableLanguage');
  });

  it('produces a locale-appropriate url', () => {
    const en = organizationJsonLd('en', NOW) as Record<string, string>;
    const es = organizationJsonLd('es', NOW) as Record<string, string>;

    expect(en.url).toBe(`${SITE.url}/en`);
    expect(es.url).toBe(`${SITE.url}/es`);
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers positions from one and uses absolute locale-prefixed URLs', () => {
    const data = breadcrumbJsonLd('es', [
      { name: 'Inicio', path: '/' },
      { name: 'Cobertura', path: '/coverage' },
    ]) as Record<string, unknown>;

    const items = data.itemListElement as Record<string, unknown>[];

    expect(items).toHaveLength(2);
    expect(items[0]?.position).toBe(1);
    expect(items[0]?.item).toBe(`${SITE.url}/es`);
    expect(items[1]?.position).toBe(2);
    expect(items[1]?.item).toBe(`${SITE.url}/es/coverage`);
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so a value cannot break out of the script element', () => {
    const serialized = serializeJsonLd({
      '@context': 'https://schema.org',
      name: '</script><script>alert(1)</script>',
    });

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c');
  });

  it('still parses back to the original value', () => {
    const original = { '@context': 'https://schema.org' as const, name: 'AirEvac <test>' };
    expect(JSON.parse(serializeJsonLd(original))).toEqual(original);
  });
});
