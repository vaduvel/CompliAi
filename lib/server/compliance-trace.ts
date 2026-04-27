import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import {
  buildAuditQualityGates,
  type AuditQualityGate,
  type AuditQualityGateCode,
  type AuditQualityGateDecision,
} from "@/lib/compliance/audit-quality-gates"
import { buildFindingTaskId, getTaskStateByTaskId } from "@/lib/compliance/task-ids"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { getControlFamily } from "@/lib/compliance/control-families"
import { getTaskResolutionTargets, getResolvedFindingIds } from "@/lib/compliance/task-resolution"
import type { ComplianceState, RemediationAction, ScanFinding } from "@/lib/compliance/types"

type BuildComplianceTraceInput = {
  state: ComplianceState
  remediationPlan: RemediationAction[]
  snapshot: CompliScanSnapshot | null
}

export function buildComplianceTraceRecords({
  state,
  remediationPlan,
  snapshot,
}: BuildComplianceTraceInput): ComplianceTraceRecord[] {
  const auditQualityGates = buildAuditQualityGates({ state, remediationPlan })
  const auditGatesByTaskId = new Map<string, AuditQualityGate[]>()
  for (const gate of auditQualityGates.items) {
    const current = auditGatesByTaskId.get(gate.taskId) ?? []
    current.push(gate)
    auditGatesByTaskId.set(gate.taskId, current)
  }
  const currentSnapshot = snapshot ?? state.snapshotHistory[0] ?? null
  const scanById = new Map(state.scans.map((scan) => [scan.id, scan]))
  const scanKindByDocument = new Map(
    state.scans.map((scan) => [scan.documentName, scan.sourceKind ?? "document"])
  )
  const resolvedFindingIds = getResolvedFindingIds(state)
  const findingsCoveredByRemediation = new Set(
    remediationPlan.flatMap((task) => task.relatedFindingIds ?? [])
  )

  const records = remediationPlan.map((task) =>
    buildTraceRecordFromRemediation({
      state,
      remediation: task,
      currentSnapshot,
      scanKindByDocument,
      resolvedFindingIds,
      auditGateItems: auditGatesByTaskId.get(`rem-${task.id}`) ?? [],
    })
  )

  const orphanFindingRecords = state.findings
    .filter(
      (finding) =>
        !resolvedFindingIds.has(finding.id) && !findingsCoveredByRemediation.has(finding.id)
    )
    .map((finding) =>
      buildTraceRecordFromFinding({
        state,
        finding,
        currentSnapshot,
        scanById,
        scanKindByDocument,
      })
    )

  // Sprint 0.5 — Issue 2 fix: include document approvals (signed via magic link)
  // ca traceability records validated. Înainte, evidence ledger conținea aprobările
  // dar traceability matrix nu le reflecta — DPO vede 4 controale blocked chiar și
  // cu DPA approved. Acum approval direct apare ca trace `validated` cu evidence atașat.
  const documentApprovalRecords = (state.generatedDocuments ?? [])
    .filter(
      (doc) => doc.adoptionStatus === "signed" || doc.adoptionStatus === "active"
    )
    .map((doc) =>
      buildTraceRecordFromApprovedDocument({ state, document: doc, currentSnapshot })
    )

  return [...records, ...orphanFindingRecords, ...documentApprovalRecords].sort((left, right) => {
    const severityOrder = ["critical", "high", "medium", "low"]
    const severityDelta =
      severityOrder.indexOf(left.severity) - severityOrder.indexOf(right.severity)
    if (severityDelta !== 0) return severityDelta
    return left.title.localeCompare(right.title)
  })
}

function buildTraceRecordFromRemediation({
  state,
  remediation,
  currentSnapshot,
  scanKindByDocument,
  resolvedFindingIds,
  auditGateItems,
}: {
  state: ComplianceState
  remediation: RemediationAction
  currentSnapshot: CompliScanSnapshot | null
  scanKindByDocument: Map<string, ComplianceState["scans"][number]["sourceKind"]>
  resolvedFindingIds: Set<string>
  auditGateItems: AuditQualityGate[]
}): ComplianceTraceRecord {
  const entryId = `rem-${remediation.id}`
  const taskState = state.taskState[entryId]
  const targets = getTaskResolutionTargets(state, entryId)
  const linkedFindings = state.findings.filter((finding) => targets.findingIds.includes(finding.id))
  const linkedDrifts = state.driftRecords.filter((drift) => targets.driftIds.includes(drift.id))
  const auditDecision = deriveAuditDecisionFromGates(auditGateItems)
  const auditGateCodes = uniqueAuditGateCodes(auditGateItems)
  const primaryAuditBlocker = auditGateItems.at(0)?.detail ?? null
  const lawReferences = unique([
    remediation.lawReference,
    ...linkedFindings.flatMap((finding) => getFindingLawReferences(finding)),
    ...linkedDrifts.map((drift) => drift.lawReference),
  ])
  const sourceDocuments = unique([
    remediation.sourceDocument,
    ...linkedFindings.map((finding) => finding.sourceDocument),
    ...linkedDrifts.map((drift) => drift.sourceDocument),
  ])
  const sourceKinds = uniqueSourceKinds(
    sourceDocuments.map((documentName) => scanKindByDocument.get(documentName)).filter(Boolean)
  )

  return {
    id: `trace-${entryId}`,
    entryKind: "control_task",
    entryId,
    title: remediation.title,
    severity: remediation.severity,
    remediationMode: remediation.remediationMode,
    controlFamily: getControlFamily({
      validationKind: remediation.validationKind,
      lawReference: remediation.lawReference,
      principles: remediation.principles,
      title: remediation.title,
    }),
    lawReferences,
    principles: remediation.principles ?? [],
    sourceDocuments,
    sourceKinds,
    linkedFindingIds: targets.findingIds,
    linkedDriftIds: targets.driftIds,
    linkedAlertIds: targets.alertIds,
    findingRefs: linkedFindings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      sourceDocument: finding.sourceDocument,
      lawReferences: getFindingLawReferences(finding),
      status: resolvedFindingIds.has(finding.id) ? "resolved" : "open",
    })),
    driftRefs: linkedDrifts.map((drift) => ({
      id: drift.id,
      summary: drift.summary,
      severity: drift.severity,
      type: drift.type,
      change: drift.change,
      lawReference: drift.lawReference ?? null,
      open: drift.open,
    })),
    evidence: {
      attached: Boolean(taskState?.attachedEvidenceMeta),
      validationStatus: taskState?.validationStatus ?? "idle",
      validationBasis: taskState?.validationBasis ?? null,
      validationConfidence: taskState?.validationConfidence ?? null,
      fileName: taskState?.attachedEvidenceMeta?.fileName ?? null,
      kind: taskState?.attachedEvidenceMeta?.kind ?? null,
      quality: taskState?.attachedEvidenceMeta?.quality ?? null,
      updatedAtISO: taskState?.updatedAtISO ?? null,
    },
    evidenceRequired: remediation.evidence,
    bundleCoverageStatus: deriveBundleCoverageStatus(
      taskState?.attachedEvidenceMeta,
      taskState?.validationStatus
    ),
    bundleFiles: taskState?.attachedEvidenceMeta ? [taskState.attachedEvidenceMeta.fileName] : [],
    snapshotContext: {
      currentSnapshotId: currentSnapshot?.snapshotId ?? null,
      comparedToSnapshotId: currentSnapshot?.comparedToSnapshotId ?? null,
      validatedBaselineSnapshotId: state.validatedBaselineSnapshotId ?? null,
    },
    review: state.traceabilityReviews[`trace-${entryId}`]
      ? {
          confirmedByUser: state.traceabilityReviews[`trace-${entryId}`].confirmedByUser,
          note: state.traceabilityReviews[`trace-${entryId}`].note,
          updatedAtISO: state.traceabilityReviews[`trace-${entryId}`].updatedAtISO,
        }
      : {
          confirmedByUser: false,
          note: null,
          updatedAtISO: null,
        },
    traceStatus: deriveTraceStatus(taskState?.attachedEvidenceMeta, taskState?.validationStatus),
    auditDecision,
    auditGateCodes,
    nextStep:
      primaryAuditBlocker
        ? primaryAuditBlocker
        : taskState?.attachedEvidenceMeta?.quality?.status === "weak"
        ? taskState.attachedEvidenceMeta.quality.summary
        : taskState?.validationStatus === "failed" || taskState?.validationStatus === "needs_review"
        ? taskState.validationMessage || remediation.fixPreview || remediation.evidence
        : !taskState?.attachedEvidenceMeta
          ? remediation.evidence
          : remediation.fixPreview || remediation.why,
  }
}

function buildTraceRecordFromFinding({
  state,
  finding,
  currentSnapshot,
  scanById,
  scanKindByDocument,
}: {
  state: ComplianceState
  finding: ScanFinding
  currentSnapshot: CompliScanSnapshot | null
  scanById: Map<string, ComplianceState["scans"][number]>
  scanKindByDocument: Map<string, ComplianceState["scans"][number]["sourceKind"]>
}): ComplianceTraceRecord {
  const entryId = buildFindingTaskId(finding.id)
  const taskState = getTaskStateByTaskId(state.taskState, entryId)
  const targets = getTaskResolutionTargets(state, entryId)
  const linkedDrifts = state.driftRecords.filter((drift) => targets.driftIds.includes(drift.id))
  const sourceKind =
    (finding.scanId ? scanById.get(finding.scanId)?.sourceKind : undefined) ??
    scanKindByDocument.get(finding.sourceDocument) ??
    "document"
  const auditDecision = deriveFindingAuditDecision(taskState, finding, linkedDrifts)
  const auditGateCodes = deriveFindingAuditGateCodes(taskState, finding, linkedDrifts)
  const primaryAuditBlocker = derivePrimaryFindingAuditBlocker(taskState, finding, linkedDrifts)

  return {
    id: `trace-${entryId}`,
    entryKind: "finding_task",
    entryId,
    title: finding.title,
    severity: finding.severity,
    remediationMode: null,
    controlFamily: getControlFamily({
      lawReference: finding.legalReference,
      principles: finding.principles,
      title: finding.title,
    }),
    lawReferences: getFindingLawReferences(finding),
    principles: finding.principles,
    sourceDocuments: [finding.sourceDocument],
    sourceKinds: [sourceKind],
    linkedFindingIds: [finding.id],
    linkedDriftIds: linkedDrifts.map((drift) => drift.id),
    linkedAlertIds: targets.alertIds,
    findingRefs: [
      {
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        sourceDocument: finding.sourceDocument,
        lawReferences: getFindingLawReferences(finding),
        status: "open",
      },
    ],
    driftRefs: linkedDrifts.map((drift) => ({
      id: drift.id,
      summary: drift.summary,
      severity: drift.severity,
      type: drift.type,
      change: drift.change,
      lawReference: drift.lawReference ?? null,
      open: drift.open,
    })),
    evidence: {
      attached: Boolean(taskState?.attachedEvidenceMeta),
      validationStatus: taskState?.validationStatus ?? "idle",
      validationBasis: taskState?.validationBasis ?? null,
      validationConfidence: taskState?.validationConfidence ?? null,
      fileName: taskState?.attachedEvidenceMeta?.fileName ?? null,
      kind: taskState?.attachedEvidenceMeta?.kind ?? null,
      quality: taskState?.attachedEvidenceMeta?.quality ?? null,
      updatedAtISO: taskState?.updatedAtISO ?? null,
    },
    evidenceRequired: finding.evidenceRequired ?? null,
    bundleCoverageStatus: deriveBundleCoverageStatus(
      taskState?.attachedEvidenceMeta,
      taskState?.validationStatus
    ),
    bundleFiles: taskState?.attachedEvidenceMeta ? [taskState.attachedEvidenceMeta.fileName] : [],
    snapshotContext: {
      currentSnapshotId: currentSnapshot?.snapshotId ?? null,
      comparedToSnapshotId: currentSnapshot?.comparedToSnapshotId ?? null,
      validatedBaselineSnapshotId: state.validatedBaselineSnapshotId ?? null,
    },
    review: state.traceabilityReviews[`trace-${entryId}`]
      ? {
          confirmedByUser: state.traceabilityReviews[`trace-${entryId}`].confirmedByUser,
          note: state.traceabilityReviews[`trace-${entryId}`].note,
          updatedAtISO: state.traceabilityReviews[`trace-${entryId}`].updatedAtISO,
        }
      : {
          confirmedByUser: false,
          note: null,
          updatedAtISO: null,
        },
    traceStatus: deriveTraceStatus(taskState?.attachedEvidenceMeta, taskState?.validationStatus),
    auditDecision,
    auditGateCodes,
    nextStep:
      primaryAuditBlocker
        ? primaryAuditBlocker
        : taskState?.attachedEvidenceMeta?.quality?.status === "weak"
        ? taskState.attachedEvidenceMeta.quality.summary
        : taskState?.validationStatus === "failed" || taskState?.validationStatus === "needs_review"
        ? taskState.validationMessage || finding.remediationHint || finding.evidenceRequired || finding.detail
        : !taskState?.attachedEvidenceMeta
          ? finding.evidenceRequired || finding.detail
          : finding.rescanHint || finding.remediationHint || finding.detail,
  }
}

function deriveAuditDecisionFromGates(gates: AuditQualityGate[]): AuditQualityGateDecision {
  if (gates.some((gate) => gate.decision === "blocked")) return "blocked"
  if (gates.some((gate) => gate.decision === "review")) return "review"
  return "pass"
}

function uniqueAuditGateCodes(gates: AuditQualityGate[]): AuditQualityGateCode[] {
  return [...new Set(gates.map((gate) => gate.code))]
}

function deriveFindingAuditDecision(
  taskState: ComplianceState["taskState"][string] | undefined,
  finding: ScanFinding,
  linkedDrifts: ComplianceState["driftRecords"]
): AuditQualityGateDecision {
  if (!taskState?.attachedEvidenceMeta) return "blocked"
  if (linkedDrifts.some((drift) => drift.open)) return "blocked"
  if (
    taskState.validationStatus === "needs_review" ||
    taskState.validationStatus === "failed" ||
    taskState.attachedEvidenceMeta.quality?.status === "weak" ||
    (finding.provenance?.verdictBasis === "inferred_signal" &&
      taskState.validationBasis !== "direct_signal")
  ) {
    return "review"
  }
  return "pass"
}

function deriveFindingAuditGateCodes(
  taskState: ComplianceState["taskState"][string] | undefined,
  finding: ScanFinding,
  linkedDrifts: ComplianceState["driftRecords"]
): AuditQualityGateCode[] {
  const codes: AuditQualityGateCode[] = []

  if (!taskState?.attachedEvidenceMeta) codes.push("missing_evidence")
  if (taskState?.validationStatus === "needs_review" || taskState?.validationStatus === "failed") {
    codes.push("pending_validation")
  }
  if (taskState?.attachedEvidenceMeta?.quality?.status === "weak") {
    codes.push("weak_evidence")
  }
  if (linkedDrifts.some((drift) => drift.open)) {
    codes.push("unresolved_drift")
  }
  if (
    finding.provenance?.verdictBasis === "inferred_signal" &&
    taskState?.validationBasis !== "direct_signal"
  ) {
    codes.push("inferred_only_finding")
  }

  return [...new Set(codes)]
}

function derivePrimaryFindingAuditBlocker(
  taskState: ComplianceState["taskState"][string] | undefined,
  finding: ScanFinding,
  linkedDrifts: ComplianceState["driftRecords"]
) {
  if (!taskState?.attachedEvidenceMeta) {
    return finding.evidenceRequired || "Finding-ul nu are încă dovadă atașată pentru audit."
  }

  if (linkedDrifts.some((drift) => drift.open)) {
    return `${linkedDrifts.filter((drift) => drift.open).length} drift-uri legate de acest finding sunt încă deschise și blochează auditul.`
  }

  if (taskState.validationStatus === "needs_review" || taskState.validationStatus === "failed") {
    return taskState.validationMessage || "Validarea finding-ului nu este încă închisă pentru audit."
  }

  if (taskState.attachedEvidenceMeta.quality?.status === "weak") {
    return taskState.attachedEvidenceMeta.quality.summary
  }

  if (
    finding.provenance?.verdictBasis === "inferred_signal" &&
    taskState.validationBasis !== "direct_signal"
  ) {
    return "Finding-ul se bazează doar pe semnal inferat și cere confirmare sau dovadă mai puternică înainte de audit."
  }

  return null
}

function deriveTraceStatus(
  evidence: ComplianceState["taskState"][string]["attachedEvidenceMeta"] | undefined,
  validationStatus: ComplianceState["taskState"][string]["validationStatus"] | undefined
): ComplianceTraceRecord["traceStatus"] {
  if (evidence && validationStatus === "passed" && evidence.quality?.status !== "weak") return "validated"
  if (!evidence) return "evidence_required"
  return "action_required"
}

function deriveBundleCoverageStatus(
  evidence: ComplianceState["taskState"][string]["attachedEvidenceMeta"] | undefined,
  validationStatus: ComplianceState["taskState"][string]["validationStatus"] | undefined
): ComplianceTraceRecord["bundleCoverageStatus"] {
  if (evidence && validationStatus === "passed" && evidence.quality?.status !== "weak") return "covered"
  if (evidence) return "partial"
  return "missing"
}

function getFindingLawReferences(finding: ScanFinding) {
  return unique([
    finding.legalReference,
    ...(finding.legalMappings ?? []).map((mapping) => `${mapping.regulation} ${mapping.article}`),
  ])
}

// Sprint 0.5 — Issue 2 fix: build traceability record pentru document semnat
// prin magic link. Documents `signed` sau `active` apar ca trace records `validated`,
// cu evidence atașat și auditDecision `pass`. Asta închide loop-ul vizual:
// "DPA aprobat → traceability validat" (era 4 controale blocked chiar cu DPA signed).
function buildTraceRecordFromApprovedDocument({
  state,
  document,
  currentSnapshot,
}: {
  state: ComplianceState
  document: ComplianceState["generatedDocuments"][number]
  currentSnapshot: CompliScanSnapshot | null
}): ComplianceTraceRecord {
  const approvalTaskId = `document-approval-${document.id}`
  const approvalTask = state.taskState[approvalTaskId]
  const evidence = approvalTask?.attachedEvidenceMeta ?? null
  const linkedFinding = document.sourceFindingId
    ? state.findings.find((finding) => finding.id === document.sourceFindingId) ?? null
    : null

  const lawReferences = linkedFinding ? getFindingLawReferences(linkedFinding) : []
  const principles = linkedFinding?.principles ?? []
  const sourceDocuments = unique([linkedFinding?.sourceDocument])
  const isFullyValidated =
    document.adoptionStatus === "signed" || document.adoptionStatus === "active"

  return {
    id: `trace-${approvalTaskId}`,
    entryKind: "document_approval",
    entryId: approvalTaskId,
    title: `Aprobare client: ${document.title}`,
    severity: linkedFinding?.severity ?? "medium",
    remediationMode: null,
    controlFamily: getControlFamily({
      validationKind: null,
      lawReference: lawReferences[0] ?? null,
      principles,
      title: document.title,
    }),
    lawReferences,
    principles,
    sourceDocuments,
    sourceKinds: [],
    linkedFindingIds: linkedFinding ? [linkedFinding.id] : [],
    linkedDriftIds: [],
    linkedAlertIds: [],
    findingRefs: linkedFinding
      ? [
          {
            id: linkedFinding.id,
            title: linkedFinding.title,
            severity: linkedFinding.severity,
            sourceDocument: linkedFinding.sourceDocument,
            lawReferences: getFindingLawReferences(linkedFinding),
            status: "resolved" as const,
          },
        ]
      : [],
    driftRefs: [],
    evidence: {
      attached: Boolean(evidence),
      validationStatus: approvalTask?.validationStatus ?? "passed",
      validationBasis: approvalTask?.validationBasis ?? "direct_signal",
      validationConfidence: approvalTask?.validationConfidence ?? "high",
      fileName: evidence?.fileName ?? null,
      kind: evidence?.kind ?? null,
      quality: evidence?.quality ?? null,
      updatedAtISO: approvalTask?.validatedAtISO ?? document.adoptionUpdatedAtISO ?? null,
    },
    evidenceRequired: null,
    bundleCoverageStatus: evidence ? "covered" : "partial",
    bundleFiles: evidence?.fileName ? [evidence.fileName] : [],
    snapshotContext: {
      currentSnapshotId: currentSnapshot?.snapshotId ?? null,
      comparedToSnapshotId: currentSnapshot?.comparedToSnapshotId ?? null,
      validatedBaselineSnapshotId: null,
    },
    review: {
      confirmedByUser: isFullyValidated,
      note: isFullyValidated
        ? `Aprobat de client prin magic link la ${
            document.adoptionUpdatedAtISO
              ? new Date(document.adoptionUpdatedAtISO).toLocaleString("ro-RO")
              : "—"
          }.`
        : null,
      updatedAtISO: document.adoptionUpdatedAtISO ?? null,
    },
    traceStatus: isFullyValidated ? "validated" : "evidence_required",
    auditDecision: isFullyValidated ? "pass" : "review",
    auditGateCodes: [],
    nextStep: isFullyValidated
      ? `Document aprobat și semnat de client. Atașat la dosar pentru audit.`
      : `Document trimis spre aprobare. Așteaptă semnătura clientului prin magic link.`,
  }
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])]
}

function uniqueSourceKinds(
  values: Array<ComplianceState["scans"][number]["sourceKind"] | null | undefined>
) {
  return [...new Set(values.filter(Boolean) as ComplianceTraceRecord["sourceKinds"])]
}
