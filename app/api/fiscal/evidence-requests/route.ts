// API pentru Missing Evidence Workflow (FC-9).
//
// GET    /api/fiscal/evidence-requests           — listă cereri pentru org
// POST   /api/fiscal/evidence-requests           — creare cerere nouă

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  createEvidenceRequest,
  generateEmailTemplate,
  markOverdueRequests,
  summarizeEvidenceQueue,
  type CreateEvidenceRequestInput,
  type EvidenceRequest,
  type EvidenceType,
  type EvidenceUrgency,
} from "@/lib/compliance/missing-evidence-workflow"
import type { ComplianceState } from "@/lib/compliance/types"

type StateExt = ComplianceState & { evidenceRequests?: EvidenceRequest[] }

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare Missing Evidence Workflow",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const all = state.evidenceRequests ?? []
    const refreshed = markOverdueRequests(all)
    const summary = summarizeEvidenceQueue(refreshed)

    // Persist dacă overdue-uri noi au fost marcate
    const overdueDelta = refreshed.filter(
      (r, i) => r.status !== all[i]?.status,
    ).length
    if (overdueDelta > 0) {
      const nextState: StateExt = { ...state, evidenceRequests: refreshed }
      await writeStateForOrg(session.orgId, nextState as ComplianceState)
    }

    return NextResponse.json({
      ok: true,
      requests: refreshed,
      summary: {
        ...summary,
        // Convert Map → object pentru JSON
        byClient: Object.fromEntries(summary.byClient),
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare evidence requests.",
      500,
      "EVIDENCE_LIST_FAILED",
    )
  }
}

type CreateBody = {
  clientOrgId?: string
  clientOrgName?: string
  clientEmail?: string
  type?: EvidenceType
  title?: string
  reasonDetail?: string
  period?: string
  dueDaysFromNow?: number
  urgency?: EvidenceUrgency
  linkedFindingId?: string
  linkedExceptionId?: string
}

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      [...WRITE_ROLES],
      "creare cerere de document",
    )
    const body = (await request.json()) as CreateBody

    if (!body.type || !body.title || !body.clientEmail || !body.clientOrgId || !body.clientOrgName) {
      return jsonError(
        "Câmpuri lipsă: type, title, clientEmail, clientOrgId, clientOrgName sunt obligatorii.",
        400,
        "EVIDENCE_INPUT_INVALID",
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const input: CreateEvidenceRequestInput = {
      clientOrgId: body.clientOrgId,
      clientOrgName: body.clientOrgName,
      clientEmail: body.clientEmail,
      type: body.type,
      title: body.title,
      reasonDetail: body.reasonDetail ?? "—",
      period: body.period,
      dueDaysFromNow: body.dueDaysFromNow ?? 7,
      urgency: body.urgency ?? "normal",
      linkedFindingId: body.linkedFindingId,
      linkedExceptionId: body.linkedExceptionId,
      createdByEmail: session.email,
    }

    const newRequest = createEvidenceRequest(input)
    const emailTemplate = generateEmailTemplate(newRequest)

    const updatedList: EvidenceRequest[] = [...(state.evidenceRequests ?? []), newRequest]
    const nextState: StateExt = { ...state, evidenceRequests: updatedList }
    await writeStateForOrg(session.orgId, nextState as ComplianceState)

    return NextResponse.json({
      ok: true,
      request: newRequest,
      emailTemplate,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare la creare cerere.",
      500,
      "EVIDENCE_CREATE_FAILED",
    )
  }
}
