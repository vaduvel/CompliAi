import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceDriftLifecycleStatus } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { eventActorFromSession, formatEventActorLabel } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { normalizeOptionalNote, RequestValidationError, requirePlainObject } from "@/lib/server/request-validation"

type DriftAction = "acknowledge" | "start" | "resolve" | "waive" | "reopen"

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
  try {
    const { id } = await context.params
    if (!id?.trim()) {
      return jsonError("ID-ul drift-ului este obligatoriu.", 400, "DRIFT_ID_REQUIRED")
    }

    const body = requirePlainObject(await request.json())
    if (!isDriftAction(body.action)) {
      return jsonError("Actiune de drift invalida.", 400, "INVALID_DRIFT_ACTION")
    }

    const action = body.action
    const session = requireRole(
      request,
      action === "waive" ? ["owner", "compliance"] : ["owner", "compliance", "reviewer"],
      action === "waive" ? "waive pe drift" : "actualizarea lifecycle-ului de drift"
    )
    const actor = eventActorFromSession(session)
    const actorLabel = formatEventActorLabel(actor)
    const nowISO = new Date().toISOString()

    const nextState = await mutateState((current) => {
      const drift = current.driftRecords.find((item) => item.id === id)
      if (!drift) throw new Error("DRIFT_NOT_FOUND")

      if (!canApplyDriftAction(drift.lifecycleStatus ?? "open", action)) {
        throw new RequestValidationError(
          `Actiunea ${action} nu este permisa din starea curenta a drift-ului.`,
          409,
          "INVALID_DRIFT_TRANSITION"
        )
      }

      const nextLifecycle = nextDriftLifecycleStatus(action)
      const note = normalizeOptionalNote(body.note, 500)

      if (action === "waive" && !note) {
        throw new RequestValidationError(
          "Pentru waive trebuie sa adaugi o justificare scurta.",
          400,
          "WAIVE_NOTE_REQUIRED"
        )
      }

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
              ? item.acknowledgedBy ?? actorLabel
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
            message: buildDriftActionMessage(action, drift.summary, actorLabel, note),
            createdAtISO: nowISO,
            metadata: {
              lifecycleStatus: nextLifecycle,
              actor: actorLabel,
              note: note || "",
            },
          }, actor),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: buildActionToast(action),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "DRIFT_NOT_FOUND") {
      return jsonError("Drift-ul nu exista.", 404, "DRIFT_NOT_FOUND")
    }

    return jsonError(
      error instanceof Error ? error.message : "Eroare la actualizarea drift-ului.",
      error instanceof RequestValidationError ? error.status : 400,
      error instanceof RequestValidationError ? error.code : "DRIFT_PATCH_FAILED"
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

function canApplyDriftAction(
  currentStatus: ComplianceDriftLifecycleStatus,
  action: DriftAction
) {
  if (currentStatus === "open") {
    return action === "acknowledge" || action === "start" || action === "resolve" || action === "waive"
  }

  if (currentStatus === "acknowledged") {
    return action === "start" || action === "resolve" || action === "waive" || action === "reopen"
  }

  if (currentStatus === "in_progress") {
    return action === "resolve" || action === "waive" || action === "reopen"
  }

  if (currentStatus === "resolved" || currentStatus === "waived") {
    return action === "reopen"
  }

  return false
}
