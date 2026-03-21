-- ANAF OAuth2 Tokens table (F4 — ANAF OAuth2 + SPV)
-- Stores encrypted OAuth2 tokens for ANAF SPV integration.
-- Used by lib/anaf-spv-client.ts for token persistence and refresh.
-- RLS enabled — each org can only access its own tokens.

CREATE TABLE IF NOT EXISTS anaf_tokens (
  org_id         TEXT        PRIMARY KEY,
  access_token   TEXT,
  refresh_token  TEXT        NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  token_type     TEXT        DEFAULT 'Bearer',
  scope          TEXT        DEFAULT 'SPV',
  created_at     TIMESTAMPTZ DEFAULT now(),
  last_used_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE anaf_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policy: orgs can only read/write their own tokens
CREATE POLICY anaf_tokens_org_isolation ON anaf_tokens
  USING (org_id = current_setting('app.current_org_id', true))
  WITH CHECK (org_id = current_setting('app.current_org_id', true));
