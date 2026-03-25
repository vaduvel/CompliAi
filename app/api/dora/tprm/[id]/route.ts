// PATCH /api/dora/tprm/[id] — update TPRM entry

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { WRITE_ROLES } from "@/lib/server/rbac"
import { updateTprmEntry } from "@/lib/server/dora-store"
import type { TprmStatus } from "@/lib/server/dora-store"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea furnizorului ICT")
    const { id } = await params
    const { orgId } = await getOrgContext()
    const body = await request.json() as {
      status?: TprmStatus
      riskLevel?: "low" | "medium" | "high"
      lastAssessmentISO?: string
      nextAssessmentISO?: string
      notes?: string
    }
    const patch: Parameters<typeof updateTprmEntry>[2] = {}
    if (body.status) patch.status = body.status
    if (body.riskLevel) patch.riskLevel = body.riskLevel
    if (body.lastAssessmentISO !== undefined) patch.lastAssessmentISO = body.lastAssessmentISO
    if (body.nextAssessmentISO !== undefined) patch.nextAssessmentISO = body.nextAssessmentISO
    if (body.notes !== undefined) patch.notes = body.notes

    const entry = await updateTprmEntry(orgId, id, patch)
    if (!entry) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")
    return NextResponse.json({ entry })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza furnizorul.", 500, "DORA_TPRM_UPDATE_FAILED")
  }
}
