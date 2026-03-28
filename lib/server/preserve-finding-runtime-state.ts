import type { ScanFinding } from "@/lib/compliance/types"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"

function preserveFindingRuntimeState(existing: ScanFinding | undefined, incoming: ScanFinding): ScanFinding {
  if (!existing) return incoming

  return {
    ...incoming,
    findingStatus: existing.findingStatus ?? incoming.findingStatus,
    findingStatusUpdatedAtISO: existing.findingStatusUpdatedAtISO ?? incoming.findingStatusUpdatedAtISO,
    nextMonitoringDateISO: existing.nextMonitoringDateISO ?? incoming.nextMonitoringDateISO,
    reopenedFromISO: existing.reopenedFromISO ?? incoming.reopenedFromISO,
    operationalEvidenceNote: existing.operationalEvidenceNote ?? incoming.operationalEvidenceNote,
    resolution:
      existing.findingStatus && existing.findingStatus !== "open"
        ? existing.resolution ?? incoming.resolution
        : incoming.resolution ?? existing.resolution,
  }
}

export function preserveRuntimeStateForRegeneratedFindings(
  existingFindings: ScanFinding[],
  incomingFindings: ScanFinding[]
) {
  const existingById = new Map(existingFindings.map((finding) => [finding.id, finding]))
  const mergedFindings = incomingFindings.map((finding) => preserveFindingRuntimeState(existingById.get(finding.id), finding))
  const incomingIds = new Set(incomingFindings.map((finding) => finding.id))
  const preservedMissingFindings = existingFindings.filter((finding) => {
    if (incomingIds.has(finding.id)) return false

    const status = finding.findingStatus ?? "open"
    if (!["confirmed", "resolved", "under_monitoring"].includes(status)) return false

    const recipe = buildCockpitRecipe(finding)
    return recipe.executionClass === "specialist_handoff"
  })

  return [...mergedFindings, ...preservedMissingFindings]
}

export function preserveRuntimeStateForSingleFinding(
  existingFindings: ScanFinding[],
  incomingFinding: ScanFinding
) {
  const existing = existingFindings.find((finding) => finding.id === incomingFinding.id)
  return preserveFindingRuntimeState(existing, incomingFinding)
}
