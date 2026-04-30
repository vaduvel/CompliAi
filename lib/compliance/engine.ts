import type {
  AISystemRecord,
  ComplianceAlert,
  ComplianceDriftRecord,
  ComplianceEvent,
  ComplianceState,
  DashboardSummary,
  DetectedAISystemRecord,
  EFacturaValidationRecord,
  GeneratedDocumentRecord,
  PersistedTaskState,
  ScanExtractionStatus,
  ScanFinding,
  ScanRecord,
} from "@/lib/compliance/types"
import { COMPLIANCE_RULE_LIBRARY } from "@/lib/compliance/rule-library"
import {
  applyTaskResolutionToAlerts,
  getOperationallyClosedFindingIds,
} from "@/lib/compliance/task-resolution"
import {
  inferPrinciplesFromCategory,
  normalizeCompliancePrinciples,
  normalizeComplianceSeverity,
  severityToAlertBuckets,
  severityToLegacyRisk,
} from "@/lib/compliance/constitution"
import {
  buildFindingConfidenceReason,
  inferFindingConfidence,
} from "@/lib/compliance/finding-confidence"
import { normalizeFiscalProtocols } from "@/lib/compliance/fiscal-protocol"
import { normalizeHrRegistryReconciliations } from "@/lib/compliance/hr-registry-reconciliation"
import { detectComplianceSignals } from "@/lib/compliance/signal-detection"
import {
  isDriftLifecycleOpen,
  normalizeDriftLifecycleStatus,
} from "@/lib/compliance/drift-lifecycle"

export const initialComplianceState: ComplianceState = {
  highRisk: 0,
  lowRisk: 0,
  gdprProgress: 0,
  efacturaSyncedAtISO: "",
  efacturaConnected: false,
  efacturaSignalsCount: 0,
  scannedDocuments: 0,
  alerts: [],
  findings: [],
  scans: [],
  generatedDocuments: [],
  chat: [],
  taskState: {},
  aiComplianceFieldOverrides: {},
  traceabilityReviews: {},
  aiSystems: [],
  detectedAISystems: [],
  efacturaValidations: [],
  fiscalProtocols: {},
  driftRecords: [],
  driftSettings: {
    severityOverrides: {},
  },
  snapshotHistory: [],
  validatedBaselineSnapshotId: undefined,
  events: [],
  hrRegistryReconciliations: {},
  gdprTrainingRecords: [],
}

export function normalizeComplianceState(state: ComplianceState): ComplianceState {
  const findings = (state.findings ?? [])
    .filter((finding) => !isLegacyInformationalFinding(finding))
    .map(normalizeFinding)
  const rawAlerts = (state.alerts ?? []).filter(
    (alert) => !(alert.id === "a1" || alert.id === "a2")
  ).map(normalizeAlert)
  const scans = (state.scans ?? []).map(normalizeScanRecord)
  const generatedDocuments = normalizeGeneratedDocuments(state.generatedDocuments)
  const taskState = normalizeTaskState(state.taskState)
  const aiComplianceFieldOverrides = normalizeAIComplianceFieldOverrides(
    state.aiComplianceFieldOverrides
  )
  const traceabilityReviews = normalizeTraceabilityReviews(state.traceabilityReviews)
  const aiSystems = normalizeAISystems(state.aiSystems)
  const detectedAISystems = normalizeDetectedAISystems(state.detectedAISystems)
  const efacturaValidations = normalizeEFacturaValidations(state.efacturaValidations)
  const fiscalProtocols = normalizeFiscalProtocols(state.fiscalProtocols)
  const driftRecords = normalizeDriftRecords(state.driftRecords)
  const driftSettings = normalizeDriftSettings(state.driftSettings)
  const snapshotHistory = normalizeSnapshotHistory(state.snapshotHistory)
  const events = normalizeEvents(state.events)
  const hrRegistryReconciliations = normalizeHrRegistryReconciliations(state.hrRegistryReconciliations)
  const gdprTrainingRecords = Array.isArray(state.gdprTrainingRecords)
    ? state.gdprTrainingRecords
    : []
  const dpoMigrationImports = Array.isArray(state.dpoMigrationImports)
    ? state.dpoMigrationImports
    : []
  const resolvedFindingIds = getOperationallyClosedFindingIds({
    ...state,
    alerts: rawAlerts,
    findings,
    scans,
    generatedDocuments,
    taskState,
    aiComplianceFieldOverrides,
    traceabilityReviews,
    aiSystems,
    detectedAISystems,
    efacturaValidations,
    fiscalProtocols,
    driftRecords,
    driftSettings,
    snapshotHistory,
    events,
    hrRegistryReconciliations,
    gdprTrainingRecords,
    dpoMigrationImports,
  })
  const alerts = applyTaskResolutionToAlerts({
    ...state,
    alerts: rawAlerts,
    findings,
    scans,
    generatedDocuments,
    taskState,
    aiComplianceFieldOverrides,
    traceabilityReviews,
    aiSystems,
    detectedAISystems,
    efacturaValidations,
    fiscalProtocols,
    driftRecords,
    driftSettings,
    snapshotHistory,
    events,
    hrRegistryReconciliations,
    gdprTrainingRecords,
    dpoMigrationImports,
  })

  const unresolvedFindings = findings.filter((finding) => !resolvedFindingIds.has(finding.id))
  const highRisk = unresolvedFindings.filter(
    (finding) => finding.severity === "critical" || finding.severity === "high"
  ).length
  const lowRisk = unresolvedFindings.filter(
    (finding) => finding.severity === "medium" || finding.severity === "low"
  ).length
  const efacturaSignalsCount = unresolvedFindings.filter(
    (finding) => finding.category === "E_FACTURA"
  ).length
  const scannedDocuments = scans.length

  const openAlerts = alerts.filter((alert) => alert.open)
  const redAlerts = openAlerts.filter((alert) => severityToAlertBuckets(alert.severity).red).length
  const yellowAlerts = openAlerts.filter((alert) => severityToAlertBuckets(alert.severity).yellow).length

  let gdprProgress = 0
  if (scannedDocuments > 0 || findings.length > 0 || alerts.length > 0) {
    gdprProgress = clamp(100 - redAlerts * 20 - yellowAlerts * 8, 0, 100)
  }

  const efacturaSyncedAtISO = isValidIso(state.efacturaSyncedAtISO)
    ? state.efacturaSyncedAtISO
    : ""

  return {
    ...state,
    alerts,
    findings,
    scans,
    highRisk,
    lowRisk,
    scannedDocuments,
    gdprProgress,
    efacturaConnected: Boolean(state.efacturaConnected),
    efacturaSignalsCount,
    efacturaSyncedAtISO,
    generatedDocuments,
    taskState,
    aiComplianceFieldOverrides,
    traceabilityReviews,
    aiSystems,
    detectedAISystems,
    efacturaValidations,
    fiscalProtocols,
    driftRecords,
    snapshotHistory,
    hrRegistryReconciliations,
    gdprTrainingRecords,
    dpoMigrationImports,
    validatedBaselineSnapshotId:
      typeof state.validatedBaselineSnapshotId === "string" &&
      snapshotHistory.some((snapshot) => snapshot.snapshotId === state.validatedBaselineSnapshotId)
        ? state.validatedBaselineSnapshotId
        : undefined,
    events,
  }
}

function normalizeGeneratedDocuments(
  value: GeneratedDocumentRecord[] | undefined
): GeneratedDocumentRecord[] {
  if (!Array.isArray(value)) return []

  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return []

      const documentType =
        item.documentType === "privacy-policy" ||
        item.documentType === "cookie-policy" ||
        item.documentType === "dpa" ||
        item.documentType === "dsar-response" ||
        item.documentType === "retention-policy" ||
        item.documentType === "nis2-incident-response" ||
        item.documentType === "ai-governance" ||
        item.documentType === "annex-iv" ||
        item.documentType === "job-description" ||
        item.documentType === "hr-internal-procedures" ||
        item.documentType === "reges-correction-brief" ||
        item.documentType === "contract-template" ||
        item.documentType === "deletion-attestation" ||
        item.documentType === "pay-gap-report" ||
        item.documentType === "ropa"
          ? item.documentType
          : null
      const title = typeof item.title === "string" ? item.title.trim() : ""
      const generatedAtISO = isValidIso(item.generatedAtISO) ? item.generatedAtISO : null
      const content =
        typeof item.content === "string" && item.content.trim().length > 0
          ? item.content
          : undefined
      const sourceFindingId =
        typeof item.sourceFindingId === "string" && item.sourceFindingId.trim()
          ? item.sourceFindingId.trim()
          : undefined
      const approvalStatus =
        item.approvalStatus === "draft" || item.approvalStatus === "approved_as_evidence"
          ? item.approvalStatus
          : undefined
      const approvedAtISO = isValidIso(item.approvedAtISO) ? item.approvedAtISO : undefined
      const approvedByUserId =
        typeof item.approvedByUserId === "string" && item.approvedByUserId.trim()
          ? item.approvedByUserId.trim()
          : undefined
      const approvedByEmail =
        typeof item.approvedByEmail === "string" && item.approvedByEmail.trim()
          ? item.approvedByEmail.trim()
          : undefined
      const confirmationChecklist = Array.isArray(item.confirmationChecklist)
        ? Array.from(
            new Set(
              item.confirmationChecklist
                .filter((entry): entry is string => typeof entry === "string")
                .map((entry) => entry.trim())
                .filter(Boolean)
            )
          )
        : undefined
      const validationChecklist = Array.isArray(item.validationChecklist)
        ? Array.from(
            new Set(
              item.validationChecklist
                .filter((entry): entry is string => typeof entry === "string")
                .map((entry) => entry.trim())
                .filter(Boolean)
            )
          )
        : undefined
      const validationStatus =
        item.validationStatus === "pending" || item.validationStatus === "passed"
          ? item.validationStatus
          : undefined
      const validatedAtISO = isValidIso(item.validatedAtISO) ? item.validatedAtISO : undefined
      const evidenceNote =
        typeof item.evidenceNote === "string" && item.evidenceNote.trim()
          ? item.evidenceNote.trim()
          : undefined
      const adoptionStatus =
        item.adoptionStatus === "reviewed_internally" ||
        item.adoptionStatus === "sent_for_signature" ||
        item.adoptionStatus === "signed" ||
        item.adoptionStatus === "active" ||
        item.adoptionStatus === "rejected"
          ? item.adoptionStatus
          : undefined
      const adoptionUpdatedAtISO = isValidIso(item.adoptionUpdatedAtISO) ? item.adoptionUpdatedAtISO : undefined
      const adoptionEvidenceNote =
        typeof item.adoptionEvidenceNote === "string" && item.adoptionEvidenceNote.trim()
          ? item.adoptionEvidenceNote.trim()
          : undefined
      const expiresAtISO = isValidIso(item.expiresAtISO) ? item.expiresAtISO : undefined
      const nextReviewDateISO = isValidIso(item.nextReviewDateISO) ? item.nextReviewDateISO : undefined
      const refreshStatus =
        item.refreshStatus === "current" ||
        item.refreshStatus === "refresh-candidate" ||
        item.refreshStatus === "expired"
          ? item.refreshStatus
          : undefined

      if (!documentType || !title || !generatedAtISO) return []

      return [
        {
          id:
            typeof item.id === "string" && item.id.trim()
              ? item.id.trim()
              : `generated-doc-${Math.random().toString(36).slice(2, 10)}`,
          documentType,
          title,
          content,
          generatedAtISO,
          llmUsed: Boolean(item.llmUsed),
          sourceFindingId,
          approvalStatus,
          approvedAtISO,
          approvedByUserId,
          approvedByEmail,
          confirmationChecklist,
          validationChecklist,
          validationStatus,
          validatedAtISO,
          evidenceNote,
          adoptionStatus,
          adoptionUpdatedAtISO,
          adoptionEvidenceNote,
          expiresAtISO,
          nextReviewDateISO,
          refreshStatus,
        },
      ]
    })
    .slice(0, 100)
}

function normalizeDriftSettings(value: ComplianceState["driftSettings"] | undefined) {
  if (!value || typeof value !== "object") {
    return {
      severityOverrides: {},
    }
  }

  const rawOverrides =
    value.severityOverrides && typeof value.severityOverrides === "object"
      ? value.severityOverrides
      : {}

  return {
    severityOverrides: Object.fromEntries(
      Object.entries(rawOverrides).flatMap(([change, severity]) =>
        severity === "critical" ||
        severity === "high" ||
        severity === "medium" ||
        severity === "low"
          ? [[change, severity]]
          : []
      )
    ),
  }
}

function isLegacyInformationalFinding(finding: ScanFinding) {
  return (
    finding.provenance?.ruleId === "GEN-001" &&
    finding.title === "Scanare completă, risc redus"
  )
}

export function computeDashboardSummary(state: ComplianceState): DashboardSummary {
  const hasEvidence =
    state.scannedDocuments > 0 ||
    state.findings.length > 0 ||
    state.alerts.length > 0 ||
    state.aiSystems.length > 0 ||
    state.detectedAISystems.length > 0
  if (!hasEvidence) {
    return {
      score: 0,
      riskLabel: "Risc Mediu",
      riskColor: "#A1A1AA",
      redAlerts: 0,
      yellowAlerts: 0,
      openAlerts: 0,
    }
  }

  const openAlerts = state.alerts.filter((a) => a.open)
  const openDrifts = state.driftRecords.filter((drift) => drift.open)
  const driftRedAlerts = openDrifts.filter(
    (drift) => drift.severity === "critical" || drift.severity === "high"
  ).length
  const driftYellowAlerts = openDrifts.filter((drift) => drift.severity === "medium").length
  const redAlerts =
    openAlerts.filter((a) => severityToAlertBuckets(a.severity).red).length + driftRedAlerts
  const yellowAlerts =
    openAlerts.filter((a) => severityToAlertBuckets(a.severity).yellow).length + driftYellowAlerts
  const alertPenalty = redAlerts * 12 + yellowAlerts * 5
  const riskPenalty = state.highRisk * 8 + state.lowRisk * 2
  const score = clamp(100 - alertPenalty - riskPenalty, 0, 100)

  if (score >= 90) {
    return {
      score,
      riskLabel: "Risc Scăzut",
      riskColor: "#22C55E",
      redAlerts,
      yellowAlerts,
      openAlerts: openAlerts.length,
    }
  }
  if (score >= 75) {
    return {
      score,
      riskLabel: "Risc Mediu",
      riskColor: "#EAB308",
      redAlerts,
      yellowAlerts,
      openAlerts: openAlerts.length,
    }
  }
  return {
    score,
    riskLabel: "Risc Ridicat",
    riskColor: "#EF4444",
    redAlerts,
    yellowAlerts,
    openAlerts: openAlerts.length,
  }
}

export function formatRelativeRomanian(isoDate: string) {
  if (!isValidIso(isoDate)) return "necunoscut"
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMinutes = Math.max(0, Math.round((now - then) / 60000))
  if (diffMinutes < 1) return "acum"
  if (diffMinutes < 60) return `acum ${diffMinutes} min`
  const hours = Math.round(diffMinutes / 60)
  if (hours < 24) return `acum ${hours} h`
  const days = Math.round(hours / 24)
  return `acum ${days} zile`
}

export function simulateFindings(
  documentName: string,
  content: string,
  nowISO: string,
  scanId?: string,
  options?: {
    manifestSignals?: string[]
  }
): {
  findings: ScanFinding[]
  alerts: ComplianceAlert[]
  highRiskDelta: number
  lowRiskDelta: number
} {
  const signals = detectComplianceSignals({
    documentName,
    content,
    manifestSignals: options?.manifestSignals,
  })
  const findings: ScanFinding[] = []
  const alerts: ComplianceAlert[] = []

  let highRiskDelta = 0
  let lowRiskDelta = 0

  for (const signal of signals) {
    const rule = COMPLIANCE_RULE_LIBRARY.find((item) => item.ruleId === signal.ruleId)
    if (!rule) continue

    if (rule.category === "EU_AI_ACT") {
      highRiskDelta += 1
      lowRiskDelta = 0
    }

    const findingId = uid("finding")
    const provenance = {
      ruleId: signal.ruleId,
      matchedKeyword: signal.keyword,
      excerpt: signal.excerpt,
      startChar: signal.startChar,
      endChar: signal.endChar,
      signalSource: signal.signalSource,
      verdictBasis: signal.verdictBasis,
      signalConfidence: signal.signalConfidence,
    } satisfies ScanFinding["provenance"]
    findings.push({
      id: findingId,
      title: rule.title,
      detail: rule.detail,
      category: rule.category,
      severity: rule.severity,
      verdictConfidence: inferFindingConfidence(provenance),
      verdictConfidenceReason: buildFindingConfidenceReason({
        title: rule.title,
        sourceDocument: documentName,
        provenance,
      }),
      risk: severityToLegacyRisk(rule.severity),
      principles: rule.principles,
      createdAtISO: nowISO,
      sourceDocument: documentName,
      scanId,
      legalReference: rule.legalReference,
      impactSummary: rule.impactSummary,
      remediationHint: rule.remediationHint,
      legalMappings: rule.legalMappings,
      ownerSuggestion: rule.ownerSuggestion,
      evidenceRequired: rule.evidenceRequired,
      evidenceTypes: rule.evidenceTypes,
      rescanHint: rule.rescanHint,
      readyTextLabel: rule.readyTextLabel,
      readyText: rule.readyText,
      provenance,
    })

    if (rule.alertMessage && rule.alertSeverity) {
      alerts.push({
        id: uid("alert"),
        message: rule.alertMessage,
        severity: rule.alertSeverity,
        open: true,
        sourceDocument: documentName,
        createdAtISO: nowISO,
        scanId,
        findingId,
      })
    }
  }

  return { findings, alerts, highRiskDelta, lowRiskDelta }
}

function normalizeAlert(alert: ComplianceAlert): ComplianceAlert {
  const severity = normalizeComplianceSeverity(alert.severity, "medium")

  return {
    ...alert,
    severity,
  }
}

function normalizeFinding(finding: ScanFinding): ScanFinding {
  const rule = finding.provenance?.ruleId
    ? COMPLIANCE_RULE_LIBRARY.find((item) => item.ruleId === finding.provenance?.ruleId)
    : undefined
  const severity = normalizeComplianceSeverity(
    finding.severity || (finding.risk === "high" ? "high" : "low"),
    rule?.severity || "medium"
  )
  const principles = normalizeCompliancePrinciples(
    finding.principles,
    rule?.principles || inferPrinciplesFromCategory(finding.category)
  )

  return {
    ...finding,
    severity,
    verdictConfidence: finding.verdictConfidence || inferFindingConfidence(finding.provenance),
    verdictConfidenceReason:
      finding.verdictConfidenceReason || buildFindingConfidenceReason(finding),
    risk: severityToLegacyRisk(severity),
    principles,
  }
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function isValidIso(value?: string) {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp)
}

function isTaskEvidenceKind(value: unknown) {
  return (
    value === "screenshot" ||
    value === "policy_text" ||
    value === "log_export" ||
    value === "yaml_evidence" ||
    value === "document_bundle" ||
    value === "other"
  )
}

function normalizeTaskState(
  value: ComplianceState["taskState"] | undefined
): Record<string, PersistedTaskState> {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([taskId, entry]) => {
      if (!entry || typeof entry !== "object") return []

      const status = entry.status === "done" ? "done" : "todo"
      const updatedAtISO = isValidIso(entry.updatedAtISO) ? entry.updatedAtISO : new Date(0).toISOString()
      const attachedEvidence =
        typeof entry.attachedEvidence === "string" && entry.attachedEvidence.trim()
          ? entry.attachedEvidence.trim()
          : undefined
      const attachedEvidenceMeta =
        entry.attachedEvidenceMeta &&
        typeof entry.attachedEvidenceMeta === "object" &&
        typeof entry.attachedEvidenceMeta.fileName === "string" &&
        entry.attachedEvidenceMeta.fileName.trim()
          ? {
              id:
                typeof entry.attachedEvidenceMeta.id === "string" &&
                entry.attachedEvidenceMeta.id.trim()
                  ? entry.attachedEvidenceMeta.id
                  : `evidence-${taskId}`,
              fileName: entry.attachedEvidenceMeta.fileName.trim(),
              mimeType:
                typeof entry.attachedEvidenceMeta.mimeType === "string" &&
                entry.attachedEvidenceMeta.mimeType.trim()
                  ? entry.attachedEvidenceMeta.mimeType
                  : "application/octet-stream",
              sizeBytes:
                typeof entry.attachedEvidenceMeta.sizeBytes === "number"
                  ? entry.attachedEvidenceMeta.sizeBytes
                  : 0,
              uploadedAtISO: isValidIso(entry.attachedEvidenceMeta.uploadedAtISO)
                ? entry.attachedEvidenceMeta.uploadedAtISO
                : updatedAtISO,
              kind: isTaskEvidenceKind(entry.attachedEvidenceMeta.kind)
                ? entry.attachedEvidenceMeta.kind
                : "other",
              storageProvider:
                entry.attachedEvidenceMeta.storageProvider === "public_local" ||
                entry.attachedEvidenceMeta.storageProvider === "local_private" ||
                entry.attachedEvidenceMeta.storageProvider === "supabase_private"
                  ? entry.attachedEvidenceMeta.storageProvider
                  : undefined,
              storageKey:
                typeof entry.attachedEvidenceMeta.storageKey === "string" &&
                entry.attachedEvidenceMeta.storageKey.trim()
                  ? entry.attachedEvidenceMeta.storageKey
                  : undefined,
              accessPath:
                typeof entry.attachedEvidenceMeta.accessPath === "string" &&
                entry.attachedEvidenceMeta.accessPath.trim()
                  ? entry.attachedEvidenceMeta.accessPath
                  : undefined,
              publicPath:
                typeof entry.attachedEvidenceMeta.publicPath === "string" &&
                entry.attachedEvidenceMeta.publicPath.trim()
                  ? entry.attachedEvidenceMeta.publicPath
                  : undefined,
              quality:
                entry.attachedEvidenceMeta.quality &&
                typeof entry.attachedEvidenceMeta.quality === "object" &&
                (entry.attachedEvidenceMeta.quality.status === "sufficient" ||
                  entry.attachedEvidenceMeta.quality.status === "weak")
                  ? {
                      status: entry.attachedEvidenceMeta.quality.status,
                      summary:
                        typeof entry.attachedEvidenceMeta.quality.summary === "string"
                          ? entry.attachedEvidenceMeta.quality.summary
                          : "",
                      reasonCodes: Array.isArray(entry.attachedEvidenceMeta.quality.reasonCodes)
                        ? entry.attachedEvidenceMeta.quality.reasonCodes.filter(
                            (code): code is import("@/lib/compliance/types").EvidenceQualityReasonCode =>
                              code === "generic_kind" ||
                              code === "generic_filename" ||
                              code === "unknown_mime" ||
                              code === "very_small_file" ||
                              code === "tiny_text_payload" ||
                              code === "tiny_bundle"
                          )
                        : [],
                      checkedAtISO: isValidIso(entry.attachedEvidenceMeta.quality.checkedAtISO)
                        ? entry.attachedEvidenceMeta.quality.checkedAtISO
                        : updatedAtISO,
                    }
                  : undefined,
            }
          : undefined
      const rawDeletedEvidenceMeta = entry.deletedEvidenceMeta
      const deletedEvidence =
        typeof entry.deletedEvidence === "string" && entry.deletedEvidence.trim()
          ? entry.deletedEvidence.trim()
          : undefined
      const deletedEvidenceMeta =
        rawDeletedEvidenceMeta &&
        typeof rawDeletedEvidenceMeta === "object" &&
        typeof rawDeletedEvidenceMeta.fileName === "string" &&
        rawDeletedEvidenceMeta.fileName.trim() &&
        typeof rawDeletedEvidenceMeta.deleteReason === "string" &&
        rawDeletedEvidenceMeta.deleteReason.trim()
          ? {
              id:
                typeof rawDeletedEvidenceMeta.id === "string" &&
                rawDeletedEvidenceMeta.id.trim()
                  ? rawDeletedEvidenceMeta.id
                  : `deleted-evidence-${taskId}`,
              fileName: rawDeletedEvidenceMeta.fileName.trim(),
              mimeType:
                typeof rawDeletedEvidenceMeta.mimeType === "string" &&
                rawDeletedEvidenceMeta.mimeType.trim()
                  ? rawDeletedEvidenceMeta.mimeType
                  : "application/octet-stream",
              sizeBytes:
                typeof rawDeletedEvidenceMeta.sizeBytes === "number"
                  ? rawDeletedEvidenceMeta.sizeBytes
                  : 0,
              uploadedAtISO: isValidIso(rawDeletedEvidenceMeta.uploadedAtISO)
                ? rawDeletedEvidenceMeta.uploadedAtISO
                : updatedAtISO,
              kind: isTaskEvidenceKind(rawDeletedEvidenceMeta.kind)
                ? rawDeletedEvidenceMeta.kind
                : "other",
              storageProvider:
                rawDeletedEvidenceMeta.storageProvider === "public_local" ||
                rawDeletedEvidenceMeta.storageProvider === "local_private" ||
                rawDeletedEvidenceMeta.storageProvider === "supabase_private"
                  ? rawDeletedEvidenceMeta.storageProvider
                  : undefined,
              storageKey:
                typeof rawDeletedEvidenceMeta.storageKey === "string" &&
                rawDeletedEvidenceMeta.storageKey.trim()
                  ? rawDeletedEvidenceMeta.storageKey
                  : undefined,
              accessPath:
                typeof rawDeletedEvidenceMeta.accessPath === "string" &&
                rawDeletedEvidenceMeta.accessPath.trim()
                  ? rawDeletedEvidenceMeta.accessPath
                  : undefined,
              publicPath:
                typeof rawDeletedEvidenceMeta.publicPath === "string" &&
                rawDeletedEvidenceMeta.publicPath.trim()
                  ? rawDeletedEvidenceMeta.publicPath
                  : undefined,
              quality:
                rawDeletedEvidenceMeta.quality &&
                typeof rawDeletedEvidenceMeta.quality === "object" &&
                (rawDeletedEvidenceMeta.quality.status === "sufficient" ||
                  rawDeletedEvidenceMeta.quality.status === "weak")
                  ? {
                      status: rawDeletedEvidenceMeta.quality.status,
                      summary:
                        typeof rawDeletedEvidenceMeta.quality.summary === "string"
                          ? rawDeletedEvidenceMeta.quality.summary
                          : "",
                      reasonCodes: Array.isArray(rawDeletedEvidenceMeta.quality.reasonCodes)
                        ? rawDeletedEvidenceMeta.quality.reasonCodes.filter(
                            (code): code is import("@/lib/compliance/types").EvidenceQualityReasonCode =>
                              code === "generic_kind" ||
                              code === "generic_filename" ||
                              code === "unknown_mime" ||
                              code === "very_small_file" ||
                              code === "tiny_text_payload" ||
                              code === "tiny_bundle"
                          )
                        : [],
                      checkedAtISO: isValidIso(rawDeletedEvidenceMeta.quality.checkedAtISO)
                        ? rawDeletedEvidenceMeta.quality.checkedAtISO
                        : updatedAtISO,
                    }
                  : undefined,
              deletionStatus:
                rawDeletedEvidenceMeta.deletionStatus === "permanently_deleted"
                  ? "permanently_deleted" as const
                  : "soft_deleted" as const,
              deletedAtISO: isValidIso(rawDeletedEvidenceMeta.deletedAtISO)
                ? rawDeletedEvidenceMeta.deletedAtISO
                : updatedAtISO,
              deletedByUserId:
                typeof rawDeletedEvidenceMeta.deletedByUserId === "string" &&
                rawDeletedEvidenceMeta.deletedByUserId.trim()
                  ? rawDeletedEvidenceMeta.deletedByUserId.trim()
                  : undefined,
              deletedByEmail:
                typeof rawDeletedEvidenceMeta.deletedByEmail === "string" &&
                rawDeletedEvidenceMeta.deletedByEmail.trim()
                  ? rawDeletedEvidenceMeta.deletedByEmail.trim()
                  : undefined,
              deletedByRole:
                rawDeletedEvidenceMeta.deletedByRole === "owner" ||
                rawDeletedEvidenceMeta.deletedByRole === "partner_manager" ||
                rawDeletedEvidenceMeta.deletedByRole === "compliance" ||
                rawDeletedEvidenceMeta.deletedByRole === "reviewer" ||
                rawDeletedEvidenceMeta.deletedByRole === "viewer"
                  ? rawDeletedEvidenceMeta.deletedByRole
                  : undefined,
              deleteReason: rawDeletedEvidenceMeta.deleteReason.trim(),
              restoreUntilISO: isValidIso(rawDeletedEvidenceMeta.restoreUntilISO)
                ? rawDeletedEvidenceMeta.restoreUntilISO
                : updatedAtISO,
              restoredAtISO: isValidIso(rawDeletedEvidenceMeta.restoredAtISO)
                ? rawDeletedEvidenceMeta.restoredAtISO
                : undefined,
              restoredByEmail:
                typeof rawDeletedEvidenceMeta.restoredByEmail === "string" &&
                rawDeletedEvidenceMeta.restoredByEmail.trim()
                  ? rawDeletedEvidenceMeta.restoredByEmail.trim()
                  : undefined,
              permanentDeletedAtISO: isValidIso(rawDeletedEvidenceMeta.permanentDeletedAtISO)
                ? rawDeletedEvidenceMeta.permanentDeletedAtISO
                : undefined,
              permanentDeletedByEmail:
                typeof rawDeletedEvidenceMeta.permanentDeletedByEmail === "string" &&
                rawDeletedEvidenceMeta.permanentDeletedByEmail.trim()
                  ? rawDeletedEvidenceMeta.permanentDeletedByEmail.trim()
                  : undefined,
              permanentDeleteReason:
                typeof rawDeletedEvidenceMeta.permanentDeleteReason === "string" &&
                rawDeletedEvidenceMeta.permanentDeleteReason.trim()
                  ? rawDeletedEvidenceMeta.permanentDeleteReason.trim()
                  : undefined,
            }
          : undefined
      const validationStatus =
        entry.validationStatus === "passed" ||
        entry.validationStatus === "failed" ||
        entry.validationStatus === "needs_review"
          ? entry.validationStatus
          : "idle"
      const validationMessage =
        typeof entry.validationMessage === "string" && entry.validationMessage.trim()
          ? entry.validationMessage.trim()
          : undefined
      const validationConfidence =
        entry.validationConfidence === "high" ||
        entry.validationConfidence === "medium" ||
        entry.validationConfidence === "low"
          ? entry.validationConfidence
          : undefined
      const validationBasis =
        entry.validationBasis === "direct_signal" ||
        entry.validationBasis === "inferred_signal" ||
        entry.validationBasis === "operational_state"
          ? entry.validationBasis
          : undefined
      const validatedAtISO = isValidIso(entry.validatedAtISO) ? entry.validatedAtISO : undefined
      const lastRescanAtISO = isValidIso(entry.lastRescanAtISO) ? entry.lastRescanAtISO : undefined

      return [[
        taskId,
        {
          status,
          attachedEvidence,
          attachedEvidenceMeta,
          deletedEvidence,
          deletedEvidenceMeta,
          updatedAtISO,
          validationStatus,
          validationMessage,
          validationConfidence,
          validationBasis,
          validatedAtISO,
          lastRescanAtISO,
        } satisfies PersistedTaskState,
      ]]
    })
  )
}

function normalizeAIComplianceFieldOverrides(
  value: ComplianceState["aiComplianceFieldOverrides"] | undefined
): ComplianceState["aiComplianceFieldOverrides"] {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([systemId, overrides]) => {
      if (!systemId.trim() || !overrides || typeof overrides !== "object") return []

      const normalizedOverrides = Object.fromEntries(
        Object.entries(overrides).flatMap(([field, entry]) => {
          if (!field.trim() || !entry || typeof entry !== "object") return []

          return [[
            field,
            {
              value:
                typeof entry.value === "string"
                  ? entry.value.trim() || null
                  : entry.value === null
                    ? null
                    : null,
              confirmedByUser: Boolean(entry.confirmedByUser),
              updatedAtISO: isValidIso(entry.updatedAtISO)
                ? entry.updatedAtISO
                : new Date(0).toISOString(),
            },
          ]]
        })
      )

      if (Object.keys(normalizedOverrides).length === 0) return []
      return [[systemId, normalizedOverrides]]
    })
  )
}

function normalizeTraceabilityReviews(
  value: ComplianceState["traceabilityReviews"] | undefined
): ComplianceState["traceabilityReviews"] {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([traceId, entry]) => {
      if (!traceId.trim() || !entry || typeof entry !== "object") return []

      return [[
        traceId,
        {
          confirmedByUser: Boolean(entry.confirmedByUser),
          note:
            typeof entry.note === "string" ? entry.note.trim() || null : null,
          updatedAtISO: isValidIso(entry.updatedAtISO)
            ? entry.updatedAtISO
            : new Date(0).toISOString(),
        },
      ]]
    })
  )
}

function normalizeAISystems(value: ComplianceState["aiSystems"] | undefined): AISystemRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      Boolean(item?.id) &&
      Boolean(item?.name) &&
      Boolean(item?.purpose) &&
      Boolean(item?.riskLevel) &&
      Array.isArray(item?.recommendedActions)
  )
}

function normalizeDetectedAISystems(
  value: ComplianceState["detectedAISystems"] | undefined
): DetectedAISystemRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      Boolean(item?.id) &&
      Boolean(item?.name) &&
      Boolean(item?.purpose) &&
      Boolean(item?.riskLevel) &&
      Array.isArray(item?.recommendedActions) &&
      Array.isArray(item?.frameworks) &&
      Array.isArray(item?.evidence) &&
      Boolean(item?.detectionStatus) &&
      Boolean(item?.confidence)
  )
}

function normalizeEFacturaValidations(
  value: ComplianceState["efacturaValidations"] | undefined
): EFacturaValidationRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      Boolean(item?.id) &&
      Boolean(item?.documentName) &&
      Array.isArray(item?.errors) &&
      Array.isArray(item?.warnings)
  )
}

function normalizeEvents(value: ComplianceState["events"] | undefined): ComplianceEvent[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      Boolean(item?.id) &&
      Boolean(item?.type) &&
      Boolean(item?.entityType) &&
      Boolean(item?.entityId) &&
      Boolean(item?.createdAtISO)
  )
}

function normalizeDriftRecords(
  value: ComplianceState["driftRecords"] | undefined
): ComplianceDriftRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item) =>
        Boolean(item?.id) &&
        Boolean(item?.snapshotId) &&
        Boolean(item?.type) &&
        Boolean(item?.change) &&
        Boolean(item?.severity) &&
        Boolean(item?.detectedAtISO)
    )
    .map((item) => {
      const lifecycleStatus = normalizeDriftLifecycleStatus(
        item.lifecycleStatus,
        item.open !== false
      )

      return {
        ...item,
        lifecycleStatus,
        open: isDriftLifecycleOpen(lifecycleStatus),
      }
    })
}

function normalizeSnapshotHistory(
  value: ComplianceState["snapshotHistory"] | undefined
): ComplianceState["snapshotHistory"] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      item?.version === "1.0" &&
      Boolean(item?.snapshotId) &&
      Boolean(item?.generatedAt) &&
      Array.isArray(item?.sources) &&
      Array.isArray(item?.systems) &&
      Array.isArray(item?.findings) &&
      Array.isArray(item?.drift)
  )
}

export function normalizeScanRecord(scan: ScanRecord): ScanRecord {
  const extractionStatus: ScanExtractionStatus =
    scan.extractionStatus === "needs_review" ? "needs_review" : "completed"

  return {
    ...scan,
    sourceKind:
      scan.sourceKind === "manifest" || scan.sourceKind === "yaml"
        ? scan.sourceKind
        : "document",
    extractionStatus,
    analysisStatus: scan.analysisStatus === "completed" ? "completed" : "pending",
    reviewRequired: Boolean(scan.reviewRequired),
  }
}
