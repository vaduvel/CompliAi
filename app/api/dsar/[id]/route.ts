// S2.3 — DSAR per-request: PATCH update / DELETE
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { updateDsar, deleteDsar } from "@/lib/server/dsar-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { DsarStatus } from "@/lib/server/dsar-store"

const VALID_STATUSES: DsarStatus[] = [
  "received", "in_progress", "awaiting_verification", "responded", "refused",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea cererii DSAR")
    const { id } = await params
    const body = await request.json()

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }

    const { orgId } = await getOrgContext()
    const updated = await updateDsar(orgId, id, body)
    if (!updated) return jsonError("Cererea DSAR nu a fost găsită.", 404, "NOT_FOUND")

    return NextResponse.json({ request: updated })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza cererea DSAR.", 500, "DSAR_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, DELETE_ROLES, "ștergerea cererii DSAR")
    const { id } = await params
    const { orgId } = await getOrgContext()
    const deleted = await deleteDsar(orgId, id)
    if (!deleted) return jsonError("Cererea DSAR nu a fost găsită.", 404, "NOT_FOUND")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge cererea DSAR.", 500, "DSAR_DELETE_FAILED")
  }
}
