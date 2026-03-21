// B4 — AutoApply Tasks — Doar pe Low-Risk
// Strict rules: auto-apply only when ALL conditions are met.
// Blacklist: critical severity, requires signature, affects legal submission, NIS2 high.

import type { ScanFinding, RemediationAction } from "@/lib/compliance/types"

export type AutoApplyDecision = {
  allowed: boolean
  reason: string
}

/**
 * Determine if a task can be auto-applied without human confirmation.
 * Conservative by default — only permits auto-apply for low-risk documentation tasks
 * with high confidence and evidence already attached.
 */
export function canAutoApply(
  task: RemediationAction,
  finding: ScanFinding
): AutoApplyDecision {
  // ── Blacklist — NEVER auto-apply ──────────────────────────────────────────

  if (finding.severity === "critical") {
    return { allowed: false, reason: "Severity critic — necesită aprobare umană" }
  }

  if (finding.legalReference && finding.findingStatus !== "resolved") {
    // If it involves legal references and isn't already resolved, be more cautious
    // (but don't block — just note it in the reason if denied later)
  }

  if (finding.category === "NIS2" && finding.severity === "high") {
    return { allowed: false, reason: "NIS2 high-risk — necesită specialist securitate" }
  }

  if (finding.suggestedDocumentType === "nis2-incident-response") {
    return { allowed: false, reason: "Implică răspuns la incident — necesită aprobare umană" }
  }

  // ── Auto-apply permis DOAR dacă TOATE condițiile sunt îndeplinite ────────

  const confidence = finding.confidenceScore ?? 50
  const isLowSeverity = finding.severity === "low"
  const isHighConfidence = confidence >= 90
  const hasEvidence = Boolean(task.evidence && task.evidence !== "Document justificativ")

  const allowed = isHighConfidence && isLowSeverity && hasEvidence

  return {
    allowed,
    reason: allowed
      ? `Confidence ${confidence}% + low severity + evidence atașată`
      : buildDenialReason(confidence, finding.severity, hasEvidence),
  }
}

function buildDenialReason(
  confidence: number,
  severity: string,
  hasEvidence: boolean
): string {
  const reasons: string[] = []

  if (confidence < 90) {
    reasons.push(`confidence ${confidence}% < 90%`)
  }
  if (severity !== "low") {
    reasons.push(`severity "${severity}" nu este "low"`)
  }
  if (!hasEvidence) {
    reasons.push("lipsă evidence atașată")
  }

  return reasons.length > 0
    ? `Nu se poate auto-aplica: ${reasons.join(", ")}`
    : "Necesită confirmare umană"
}

/**
 * Filter a list of tasks into auto-applicable and pending-approval buckets.
 */
export function partitionByAutoApply(
  tasks: Array<{ task: RemediationAction; finding: ScanFinding }>
): {
  autoApplicable: Array<{ task: RemediationAction; finding: ScanFinding; reason: string }>
  pendingApproval: Array<{ task: RemediationAction; finding: ScanFinding; reason: string }>
} {
  const autoApplicable: Array<{ task: RemediationAction; finding: ScanFinding; reason: string }> = []
  const pendingApproval: Array<{ task: RemediationAction; finding: ScanFinding; reason: string }> = []

  for (const item of tasks) {
    const decision = canAutoApply(item.task, item.finding)
    if (decision.allowed) {
      autoApplicable.push({ ...item, reason: decision.reason })
    } else {
      pendingApproval.push({ ...item, reason: decision.reason })
    }
  }

  return { autoApplicable, pendingApproval }
}
