import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Client components must not read server-only environment variables.
 *
 * Next inlines only `NEXT_PUBLIC_*` names into the browser bundle. Every other
 * `process.env.X` is `undefined` by the time the code runs in a browser, so a
 * client component that branches on one is not reading configuration: it is
 * reading nothing, confidently.
 *
 * THIS IS NOT THEORETICAL. `ChatMount` evaluated the chat feature gate directly.
 * When that gate began requiring `DATABASE_URL`, the component saw `undefined`
 * in the browser, concluded chat was disabled, and removed the launcher from
 * every page of a deployment where chat was working. Nothing threw, nothing was
 * logged, and the server-side endpoints disagreed with the UI. The only symptom
 * was a missing button, which is exactly the kind of failure a test has to catch
 * because a person reasonably assumes they are looking at a styling problem.
 *
 * The rule: decide on the server, pass the answer down as a prop.
 */

/** Modules a client component may import that legitimately read the environment. */
const ALLOWED_ENV = /process\.env\.NEXT_PUBLIC_[A-Z0-9_]+/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, out);
      continue;
    }
    if (/\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
}

describe('client components and the environment', () => {
  it('never reads a server-only environment variable in a client component', () => {
    const offenders: string[] = [];

    for (const path of walk('src')) {
      const source = readFileSync(path, 'utf8');

      // 'use client' has to be the first statement to count.
      if (!/^\s*(['"])use client\1/.test(source)) continue;

      const remaining = source.replace(ALLOWED_ENV, '');
      const matches = remaining.match(/process\.env\.[A-Z0-9_]+/g);
      if (matches !== null) offenders.push(`${path}: ${[...new Set(matches)].join(', ')}`);
    }

    expect(
      offenders,
      'client components must receive server configuration as props, not read it:\n' +
        offenders.join('\n'),
    ).toEqual([]);
  });

  it('never reads a server-backed feature flag from a client component', () => {
    /*
     * Narrower than banning FEATURES outright, because not every flag is
     * unsafe: `analytics` is backed by NEXT_PUBLIC_GA4_MEASUREMENT_ID, which
     * Next does inline, so reading it in the browser is correct.
     *
     * The unsafe set is derived from the source rather than listed here, so a
     * flag added later that reads a server-only variable is covered the day it
     * is written instead of the day someone remembers this file.
     */
    const site = readFileSync(join('src', 'content', 'site.ts'), 'utf8');

    const serverBacked = new Set<string>();
    // Each getter body up to the closing brace at its own indentation.
    for (const match of site.matchAll(/get (\w+)\(\): boolean \{([\s\S]*?)\n {2}\}/g)) {
      const name = match[1] ?? '';
      const body = match[2] ?? '';
      const reads = body.match(/process\.env\.[A-Z0-9_]+/g) ?? [];
      if (reads.some((read) => !read.startsWith('process.env.NEXT_PUBLIC_'))) {
        serverBacked.add(name);
      }
    }

    // If this ever empties, the derivation above has silently stopped working.
    expect(serverBacked.size).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const path of walk('src')) {
      const source = readFileSync(path, 'utf8');
      if (!/^\s*(['"])use client\1/.test(source)) continue;

      for (const flag of serverBacked) {
        if (source.includes(`FEATURES.${flag}`)) offenders.push(`${path}: FEATURES.${flag}`);
      }
    }

    expect(
      offenders,
      'these flags are decided by server-only variables and must arrive as props:\n' +
        offenders.join('\n'),
    ).toEqual([]);
  });
});
