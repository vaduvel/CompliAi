// POST /api/cron/vendor-review-revalidation
// V5.4 — Vendor Review Revalidation Cycle cron endpoint.
// Scans all orgs for closed vendor reviews past their nextReviewDueISO.
// Marks them overdue-review and records audit trail.
//
// Securitate: verifică CRON_SECRET din Authorization header.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import {
  safeListReviews,
  updateReview,
} from "@/lib/server/vendor-review-store"
import {
  isReviewOverdue,
  appendAudit,
} from "@/lib/compliance/vendor-review-engine"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const results: { orgId: string; overdueCount: number }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()
    const orgsToProcess = organizations.slice(0, 50)

    for (const org of orgsToProcess) {
      try {
        const reviews = await safeListReviews(org.id)
        let overdueCount = 0

        for (const review of reviews) {
          if (isReviewOverdue(review)) {
            await updateReview(org.id, review.id, {
              status: "overdue-review",
              reviewReason: `Review periodic expirat la ${new Date(review.nextReviewDueISO!).toLocaleDateString("ro-RO")}.`,
              auditTrail: appendAudit(
                review.auditTrail,
                "revalidation-triggered",
                "system-cron",
                "Automatic overdue detection",
              ),
            })
            overdueCount++
          }
        }

        results.push({ orgId: org.id, overdueCount })
      } catch (err) {
        capturedCronErrors =
          captureCronError(err, {
            cron: "/api/cron/vendor-review-revalidation",
            orgId: org.id,
            step: "org-run",
          }) || capturedCronErrors

        console.error(`[VendorRevalidation] Eroare org ${org.id}: ${err instanceof Error ? err.message : String(err)}`)
        results.push({ orgId: org.id, overdueCount: 0 })
      }
    }

    const totalOverdue = results.reduce((s, r) => s + r.overdueCount, 0)
    console.log(`[VendorRevalidation] Run completat: ${totalOverdue} review-uri marcate overdue în ${results.length} org-uri`)

    if (capturedCronErrors) {
      await flushCronTelemetry()
    }

    return NextResponse.json({
      ok: true,
      totalOverdue,
      orgsProcessed: results.length,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown"
    console.error(`[VendorRevalidation] Eroare critică: ${msg}`)

    captureCronError(error, {
      cron: "/api/cron/vendor-review-revalidation",
      step: "critical",
    })
    await flushCronTelemetry()

    return jsonError(`Eroare la revalidare: ${msg}`, 500, "VENDOR_REVALIDATION_FAILED")
  }
}
