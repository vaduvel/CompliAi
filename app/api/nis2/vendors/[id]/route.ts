// NIS2 vendor — PATCH update / DELETE

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { updateVendor, deleteVendor } from "@/lib/server/nis2-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { Nis2Vendor } from "@/lib/server/nis2-store"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea furnizorului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Vendor>

    const { orgId } = await getOrgContext()
    const vendor = await updateVendor(orgId, id, body)
    if (!vendor) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ vendor })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut actualiza furnizorul.", 500, "NIS2_VENDOR_UPDATE_FAILED")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, DELETE_ROLES, "ștergerea furnizorului")

    const { id } = await params
    const { orgId } = await getOrgContext()
    const deleted = await deleteVendor(orgId, id)
    if (!deleted) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge furnizorul.", 500, "NIS2_VENDOR_DELETE_FAILED")
  }
}
