// lib/server/analytics.ts
// V4.4.4 — Event tracking pentru pilot learning.
// Stocare: Supabase `analytics_events` (dacă configurat) sau .data/analytics.jsonl (fallback).
// Nu blochează niciodată fluxul principal — erori înghițite silențios.

import { promises as fs } from "node:fs"
import path from "node:path"

import { appendFileSafe } from "@/lib/server/fs-safe"
import { hasSupabaseConfig, supabaseInsert } from "@/lib/server/supabase-rest"

// ── Event types ───────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Success events (8)
  | "started_applicability"
  | "completed_applicability"
  | "generated_first_document"
  | "downloaded_one_page_report"
  | "generated_response_pack"
  | "closed_first_finding"
  | "entered_accountant_hub"
  | "clicked_late_nis2_rescue"
  // Stuck / abandon events (3)
  | "abandoned_applicability"
  | "opened_finding_but_not_closed"
  | "started_checkout_not_completed"
  // Feedback events (1)
  | "submitted_feedback"

export type AnalyticsRecord = {
  id?: string
  orgId: string
  event: AnalyticsEvent
  properties?: Record<string, string | number | boolean>
  createdAtISO: string
}

// ── Local fallback (JSONL) ────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), ".data")
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.jsonl")

async function appendToLocalFile(record: AnalyticsRecord): Promise<void> {
  await appendFileSafe(ANALYTICS_FILE, JSON.stringify(record) + "\n")
}

// ── trackEvent ────────────────────────────────────────────────────────────────

/**
 * Înregistrează un event de analytics pentru o organizație.
 * Fire-and-forget — nu aruncă niciodată. Folosiți `void trackEvent(...)`.
 *
 * @example
 * void trackEvent(orgId, "completed_applicability")
 * void trackEvent(orgId, "generated_first_document", { docType: "privacy-policy" })
 */
export async function trackEvent(
  orgId: string,
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  if (!orgId || orgId.startsWith("demo-") || orgId.startsWith("org-demo-")) {
    // Nu tracking pentru demo orgs
    return
  }

  const record: AnalyticsRecord = {
    orgId,
    event,
    properties,
    createdAtISO: new Date().toISOString(),
  }

  try {
    if (hasSupabaseConfig()) {
      await supabaseInsert("analytics_events", record)
    } else {
      await appendToLocalFile(record)
    }
  } catch {
    // Silent — analytics nu blochează niciodată fluxul principal
    try {
      await appendToLocalFile(record)
    } catch {
      // Ignore completely
    }
  }
}

// ── readAnalytics (pentru admin/debug) ───────────────────────────────────────

export async function readLocalAnalytics(): Promise<AnalyticsRecord[]> {
  try {
    const content = await fs.readFile(ANALYTICS_FILE, "utf8")
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AnalyticsRecord)
  } catch {
    return []
  }
}
