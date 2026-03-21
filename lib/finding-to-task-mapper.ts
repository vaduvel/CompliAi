// B2 — Finding → Task → Evidence Linkage Automat
// Maps confirmed findings to task candidates (RemediationAction with status 'candidate').
// Each task has: owner candidate, evidence expectation, document trigger, deadline.

import type {
  ScanFinding,
  RemediationAction,
  FindingCategory,
  TaskEvidenceKind,
} from "@/lib/compliance/types"
import type { ComplianceSeverity } from "@/lib/compliance/constitution"
import { severityToTaskPriority } from "@/lib/compliance/constitution"

// ── Owner mapping per framework ─────────────────────────────────────────────

const OWNER_MAP: Record<FindingCategory, string> = {
  GDPR: "DPO / Responsabil conformitate",
  NIS2: "CISO / Responsabil securitate",
  EU_AI_ACT: "CTO / Manager AI",
  E_FACTURA: "Contabil / FinOps",
}

// ── Deadline calculation ────────────────────────────────────────────────────

const DEADLINE_DAYS: Record<ComplianceSeverity, number> = {
  critical: 7,
  high: 14,
  medium: 30,
  low: 60,
}

function calculateDeadline(severity: ComplianceSeverity): string {
  const d = new Date()
  d.setDate(d.getDate() + (DEADLINE_DAYS[severity] ?? 30))
  return d.toISOString()
}

// ── Score impact estimation ─────────────────────────────────────────────────

function estimateScoreDelta(severity: ComplianceSeverity): number {
  switch (severity) {
    case "critical": return -15
    case "high": return -8
    case "medium": return -4
    case "low": return -2
    default: return -3
  }
}

// ── Evidence type inference ─────────────────────────────────────────────────

function inferEvidenceTypes(finding: ScanFinding): TaskEvidenceKind[] {
  if (finding.evidenceTypes && finding.evidenceTypes.length > 0) {
    return finding.evidenceTypes
  }

  // Default evidence types by category
  switch (finding.category) {
    case "GDPR":
      return ["policy_text", "screenshot"]
    case "NIS2":
      return ["document_bundle", "policy_text"]
    case "EU_AI_ACT":
      return ["policy_text", "screenshot"]
    case "E_FACTURA":
      return ["screenshot", "log_export"]
    default:
      return ["policy_text"]
  }
}

// ── Main mapper ─────────────────────────────────────────────────────────────

export type TaskCandidate = RemediationAction & {
  findingId: string
  suggestedOwner: string
  effort: "high" | "medium" | "low"
  deadline: string
  evidenceNeeded: string
  documentTrigger: string | null
  scoreDelta: number
  status: "candidate"
  source: "auto-generated"
  confidence: number
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function mapFindingToTask(finding: ScanFinding): TaskCandidate {
  const severity = finding.severity
  const category = finding.category

  return {
    // RemediationAction base fields
    id: uid("task"),
    title: `Rezolvă: ${finding.title}`,
    priority: severityToTaskPriority(severity),
    severity,
    remediationMode: severity === "critical" || severity === "high" ? "rapid" : "structural",
    principles: finding.principles,
    owner: OWNER_MAP[category] ?? "Responsabil general",
    dueDate: calculateDeadline(severity),
    why: finding.detail,
    actions: finding.remediationHint ? [finding.remediationHint] : ["Verifică și rezolvă problema identificată."],
    evidence: finding.evidenceRequired ?? "Document justificativ",
    sourceDocument: finding.sourceDocument,
    detectedIssue: finding.title,
    triggerSnippet: finding.sourceParagraph ?? finding.provenance?.excerpt,
    lawReference: finding.legalReference,
    readyTextLabel: finding.readyTextLabel,
    readyText: finding.readyText,
    relatedFindingIds: [finding.id],
    evidenceTypes: inferEvidenceTypes(finding),
    // TaskCandidate extension fields
    findingId: finding.id,
    suggestedOwner: OWNER_MAP[category] ?? "Responsabil general",
    effort: severity === "critical" ? "high" : severity === "high" ? "high" : "medium",
    deadline: calculateDeadline(severity),
    evidenceNeeded: finding.evidenceRequired ?? "Document justificativ",
    documentTrigger: finding.suggestedDocumentType ?? null,
    scoreDelta: estimateScoreDelta(severity),
    status: "candidate",
    source: "auto-generated",
    confidence: finding.confidenceScore ?? 50,
  }
}

/**
 * Map multiple findings to task candidates, deduplicating by finding ID.
 */
export function mapFindingsToTasks(findings: ScanFinding[]): TaskCandidate[] {
  const seen = new Set<string>()
  const tasks: TaskCandidate[] = []

  for (const finding of findings) {
    if (seen.has(finding.id)) continue
    seen.add(finding.id)
    tasks.push(mapFindingToTask(finding))
  }

  return tasks
}
