import type {
  AISystemDetectionStatus,
  AISystemDiscoveryMethod,
  AISystemRiskLevel,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
  TaskValidationStatus,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type { CompliancePrinciple, ComplianceSeverity } from "@/lib/compliance/constitution"
import type { CompliScanRegulatoryArea } from "@/lib/compliscan/schema"

export type AICompliancePackReadiness = "draft" | "review_required" | "audit_ready"
export type AICompliancePackSourceOrigin = "document" | "manifest" | "yaml"
export type AICompliancePackFieldStatus = "confirmed" | "inferred" | "missing"
export type AICompliancePackConfidenceState = "detected" | "inferred" | "confirmed_by_user"
export type AICompliancePackFieldConfidenceState = AICompliancePackConfidenceState | "missing"
export type AICompliancePackEvidenceBundleStatus = "bundle_ready" | "partial" | "missing_evidence"

export type AICompliancePackFieldKey =
  | "provider"
  | "model"
  | "purpose"
  | "risk_class"
  | "personal_data"
  | "human_oversight"
  | "data_residency"
  | "retention_days"
  | "legal_mapping"

export type AICompliancePackSourceRef = {
  id: string
  name: string
  scannedAt: string
  origin: AICompliancePackSourceOrigin
  prefilledFields: string[]
}

export type AICompliancePackFieldRef = {
  field: AICompliancePackFieldKey
  label: string
  value: string | null
  status: AICompliancePackFieldStatus
  sources: AICompliancePackSourceOrigin[]
  confidence: "low" | "medium" | "high"
  userConfirmed: boolean
  lastUpdatedAtISO?: string | null
  confidenceModel: {
    state: AICompliancePackFieldConfidenceState
    reason: string
  }
}

export type AICompliancePackEvidenceBundle = {
  status: AICompliancePackEvidenceBundleStatus
  requiredItems: number
  attachedItems: number
  validatedItems: number
  pendingItems: number
  evidenceKinds: TaskEvidenceKind[]
  lawReferences: string[]
  files: string[]
  controls: Array<{
    taskId: string
    title: string
    lawReference: string | null
    remediationMode: "rapid" | "structural"
    status: "covered" | "partial" | "missing"
    validationStatus: TaskValidationStatus
    evidenceKinds: TaskEvidenceKind[]
    files: string[]
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
    evidenceKinds: TaskEvidenceKind[]
    lawReferences: string[]
    includedFiles: string[]
    reuseAvailable: boolean
    reusePolicy: string
    status: "covered" | "partial" | "missing"
  }>
}

export type AIComplianceSuggestedControl = {
  key: string
  title: string
  rationale: string
  evidence: string
  lawReference: string | null
  priority: "P1" | "P2" | "P3"
  source: "task" | "pack_inference"
  systemGroup: string | null
  ownerRoute?: string | null
  businessImpact?: string | null
  bundleHint?: string | null
  controlFamily: {
    key: string
    label: string
  } | null
}

export type AICompliancePackTraceSummary = {
  controlsCovered: number
  validatedControls: number
  linkedFindings: number
  linkedDrifts: number
  linkedLegalReferences: number
  baselineLinked: boolean
  traceStatus: "validated" | "evidence_required" | "action_required"
}

export type AICompliancePackEntry = {
  id: string
  systemId: string
  systemName: string
  readiness: AICompliancePackReadiness
  discoveryMethod: AISystemDiscoveryMethod
  detectionStatus: AISystemDetectionStatus
  confidence: "low" | "medium" | "high"
  confidenceModel: {
    state: AICompliancePackConfidenceState
    reason: string
  }
  identity: {
    provider: string
    model: string
    purpose: string
    frameworks: string[]
  }
  governance: {
    riskClass: AISystemRiskLevel
    personalDataUsed: boolean
    automatedDecisions: boolean
    impactsRights: boolean
    humanReviewRequired: boolean
    humanReviewPresent: boolean
    dataResidency: string | null
    retentionDays: number | null
    owner: string
  }
  compliance: {
    principles: CompliancePrinciple[]
    regulatoryAreas: CompliScanRegulatoryArea[]
    highestSeverity: ComplianceSeverity | null
    openFindings: number
    openDrifts: number
    legalReferences: string[]
    requiredControls: string[]
    suggestedControls: AIComplianceSuggestedControl[]
  }
  evidence: {
    attachedCount: number
    validatedCount: number
    missingCount: number
    missingItems: string[]
    latestEvidence?: TaskEvidenceAttachment
    validationStatus: TaskValidationStatus
  }
  evidenceBundle: AICompliancePackEvidenceBundle
  traceSummary: AICompliancePackTraceSummary
  sourceSignals: {
    capabilities: string[]
    dataCategories: string[]
    residencySignals: string[]
    oversightSignals: string[]
  }
  prefill: {
    completenessScore: number
    filledFields: string[]
    missingFields: string[]
    fieldStatus: AICompliancePackFieldRef[]
  }
  annexLiteDraft: {
    systemDescription: string
    systemScope: string
    intendedPurpose: string
    intendedUsersAndAffectedPersons: string
    dataAndGovernance: string
    riskAndRightsImpact: string
    humanOversight: string
    technicalDependencies: string
    monitoringAndControls: string
    evidenceAndValidation: string
  }
  sources: AICompliancePackSourceRef[]
  suggestedNextStep: string
}

export type AICompliancePack = {
  version: "4.0"
  generatedAt: string
  workspace: Pick<WorkspaceContext, "orgId" | "orgName" | "workspaceLabel" | "workspaceOwner">
  snapshotId: string | null
  comparedToSnapshotId: string | null
  summary: {
    totalEntries: number
    auditReadyEntries: number
    reviewRequiredEntries: number
    openFindings: number
    openDrifts: number
    missingEvidenceItems: number
    averageCompletenessScore: number
    annexLiteReadyEntries: number
    bundleReadyEntries: number
    confidenceCoverage: {
      detected: number
      inferred: number
      confirmedByUser: number
    }
    fieldConfidenceCoverage: {
      confirmed: number
      inferred: number
      missing: number
    }
    sourceCoverage: {
      document: number
      manifest: number
      yaml: number
    }
  }
  entries: AICompliancePackEntry[]
}
