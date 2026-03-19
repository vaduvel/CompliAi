import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildOnePageReport, buildOnePageReportMarkdown } from "@/lib/compliance/one-page-report"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { logRouteError } from "@/lib/server/operational-logger"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/reports/pdf")

  try {
    const [state, { orgName }] = await Promise.all([readState(), getOrgContext()])
    const normalized = normalizeComplianceState(state)
    const summary = computeDashboardSummary(normalized)
    const remediationPlan = buildRemediationPlan(normalized)
    const nowISO = new Date().toISOString()

    const report = buildOnePageReport(normalized, summary, remediationPlan, orgName, nowISO)
    const markdown = buildOnePageReportMarkdown(report)

    const pdfBuffer = await buildPDFFromMarkdown(markdown, {
      orgName,
      documentType: "Raport Executiv de Conformitate",
      generatedAt: nowISO,
    })

    const date = new Date(nowISO).toISOString().slice(0, 10)
    const filename = `raport-executiv-${date}.pdf`

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      withRequestIdHeaders(
        {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        },
        context
      )
    )
  } catch (error) {
    await logRouteError(context, error, {
      code: "REPORT_PDF_GENERATE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "PDF-ul raportului nu a putut fi generat."
    return jsonError(message, 500, "REPORT_PDF_GENERATE_FAILED", undefined, context)
  }
}
