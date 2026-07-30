import { indexNowEnabled } from '@/lib/indexnow';

/**
 * IndexNow key file.
 *
 * The protocol verifies ownership by fetching a file on the host that contains
 * the same key as the submission. Served from a route rather than committed to
 * `public/` because the key is a secret held in an environment variable: a key
 * file in the repository is a key in every fork and every build log.
 *
 * The submission sends `keyLocation` pointing here, which the spec allows for a
 * key file outside the host root.
 *
 * Returns 404 when the integration is dormant, which is the honest answer: a
 * key file with no key behind it would tell a search engine that verification
 * is available when it is not.
 */

export const dynamic = 'force-dynamic';

export function GET(): Response {
  if (!indexNowEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(process.env.INDEXNOW_KEY as string, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
