// V6 — Compliance Monitor Agent
// Scan continuu: expirări documente, assessments stale, vendor reviews expirate,
// findings fără dovadă, training expirat, degradare scor.
// Extinde Health Check V3 cu acțiuni agentice.

import type { ComplianceState } from "@/lib/compliance/types"
import { runHealthCheck, type HealthCheckResult } from "@/lib/compliance/health-check"
import {
  generateRunId,
  type AgentAction,
  type AgentOutput,
} from "@/lib/compliance/agentic-engine"

// Minimal vendor review shape — avoids hard dependency on V5 vendor-review-engine.
// When V5 is merged, these can be replaced with the canonical imports.
type VendorReview = {
  id: string
  vendorName: string
  status: string
  nextReviewDueISO?: string
}

function isReviewOverdue(review: VendorReview): boolean {
  if (review.status !== "closed" || !review.nextReviewDueISO) return false
  return new Date(review.nextReviewDueISO).getTime() < Date.now()
}

// ── Types ────────────────────────────────────────────────────────────────────

export type ComplianceMonitorInput = {
  orgId: string
  state: ComplianceState
  vendorReviews: VendorReview[]
  lastGeneratedDocs?: Array<{ type: string; generatedAtISO: string }>
  nowISO: string
}

// ── Agent logic ──────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const DOCUMENT_EXPIRY_DAYS = 365 // 12 months

function daysSince(isoDate: string | undefined | null, nowMs: number): number | null {
  if (!isoDate) return null
  const d = new Date(isoDate).getTime()
  if (isNaN(d)) return null
  return Math.floor((nowMs - d) / MS_PER_DAY)
}

export function runComplianceMonitor(input: ComplianceMonitorInput): AgentOutput {
  const runId = generateRunId("compliance_monitor")
  const startedAtISO = new Date().toISOString()
  const actions: AgentAction[] = []
  const nowMs = new Date(input.nowISO).getTime()
  let itemsScanned = 0
  let issuesFound = 0

  // 1. Run standard health check
  const healthCheck = runHealthCheck(input.state, input.nowISO)
  itemsScanned += healthCheck.items.length

  // Auto-create findings for critical health check items
  for (const item of healthCheck.items) {
    if (item.status === "critical") {
      issuesFound++
      actions.push({
        type: "finding_created",
        description: `Health check critic: ${item.title} — ${item.detail}`,
        targetId: item.id,
        approvalLevel: 1,
        autoApplied: true,
      })
      actions.push({
        type: "notification_sent",
        description: `Alertă: ${item.title}`,
        targetId: item.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    } else if (item.status === "warning") {
      issuesFound++
      actions.push({
        type: "alert_created",
        description: `Atenționare: ${item.title} — ${item.detail}`,
        targetId: item.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 2. Check vendor reviews for overdue
  for (const review of input.vendorReviews) {
    itemsScanned++
    if (isReviewOverdue(review)) {
      issuesFound++
      actions.push({
        type: "review_triggered",
        description: `Vendor review expirat: ${review.vendorName} — revalidare necesară.`,
        targetId: review.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 3. Check for stale NIS2 assessment (>180 days)
  const assessmentAge = daysSince(
    (input.state as Record<string, unknown>).nis2AssessmentCompletedAt as string | undefined,
    nowMs,
  )
  if (assessmentAge !== null && assessmentAge > 180) {
    itemsScanned++
    issuesFound++
    actions.push({
      type: "finding_created",
      description: `Evaluarea NIS2 are ${assessmentAge} zile — re-evaluare recomandată (>6 luni).`,
      targetId: "nis2-assessment-stale",
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // 4. Check high-severity findings without evidence
  const criticalFindings = (input.state.findings ?? []).filter(
    (f) => (f.severity === "critical" || f.severity === "high") && !f.resolution?.closureEvidence,
  )
  for (const finding of criticalFindings) {
    itemsScanned++
    const taskState = (input.state as Record<string, unknown>).taskState as
      | Record<string, { attachedEvidence?: string[] }> | undefined
    const evidence = taskState?.[finding.id]?.attachedEvidence
    if (!evidence || evidence.length === 0) {
      issuesFound++
      actions.push({
        type: "alert_created",
        description: `Finding ${finding.severity}: "${finding.title}" — lipsesc dovezi.`,
        targetId: finding.id,
        approvalLevel: 1,
        autoApplied: true,
      })
    }
  }

  // 5. Check document expiry (if generated docs metadata available)
  if (input.lastGeneratedDocs) {
    for (const doc of input.lastGeneratedDocs) {
      itemsScanned++
      const age = daysSince(doc.generatedAtISO, nowMs)
      if (age !== null && age > DOCUMENT_EXPIRY_DAYS) {
        issuesFound++
        actions.push({
          type: "document_drafted",
          description: `Documentul "${doc.type}" a expirat (${age} zile) — regenerare recomandată.`,
          targetId: doc.type,
          approvalLevel: 2, // needs human approval
          autoApplied: false,
        })
      }
    }
  }

  // 6. Score degradation check
  const currentScore = healthCheck.score
  if (currentScore < 40) {
    actions.push({
      type: "escalation_raised",
      description: `Scor conformitate critic: ${currentScore}%. Atenție imediată necesară.`,
      approvalLevel: 1,
      autoApplied: true,
    })
  } else if (currentScore < 60) {
    actions.push({
      type: "notification_sent",
      description: `Scor conformitate în declin: ${currentScore}%. Verifică problemele deschise.`,
      approvalLevel: 1,
      autoApplied: true,
    })
  }

  // Build reasoning
  const reasoning = buildReasoning(healthCheck, actions, issuesFound, itemsScanned)

  return {
    agentType: "compliance_monitor",
    runId,
    status: "completed",
    actions,
    confidence: healthCheck.score >= 70 ? 0.9 : healthCheck.score >= 40 ? 0.75 : 0.6,
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

function buildReasoning(
  hc: HealthCheckResult,
  actions: AgentAction[],
  issues: number,
  scanned: number,
): string {
  const parts: string[] = []
  parts.push(`Scanat ${scanned} elemente de conformitate.`)

  if (issues === 0) {
    parts.push("Nu au fost detectate probleme noi. Stare de sănătate OK.")
  } else {
    parts.push(`${issues} probleme detectate.`)
    const autoApplied = actions.filter((a) => a.autoApplied).length
    const pending = actions.filter((a) => !a.autoApplied).length
    if (autoApplied > 0) parts.push(`${autoApplied} acțiuni aplicate automat.`)
    if (pending > 0) parts.push(`${pending} acțiuni necesită aprobare umană.`)
  }

  parts.push(`Scor health check: ${hc.score}% (${hc.overallStatus}).`)
  return parts.join(" ")
}
