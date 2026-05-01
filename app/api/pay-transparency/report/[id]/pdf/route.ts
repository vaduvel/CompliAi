// Pay Transparency — ITM PDF export endpoint
// GET /api/pay-transparency/report/[id]/pdf — returns PDF binary

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { buildItmReportPdf } from "@/lib/exports/itm-pay-gap-pdf"
import { getPayGapReport } from "@/lib/server/pay-transparency-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export const dynamic = "force-dynamic"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await requireFreshRole(request, [...READ_ROLES], "export PDF Pay Transparency")
    const report = await getPayGapReport(session.orgId, id)
    if (!report) return jsonError("Raportul nu a fost găsit.", 404, "PT_REPORT_NOT_FOUND")

    let whiteLabel = null
    try {
      whiteLabel = await getWhiteLabelConfig(session.orgId)
    } catch {
      // Non-blocking — fără white-label, raportul folosește orgName.
    }

    const pdf = await buildItmReportPdf({
      report,
      orgName: session.orgName,
      whiteLabel,
    })

    // Convert Buffer la ArrayBuffer pentru compatibilitate cu BodyInit
    const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="raport-pay-transparency-${report.periodYear}-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Eroare la generarea PDF.",
      500,
      "PT_PDF_FAILED",
    )
  }
}
