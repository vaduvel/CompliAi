// Pay Transparency — HR-side single request API
// GET: detail
// PATCH: transition (process, answer, escalate)

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import {
  getRequest,
  transitionRequest,
} from "@/lib/server/pay-transparency-requests-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await requireFreshRole(request, [...READ_ROLES], "citire cerere PT")
    const req = await getRequest(session.orgId, id)
    if (!req) return jsonError("Cererea nu a fost găsită.", 404, "PT_REQUEST_NOT_FOUND")
    return NextResponse.json({ ok: true, request: req })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea cererii.", 500, "PT_REQUEST_GET_FAILED")
  }
}

type PatchBody = {
  action: "process" | "answer" | "escalate"
  answer?: string
  internalNotes?: string
  reason?: string
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await requireFreshRole(request, [...WRITE_ROLES], "actualizare cerere PT")
    const body = (await request.json()) as PatchBody
    const nowISO = new Date().toISOString()

    if (body.action === "process") {
      const updated = await transitionRequest(session.orgId, id, {
        action: "process",
        nowISO,
        internalNotes: body.internalNotes,
      })
      return NextResponse.json({ ok: true, request: updated })
    }

    if (body.action === "answer") {
      if (!body.answer || !body.answer.trim()) {
        return jsonError("answer text required", 400, "INVALID_BODY")
      }
      const updated = await transitionRequest(session.orgId, id, {
        action: "answer",
        nowISO,
        answer: body.answer.trim(),
        internalNotes: body.internalNotes,
      })
      return NextResponse.json({ ok: true, request: updated })
    }

    if (body.action === "escalate") {
      if (!body.reason || !body.reason.trim()) {
        return jsonError("reason required", 400, "INVALID_BODY")
      }
      const updated = await transitionRequest(session.orgId, id, {
        action: "escalate",
        nowISO,
        reason: body.reason.trim(),
      })
      return NextResponse.json({ ok: true, request: updated })
    }

    return jsonError("action must be process|answer|escalate", 400, "INVALID_ACTION")
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
      return jsonError("Cererea nu a fost găsită.", 404, "PT_REQUEST_NOT_FOUND")
    }
    return jsonError("Eroare la actualizarea cererii.", 500, "PT_REQUEST_PATCH_FAILED")
  }
}
