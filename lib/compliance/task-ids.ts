import type { ComplianceState } from "@/lib/compliance/types"
import { buildRemediationPlan } from "@/lib/compliance/remediation"

export function getPersistableTaskIds(state: ComplianceState) {
  const ids = new Set<string>()

  for (const item of buildRemediationPlan(state)) {
    ids.add(`rem-${item.id}`)
  }

  for (const finding of state.findings) {
    ids.add(`finding-${finding.id}`)
  }

  return ids
}
