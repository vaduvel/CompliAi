import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildAuditPackBundle } from "@/lib/server/audit-pack-bundle"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { readState } from "@/lib/server/mvp-store"

export const runtime = "nodejs"

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
  const bundle = await buildAuditPackBundle(auditPack)

  return new Response(new Uint8Array(bundle.buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${bundle.fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}
