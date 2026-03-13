import type { ComplianceEvent } from "@/lib/compliance/types"
import type { SessionPayload } from "@/lib/server/auth"
import { readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"

export type EventActor = {
  id: string
  label: string
  role?: ComplianceEvent["actorRole"]
  source: NonNullable<ComplianceEvent["actorSource"]>
}

export function eventActorFromSession(session: SessionPayload): EventActor {
  return {
    id: session.userId,
    label: session.email,
    role: session.role,
    source: "session",
  }
}

export async function resolveOptionalEventActor(request: Request): Promise<EventActor> {
  const session = readSessionFromRequest(request)
  if (session) return eventActorFromSession(session)

  const workspace = await getOrgContext()
  return {
    id: `workspace:${workspace.orgId}`,
    label: workspace.workspaceOwner || workspace.orgName,
    source: "workspace",
  }
}

export function systemEventActor(label = "CompliScan system"): EventActor {
  return {
    id: "system:compliscan",
    label,
    source: "system",
  }
}

export function formatEventActorLabel(actor?: Pick<EventActor, "label" | "role"> | null) {
  if (!actor) return ""
  return actor.role ? `${actor.label} (${actor.role})` : actor.label
}
