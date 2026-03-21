-- Legislation Hashes table (F1 — Radar Legislativ)
-- Stores SHA-256 hashes of monitored legislation pages for change detection.
-- Used by lib/legislation-monitor.ts to detect changes on ANSPDCP/DNSC/ANAF.

CREATE TABLE IF NOT EXISTS legislation_hashes (
  url           TEXT        PRIMARY KEY,
  hash          TEXT        NOT NULL,
  last_checked  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
