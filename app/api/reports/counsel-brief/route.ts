// POST /api/reports/counsel-brief — G2: Generate counsel legal brief
// Builds a legal summary with framework references for DPO/counsel review.

import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildComplianceResponse, buildCounselBrief } from "@/lib/compliance/response-pack"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "generarea legal brief-ului de counsel"
    )
    const rawState =
      (await readStateForOrg(session.orgId)) ?? normalizeComplianceState(initialComplianceState)

    const state = normalizeComplianceState(rawState)
    const summary = computeDashboardSummary(state)
    const plan = buildRemediationPlan(state)

    const responseData = buildComplianceResponse(
      state,
      summary,
      plan,
      session.orgName ?? "Organizație",
      new Date().toISOString(),
    )

    const brief = buildCounselBrief(responseData)
    return NextResponse.json({ ok: true, brief })
  } catch {
    return jsonError("Eroare la generarea briefului.", 500, "COUNSEL_BRIEF_FAILED")
  }
}
