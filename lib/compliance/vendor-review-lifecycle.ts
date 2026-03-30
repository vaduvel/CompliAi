import type { VendorReview } from "@/lib/compliance/vendor-review-engine"

export type VendorLifecycleSummary = {
  overdue: VendorReview[]
  dueSoon: VendorReview[]
  activeFollowUp: VendorReview[]
  reminderNote: string
}

export function buildVendorLifecycleSummary(
  reviews: VendorReview[],
  options?: { dueSoonDays?: number }
): VendorLifecycleSummary {
  const dueSoonDays = options?.dueSoonDays ?? 30
  const now = Date.now()
  const dueSoonThreshold = now + dueSoonDays * 86_400_000

  const overdue = reviews.filter((review) => {
    if (review.status === "overdue-review") return true
    if (review.status !== "closed" || !review.nextReviewDueISO) return false
    const dueAt = Date.parse(review.nextReviewDueISO)
    return !Number.isNaN(dueAt) && dueAt <= now
  })

  const dueSoon = reviews.filter((review) => {
    if (review.status !== "closed" || !review.nextReviewDueISO) return false
    const dueAt = Date.parse(review.nextReviewDueISO)
    return !Number.isNaN(dueAt) && dueAt > now && dueAt <= dueSoonThreshold
  })

  const activeFollowUp = reviews.filter((review) =>
    review.status === "needs-context" ||
    review.status === "review-generated" ||
    review.status === "awaiting-human-validation" ||
    review.status === "awaiting-evidence"
  )

  const overdueNames = overdue.slice(0, 3).map((review) => review.vendorName)
  const dueSoonLabels = dueSoon.slice(0, 3).map((review) => {
    const dueLabel = review.nextReviewDueISO
      ? new Date(review.nextReviewDueISO).toLocaleDateString("ro-RO")
      : "fără termen"
    return `${review.vendorName} (${dueLabel})`
  })

  const reminderParts = [
    overdue.length > 0
      ? `Avem ${overdue.length} review-uri vendor expirate${overdueNames.length ? `: ${overdueNames.join(", ")}` : ""}.`
      : null,
    dueSoon.length > 0
      ? `${dueSoon.length} review-uri vendor expiră în următoarele ${dueSoonDays} zile${dueSoonLabels.length ? `: ${dueSoonLabels.join(", ")}` : ""}.`
      : null,
    activeFollowUp.length > 0
      ? `${activeFollowUp.length} review-uri sunt încă în follow-up activ și au nevoie de context, validare sau dovadă.`
      : null,
    overdue.length === 0 && dueSoon.length === 0 && activeFollowUp.length === 0
      ? "Nu există review-uri vendor care cer reminder imediat."
      : "Prioritate: pornește revalidările expirate și confirmă follow-up-ul pentru vendorii care au documentația încă lipsă."
  ].filter(Boolean)

  return {
    overdue,
    dueSoon,
    activeFollowUp,
    reminderNote: reminderParts.join(" "),
  }
}
