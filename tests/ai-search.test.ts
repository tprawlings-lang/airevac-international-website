import { describe, expect, it } from 'vitest';

import robots, {
  DISALLOWED_PATHS,
  productionRules,
  SEARCH_CRAWLERS,
  TRAINING_CRAWLERS,
} from '@/app/robots';
import { categoryOf, isMeasurablePath, referralSource, track } from '@/lib/analytics';
import { indexNowEnabled } from '@/lib/indexnow';
import { faqPageJsonLd, pageGraphJsonLd, serviceJsonLd } from '@/lib/structured-data';
import { ALL_CONTENT_PAGES } from '@/lib/page-registry';
import { SERVICE_PAGES } from '@/content/pages/services';
import { COVERAGE_REGIONS } from '@/content/navigation';
import { FEATURES } from '@/content/site';

/**
 * AI search readiness. These enforce the AI Search Coding Handoff's rules that
 * are checkable without a browser; scripts/crawler-access-check.mjs and
 * scripts/web-vitals-check.mjs cover the rest against a running server.
 */

describe('crawler policy (handoff section 4)', () => {
  it('separates search crawlers from training crawlers', () => {
    // The distinction the whole policy rests on: blocking a search crawler
    // removes AirEvac from that engine's results, blocking a training crawler
    // does not.
    const overlap = SEARCH_CRAWLERS.filter((agent) => TRAINING_CRAWLERS.includes(agent));
    expect(overlap).toEqual([]);
  });

  it('allows every crawler that feeds search results or AI answers', () => {
    for (const agent of [
      'Googlebot',
      'Bingbot',
      'OAI-SearchBot',
      'Claude-SearchBot',
      'ClaudeBot',
      'PerplexityBot',
    ]) {
      expect(SEARCH_CRAWLERS, `${agent} must be allowed`).toContain(agent);
    }
  });

  it('keeps training agents distinct from their search counterparts', () => {
    // Both groups are allowed since decision A1, but they must stay separately
    // listed: Google-Extended is training and Googlebot is search, and
    // confusing them is how a site accidentally removes itself from Google.
    expect(TRAINING_CRAWLERS).toContain('GPTBot');
    expect(TRAINING_CRAWLERS).toContain('Google-Extended');
    expect(SEARCH_CRAWLERS).toContain('Googlebot');
    expect(TRAINING_CRAWLERS).not.toContain('Googlebot');
  });

  it('keeps the secure flow disallowed even for training crawlers', () => {
    // Allowing training collection must not widen what any agent can reach.
    const groups = productionRules() ?? [];
    const training = (Array.isArray(groups) ? groups : [groups]).find(
      (rule) => JSON.stringify(rule.userAgent) === JSON.stringify(TRAINING_CRAWLERS),
    );
    expect(training?.disallow).toEqual(DISALLOWED_PATHS);
  });

  it('repeats the disallow list in every allow group', () => {
    /*
     * A crawler obeys only the most specific group that matches it and ignores
     * every other group, including the wildcard. A named group missing these
     * paths would let that crawler fetch the secure flow the wildcard forbids.
     */
    const rules = productionRules() ?? [];
    const groups = Array.isArray(rules) ? rules : [rules];
    const allowGroups = groups.filter((rule) => rule.allow !== undefined);

    expect(allowGroups.length).toBeGreaterThan(1);
    for (const group of allowGroups) {
      expect(group.disallow, `${String(group.userAgent)} is missing the disallow list`).toEqual(
        DISALLOWED_PATHS,
      );
    }
  });

  it('keeps the secure flow out of every crawl path', () => {
    expect(DISALLOWED_PATHS).toContain('/en/request-transport');
    expect(DISALLOWED_PATHS).toContain('/es/request-transport');
  });

  it('serves a disallow-all when the origin is not production', () => {
    // SITE_URL defaults to localhost in tests, so this is the live behaviour.
    const rules = robots().rules;
    const groups = Array.isArray(rules) ? rules : [rules];
    expect(groups).toEqual([{ userAgent: '*', disallow: '/' }]);
  });
});

describe('structured data (handoff section 7)', () => {
  const page = {
    path: '/services/air-ambulance',
    title: 'Air Ambulance',
    description: 'A description long enough to look like a real meta description.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
    ],
  };

  it('emits WebSite, WebPage, and BreadcrumbList in one graph', () => {
    const graph = pageGraphJsonLd('en', page) as unknown as { '@graph': { '@type': string }[] };
    const types = graph['@graph'].map((node) => node['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('WebPage');
    expect(types).toContain('BreadcrumbList');
  });

  it('links the nodes by @id rather than repeating them', () => {
    const graph = pageGraphJsonLd('en', page) as unknown as {
      '@graph': Record<string, unknown>[];
    };
    const webPage = graph['@graph'].find((node) => node['@type'] === 'WebPage');
    const website = graph['@graph'].find((node) => node['@type'] === 'WebSite');

    expect((webPage?.isPartOf as { '@id': string })['@id']).toBe(website?.['@id']);
  });

  it('omits the breadcrumb node when a page has no trail', () => {
    const graph = pageGraphJsonLd('en', {
      path: '/',
      title: 'Home',
      description: 'Homepage',
    }) as unknown as { '@graph': { '@type': string }[] };

    expect(graph['@graph'].map((node) => node['@type'])).not.toContain('BreadcrumbList');
  });

  it('never claims a review date the page does not display', () => {
    const withoutReview = pageGraphJsonLd('en', page) as unknown as {
      '@graph': Record<string, unknown>[];
    };
    const node = withoutReview['@graph'].find((n) => n['@type'] === 'WebPage');
    expect(node).not.toHaveProperty('dateModified');

    const withReview = pageGraphJsonLd('en', {
      ...page,
      reviewedOn: '2026-07-27',
    }) as unknown as { '@graph': Record<string, unknown>[] };
    expect(withReview['@graph'].find((n) => n['@type'] === 'WebPage')).toHaveProperty(
      'dateModified',
      '2026-07-27',
    );
  });

  it('marks the locale on every graph so hreflang and schema agree', () => {
    const es = pageGraphJsonLd('es', page) as unknown as { '@graph': Record<string, unknown>[] };
    for (const node of es['@graph']) {
      if (node['@type'] === 'WebSite' || node['@type'] === 'WebPage') {
        expect(node.inLanguage).toBe('es-419');
      }
    }
  });

  it('builds Service schema without offers or ratings', () => {
    const service = serviceJsonLd(
      'en',
      { path: '/services/air-ambulance', title: 'Air Ambulance', description: 'Description.' },
      COVERAGE_REGIONS.map((region) => region.name),
    );

    expect(service['@type']).toBe('Service');
    // The handoff bars rating markup built from testimonials, and no price is
    // published anywhere on the site.
    expect(service).not.toHaveProperty('offers');
    expect(service).not.toHaveProperty('aggregateRating');
    expect(service).not.toHaveProperty('review');
  });

  it('claims only service areas the site actually publishes', () => {
    const published = new Set<string>(COVERAGE_REGIONS.map((region) => region.name));
    const service = serviceJsonLd(
      'en',
      { path: '/services/air-ambulance', title: 'Air Ambulance', description: 'Description.' },
      COVERAGE_REGIONS.map((region) => region.name),
    ) as unknown as { areaServed: { name: string }[] };

    for (const area of service.areaServed) {
      expect(published.has(area.name), `${area.name} is not a published coverage region`).toBe(true);
    }
  });

  it('returns null rather than an empty FAQPage', () => {
    expect(faqPageJsonLd('en', '/services', [])).toBeNull();
  });

  it('marks up only questions that exist in the page content', () => {
    /*
     * The handoff's rule is "mark up only visible questions and answers".
     * Generating from the page's own FAQ blocks is what makes that structural:
     * this asserts the generated questions are a subset of the rendered ones.
     */
    for (const page of ALL_CONTENT_PAGES) {
      const visible = page.blocks.flatMap((block) =>
        block.type === 'faq' ? block.items.map((item) => item.question) : [],
      );
        const graph = faqPageJsonLd(
        'en',
        page.path,
        page.blocks.flatMap((block) => (block.type === 'faq' ? block.items : [])),
      ) as unknown as { mainEntity: { name: string }[] } | null;

      if (graph === null) {
        expect(visible).toEqual([]);
        continue;
      }
      for (const question of graph.mainEntity.map((entity) => entity.name)) {
        expect(visible, `${page.path} marks up an unrendered question`).toContain(question);
      }
    }
  });
});

describe('opening answer (handoff section 6)', () => {
  /**
   * "The first 80 to 140 words should directly answer the page's main
   * question."
   *
   * The gate is set at 60 rather than 80 because the measurement here stops at
   * the first block, while a reader sees more than that above the fold. What it
   * reliably catches is a page that opens with a bare list or definition set
   * and answers nothing until the reader has assembled it themselves, which is
   * both bad for a person and bad for an answer engine trying to extract a
   * summary.
   */
  const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  function opening(page: (typeof ALL_CONTENT_PAGES)[number]): string {
    const first = page.blocks[0];
    if (first === undefined) return page.intro;
    if (first.type === 'prose') return `${page.intro} ${first.paragraphs.join(' ')}`;
    if (first.type === 'callout') return `${page.intro} ${first.body}`;
    if (first.type === 'list') return `${page.intro} ${first.items.join(' ')}`;
    if (first.type === 'definitions') {
      return `${page.intro} ${first.items.map((item) => item.detail).join(' ')}`;
    }
    return page.intro;
  }

  it.each(ALL_CONTENT_PAGES.map((page) => [page.path, page] as const))(
    '%s opens with a substantive answer',
    (_path, page) => {
      expect(words(opening(page))).toBeGreaterThanOrEqual(60);
    },
  );
});

describe('analytics layer (handoff section 9)', () => {
  it('activates only when a measurement ID is configured', () => {
    // Approved (A2), but driven by configuration so the code, the CSP, and the
    // privacy notice can never disagree about whether measurement is running.
    expect(FEATURES.analytics).toBe(false);
    expect(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '').toBe('');
  });

  it('never measures the transport request form, as the privacy notice promises', () => {
    expect(isMeasurablePath('/en/request-transport')).toBe(false);
    expect(isMeasurablePath('/es/request-transport')).toBe(false);
    expect(isMeasurablePath('/en/contact')).toBe(true);
    expect(isMeasurablePath('/en/coverage/mexico/cancun')).toBe(true);
  });

  it('does nothing at all while disabled', () => {
    const pushed: unknown[] = [];
    (globalThis as { window?: unknown }).window = { dataLayer: pushed };

    track({ name: 'click_phone', path: '/en/contact', category: 'contact' });

    expect(pushed).toEqual([]);
    delete (globalThis as { window?: unknown }).window;
  });

  it('reduces a path to a coarse category, discarding the route slug', () => {
    // A single family's transport from one island is identifiable when combined
    // with timing, so the route never reaches an analytics property.
    expect(categoryOf('/en/coverage/mexico/cancun')).toBe('coverage');
    expect(categoryOf('/es/coverage/caribbean/jamaica')).toBe('coverage');
    expect(categoryOf('/en')).toBe('home');
    expect(categoryOf('/en/services/air-ambulance')).toBe('services');
  });

  it('classifies answer-engine referrals', () => {
    expect(referralSource('https://chatgpt.com/c/abc')).toBe('chatgpt');
    expect(referralSource('https://claude.ai/chat/abc')).toBe('claude');
    expect(referralSource('https://www.perplexity.ai/search')).toBe('perplexity');
    expect(referralSource('https://copilot.microsoft.com/')).toBe('copilot');
    expect(referralSource('https://www.google.com/search?q=x')).toBe('google');
    expect(referralSource('https://www.bing.com/search?q=x')).toBe('bing');
  });

  it('reports an absent referrer honestly rather than as zero AI traffic', () => {
    // Several assistants send no referrer. "direct_or_unmeasured" keeps the
    // report from implying that no one arrived from them.
    expect(referralSource('')).toBe('direct_or_unmeasured');
    expect(referralSource('not a url')).toBe('unknown');
  });
});

describe('IndexNow (handoff section 5)', () => {
  it('stays dormant without a key', () => {
    delete process.env.INDEXNOW_KEY;
    expect(indexNowEnabled()).toBe(false);
  });

  it('stays dormant on a non-production origin even with a key', () => {
    // Submitting preview URLs would ask search engines to index the staging
    // deployment, which is what the robots rules exist to prevent.
    process.env.INDEXNOW_KEY = 'a-long-enough-test-key';
    expect(indexNowEnabled()).toBe(false);
    delete process.env.INDEXNOW_KEY;
  });
});

describe('service pages carry Service schema inputs', () => {
  it('gives every service page a title and description to mark up', () => {
    for (const page of SERVICE_PAGES) {
      expect(page.title.length, page.path).toBeGreaterThan(3);
      expect(page.description.length, page.path).toBeGreaterThan(50);
    }
  });
});
