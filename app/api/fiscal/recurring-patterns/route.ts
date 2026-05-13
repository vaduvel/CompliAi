// GET /api/fiscal/recurring-patterns — expune pattern-uri recurrente detectate
// pe baza fix_pattern_memory din state-ul org-ului.
//
// Returnează:
//   - patterns: lista pattern-urilor cu suggestedFix preselect
//   - summary: success rate + top clienți cu probleme recurrente

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  computePatternMemorySummary,
  detectRecurringPatterns,
  type FixPatternRecord,
} from "@/lib/compliance/smart-pattern-engine"
import type { ComplianceState } from "@/lib/compliance/types"

const READ_ROLES = [
  "owner",
  "partner_manager",
  "compliance",
  "reviewer",
  "viewer",
] as const

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare pattern-uri recurrente",
    )

    const state = (await readStateForOrg(session.orgId)) as
      | (ComplianceState & { fixPatternMemory?: FixPatternRecord[] })
      | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const records = state.fixPatternMemory ?? []
    const nowISO = new Date().toISOString()
    const url = new URL(request.url)
    const windowDays = clampWindow(url.searchParams.get("windowDays"))
    const threshold = clampThreshold(url.searchParams.get("threshold"))

    const patterns = detectRecurringPatterns(records, nowISO, {
      windowDays,
      threshold,
    })
    const summary = computePatternMemorySummary(records, patterns)

    return NextResponse.json({
      ok: true,
      scannedAtISO: nowISO,
      windowDays,
      threshold,
      summary,
      patterns,
      memorySize: records.length,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      "Eroare la detectarea pattern-urilor recurrente.",
      500,
      "PATTERN_DETECT_FAILED",
    )
  }
}

function clampWindow(raw: string | null): number {
  const n = raw ? Number(raw) : 30
  if (!Number.isFinite(n) || n < 7) return 30
  if (n > 365) return 365
  return Math.floor(n)
}

function clampThreshold(raw: string | null): number {
  const n = raw ? Number(raw) : 3
  if (!Number.isFinite(n) || n < 2) return 3
  if (n > 10) return 10
  return Math.floor(n)
}
