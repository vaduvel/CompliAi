import type { ScanFinding } from "@/lib/compliance/types"
import { buildNis2Findings, type Nis2OrgState, NIS2_PACKAGE_FINDING_IDS } from "@/lib/server/nis2-store"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"

const NIS2_PACKAGE_FINDING_ID_SET = new Set<string>(NIS2_PACKAGE_FINDING_IDS)

function preserveFindingSet(existingFindings: ScanFinding[], incomingFindings: ScanFinding[]) {
  return incomingFindings.map((finding) => preserveRuntimeStateForSingleFinding(existingFindings, finding))
}

export function mergeNis2PackageFindings(
  existingFindings: ScanFinding[],
  nis2State: Nis2OrgState | null | undefined,
  nowISO: string
) {
  const packageFindings = buildNis2Findings(nis2State, nowISO)
  return [
    ...existingFindings.filter((finding) => !NIS2_PACKAGE_FINDING_ID_SET.has(finding.id)),
    ...preserveFindingSet(existingFindings, packageFindings),
  ]
}
