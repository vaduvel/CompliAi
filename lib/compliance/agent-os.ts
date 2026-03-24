export type AgentKind = "intake" | "findings" | "drift" | "evidence" | "audit_prep"

export type SourceEnvelopeType = "document" | "manifest" | "text" | "yaml"

export type AgentRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled"
export type AgentProposalStatus = "draft" | "proposed" | "confirmed" | "rejected"
export type AgentProposalConfidence = "high" | "medium" | "low"
export type HumanReviewState =
  | "needs_review"
  | "partially_confirmed"
  | "confirmed"
  | "rejected"

export type SourceFieldStatus = "detected" | "inferred" | "missing" | "confirmed_by_user"

export type SourceEnvelope = {
  sourceId: string
  orgId: string
  sourceName: string
  sourceType: SourceEnvelopeType
  sourceSignals: string[]
  rawText?: string
  parsedManifest?: Record<string, unknown>
  parsedYaml?: Record<string, unknown>
  createdAtISO?: string
  extractedAtISO?: string
  scanId?: string
}

export type IntakeSystemProposal = {
  tempId: string
  systemName: string
  provider?: string
  model?: string
  purpose?: string
  riskClassSuggested?: "minimal" | "limited" | "high"
  dataUsed: string[]
  humanOversight: "required" | "present" | "missing" | "unknown"
  fieldStatus: {
    provider: SourceFieldStatus
    model: SourceFieldStatus
    purpose: SourceFieldStatus
    risk_class: SourceFieldStatus
  }
  sourceSignals: string[]
  confidence: AgentProposalConfidence
}

export type IntakeProposal = {
  proposedSystems: IntakeSystemProposal[]
  sourceSummary: string
}

export type FindingProposal = {
  findingId: string
  issue: string
  severity: "critical" | "high" | "medium" | "low"
  principle: string
  evidence: string[]
  recommendedFix: string
  lawReference?: string
  ownerSuggestion?: string
  rationale: string
  confidence: AgentProposalConfidence
  sourceSignals: string[]
}

export type DriftProposal = {
  driftId: string
  driftType: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  severity: "critical" | "high" | "medium" | "low"
  impactSummary: string
  nextAction: string
  evidenceRequired: string[]
  lawReference?: string
  rationale: string
}

export type EvidenceProposal = {
  auditReadiness: "ready" | "partial" | "blocked"
  missingEvidence: string[]
  reusableEvidenceIds: string[]
  controlCoverage: Array<{
    controlId: string
    status: "covered" | "partial" | "missing"
  }>
  executiveSummaryDraft: string
  stakeholderChecklist: string[]
}

export type AuditPrepProposal = {
  status: AgentProposalStatus
  checklist: string[]
  blockers: string[]
  suggestedExports: string[]
}

export type AgentProposalBundle = {
  sourceId: string
  intake: IntakeProposal
  findings: FindingProposal[]
  drifts: DriftProposal[]
  evidence: EvidenceProposal
  auditPrep?: AuditPrepProposal
  reviewState: HumanReviewState
}

export type AgentRun = {
  id: string
  sourceId: string
  orgId: string
  kind: AgentKind
  status: AgentRunStatus
  startedAtISO: string
  completedAtISO?: string
  reviewState: HumanReviewState
  confidence?: AgentProposalConfidence
  // S2.2: hardening fields
  baselineSnapshotId?: string   // links drift to validated baseline
  evidencePersisted?: boolean   // evidence saved to vault
  repeatableRunHash?: string    // hash of inputs for dedup/replay
  driftCount?: number           // number of drifts detected
  findingCount?: number         // number of findings detected
}

export type AgentValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
  normalizedPayload: unknown
}
