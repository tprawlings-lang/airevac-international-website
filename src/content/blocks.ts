import type { Locale } from '@/lib/i18n';

/**
 * Block-based content model. Blueprint section 5:
 *   "A block-based system lets the team publish consistent English and Spanish
 *    pages while keeping claims, dates, and legal text controlled."
 *
 * These types are the contract a headless CMS must satisfy. Content lives as
 * typed data rather than JSX so that:
 *   - a reviewer can read a page's full text without reading React,
 *   - the review metadata (owner, reviewer, review date) is structurally
 *     required rather than remembered,
 *   - the Spanish gate is enforced by the type system rather than by discipline.
 */

export type Block =
  | { type: 'prose'; heading?: string; paragraphs: string[] }
  | { type: 'list'; heading: string; items: string[]; ordered?: boolean }
  | {
      type: 'callout';
      /** `warning` is reserved for privacy and cost boundaries, not emphasis. */
      tone: 'info' | 'warning';
      heading: string;
      body: string;
    }
  | { type: 'faq'; heading: string; items: { question: string; answer: string }[] }
  | { type: 'definitions'; heading: string; items: { term: string; detail: string }[] };

/**
 * Content classification, driving the Spanish publication gate.
 *
 * Page 24 forbids "Unreviewed automatic Spanish translation for medical, legal,
 * insurance, or emergency content." Anything not classified `general` renders
 * `TranslationPendingNotice` in Spanish until `esReviewedOn` is set.
 */
export type ContentClass = 'general' | 'medical' | 'legal' | 'insurance';

export interface PageContent {
  /** Canonical English path, without the locale prefix. */
  path: string;
  title: string;
  /** Meta description. Section 19: unique per page. */
  description: string;
  intro: string;
  blocks: Block[];
  contentClass: ContentClass;

  /**
   * Named author and qualified reviewer. Section 19: "Named authors and
   * qualified reviewers for medical, billing, insurance, and patient-rights
   * content. Show review date and correction path."
   *
   * `null` means not yet reviewed — the page renders a visible "under review"
   * state rather than an unattributed claim.
   */
  reviewer: { name: string; role: string } | null;
  reviewedOn: string | null;

  /** Set only when a human has reviewed the Spanish translation (D11). */
  esReviewedOn: string | null;

  /** Spanish blocks. Present only alongside `esReviewedOn`. */
  esBlocks?: Block[];
  esTitle?: string;
  esIntro?: string;
}

/**
 * Decides whether a page may render its body in the requested locale.
 *
 * English always renders. Spanish renders only when the content is `general`
 * (navigation-level copy, no medical/legal/insurance assertions) or when a
 * reviewer has signed off the translation.
 */
export function canRenderLocale(page: PageContent, locale: Locale): boolean {
  if (locale === 'en') return true;
  if (page.esReviewedOn !== null && page.esBlocks !== undefined) return true;
  return page.contentClass === 'general';
}
