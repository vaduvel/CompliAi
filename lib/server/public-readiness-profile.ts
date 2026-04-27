import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import type { ComplianceState, DashboardSummary, WorkspaceContext } from "@/lib/compliance/types"
import { buildAuditPack } from "@/lib/server/audit-pack"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"

export type PublicReadinessProfile = {
  state: ComplianceState
  summary: DashboardSummary
  auditPack: AuditPackV2
  score: number
  riskLabel: DashboardSummary["riskLabel"]
}

export async function buildPublicReadinessProfile(
  state: ComplianceState,
  workspace: WorkspaceContext
): Promise<PublicReadinessProfile> {
  const payload = await buildDashboardPayload(state, workspace)
  const snapshot = payload.state.snapshotHistory[0] ?? buildCompliScanSnapshot(payload)
  const auditPack = buildAuditPack({
    state: payload.state,
    remediationPlan: payload.remediationPlan,
    workspace: payload.workspace,
    compliancePack: payload.compliancePack,
    snapshot,
  })

  const score = auditPack.executiveSummary.complianceScore ?? payload.summary.score

  return {
    state: payload.state,
    summary: payload.summary,
    auditPack,
    score,
    riskLabel: formatPublicRiskLabel(auditPack.executiveSummary.riskLabel, score),
  }
}

export function formatPublicRiskLabel(
  riskLabel: string | null,
  fallbackScore: number
): DashboardSummary["riskLabel"] {
  if (riskLabel === "low") return "Risc Scăzut"
  if (riskLabel === "medium") return "Risc Mediu"
  if (riskLabel === "high") return "Risc Ridicat"
  if (fallbackScore >= 75) return "Risc Scăzut"
  if (fallbackScore >= 50) return "Risc Mediu"
  return "Risc Ridicat"
}
