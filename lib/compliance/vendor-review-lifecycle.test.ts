import { describe, expect, it } from "vitest"

import { buildVendorLifecycleSummary } from "@/lib/compliance/vendor-review-lifecycle"
import type { VendorReview } from "@/lib/compliance/vendor-review-engine"

function makeReview(partial: Partial<VendorReview>): VendorReview {
  return {
    id: partial.id ?? "vr-1",
    vendorId: partial.vendorId ?? "vendor-1",
    vendorName: partial.vendorName ?? "Vendor Demo",
    status: partial.status ?? "closed",
    urgency: partial.urgency ?? "medium",
    category: partial.category ?? "tech",
    confidence: partial.confidence ?? "medium",
    detectionSource: partial.detectionSource ?? "vendor-registry",
    createdAtISO: partial.createdAtISO ?? "2026-03-30T10:00:00.000Z",
    updatedAtISO: partial.updatedAtISO ?? "2026-03-30T10:00:00.000Z",
    ...partial,
  }
}

describe("buildVendorLifecycleSummary", () => {
  it("separă review-urile expirate, due soon și follow-up active", () => {
    const now = new Date("2026-03-30T12:00:00.000Z").getTime()
    const originalNow = Date.now
    Date.now = () => now

    const summary = buildVendorLifecycleSummary([
      makeReview({
        id: "vr-overdue",
        vendorName: "OpenAI",
        status: "closed",
        nextReviewDueISO: "2026-03-01T00:00:00.000Z",
      }),
      makeReview({
        id: "vr-due-soon",
        vendorName: "Stripe",
        status: "closed",
        nextReviewDueISO: "2026-04-10T00:00:00.000Z",
      }),
      makeReview({
        id: "vr-follow-up",
        vendorName: "HubSpot",
        status: "awaiting-evidence",
        followUpDueISO: "2026-04-05T00:00:00.000Z",
      }),
    ])

    expect(summary.overdue).toHaveLength(1)
    expect(summary.dueSoon).toHaveLength(1)
    expect(summary.activeFollowUp).toHaveLength(1)
    expect(summary.reminderNote).toContain("OpenAI")
    expect(summary.reminderNote).toContain("Stripe")
    expect(summary.reminderNote).toContain("HubSpot")

    Date.now = originalNow
  })
})
