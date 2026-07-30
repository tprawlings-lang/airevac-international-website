# Coordinator chat and console — architecture plan

**Status:** proposal, not approved, nothing built.
**Date:** 2026-07-30.

A live chat that connects a visitor to a flight coordinator, with a pre-chat
intake, English/Spanish translation, a coordinator console behind a login, admin
user management, and a transcript record sent to operations when the chat ends.

This plan exists to be argued with before any of it is written. Three things
about this feature are genuinely different from everything built so far, and
they should be settled first because they change the shape of the build.

---

## 1. The three constraints that shape everything

### 1.1 This feature receives PHI. That is not avoidable by design.

Every other part of this site is built so protected health information cannot
reach it. The callback form has an allowlist and a PHI tripwire that rejects a
submission naming a diagnosis. That works because the form has fixed fields.

**A chat has one field, and it is free text.** A mother whose son is in a Cancún
ICU will type his diagnosis into it within about ninety seconds, whatever the
placeholder text says. Asking her not to will not work, and it should not: she
is trying to get help.

So the honest design position is: **the chat store is a PHI system from the
first message.** Not "might contain PHI". Does. That single decision drives:

- Encryption at rest and in transit, with key management.
- Access control, so a coordinator sees only their own chats and an admin sees
  what the audit trail says they saw.
- An audit log of every read, not just every write.
- A retention and deletion schedule that actually runs (D9 is open).
- A Business Associate Agreement with **every** vendor the text touches: the
  host, the database, the translation engine, and the mail provider.
- A breach notification path.

The alternative — pretending the chat is "logistics only" and being wrong — is
the failure mode this whole codebase was built to avoid.

### 1.2 It reverses an approved decision

The AEI Sample Site Coding Change Handoff (2026-07-27) **removed secure chat**
and replaced it with email and fax for clinical documents. `SecureChatButton`
was deleted. G-08 states the clinical route is email or fax with no upload. The
contact page, the intake page, and three service pages say so in approved copy.

Building chat is a reversal, which is fine — a newer instruction wins, exactly
as the July handoff won over the blueprint. But it must be explicit, because
several pages of approved copy will need to change, and D8 currently records
chat as removed rather than pending.

**Needed:** written confirmation that chat supersedes the July handoff's
email-and-fax-only position, and a decision on whether email and fax remain the
route for *documents* while chat handles conversation. (Recommended: yes. A chat
window is a bad place to receive a 40-page medical record.)

### 1.3 A chat that nobody answers is worse than no chat

This is an air ambulance company. Someone opening a chat at 03:00 believes they
have reached a person. If no coordinator is signed in, and the widget shows a
spinner or a silent queue, that visitor waits instead of calling — and the phone
line, which is genuinely staffed 24/7, is the thing that would have helped them.

**This must be designed first, not handled later.** The plan below treats
coordinator presence as a first-class state and never shows an idle chat as
available. See §5.4.

---

## 2. Build or buy

Worth stating plainly before committing to a build.

| | Build (this plan) | Buy a HIPAA-eligible chat vendor |
| --- | --- | --- |
| Time to working | Weeks | Days |
| BAA burden | You need one per vendor: host, database, translation, mail | One, with the vendor |
| Cost shape | Engineering time, then near-zero marginal | Per-seat monthly, forever |
| Control | Total. Translation UX, intake, transcript format, retention | Whatever the vendor offers |
| Compliance evidence | You produce it | Vendor supplies most of it |
| Fit with this codebase | Native. Same claim gates, same redaction, same CSP | An iframe or script that the strict CSP must be relaxed for |
| Risk if it goes wrong | Yours | Shared, contractually |

**Recommendation: build, but only after §7's blockers clear.** The reasons to
build here are real — the translation requirement is unusual, the intake needs
to match the existing schema philosophy, and a third-party widget would force a
hole in the CSP on a site whose security posture is otherwise its strongest
asset. But if AirEvac cannot obtain BAAs from a host and a translation provider,
buying is the correct answer and this plan should be dropped rather than
softened.

---

## 3. Where the login goes

**Recommendation: not on the homepage.**

Reasons, in order of weight:

1. **The audience is wrong.** The homepage exists to get a family or a case
   manager to a coordinator in as few steps as possible. A "Log in" control in
   that space invites a distressed visitor to think they need an account before
   anyone will help them. That is a real conversion and real harm risk.
2. **Attack surface should not be advertised.** A login form linked from a
   public homepage collects credential-stuffing traffic from the day it ships.
3. **It costs nothing to move it.** Coordinators are a fixed, small set of
   people who can bookmark a URL.

**Proposed:** the console lives at `/coordinator`, is `noindex`, is disallowed
in `robots.txt`, and appears in no navigation. A quiet footer link is
acceptable if staff need discoverability; a homepage button is not. If AirEvac
has an identity provider, SSO on that path is better than local passwords.

---

## 4. Proposed architecture

Current stack has no database, no session store, and in-memory rate limiting.
This feature needs all three.

```
Visitor browser                          Coordinator browser
  │                                        │
  │ 1. Pre-chat intake (allowlisted)       │ Console at /coordinator
  │ 2. POST /api/chat/message              │ SSE stream + POST
  │ 3. SSE /api/chat/stream                │
  ▼                                        ▼
┌──────────────────────────────────────────────────────┐
│ Next.js on Render (single persistent instance)       │
│  auth · sessions · presence · routing · redaction    │
└───────┬───────────────────┬──────────────────┬───────┘
        │                   │                  │
   Postgres            Translation         Mail provider
   (encrypted)         (BAA required)      (notification only,
   chats, users,                            no PHI in body)
   audit log
```

### 4.1 Real-time transport: SSE, not WebSockets

Server-Sent Events for server→client, ordinary POST for client→server.

- One direction of streaming is all a chat needs, and SSE is plain HTTP: it
  survives corporate proxies that break WebSocket upgrades, which matters when
  half the users are hospital case managers behind enterprise firewalls.
- No new protocol in the CSP beyond what `connect-src 'self'` already permits.
- Reconnection and event IDs are built into the protocol.

**Scaling caveat, stated now:** with one instance, an in-process event emitter
fans messages out. With two, a message posted to instance B never reaches a
stream held on instance A. The fix is Postgres `LISTEN/NOTIFY` (no new
infrastructure) and it should be written that way from the start rather than
retrofitted.

### 4.2 Data model

```
users              id, email, password_hash (argon2id), role,
                   display_name, languages[], status,
                   must_change_password, failed_attempts, locked_until,
                   last_login_at, created_at, created_by
sessions           id, user_id, token_hash, expires_at, ip_hash,
                   user_agent_hash, created_at, revoked_at
chat_sessions      id, public_ref, status, visitor_language,
                   assigned_user_id, intake JSONB, started_at,
                   connected_at, closed_at, close_reason, delete_after
chat_messages      id, chat_session_id, sender, body_original,
                   language_original, body_translated, language_translated,
                   translation_engine, created_at
audit_log          id, actor_user_id, action, target_type, target_id,
                   at, ip_hash
```

Notes that matter:

- `body_original` is **never** overwritten by its translation. Both are stored
  and both are shown. See §4.4.
- `audit_log` records reads as well as writes. For a PHI system, "who looked at
  this transcript" is the question an investigation asks.
- `delete_after` is set at creation from the retention policy, so deletion is a
  scheduled job over an indexed column rather than a decision someone makes
  later.
- `sessions` stores a hash of the token, never the token.

### 4.3 Pre-chat intake

Reuses the existing philosophy in `src/lib/intake-schema.ts`: a strict
allowlist, a PHI tripwire, and no free-text field beyond a short logistics note.

Collected before a coordinator is engaged:

- Who is contacting (family, hospital, cruise or maritime, insurer)
- Name and callback number — because the chat may drop and the phone will not
- Organization, where applicable
- Where the patient is, and where they need to go (city or facility level)
- Timeframe
- **Preferred language** (drives §4.4)
- Consent to be contacted

This does two things at once: it gives the coordinator context before they say
hello, and it captures a callback path so a dropped connection is not a lost
case.

### 4.4 Translation

**The rule: translation is additive, never substitutive.** Both sides always see
the original text alongside the translation, labelled as machine translation.

Rationale: a mistranslated clinical detail in an air ambulance chat can change a
clinical decision. Hiding the original removes the only means anyone has of
catching it. A bilingual coordinator glancing at the Spanish original will spot
an error the system cannot.

- Language is asked at intake, and the coordinator's languages are on their user
  record. Translation activates only when they differ.
- Engine must be under a BAA. Google Cloud Translation and AWS Translate both
  offer HIPAA-eligible configurations; consumer translation endpoints do not.
  **Verify current terms before selecting.**
- A visible banner states that messages are machine translated and that a human
  interpreter can be arranged.
- Translation failure degrades to showing the original with an explicit "could
  not translate" marker. It never silently drops a message.
- Do not translate the emergency notice or any number, dose, or time reference
  without showing the original adjacent.

### 4.5 The transcript email

**Recommendation: notify by email, do not email the transcript.**

The requirement is documentation history, and that is met better by a durable
record than by a message in an inbox. The proposed shape:

> Subject: Chat transcript ready — AE-20260730-4K2P9X
> A chat with a hospital referrer closed at 14:12 UTC. Duration 18 minutes.
> Open the transcript in the coordinator console: <link>

No patient information, no message bodies, no names in the body. The transcript
itself lives in the database behind the login, where access is controlled and
audited.

Why not the full transcript: an email containing PHI is only defensible if the
whole mail path is covered by a BAA and enforced TLS, and it is then
irretrievable — you cannot delete it from the recipient's mailbox when the
retention schedule says to, cannot audit who read it, and cannot stop it being
forwarded. Emailing it converts a controlled record into an uncontrolled one.

**If AirEvac wants the full transcript in email anyway**, that is a decision they
can make, and it requires: confirmation that `ops@aeiamericas.com` sits on a
BAA-covered mail system, enforced TLS to that domain, and acceptance in writing
that transcripts then live outside the retention schedule.

### 4.6 Authentication

- **Hashing:** argon2id. Not bcrypt, not SHA-anything.
- **Sessions:** opaque random token, stored hashed, in an `httpOnly`, `Secure`,
  `SameSite=Strict` cookie. Idle timeout 30 minutes, absolute 12 hours.
- **CSRF:** double-submit token on every state-changing request.
- **Rate limiting and lockout:** the existing `RATE_LIMITS.adminLoginFailure`
  (5 per 15 minutes per user and IP) plus progressive lockout. Must move to the
  shared store at the same time as everything else (ADR 0003).
- **Roles:** `admin` (user management, all chats, audit log) and `coordinator`
  (own chats, own profile). Two roles is enough; more can come later.
- **Audit:** login, logout, failure, lockout, user create/disable, role change,
  password change, transcript read.

---

## 5. Behaviour design

### 5.1 Visitor states

```
closed  →  intake form  →  waiting for coordinator  →  in chat  →  ended
                    │                    │
                    │                    └─→ no coordinator available
                    └─→ blocked (PHI tripwire on intake, rate limited)
```

### 5.2 Coordinator states

`offline` → `available` → `in chat (n)` → `away`. Presence is explicit: a
coordinator marks themselves available, and a heartbeat from the open console
keeps it. A closed laptop must not read as available, which is why presence
expires rather than persists.

### 5.3 Routing

First version: any available coordinator sees a queued chat and claims it.
Simple, transparent, and correct for a small team. Automatic assignment can come
later; it is not worth building for a handful of coordinators.

### 5.4 When nobody is available

The state that matters most. The widget must never imply a person is there when
one is not.

- **Coordinators online:** "Chat with a flight coordinator" — normal path.
- **None online:** the chat does not open. The panel says so plainly and puts
  the phone number first: *"No coordinator is signed in to chat right now. Call
  (619) 754-6755 — that line is answered 24 hours a day."* Optionally, leaving a
  message creates a queued chat and notifies operations.
- **Claimed but idle:** if a coordinator does not respond within a set time, the
  visitor is shown the phone number without being disconnected.

The emergency notice stays visible throughout, exactly as it is elsewhere.

---

## 6. Phasing

Each phase is independently shippable and independently reversible.

| Phase | Contents | Proves |
| --- | --- | --- |
| **A** | Postgres, migrations, users, sessions, `/coordinator` login, admin user management, password change, audit log. No chat. | Auth and the admin console work, in isolation, before anything touches PHI. |
| **B** | Pre-chat intake, chat transport (SSE), coordinator console, presence, offline fallback. English only. | The conversation path works end to end. |
| **C** | Translation, both directions, with originals shown. | The hardest UX in the feature, on a working base. |
| **D** | Transcript notification email, retention job, transcript viewer and export. | Documentation history and the deletion schedule. |

Phase A is worth building even if the chat is later dropped in favour of a
vendor: the console, users, and audit log are reusable.

---

## 7. Blockers — these are not engineering questions

Nothing past Phase A should be built until each of these is answered.

1. **BAA with the host.** Confirm whether the current Render plan can be covered
   by a Business Associate Agreement. If it cannot, PHI must not land in a
   Render Postgres, and either the plan changes or the feature moves to a vendor.
   *This is the first call to make, because it can invalidate the whole plan.*
2. **BAA with the translation provider**, and which provider.
3. **Retention schedule (D9).** How long a transcript lives, what attaches it to
   a case, and what the legal-hold path is. Deletion must be automatic.
4. **Supersession of the July handoff** on chat, and whether email and fax remain
   the documents route.
5. **Staffing.** Which hours are genuinely covered by a signed-in coordinator.
   The blueprint required a 30-day staffing test before chat became
   customer-facing, and that requirement was sound.
6. **Notice of Privacy Practices update.** The NPP and privacy notice both
   describe a site that receives no clinical information through the website.
   Chat changes that, and both documents must be revised and re-approved before
   it goes live — the same rule that governed analytics.

---

## 8. The admin password

The request was for the admin password to be `admin`.

**What that gets right:** a demo needs to be openable without a credential
hunt, and executives should not be blocked by a password reset flow.

**Why it cannot simply stay that way:** this console will hold chat transcripts
containing patient information. `admin`/`admin` is the first credential pair
every automated scanner on the internet tries, usually within hours of a host
appearing in certificate transparency logs. On a HIPAA-relevant system that is
not a weak password, it is a reportable breach waiting for a scanner.

**Proposed compromise, which satisfies the demo need:**

- The first admin is seeded with username `admin` and password `admin`.
- That account is created with `must_change_password = true`. It can sign in
  with `admin`/`admin` exactly once, and the only page it can reach is "choose a
  new password".
- The seed runs only when no admin exists **and** `ALLOW_BOOTSTRAP_ADMIN=true`
  is set in the environment. It is absent in production by default.
- `admin` is added to a rejected-password list, so it cannot be chosen again.
- Every account created by an admin gets a one-time password and the same
  forced-change flag, so no coordinator ever has a password an admin knows.

This keeps the demo one click from working while making it impossible to ship
the default to production by forgetting. If AirEvac wants the password to
persist unchanged on a private demo instance, that is defensible **only** while
no real chat data exists on it, and it should never be the same instance that
later holds transcripts.

---

## 9. What this does not include

Stated so nobody assumes otherwise: no file upload in chat (documents stay on
email and fax, per G-08), no video, no chatbot or automated clinical triage, no
patient-facing account or portal (page 24 forbids it), no SMS bridge, no
storage of payment details, and no automatic clinical advice of any kind. The
coordinator is a person, and the product should never blur that.
