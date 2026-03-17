// NIS2 incident — PATCH update / DELETE

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { updateIncident, deleteIncident } from "@/lib/server/nis2-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { Nis2Incident } from "@/lib/server/nis2-store"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea incidentului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Incident>

    const { orgId } = await getOrgContext()
    const incident = await updateIncident(orgId, id, body)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ incident })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza incidentul.", 500, "NIS2_INCIDENT_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, DELETE_ROLES, "ștergerea incidentului")

    const { id } = await params
    const { orgId } = await getOrgContext()
    const deleted = await deleteIncident(orgId, id)
    if (!deleted) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge incidentul.", 500, "NIS2_INCIDENT_DELETE_FAILED")
  }
}
