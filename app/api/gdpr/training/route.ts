import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceEvent, GdprTrainingAudience, GdprTrainingRecord } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateFreshStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

const AUDIENCES: GdprTrainingAudience[] = ["all_staff", "management", "new_hires", "specific_roles"]
const STATUSES: GdprTrainingRecord["status"][] = ["planned", "completed", "evidence_required"]

function normalizeAudience(value: unknown): GdprTrainingAudience {
  return AUDIENCES.includes(value as GdprTrainingAudience)
    ? (value as GdprTrainingAudience)
    : "all_staff"
}

function normalizeParticipantCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? "0"), 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.round(n), 100000)
}

function normalizeParticipantNames(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|[,;]+/)
      : []
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 1000)
}

function inferParticipantNamesFromEvidence(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return []
  const normalized = value
    .replace(/\r/g, "\n")
    .replace(/[•*]/g, "\n")
    .replace(/\bși\b/gi, ",")

  const focused =
    normalized.match(/(?:participan(?:ți|ti)|cursan(?:ți|ti)|angaja(?:ți|ti)|prezen(?:ți|ti))\s*[:=\-–]\s*([\s\S]+)/i)?.[1] ??
    normalized

  return focused
    .replace(/\.\s+(?:confirmare|dovad[ăa]|certificat|training|semnat|lista)\b[\s\S]*$/i, "")
    .split(/\n|[,;]+/)
    .map((item) => item.trim())
    .map((item) => item.replace(/^(?:participan(?:ți|ti)|cursan(?:ți|ti)|angaja(?:ți|ti))\s*[:=\-–]\s*/i, "").trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !/^\d+$/.test(item))
    .filter((item) => !/^(data|dovad[ăa]|training|certificat|confirmare)\b/i.test(item))
    .slice(0, 1000)
}

function isIsoLike(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function summarize(records: GdprTrainingRecord[]) {
  const completed = records.filter((record) => record.status === "completed").length
  const open = records.length - completed
  const evidenceRequired = records.filter((record) => record.status === "evidence_required").length
  return {
    total: records.length,
    completed,
    open,
    evidenceRequired,
    participantsCovered: records
      .filter((record) => record.status === "completed")
      .reduce((sum, record) => sum + record.participantCount, 0),
  }
}

function eventActor(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  return {
    id: session.email,
    label: session.email,
    role: session.role as ComplianceEvent["actorRole"],
    source: "session" as const,
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea trainingului GDPR")
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    const records = state?.gdprTrainingRecords ?? []
    return NextResponse.json({ records, summary: summarize(records) })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut citi trainingul GDPR.", 500, "GDPR_TRAINING_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea trainingului GDPR")
    const body = (await request.json()) as Partial<GdprTrainingRecord>
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return jsonError("Titlul trainingului este obligatoriu.", 400, "MISSING_TITLE")

    const nowISO = new Date().toISOString()
    const evidenceNote = typeof body.evidenceNote === "string" ? body.evidenceNote.trim() : undefined
    const explicitParticipantNames = normalizeParticipantNames(body.participantNames)
    const inferredParticipantNames =
      explicitParticipantNames.length > 0 ? [] : inferParticipantNamesFromEvidence(evidenceNote)
    const participantNames = explicitParticipantNames.length > 0 ? explicitParticipantNames : inferredParticipantNames
    const explicitParticipantCount = normalizeParticipantCount(body.participantCount)
    const record: GdprTrainingRecord = {
      id: `gdpr-training-${crypto.randomUUID()}`,
      title,
      audience: normalizeAudience(body.audience),
      participantCount: explicitParticipantCount > 0 ? explicitParticipantCount : participantNames.length,
      participantNames,
      status: body.status === "completed" ? "completed" : body.status === "evidence_required" ? "evidence_required" : "planned",
      dueAtISO: isIsoLike(body.dueAtISO) ? body.dueAtISO : undefined,
      completedAtISO: isIsoLike(body.completedAtISO) ? body.completedAtISO : undefined,
      evidenceNote,
      evidenceFileName: typeof body.evidenceFileName === "string" ? body.evidenceFileName.trim() || undefined : undefined,
      evidenceFileType: typeof body.evidenceFileType === "string" ? body.evidenceFileType.trim() || undefined : undefined,
      evidenceFileSizeBytes: normalizeParticipantCount(body.evidenceFileSizeBytes),
      certificateTitle: typeof body.certificateTitle === "string" ? body.certificateTitle.trim() || undefined : undefined,
      evidenceValidatedAtISO:
        body.status === "completed" && (body.evidenceNote || body.evidenceFileName)
          ? nowISO
          : undefined,
      evidenceValidatedBy:
        body.status === "completed" && (body.evidenceNote || body.evidenceFileName)
          ? session.email
          : undefined,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    }

    const next = await mutateFreshStateForOrg(
      session.orgId,
      (state) => ({
        ...state,
        gdprTrainingRecords: [record, ...(state.gdprTrainingRecords ?? [])],
        events: appendComplianceEvents(state, [
          createComplianceEvent(
            {
              type: "gdpr.training.created",
              entityType: "system",
              entityId: record.id,
              message: `Training GDPR înregistrat: ${record.title} · ${record.participantCount} participanți`,
              createdAtISO: nowISO,
              metadata: {
                status: record.status,
                audience: record.audience,
                participantCount: record.participantCount,
              },
            },
            eventActor(session)
          ),
        ]),
      }),
      session.orgName
    )

    return NextResponse.json(
      { record, summary: summarize(next.gdprTrainingRecords ?? []) },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea trainingul GDPR.", 500, "GDPR_TRAINING_CREATE_FAILED")
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea trainingului GDPR")
    const body = (await request.json()) as Partial<GdprTrainingRecord> & { id?: string }
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return jsonError("ID training lipsă.", 400, "MISSING_ID")

    let updated: GdprTrainingRecord | null = null
    const next = await mutateFreshStateForOrg(
      session.orgId,
      (state) => {
        const records = state.gdprTrainingRecords ?? []
        const idx = records.findIndex((record) => record.id === id)
        if (idx === -1) return state

        const current = records[idx]
        const status = STATUSES.includes(body.status as GdprTrainingRecord["status"])
          ? (body.status as GdprTrainingRecord["status"])
          : current.status
        const nowISO = new Date().toISOString()
        const nextEvidenceNote =
          typeof body.evidenceNote === "string"
            ? body.evidenceNote.trim()
            : body.evidenceNote === null
              ? undefined
              : current.evidenceNote
        const explicitParticipantNames =
          body.participantNames === undefined ? undefined : normalizeParticipantNames(body.participantNames)
        const inferredParticipantNames =
          explicitParticipantNames === undefined && (!current.participantNames || current.participantNames.length === 0)
            ? inferParticipantNamesFromEvidence(nextEvidenceNote)
            : []
        const nextParticipantNames: string[] =
          explicitParticipantNames === undefined
            ? inferredParticipantNames.length > 0
              ? inferredParticipantNames
              : current.participantNames ?? []
            : explicitParticipantNames
        const nextParticipantCount =
          body.participantCount === undefined
            ? current.participantCount > 0
              ? current.participantCount
              : nextParticipantNames.length
            : normalizeParticipantCount(body.participantCount)
        updated = {
          ...current,
          title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title,
          audience: body.audience ? normalizeAudience(body.audience) : current.audience,
          participantCount: nextParticipantCount,
          participantNames: nextParticipantNames,
          status,
          dueAtISO: body.dueAtISO === null ? undefined : isIsoLike(body.dueAtISO) ? body.dueAtISO : current.dueAtISO,
          completedAtISO:
            status === "completed"
              ? isIsoLike(body.completedAtISO) ? body.completedAtISO : current.completedAtISO ?? nowISO
              : body.completedAtISO === null
                ? undefined
                : current.completedAtISO,
          evidenceNote: nextEvidenceNote,
          evidenceFileName:
            typeof body.evidenceFileName === "string"
              ? body.evidenceFileName.trim()
              : body.evidenceFileName === null
                ? undefined
                : current.evidenceFileName,
          evidenceFileType:
            typeof body.evidenceFileType === "string"
              ? body.evidenceFileType.trim()
              : body.evidenceFileType === null
                ? undefined
                : current.evidenceFileType,
          evidenceFileSizeBytes:
            body.evidenceFileSizeBytes === undefined
              ? current.evidenceFileSizeBytes
              : normalizeParticipantCount(body.evidenceFileSizeBytes),
          certificateTitle:
            typeof body.certificateTitle === "string"
              ? body.certificateTitle.trim()
              : body.certificateTitle === null
                ? undefined
                : current.certificateTitle,
          evidenceValidatedAtISO:
            status === "completed" && (body.evidenceNote || body.evidenceFileName || current.evidenceNote || current.evidenceFileName)
              ? current.evidenceValidatedAtISO ?? nowISO
              : current.evidenceValidatedAtISO,
          evidenceValidatedBy:
            status === "completed" && (body.evidenceNote || body.evidenceFileName || current.evidenceNote || current.evidenceFileName)
              ? current.evidenceValidatedBy ?? session.email
              : current.evidenceValidatedBy,
          updatedAtISO: nowISO,
        }
        const nextRecords = [...records]
        nextRecords[idx] = updated
        return {
          ...state,
          gdprTrainingRecords: nextRecords,
          events: appendComplianceEvents(state, [
            createComplianceEvent(
              {
                type: "gdpr.training.updated",
                entityType: "system",
                entityId: updated.id,
                message: `Training GDPR actualizat: ${updated.title} · ${updated.status}`,
                createdAtISO: nowISO,
                metadata: {
                  status: updated.status,
                  participantCount: updated.participantCount,
                  evidenceAttached: Boolean(updated.evidenceNote || updated.evidenceFileName),
                },
              },
              eventActor(session)
            ),
          ]),
        }
      },
      session.orgName
    )

    if (!updated) return jsonError("Trainingul nu a fost găsit.", 404, "NOT_FOUND")
    return NextResponse.json({ record: updated, summary: summarize(next.gdprTrainingRecords ?? []) })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza trainingul GDPR.", 500, "GDPR_TRAINING_UPDATE_FAILED")
  }
}
