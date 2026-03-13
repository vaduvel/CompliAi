import type {
  ComplianceDriftLifecycleStatus,
  ComplianceDriftRecord,
} from "@/lib/compliance/types"

export function isDriftLifecycleOpen(status: ComplianceDriftLifecycleStatus) {
  return status === "open" || status === "acknowledged" || status === "in_progress"
}

export function normalizeDriftLifecycleStatus(
  value: unknown,
  fallbackOpen = true
): ComplianceDriftLifecycleStatus {
  if (
    value === "open" ||
    value === "acknowledged" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "waived"
  ) {
    return value
  }

  return fallbackOpen ? "open" : "resolved"
}

export function formatDriftLifecycleStatus(status: ComplianceDriftLifecycleStatus) {
  if (status === "acknowledged") return "preluat"
  if (status === "in_progress") return "în lucru"
  if (status === "resolved") return "rezolvat"
  if (status === "waived") return "waived"
  return "deschis"
}

export function isDriftSlaBreached(
  drift: Pick<
    ComplianceDriftRecord,
    "escalationDueAtISO" | "lifecycleStatus" | "open"
  >,
  nowISO = new Date().toISOString()
) {
  const lifecycle = normalizeDriftLifecycleStatus(
    drift.lifecycleStatus,
    drift.open !== false
  )

  if (!isDriftLifecycleOpen(lifecycle)) return false
  if (!drift.escalationDueAtISO) return false

  return drift.escalationDueAtISO.localeCompare(nowISO) < 0
}
