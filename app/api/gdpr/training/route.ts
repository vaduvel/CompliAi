import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateFreshStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { GdprTrainingAudience, GdprTrainingRecord } from "@/lib/compliance/types"

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
    const record: GdprTrainingRecord = {
      id: `gdpr-training-${crypto.randomUUID()}`,
      title,
      audience: normalizeAudience(body.audience),
      participantCount: normalizeParticipantCount(body.participantCount),
      status: body.status === "completed" ? "completed" : body.status === "evidence_required" ? "evidence_required" : "planned",
      dueAtISO: isIsoLike(body.dueAtISO) ? body.dueAtISO : undefined,
      completedAtISO: isIsoLike(body.completedAtISO) ? body.completedAtISO : undefined,
      evidenceNote: typeof body.evidenceNote === "string" ? body.evidenceNote.trim() : undefined,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    }

    const next = await mutateFreshStateForOrg(
      session.orgId,
      (state) => ({
        ...state,
        gdprTrainingRecords: [record, ...(state.gdprTrainingRecords ?? [])],
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
        updated = {
          ...current,
          title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title,
          audience: body.audience ? normalizeAudience(body.audience) : current.audience,
          participantCount: body.participantCount === undefined ? current.participantCount : normalizeParticipantCount(body.participantCount),
          status,
          dueAtISO: body.dueAtISO === null ? undefined : isIsoLike(body.dueAtISO) ? body.dueAtISO : current.dueAtISO,
          completedAtISO:
            status === "completed"
              ? isIsoLike(body.completedAtISO) ? body.completedAtISO : current.completedAtISO ?? nowISO
              : body.completedAtISO === null
                ? undefined
                : current.completedAtISO,
          evidenceNote:
            typeof body.evidenceNote === "string"
              ? body.evidenceNote.trim()
              : body.evidenceNote === null
                ? undefined
                : current.evidenceNote,
          updatedAtISO: nowISO,
        }
        const nextRecords = [...records]
        nextRecords[idx] = updated
        return { ...state, gdprTrainingRecords: nextRecords }
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
