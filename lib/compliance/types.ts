import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import type { CompliancePrinciple, ComplianceSeverity } from "@/lib/compliance/constitution"
import type { OrgProfile, ApplicabilityResult } from "@/lib/compliance/applicability"
import type { FullIntakeAnswers } from "@/lib/compliance/intake-engine"
import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"

export type AlertSeverity = ComplianceSeverity
export type FindingCategory = "EU_AI_ACT" | "GDPR" | "E_FACTURA" | "NIS2"

/**
 * Validation Levels — "capture more legal prep work" strategy.
 * Level 1 = Auto-close: verificabil automat (document/camp/dovada exista).
 * Level 2 = Business confirmation: necesita confirmare interna de la admin/contabil.
 * Level 3 = Specialist validation: necesita review de specialitate (jurist/DPO/auditor).
 */
export type ValidationLevel = 1 | 2 | 3
export type ScanExtractionMethod = "manual" | "ocr-vision-image" | "ocr-vision-pdf"
export type ScanAnalysisStatus = "pending" | "completed"
export type ScanExtractionStatus = "completed" | "needs_review"
export type ScanSourceKind = "document" | "manifest" | "yaml"
export type GeneratedDocumentKind =
  | "privacy-policy"
  | "cookie-policy"
  | "dpa"
  | "nis2-incident-response"
  | "ai-governance"

export type WorkspaceContext = {
  orgId: string
  orgName: string
  workspaceLabel: string
  workspaceOwner: string
  workspaceInitials: string
  userRole?: "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"  // Sprint 6 RBAC
}

export type NavSection =
  | "dashboard"
  | "scanari"
  | "rapoarte"
  | "integrari"
  | "setari"

export type ComplianceAlert = {
  id: string
  message: string
  severity: AlertSeverity
  open: boolean
  sourceDocument?: string
  createdAtISO: string
  scanId?: string
  findingId?: string
}

export type FindingProvenance = {
  ruleId: string
  matchedKeyword?: string
  excerpt?: string
  startChar?: number
  endChar?: number
  signalSource?: "keyword" | "manifest"
  verdictBasis?: "direct_signal" | "inferred_signal"
  signalConfidence?: "high" | "medium"
}

export type LegalMapping = {
  regulation: string
  article: string
  label: string
  reason: string
}

/**
 * V3 P0.0 — Resolution Layer
 * Structura completă de la detectare la inchidere și revalidare.
 * Orice finding nou trebuie să aibă cel puțin problem + impact + action.
 */
export type FindingResolution = {
  problem: string          // Ce problemă concretă a detectat sistemul
  impact: string           // Ce se întâmplă dacă nu e rezolvat
  action: string           // Acțiunea concretă recomandată
  generatedAsset?: string  // Asset generat de CompliAI (document, raport, template)
  humanStep?: string       // Pasul uman obligatoriu (ce trebuie să facă persoana)
  closureEvidence?: string // Dovada care confirmă că problema e rezolvată
  revalidation?: string    // Când și cum se reverificată conformitatea
}

export type ScanFinding = {
  id: string
  title: string
  detail: string
  category: FindingCategory
  severity: ComplianceSeverity
  verdictConfidence?: "high" | "medium" | "low"
  verdictConfidenceReason?: string
  risk: "high" | "low"
  principles: CompliancePrinciple[]
  createdAtISO: string
  sourceDocument: string
  scanId?: string
  legalReference?: string
  impactSummary?: string
  remediationHint?: string
  legalMappings?: LegalMapping[]
  ownerSuggestion?: string
  evidenceRequired?: string
  evidenceTypes?: TaskEvidenceKind[]
  rescanHint?: string
  readyTextLabel?: string
  readyText?: string
  provenance?: FindingProvenance
  resolution?: FindingResolution
  // B2 — Finding status tracking
  findingStatus?: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
  findingStatusUpdatedAtISO?: string
  // B1 — Gemini semantic engine fields
  confidenceScore?: number           // 0-100, from Gemini analysis
  requiresHumanReview?: boolean      // true if confidence < 80 or severity critical
  reasoning?: string                 // Gemini's reasoning for the finding
  sourceParagraph?: string           // exact text excerpt that triggered the finding
  suggestedDocumentType?: string     // suggested document to generate (dpa, privacy-policy, etc.)
}

export type ScanRecord = {
  id: string
  clientId?: string
  documentName: string
  contentPreview: string
  contentExtracted?: string
  createdAtISO: string
  findingsCount: number
  sourceKind?: ScanSourceKind
  extractionMethod?: ScanExtractionMethod
  reviewRequired?: boolean
  extractionStatus?: ScanExtractionStatus
  analysisStatus?: ScanAnalysisStatus
  analyzedAtISO?: string
  // S2.2: repeatable scan hardening
  repeatableRunHash?: string      // SHA-256 of (documentName + content) for dedup/replay
  baselineSnapshotId?: string     // validated baseline at time of scan
}

export type GeneratedDocumentRecord = {
  id: string
  documentType: GeneratedDocumentKind
  title: string
  content?: string
  generatedAtISO: string
  llmUsed: boolean
  sourceFindingId?: string
  approvalStatus?: "draft" | "approved_as_evidence"
  approvedAtISO?: string
  approvedByUserId?: string
  approvedByEmail?: string
  confirmationChecklist?: string[]
  evidenceNote?: string
  // E1 — Expiry management
  expiresAtISO?: string           // when this document expires
  nextReviewDateISO?: string      // when to review this document
  refreshStatus?: "current" | "refresh-candidate" | "expired"  // E2 drift-linked
}

export type AISystemPurpose =
  | "hr-screening"
  | "credit-scoring"
  | "biometric-identification"
  | "fraud-detection"
  | "marketing-personalization"
  | "support-chatbot"
  | "document-assistant"
  | "other"

export type AISystemRiskLevel = "minimal" | "limited" | "high"
export type AISystemDiscoveryMethod = "manual" | "auto" | "hybrid"
export type AISystemDetectionStatus =
  | "detected"
  | "reviewed"
  | "confirmed"
  | "rejected"
export type AISystemConfidence = "low" | "medium" | "high"

export type TaskValidationStatus = "idle" | "passed" | "failed" | "needs_review"
export type RemediationMode = "rapid" | "structural"
export type TaskEvidenceKind =
  | "screenshot"
  | "policy_text"
  | "log_export"
  | "yaml_evidence"
  | "document_bundle"
  | "other"
export type EvidenceQualityStatus = "sufficient" | "weak"
export type EvidenceQualityReasonCode =
  | "generic_kind"
  | "generic_filename"
  | "unknown_mime"
  | "very_small_file"
  | "tiny_text_payload"
  | "tiny_bundle"
export type TaskValidationKind =
  | "human-oversight"
  | "tracking-consent"
  | "retention-policy"
  | "efactura-sync"
  | "ai-transparency"
  | "data-residency"
  | "evidence-only"

export type EvidenceQualityAssessment = {
  status: EvidenceQualityStatus
  summary: string
  reasonCodes: EvidenceQualityReasonCode[]
  checkedAtISO: string
}

export type TaskEvidenceAttachment = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAtISO: string
  kind: TaskEvidenceKind
  storageProvider?: "public_local" | "local_private" | "supabase_private"
  storageKey?: string
  accessPath?: string
  publicPath?: string
  quality?: EvidenceQualityAssessment
}

export type EvidenceRegistryEntry = TaskEvidenceAttachment & {
  taskId?: string | null
}

export type AIComplianceFieldOverride = {
  value: string | null
  confirmedByUser: boolean
  updatedAtISO: string
}

export type TraceabilityReviewOverride = {
  confirmedByUser: boolean
  note: string | null
  updatedAtISO: string
}

export type AISystemRecord = {
  id: string
  name: string
  purpose: AISystemPurpose
  vendor: string
  modelType: string
  usesPersonalData: boolean
  makesAutomatedDecisions: boolean
  impactsRights: boolean
  hasHumanReview: boolean
  riskLevel: AISystemRiskLevel
  annexIIIHint?: string
  recommendedActions: string[]
  createdAtISO: string
}

export type DetectedAISystemRecord = AISystemRecord & {
  sourceScanId?: string
  sourceDocument?: string
  discoveryMethod: Exclude<AISystemDiscoveryMethod, "manual"> | "hybrid"
  detectionStatus: AISystemDetectionStatus
  confidence: AISystemConfidence
  frameworks: string[]
  evidence: string[]
  detectedAtISO: string
  confirmedSystemId?: string
}

export type EFacturaValidationRecord = {
  id: string
  documentName: string
  valid: boolean
  invoiceNumber?: string
  issueDate?: string
  supplierName?: string
  supplierCui?: string
  customerName?: string
  customerCui?: string
  errors: string[]
  warnings: string[]
  createdAtISO: string
}

export type PersistedTaskStatus = "todo" | "done"

export type PersistedTaskState = {
  status: PersistedTaskStatus
  attachedEvidence?: string
  attachedEvidenceMeta?: TaskEvidenceAttachment
  updatedAtISO: string
  validationStatus?: TaskValidationStatus
  validationMessage?: string
  validationConfidence?: "high" | "medium" | "low"
  validationBasis?: "direct_signal" | "inferred_signal" | "operational_state"
  validatedAtISO?: string
  lastRescanAtISO?: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAtISO: string
}

export type ComplianceEvent = {
  id: string
  type: string
  entityType: "scan" | "finding" | "alert" | "task" | "integration" | "system" | "drift"
  entityId: string
  message: string
  createdAtISO: string
  actorId?: string
  actorLabel?: string
  actorRole?: "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"
  actorSource?: "session" | "workspace" | "system"
  metadata?: Record<string, string | number | boolean>
}

export type ComplianceDriftSeverity = ComplianceSeverity
export type ComplianceDriftType = "operational_drift" | "compliance_drift"
export type ComplianceDriftChange =
  | "provider_added"
  | "provider_changed"
  | "model_changed"
  | "framework_added"
  | "human_review_removed"
  | "personal_data_detected"
  | "risk_class_changed"
  | "purpose_changed"
  | "data_residency_changed"
  | "provider_removed"
  | "tracking_detected"
  | "high_risk_signal_detected"
  | "invoice_flow_signal_detected"

export type ComplianceDriftSettings = {
  severityOverrides: Partial<Record<ComplianceDriftChange, ComplianceDriftSeverity>>
}

export type ComplianceDriftEscalationTier = "watch" | "urgent" | "critical"
export type ComplianceDriftLifecycleStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "waived"

export type ComplianceDriftRecord = {
  id: string
  snapshotId: string
  comparedToSnapshotId: string | null
  type: ComplianceDriftType
  change: ComplianceDriftChange
  severity: ComplianceDriftSeverity
  summary: string
  severityReason?: string
  impactSummary?: string
  nextAction?: string
  evidenceRequired?: string
  lawReference?: string
  escalationOwner?: string
  escalationTier?: ComplianceDriftEscalationTier
  escalationSlaHours?: number
  escalationDueAtISO?: string
  lifecycleStatus?: ComplianceDriftLifecycleStatus
  acknowledgedAtISO?: string
  acknowledgedBy?: string
  inProgressAtISO?: string
  resolvedAtISO?: string
  waivedAtISO?: string
  waivedReason?: string
  escalationBreachedAtISO?: string
  lastStatusUpdatedAtISO?: string
  blocksAudit?: boolean
  blocksBaseline?: boolean
  requiresHumanApproval?: boolean
  systemLabel?: string
  sourceDocument?: string
  detectedAtISO: string
  before?: Record<string, string | number | boolean | null>
  after?: Record<string, string | number | boolean | null>
  open: boolean
}

export type ComplianceState = {
  highRisk: number
  lowRisk: number
  gdprProgress: number
  efacturaSyncedAtISO: string
  efacturaConnected: boolean
  efacturaSignalsCount: number
  scannedDocuments: number
  alerts: ComplianceAlert[]
  findings: ScanFinding[]
  scans: ScanRecord[]
  generatedDocuments: GeneratedDocumentRecord[]
  chat: ChatMessage[]
  taskState: Record<string, PersistedTaskState>
  aiComplianceFieldOverrides: Record<string, Record<string, AIComplianceFieldOverride>>
  traceabilityReviews: Record<string, TraceabilityReviewOverride>
  aiSystems: AISystemRecord[]
  detectedAISystems: DetectedAISystemRecord[]
  efacturaValidations: EFacturaValidationRecord[]
  driftRecords: ComplianceDriftRecord[]
  driftSettings: ComplianceDriftSettings
  snapshotHistory: CompliScanSnapshot[]
  validatedBaselineSnapshotId?: string
  events: ComplianceEvent[]
  // ── Applicability Engine ───────────────────────────────────────────────────
  orgProfile?: OrgProfile
  applicability?: ApplicabilityResult
  orgProfilePrefill?: OrgProfilePrefill
  // ── V3 P2.1 Shadow AI ─────────────────────────────────────────────────────
  shadowAiAnswers?: { questionId: string; value: string | string[] }[]
  shadowAiCompletedAtISO?: string
  // ── Smart Intake (Questionnaire Automation) ──────────────────────────────
  intakeAnswers?: FullIntakeAnswers
  intakeCompletedAtISO?: string
  // ── Faza 2: SAF-T D406 ────────────────────────────────────────────────
  d406EvidenceSubmitted?: boolean
  // ── Addon 1: Compliance Streak ─────────────────────────────────────────
  complianceStreak?: ComplianceStreak
  // ── Multiplicator A: Site Intelligence Layer ────────────────────────────
  siteScan?: SiteScanSummary
  // ── Multiplicator B: Progressive Data Enrichment ─────────────────────────
  orgKnowledge?: import("@/lib/compliance/org-knowledge").OrgKnowledge
  // ── Fix #7: Async site scan jobs ─────────────────────────────────────────
  siteScanJobs?: Record<string, SiteScanJob>
}

export type SiteScanSummary = {
  scannedAtISO: string
  websiteUrl: string
  trackerCount: number
  vendorCandidateCount: number
  formCount: number
  hasCookieBanner: boolean
  hasPrivacyPolicy: boolean
  findingCount: number
}

export type SiteScanJob = {
  jobId: string
  url: string
  status: "queued" | "processing" | "done" | "error" | "timeout"
  createdAtISO: string
  completedAtISO?: string
  result?: import("@/lib/compliance/site-scanner").SiteScanResult
  error?: string
}

export type ComplianceStreak = {
  currentDays: number        // consecutive days above threshold
  longestStreak: number      // personal record
  lastUpdated: string        // ISO date of last update
  threshold: number          // default 70
  brokenAt: string | null    // when the streak last broke
}

export type DashboardSummary = {
  score: number
  riskLabel: "Risc Scăzut" | "Risc Mediu" | "Risc Ridicat"
  riskColor: string
  redAlerts: number
  yellowAlerts: number
  openAlerts: number
}

export type RemediationAction = {
  id: string
  title: string
  priority: "P1" | "P2" | "P3"
  severity: ComplianceSeverity
  remediationMode: RemediationMode
  principles?: CompliancePrinciple[]
  owner: string
  dueDate?: string
  why: string
  actions: string[]
  evidence: string
  sourceDocument?: string
  detectedIssue?: string
  triggerSnippet?: string
  lawReference?: string
  fixPreview?: string
  readyTextLabel?: string
  readyText?: string
  relatedAlertIds?: string[]
  relatedFindingIds?: string[]
  relatedDriftIds?: string[]
  validationKind?: TaskValidationKind
  evidenceTypes?: TaskEvidenceKind[]
}
