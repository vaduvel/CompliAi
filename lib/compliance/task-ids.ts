import type { ComplianceState } from "@/lib/compliance/types"
import { buildRemediationPlan } from "@/lib/compliance/remediation"

export function buildFindingTaskId(findingId: string) {
  return findingId.startsWith("finding-") ? findingId : `finding-${findingId}`
}

export function resolveFindingIdFromTaskId(taskId: string) {
  let normalized = taskId

  while (normalized.startsWith("finding-")) {
    normalized = normalized.replace("finding-", "")
  }

  return normalized ? `finding-${normalized}` : ""
}

export function getLegacyFindingTaskId(findingId: string) {
  const normalizedFindingId = resolveFindingIdFromTaskId(buildFindingTaskId(findingId))
  return normalizedFindingId ? `finding-${normalizedFindingId}` : ""
}

export function getTaskStateByTaskId<T>(taskState: Record<string, T>, taskId: string) {
  if (taskState[taskId]) return taskState[taskId]

  if (!taskId.startsWith("finding-")) return undefined

  const rawFindingId = taskId.replace(/^finding-/, "")
  if (taskState[rawFindingId]) return taskState[rawFindingId]

  const findingId = resolveFindingIdFromTaskId(taskId)
  const legacyTaskId = findingId ? getLegacyFindingTaskId(findingId) : ""

  if (legacyTaskId && legacyTaskId !== taskId) {
    return taskState[legacyTaskId]
  }

  return undefined
}

export function getPersistableTaskIds(state: ComplianceState) {
  const ids = new Set<string>()

  for (const item of buildRemediationPlan(state)) {
    ids.add(`rem-${item.id}`)
  }

  for (const finding of state.findings) {
    ids.add(buildFindingTaskId(finding.id))
  }

  return ids
}
