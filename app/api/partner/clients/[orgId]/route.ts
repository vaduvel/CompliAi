// GET /api/partner/clients/[orgId]
// Sprint 12 — Partner Portal drill-down: date detaliate per client.
// Verifică că utilizatorul are membership la acea org, returnează
// compliance summary complet + NIS2 state + findings deschise.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, deactivateOrganizationMember, readSessionFromRequest, listUserMemberships } from "@/lib/server/auth"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import { readNis2State } from "@/lib/server/nis2-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import type { VendorReviewStatus, VendorReviewUrgency } from "@/lib/compliance/vendor-review-engine"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const { orgId } = await params

    // Verifică că userul are acces la acel orgId
    const memberships = await listUserMemberships(session.userId)
    const membership = memberships.find((m) => m.orgId === orgId && m.status === "active")
    if (!membership) {
      return jsonError("Acces interzis sau organizație inexistentă.", 403, "FORBIDDEN")
    }

    // Citește starea de conformitate
    const rawState = await readStateForOrg(orgId)
    let complianceSummary = null
    let openFindings: { id: string; title: string; category: string; severity: string }[] = []

    if (rawState) {
      const state = normalizeComplianceState(rawState)
      const summary = computeDashboardSummary(state)
      complianceSummary = {
        score: summary.score,
        riskLabel: summary.riskLabel,
        openAlerts: summary.openAlerts,
        redAlerts: summary.redAlerts,
        scannedDocuments: state.scannedDocuments,
        gdprProgress: state.gdprProgress,
        highRisk: state.highRisk,
        efacturaConnected: state.efacturaConnected,
        aiSystemsCount: state.aiSystems.length,
      }
      openFindings = state.findings
        .filter((f) => {
          const alert = state.alerts.find((a) => a.findingId === f.id && a.open)
          return alert !== undefined
        })
        .slice(0, 10)
        .map((f) => ({
          id: f.id,
          title: f.title,
          category: f.category,
          severity: f.severity,
        }))
    }

    // Citește starea NIS2
    const nis2State = await readNis2State(orgId)

    // V5.5 — Vendor reviews per client
    const vendorReviews = await safeListReviews(orgId)
    const vendorReviewSummary = {
      total: vendorReviews.length,
      open: vendorReviews.filter((r) => r.status !== "closed").length,
      closed: vendorReviews.filter((r) => r.status === "closed").length,
      overdue: vendorReviews.filter((r) => r.status === "overdue-review").length,
      critical: vendorReviews.filter((r) => r.urgency === "critical" && r.status !== "closed").length,
      needsContext: vendorReviews.filter((r) => r.status === "needs-context").length,
      reviews: vendorReviews.map((r) => ({
        id: r.id,
        vendorName: r.vendorName,
        status: r.status as VendorReviewStatus,
        urgency: r.urgency as VendorReviewUrgency,
        category: r.category,
        reviewCase: r.reviewCase ?? null,
        nextReviewDueISO: r.nextReviewDueISO ?? null,
        reviewCount: r.reviewCount ?? 0,
      })),
    }

    return NextResponse.json({
      orgId,
      orgName: membership.orgName,
      role: membership.role,
      compliance: complianceSummary,
      openFindings,
      nis2: {
        dnscRegistrationStatus: nis2State.dnscRegistrationStatus ?? "not-started",
        incidentsCount: nis2State.incidents.length,
        openIncidentsCount: nis2State.incidents.filter((i) => i.status === "open").length,
        vendorsCount: nis2State.vendors.length,
        hasAssessment: nis2State.assessment !== null,
        assessmentScore: nis2State.assessment?.score ?? null,
      },
      vendorReviews: vendorReviewSummary,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la incarcarea detaliilor clientului.", 500, "PARTNER_CLIENT_DETAIL_FAILED")
  }
}

// DELETE /api/partner/clients/[orgId]
// Elimină firma din portofoliul consultantului (dezactivează membership-ul).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await params

    const memberships = await listUserMemberships(session.userId)
    const membership = memberships.find((m) => m.orgId === orgId && m.status === "active")
    if (!membership) return jsonError("Firma nu există în portofoliu.", 404, "NOT_FOUND")

    if (membership.role === "owner") {
      return jsonError("Nu poți elimina firma proprie din portofoliu.", 400, "CANNOT_REMOVE_OWN_ORG")
    }

    await deactivateOrganizationMember(orgId, membership.membershipId)

    return NextResponse.json({ removed: true, orgId })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Eroare la eliminarea firmei.",
      500,
      "REMOVE_CLIENT_FAILED"
    )
  }
}
