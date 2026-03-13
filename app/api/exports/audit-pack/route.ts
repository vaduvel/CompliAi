import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { readState } from "@/lib/server/mvp-store"
import { buildAuditPack } from "@/lib/server/audit-pack"

export async function GET() {
  const payload = await buildDashboardPayload(await readState())
  const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)
  const auditPack = buildAuditPack({
    state: payload.state,
    remediationPlan: payload.remediationPlan,
    workspace: payload.workspace,
    compliancePack: payload.compliancePack,
    snapshot,
  })
  const dateLabel = auditPack.generatedAt.slice(0, 10)
  const fileName = `audit-pack-v2-1-${payload.workspace.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${dateLabel}.json`

  return new Response(JSON.stringify(auditPack, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
