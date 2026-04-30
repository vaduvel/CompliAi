import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type {
  ComplianceEvent,
  DpiaRecord,
  DpiaRecordStatus,
  DpiaRiskLevel,
} from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateFreshStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { READ_ROLES, WRITE_ROLES } from "@/lib/server/rbac"

const STATUSES: DpiaRecordStatus[] = [
  "draft",
  "in_review",
  "approved",
  "mitigations_in_progress",
  "completed",
  "archived",
]

const RISK_LEVELS: DpiaRiskLevel[] = ["low", "medium", "high", "critical"]

function eventActor(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  return {
    id: session.email,
    label: session.email,
    role: session.role as ComplianceEvent["actorRole"],
    source: "session" as const,
  }
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (typeof value !== "string") return []
  return value
    .split(/\r?\n|[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isIsoLike(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function normalizeStatus(value: unknown, fallback: DpiaRecordStatus): DpiaRecordStatus {
  return STATUSES.includes(value as DpiaRecordStatus) ? (value as DpiaRecordStatus) : fallback
}

function normalizeRisk(value: unknown): DpiaRiskLevel {
  return RISK_LEVELS.includes(value as DpiaRiskLevel) ? (value as DpiaRiskLevel) : "medium"
}

function summarize(records: DpiaRecord[]) {
  const open = records.filter((record) => !["completed", "archived"].includes(record.status)).length
  const approved = records.filter((record) => record.status === "approved" || record.status === "completed").length
  const highResidual = records.filter((record) => record.residualRisk === "high" || record.residualRisk === "critical").length
  const completed = records.filter((record) => record.status === "completed").length
  return {
    total: records.length,
    open,
    approved,
    completed,
    highResidual,
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "citirea DPIA")
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    const records = state?.dpiaRecords ?? []
    return NextResponse.json({ records, summary: summarize(records) })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut citi registrul DPIA.", 500, "DPIA_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea DPIA")
    const body = (await request.json()) as Partial<DpiaRecord>
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return jsonError("Titlul DPIA este obligatoriu.", 400, "MISSING_TITLE")

    const nowISO = new Date().toISOString()
    const record: DpiaRecord = {
      id: `dpia-${crypto.randomUUID()}`,
      title,
      processingPurpose:
        typeof body.processingPurpose === "string" && body.processingPurpose.trim()
          ? body.processingPurpose.trim()
          : "Scop de prelucrare de completat de consultant.",
      processingDescription:
        typeof body.processingDescription === "string" && body.processingDescription.trim()
          ? body.processingDescription.trim()
          : "Descriere operațiune / sistem / flux de date.",
      dataCategories: splitList(body.dataCategories),
      dataSubjects: splitList(body.dataSubjects),
      legalBasis:
        typeof body.legalBasis === "string" && body.legalBasis.trim()
          ? body.legalBasis.trim()
          : "GDPR Art. 6 / Art. 9 — de validat",
      specialCategories: Boolean(body.specialCategories),
      automatedDecisionMaking: Boolean(body.automatedDecisionMaking),
      largeScaleProcessing: Boolean(body.largeScaleProcessing),
      linkedRopaDocumentId:
        typeof body.linkedRopaDocumentId === "string" && body.linkedRopaDocumentId.trim()
          ? body.linkedRopaDocumentId.trim()
          : undefined,
      linkedRopaEntryLabel:
        typeof body.linkedRopaEntryLabel === "string" && body.linkedRopaEntryLabel.trim()
          ? body.linkedRopaEntryLabel.trim()
          : undefined,
      necessityAssessment:
        typeof body.necessityAssessment === "string" && body.necessityAssessment.trim()
          ? body.necessityAssessment.trim()
          : "De completat: de ce este necesară prelucrarea.",
      proportionalityAssessment:
        typeof body.proportionalityAssessment === "string" && body.proportionalityAssessment.trim()
          ? body.proportionalityAssessment.trim()
          : "De completat: de ce volumul/categoriile de date sunt proporționale cu scopul.",
      risks: splitList(body.risks),
      mitigationMeasures: splitList(body.mitigationMeasures),
      residualRisk: normalizeRisk(body.residualRisk),
      status: normalizeStatus(body.status, "draft"),
      owner: typeof body.owner === "string" && body.owner.trim() ? body.owner.trim() : session.email,
      dueAtISO: isIsoLike(body.dueAtISO) ? body.dueAtISO : undefined,
      evidenceNote:
        typeof body.evidenceNote === "string" && body.evidenceNote.trim()
          ? body.evidenceNote.trim()
          : undefined,
      evidenceFileName:
        typeof body.evidenceFileName === "string" && body.evidenceFileName.trim()
          ? body.evidenceFileName.trim()
          : undefined,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    }

    const next = await mutateFreshStateForOrg(
      session.orgId,
      (state) => ({
        ...state,
        dpiaRecords: [record, ...(state.dpiaRecords ?? [])].slice(0, 100),
        events: appendComplianceEvents(state, [
          createComplianceEvent(
            {
              type: "gdpr.dpia.created",
              entityType: "system",
              entityId: record.id,
              message: `DPIA creată: ${record.title} · risc rezidual ${record.residualRisk}`,
              createdAtISO: nowISO,
              metadata: {
                status: record.status,
                residualRisk: record.residualRisk,
                specialCategories: record.specialCategories,
              },
            },
            eventActor(session)
          ),
        ]),
      }),
      session.orgName
    )

    return NextResponse.json(
      { record, summary: summarize(next.dpiaRecords ?? []) },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea DPIA.", 500, "DPIA_CREATE_FAILED")
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea DPIA")
    const body = (await request.json()) as Partial<DpiaRecord> & { id?: string }
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return jsonError("ID DPIA lipsă.", 400, "MISSING_ID")

    let updated: DpiaRecord | null = null
    const next = await mutateFreshStateForOrg(
      session.orgId,
      (state) => {
        const records = state.dpiaRecords ?? []
        const idx = records.findIndex((record) => record.id === id)
        if (idx === -1) return state

        const current = records[idx]
        const nowISO = new Date().toISOString()
        const status = normalizeStatus(body.status, current.status)
        updated = {
          ...current,
          title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : current.title,
          processingPurpose:
            typeof body.processingPurpose === "string" && body.processingPurpose.trim()
              ? body.processingPurpose.trim()
              : current.processingPurpose,
          processingDescription:
            typeof body.processingDescription === "string" && body.processingDescription.trim()
              ? body.processingDescription.trim()
              : current.processingDescription,
          dataCategories: body.dataCategories === undefined ? current.dataCategories : splitList(body.dataCategories),
          dataSubjects: body.dataSubjects === undefined ? current.dataSubjects : splitList(body.dataSubjects),
          legalBasis:
            typeof body.legalBasis === "string" && body.legalBasis.trim()
              ? body.legalBasis.trim()
              : current.legalBasis,
          specialCategories:
            body.specialCategories === undefined ? current.specialCategories : Boolean(body.specialCategories),
          automatedDecisionMaking:
            body.automatedDecisionMaking === undefined
              ? current.automatedDecisionMaking
              : Boolean(body.automatedDecisionMaking),
          largeScaleProcessing:
            body.largeScaleProcessing === undefined ? current.largeScaleProcessing : Boolean(body.largeScaleProcessing),
          linkedRopaDocumentId:
            body.linkedRopaDocumentId === null
              ? undefined
              : typeof body.linkedRopaDocumentId === "string" && body.linkedRopaDocumentId.trim()
                ? body.linkedRopaDocumentId.trim()
                : current.linkedRopaDocumentId,
          linkedRopaEntryLabel:
            body.linkedRopaEntryLabel === null
              ? undefined
              : typeof body.linkedRopaEntryLabel === "string" && body.linkedRopaEntryLabel.trim()
                ? body.linkedRopaEntryLabel.trim()
                : current.linkedRopaEntryLabel,
          necessityAssessment:
            typeof body.necessityAssessment === "string" && body.necessityAssessment.trim()
              ? body.necessityAssessment.trim()
              : current.necessityAssessment,
          proportionalityAssessment:
            typeof body.proportionalityAssessment === "string" && body.proportionalityAssessment.trim()
              ? body.proportionalityAssessment.trim()
              : current.proportionalityAssessment,
          risks: body.risks === undefined ? current.risks : splitList(body.risks),
          mitigationMeasures:
            body.mitigationMeasures === undefined ? current.mitigationMeasures : splitList(body.mitigationMeasures),
          residualRisk: body.residualRisk === undefined ? current.residualRisk : normalizeRisk(body.residualRisk),
          status,
          owner: typeof body.owner === "string" && body.owner.trim() ? body.owner.trim() : current.owner,
          dueAtISO: body.dueAtISO === null ? undefined : isIsoLike(body.dueAtISO) ? body.dueAtISO : current.dueAtISO,
          reviewedAtISO:
            status === "in_review" || status === "approved" || status === "completed"
              ? current.reviewedAtISO ?? nowISO
              : current.reviewedAtISO,
          approvedAtISO:
            status === "approved" || status === "completed"
              ? current.approvedAtISO ?? nowISO
              : current.approvedAtISO,
          approvedBy:
            status === "approved" || status === "completed"
              ? typeof body.approvedBy === "string" && body.approvedBy.trim()
                ? body.approvedBy.trim()
                : current.approvedBy ?? session.email
              : current.approvedBy,
          evidenceNote:
            typeof body.evidenceNote === "string"
              ? body.evidenceNote.trim()
              : body.evidenceNote === null
                ? undefined
                : current.evidenceNote,
          evidenceFileName:
            typeof body.evidenceFileName === "string"
              ? body.evidenceFileName.trim()
              : body.evidenceFileName === null
                ? undefined
                : current.evidenceFileName,
          updatedAtISO: nowISO,
        }

        const nextRecords = [...records]
        nextRecords[idx] = updated
        return {
          ...state,
          dpiaRecords: nextRecords,
          events: appendComplianceEvents(state, [
            createComplianceEvent(
              {
                type: "gdpr.dpia.updated",
                entityType: "system",
                entityId: updated.id,
                message: `DPIA actualizată: ${updated.title} · ${updated.status}`,
                createdAtISO: nowISO,
                metadata: {
                  status: updated.status,
                  residualRisk: updated.residualRisk,
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

    if (!updated) return jsonError("DPIA nu a fost găsită.", 404, "NOT_FOUND")
    return NextResponse.json({ record: updated, summary: summarize(next.dpiaRecords ?? []) })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza DPIA.", 500, "DPIA_UPDATE_FAILED")
  }
}
