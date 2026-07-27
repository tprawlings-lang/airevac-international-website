import type { NextConfig } from 'next';
import { legacyRedirects } from './src/content/redirects';

/**
 * Blueprint section 10 (Application security controls) and section 14 (Resilience).
 *
 * Headers here are the static baseline. The per-request Content-Security-Policy
 * is set in `middleware.ts` because it carries a per-response nonce; a static
 * CSP cannot express that and would force `unsafe-inline`, which the blueprint
 * forbids ("no unsafe inline scripts").
 */

const SECURITY_HEADERS = [
  // TLS: HSTS is applied after the subdomain review recorded in
  // docs/adr/0004-security-headers.md. Preload is intentionally NOT set until
  // every subdomain is confirmed HTTPS-only.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    // Section 13: no ad tech, no session replay, no unexpected sensor access.
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'attribution-reporting=()',
      'autoplay=()',
      'browsing-topics=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'idle-detection=()',
      'interest-cohort=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'serial=()',
      'usb=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Trailing-slash-free canonical URLs. Section 19: "short, stable URLs".
  trailingSlash: false,

  /**
   * `typedRoutes` is deliberately OFF. Nearly every internal link is built by
   * `localePath(locale, path)`, whose return type is a plain string, so typed
   * routes would only be satisfied by casting at each call site — which removes
   * the checking it exists to provide.
   *
   * The guarantee is replaced by a stronger one in tests/routes.test.ts, which
   * asserts that every path in the navigation and every redirect destination
   * resolves to a real page directory. That also covers the redirect map, which
   * typed routes would not have checked at all.
   */
  typedRoutes: false,

  images: {
    // Only AirEvac-owned, permission-cleared imagery is served. No remote
    // patterns: section 4 requires written permission and accurate captions for
    // every operational image, which a remote loader cannot enforce.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Section 14 (Caching): "no-store for intake, chat, portal,
        // user-specific, or sensitive responses."
        source: '/api/:path*',
        headers: [
          ...SECURITY_HEADERS,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },

  async redirects() {
    // Legacy WordPress URL map. Section 3 (URL rules): "Map every current URL to
    // its new equivalent. Use permanent redirects, preserve inbound links, and
    // avoid redirect chains." Every entry points at a FINAL destination.
    return legacyRedirects;
  },
};

export default nextConfig;
