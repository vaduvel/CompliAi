import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildOnePageReport, buildOnePageReportHtml } from "@/lib/compliance/one-page-report"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/reports")

  try {
    const [state, { orgName }] = await Promise.all([readState(), getOrgContext()])
    const normalized = normalizeComplianceState(state)
    const summary = computeDashboardSummary(normalized)
    const remediationPlan = buildRemediationPlan(normalized)
    const nowISO = new Date().toISOString()

    const report = buildOnePageReport(normalized, summary, remediationPlan, orgName, nowISO)
    const html = buildOnePageReportHtml(report)

    return NextResponse.json({ report, html }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    await logRouteError(context, error, {
      code: "REPORTS_GENERATE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Raportul nu a putut fi generat."
    return jsonError(message, 500, "REPORTS_GENERATE_FAILED", undefined, context)
  }
}
