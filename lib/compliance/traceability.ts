import type {
  EvidenceQualityAssessment,
  RemediationMode,
  ScanSourceKind,
  TaskEvidenceKind,
  TaskValidationStatus,
} from "@/lib/compliance/types"
import type { CompliancePrinciple, ComplianceSeverity } from "@/lib/compliance/constitution"
import type { ControlFamilyRef } from "@/lib/compliance/control-families"
import type {
  AuditQualityGateCode,
  AuditQualityGateDecision,
} from "@/lib/compliance/audit-quality-gates"

export type ComplianceTraceStatus = "validated" | "evidence_required" | "action_required"

export type ComplianceTraceRecord = {
  id: string
  entryKind: "control_task" | "finding_task" | "document_approval"
  entryId: string
  title: string
  severity: ComplianceSeverity
  remediationMode: RemediationMode | null
  controlFamily: ControlFamilyRef
  lawReferences: string[]
  principles: CompliancePrinciple[]
  sourceDocuments: string[]
  sourceKinds: ScanSourceKind[]
  linkedFindingIds: string[]
  linkedDriftIds: string[]
  linkedAlertIds: string[]
  findingRefs: Array<{
    id: string
    title: string
    severity: ComplianceSeverity
    sourceDocument: string
    lawReferences: string[]
    status: "open" | "resolved"
  }>
  driftRefs: Array<{
    id: string
    summary: string
    severity: ComplianceSeverity
    type: "operational_drift" | "compliance_drift"
    change: string
    lawReference: string | null
    open: boolean
  }>
  evidence: {
    attached: boolean
    validationStatus: TaskValidationStatus
    validationBasis: "direct_signal" | "inferred_signal" | "operational_state" | null
    validationConfidence: "high" | "medium" | "low" | null
    fileName: string | null
    kind: TaskEvidenceKind | null
    quality: EvidenceQualityAssessment | null
    updatedAtISO: string | null
  }
  evidenceRequired: string | null
  bundleCoverageStatus: "covered" | "partial" | "missing"
  bundleFiles: string[]
  snapshotContext: {
    currentSnapshotId: string | null
    comparedToSnapshotId: string | null
    validatedBaselineSnapshotId: string | null
  }
  review: {
    confirmedByUser: boolean
    note: string | null
    updatedAtISO: string | null
  }
  traceStatus: ComplianceTraceStatus
  auditDecision: AuditQualityGateDecision
  auditGateCodes: AuditQualityGateCode[]
  nextStep: string
}
