import { NextResponse } from "next/server"

import { PAY_TRANSPARENCY_FINDING_ID } from "@/lib/compliance/pay-transparency-rule"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { buildPayGapReport, buildPayGapReportMarkdown } from "@/lib/server/pay-transparency-store"

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "calculul gap-ului salarial"
    )

    const body = (await request.json().catch(() => null)) as { year?: number } | null
    const year = Number.isFinite(body?.year) ? Number(body!.year) : new Date().getFullYear()
    const report = await buildPayGapReport(session.orgId, year)
    const documentId = `pay-gap-doc-${report.id}`
    const generatedAtISO = report.generatedAtISO

    await mutateStateForOrg(session.orgId, (current) => {
      const nextDocument = {
        id: documentId,
        documentType: "pay-gap-report" as const,
        title: `Raport Pay Transparency ${report.periodYear}`,
        content: buildPayGapReportMarkdown(report),
        generatedAtISO,
        llmUsed: false,
        sourceFindingId: PAY_TRANSPARENCY_FINDING_ID,
        approvalStatus: "draft" as const,
        validationStatus: "pending" as const,
      }

      return {
        ...current,
        generatedDocuments: [
          nextDocument,
          ...(current.generatedDocuments ?? []).filter((document) => document.id !== documentId),
        ].slice(0, 150),
        events: appendComplianceEvents(current, [
          createComplianceEvent(
            {
              type: "document.generated",
              entityType: "system",
              entityId: documentId,
              message: `Raport Pay Transparency pregătit pentru ${report.periodYear}.`,
              createdAtISO: generatedAtISO,
              metadata: {
                documentType: "pay-gap-report",
                reportId: report.id,
              },
            },
            {
              id: session.userId,
              label: session.email,
              role: session.role,
              source: "session",
            }
          ),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ok: true,
      report,
      documentId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Nu am putut genera raportul de pay gap.", 500, "PAY_TRANSPARENCY_REPORT_FAILED")
  }
}
