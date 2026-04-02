import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import {
  addDnscRegistrationCorrespondenceEntry,
  deleteDnscRegistrationCorrespondenceEntry,
} from "@/lib/server/nis2-store"
import { WRITE_ROLES } from "@/lib/server/rbac"

export async function POST(req: Request) {
  try {
    const session = await requireFreshRole(req, WRITE_ROLES, "actualizarea corespondenței DNSC")
    const body = (await req.json()) as { date?: string; direction?: string; summary?: string }

    if (!body.date || !body.direction || !body.summary?.trim()) {
      return jsonError("Câmpuri lipsă: date, direction, summary.", 400, "MISSING_DNSC_CORRESPONDENCE_FIELDS")
    }
    if (body.direction !== "sent" && body.direction !== "received") {
      return jsonError("direction trebuie să fie 'sent' sau 'received'.", 400, "INVALID_DNSC_DIRECTION")
    }

    const correspondence = await addDnscRegistrationCorrespondenceEntry(session.orgId, {
      date: body.date,
      direction: body.direction,
      summary: body.summary.trim(),
    })

    return NextResponse.json({ correspondence })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut salva corespondența DNSC.", 500, "DNSC_CORRESPONDENCE_CREATE_FAILED")
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireFreshRole(req, WRITE_ROLES, "ștergerea corespondenței DNSC")
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return jsonError("id lipsă.", 400, "MISSING_DNSC_CORRESPONDENCE_ID")
    }

    const correspondence = await deleteDnscRegistrationCorrespondenceEntry(session.orgId, id)
    return NextResponse.json({ correspondence })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge corespondența DNSC.", 500, "DNSC_CORRESPONDENCE_DELETE_FAILED")
  }
}
