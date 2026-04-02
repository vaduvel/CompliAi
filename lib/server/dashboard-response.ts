import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { normalizeFindingSuggestedDocumentType } from "@/lib/compliscan/finding-kernel"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import type { ComplianceState, EvidenceRegistryEntry } from "@/lib/compliance/types"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { buildAICompliancePack } from "@/lib/server/ai-compliance-pack"
import { buildComplianceTraceRecords } from "@/lib/server/compliance-trace"
import { getOrgContext } from "@/lib/server/org-context"
import {
  hydrateEvidenceAttachmentsFromSupabase,
  loadEvidenceLedgerFromSupabase,
} from "@/lib/server/supabase-evidence-read"
import { buildOrgKnowledgeStaleFinding } from "@/lib/compliance/org-knowledge"
import { readDsarState } from "@/lib/server/dsar-store"

type DashboardWorkspace = Awaited<ReturnType<typeof getOrgContext>>

export type DsarDashboardSummary = {
  total: number
  urgent: number   // deadline ≤ 5 zile
  dueToday: number // deadline azi
}

export type DashboardPayload = {
  state: ComplianceState
  summary: ReturnType<typeof computeDashboardSummary>
  remediationPlan: ReturnType<typeof buildRemediationPlan>
  workspace: DashboardWorkspace
  compliancePack: AICompliancePack
  traceabilityMatrix: ComplianceTraceRecord[]
  evidenceLedger?: EvidenceRegistryEntry[]
  dsarSummary: DsarDashboardSummary
}

export type DashboardCorePayload = {
  state: ComplianceState
  summary: ReturnType<typeof computeDashboardSummary>
  remediationPlan: ReturnType<typeof buildRemediationPlan>
  workspace: DashboardWorkspace
  snapshot: ReturnType<typeof buildCompliScanSnapshot>
  evidenceLedger?: EvidenceRegistryEntry[]
}

export async function buildDashboardCorePayload(
  state: ComplianceState,
  workspaceOverride?: DashboardWorkspace
): Promise<DashboardCorePayload> {
  const workspace = workspaceOverride ?? (await getOrgContext())
  const hydratedState = await hydrateEvidenceAttachmentsFromSupabase(state, workspace.orgId)
  const evidenceLedger = await loadEvidenceLedgerFromSupabase({ orgId: workspace.orgId })

  // MULT B — inject stale orgKnowledge finding at read time (time-dependent, computed from age)
  const staleFinding = buildOrgKnowledgeStaleFinding(hydratedState.orgKnowledge, new Date().toISOString())
  const stateWithStale = {
    ...hydratedState,
    findings: staleFinding
      ? [...(hydratedState.findings ?? []).filter((f) => f.id !== "org-knowledge-stale"), staleFinding]
      : (hydratedState.findings ?? []).filter((f) => f.id !== "org-knowledge-stale"),
  }

  const normalizedState = normalizeComplianceState(stateWithStale)
  const runtimeTruthState = {
    ...normalizedState,
    findings: (normalizedState.findings ?? []).map((finding) => normalizeFindingSuggestedDocumentType(finding)),
  }
  const summary = computeDashboardSummary(runtimeTruthState)
  const remediationPlan = buildRemediationPlan(runtimeTruthState)
  const snapshot =
    runtimeTruthState.snapshotHistory[0] ??
    buildCompliScanSnapshot({
      state: runtimeTruthState,
      summary,
      remediationPlan,
      workspace,
    })

  return {
    state: runtimeTruthState,
    summary,
    remediationPlan,
    workspace,
    snapshot,
    evidenceLedger,
  }
}

export async function buildDashboardPayload(
  state: ComplianceState,
  workspaceOverride?: DashboardWorkspace
) {
  const core = await buildDashboardCorePayload(state, workspaceOverride)

  // Fix #3 — aggregate DSAR summary for sidebar badge + dashboard widgets
  const dsarState = await readDsarState(core.workspace.orgId)
  const nowMs = Date.now()
  const openDsar = dsarState.requests.filter((r) => r.status !== "responded" && r.status !== "refused")
  const dsarSummary: DsarDashboardSummary = {
    total: openDsar.length,
    urgent: openDsar.filter((r) => {
      const ms = new Date(r.deadlineISO).getTime() - nowMs
      return ms >= 0 && ms <= 5 * 86_400_000
    }).length,
    dueToday: openDsar.filter((r) => {
      const ms = new Date(r.deadlineISO).getTime() - nowMs
      return ms >= 0 && ms <= 86_400_000
    }).length,
  }

  return {
    state: core.state,
    summary: core.summary,
    remediationPlan: core.remediationPlan,
    workspace: core.workspace,
    compliancePack: buildAICompliancePack({
      state: core.state,
      remediationPlan: core.remediationPlan,
      workspace: core.workspace,
      snapshot: core.snapshot,
    }),
    traceabilityMatrix: buildComplianceTraceRecords({
      state: core.state,
      remediationPlan: core.remediationPlan,
      snapshot: core.snapshot,
    }),
    evidenceLedger: core.evidenceLedger,
    dsarSummary,
  } satisfies DashboardPayload
}
