import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { resolveFindingIdFromTaskId } from "@/lib/compliance/task-ids"
import type { ComplianceAlert, ComplianceState } from "@/lib/compliance/types"
import { isFindingResolvedLike } from "@/lib/compliscan/finding-cockpit"

type TaskResolutionTargets = {
  alertIds: string[]
  findingIds: string[]
  driftIds: string[]
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function findRelatedAlertIdsForFinding(
  alerts: ComplianceAlert[],
  state: ComplianceState,
  findingId: string
) {
  const direct = alerts
    .filter((alert) => alert.findingId === findingId)
    .map((alert) => alert.id)

  if (direct.length > 0) return direct

  const finding = state.findings.find((item) => item.id === findingId)
  if (!finding) return []

  return alerts
    .filter(
      (alert) =>
        alert.sourceDocument === finding.sourceDocument &&
        (!!finding.scanId ? alert.scanId === finding.scanId : true)
    )
    .map((alert) => alert.id)
}

export function getTaskResolutionTargets(
  state: ComplianceState,
  taskId: string
): TaskResolutionTargets {
  if (taskId.startsWith("finding-")) {
    const findingId = resolveFindingIdForState(state, taskId)
    if (!findingId) return { alertIds: [], findingIds: [], driftIds: [] }
    return {
      findingIds: [findingId],
      alertIds: unique(findRelatedAlertIdsForFinding(state.alerts, state, findingId)),
      driftIds: [],
    }
  }

  if (taskId.startsWith("rem-")) {
    const remediation = buildRemediationPlan(state).find((item) => `rem-${item.id}` === taskId)
    if (!remediation) return { alertIds: [], findingIds: [], driftIds: [] }

    return {
      alertIds: unique(remediation.relatedAlertIds ?? []),
      findingIds: unique(remediation.relatedFindingIds ?? []),
      driftIds: unique(remediation.relatedDriftIds ?? []),
    }
  }

  return { alertIds: [], findingIds: [], driftIds: [] }
}

function resolveFindingIdForState(state: ComplianceState, taskId: string) {
  const canonical = resolveFindingIdFromTaskId(taskId)
  if (canonical && state.findings.some((item) => item.id === canonical)) return canonical

  const stripped = taskId.replace(/^finding-/, "")
  if (stripped && state.findings.some((item) => item.id === stripped)) return stripped

  return canonical || stripped
}

export function getResolvedFindingIds(state: ComplianceState) {
  const resolved = new Set<string>(
    state.findings
      .filter((finding) => isFindingResolvedLike(finding.findingStatus))
      .map((finding) => finding.id)
  )

  for (const [taskId, taskState] of Object.entries(state.taskState ?? {})) {
    if (taskState?.status !== "done") continue
    const targets = getTaskResolutionTargets(state, taskId)
    for (const findingId of targets.findingIds) resolved.add(findingId)
  }

  return resolved
}

export function getOperationallyClosedFindingIds(state: ComplianceState) {
  const closed = new Set<string>(
    state.findings
      .filter((finding) => isFindingResolvedLike(finding.findingStatus))
      .map((finding) => finding.id)
  )

  for (const [taskId, taskState] of Object.entries(state.taskState ?? {})) {
    if (taskState?.status !== "done" || taskState.validationStatus !== "passed") continue

    const directFinding = state.findings.find((finding) => finding.id === taskId)
    if (directFinding) {
      closed.add(directFinding.id)
      continue
    }

    const targets = getTaskResolutionTargets(state, taskId)
    for (const findingId of targets.findingIds) {
      closed.add(findingId)
    }
  }

  return closed
}

export function isFindingOperationallyClosed(state: ComplianceState, findingId: string) {
  return getOperationallyClosedFindingIds(state).has(findingId)
}

export function getResolvedAlertIds(state: ComplianceState) {
  const resolved = new Set<string>(
    state.alerts.filter((alert) => !alert.open).map((alert) => alert.id)
  )
  const resolvedFindingIds = getOperationallyClosedFindingIds(state)

  for (const [taskId, taskState] of Object.entries(state.taskState ?? {})) {
    if (taskState?.status !== "done" || taskState.validationStatus !== "passed") continue
    const targets = getTaskResolutionTargets(state, taskId)

    for (const alertId of targets.alertIds) resolved.add(alertId)

    for (const findingId of targets.findingIds) {
      for (const alertId of findRelatedAlertIdsForFinding(state.alerts, state, findingId)) {
        resolved.add(alertId)
      }
    }
  }

  for (const findingId of resolvedFindingIds) {
    for (const alertId of findRelatedAlertIdsForFinding(state.alerts, state, findingId)) {
      resolved.add(alertId)
    }
  }

  return resolved
}

export function applyTaskResolutionToAlerts(state: ComplianceState) {
  const resolvedAlertIds = getResolvedAlertIds(state)
  return state.alerts.map((alert) =>
    resolvedAlertIds.has(alert.id) ? { ...alert, open: false } : alert
  )
}
