-- 0001_init.sql — auth + per-user state

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credentials (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key      BYTEA NOT NULL,
  counter         BIGINT NOT NULL,
  transports      TEXT[] NOT NULL DEFAULT '{}',
  device_type     TEXT NOT NULL,
  backed_up       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credentials_user_id_idx ON credentials(user_id);

CREATE TABLE IF NOT EXISTS challenges (
  user_id     TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('register', 'login')),
  challenge   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, kind)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- Generic per-user state store. One row per (user, key); value is a JSONB blob.
-- This lets us mirror localStorage keys without designing a table per data type.
CREATE TABLE IF NOT EXISTS user_state (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Row-level security defense in depth: even if app code forgets to filter
-- by user, the DB will. Each request must run:
--   SET LOCAL app.current_user_id = '<id>';
ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_state_isolation ON user_state
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY credentials_isolation ON credentials
  USING (user_id = current_setting('app.current_user_id', true));
