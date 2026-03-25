// PATCH /api/dora/incidents/[id] — update incident status/details

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { WRITE_ROLES } from "@/lib/server/rbac"
import { updateIncident } from "@/lib/server/dora-store"
import type { DoraIncidentStatus } from "@/lib/server/dora-store"

const VALID_STATUSES: DoraIncidentStatus[] = [
  "detected", "under-analysis", "notified-authority", "resolved", "closed",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea incidentului DORA")
    const { id } = await params
    const { orgId } = await getOrgContext()
    const body = await request.json() as {
      status?: DoraIncidentStatus
      rootCause?: string
      mitigation?: string
      notifiedAuthorityAtISO?: string
      resolvedAtISO?: string
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }
    const patch: Parameters<typeof updateIncident>[2] = {}
    if (body.status) patch.status = body.status
    if (body.rootCause !== undefined) patch.rootCause = body.rootCause
    if (body.mitigation !== undefined) patch.mitigation = body.mitigation
    if (body.notifiedAuthorityAtISO !== undefined) patch.notifiedAuthorityAtISO = body.notifiedAuthorityAtISO
    if (body.status === "resolved" || body.status === "closed") {
      patch.resolvedAtISO = body.resolvedAtISO ?? new Date().toISOString()
    }

    const incident = await updateIncident(orgId, id, patch)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "NOT_FOUND")
    return NextResponse.json({ incident })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza incidentul.", 500, "DORA_INCIDENT_UPDATE_FAILED")
  }
}
