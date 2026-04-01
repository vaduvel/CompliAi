import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance"], "exportul Audit Pack")
    await requirePlan(request, "pro", "Audit Pack complet")

    const { orgId } = await getOrgContext()
    const [state, nis2State, whiteLabel] = await Promise.all([
      readState(),
      readNis2State(orgId),
      getWhiteLabelConfig(orgId).catch(() => null),
    ])
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
    const branding = whiteLabel?.partnerName
      ? {
          partnerName: whiteLabel.partnerName,
          tagline: whiteLabel.tagline ?? null,
          brandColor: whiteLabel.brandColor,
          logoUrl: whiteLabel.logoUrl ?? null,
        }
      : null
    const dateLabel = auditPack.generatedAt.slice(0, 10)
    const fileName = `audit-pack-v2-1-${payload.workspace.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${dateLabel}.json`

    const output = branding ? { ...auditPack, branding } : auditPack
    return new Response(JSON.stringify(output, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
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
      error instanceof Error ? error.message : "Exportul Audit Pack a esuat.",
      500,
      "AUDIT_PACK_EXPORT_FAILED"
    )
  }
}
