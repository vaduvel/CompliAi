// PATCH /api/fiscal/evidence-requests/[id] — actualizare status cerere (FC-9).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  updateEvidenceStatus,
  type EvidenceRequest,
  type EvidenceStatus,
} from "@/lib/compliance/missing-evidence-workflow"
import type { ComplianceState } from "@/lib/compliance/types"

type StateExt = ComplianceState & { evidenceRequests?: EvidenceRequest[] }

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

type PatchBody = {
  status?: EvidenceStatus
  note?: string
  actor?: "cabinet" | "client" | "system"
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = requireRole(
      request,
      [...WRITE_ROLES],
      "actualizare status cerere",
    )
    const { id } = await params
    const body = (await request.json()) as PatchBody

    if (!body.status) {
      return jsonError("Câmpul 'status' este obligatoriu.", 400, "EVIDENCE_PATCH_INVALID")
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const list = state.evidenceRequests ?? []
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) {
      return jsonError("Cererea nu a fost găsită.", 404, "EVIDENCE_NOT_FOUND")
    }

    const updated = updateEvidenceStatus(list[idx]!, body.status, body.actor ?? "cabinet", body.note)
    const next = [...list]
    next[idx] = updated

    const nextState: StateExt = { ...state, evidenceRequests: next }
    await writeStateForOrg(session.orgId, nextState as ComplianceState)

    return NextResponse.json({ ok: true, request: updated })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare la actualizare.",
      500,
      "EVIDENCE_PATCH_FAILED",
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = requireRole(
      request,
      [...WRITE_ROLES],
      "anulare cerere",
    )
    const { id } = await params

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const list = state.evidenceRequests ?? []
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) {
      return jsonError("Cererea nu a fost găsită.", 404, "EVIDENCE_NOT_FOUND")
    }

    const updated = updateEvidenceStatus(list[idx]!, "cancelled", "cabinet", "Anulat de cabinet")
    const next = [...list]
    next[idx] = updated

    const nextState: StateExt = { ...state, evidenceRequests: next }
    await writeStateForOrg(session.orgId, nextState as ComplianceState)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare la anulare.",
      500,
      "EVIDENCE_DELETE_FAILED",
    )
  }
}
