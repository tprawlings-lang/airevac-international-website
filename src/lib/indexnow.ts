import { SITE } from '@/content/site';
import { safeLog } from '@/lib/redact';

/**
 * IndexNow. AI Search Coding Handoff section 5.
 *
 * IndexNow tells participating search engines that specific URLs changed,
 * instead of waiting for them to recrawl. Bing, Yandex, Seznam, and Naver
 * participate, and Bing supplies results to Microsoft Copilot, so this is worth
 * having. GOOGLE DOES NOT PARTICIPATE: Google discovers changes through the
 * sitemap and its own crawl schedule. Anyone reading this expecting IndexNow to
 * speed up Google indexing should not.
 *
 * DORMANT UNTIL TWO CONDITIONS HOLD, both deliberate:
 *
 *   1. INDEXNOW_KEY is set. Without it there is no key file to verify against
 *      and every submission would be rejected.
 *   2. The site is running on the production origin. Submitting
 *      onrender.com URLs would ask search engines to index the preview
 *      deployment, which is the opposite of what the robots rules are for.
 *
 * Both are checked here rather than at the call site so that no caller can
 * forget. `submitIndexNow` is safe to call unconditionally.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Where the key file is served. See src/app/indexnow-key.txt/route.ts. */
export const KEY_FILE_PATH = '/indexnow-key.txt';

export interface IndexNowResult {
  submitted: number;
  /** False when the integration is dormant; see the conditions above. */
  enabled: boolean;
  status?: number;
}

export function indexNowEnabled(): boolean {
  const key = process.env.INDEXNOW_KEY;
  return (
    typeof key === 'string' &&
    key.length >= 8 &&
    SITE.url === 'https://airevacinternational.com'
  );
}

/**
 * Submits changed URLs.
 *
 * `urls` must be absolute and on this host: IndexNow rejects a batch
 * containing a URL from another host, so one stray entry would discard the
 * whole submission. Filtered here rather than trusted.
 */
export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!indexNowEnabled() || urls.length === 0) {
    return { submitted: 0, enabled: false };
  }

  const key = process.env.INDEXNOW_KEY as string;
  const host = new URL(SITE.url).host;
  const urlList = [...new Set(urls)].filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });

  if (urlList.length === 0) return { submitted: 0, enabled: true };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${SITE.url}${KEY_FILE_PATH}`,
      urlList,
    }),
  });

  // 200 and 202 both mean accepted. Anything else is logged rather than
  // thrown: a failed index ping must never break a deploy or a request.
  if (!response.ok && response.status !== 202) {
    safeLog('warn', 'indexnow.rejected', {
      status: response.status,
      count: urlList.length,
    });
  } else {
    safeLog('info', 'indexnow.submitted', { count: urlList.length });
  }

  return { submitted: urlList.length, enabled: true, status: response.status };
}
