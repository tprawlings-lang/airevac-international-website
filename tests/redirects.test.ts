import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { seeOther } from '@/server/http/redirect';

/**
 * Console redirects must not carry an origin.
 *
 * A real deploy sat behind a proxy that terminates TLS and forwards to the app
 * on an internal port. Every redirect was built from the request's own origin,
 * so a successful sign-in sent the coordinator to
 * `https://localhost:10000/coordinator/password`. The logs showed a 303 and a
 * valid session; the browser went nowhere. It presented as "I type my password
 * and nothing happens", which is the worst kind of bug: correct by every
 * server-side measure and completely broken for the person using it.
 *
 * The structural test at the bottom is the one that matters long term. A unit
 * test proves the helper is right; only the sweep proves nobody has quietly
 * gone back to the thing that broke.
 */

function location(response: Response): string | null {
  return response.headers.get('location');
}

describe('seeOther', () => {
  it('emits a relative Location, with no origin to get wrong', () => {
    const response = seeOther('/coordinator/console');

    expect(response.status).toBe(303);
    expect(location(response)).toBe('/coordinator/console');
  });

  it('uses 303 so a refresh cannot resubmit a password', () => {
    expect(seeOther('/coordinator').status).toBe(303);
  });

  it('appends parameters', () => {
    expect(location(seeOther('/coordinator', { error: 'invalid' }))).toBe(
      '/coordinator?error=invalid',
    );
  });

  it('drops undefined parameters rather than writing "undefined"', () => {
    // So a caller can pass an optional value straight through.
    expect(location(seeOther('/coordinator/password', { error: 'policy', problems: undefined }))).toBe(
      '/coordinator/password?error=policy',
    );
  });

  it('encodes parameter values', () => {
    const target = location(seeOther('/coordinator/password', { problems: 'too short|too common' }));
    expect(target).toContain('too+short%7Ctoo+common');
  });

  it('refuses an absolute URL', () => {
    // Nothing here has any reason to leave the site, so the helper will not.
    expect(() => seeOther('https://example.com/phish')).toThrow(/site-relative/);
  });

  it('refuses a protocol-relative URL, which would also leave the site', () => {
    expect(() => seeOther('//example.com/phish')).toThrow(/site-relative/);
  });
});

describe('no route rebuilds an origin', () => {
  it('never uses request.nextUrl.origin to build a redirect', () => {
    /*
     * The regression guard. `nextUrl.origin` is the address this process was
     * reached on, which behind a proxy is an internal one. Reading a forwarded
     * host instead would be no better: it is client-controlled, and would turn
     * a fixed internal redirect into an open redirect.
     */
    const offenders: string[] = [];

    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.tsx?$/.test(entry)) continue;
        // The helper's own documentation explains what it replaced.
        if (path.endsWith(join('server', 'http', 'redirect.ts'))) continue;

        const source = readFileSync(path, 'utf8');
        if (source.includes('nextUrl.origin') || source.includes('x-forwarded-host')) {
          offenders.push(path);
        }
      }
    };

    walk('src');

    expect(offenders, `redirects must be site-relative; see: ${offenders.join(', ')}`).toEqual([]);
  });
});
