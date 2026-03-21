-- Score Snapshots table (A3 — Super Prompt)
-- Daily compliance score per org, used for delta alerts and trend tracking.

CREATE TABLE IF NOT EXISTS compliscan.score_snapshots (
  org_id   TEXT        NOT NULL,
  date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  score    SMALLINT    NOT NULL CHECK (score >= 0 AND score <= 100),
  CONSTRAINT score_snapshots_pkey PRIMARY KEY (org_id, date)
);

-- Fast lookup for recent scores per org
CREATE INDEX IF NOT EXISTS idx_score_snapshots_org_date
  ON compliscan.score_snapshots (org_id, date DESC);
