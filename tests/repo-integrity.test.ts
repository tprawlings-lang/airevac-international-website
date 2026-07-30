import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repository integrity.
 *
 * WHY THIS EXISTS. The `.gitignore` shipped with the project carried a bare
 * `coverage` entry, meant for istanbul output. Git matches that pattern at any
 * depth, so it also matched `src/app/[locale]/coverage/` - the entire coverage
 * route tree. Those four pages existed on disk, compiled, rendered, and passed
 * every route test, because every one of those checks reads the working
 * directory. They had never been committed, so the deployed site returned a
 * hard 404 for every continent, country, and city link.
 *
 * Filesystem-based tests cannot catch that class of bug by construction. This
 * one asks git instead: everything the build depends on must actually be in
 * the repository.
 */

const ROOT = process.cwd();

/** Every tracked path, as a set of repo-relative POSIX paths. */
function trackedFiles(): Set<string> {
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return new Set(output.split('\0').filter(Boolean));
}

/** Every source file on disk under `dir`, repo-relative and POSIX-separated. */
function filesOnDisk(dir: string, matcher: RegExp): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (matcher.test(entry.name)) {
        found.push(relative(ROOT, path).split(sep).join('/'));
      }
    }
  };
  walk(join(ROOT, dir));
  return found;
}

describe('every source file the build needs is committed', () => {
  const tracked = trackedFiles();

  it('reads the git index (guards the check itself)', () => {
    expect(tracked.size).toBeGreaterThan(50);
  });

  it('tracks every route file under src/app', () => {
    // A route that exists only in the working directory renders locally and
    // 404s in production. This is the exact failure the coverage tree hit.
    const routes = filesOnDisk('src/app', /^(page|layout|route|not-found|error)\.tsx?$/);
    expect(routes.length).toBeGreaterThan(15);
    for (const file of routes) {
      expect(tracked.has(file), `${file} exists on disk but is not committed`).toBe(true);
    }
  });

  it('tracks every module under src, public, tests, and scripts', () => {
    const sources = [
      // .sql is in scope for the same reason the coverage tree was: a
      // migration that exists locally and is not committed produces a database
      // that works on one machine and is missing a table everywhere else.
      ...filesOnDisk('src', /\.(ts|tsx|mts|mjs|css|sql)$/),
      ...filesOnDisk('tests', /\.(ts|tsx)$/),
      ...filesOnDisk('scripts', /\.(mjs|mts|ts)$/),
      ...filesOnDisk('public', /\.(svg|png|jpg|jpeg|webp|ico|txt|json)$/),
    ];
    const untracked = sources.filter((file) => !tracked.has(file));
    expect(untracked, `untracked source files: ${untracked.join(', ')}`).toEqual([]);
  });
});
