// S2.3 — DSAR per-request: PATCH update / DELETE
// Auto C: acceptă și câmpul `action` pentru workflow shortcuts
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { updateDsar, deleteDsar } from "@/lib/server/dsar-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { DsarStatus } from "@/lib/server/dsar-store"

const VALID_STATUSES: DsarStatus[] = [
  "received", "in_progress", "awaiting_verification", "responded", "refused",
]

// Action → field update map for common workflow steps
function resolveAction(action: string): Record<string, unknown> | null {
  const now = new Date().toISOString()
  const extended = new Date(Date.now() + 60 * 86_400_000).toISOString()
  const actions: Record<string, Record<string, unknown>> = {
    "verify-identity":     { identityVerified: true, status: "in_progress" },
    "start-processing":    { status: "in_progress" },
    "await-verification":  { status: "awaiting_verification" },
    "mark-responded":      { status: "responded", respondedAtISO: now },
    "refuse":              { status: "refused" },
    "extend-deadline":     { extendedDeadlineISO: extended },
  }
  return actions[action] ?? null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea cererii DSAR")
    const { id } = await params
    const body = await request.json()

    // Auto C: resolve action shortcut to field updates
    let updates = { ...body }
    if (body.action) {
      const resolved = resolveAction(body.action)
      if (!resolved) return jsonError(`Acțiune necunoscută: ${body.action}.`, 400, "INVALID_ACTION")
      const { action: _removed, ...rest } = updates
      updates = { ...resolved, ...rest }
    }

    if (updates.status && !VALID_STATUSES.includes(updates.status as DsarStatus)) {
      return jsonError("Status invalid.", 400, "INVALID_STATUS")
    }

    const updated = await updateDsar(session.orgId, id, updates)
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
    const session = await requireFreshRole(request, DELETE_ROLES, "ștergerea cererii DSAR")
    const { id } = await params
    const deleted = await deleteDsar(session.orgId, id)
    if (!deleted) return jsonError("Cererea DSAR nu a fost găsită.", 404, "NOT_FOUND")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge cererea DSAR.", 500, "DSAR_DELETE_FAILED")
  }
}
