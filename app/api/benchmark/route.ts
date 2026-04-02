// GET /api/benchmark — Addon 2: Sector Benchmark
// Returns anonymous sector percentile for the current org.

import { NextResponse } from "next/server"

import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { getSectorBenchmark } from "@/lib/sector-benchmark"
import type { OrgSector } from "@/lib/compliance/applicability"

// Map OrgSector → approximate CAEN 2-digit prefix
const SECTOR_CAEN_MAP: Record<OrgSector, string> = {
  energy: "35",
  transport: "49",
  banking: "64",
  health: "86",
  "digital-infrastructure": "62",
  "public-admin": "84",
  finance: "66",
  retail: "47",
  manufacturing: "25",
  "professional-services": "70",
  other: "82",
}

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const rawState = await readStateForOrg(session.orgId)
    if (!rawState) return NextResponse.json({ benchmark: null, reason: "no-state" })

    const state = normalizeComplianceState(rawState)
    const sector = state.orgProfile?.sector
    if (!sector) return NextResponse.json({ benchmark: null, reason: "no-profile" })

    const caenPrefix = SECTOR_CAEN_MAP[sector] ?? "82"
    const summary = computeDashboardSummary(state)
    const score = summary.score

    const benchmark = await getSectorBenchmark(session.orgId, caenPrefix, score)
    return NextResponse.json({ benchmark })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Eroare la benchmark.", 500, "BENCHMARK_FAILED")
  }
}
