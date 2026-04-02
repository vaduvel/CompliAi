// PATCH /api/whistleblowing/[id] → update report status/notes

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { updateReport } from "@/lib/server/whistleblowing-store"
import { WRITE_ROLES } from "@/lib/server/rbac"
import type { WhistleblowingStatus } from "@/lib/server/whistleblowing-store"

const VALID_STATUSES: WhistleblowingStatus[] = [
  "received", "under_investigation", "resolved", "closed",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea sesizării")
    const { id } = await params
    const body = await request.json() as {
      status?: WhistleblowingStatus
      internalNotes?: string
      assignedTo?: string
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }
    const patch: Parameters<typeof updateReport>[2] = {}
    if (body.status) {
      patch.status = body.status
      if (body.status === "resolved" || body.status === "closed") {
        patch.resolvedAtISO = new Date().toISOString()
      }
    }
    if (body.internalNotes !== undefined) patch.internalNotes = body.internalNotes
    if (body.assignedTo !== undefined) patch.assignedTo = body.assignedTo

    const report = await updateReport(session.orgId, id, patch)
    if (!report) return jsonError("Sesizarea nu a fost găsită.", 404, "NOT_FOUND")
    return NextResponse.json({ report })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza sesizarea.", 500, "WB_UPDATE_FAILED")
  }
}
