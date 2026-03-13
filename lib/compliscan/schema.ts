import type {
  AISystemRiskLevel,
  ScanAnalysisStatus,
  ScanExtractionMethod,
  ScanExtractionStatus,
} from "@/lib/compliance/types"

export type CompliScanSourceType = "document" | "policy_web" | "codebase"
export type CompliScanDiscoveryMethod = "manual" | "auto" | "hybrid"
export type CompliScanDetectionStatus =
  | "detected"
  | "reviewed"
  | "confirmed"
  | "rejected"
export type CompliScanConfidence = "low" | "medium" | "high"
export type CompliScanRegulatoryArea = "gdpr" | "eu_ai_act" | "e_factura"
export type CompliScanSeverity = "critical" | "high" | "medium" | "low"
export type CompliScanFindingStatus = "open" | "resolved"
export type CompliScanSystemStatus = "active" | "review_required" | "archived"
export type CompliScanDriftType = "operational_drift" | "compliance_drift"
export type CompliScanRiskLabel = "low" | "medium" | "high"
export type CompliScanPrinciple =
  | "oversight"
  | "robustness"
  | "privacy_data_governance"
  | "transparency"
  | "fairness"
  | "accountability"

export type CompliScanSource = {
  id: string
  type: CompliScanSourceType
  name: string
  path: string | null
  scannedAt: string
  hash: string | null
  sourceFingerprint: string
  analysisStatus: ScanAnalysisStatus
  extractionStatus: ScanExtractionStatus
  extractionMethod: ScanExtractionMethod | null
  previewSnippet: string
}

export type CompliScanEvidence = {
  type: "dependency" | "document_excerpt" | "metadata"
  value: string
  sourceId?: string | null
}

export type CompliScanSystem = {
  id: string
  systemName: string
  sourceIds: string[]
  discoveryMethod: CompliScanDiscoveryMethod
  detectionStatus: CompliScanDetectionStatus
  confidence: CompliScanConfidence
  provider: string
  model: string
  frameworks: string[]
  purpose: string
  riskClass: AISystemRiskLevel
  dataUsed: string[]
  personalDataUsed: boolean
  automatedDecisions: boolean
  impactsRights: boolean
  humanReview: {
    required: boolean
    present: boolean
  }
  owner: string
  status: CompliScanSystemStatus
  lastReviewedAt: string
  evidence: CompliScanEvidence[]
  principles: CompliScanPrinciple[]
}

export type CompliScanFinding = {
  id: string
  systemId?: string
  sourceId?: string
  issue: string
  severity: CompliScanSeverity
  principle: CompliScanPrinciple
  regulatoryArea: CompliScanRegulatoryArea
  evidence: string
  recommendedFix: string
  owner: string
  status: CompliScanFindingStatus
  detectedAt: string
  legalReference?: string
  tags: string[]
}

export type CompliScanDrift = {
  id: string
  snapshotId: string
  comparedToSnapshotId: string | null
  type: CompliScanDriftType
  change: string
  severity: CompliScanSeverity
  systemId?: string
  sourceId?: string
  detectedAt: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

export type CompliScanSnapshot = {
  version: "1.0"
  snapshotId: string
  comparedToSnapshotId: string | null
  generatedAt: string
  workspace: {
    id: string
    name: string
    label: string
    owner: string
  }
  sources: CompliScanSource[]
  systems: CompliScanSystem[]
  findings: CompliScanFinding[]
  drift: CompliScanDrift[]
  summary: {
    complianceScore: number
    riskLabel: CompliScanRiskLabel
    openFindings: number
    openAlerts: number
    systemsDetected: number
    highRiskSystems: number
  }
}
