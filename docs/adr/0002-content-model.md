# ADR 0002 — Typed block content in-repo, shaped for a CMS

**Status:** Accepted · **Date:** 2026-07-27

## Context

Blueprint section 5 specifies a block-based content system with credential
records, aircraft records, CTA blocks, FAQ blocks, case-story blocks, and legal
notice blocks, governed by roles and approval workflow (section 11). No CMS has
been selected.

## Decision

Content lives as typed TypeScript data under `src/content/`, conforming to the
block model in `src/content/blocks.ts`. The `PageContent` type structurally
requires the governance fields: `contentClass`, `reviewer`, `reviewedOn`,
`esReviewedOn`.

## Rationale

- Building pages as JSX would have made the eventual CMS migration a rewrite.
  Building them as data makes it a mapping.
- Governance metadata that is *required by the type* cannot be forgotten. A page
  with medical content and no reviewer renders an "under review" banner
  automatically.
- A reviewer can read a page's complete text without reading React.
- The Spanish publication gate is enforced by `canRenderLocale()` reading these
  fields, rather than by each page author remembering the rule.

## Consequences

- No approval workflow, version history, scheduled review, or expiry
  notification exists yet. `expiryNotices()` computes the 120/90/60/30-day
  warnings but nothing consumes them — wiring that to the compliance owner is
  outstanding.
- Non-developers cannot edit content until a CMS is selected.
- When the CMS lands, it must satisfy `src/content/blocks.ts` and the
  `ClaimRecord` shape. `publishable()` should run server-side on CMS output, not
  be reimplemented in the CMS.
