import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/exports/audit-pack/client")

  try {
    requireRole(request, ["owner", "compliance"], "exportul Audit Pack client-facing")

    const payload = await buildDashboardPayload(await readState())
    const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)
    const auditPack = buildAuditPack({
      state: payload.state,
      remediationPlan: payload.remediationPlan,
      workspace: payload.workspace,
      compliancePack: payload.compliancePack,
      snapshot,
    })
    const document = buildClientAuditPackDocument(auditPack)

    return new Response(document.html, {
      ...withRequestIdHeaders(
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `inline; filename="${document.fileName}"`,
            "Cache-Control": "no-store",
          },
        },
        context
      ),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    logRouteError(context, error, {
      code: "AUDIT_PACK_CLIENT_EXPORT_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Exportul Audit Pack client-facing a esuat.",
      500,
      "AUDIT_PACK_CLIENT_EXPORT_FAILED",
      undefined,
      context
    )
  }
}
