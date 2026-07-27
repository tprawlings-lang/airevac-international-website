import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { canRenderLocale, type Block, type PageContent } from '@/content/blocks';
import { getDictionary } from '@/content/dictionary';
import { buildLegalNavigation, buildNavigation, PRIORITY_ROUTES } from '@/content/navigation';
import { legacyRedirects } from '@/content/redirects';
import { REGION_CONTENT } from '@/content/pages/coverage';
import { ALL_CONTENT_PAGES } from '@/lib/page-registry';
import { LOCALES } from '@/lib/i18n';

/**
 * Content governance tests.
 *
 * These enforce the rules that are about *what the site says* rather than what
 * the code does — the ones a reviewer would otherwise have to catch by reading
 * every page on every change.
 */

const APP_DIR = join(process.cwd(), 'src', 'app', '[locale]');

/** Flattens every string in a block, for prohibited-phrase scanning. */
function textOf(block: Block): string {
  switch (block.type) {
    case 'prose':
      return [block.heading ?? '', ...block.paragraphs].join(' ');
    case 'list':
      return [block.heading, ...block.items].join(' ');
    case 'callout':
      return `${block.heading} ${block.body}`;
    case 'faq':
      return [block.heading, ...block.items.flatMap((i) => [i.question, i.answer])].join(' ');
    case 'definitions':
      return [block.heading, ...block.items.flatMap((i) => [i.term, i.detail])].join(' ');
  }
}

function fullText(page: PageContent): string {
  return [page.title, page.intro, page.description, ...page.blocks.map(textOf)].join(' ');
}

describe('prohibited claims never appear in published copy', () => {
  /**
   * Claims held by the register (D1, D3, D4, D5) must not leak into prose,
   * where the gate cannot see them. Regexes are word-bounded so legitimate
   * discussion — e.g. the Part 135 record's own note — is not matched.
   */
  const PROHIBITED: { pattern: RegExp; why: string }[] = [
    { pattern: /\bNAAMTA\b/i, why: 'NAAMTA accreditation is on hold (D1)' },
    { pattern: /\bARGUS\b/i, why: 'ARGUS rating has no current evidence (D3)' },
    { pattern: /\bN277MK\b/i, why: 'Learjet 35 fleet status is unresolved (D5)' },
    { pattern: /\bLearjet 35\b/i, why: 'Learjet 35 fleet status is unresolved (D5)' },
    {
      pattern: /\bowns? and operates?\b/i,
      why: 'ownership language requires leases and OpSpecs (D4)',
    },
    {
      pattern: /\bwe (own|operate) (the|our) (aircraft|fleet)\b/i,
      why: 'ownership language requires leases and OpSpecs (D4)',
    },
  ];

  it.each(ALL_CONTENT_PAGES.map((page) => [page.path, page] as const))(
    '%s contains no held claim',
    (_path, page) => {
      const text = fullText(page);
      for (const { pattern, why } of PROHIBITED) {
        expect(pattern.test(text), `${page.path}: ${why}`).toBe(false);
      }
    },
  );

  it('coverage content contains no held claim', () => {
    for (const region of REGION_CONTENT) {
      const text = [region.title, region.intro, region.description, ...region.blocks.map(textOf)].join(
        ' ',
      );
      for (const { pattern, why } of PROHIBITED) {
        expect(pattern.test(text), `${region.slug}: ${why}`).toBe(false);
      }
    }
  });
});

describe('no page promises coverage, price, or a response time', () => {
  /**
   * Section 12 (FTC Act): "No misleading privacy, insurance, price, medical,
   * safety, availability, review, or accreditation claims."
   *
   * WHY THIS IS SENTENCE-SCOPED RATHER THAN A DOCUMENT-WIDE REGEX.
   *
   * Several pages must *discuss* guarantees in order to disclaim them — the
   * insurance page's "any provider who guarantees coverage before reviewing your
   * policy is guessing" is the site doing exactly the right thing. A naive
   * document-wide match flags that sentence and would push an author to delete
   * the most useful warning on the page.
   *
   * So a sentence fails only when it (a) attributes the claim to us and (b) is
   * not a negation. That is the shape of an actual prohibited promise.
   */
  const PROMISE_PATTERNS: { pattern: RegExp; why: string }[] = [
    { pattern: /\bguarantee[sd]?\b/i, why: 'guarantee' },
    { pattern: /\bwill be covered\b/i, why: 'coverage promise' },
    { pattern: /\bno out[- ]of[- ]pocket\b/i, why: 'no-out-of-pocket promise' },
    { pattern: /\bairborne within\b/i, why: 'response-time promise (D14)' },
    { pattern: /\bwheels up in\b/i, why: 'response-time promise (D14)' },
    { pattern: /\bwithin \d+ (minutes|hours) of your call\b/i, why: 'response-time promise (D14)' },
    { pattern: /\brespond(s|ing)? (in|within) (under )?\d+/i, why: 'response-time promise (D14)' },
  ];

  /** First-person attribution — the claim is presented as ours. */
  const ATTRIBUTION = /\b(we|us|our|AirEvac)\b/i;

  /** Markers that turn the sentence into a disclaimer rather than a claim. */
  const NEGATION =
    /\b(not|never|cannot|can't|won't|no one|nobody|anyone who|any provider who|without|rather than|instead of|do not|does not)\b/i;

  function offendingSentences(page: PageContent): string[] {
    return fullText(page)
      .split(/(?<=[.!?])\s+/)
      .filter(
        (sentence) =>
          ATTRIBUTION.test(sentence) &&
          !NEGATION.test(sentence) &&
          PROMISE_PATTERNS.some(({ pattern }) => pattern.test(sentence)),
      );
  }

  it.each(ALL_CONTENT_PAGES.map((page) => [page.path, page] as const))(
    '%s makes no prohibited promise',
    (_path, page) => {
      expect(offendingSentences(page)).toEqual([]);
    },
  );

  it('still catches an affirmative promise if one is introduced', () => {
    // Guards the guard: proves the negation handling has not disabled the check.
    const offending: PageContent = {
      path: '/test',
      title: 'Test',
      description: 'Test description that is long enough to satisfy the metadata rule for tests.',
      intro: 'Test',
      contentClass: 'general',
      reviewer: null,
      reviewedOn: null,
      esReviewedOn: null,
      blocks: [
        {
          type: 'prose',
          paragraphs: ['We guarantee your insurance will be covered with no out-of-pocket cost.'],
        },
      ],
    };

    expect(offendingSentences(offending).length).toBeGreaterThan(0);
  });
});

describe('the Spanish publication gate (page 24)', () => {
  it('never renders unreviewed Spanish for medical, legal, or insurance content', () => {
    for (const page of ALL_CONTENT_PAGES) {
      if (page.contentClass === 'general') continue;
      if (page.esReviewedOn !== null) continue;

      expect(canRenderLocale(page, 'es'), `${page.path} would render unreviewed Spanish`).toBe(
        false,
      );
    }
  });

  it('never carries Spanish blocks without a recorded review date', () => {
    for (const page of ALL_CONTENT_PAGES) {
      if (page.esBlocks !== undefined) {
        expect(page.esReviewedOn, `${page.path} has Spanish blocks but no review date`).not.toBeNull();
      }
    }
  });

  it('always renders English', () => {
    for (const page of ALL_CONTENT_PAGES) {
      expect(canRenderLocale(page, 'en')).toBe(true);
    }
  });
});

describe('review attribution (section 19)', () => {
  it('records a review date whenever a reviewer is named', () => {
    for (const page of ALL_CONTENT_PAGES) {
      if (page.reviewer !== null) {
        expect(page.reviewedOn, `${page.path} names a reviewer with no review date`).not.toBeNull();
      }
    }
  });
});

describe('page metadata (section 19)', () => {
  it('gives every page a unique canonical path', () => {
    const paths = ALL_CONTENT_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('gives every page a unique title and description', () => {
    const titles = ALL_CONTENT_PAGES.map((page) => page.title);
    const descriptions = ALL_CONTENT_PAGES.map((page) => page.description);

    expect(new Set(titles).size, 'duplicate titles').toBe(titles.length);
    expect(new Set(descriptions).size, 'duplicate descriptions').toBe(descriptions.length);
  });

  it('keeps descriptions within a sensible meta length', () => {
    for (const page of ALL_CONTENT_PAGES) {
      expect(page.description.length, `${page.path} description too short`).toBeGreaterThan(50);
      expect(page.description.length, `${page.path} description too long`).toBeLessThanOrEqual(320);
    }
  });
});

describe('route integrity', () => {
  /**
   * Replaces Next's `typedRoutes` (disabled in next.config.ts) with a check
   * that also covers the redirect map, which typed routes would not have
   * validated at all.
   */
  /**
   * Resolves a path against the app directory the way Next does: at each
   * segment, prefer a literal directory, and fall back to a dynamic `[param]`
   * directory. Both branches must be explored, because `/coverage/mexico` is
   * literal at segment 1 and dynamic at segment 2.
   */
  function routeExists(path: string): boolean {
    const segments = path.split('/').filter(Boolean);

    function walk(dir: string, remaining: string[]): boolean {
      if (!existsSync(dir)) return false;
      if (remaining.length === 0) return existsSync(join(dir, 'page.tsx'));

      const [head, ...tail] = remaining;
      if (head === undefined) return false;

      // Literal segment first.
      if (walk(join(dir, head), tail)) return true;

      // Then any dynamic segment at this level.
      return ['[slug]', '[region]', '[route]'].some((param) => walk(join(dir, param), tail));
    }

    return walk(APP_DIR, segments);
  }

  it('resolves the routes it is asked to check (guards the resolver itself)', () => {
    expect(routeExists('/')).toBe(true);
    expect(routeExists('/credentials')).toBe(true);
    expect(routeExists('/services/air-ambulance')).toBe(true);
    expect(routeExists('/coverage/mexico/cancun')).toBe(true);
    expect(routeExists('/this/does/not/exist')).toBe(false);
  });

  it('resolves every navigation link to a real page', () => {
    const dictionary = getDictionary('en');
    const links = buildNavigation(dictionary).flatMap((group) => [
      ...(group.href !== undefined ? [group.href] : []),
      ...group.links.map((link) => link.href),
    ]);

    for (const href of links) {
      expect(routeExists(href), `navigation link ${href} has no page`).toBe(true);
    }
  });

  it('resolves every legal footer link to a real page', () => {
    for (const link of buildLegalNavigation()) {
      expect(routeExists(link.href), `legal link ${link.href} has no page`).toBe(true);
    }
  });

  it('resolves every registered content page to a real route', () => {
    for (const page of ALL_CONTENT_PAGES) {
      expect(routeExists(page.path), `content page ${page.path} has no route`).toBe(true);
    }
  });

  it('resolves every priority route to a real page', () => {
    for (const route of PRIORITY_ROUTES) {
      expect(
        routeExists(`/coverage/${route.region}/${route.slug}`),
        `route ${route.slug} has no page`,
      ).toBe(true);
    }
  });
});

describe('redirect map (section 3)', () => {
  it('contains no redirect chains', () => {
    /*
     * "avoid redirect chains" — a destination must never itself be another
     * rule's source, or the browser takes two hops and link equity is diluted.
     *
     * The comparison is exact. `/fleet` being a source while `/en/fleet` is a
     * destination is NOT a chain: Next matches sources against the literal
     * request path, and no rule has `/en/fleet` as its source.
     */
    const sources = new Set(legacyRedirects.map((rule) => rule.source));

    for (const rule of legacyRedirects) {
      expect(
        sources.has(rule.destination),
        `${rule.source} -> ${rule.destination} forms a chain`,
      ).toBe(false);
    }
  });

  it('sends every redirect to a path that resolves, not to another redirect', () => {
    // Complements the chain check: a destination that 404s is worse than no
    // redirect at all, because the inbound link's value is lost silently.
    for (const rule of legacyRedirects) {
      if (rule.source.includes(':path*')) continue; // catch-alls land on the homepage

      const withoutLocale = rule.destination.replace(/^\/(en|es)/, '') || '/';
      const segments = withoutLocale.split('/').filter(Boolean);

      const resolves =
        segments.length === 0 ||
        existsSync(join(APP_DIR, ...segments, 'page.tsx')) ||
        ['[slug]', '[region]', '[route]'].some((param) =>
          existsSync(join(APP_DIR, ...segments.slice(0, -1), param, 'page.tsx')),
        );

      expect(resolves, `${rule.destination} does not resolve to a page`).toBe(true);
    }
  });

  it('sends every redirect to a locale-prefixed destination', () => {
    // An unprefixed destination would be redirected again by the proxy,
    // producing exactly the chain the rule above forbids.
    for (const rule of legacyRedirects) {
      expect(
        LOCALES.some((locale) => rule.destination.startsWith(`/${locale}`)),
        `${rule.destination} is not locale-prefixed`,
      ).toBe(true);
    }
  });

  it('uses permanent redirects so inbound links keep their value', () => {
    for (const rule of legacyRedirects) {
      expect(rule.permanent, `${rule.source} is not permanent`).toBe(true);
    }
  });

  it('has no duplicate sources', () => {
    const sources = legacyRedirects.map((rule) => rule.source);
    expect(new Set(sources).size).toBe(sources.length);
  });
});

describe('dictionary parity', () => {
  it('defines the same keys in every locale', () => {
    // A missing Spanish key renders `undefined` in the UI — silently, and
    // usually on the page a Spanish speaker needed most.
    function keyPaths(value: unknown, prefix = ''): string[] {
      if (typeof value !== 'object' || value === null) return [prefix];
      return Object.entries(value).flatMap(([key, nested]) =>
        keyPaths(nested, prefix === '' ? key : `${prefix}.${key}`),
      );
    }

    const [first, ...rest] = LOCALES.map((locale) => keyPaths(getDictionary(locale)).sort());

    for (const other of rest) {
      expect(other).toEqual(first);
    }
  });

  it('defines a non-empty string for every key', () => {
    function assertStrings(value: unknown, path: string): void {
      if (typeof value === 'string') {
        expect(value.trim().length, `${path} is empty`).toBeGreaterThan(0);
        return;
      }
      if (typeof value === 'object' && value !== null) {
        for (const [key, nested] of Object.entries(value)) {
          assertStrings(nested, `${path}.${key}`);
        }
      }
    }

    for (const locale of LOCALES) {
      assertStrings(getDictionary(locale), locale);
    }
  });

  it('translates the emergency notice into every locale', () => {
    // Withholding an emergency instruction from a Spanish reader is the one
    // place where waiting for full sign-off is more dangerous than shipping.
    for (const locale of LOCALES) {
      expect(getDictionary(locale).emergency.notice.length).toBeGreaterThan(40);
    }
  });
});
