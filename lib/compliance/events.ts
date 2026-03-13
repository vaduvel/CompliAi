import type { ComplianceEvent, ComplianceState } from "@/lib/compliance/types"

export type ComplianceEventActorInput = {
  id: string
  label: string
  role?: ComplianceEvent["actorRole"]
  source: NonNullable<ComplianceEvent["actorSource"]>
}

export function createComplianceEvent(
  input: Omit<ComplianceEvent, "id">,
  actor?: ComplianceEventActorInput
): ComplianceEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 10)}`,
    ...input,
    ...(actor
      ? {
          actorId: actor.id,
          actorLabel: actor.label,
          actorRole: actor.role,
          actorSource: actor.source,
        }
      : {}),
  }
}

export function appendComplianceEvents(
  state: ComplianceState,
  events: ComplianceEvent[]
) {
  if (events.length === 0) return state.events ?? []
  return [...events, ...(state.events ?? [])].slice(0, 200)
}
