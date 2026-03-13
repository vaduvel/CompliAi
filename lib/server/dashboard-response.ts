import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import type { ComplianceState } from "@/lib/compliance/types"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildComplianceTraceRecords } from "@/lib/server/compliance-trace"
import { getOrgContext } from "@/lib/server/org-context"
import { hydrateEvidenceAttachmentsFromSupabase } from "@/lib/server/supabase-evidence-read"

export type DashboardPayload = {
  state: ComplianceState
  summary: ReturnType<typeof computeDashboardSummary>
  remediationPlan: ReturnType<typeof buildRemediationPlan>
  workspace: Awaited<ReturnType<typeof getOrgContext>>
  compliancePack: AICompliancePack
  traceabilityMatrix: ComplianceTraceRecord[]
}

export async function buildDashboardPayload(state: ComplianceState) {
  const workspace = await getOrgContext()
  const hydratedState = await hydrateEvidenceAttachmentsFromSupabase(state, workspace.orgId)
  const normalizedState = normalizeComplianceState(hydratedState)
  const summary = computeDashboardSummary(normalizedState)
  const remediationPlan = buildRemediationPlan(normalizedState)
  const snapshot =
    normalizedState.snapshotHistory[0] ??
    buildCompliScanSnapshot({
      state: normalizedState,
      summary,
      remediationPlan,
      workspace,
    })

  return {
    state: normalizedState,
    summary,
    remediationPlan,
    workspace,
    compliancePack: buildAICompliancePack({
      state: normalizedState,
      remediationPlan,
      workspace,
      snapshot,
    }),
    traceabilityMatrix: buildComplianceTraceRecords({
      state: normalizedState,
      remediationPlan,
      snapshot,
    }),
  } satisfies DashboardPayload
}
