// ANAF Signals Phase D — D3: Routing / Prioritization Agent Rail
// Pure functions for client prioritization and next-best-action routing.
// Input: sector risk, org profile, findings severity, queue state.
// Output: priority scores, urgency queue placement, next-best-action suggestions.
// No dependency on V6 agent types — standalone module.

import type { ScanFinding } from "@/lib/compliance/types"
import type { OrgProfile } from "@/lib/compliance/applicability"
import type { SectorRiskProfile } from "@/lib/compliance/sector-risk"
import { evaluateSectorRisk } from "@/lib/compliance/sector-risk"
import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import { computeCountdown } from "@/lib/compliance/etva-discrepancy"
import type { FilingDisciplineScore } from "@/lib/compliance/filing-discipline"

// ── Types ────────────────────────────────────────────────────────────────────

export type ClientPriority = {
  orgId: string
  priorityScore: number       // 0-100, higher = more urgent
  urgencyTier: "critical" | "high" | "medium" | "low"
  factors: PriorityFactor[]
  nextBestAction: NextBestAction | null
}

export type PriorityFactor = {
  source: string
  weight: number              // contribution to total score
  detail: string
}

export type NextBestAction = {
  action: string
  reason: string
  priority: "critical" | "high" | "medium"
  href?: string               // UI navigation hint
}

export type QueuePlacement = {
  orgId: string
  queue: "urgent" | "standard" | "monitoring"
  reason: string
  movedAtISO: string
}

// ── Priority scoring ─────────────────────────────────────────────────────────

/**
 * Compute priority score for an organization.
 * Aggregates signals from sector risk, findings, discrepancies, filing discipline.
 */
export function computeClientPriority(input: {
  orgId: string
  orgProfile?: OrgProfile
  findings: ScanFinding[]
  discrepancies: ETVADiscrepancy[]
  filingDiscipline: FilingDisciplineScore
  nowISO: string
}): ClientPriority {
  const { orgId, orgProfile, findings, discrepancies, filingDiscipline, nowISO } = input
  const factors: PriorityFactor[] = []

  // Factor 1: Sector risk
  let sectorWeight = 0
  if (orgProfile?.sector) {
    const sectorProfile = evaluateSectorRisk(orgProfile.sector)
    if (sectorProfile.vigilanceLevel === "high") {
      sectorWeight = 20
      factors.push({ source: "sector_risk", weight: 20, detail: `Sector ANAF high-vigilance: ${orgProfile.sector}` })
    } else if (sectorProfile.vigilanceLevel === "elevated") {
      sectorWeight = 10
      factors.push({ source: "sector_risk", weight: 10, detail: `Sector ANAF elevated: ${orgProfile.sector}` })
    }
  }

  // Factor 2: Critical/high findings
  const criticalFindings = findings.filter((f) => f.severity === "critical").length
  const highFindings = findings.filter((f) => f.severity === "high").length
  const findingsWeight = Math.min(30, criticalFindings * 15 + highFindings * 5)
  if (findingsWeight > 0) {
    factors.push({
      source: "findings_severity",
      weight: findingsWeight,
      detail: `${criticalFindings} findings critice, ${highFindings} high`,
    })
  }

  // Factor 3: e-TVA discrepancies — overdue ones are very heavy
  let discrepancyWeight = 0
  const overdueDiscs = discrepancies.filter((d) => {
    const c = computeCountdown(d, nowISO)
    return c.isOverdue
  })
  const urgentDiscs = discrepancies.filter((d) => {
    const c = computeCountdown(d, nowISO)
    return !c.isOverdue && c.daysRemaining !== null && c.daysRemaining <= 5
  })

  if (overdueDiscs.length > 0) {
    discrepancyWeight = Math.min(25, overdueDiscs.length * 15)
    factors.push({
      source: "etva_discrepancy",
      weight: discrepancyWeight,
      detail: `${overdueDiscs.length} discrepanțe e-TVA cu termen depășit`,
    })
  } else if (urgentDiscs.length > 0) {
    discrepancyWeight = Math.min(15, urgentDiscs.length * 8)
    factors.push({
      source: "etva_discrepancy",
      weight: discrepancyWeight,
      detail: `${urgentDiscs.length} discrepanțe e-TVA urgente (≤5 zile)`,
    })
  }

  // Factor 4: Filing discipline
  let filingWeight = 0
  if (filingDiscipline.total > 0) {
    if (filingDiscipline.score < 40) {
      filingWeight = 20
      factors.push({
        source: "filing_discipline",
        weight: 20,
        detail: `Disciplină declarații critică: ${filingDiscipline.score}/100`,
      })
    } else if (filingDiscipline.score < 60) {
      filingWeight = 10
      factors.push({
        source: "filing_discipline",
        weight: 10,
        detail: `Disciplină declarații slabă: ${filingDiscipline.score}/100`,
      })
    }
  }

  const priorityScore = Math.min(100, sectorWeight + findingsWeight + discrepancyWeight + filingWeight)

  const urgencyTier: ClientPriority["urgencyTier"] =
    priorityScore >= 70
      ? "critical"
      : priorityScore >= 45
        ? "high"
        : priorityScore >= 20
          ? "medium"
          : "low"

  // Next best action
  const nextBestAction = determineNextBestAction(
    overdueDiscs,
    urgentDiscs,
    criticalFindings,
    filingDiscipline,
  )

  return { orgId, priorityScore, urgencyTier, factors, nextBestAction }
}

// ── Next best action ─────────────────────────────────────────────────────────

function determineNextBestAction(
  overdueDiscs: ETVADiscrepancy[],
  urgentDiscs: ETVADiscrepancy[],
  criticalFindings: number,
  filingDiscipline: FilingDisciplineScore,
): NextBestAction | null {
  // Priority 1: Overdue e-TVA discrepancies
  if (overdueDiscs.length > 0) {
    return {
      action: `Răspunde urgent la ${overdueDiscs.length} discrepanță/discrepanțe e-TVA cu termen depășit`,
      reason: "Termenele ANAF depășite pot declanșa control fiscal.",
      priority: "critical",
      href: "/dashboard/scan",
    }
  }

  // Priority 2: Urgent e-TVA discrepancies
  if (urgentDiscs.length > 0) {
    return {
      action: `Pregătește răspunsuri pentru ${urgentDiscs.length} discrepanță/discrepanțe e-TVA (≤5 zile)`,
      reason: "Termenele se apropie — acționează acum.",
      priority: "high",
      href: "/dashboard/scan",
    }
  }

  // Priority 3: Critical findings
  if (criticalFindings > 0) {
    return {
      action: `Rezolvă ${criticalFindings} finding-uri critice`,
      reason: "Finding-urile critice necesită acțiune imediată.",
      priority: "critical",
      href: "/dashboard/monitorizare/conformitate",
    }
  }

  // Priority 4: Poor filing discipline
  if (filingDiscipline.total > 0 && filingDiscipline.score < 40) {
    return {
      action: `Depune declarațiile lipsă (${filingDiscipline.missing} lipsă)`,
      reason: `Scor disciplină: ${filingDiscipline.score}/100 — risc de amenzi.`,
      priority: "high",
      href: "/dashboard/scan",
    }
  }

  return null
}

// ── Queue placement ──────────────────────────────────────────────────────────

/**
 * Determine queue placement for a client based on priority.
 */
export function determineQueuePlacement(
  priority: ClientPriority,
  nowISO: string,
): QueuePlacement {
  if (priority.urgencyTier === "critical") {
    return {
      orgId: priority.orgId,
      queue: "urgent",
      reason: `Scor prioritate ${priority.priorityScore}/100 (critic): ${priority.factors.map((f) => f.detail).join("; ")}`,
      movedAtISO: nowISO,
    }
  }

  if (priority.urgencyTier === "high") {
    return {
      orgId: priority.orgId,
      queue: "urgent",
      reason: `Scor prioritate ${priority.priorityScore}/100 (ridicat): ${priority.factors.map((f) => f.detail).join("; ")}`,
      movedAtISO: nowISO,
    }
  }

  if (priority.urgencyTier === "medium") {
    return {
      orgId: priority.orgId,
      queue: "standard",
      reason: `Scor prioritate ${priority.priorityScore}/100 (mediu)`,
      movedAtISO: nowISO,
    }
  }

  return {
    orgId: priority.orgId,
    queue: "monitoring",
    reason: `Scor prioritate ${priority.priorityScore}/100 (scăzut) — monitorizare pasivă`,
    movedAtISO: nowISO,
  }
}

// ── Batch prioritization ─────────────────────────────────────────────────────

/**
 * Prioritize a batch of clients, sorted by urgency.
 */
export function prioritizeClientBatch(
  clients: Array<{
    orgId: string
    orgProfile?: OrgProfile
    findings: ScanFinding[]
    discrepancies: ETVADiscrepancy[]
    filingDiscipline: FilingDisciplineScore
  }>,
  nowISO: string,
): ClientPriority[] {
  return clients
    .map((c) => computeClientPriority({ ...c, nowISO }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
}
