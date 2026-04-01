import {
  buildAIActFindingId,
  buildAIActObligationFindings,
  classifyAISystem,
  getAIActRequiredActionIds,
} from "@/lib/compliance/ai-act-classifier"
import type { AISystemRecord, ComplianceState, ScanFinding } from "@/lib/compliance/types"

export function syncAIActObligationFindings(
  state: ComplianceState,
  system: AISystemRecord,
  nowISO: string
): ComplianceState {
  const classification = classifyAISystem(system.purpose)
  const requiredIds = new Set(
    getAIActRequiredActionIds(classification).map((obligationId) =>
      buildAIActFindingId(system.id, obligationId)
    )
  )

  if (requiredIds.size === 0) return state

  const generatedFindings = buildAIActObligationFindings(system, classification, nowISO)
  const keptFindings = state.findings.filter((finding) => !requiredIds.has(finding.id))

  return {
    ...state,
    findings: [...generatedFindings, ...keptFindings].map((finding) =>
      finding.findingTypeId ? finding : materializeAIActFinding(finding, nowISO)
    ),
  }
}

export function removeAIActObligationFindings(
  state: ComplianceState,
  systemId: string
): ComplianceState {
  return {
    ...state,
    findings: state.findings.filter((finding) => !finding.id.startsWith(`ai-act-${systemId}-`)),
  }
}

function materializeAIActFinding(finding: ScanFinding, nowISO: string): ScanFinding {
  return {
    ...finding,
    findingStatus: finding.findingStatus ?? "open",
    findingStatusUpdatedAtISO: finding.findingStatusUpdatedAtISO ?? nowISO,
  }
}
