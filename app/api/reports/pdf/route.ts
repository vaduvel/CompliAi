import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { buildOnePageReport, buildOnePageReportMarkdown } from "@/lib/compliance/one-page-report"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

export async function POST() {
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

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
