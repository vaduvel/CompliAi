// V3 P1.1 — Compliance Response Pack endpoint
// Generează documentul de răspuns la cereri de due diligence / chestionare conformitate.

import { NextResponse } from "next/server"

import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import {
  buildComplianceResponse,
  buildComplianceResponseHtml,
  type ResponsePackVendorSummary,
} from "@/lib/compliance/response-pack"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { listReviews } from "@/lib/server/vendor-review-store"

export async function POST() {
  const [state, { orgId, orgName }] = await Promise.all([readState(), getOrgContext()])
  const normalized = normalizeComplianceState(state)
  const summary = computeDashboardSummary(normalized)
  const remediationPlan = buildRemediationPlan(normalized)
  const nowISO = new Date().toISOString()

  // V5.6 — Vendor review data for response pack
  const reviews = await listReviews(orgId)
  let vendorReviewSummary: ResponsePackVendorSummary | undefined
  if (reviews.length > 0) {
    vendorReviewSummary = {
      totalVendors: reviews.length,
      reviewedVendors: reviews.filter((r) => r.status === "closed").length,
      overdueReviews: reviews.filter((r) => r.status === "overdue-review").length,
      criticalCount: reviews.filter((r) => r.urgency === "critical" && r.status !== "closed").length,
      topReviews: reviews.slice(0, 10).map((r) => ({
        vendorName: r.vendorName,
        status: r.status,
        urgency: r.urgency,
        reviewCase: r.reviewCase ?? null,
        hasEvidence: (r.evidenceItems?.length ?? 0) > 0 || !!r.closureEvidence,
        nextReviewDueISO: r.nextReviewDueISO ?? null,
      })),
    }
  }

  const report = buildComplianceResponse(normalized, summary, remediationPlan, orgName, nowISO, vendorReviewSummary)
  const html = buildComplianceResponseHtml(report)

  return NextResponse.json({ report, html })
}
