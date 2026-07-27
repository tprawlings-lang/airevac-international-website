# ADR 0005 — Locale as a path prefix, with untranslated slugs and no auto-redirect

**Status:** Accepted · **Date:** 2026-07-27

## Context

Blueprint section 3: "English is the canonical content set. Spanish pages receive
human review, their own metadata, and proper hreflang tags."

Blueprint page 24, "Do not build": "Unreviewed automatic Spanish translation for
medical, legal, insurance, or emergency content."

## Decisions

**1. Locale is a path prefix (`/en/...`, `/es/...`), never a cookie.**

A coordinator sending a hospital or a family a link must be able to guarantee
which language opens. A cookie- or session-driven locale makes the same URL
render differently for different people, which breaks that guarantee.

**2. An unprefixed URL redirects to `/en`, not to a negotiated language.**

`Accept-Language` negotiation would make the canonical URL non-deterministic and
would send some crawlers to Spanish pages that are, by design, mostly
"translation pending" today. English is canonical, so `/` → `/en` with a 308.
Visitors switch explicitly using the header control.

**3. Route slugs are not translated.**

`/es/partners/hospitals`, not `/es/socios/hospitales`. Section 3 requires "short,
stable URLs". Translated slugs double the redirect map, and every revision to a
translation risks breaking an inbound link that a referral email or a partner
intranet is pointing at.

**4. Spanish body copy is gated by content class, not by availability.**

`canRenderLocale()` allows Spanish only when the content is `general`, or when a
human reviewer has signed off (`esReviewedOn` is set). Medical, legal,
insurance, and coverage content renders `TranslationPendingNotice` instead —
which offers a Spanish-speaking coordinator by phone and a link to the reviewed
English page. It is never a dead end.

A test asserts that `esBlocks` cannot exist without `esReviewedOn`, so a
translation cannot be published without a recorded review.

**5. One deliberate exception: the emergency notice is translated now.**

Withholding "call your local emergency services first" from a Spanish-speaking
reader is more dangerous than publishing one reviewed-but-not-yet-signed-off
sentence. It is flagged for priority review under D11.

## Consequences

- Spanish visitors currently see translated navigation, buttons, and form
  labels, and a clear explanation on content pages. That is honest, but it is not
  a finished Spanish site — closing D11 is what makes it one.
- `hreflang` pairs (`en-US`, `es-419`, `x-default` → English) are emitted on
  every page from `contentPageMetadata`, so search engines index the right
  language even while Spanish body copy is pending.
- `formatDate` renders in UTC in both locales. A credential expiry is a legal
  fact; rendering "Aug 25, 2027" as "Aug 24" for a viewer west of UTC would
  misstate a certificate.
