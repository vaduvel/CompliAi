// V6 — Vendor Risk Agent
// Periodic vendor evaluation: re-scoring, DPA tracking, overdue detection,
// supply chain risk, CAEN classification hints.
// Uses graceful degradation — vendor-review-store may not exist on this branch.
// Does NOT call external APIs — only scans state and proposes actions.

import type { ComplianceState } from "@/lib/compliance/types"
import {
  generateRunId,
  type AgentAction,
  type AgentOutput,
} from "@/lib/compliance/agentic-engine"

// ── Inline vendor types (graceful degradation — V5 may not be merged) ────────

type VendorReviewStatus =
  | "detected"
  | "needs-context"
  | "review-generated"
  | "awaiting-human-validation"
  | "awaiting-evidence"
  | "closed"
  | "overdue-review"

type VendorReviewUrgency = "critical" | "high" | "medium" | "info"
type VendorReviewCase = "A" | "B" | "C" | "D"

type VendorReview = {
  id: string
  vendorId: string
  vendorName: string
  status: VendorReviewStatus
  urgency: VendorReviewUrgency
  category: "ai" | "cloud" | "tech" | "possible-processor" | "unknown"
  confidence: "high" | "medium" | "low"
  detectionSource: "efactura" | "ai-inventory" | "vendor-registry" | "manual"
  context?: {
    sendsPersonalData: "yes" | "no" | "unknown"
    sendsConfidentialData: "yes" | "no" | "unknown"
    vendorProcessesData: "processor" | "tool" | "unknown"
    hasDpaOrTerms: "yes" | "no" | "unknown"
    hasTransferMechanism: "dpf" | "scc" | "other" | "unknown"
    isActivelyUsed: "active" | "historic"
  }
  reviewCase?: VendorReviewCase
  findingId?: string
  closedAtISO?: string
  evidenceItems?: Array<{ id: string; type: string; description: string }>
  nextReviewDueISO?: string
  reviewCount?: number
  createdAtISO: string
  updatedAtISO: string
}

// ── Types ────────────────────────────────────────────────────────────────────

export type VendorRiskAgentInput = {
  orgId: string
  state: ComplianceState
  vendorReviews: VendorReview[]
  nowISO: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const OVERDUE_THRESHOLD_DAYS = 0 // past nextReviewDueISO
const STALE_OPEN_DAYS = 30 // open review without progress
const DPA_MISSING_URGENCY_BUMP = true

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((nowMs - d) / MS_PER_DAY)
}

function daysUntil(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((d - nowMs) / MS_PER_DAY)
}

// ── Agent logic ──────────────────────────────────────────────────────────────

export function runVendorRiskAgent(input: VendorRiskAgentInput): AgentOutput {
  const runId = generateRunId("vendor_risk")
  const startedAtISO = new Date().toISOString()
  const actions: AgentAction[] = []
  const nowMs = new Date(input.nowISO).getTime()
  let itemsScanned = 0
  let issuesFound = 0

  const reviews = input.vendorReviews

  // 0. No reviews at all — check if org has vendors in state
  if (reviews.length === 0) {
    itemsScanned++
    const nis2Vendors = (input.state as Record<string, unknown>).nis2Vendors as unknown[] | undefined
    if (nis2Vendors && nis2Vendors.length > 0) {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `${nis2Vendors.length} vendor(i) NIS2 detectați, dar niciun review deschis. Evaluare recomandată.`,
        targetId: "vendor-no-reviews",
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  // 1. Overdue reviews (closed but past nextReviewDueISO)
  for (const review of reviews) {
    itemsScanned++

    if (review.status === "closed" && review.nextReviewDueISO) {
      const daysLeft = daysUntil(review.nextReviewDueISO, nowMs)
      if (daysLeft !== null && daysLeft <= OVERDUE_THRESHOLD_DAYS) {
        issuesFound++
        const daysOverdue = Math.abs(daysLeft)
        actions.push({
          type: "review_triggered",
          description: `Revalidare depășită: ${review.vendorName} — ${daysOverdue} zile peste termen. Re-evaluare necesară.`,
          targetId: review.id,
          approvalLevel: 1,
          autoApplied: true,
        })
      } else if (daysLeft !== null && daysLeft <= 14) {
        // Approaching deadline — warn
        actions.push({
          type: "alert_created",
          description: `Revalidare apropiată: ${review.vendorName} — ${daysLeft} zile rămase.`,
          targetId: review.id,
          approvalLevel: 1,
          autoApplied: true,
        })
      }
    }
  }

  // 2. Stale open reviews (open for too long without progress)
  for (const review of reviews) {
    if (review.status === "closed") continue
    // Already counted in itemsScanned above

    const age = daysSince(review.updatedAtISO, nowMs)
    if (age !== null && age > STALE_OPEN_DAYS) {
      issuesFound++
      actions.push({
        type: "alert_created",
        description: `Review stagnant: ${review.vendorName} — status "${review.status}" neschimbat de ${age} zile.`,
        targetId: review.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 3. DPA missing for processors
  for (const review of reviews) {
    if (!review.context) continue

    const isProcessor = review.context.vendorProcessesData === "processor"
    const sendsPersonalData = review.context.sendsPersonalData === "yes"
    const hasDpa = review.context.hasDpaOrTerms === "yes"

    if (isProcessor && sendsPersonalData && !hasDpa) {
      issuesFound++
      actions.push({
        type: "escalation_raised",
        description: `DPA lipsă: ${review.vendorName} — procesează date personale ca processor fără DPA. Non-conformitate Art. 28 GDPR.`,
        targetId: review.id,
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  // 4. Unknown transfer mechanism for vendors with personal data
  for (const review of reviews) {
    if (!review.context) continue

    const sendsPersonalData = review.context.sendsPersonalData === "yes"
    const unknownTransfer = review.context.hasTransferMechanism === "unknown"

    if (sendsPersonalData && unknownTransfer && review.status !== "closed") {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `Mecanism transfer necunoscut: ${review.vendorName} — date personale transferate fără mecanism identificat (Schrems II).`,
        targetId: review.id,
        approvalLevel: 2,
        autoApplied: false,
      })
    }
  }

  // 5. AI vendors without proper review
  const aiVendors = reviews.filter((r) => r.category === "ai")
  for (const review of aiVendors) {
    if (review.reviewCase !== "C" && review.status !== "closed") {
      // AI vendor not classified as AI use case
      continue
    }
    // AI vendor closed without evidence
    if (review.status === "closed" && (!review.evidenceItems || review.evidenceItems.length === 0)) {
      issuesFound++
      actions.push({
        type: "alert_created",
        description: `Vendor AI fără dovadă: ${review.vendorName} — review închis fără evidențe atașate.`,
        targetId: review.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 6. Case D reviews (incomplete information) — escalate
  const caseDReviews = reviews.filter((r) => r.reviewCase === "D" && r.status !== "closed")
  for (const review of caseDReviews) {
    issuesFound++
    actions.push({
      type: "escalation_raised",
      description: `Review incomplet: ${review.vendorName} — informații insuficiente (Caz D). Completare context necesară.`,
      targetId: review.id,
      approvalLevel: 2,
      autoApplied: false,
    })
  }

  // 7. High-risk vendor concentration (>3 critical/high urgency vendors)
  const highRiskCount = reviews.filter(
    (r) => (r.urgency === "critical" || r.urgency === "high") && r.status !== "closed",
  ).length
  if (highRiskCount >= 3) {
    itemsScanned++
    issuesFound++
    actions.push({
      type: "notification_sent",
      description: `Concentrare risc furnizori: ${highRiskCount} vendori cu urgență critică/ridicată activi. Evaluare prioritară recomandată.`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 8. Cross-reference with AI inventory
  const aiSystems = input.state.aiSystems ?? []
  if (aiSystems.length > 0 && aiVendors.length === 0) {
    itemsScanned++
    issuesFound++
    actions.push({
      type: "finding_created",
      description: `${aiSystems.length} sistem(e) AI inventariate, dar niciun vendor AI evaluat. Adăugați vendorii AI în registru.`,
      targetId: "ai-vendor-gap",
      approvalLevel: 2,
      autoApplied: false,
    })
  }

  const reasoning = buildReasoning(actions, issuesFound, itemsScanned, reviews.length)

  return {
    agentType: "vendor_risk",
    runId,
    status: actions.some((a) => !a.autoApplied) ? "awaiting_approval" : "completed",
    actions,
    confidence: issuesFound === 0 ? 0.9 : issuesFound <= 3 ? 0.75 : 0.6,
    reasoning,
    startedAtISO,
    completedAtISO: new Date().toISOString(),
    metrics: {
      itemsScanned,
      issuesFound,
      actionsAutoApplied: actions.filter((a) => a.autoApplied).length,
      actionsPendingApproval: actions.filter((a) => !a.autoApplied).length,
    },
  }
}

// ── Reasoning builder ────────────────────────────────────────────────────────

function buildReasoning(
  actions: AgentAction[],
  issues: number,
  scanned: number,
  totalVendors: number,
): string {
  const parts: string[] = []
  parts.push(`Evaluat ${totalVendors} vendor review-uri (${scanned} verificări efectuate).`)

  if (issues === 0) {
    parts.push("Nu au fost detectate probleme. Toți vendorii sunt conformi.")
  } else {
    parts.push(`${issues} probleme detectate.`)

    const overdue = actions.filter((a) => a.type === "review_triggered").length
    const dpa = actions.filter((a) => a.description.includes("DPA lipsă")).length
    const stale = actions.filter((a) => a.description.includes("stagnant")).length
    const gaps: string[] = []
    if (overdue > 0) gaps.push(`${overdue} revalidări depășite`)
    if (dpa > 0) gaps.push(`${dpa} DPA lipsă`)
    if (stale > 0) gaps.push(`${stale} review-uri stagnante`)
    if (gaps.length > 0) parts.push(`Detalii: ${gaps.join(", ")}.`)

    const pending = actions.filter((a) => !a.autoApplied).length
    if (pending > 0) parts.push(`${pending} acțiuni necesită aprobare umană.`)
  }

  return parts.join(" ")
}
