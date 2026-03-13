import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { readState } from "@/lib/server/mvp-store"

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
  const document = buildClientAuditPackDocument(auditPack)

  return new Response(document.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${document.fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
