import { NextResponse } from "next/server"

import { PAY_TRANSPARENCY_FINDING_ID } from "@/lib/compliance/pay-transparency-rule"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { materializeFindingTruth } from "@/lib/compliscan/finding-truth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { computeNextMonitoringDateISO } from "@/lib/compliscan/finding-kernel"
import { upsertMonitoringReviewCycle } from "@/lib/server/review-cycle-store"
import {
  approvePayGapReport,
  publishPayGapReport,
} from "@/lib/server/pay-transparency-store"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "aprobarea raportului Pay Transparency"
    )

    const { id } = await params
    const body = (await request.json()) as { status?: "approved" | "published" }
    if (body.status !== "approved" && body.status !== "published") {
      return jsonError("Statusul raportului este invalid.", 400, "PAY_TRANSPARENCY_INVALID_STATUS")
    }

    const report =
      body.status === "published"
        ? await publishPayGapReport(session.orgId, id)
        : await approvePayGapReport(session.orgId, id)

    const documentId = `pay-gap-doc-${report.id}`
    const nowISO = new Date().toISOString()
    const nextMonitoringDateISO = computeNextMonitoringDateISO("PAY-001", nowISO) ?? undefined

    await mutateStateForOrg(session.orgId, (current) => {
      const findings = current.findings.map((finding) =>
        finding.id === PAY_TRANSPARENCY_FINDING_ID
          ? materializeFindingTruth({
              ...finding,
              findingStatus: "under_monitoring",
              findingStatusUpdatedAtISO: nowISO,
              nextMonitoringDateISO,
              operationalEvidenceNote:
                `Raport Pay Transparency ${report.periodYear} ${body.status === "published" ? "publicat" : "aprobat"} la ${new Date(nowISO).toLocaleDateString("ro-RO")}.`,
            })
          : finding
      )

      const generatedDocuments = (current.generatedDocuments ?? []).map((document) =>
        document.id === documentId
          ? {
              ...document,
              approvalStatus: "approved_as_evidence" as const,
              approvedAtISO: nowISO,
              approvedByUserId: session.userId,
              approvedByEmail: session.email,
              validationStatus: "passed" as const,
              validatedAtISO: nowISO,
            }
          : document
      )

      return {
        ...current,
        findings,
        generatedDocuments,
      }
    }, session.orgName)

    if (nextMonitoringDateISO) {
      await upsertMonitoringReviewCycle({
        orgId: session.orgId,
        findingId: PAY_TRANSPARENCY_FINDING_ID,
        findingTypeId: "PAY-001",
        scheduledAt: nextMonitoringDateISO,
        notes: `Review programat pentru raportul Pay Transparency ${report.periodYear}.`,
      }).catch(() => {})
    }

    return NextResponse.json({
      ok: true,
      report,
      documentId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    if (error instanceof Error && error.message === "PAY_GAP_REPORT_NOT_FOUND") {
      return jsonError("Raportul Pay Transparency nu există.", 404, "PAY_TRANSPARENCY_REPORT_NOT_FOUND")
    }
    return jsonError("Nu am putut salva statusul raportului.", 500, "PAY_TRANSPARENCY_REPORT_UPDATE_FAILED")
  }
}
