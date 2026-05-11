import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getPersistableTaskIds } from "@/lib/compliance/task-ids"
import type {
  ComplianceState,
  DeletedTaskEvidenceAttachment,
  TaskEvidenceAttachment,
} from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { eventActorFromSession } from "@/lib/server/event-actor"
import {
  deleteStoredEvidenceFile,
  getStoredEvidenceSignedUrl,
  readStoredEvidenceFile,
} from "@/lib/server/evidence-storage"
import { readFreshStateForOrg, mutateStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { deleteEvidenceObjectFromSupabase } from "@/lib/server/supabase-evidence"
import { loadTaskEvidenceObjectFromSupabase } from "@/lib/server/supabase-evidence-read"

export const runtime = "nodejs"

const EVIDENCE_RESTORE_WINDOW_DAYS = 30

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "vizualizarea dovezilor de remediere"
    )

    const { id, evidenceId } = await context.params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)

    if (!state) {
      return jsonError(
        "Nu am găsit starea organizației pentru acest task.",
        404,
        "ORG_STATE_NOT_FOUND"
      )
    }

    const taskStateKey = resolveTaskStateKey(state, id)
    if (!isKnownTaskId(state, id, taskStateKey)) {
      return jsonError("Task-ul nu mai există în starea curentă.", 404, "TASK_NOT_FOUND")
    }

    const taskState = taskStateKey ? state.taskState[taskStateKey] : undefined
    const stateEvidence = taskState?.attachedEvidenceMeta
    const deletedEvidence = taskState?.deletedEvidenceMeta

    if (deletedEvidence?.id === evidenceId) {
      return jsonError(
        "Dovada a fost ștearsă controlat și poate fi restaurată doar în fereastra de restore.",
        410,
        "EVIDENCE_SOFT_DELETED"
      )
    }

    const cloudEvidence = await loadTaskEvidenceObjectFromSupabase({
      orgId: session.orgId,
      taskId: taskStateKey ?? id,
      attachmentId: evidenceId,
    })
    const evidence =
      stateEvidence?.id === evidenceId
        ? cloudEvidence
          ? {
              ...stateEvidence,
              ...cloudEvidence,
              accessPath: cloudEvidence.accessPath ?? stateEvidence.accessPath,
              publicPath: cloudEvidence.publicPath ?? stateEvidence.publicPath,
            }
          : stateEvidence
        : cloudEvidence

    if (!evidence) {
      return jsonError("Dovada cerută nu mai există pentru acest task.", 404, "EVIDENCE_NOT_FOUND")
    }

    const url = new URL(request.url)
    const delivery = url.searchParams.get("delivery")
    const shouldDownload = url.searchParams.get("download") === "1"

    if (delivery === "redirect") {
      const signedUrl = await getStoredEvidenceSignedUrl(evidence, { orgId: session.orgId })
      if (signedUrl) {
        return NextResponse.redirect(signedUrl, {
          status: 307,
          headers: {
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
          },
        })
      }
    }

    const { buffer } = await readStoredEvidenceFile(evidence, { orgId: session.orgId })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": evidence.mimeType || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${sanitizeHeaderValue(
          evidence.fileName
        )}"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "EVIDENCE_STORAGE_UNAVAILABLE") {
      return jsonError(
        "Dovada există în stare, dar nu mai poate fi citită din storage.",
        410,
        "EVIDENCE_STORAGE_UNAVAILABLE"
      )
    }

    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return jsonError("Fișierul de dovadă nu mai există în storage.", 404, "EVIDENCE_FILE_MISSING")
    }

    return jsonError(
      error instanceof Error ? error.message : "Dovada nu a putut fi deschisă.",
      500,
      "EVIDENCE_READ_FAILED"
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "restaurarea dovezilor de remediere"
    )
    const actor = eventActorFromSession(session)
    const { id, evidenceId } = await context.params
    const body = await readJsonBody(request)

    if (body.action !== "restore") {
      return jsonError("Acțiune invalidă pentru dovadă.", 400, "EVIDENCE_ACTION_INVALID")
    }

    const nowISO = new Date().toISOString()
    const nextState = await mutateStateForOrg(session.orgId, (current) => {
      const taskStateKey = resolveTaskStateKey(current, id)
      if (!isKnownTaskId(current, id, taskStateKey)) {
        throw new Error("TASK_NOT_FOUND")
      }

      const previous =
        current.taskState[taskStateKey ?? id] ?? {
          status: "todo" as const,
          updatedAtISO: nowISO,
        }
      const deletedEvidence = previous.deletedEvidenceMeta

      if (!deletedEvidence || deletedEvidence.id !== evidenceId) {
        throw new Error("EVIDENCE_NOT_FOUND")
      }

      if (Date.parse(deletedEvidence.restoreUntilISO) < Date.now()) {
        throw new Error("EVIDENCE_RESTORE_WINDOW_EXPIRED")
      }

      const restoredEvidence = stripDeletionMetadata(deletedEvidence)

      return {
        ...current,
        taskState: {
          ...current.taskState,
          [taskStateKey ?? id]: {
            ...previous,
            status: "todo" as const,
            attachedEvidence: restoredEvidence.fileName,
            attachedEvidenceMeta: restoredEvidence,
            deletedEvidence: undefined,
            deletedEvidenceMeta: undefined,
            updatedAtISO: nowISO,
            validationStatus: "needs_review" as const,
            validationMessage:
              "Dovada a fost restaurată din fereastra de recovery; revalidează task-ul înainte de audit_ready.",
            validationConfidence: "medium" as const,
            validationBasis: "operational_state" as const,
            validatedAtISO: undefined,
          },
        },
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "task.evidence-restored",
            entityType: "task",
            entityId: id,
            message: `Dovada ${restoredEvidence.fileName} a fost restaurată pentru ${id}.`,
            createdAtISO: nowISO,
            metadata: {
              evidenceId,
              fileName: restoredEvidence.fileName,
              deletedAtISO: deletedEvidence.deletedAtISO,
              restoreUntilISO: deletedEvidence.restoreUntilISO,
            },
          }, actor),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, await buildWorkspace(request, session))),
      message: "Dovada a fost restaurată.",
      evidenceDeletion: {
        status: "restored",
        evidenceId,
        restoredAtISO: nowISO,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return handleEvidenceMutationError(error, "EVIDENCE_RESTORE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; evidenceId: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "ștergerea controlată a dovezilor de remediere"
    )
    const actor = eventActorFromSession(session)
    const { id, evidenceId } = await context.params
    const body = await readJsonBody(request)
    const reason = normalizeReason(body.reason)
    const url = new URL(request.url)
    const permanent = url.searchParams.get("permanent") === "1" || body.action === "permanent_delete"

    if (!reason) {
      return jsonError(
        "Ștergerea dovezii cere un motiv de minim 8 caractere.",
        400,
        "EVIDENCE_DELETE_REASON_REQUIRED"
      )
    }

    if (permanent) {
      if (session.role !== "owner") {
        return jsonError(
          "Ștergerea definitivă a dovezilor este permisă doar owner-ului.",
          403,
          "EVIDENCE_PERMANENT_DELETE_OWNER_ONLY"
        )
      }

      const currentState = await readFreshStateForOrg(session.orgId, session.orgName)
      const taskStateKey = currentState ? resolveTaskStateKey(currentState, id) : null
      const deletedEvidence = taskStateKey
        ? currentState?.taskState[taskStateKey]?.deletedEvidenceMeta
        : undefined
      if (!currentState || !isKnownTaskId(currentState, id, taskStateKey)) {
        return jsonError("Task-ul nu mai există în starea curentă.", 404, "TASK_NOT_FOUND")
      }
      if (!deletedEvidence || deletedEvidence.id !== evidenceId) {
        return jsonError(
          "Dovada trebuie ștearsă soft înainte de ștergerea definitivă.",
          404,
          "EVIDENCE_NOT_FOUND"
        )
      }

      await deleteStoredEvidenceFile(deletedEvidence, { orgId: session.orgId })
      await deleteEvidenceObjectFromSupabase({
        orgId: session.orgId,
        taskId: taskStateKey ?? id,
        attachmentId: evidenceId,
      })

      const nowISO = new Date().toISOString()
      const nextState = await mutateStateForOrg(session.orgId, (current) => {
        const taskStateKey = resolveTaskStateKey(current, id)
        const previous =
          current.taskState[taskStateKey ?? id] ?? {
            status: "todo" as const,
            updatedAtISO: nowISO,
          }

        if (!previous.deletedEvidenceMeta || previous.deletedEvidenceMeta.id !== evidenceId) {
          throw new Error("EVIDENCE_NOT_FOUND")
        }

        return {
          ...current,
          taskState: {
            ...current.taskState,
            [taskStateKey ?? id]: {
              ...previous,
              deletedEvidence: undefined,
              deletedEvidenceMeta: undefined,
              updatedAtISO: nowISO,
            },
          },
          events: appendComplianceEvents(current, [
            createComplianceEvent({
              type: "task.evidence-permanently-deleted",
              entityType: "task",
              entityId: id,
              message: `Dovada ${deletedEvidence.fileName} a fost ștearsă definitiv pentru ${id}.`,
              createdAtISO: nowISO,
              metadata: {
                evidenceId,
                fileName: deletedEvidence.fileName,
                reason,
                priorDeletedAtISO: deletedEvidence.deletedAtISO,
              },
            }, actor),
          ]),
        }
      }, session.orgName)

      return NextResponse.json({
        ...(await buildDashboardPayload(nextState, await buildWorkspace(request, session))),
        message: "Dovada a fost ștearsă definitiv.",
        evidenceDeletion: {
          status: "permanently_deleted",
          evidenceId,
          deletedAtISO: nowISO,
        },
      })
    }

    const nowISO = new Date().toISOString()
    const restoreUntilISO = new Date(
      Date.now() + EVIDENCE_RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()

    const nextState = await mutateStateForOrg(session.orgId, (current) => {
      const taskStateKey = resolveTaskStateKey(current, id)
      if (!isKnownTaskId(current, id, taskStateKey)) {
        throw new Error("TASK_NOT_FOUND")
      }

      const previous =
        current.taskState[taskStateKey ?? id] ?? {
          status: "todo" as const,
          updatedAtISO: nowISO,
        }
      const currentEvidence = previous.attachedEvidenceMeta

      if (!currentEvidence || currentEvidence.id !== evidenceId) {
        throw new Error("EVIDENCE_NOT_FOUND")
      }

      const deletedEvidence: DeletedTaskEvidenceAttachment = {
        ...currentEvidence,
        deletionStatus: "soft_deleted",
        deletedAtISO: nowISO,
        deletedByUserId: session.userId,
        deletedByEmail: session.email,
        deletedByRole: session.role,
        deleteReason: reason,
        restoreUntilISO,
      }

      return {
        ...current,
        taskState: {
          ...current.taskState,
          [taskStateKey ?? id]: {
            ...previous,
            status: "todo" as const,
            attachedEvidence: undefined,
            attachedEvidenceMeta: undefined,
            deletedEvidence: currentEvidence.fileName,
            deletedEvidenceMeta: deletedEvidence,
            updatedAtISO: nowISO,
            validationStatus: "needs_review" as const,
            validationMessage:
              "Dovada a fost ștearsă soft. Atașează o dovadă nouă sau restaurează dovada în fereastra de recovery.",
            validationConfidence: "medium" as const,
            validationBasis: "operational_state" as const,
            validatedAtISO: undefined,
          },
        },
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "task.evidence-soft-deleted",
            entityType: "task",
            entityId: id,
            message: `Dovada ${currentEvidence.fileName} a fost ștearsă soft pentru ${id}.`,
            createdAtISO: nowISO,
            metadata: {
              evidenceId,
              fileName: currentEvidence.fileName,
              reason,
              restoreUntilISO,
            },
          }, actor),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, await buildWorkspace(request, session))),
      message: "Dovada a fost ștearsă soft.",
      evidenceDeletion: {
        status: "soft_deleted",
        evidenceId,
        deletedAtISO: nowISO,
        restoreUntilISO,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return handleEvidenceMutationError(error, "EVIDENCE_DELETE_FAILED")
  }
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n"]/g, "").trim() || "evidence.bin"
}

async function buildWorkspace(
  request: Request,
  session: Awaited<ReturnType<typeof requireFreshRole>>
) {
  return {
    ...(await getOrgContext({ request })),
    orgId: session.orgId,
    orgName: session.orgName,
    workspaceOwner: session.email,
    userRole: session.role,
  }
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as {
      action?: string
      reason?: string
    }
  } catch {
    return {}
  }
}

function normalizeReason(value: unknown) {
  if (typeof value !== "string") return null
  const reason = value.trim().replace(/\s+/g, " ")
  return reason.length >= 8 ? reason.slice(0, 500) : null
}

function resolveTaskStateKey(state: ComplianceState, taskId: string) {
  if (state.taskState[taskId]) return taskId

  if (taskId.startsWith("finding-")) {
    const legacyFindingId = taskId.replace(/^finding-/, "")
    if (state.taskState[legacyFindingId]) return legacyFindingId
  }

  return null
}

function isKnownTaskId(state: ComplianceState, taskId: string, taskStateKey: string | null) {
  return Boolean(taskStateKey) || getPersistableTaskIds(state).has(taskId)
}

function stripDeletionMetadata(evidence: DeletedTaskEvidenceAttachment): TaskEvidenceAttachment {
  return {
    id: evidence.id,
    fileName: evidence.fileName,
    mimeType: evidence.mimeType,
    sizeBytes: evidence.sizeBytes,
    uploadedAtISO: evidence.uploadedAtISO,
    kind: evidence.kind,
    storageProvider: evidence.storageProvider,
    storageKey: evidence.storageKey,
    accessPath: evidence.accessPath,
    publicPath: evidence.publicPath,
    quality: evidence.quality,
  }
}

function handleEvidenceMutationError(error: unknown, fallbackCode: string) {
  if (error instanceof Error) {
    if (error.message === "TASK_NOT_FOUND") {
      return jsonError("Task-ul nu mai există în starea curentă.", 404, "TASK_NOT_FOUND")
    }
    if (error.message === "EVIDENCE_NOT_FOUND") {
      return jsonError("Dovada nu există pentru acest task.", 404, "EVIDENCE_NOT_FOUND")
    }
    if (error.message === "EVIDENCE_RESTORE_WINDOW_EXPIRED") {
      return jsonError(
        "Fereastra de restaurare pentru această dovadă a expirat.",
        410,
        "EVIDENCE_RESTORE_WINDOW_EXPIRED"
      )
    }
    return jsonError(error.message, 500, fallbackCode)
  }

  return jsonError("Operația pe dovadă nu a putut fi finalizată.", 500, fallbackCode)
}
