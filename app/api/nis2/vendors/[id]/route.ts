// NIS2 vendor — PATCH update / DELETE

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { updateVendor, deleteVendor, readNis2State } from "@/lib/server/nis2-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { Nis2Vendor } from "@/lib/server/nis2-store"
import { buildVendorRiskFindings } from "@/lib/compliance/vendor-risk"
import { mutateState } from "@/lib/server/mvp-store"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, WRITE_ROLES, "actualizarea furnizorului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Vendor>

    // Compute nextReviewDue if lastReviewDate is being set
    if (body.lastReviewDate) {
      body.nextReviewDue = new Date(
        new Date(body.lastReviewDate).getTime() + 365 * 24 * 60 * 60 * 1000
      ).toISOString()
    }

    const { orgId } = await getOrgContext()
    const vendor = await updateVendor(orgId, id, body)
    if (!vendor) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")

    // Regenerate vendor risk findings after any update
    const nis2State = await readNis2State(orgId)
    const riskFindings = buildVendorRiskFindings(nis2State.vendors, new Date().toISOString())
    await mutateState((current) => ({
      ...current,
      findings: [
        ...current.findings.filter((f) => !f.id.startsWith("nis2-vendor-risk-")),
        ...riskFindings,
      ],
    }))

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
