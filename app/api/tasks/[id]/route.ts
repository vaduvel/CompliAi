import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { PersistedTaskStatus } from "@/lib/compliance/types"
import { getPersistableTaskIds } from "@/lib/compliance/task-ids"
import { getTaskResolutionTargets } from "@/lib/compliance/task-resolution"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { trackEvent } from "@/lib/server/analytics"
import { validateTaskAgainstState } from "@/lib/compliance/task-validation"

type TaskPatchPayload = {
  status?: PersistedTaskStatus
  attachedEvidence?: string | null
  action?: "validate" | "mark_done_and_validate"
}

type TaskUpdateFeedback = {
  status: PersistedTaskStatus
  closedAlerts: number
  reopenedAlerts: number
  closedDrifts: number
  reopenedDrifts: number
  previousScore: number
  nextScore: number
  scoreDelta: number
  validationStatus?: "idle" | "passed" | "failed" | "needs_review"
  validationMessage?: string
  validationConfidence?: "high" | "medium" | "low"
  validationBasis?: "direct_signal" | "inferred_signal" | "operational_state"
}

function isPersistedTaskStatus(value: unknown): value is PersistedTaskStatus {
  return value === "todo" || value === "done"
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as TaskPatchPayload
    const hasStatus = typeof body.status !== "undefined"
    const hasEvidence = Object.prototype.hasOwnProperty.call(body, "attachedEvidence")
    const hasAction = typeof body.action !== "undefined"
    let feedback: TaskUpdateFeedback | undefined

    const session = requireRole(
      request,
      ["owner", "compliance", "reviewer"],
      "actualizarea task-urilor de remediere"
    )
    const actor = eventActorFromSession(session)

    if (!hasStatus && !hasEvidence && !hasAction) {
      return jsonError("Trimite status, attachedEvidence si/sau action.", 400, "TASK_PATCH_EMPTY")
    }

    if (hasStatus && !isPersistedTaskStatus(body.status)) {
      return jsonError("Status invalid.", 400, "TASK_STATUS_INVALID")
    }

    if (hasAction && body.action !== "validate" && body.action !== "mark_done_and_validate") {
      return jsonError("Actiune invalida.", 400, "TASK_ACTION_INVALID")
    }

    const nextState = await mutateState((current) => {
      if (!getPersistableTaskIds(current).has(id)) {
        throw new Error("TASK_NOT_FOUND")
      }

      const nowISO = new Date().toISOString()
      const previous =
        current.taskState[id] ?? {
          status: "todo" as const,
          updatedAtISO: nowISO,
        }

      const attachedEvidence = hasEvidence
        ? body.attachedEvidence?.trim() || undefined
        : previous.attachedEvidence
      const attachedEvidenceMeta = hasEvidence
        ? attachedEvidence && attachedEvidence === previous.attachedEvidence
          ? previous.attachedEvidenceMeta
          : undefined
        : previous.attachedEvidenceMeta
      let nextStatus = hasStatus ? body.status ?? previous.status : previous.status
      const previousSummary = computeDashboardSummary(normalizeComplianceState(current))
      const resolutionTargets = getTaskResolutionTargets(current, id)
      let validationStatus = previous.validationStatus ?? "idle"
      let validationMessage = previous.validationMessage
      let validationConfidence = previous.validationConfidence
      let validationBasis = previous.validationBasis
      let validatedAtISO = previous.validatedAtISO
      let lastRescanAtISO = previous.lastRescanAtISO
      let checkedSource = ""
      const shouldValidate =
        body.action === "validate" || body.action === "mark_done_and_validate"

      if (shouldValidate) {
        const validation = validateTaskAgainstState(current, id, attachedEvidence)
        validationStatus = validation.status
        validationMessage = validation.message
        validationConfidence = validation.confidence
        validationBasis = validation.basis
        validatedAtISO = nowISO
        lastRescanAtISO = nowISO
        checkedSource = validation.checkedSource || ""
        nextStatus =
          body.action === "mark_done_and_validate" ? validation.nextStatus : previous.status
      } else if (hasStatus && nextStatus === "todo") {
        validationStatus = "idle"
        validationMessage = undefined
        validationConfidence = undefined
        validationBasis = undefined
        validatedAtISO = undefined
      }

      const autoResolvedAlertIds =
        nextStatus === "done" ? new Set(resolutionTargets.alertIds) : new Set<string>()
      const reopenedAlertIds =
        nextStatus === "todo" && hasStatus ? new Set(resolutionTargets.alertIds) : new Set<string>()
      const autoResolvedDriftIds =
        nextStatus === "done" ? new Set(resolutionTargets.driftIds) : new Set<string>()
      const reopenedDriftIds =
        nextStatus === "todo" && hasStatus ? new Set(resolutionTargets.driftIds) : new Set<string>()
      const closedAlerts = current.alerts.filter(
        (alert) => autoResolvedAlertIds.has(alert.id) && alert.open
      ).length
      const reopenedAlerts = current.alerts.filter(
        (alert) => reopenedAlertIds.has(alert.id) && !alert.open
      ).length
      const closedDrifts = current.driftRecords.filter(
        (drift) => autoResolvedDriftIds.has(drift.id) && drift.open
      ).length
      const reopenedDrifts = current.driftRecords.filter(
        (drift) => reopenedDriftIds.has(drift.id) && !drift.open
      ).length

      const alerts = current.alerts.map((alert) => {
        if (autoResolvedAlertIds.has(alert.id)) return { ...alert, open: false }
        if (reopenedAlertIds.has(alert.id)) return { ...alert, open: true }
        return alert
      })
      const driftRecords = current.driftRecords.map((drift) => {
        if (autoResolvedDriftIds.has(drift.id)) {
          return {
            ...drift,
            open: false,
            lifecycleStatus: "resolved" as const,
            resolvedAtISO: nowISO,
            lastStatusUpdatedAtISO: nowISO,
          }
        }
        if (reopenedDriftIds.has(drift.id)) {
          return {
            ...drift,
            open: true,
            lifecycleStatus: "open" as const,
            resolvedAtISO: undefined,
            waivedAtISO: undefined,
            waivedReason: undefined,
            lastStatusUpdatedAtISO: nowISO,
          }
        }
        return drift
      })

      const alertEvents = [
        ...Array.from(autoResolvedAlertIds).map((alertId) =>
          createComplianceEvent({
            type: "alert.auto-resolved",
            entityType: "alert",
            entityId: alertId,
            message: `Alerta a fost închisă automat după finalizarea task-ului ${id}.`,
            createdAtISO: nowISO,
          }, actor)
        ),
        ...Array.from(reopenedAlertIds).map((alertId) =>
          createComplianceEvent({
            type: "alert.reopened",
            entityType: "alert",
            entityId: alertId,
            message: `Alerta a fost redeschisă după revenirea task-ului ${id} la todo.`,
            createdAtISO: nowISO,
          }, actor)
        ),
      ]
      const driftEvents = [
        ...Array.from(autoResolvedDriftIds).map((driftId) =>
          createComplianceEvent({
            type: "drift.auto-resolved",
            entityType: "drift",
            entityId: driftId,
            message: `Drift-ul a fost închis automat după finalizarea task-ului ${id}.`,
            createdAtISO: nowISO,
          }, actor)
        ),
        ...Array.from(reopenedDriftIds).map((driftId) =>
          createComplianceEvent({
            type: "drift.reopened",
            entityType: "drift",
            entityId: driftId,
            message: `Drift-ul a fost redeschis după revenirea task-ului ${id} la todo.`,
            createdAtISO: nowISO,
          }, actor)
        ),
      ]

      const nextState = {
        ...current,
        alerts,
        driftRecords,
        taskState: {
          ...current.taskState,
          [id]: {
            status: nextStatus,
            attachedEvidence,
            attachedEvidenceMeta,
            updatedAtISO: nowISO,
            validationStatus,
            validationMessage,
            validationConfidence,
            validationBasis,
            validatedAtISO,
            lastRescanAtISO,
          },
        },
        events: appendComplianceEvents(current, [
          ...(hasEvidence && attachedEvidence !== previous.attachedEvidence
            ? [
                createComplianceEvent({
                  type: "task.evidence-attached",
                  entityType: "task",
                  entityId: id,
                  message: `Dovada a fost actualizată pentru ${id}.`,
                  createdAtISO: nowISO,
                  metadata: {
                    status: nextStatus,
                    fileName: attachedEvidence || "unknown",
                  },
                }, actor),
              ]
            : []),
          createComplianceEvent({
            type: shouldValidate ? "task.validated" : "task.updated",
            entityType: "task",
            entityId: id,
            message: shouldValidate
              ? `Task verificat prin rescan: ${id} · ${validationStatus}.`
              : `Task actualizat: ${id}.`,
            createdAtISO: nowISO,
            metadata: {
              status: nextStatus,
              hasEvidence: Boolean(attachedEvidence),
              autoResolvedAlerts: autoResolvedAlertIds.size,
              autoResolvedDrifts: autoResolvedDriftIds.size,
              validationStatus,
              validationMessage: validationMessage || "",
              validationConfidence: validationConfidence || "",
              validationBasis: validationBasis || "",
              checkedSource,
            },
          }, actor),
          ...alertEvents,
          ...driftEvents,
        ]),
      }

      if (hasStatus || shouldValidate) {
        const nextSummary = computeDashboardSummary(normalizeComplianceState(nextState))
        feedback = {
          status: nextStatus,
          closedAlerts,
          reopenedAlerts,
          closedDrifts,
          reopenedDrifts,
          previousScore: previousSummary.score,
          nextScore: nextSummary.score,
          scoreDelta: nextSummary.score - previousSummary.score,
          validationStatus,
          validationMessage,
          validationConfidence,
          validationBasis,
        }
      }

      return nextState
    })

    // Track finding closure
    if (feedback?.status === "done" && feedback.closedAlerts > 0) {
      void trackEvent(session.orgId, "closed_first_finding", { taskId: id })
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message: "Task actualizat.",
      feedback,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "TASK_NOT_FOUND") {
      return jsonError("Task-ul nu mai exista in starea curenta.", 404, "TASK_NOT_FOUND")
    }

    return jsonError(
      error instanceof Error ? error.message : "Task-ul nu a putut fi actualizat.",
      500,
      "TASK_PATCH_FAILED"
    )
  }
}
