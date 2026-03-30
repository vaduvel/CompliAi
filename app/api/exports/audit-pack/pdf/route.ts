import { buildAuditPack } from "@/lib/server/audit-pack"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { generateAuditPackPdfBuffer } from "@/lib/server/audit-pack-pdf"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/exports/audit-pack/pdf")

  try {
    requireRole(request, ["owner", "partner_manager", "compliance"], "exportul Audit Pack PDF Native")

    const { orgId } = await getOrgContext()
    const [state, nis2State] = await Promise.all([readState(), readNis2State(orgId)])
    const payload = await buildDashboardPayload(state)
    const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)
    const auditPack = buildAuditPack({
      state: payload.state,
      remediationPlan: payload.remediationPlan,
      workspace: payload.workspace,
      compliancePack: payload.compliancePack,
      snapshot,
      nis2State,
    })

    const pdfBuffer = await generateAuditPackPdfBuffer(auditPack)
    const fileName = `Audit-Pack-${auditPack.workspace.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${auditPack.generatedAt.slice(0, 10)}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      ...withRequestIdHeaders(
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
            "Content-Length": pdfBuffer.length.toString(),
          },
        },
        context
      ),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      await logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "AUDIT_PACK_PDF_EXPORT_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Exportul Audit Pack in format PDF a esuat.",
      500,
      "AUDIT_PACK_PDF_EXPORT_FAILED",
      undefined,
      context
    )
  }
}
