import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceDriftLifecycleStatus } from "@/lib/compliance/types"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

type DriftAction = "acknowledge" | "start" | "resolve" | "waive" | "reopen"

type DriftPatchPayload = {
  action?: DriftAction
  note?: string | null
}

function isDriftAction(value: unknown): value is DriftAction {
  return (
    value === "acknowledge" ||
    value === "start" ||
    value === "resolve" ||
    value === "waive" ||
    value === "reopen"
  )
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = (await request.json()) as DriftPatchPayload

  if (!isDriftAction(body.action)) {
    return NextResponse.json({ error: "Actiune de drift invalida." }, { status: 400 })
  }
  const action = body.action

  const actor = (await getOrgContext()).workspaceOwner || "owner neidentificat"
  const nowISO = new Date().toISOString()

  try {
    const nextState = await mutateState((current) => {
      const drift = current.driftRecords.find((item) => item.id === id)
      if (!drift) throw new Error("DRIFT_NOT_FOUND")

      const nextLifecycle = nextDriftLifecycleStatus(action)
      const note = typeof body.note === "string" ? body.note.trim() || null : null

      const driftRecords = current.driftRecords.map((item) => {
        if (item.id !== id) return item

        return {
          ...item,
          lifecycleStatus: nextLifecycle,
          open: nextLifecycle === "resolved" || nextLifecycle === "waived" ? false : true,
          acknowledgedAtISO:
            action === "acknowledge" || action === "start"
              ? item.acknowledgedAtISO ?? nowISO
              : item.acknowledgedAtISO,
          acknowledgedBy:
            action === "acknowledge" || action === "start"
              ? item.acknowledgedBy ?? actor
              : item.acknowledgedBy,
          inProgressAtISO:
            action === "start" ? nowISO : action === "reopen" ? undefined : item.inProgressAtISO,
          resolvedAtISO:
            action === "resolve" ? nowISO : action === "reopen" ? undefined : item.resolvedAtISO,
          waivedAtISO:
            action === "waive" ? nowISO : action === "reopen" ? undefined : item.waivedAtISO,
          waivedReason:
            action === "waive"
              ? note ?? item.waivedReason ?? "Waived prin review operațional."
              : action === "reopen"
                ? undefined
                : item.waivedReason,
          lastStatusUpdatedAtISO: nowISO,
        }
      })

      return {
        ...current,
        driftRecords,
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: `drift.${action}`,
            entityType: "drift",
            entityId: id,
            message: buildDriftActionMessage(action, drift.summary, actor, note),
            createdAtISO: nowISO,
            metadata: {
              lifecycleStatus: nextLifecycle,
              actor,
              note: note || "",
            },
          }),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: buildActionToast(action),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "DRIFT_NOT_FOUND") {
      return NextResponse.json({ error: "Drift-ul nu exista." }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eroare la actualizarea drift-ului." },
      { status: 400 }
    )
  }
}

function nextDriftLifecycleStatus(action: DriftAction): ComplianceDriftLifecycleStatus {
  if (action === "acknowledge") return "acknowledged"
  if (action === "start") return "in_progress"
  if (action === "resolve") return "resolved"
  if (action === "waive") return "waived"
  return "open"
}

function buildActionToast(action: DriftAction) {
  if (action === "acknowledge") return "Drift preluat de owner."
  if (action === "start") return "Drift trecut în lucru."
  if (action === "resolve") return "Drift marcat ca rezolvat."
  if (action === "waive") return "Drift waived cu justificare."
  return "Drift redeschis."
}

function buildDriftActionMessage(
  action: DriftAction,
  summary: string,
  actor: string,
  note: string | null
) {
  if (action === "acknowledge") {
    return `${actor} a preluat drift-ul: ${summary}.`
  }
  if (action === "start") {
    return `${actor} a trecut în lucru drift-ul: ${summary}.`
  }
  if (action === "resolve") {
    return `${actor} a marcat drift-ul ca rezolvat: ${summary}.`
  }
  if (action === "waive") {
    return `${actor} a marcat drift-ul ca waived: ${summary}.${note ? ` Motiv: ${note}` : ""}`
  }
  return `${actor} a redeschis drift-ul: ${summary}.`
}
