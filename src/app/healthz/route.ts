import { NextResponse } from 'next/server';

/**
 * Health check endpoint for the host's uptime probe.
 *
 * Deliberately minimal: it reports that the process is serving, and nothing
 * else. It does not disclose the build, the environment, the commit, or any
 * dependency status — a health endpoint is unauthenticated by necessity, so it
 * must not become a free reconnaissance surface.
 *
 * Exempt from the preview lock in src/proxy.ts, otherwise the probe would see a
 * 401 and the host would restart the service in a loop.
 */
export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json(
    { status: 'ok' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
