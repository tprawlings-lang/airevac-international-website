-- Phase A: users, sessions, audit log.
--
-- No chat tables yet. Phase A must be provable on its own before anything in
-- this database can hold a patient's information.
--
-- Every table here is written on the assumption that this database will later
-- be a PHI system, because it will be. That is why the audit log exists before
-- there is anything interesting to audit, and why session tokens and IP
-- addresses are stored hashed from the first migration rather than retrofitted.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'coordinator');
CREATE TYPE user_status AS ENUM ('active', 'disabled');

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Case-insensitive by normalising on write; CITEXT would need another
  -- extension for no benefit at this scale.
  email                TEXT NOT NULL UNIQUE,
  display_name         TEXT NOT NULL,

  -- scrypt, with the parameters encoded in the string so they can be raised
  -- per user on next login rather than by migration. Never a bare digest.
  password_hash        TEXT NOT NULL,

  role                 user_role NOT NULL DEFAULT 'coordinator',
  status               user_status NOT NULL DEFAULT 'active',

  -- Languages this person can hold a conversation in. Drives translation
  -- routing in Phase C: translation activates only when the visitor's language
  -- is not in this list.
  languages            TEXT[] NOT NULL DEFAULT ARRAY['en'],

  -- Set on every seeded or admin-created account. While true, the only page
  -- the session may reach is "choose a new password". This is what makes the
  -- bootstrap admin password safe to exist at all.
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,

  -- Lockout state. Counted per user here; the per-IP half lives in the rate
  -- limiter, because an attacker spraying one password across many accounts
  -- never trips a per-user counter.
  failed_attempts      INTEGER NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,

  last_login_at        TIMESTAMPTZ,
  password_changed_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES users (id) ON DELETE SET NULL,
  disabled_at          TIMESTAMPTZ
);

CREATE INDEX users_status_role_idx ON users (status, role);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  -- SHA-256 of the opaque token. The token itself exists only in the cookie.
  -- A leaked database backup therefore does not hand over live sessions.
  token_hash     TEXT NOT NULL UNIQUE,

  -- Idle and absolute expiry are separate on purpose: a session that is being
  -- used stays alive up to the absolute cap, and one left open on an
  -- unattended machine dies on the idle timeout.
  expires_at     TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,

  -- Coarsened and hashed. Enough to notice a session jumping continents,
  -- not enough to be a retained identifier. Section 15 caps raw IP retention.
  ip_hash        TEXT,
  user_agent_hash TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at     TIMESTAMPTZ,
  revoked_reason TEXT
);

CREATE INDEX sessions_user_idx ON sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX sessions_expiry_idx ON sessions (absolute_expires_at);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
--
-- Append-only by convention and by grant: the application role gets INSERT and
-- SELECT, never UPDATE or DELETE. An audit log an attacker can edit after
-- gaining admin is not an audit log.
--
-- READS ARE RECORDED, not just writes. For a system that will hold patient
-- conversations, "who opened this transcript" is the question an investigation
-- actually asks, and it is unanswerable if only writes are logged.
CREATE TABLE audit_log (
  id             BIGSERIAL PRIMARY KEY,

  -- Null for failed logins, where no user is established yet.
  actor_user_id  UUID REFERENCES users (id) ON DELETE SET NULL,

  -- Free text rather than an enum: an enum turns "we started recording a new
  -- event" into a migration, and the cost of that is people not recording it.
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,

  -- Never a message body, never a password, never PHI. Shape and outcome only.
  detail         JSONB NOT NULL DEFAULT '{}'::jsonb,

  ip_hash        TEXT,
  at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_actor_idx ON audit_log (actor_user_id, at DESC);
CREATE INDEX audit_log_action_idx ON audit_log (action, at DESC);
CREATE INDEX audit_log_target_idx ON audit_log (target_type, target_id, at DESC);
