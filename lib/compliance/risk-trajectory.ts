// P4 — Predictive Risk Engine (Canon item 21)
// Calculates deterministic risk trajectory based on known future events:
// document expiry, finding review dates, regulatory deadlines, vendor reviews.

import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"
import type { AgentRunLog } from "@/lib/compliance/agentic-engine"

const MS_PER_DAY = 86_400_000

function daysUntil(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.ceil((d - nowMs) / MS_PER_DAY)
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskTrajectoryPoint = {
  daysFromNow: number
  predictedScore: number
  predictedOpenFindings: number
  confidence: "high" | "medium" | "low"
}

export type IminentRisk = {
  id: string
  label: string
  triggerDaysFromNow: number
  triggerDateISO: string
  scoreImpact: number // estimated score decrease
  preventable: boolean
  preventionAction?: string
  preventionHref?: string
}

export type RiskTrajectory = {
  currentScore: number
  currentOpenFindings: number
  trajectory: RiskTrajectoryPoint[]
  iminentRisks: IminentRisk[]
  trend: "improving" | "stable" | "degrading"
  summaryLabel: string
}

// ── Known fixed regulatory deadlines ─────────────────────────────────────────

type RegDeadline = {
  id: string
  label: string
  deadlineISO: string
  scoreImpact: number
  preventionAction: string
  preventionHref: string
}

const REGULATORY_DEADLINES: RegDeadline[] = [
  {
    id: "pay-transparency-2026",
    label: "Pay Transparency — Directiva UE 2023/970",
    deadlineISO: "2026-06-07T00:00:00.000Z",
    scoreImpact: 12,
    preventionAction: "Calculează gap salarial și publică raportul",
    preventionHref: "/dashboard/pay-transparency",
  },
  {
    id: "ai-act-art5-2025",
    label: "EU AI Act Art.5 — sisteme AI interzise",
    deadlineISO: "2025-08-02T00:00:00.000Z",
    scoreImpact: 15,
    preventionAction: "Verifică inventarul AI pentru sisteme interzise",
    preventionHref: "/dashboard/sisteme",
  },
  {
    id: "ai-act-gpai-2025",
    label: "EU AI Act — modele GPAI",
    deadlineISO: "2025-08-02T00:00:00.000Z",
    scoreImpact: 8,
    preventionAction: "Clasifică modelele AI general purpose",
    preventionHref: "/dashboard/sisteme",
  },
]

// ── Main calculator ───────────────────────────────────────────────────────────

export function calculateRiskTrajectory(
  state: ComplianceState,
  agentRunLog: AgentRunLog,
  nowISO: string,
): RiskTrajectory {
  const nowMs = new Date(nowISO).getTime()
  const findings: ScanFinding[] = state.findings ?? []
  const currentOpenFindings = findings.filter(
    (f) => !f.findingStatus || f.findingStatus === "open" || f.findingStatus === "confirmed",
  ).length

  // Current score from state (healthScore or complianceScore)
  const rawState = state as Record<string, unknown>
  const currentScore = clamp(
    typeof rawState.healthScore === "number"
      ? rawState.healthScore
      : typeof rawState.complianceScore === "number"
        ? rawState.complianceScore
        : 70,
    0,
    100,
  )

  // Collect future risk events
  const riskEvents: { daysFromNow: number; scoreImpact: number; label: string }[] = []
  const iminentRisks: IminentRisk[] = []

  // 1. Document expiry (from generated docs in state)
  const generatedDocs = (rawState.generatedDocuments ?? rawState.documents ?? []) as Array<{
    documentType?: string
    generatedAtISO?: string
    nextReviewDateISO?: string
    approvalStatus?: string
  }>

  for (const doc of generatedDocs) {
    if (doc.approvalStatus !== "approved_as_evidence") continue
    const reviewDate = doc.nextReviewDateISO
    const daysLeft = daysUntil(reviewDate, nowMs)
    if (daysLeft !== null && daysLeft > 0 && daysLeft <= 90) {
      const impact = daysLeft <= 30 ? 8 : 5
      riskEvents.push({ daysFromNow: daysLeft, scoreImpact: impact, label: `Document expirat: ${doc.documentType ?? "document"}` })
      iminentRisks.push({
        id: `doc-expiry-${doc.documentType ?? "doc"}`,
        label: `Document ${doc.documentType ?? "generat"} expiră în ${daysLeft} zile`,
        triggerDaysFromNow: daysLeft,
        triggerDateISO: reviewDate!,
        scoreImpact: impact,
        preventable: true,
        preventionAction: "Regenerează și aprobă documentul",
        preventionHref: "/dashboard/generator",
      })
    }
  }

  // 2. Findings under monitoring with reviewDueAtISO
  for (const finding of findings) {
    if (finding.findingStatus !== "under_monitoring") continue
    const reviewDate = (finding as Record<string, unknown>).reviewDueAtISO as string | undefined
    const daysLeft = daysUntil(reviewDate, nowMs)
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 60) {
      const impact = finding.severity === "critical" ? 15 : finding.severity === "high" ? 10 : 5
      riskEvents.push({ daysFromNow: daysLeft, scoreImpact: impact, label: `Finding re-open: ${finding.title}` })
      iminentRisks.push({
        id: `finding-reopen-${finding.id}`,
        label: `"${finding.title}" necesită reverificare în ${daysLeft} zile`,
        triggerDaysFromNow: daysLeft,
        triggerDateISO: reviewDate!,
        scoreImpact: impact,
        preventable: true,
        preventionAction: "Reverifică finding-ul înainte de expirare",
        preventionHref: "/dashboard/resolve",
      })
    }
  }

  // 3. Regulatory deadlines
  for (const deadline of REGULATORY_DEADLINES) {
    const daysLeft = daysUntil(deadline.deadlineISO, nowMs)
    if (daysLeft === null || daysLeft < 0 || daysLeft > 180) continue

    // Check if finding already resolved
    const alreadyResolved = findings.some(
      (f) => f.id === deadline.id && f.findingStatus === "resolved",
    )
    if (alreadyResolved) continue

    riskEvents.push({ daysFromNow: daysLeft, scoreImpact: deadline.scoreImpact, label: deadline.label })
    iminentRisks.push({
      id: deadline.id,
      label: deadline.label,
      triggerDaysFromNow: daysLeft,
      triggerDateISO: deadline.deadlineISO,
      scoreImpact: deadline.scoreImpact,
      preventable: true,
      preventionAction: deadline.preventionAction,
      preventionHref: deadline.preventionHref,
    })
  }

  // 4. NIS2 vendor reviews overdue
  const vendorReviewsDue = (rawState.vendorReviews ?? []) as Array<{
    vendorName?: string
    nextReviewDueISO?: string
  }>
  for (const vendor of vendorReviewsDue) {
    const daysLeft = daysUntil(vendor.nextReviewDueISO, nowMs)
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 30) {
      riskEvents.push({ daysFromNow: daysLeft, scoreImpact: 4, label: `Vendor review: ${vendor.vendorName}` })
      iminentRisks.push({
        id: `vendor-review-${vendor.vendorName ?? "vendor"}`,
        label: `Review furnizor "${vendor.vendorName ?? "necunoscut"}" scadent în ${daysLeft} zile`,
        triggerDaysFromNow: daysLeft,
        triggerDateISO: vendor.nextReviewDueISO!,
        scoreImpact: 4,
        preventable: true,
        preventionAction: "Efectuează review-ul furnizorului",
        preventionHref: "/dashboard/vendor-review",
      })
    }
  }

  // Sort iminentRisks by trigger date
  iminentRisks.sort((a, b) => a.triggerDaysFromNow - b.triggerDaysFromNow)

  // Build trajectory for 7, 30, 90 days
  const checkpoints = [7, 30, 90]
  const trajectory: RiskTrajectoryPoint[] = checkpoints.map((days) => {
    const triggeredImpact = riskEvents
      .filter((e) => e.daysFromNow <= days)
      .reduce((sum, e) => sum + e.scoreImpact, 0)
    const predictedScore = clamp(currentScore - triggeredImpact, 0, 100)
    const newFindings = riskEvents.filter((e) => e.daysFromNow <= days).length
    return {
      daysFromNow: days,
      predictedScore,
      predictedOpenFindings: currentOpenFindings + newFindings,
      confidence: days <= 30 ? "high" : "medium",
    }
  })

  // Trend from agent run history (last 3 runs)
  const recentScores = agentRunLog.runs
    .filter((r) => r.agentType === "compliance_monitor" && r.metrics)
    .slice(-3)
    .map((r) => r.metrics!.issuesFound)

  let trend: "improving" | "stable" | "degrading" = "stable"
  if (recentScores.length >= 2) {
    const first = recentScores[0]
    const last = recentScores[recentScores.length - 1]
    if (last > first + 1) trend = "degrading"
    else if (last < first - 1) trend = "improving"
  }
  // Also check score delta
  const score30 = trajectory.find((t) => t.daysFromNow === 30)?.predictedScore ?? currentScore
  if (score30 < currentScore - 10) trend = "degrading"
  else if (score30 > currentScore + 5) trend = "improving"

  const summaryLabel =
    trend === "improving"
      ? `Scor estimat +${Math.round(score30 - currentScore)} în 30 zile`
      : trend === "degrading"
        ? `Scor estimat -${Math.round(currentScore - score30)} în 30 zile`
        : "Scor stabil în 30 zile"

  return {
    currentScore,
    currentOpenFindings,
    trajectory,
    iminentRisks: iminentRisks.slice(0, 5), // top 5
    trend,
    summaryLabel,
  }
}
