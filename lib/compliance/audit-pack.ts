import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import type { AICompliancePack, AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"
import type {
  AuditQualityGateDecision,
  AuditQualityGateSummary,
} from "@/lib/compliance/audit-quality-gates"
import type { CompliancePrinciple, ComplianceSeverity } from "@/lib/compliance/constitution"
import type { ControlFamilyRef } from "@/lib/compliance/control-families"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import type {
  EvidenceQualityAssessment,
  RemediationMode,
  ComplianceDriftLifecycleStatus,
  ComplianceDriftRecord,
  ComplianceEvent,
  PersistedTaskStatus,
  TaskEvidenceAttachment,
  TaskValidationStatus,
  WorkspaceContext,
} from "@/lib/compliance/types"

export type AuditPackReadiness = "review_required" | "audit_ready"
export type AuditPackBaselineStatus = "validated" | "missing"

export type AuditPackV2 = {
  version: "2.1"
  generatedAt: string
  workspace: {
    id: string
    name: string
    label: string
    owner: string
  }
  executiveSummary: {
    complianceScore: number | null
    riskLabel: string | null
    auditReadiness: AuditPackReadiness
    baselineStatus: AuditPackBaselineStatus
    systemsInScope: number
    sourcesInScope: number
    openFindings: number
    activeDrifts: number
    remediationOpen: number
    validatedEvidenceItems: number
    missingEvidenceItems: number
    evidenceLedgerSummary: {
      total: number
      sufficient: number
      weak: number
      unrated: number
    }
    auditQualityDecision: AuditQualityGateDecision
    blockedQualityGates: number
    reviewQualityGates: number
    topBlockers: string[]
    nextActions: string[]
  }
  bundleEvidenceSummary: {
    status: "bundle_ready" | "review_required"
    attachedFiles: number
    validatedFiles: number
    pendingControls: number
    readyBundles: number
    partialBundles: number
    missingBundles: number
    evidenceByKind: Array<{
      kind: string
      count: number
    }>
    lawCoverage: Array<{
      lawReference: string
      totalControls: number
      validatedControls: number
      pendingControls: number
    }>
    familyCoverage: Array<{
      familyKey: string
      familyLabel: string
      familyDescription: string
      totalControls: number
      attachedControls: number
      validatedControls: number
      pendingControls: number
      reusableEvidenceFiles: number
      reuseAvailable: boolean
      reusePolicy: string
      includedFiles: string[]
    }>
    includedFiles: string[]
  }
  scope: {
    snapshot: {
      id: string | null
      generatedAt: string | null
      comparedToSnapshotId: string | null
    }
    validatedBaseline: {
      id: string
      generatedAt: string
    } | null
    sourceCoverage: AICompliancePack["summary"]["sourceCoverage"]
    sources: Array<{
      id: string
      name: string
      type: string
      scannedAt: string
      analysisStatus: string
      extractionStatus: string
      sourceFingerprint: string
    }>
  }
  systemRegister: Array<{
    id: string
    systemName: string
    readiness: AICompliancePackEntry["readiness"]
    discoveryMethod: AICompliancePackEntry["discoveryMethod"]
    detectionStatus: AICompliancePackEntry["detectionStatus"]
    confidence: AICompliancePackEntry["confidence"]
    confidenceModel: AICompliancePackEntry["confidenceModel"]
    provider: string
    model: string
    purpose: string
    owner: string
    riskClass: string
    regulatoryAreas: string[]
    principles: CompliancePrinciple[]
    highestSeverity: ComplianceSeverity | null
    openFindings: number
    openDrifts: number
    humanReview: {
      required: boolean
      present: boolean
    }
    personalDataUsed: boolean
    prefillCompletenessScore: number
    missingPrefillFields: string[]
    evidenceStatus: {
      attachedCount: number
      validatedCount: number
      missingCount: number
      validationStatus: TaskValidationStatus
    }
    sourceRefs: AICompliancePackEntry["sources"]
    legalReferences: string[]
    requiredControls: string[]
    suggestedControls: AICompliancePackEntry["compliance"]["suggestedControls"]
    suggestedNextStep: string
    evidenceBundle: AICompliancePackEntry["evidenceBundle"]
    traceSummary: AICompliancePackEntry["traceSummary"]
  }>
  controlsMatrix: Array<{
    taskId: string
    title: string
    priority: string
    severity: ComplianceSeverity
    remediationMode: RemediationMode
    principles: CompliancePrinciple[]
    owner: string
    controlFamily: ControlFamilyRef
    lawReference: string | null
    sourceDocument: string | null
    why: string
    status: PersistedTaskStatus
    validationStatus: TaskValidationStatus
    validationMessage: string | null
    evidenceRequired: string
    evidenceTypes: string[]
    readyText: {
      label: string | null
      content: string | null
    }
    relatedFindingIds: string[]
    relatedDriftIds: string[]
    attachedEvidence: TaskEvidenceAttachment | null
    evidenceQuality: EvidenceQualityAssessment | null
    auditDecision: AuditQualityGateDecision
    auditGateCodes: string[]
    lastRescanAtISO: string | null
    validatedAtISO: string | null
  }>
  evidenceLedger: Array<{
    taskId: string
    title: string
    lawReference: string | null
    status: PersistedTaskStatus
    validationStatus: TaskValidationStatus
    validationMessage: string | null
    updatedAtISO: string
    evidence: TaskEvidenceAttachment | null
    evidenceQuality: EvidenceQualityAssessment | null
    sourceDocument: string | null
  }>
  auditQualityGates: AuditQualityGateSummary
  driftRegister: Array<{
    id: string
    type: ComplianceDriftRecord["type"]
    change: string
    severity: ComplianceSeverity
    summary: string
    severityReason: string | null
    impactSummary: string | null
    nextAction: string | null
    evidenceRequired: string | null
    lawReference: string | null
    systemLabel: string | null
    sourceDocument: string | null
    detectedAtISO: string
    escalationOwner: string | null
    escalationTier: ComplianceDriftRecord["escalationTier"] | null
    escalationSlaHours: number | null
    escalationDueAtISO: string | null
    lifecycleStatus: ComplianceDriftLifecycleStatus
    acknowledgedAtISO: string | null
    acknowledgedBy: string | null
    inProgressAtISO: string | null
    resolvedAtISO: string | null
    waivedAtISO: string | null
    waivedReason: string | null
    escalationBreachedAtISO: string | null
    lastStatusUpdatedAtISO: string | null
    blocksAudit: boolean
    blocksBaseline: boolean
    requiresHumanApproval: boolean
    open: boolean
    before: ComplianceDriftRecord["before"]
    after: ComplianceDriftRecord["after"]
    linkedTaskIds: string[]
  }>
  validationLog: Array<{
    taskId: string
    title: string
    severity: ComplianceSeverity | null
    validationStatus: TaskValidationStatus
    validationMessage: string | null
    validatedAtISO: string | null
    lastRescanAtISO: string | null
    evidence: TaskEvidenceAttachment | null
    relatedFindingIds: string[]
    relatedDriftIds: string[]
  }>
  timeline: Array<{
    id: string
    createdAtISO: string
    entityType: ComplianceEvent["entityType"]
    entityId: string
    type: string
    message: string
    actorId?: string
    actorLabel?: string
    actorRole?: ComplianceEvent["actorRole"]
    actorSource?: ComplianceEvent["actorSource"]
    metadata: Record<string, string | number | boolean> | null
  }>
  traceabilityMatrix: ComplianceTraceRecord[]
  nis2Report: {
    hasData: boolean
    assessment: {
      score: number
      maturityLabel: string
      sector: string
      savedAtISO: string
    } | null
    dnscRegistrationStatus: string
    incidents: {
      total: number
      open: number
      critical: number
      withDnscReport: number
    }
    vendors: {
      total: number
      highRisk: number
      withoutDPA: number
      techVendors: number
    }
    maturityAssessment: {
      overallScore: number
      level: string
      domains: Array<{
        name: string
        score: number
        status: string
      }>
    } | null
    boardMembers: {
      total: number
      trainingExpired: number
      certExpired: number
    }
  }
  appendix: {
    snapshot: CompliScanSnapshot | null
    validatedBaseline: CompliScanSnapshot | null
    compliancePack: AICompliancePack
  }
}

export function toAuditPackWorkspace(workspace: WorkspaceContext) {
  return {
    id: workspace.orgId,
    name: workspace.orgName,
    label: workspace.workspaceLabel,
    owner: workspace.workspaceOwner,
  }
}
