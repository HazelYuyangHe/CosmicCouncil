-- Run this once in the Neon SQL editor to initialize the database.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS advice_sessions (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  raw_input    TEXT,
  final_advice TEXT,
  rationale    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_opinions (
  id          SERIAL PRIMARY KEY,
  session_id  INT REFERENCES advice_sessions(id) ON DELETE CASCADE,
  agent_name  TEXT NOT NULL,
  advice      TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- One memory row per user per agent. Updated after every session.
CREATE TABLE IF NOT EXISTS agent_memory (
  id               SERIAL PRIMARY KEY,
  user_id          INT REFERENCES users(id) ON DELETE CASCADE,
  agent_name       TEXT NOT NULL,
  memory_summary   TEXT,
  last_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, agent_name)
);
