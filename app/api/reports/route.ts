import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildOnePageReport, buildOnePageReportHtml } from "@/lib/compliance/one-page-report"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError } from "@/lib/server/request-validation"

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

    return jsonWithRequestContext({ report, html }, context)
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "REPORTS_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Raportul nu a putut fi generat.",
      500,
      "REPORTS_FAILED",
      undefined,
      context
    )
  }
}
