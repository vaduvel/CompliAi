// POST /api/reports/counsel-brief — G2: Generate counsel legal brief
// Builds a legal summary with framework references for DPO/counsel review.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { readState } from "@/lib/server/mvp-store"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildComplianceResponse, buildCounselBrief } from "@/lib/compliance/response-pack"

export async function POST() {
  try {
    const ctx = await getOrgContext()
    if (!ctx?.orgId) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const rawState = await readState()
    if (!rawState) return jsonError("Nu există stare de conformitate.", 404, "NO_STATE")

    const state = normalizeComplianceState(rawState)
    const summary = computeDashboardSummary(state)
    const plan = buildRemediationPlan(state)

    const responseData = buildComplianceResponse(
      state,
      summary,
      plan,
      ctx.orgName ?? "Organizație",
      new Date().toISOString(),
    )

    const brief = buildCounselBrief(responseData)
    return NextResponse.json({ ok: true, brief })
  } catch {
    return jsonError("Eroare la generarea briefului.", 500, "COUNSEL_BRIEF_FAILED")
  }
}
