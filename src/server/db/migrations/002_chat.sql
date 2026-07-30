-- Phase B: chat sessions, messages, and coordinator presence.
--
-- EVERYTHING HERE IS A PHI SYSTEM. A chat has one free-text field, so a
-- visitor will describe a patient's condition in it whatever the placeholder
-- says. The schema is built on that assumption rather than hoping otherwise:
-- retention is set at creation, deletion is a scheduled sweep over an indexed
-- column, and the original text of every message is preserved separately from
-- its translation so a mistranslation stays catchable.

CREATE TYPE chat_status AS ENUM (
  'intake',      -- visitor is filling in the pre-chat form
  'queued',      -- waiting for a coordinator to claim it
  'active',      -- a coordinator is in the conversation
  'closed',      -- ended normally
  'abandoned'    -- visitor left before anyone joined
);

CREATE TYPE message_sender AS ENUM ('visitor', 'coordinator', 'system');

-- ---------------------------------------------------------------------------
-- chat_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE chat_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quotable on the phone, and the reference the notification email carries.
  -- Same shape as the callback form's, so staff learn one format.
  public_ref        TEXT NOT NULL UNIQUE,

  -- Opaque token the visitor's browser holds. Hashed, like a session token:
  -- the visitor is not authenticated, so this is the only thing binding a
  -- browser to a conversation, and a leaked backup must not hand over the
  -- ability to resume someone else's chat.
  visitor_token_hash TEXT NOT NULL UNIQUE,

  status            chat_status NOT NULL DEFAULT 'intake',

  -- The pre-chat form. Allowlisted fields only, screened by the same tripwire
  -- the callback form uses, so this column holds logistics rather than
  -- clinical detail. The conversation itself is where PHI arrives.
  intake            JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Drives translation in Phase C. Translation activates only when this is not
  -- among the assigned coordinator's languages.
  visitor_language  TEXT NOT NULL DEFAULT 'en',

  assigned_user_id  UUID REFERENCES users (id) ON DELETE SET NULL,

  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_at      TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  close_reason      TEXT,

  -- Last activity from either side. Drives the abandoned sweep, so a browser
  -- closed mid-conversation does not sit in the queue forever.
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Set at creation from the retention policy, so deletion is a scheduled job
  -- over an index rather than a decision somebody has to remember to make.
  -- D9 is open; the default is deliberately short until it closes.
  delete_after      TIMESTAMPTZ NOT NULL,

  ip_hash           TEXT
);

CREATE INDEX chat_sessions_queue_idx ON chat_sessions (status, started_at)
  WHERE status IN ('queued', 'active');
CREATE INDEX chat_sessions_assigned_idx ON chat_sessions (assigned_user_id, status);
CREATE INDEX chat_sessions_retention_idx ON chat_sessions (delete_after);
CREATE INDEX chat_sessions_activity_idx ON chat_sessions (last_activity_at)
  WHERE status IN ('intake', 'queued', 'active');

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE chat_messages (
  id                  BIGSERIAL PRIMARY KEY,
  chat_session_id     UUID NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,

  sender              message_sender NOT NULL,
  -- Null for visitor and system messages.
  sender_user_id      UUID REFERENCES users (id) ON DELETE SET NULL,

  -- THE ORIGINAL IS NEVER OVERWRITTEN BY ITS TRANSLATION. Both are stored and
  -- both are shown. A mistranslated clinical detail can change a decision, and
  -- hiding the original removes the only way anyone has of catching it.
  body_original       TEXT NOT NULL,
  language_original   TEXT NOT NULL,

  body_translated     TEXT,
  language_translated TEXT,
  translation_engine  TEXT,
  -- Set when translation was attempted and failed, so the interface can say so
  -- rather than silently showing one side nothing.
  translation_error   TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_idx ON chat_messages (chat_session_id, id);

-- ---------------------------------------------------------------------------
-- coordinator_presence
-- ---------------------------------------------------------------------------
--
-- PRESENCE EXPIRES RATHER THAN PERSISTS. A coordinator who closes their laptop
-- sends no "I am leaving" signal, and a chat offered to a coordinator who is
-- not there is worse than no chat: a visitor waits instead of calling the line
-- that is genuinely answered. So availability is a heartbeat with an expiry,
-- and a stale row reads as offline.
CREATE TABLE coordinator_presence (
  user_id     UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  available   BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coordinator_presence_live_idx ON coordinator_presence (expires_at)
  WHERE available;
