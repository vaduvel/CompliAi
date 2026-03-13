import type { ComplianceEvent, ComplianceState } from "@/lib/compliance/types"

export function createComplianceEvent(
  input: Omit<ComplianceEvent, "id">
): ComplianceEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    ...input,
  }
}

export function appendComplianceEvents(
  state: ComplianceState,
  events: ComplianceEvent[]
) {
  if (events.length === 0) return state.events ?? []
  return [...events, ...(state.events ?? [])].slice(0, 200)
}
