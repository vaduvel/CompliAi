// V3 P1.1 — Compliance Response Pack endpoint
// Generează documentul de răspuns la cereri de due diligence / chestionare conformitate.

import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildComplianceResponse, buildComplianceResponseHtml } from "@/lib/compliance/response-pack"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

export async function POST() {
  const [state, { orgName }] = await Promise.all([readState(), getOrgContext()])
  const normalized = normalizeComplianceState(state)
  const summary = computeDashboardSummary(normalized)
  const remediationPlan = buildRemediationPlan(normalized)
  const nowISO = new Date().toISOString()

  const report = buildComplianceResponse(normalized, summary, remediationPlan, orgName, nowISO)
  const html = buildComplianceResponseHtml(report)

  return NextResponse.json({ report, html })
}
