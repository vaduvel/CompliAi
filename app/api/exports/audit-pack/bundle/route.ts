import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildAuditPackBundle } from "@/lib/server/audit-pack-bundle"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { requirePlan, PlanError } from "@/lib/server/plan"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance"], "exportul Audit Pack bundle")
    await requirePlan(request, "pro", "Audit Pack complet")

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
    const bundle = await buildAuditPackBundle(auditPack)

    return new Response(new Uint8Array(bundle.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${bundle.fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul Audit Pack bundle a esuat.",
      500,
      "AUDIT_PACK_BUNDLE_EXPORT_FAILED"
    )
  }
}
