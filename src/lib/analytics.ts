import { FEATURES } from '@/content/site';

/**
 * Measurement layer. AI Search Coding Handoff section 9, "Analytics and AI
 * referral tracking": track qualified actions, not traffic alone.
 *
 * BUILT AND DISABLED. `FEATURES.analytics` is false, so nothing loads, nothing
 * fires, and no cookie is set. That is not caution for its own sake: the
 * published privacy notice currently states this site does not set analytics
 * cookies, and the Notice of Privacy Practices describes a site that collects
 * no measurement on any page carrying sensitive information. Turning this on
 * before those pages are revised would make the site's own privacy notice
 * false, which section 12 of the blueprint treats as a misleading privacy
 * claim. Enabling is therefore decision A2 in the approvals document, and it
 * comes with a notice rewrite, not just a flag flip.
 *
 * WHAT MAY BE RECORDED. Only the fields the handoff lists as safe. Every event
 * below carries the page path, the action, and a coarse category. None carries
 * a name, a phone number, an email address, an origin or destination city, a
 * free-text note, or anything derived from them. The type system is the
 * enforcement: `AnalyticsEvent` has no field that could hold one, and
 * `tests/privacy-controls.test.ts` asserts the payload shape.
 */

/** The qualified actions worth measuring, per handoff section 9. */
export type AnalyticsEventName =
  | 'page_view'
  | 'click_phone'
  | 'click_email'
  | 'start_transport_request'
  | 'submit_transport_request'
  | 'download_checklist'
  | 'view_credentials'
  | 'route_inquiry';

/**
 * Paths where nothing is measured, at all.
 *
 * The privacy notice states: "No measurement of any kind runs on the transport
 * request form or on any page carrying sensitive information." That sentence is
 * a commitment, and this constant is what keeps it true. GA4 is additionally
 * configured with `send_page_view: false`, so the tag reports nothing on its
 * own either; both halves are needed, because either one alone would leave the
 * notice depending on the other staying correct.
 */
const UNMEASURED_PATHS = ['/request-transport'];

/** False on any page the privacy notice promises is unmeasured. */
export function isMeasurablePath(path: string): boolean {
  return !UNMEASURED_PATHS.some(
    (excluded) => path === excluded || path.endsWith(excluded) || path.includes(`${excluded}/`),
  );
}

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  /** Locale-prefixed path of the page the action happened on. */
  path: string;
  /**
   * Coarse page category (`services`, `coverage`, `partners`). Never a route
   * slug: the handoff notes that recording which route someone asked about
   * "could expose a patient's situation" when combined with timing.
   */
  category?: string;
}

/**
 * Page category from a path. Deliberately lossy.
 *
 * `/en/coverage/mexico/cancun` becomes `coverage`, not `coverage/mexico/cancun`.
 * A single family arranging a transport from one island is identifiable to
 * anyone who also knows roughly when it happened, and an analytics property is
 * not a place to hold that.
 */
export function categoryOf(path: string): string {
  const segments = path.split('/').filter(Boolean);
  // Drop the locale prefix.
  const rest = segments[0] === 'en' || segments[0] === 'es' ? segments.slice(1) : segments;
  return rest[0] ?? 'home';
}

/**
 * Fields that must never appear in a payload, whatever a future contributor
 * believes they are adding. Checked at runtime because a type is only a
 * compile-time promise and this is the one place where breaking it is a
 * privacy incident rather than a bug.
 */
const FORBIDDEN_KEYS = new Set([
  'name',
  'contactname',
  'phone',
  'email',
  'note',
  'origincity',
  'destinationcity',
  'patient',
  'diagnosis',
  'insurance',
  'mrn',
]);

/**
 * Records a qualified action.
 *
 * No-op while `FEATURES.analytics` is false. Callers do not check the flag;
 * that is this function's job, so a new call site cannot leak by omission.
 */
export function track(event: AnalyticsEvent): void {
  if (!FEATURES.analytics) return;
  if (typeof window === 'undefined') return;
  if (!isMeasurablePath(event.path)) return;

  const payload: Record<string, unknown> = {
    event: event.name,
    page_path: event.path,
    ...(event.category !== undefined ? { page_category: event.category } : {}),
  };

  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase().replace(/[^a-z]/g, ''))) return;
  }

  const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(layer)) layer.push(payload);
}

/**
 * Referral source classification, per handoff section 9: identify traffic
 * arriving from answer engines so their contribution is visible separately
 * from ordinary search.
 *
 * The handoff's own caveat applies and is worth restating: "Referral data is
 * not guaranteed." Several assistants send no referrer at all, so a zero here
 * means "not measurable", never "no AI traffic". Branded-search growth and
 * direct traffic to deep pages are the corroborating signals.
 */
export function referralSource(referrer: string): string {
  if (referrer === '') return 'direct_or_unmeasured';

  let host: string;
  try {
    host = new URL(referrer).host.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'unknown';
  }

  const answerEngines: Record<string, string> = {
    'chatgpt.com': 'chatgpt',
    'chat.openai.com': 'chatgpt',
    'claude.ai': 'claude',
    'perplexity.ai': 'perplexity',
    'copilot.microsoft.com': 'copilot',
    'gemini.google.com': 'gemini',
  };

  const engine = answerEngines[host];
  if (engine !== undefined) return engine;
  if (host === 'google.com' || host.endsWith('.google.com')) return 'google';
  if (host === 'bing.com') return 'bing';
  if (host === 'duckduckgo.com') return 'duckduckgo';

  return 'other_referral';
}
