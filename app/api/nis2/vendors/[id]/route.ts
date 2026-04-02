// NIS2 vendor — PATCH update / DELETE

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { updateVendor, deleteVendor, readNis2State } from "@/lib/server/nis2-store"
import { DELETE_ROLES, WRITE_ROLES } from "@/lib/server/rbac"
import type { Nis2Vendor } from "@/lib/server/nis2-store"
import { buildVendorRiskFindings } from "@/lib/compliance/vendor-risk"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { preserveRuntimeStateForSingleFinding } from "@/lib/server/preserve-finding-runtime-state"
import { mergeNis2PackageFindings } from "@/lib/server/nis2-package-sync"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "actualizarea furnizorului")

    const { id } = await params
    const body = (await request.json()) as Partial<Nis2Vendor>

    // Compute nextReviewDue if lastReviewDate is being set
    if (body.lastReviewDate) {
      body.nextReviewDue = new Date(
        new Date(body.lastReviewDate).getTime() + 365 * 24 * 60 * 60 * 1000
      ).toISOString()
    }

    const vendor = await updateVendor(session.orgId, id, body)
    if (!vendor) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")

    // Regenerate vendor risk findings after any update
    const nis2State = await readNis2State(session.orgId)
    const riskFindings = buildVendorRiskFindings(nis2State.vendors, new Date().toISOString())
    await mutateFreshStateForOrg(
      session.orgId,
      (current) => ({
        ...current,
        findings: mergeNis2PackageFindings(
          [
            ...current.findings.filter((f) => !f.id.startsWith("nis2-vendor-risk-")),
            ...riskFindings.map((finding) => preserveRuntimeStateForSingleFinding(current.findings, finding)),
          ],
          nis2State,
          new Date().toISOString()
        ),
      }),
      session.orgName
    )

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
    const session = await requireFreshRole(request, DELETE_ROLES, "ștergerea furnizorului")

    const { id } = await params
    const deleted = await deleteVendor(session.orgId, id)
    if (!deleted) return jsonError("Furnizorul nu a fost găsit.", 404, "NOT_FOUND")

    await mutateFreshStateForOrg(
      session.orgId,
      async (current) => ({
        ...current,
        findings: mergeNis2PackageFindings(
          current.findings.filter((finding) => finding.id !== `nis2-vendor-risk-${id}`),
          await readNis2State(session.orgId),
          new Date().toISOString()
        ),
      }),
      session.orgName
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut șterge furnizorul.", 500, "NIS2_VENDOR_DELETE_FAILED")
  }
}
