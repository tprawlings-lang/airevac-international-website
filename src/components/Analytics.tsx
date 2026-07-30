import Script from 'next/script';

import { FEATURES } from '@/content/site';
import { getNonce } from '@/lib/nonce';

/**
 * GA4 loader. AI Search Coding Handoff section 9, approved as decision A2.
 *
 * Renders nothing unless `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set, so a preview
 * deploy and a production deploy before the ID is supplied both stay exactly as
 * they are today: no third-party request, no cookie, strict CSP.
 *
 * THE CONFIGURATION BELOW IS NOT THE GA4 DEFAULT, and each departure is
 * deliberate:
 *
 *   anonymize_ip           Truncates the address before storage. Section 15
 *                          caps raw IP retention, and there is no reason this
 *                          site needs a full address to count a page view.
 *   allow_google_signals   OFF. This is what turns GA4 data into advertising
 *                          audiences. Section 13 forbids building
 *                          medical-interest audiences, and a visitor to an air
 *                          ambulance site is, by definition, a medical-interest
 *                          signal about someone in their family.
 *   allow_ad_personalization_signals  OFF, for the same reason.
 *   send_page_view         OFF here and sent explicitly by the app, so the
 *                          secure intake flow can be excluded rather than
 *                          measured by default.
 *
 * The nonce is passed to both tags because `strict-dynamic` is what lets the
 * loader fetch gtag.js without any host appearing in `script-src`.
 */
export async function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '';
  if (!FEATURES.analytics || measurementId === '') return null;

  const nonce = await getNonce();

  return (
    <>
      <Script
        id="ga4-loader"
        nonce={nonce}
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      />
      <Script id="ga4-config" nonce={nonce} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(measurementId)}, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
