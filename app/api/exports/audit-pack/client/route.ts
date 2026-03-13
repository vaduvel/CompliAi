import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"

export async function GET(request: Request) {
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
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul Audit Pack client-facing a esuat.",
      500,
      "AUDIT_PACK_CLIENT_EXPORT_FAILED"
    )
  }
}
