import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { buildAuditQualityGates } from "@/lib/compliance/audit-quality-gates"
import { toAuditPackWorkspace } from "@/lib/compliance/audit-pack"
import { getControlFamily, getControlFamilyReusePolicySummary } from "@/lib/compliance/control-families"
import { normalizeDriftLifecycleStatus } from "@/lib/compliance/drift-lifecycle"
import { resolveFindingIdFromTaskId } from "@/lib/compliance/task-ids"
import type {
  ComplianceState,
  RemediationAction,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { CompliScanSnapshot } from "@/lib/compliscan/schema"
import { buildComplianceTraceRecords } from "@/lib/server/compliance-trace"

type BuildAuditPackInput = {
  state: ComplianceState
  remediationPlan: RemediationAction[]
  workspace: WorkspaceContext
  compliancePack: AICompliancePack
  snapshot: CompliScanSnapshot | null
}

export function buildAuditPack({
  state,
  remediationPlan,
  workspace,
  compliancePack,
  snapshot,
}: BuildAuditPackInput): AuditPackV2 {
  const generatedAt = new Date().toISOString()
  const validatedBaseline =
    state.snapshotHistory.find((item) => item.snapshotId === state.validatedBaselineSnapshotId) ?? null
  const activeDrifts = state.driftRecords.filter((item) => item.open)
  const auditQualityGates = buildAuditQualityGates({ state, remediationPlan, nowISO: generatedAt })
  const controlsMatrix = buildControlsMatrix(state, remediationPlan, auditQualityGates)
  const evidenceLedger = buildEvidenceLedger(state, remediationPlan)
  const validationLog = buildValidationLog(controlsMatrix)
  const traceabilityMatrix = buildComplianceTraceRecords({
    state,
    remediationPlan,
    snapshot,
  })
  const openControls = controlsMatrix.filter((item) => item.status !== "done").length
  const validatedEvidenceItems = controlsMatrix.filter((item) => item.auditDecision === "pass").length
  const missingEvidenceItems = controlsMatrix.filter((item) => item.auditDecision !== "pass").length

  return {
    version: "2.1",
    generatedAt,
    workspace: toAuditPackWorkspace(workspace),
    executiveSummary: {
      complianceScore: snapshot?.summary.complianceScore ?? null,
      riskLabel: snapshot?.summary.riskLabel ?? null,
      auditReadiness: deriveAuditReadiness(
        compliancePack,
        activeDrifts,
        missingEvidenceItems,
        auditQualityGates
      ),
      baselineStatus: validatedBaseline ? "validated" : "missing",
      systemsInScope: compliancePack.entries.length,
      sourcesInScope: snapshot?.sources.length ?? 0,
      openFindings: compliancePack.summary.openFindings,
      activeDrifts: activeDrifts.length,
      remediationOpen: openControls,
      validatedEvidenceItems,
      missingEvidenceItems,
      auditQualityDecision: auditQualityGates.decision,
      blockedQualityGates: auditQualityGates.blockedCount,
      reviewQualityGates: auditQualityGates.reviewCount,
      topBlockers: buildTopBlockers({
        validatedBaseline,
        compliancePack,
        activeDrifts,
        missingEvidenceItems,
        auditQualityGates,
      }),
      nextActions: buildNextActions({
        validatedBaseline,
        compliancePack,
        activeDrifts,
        missingEvidenceItems,
        auditQualityGates,
      }),
    },
    bundleEvidenceSummary: buildBundleEvidenceSummary(compliancePack, controlsMatrix),
    scope: {
      snapshot: {
        id: snapshot?.snapshotId ?? null,
        generatedAt: snapshot?.generatedAt ?? null,
        comparedToSnapshotId: snapshot?.comparedToSnapshotId ?? null,
      },
      validatedBaseline: validatedBaseline
        ? {
            id: validatedBaseline.snapshotId,
            generatedAt: validatedBaseline.generatedAt,
          }
        : null,
      sourceCoverage: compliancePack.summary.sourceCoverage,
      sources: (snapshot?.sources ?? []).map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        scannedAt: source.scannedAt,
        analysisStatus: source.analysisStatus,
        extractionStatus: source.extractionStatus,
        sourceFingerprint: source.sourceFingerprint,
      })),
    },
    systemRegister: compliancePack.entries.map((entry) => ({
      id: entry.id,
      systemName: entry.systemName,
      readiness: entry.readiness,
      discoveryMethod: entry.discoveryMethod,
      detectionStatus: entry.detectionStatus,
      confidence: entry.confidence,
      confidenceModel: entry.confidenceModel,
      provider: entry.identity.provider,
      model: entry.identity.model,
      purpose: entry.identity.purpose,
      owner: entry.governance.owner,
      riskClass: entry.governance.riskClass,
      regulatoryAreas: entry.compliance.regulatoryAreas,
      principles: entry.compliance.principles,
      highestSeverity: entry.compliance.highestSeverity,
      openFindings: entry.compliance.openFindings,
      openDrifts: entry.compliance.openDrifts,
      humanReview: {
        required: entry.governance.humanReviewRequired,
        present: entry.governance.humanReviewPresent,
      },
      personalDataUsed: entry.governance.personalDataUsed,
      prefillCompletenessScore: entry.prefill.completenessScore,
      missingPrefillFields: entry.prefill.missingFields,
      evidenceStatus: {
        attachedCount: entry.evidence.attachedCount,
        validatedCount: entry.evidence.validatedCount,
        missingCount: entry.evidence.missingCount,
        validationStatus: entry.evidence.validationStatus,
      },
      sourceRefs: entry.sources,
      legalReferences: entry.compliance.legalReferences,
      requiredControls: entry.compliance.requiredControls,
      suggestedControls: entry.compliance.suggestedControls,
      suggestedNextStep: entry.suggestedNextStep,
      evidenceBundle: entry.evidenceBundle,
      traceSummary: entry.traceSummary,
    })),
    controlsMatrix,
    evidenceLedger,
    auditQualityGates,
    driftRegister: activeDrifts.map((drift) => ({
      id: drift.id,
      type: drift.type,
      change: drift.change,
      severity: drift.severity,
      summary: drift.summary,
      severityReason: drift.severityReason ?? null,
      impactSummary: drift.impactSummary ?? null,
      nextAction: drift.nextAction ?? null,
      evidenceRequired: drift.evidenceRequired ?? null,
      lawReference: drift.lawReference ?? null,
      systemLabel: drift.systemLabel ?? null,
      sourceDocument: drift.sourceDocument ?? null,
      detectedAtISO: drift.detectedAtISO,
      escalationOwner: drift.escalationOwner ?? null,
      escalationTier: drift.escalationTier ?? null,
      escalationSlaHours: drift.escalationSlaHours ?? null,
      escalationDueAtISO: drift.escalationDueAtISO ?? null,
      lifecycleStatus: normalizeDriftLifecycleStatus(drift.lifecycleStatus, true),
      acknowledgedAtISO: drift.acknowledgedAtISO ?? null,
      acknowledgedBy: drift.acknowledgedBy ?? null,
      inProgressAtISO: drift.inProgressAtISO ?? null,
      resolvedAtISO: drift.resolvedAtISO ?? null,
      waivedAtISO: drift.waivedAtISO ?? null,
      waivedReason: drift.waivedReason ?? null,
      escalationBreachedAtISO: drift.escalationBreachedAtISO ?? null,
      lastStatusUpdatedAtISO: drift.lastStatusUpdatedAtISO ?? null,
      blocksAudit: drift.blocksAudit ?? false,
      blocksBaseline: drift.blocksBaseline ?? false,
      requiresHumanApproval: drift.requiresHumanApproval ?? false,
      open: drift.open,
      before: drift.before,
      after: drift.after,
      linkedTaskIds: remediationPlan
        .filter((task) => task.relatedDriftIds?.includes(drift.id))
        .map((task) => `rem-${task.id}`),
    })),
    validationLog,
    timeline: [...state.events]
      .sort((left, right) => left.createdAtISO.localeCompare(right.createdAtISO))
      .slice(-80)
      .map((event) => ({
        id: event.id,
        createdAtISO: event.createdAtISO,
        entityType: event.entityType,
        entityId: event.entityId,
        type: event.type,
        message: event.message,
        actorId: event.actorId,
        actorLabel: event.actorLabel,
        actorRole: event.actorRole,
        actorSource: event.actorSource,
        metadata: event.metadata ?? null,
      })),
    traceabilityMatrix,
    appendix: {
      snapshot,
      validatedBaseline,
      compliancePack,
    },
  }
}

function buildBundleEvidenceSummary(
  compliancePack: AICompliancePack,
  controlsMatrix: ReturnType<typeof buildControlsMatrix>
): AuditPackV2["bundleEvidenceSummary"] {
  const evidenceByKind = new Map<string, number>()
  const lawCoverage = new Map<
    string,
    {
      totalControls: number
      validatedControls: number
      pendingControls: number
    }
  >()
  const includedFiles = new Set<string>()
  const familyCoverage = new Map<
    string,
    {
      familyLabel: string
      familyDescription: string
      totalControls: number
      attachedControls: number
      validatedControls: number
      pendingControls: number
      includedFiles: Set<string>
      reusableFiles: Set<string>
      reusePolicy: string
    }
  >()

  for (const entry of compliancePack.entries) {
    for (const kind of entry.evidenceBundle.evidenceKinds) {
      evidenceByKind.set(kind, (evidenceByKind.get(kind) ?? 0) + 1)
    }
    for (const coverage of entry.evidenceBundle.lawCoverage) {
      const current = lawCoverage.get(coverage.lawReference) ?? {
        totalControls: 0,
        validatedControls: 0,
        pendingControls: 0,
      }
      current.totalControls += coverage.totalControls
      current.validatedControls += coverage.validatedControls
      current.pendingControls += coverage.pendingControls
      lawCoverage.set(coverage.lawReference, current)
    }
    for (const file of entry.evidenceBundle.files) {
      includedFiles.add(file)
    }
  }

  for (const control of controlsMatrix) {
    const current = familyCoverage.get(control.controlFamily.key) ?? {
      familyLabel: control.controlFamily.label,
      familyDescription: control.controlFamily.description,
      totalControls: 0,
      attachedControls: 0,
      validatedControls: 0,
      pendingControls: 0,
      includedFiles: new Set<string>(),
      reusableFiles: new Set<string>(),
      reusePolicy: getControlFamilyReusePolicySummary(control.controlFamily.key),
    }
    current.totalControls += 1
    if (control.attachedEvidence?.fileName) current.includedFiles.add(control.attachedEvidence.fileName)
    if (control.attachedEvidence) current.attachedControls += 1
    if (control.auditDecision === "pass") {
      current.validatedControls += 1
      if (control.attachedEvidence?.fileName) current.reusableFiles.add(control.attachedEvidence.fileName)
    } else {
      current.pendingControls += 1
    }
    familyCoverage.set(control.controlFamily.key, current)
  }

  const readyBundles = compliancePack.entries.filter(
    (entry) => entry.evidenceBundle.status === "bundle_ready"
  ).length
  const partialBundles = compliancePack.entries.filter(
    (entry) => entry.evidenceBundle.status === "partial"
  ).length
  const missingBundles = compliancePack.entries.filter(
    (entry) => entry.evidenceBundle.status === "missing_evidence"
  ).length

  const status: AuditPackV2["bundleEvidenceSummary"]["status"] =
    missingBundles === 0 && partialBundles === 0 ? "bundle_ready" : "review_required"

  return {
    status,
    attachedFiles: compliancePack.entries.reduce(
      (total, entry) => total + entry.evidenceBundle.attachedItems,
      0
    ),
    validatedFiles: compliancePack.entries.reduce(
      (total, entry) => total + entry.evidenceBundle.validatedItems,
      0
    ),
    pendingControls: compliancePack.entries.reduce(
      (total, entry) => total + entry.evidenceBundle.pendingItems,
      0
    ),
    readyBundles,
    partialBundles,
    missingBundles,
    evidenceByKind: [...evidenceByKind.entries()].map(([kind, count]) => ({ kind, count })),
    lawCoverage: [...lawCoverage.entries()].map(([lawReference, coverage]) => ({
      lawReference,
      totalControls: coverage.totalControls,
      validatedControls: coverage.validatedControls,
      pendingControls: coverage.pendingControls,
    })),
    familyCoverage: [...familyCoverage.entries()].map(([familyKey, coverage]) => ({
      familyKey,
      familyLabel: coverage.familyLabel,
      familyDescription: coverage.familyDescription,
      totalControls: coverage.totalControls,
      attachedControls: coverage.attachedControls,
      validatedControls: coverage.validatedControls,
      pendingControls: coverage.pendingControls,
      reusableEvidenceFiles: coverage.reusableFiles.size,
      reuseAvailable: coverage.reusableFiles.size > 0 && coverage.pendingControls > 0,
      reusePolicy: coverage.reusePolicy,
      includedFiles: [...coverage.includedFiles],
    })),
    includedFiles: [...includedFiles],
  }
}

function buildControlsMatrix(
  state: ComplianceState,
  remediationPlan: RemediationAction[],
  auditQualityGates: AuditPackV2["auditQualityGates"]
): AuditPackV2["controlsMatrix"] {
  const gatesByTaskId = new Map<string, AuditPackV2["auditQualityGates"]["items"]>()
  for (const item of auditQualityGates.items) {
    const current = gatesByTaskId.get(item.taskId) ?? []
    current.push(item)
    gatesByTaskId.set(item.taskId, current)
  }

  return remediationPlan.map((task) => {
    const taskId = `rem-${task.id}`
    const taskState = state.taskState[taskId]
    const taskQualityGates = gatesByTaskId.get(taskId) ?? []
    const auditDecision: AuditPackV2["controlsMatrix"][number]["auditDecision"] =
      taskQualityGates.some((item) => item.decision === "blocked")
        ? "blocked"
        : taskQualityGates.some((item) => item.decision === "review")
          ? "review"
          : "pass"

    return {
      taskId,
      title: task.title,
      priority: task.priority,
      severity: task.severity,
      remediationMode: task.remediationMode,
      principles: task.principles ?? [],
      owner: task.owner,
      controlFamily: getControlFamily({
        validationKind: task.validationKind,
        lawReference: task.lawReference,
        principles: task.principles,
        title: task.title,
      }),
      lawReference: task.lawReference ?? null,
      sourceDocument: task.sourceDocument ?? null,
      why: task.why,
      status: taskState?.status ?? "todo",
      validationStatus: taskState?.validationStatus ?? "idle",
      validationMessage: taskState?.validationMessage ?? null,
      evidenceRequired: task.evidence,
      evidenceTypes: task.evidenceTypes ?? [],
      readyText: {
        label: task.readyTextLabel ?? null,
        content: task.readyText ?? null,
      },
      relatedFindingIds: task.relatedFindingIds ?? [],
      relatedDriftIds: task.relatedDriftIds ?? [],
      attachedEvidence: taskState?.attachedEvidenceMeta ?? null,
      evidenceQuality: taskState?.attachedEvidenceMeta?.quality ?? null,
      auditDecision,
      auditGateCodes: taskQualityGates.map((item) => item.code),
      lastRescanAtISO: taskState?.lastRescanAtISO ?? null,
      validatedAtISO: taskState?.validatedAtISO ?? null,
    }
  })
}

function buildEvidenceLedger(state: ComplianceState, remediationPlan: RemediationAction[]) {
  return Object.entries(state.taskState)
    .filter(([, taskState]) => taskState.attachedEvidenceMeta || taskState.validationStatus)
    .map(([taskId, taskState]) => {
      const remediation = remediationPlan.find((item) => `rem-${item.id}` === taskId)
      const finding =
        taskId.startsWith("finding-")
          ? state.findings.find((item) => item.id === resolveFindingIdFromTaskId(taskId))
          : undefined

      return {
        taskId,
        title: remediation?.title || finding?.title || "Task fara titlu",
        lawReference: remediation?.lawReference || finding?.legalReference || null,
        status: taskState.status,
        validationStatus: taskState.validationStatus ?? "idle",
        validationMessage: taskState.validationMessage ?? null,
        updatedAtISO: taskState.updatedAtISO,
        evidence: taskState.attachedEvidenceMeta ?? null,
        evidenceQuality: taskState.attachedEvidenceMeta?.quality ?? null,
        sourceDocument: remediation?.sourceDocument || finding?.sourceDocument || null,
      }
    })
    .sort((left, right) => right.updatedAtISO.localeCompare(left.updatedAtISO))
}

function buildValidationLog(
  controlsMatrix: ReturnType<typeof buildControlsMatrix>
) {
  return controlsMatrix
    .filter(
      (task) =>
        task.validationStatus !== "idle" ||
        Boolean(task.validatedAtISO) ||
        Boolean(task.attachedEvidence)
    )
    .map((task) => ({
      taskId: task.taskId,
      title: task.title,
      severity: task.severity,
      validationStatus: task.validationStatus,
      validationMessage: task.validationMessage,
      validatedAtISO: task.validatedAtISO,
      lastRescanAtISO: task.lastRescanAtISO,
      evidence: task.attachedEvidence,
      relatedFindingIds: task.relatedFindingIds,
      relatedDriftIds: task.relatedDriftIds,
    }))
    .sort((left, right) => {
      const leftDate = left.validatedAtISO ?? left.lastRescanAtISO ?? ""
      const rightDate = right.validatedAtISO ?? right.lastRescanAtISO ?? ""
      return rightDate.localeCompare(leftDate)
    })
}

function deriveAuditReadiness(
  compliancePack: AICompliancePack,
  activeDrifts: ComplianceState["driftRecords"],
  missingEvidenceItems: number,
  auditQualityGates: AuditPackV2["auditQualityGates"]
): AuditPackV2["executiveSummary"]["auditReadiness"] {
  const activeDriftCount = activeDrifts.length
  const blockingDrifts = activeDrifts.filter((drift) => drift.blocksAudit).length
  const breachedDrifts = activeDrifts.filter((drift) => Boolean(drift.escalationBreachedAtISO)).length

  if (
    auditQualityGates.decision === "pass" &&
    compliancePack.summary.reviewRequiredEntries === 0 &&
    compliancePack.summary.openFindings === 0 &&
    activeDriftCount === 0 &&
    blockingDrifts === 0 &&
    breachedDrifts === 0 &&
    missingEvidenceItems === 0
  ) {
    return "audit_ready"
  }

  return "review_required"
}

function buildTopBlockers({
  validatedBaseline,
  compliancePack,
  activeDrifts,
  missingEvidenceItems,
  auditQualityGates,
}: {
  validatedBaseline: CompliScanSnapshot | null
  compliancePack: AICompliancePack
  activeDrifts: ComplianceState["driftRecords"]
  missingEvidenceItems: number
  auditQualityGates: AuditPackV2["auditQualityGates"]
}) {
  const blockers: string[] = []
  const auditBlockingDrifts = activeDrifts.filter((drift) => drift.blocksAudit)
  const baselineBlockingDrifts = activeDrifts.filter((drift) => drift.blocksBaseline)
  const humanApprovalDrifts = activeDrifts.filter((drift) => drift.requiresHumanApproval)
  const breachedDrifts = activeDrifts.filter((drift) => Boolean(drift.escalationBreachedAtISO))
  const blockedQualityItems = auditQualityGates.items.filter((item) => item.decision === "blocked")
  const reviewQualityItems = auditQualityGates.items.filter((item) => item.decision === "review")

  if (!validatedBaseline) blockers.push("Nu exista baseline validat pentru comparatie auditabila.")
  if (auditBlockingDrifts.length > 0) {
    blockers.push(`${auditBlockingDrifts.length} drift-uri blocheaza auditul pana la remediere sau aprobare.`)
  } else if (activeDrifts.length > 0) {
    blockers.push(`${activeDrifts.length} drift-uri active trebuie explicate sau remediate.`)
  }
  if (breachedDrifts.length > 0) {
    blockers.push(`${breachedDrifts.length} drift-uri au depasit SLA-ul si cer asumare explicita din partea owner-ului.`)
  }
  if (baselineBlockingDrifts.length > 0) {
    blockers.push(`${baselineBlockingDrifts.length} drift-uri blocheaza validarea unui baseline nou.`)
  }
  if (humanApprovalDrifts.length > 0) {
    blockers.push(`${humanApprovalDrifts.length} drift-uri cer aprobare umana explicita inainte de inchidere.`)
  }
  if (missingEvidenceItems > 0) blockers.push(`${missingEvidenceItems} controale nu au dovada validata.`)
  if (blockedQualityItems.length > 0) {
    blockers.push(
      `${blockedQualityItems.length} controale sunt blocate de quality gates (dovada lipsa sau drift nerezolvat).`
    )
  }
  if (reviewQualityItems.length > 0) {
    blockers.push(
      `${reviewQualityItems.length} controale cer review suplimentar pentru calitatea sau actualitatea dovezii.`
    )
  }
  if (compliancePack.summary.openFindings > 0) {
    blockers.push(`${compliancePack.summary.openFindings} findings raman deschise in sfera auditului.`)
  }
  if (compliancePack.summary.reviewRequiredEntries > 0) {
    blockers.push(
      `${compliancePack.summary.reviewRequiredEntries} sisteme raman in stadiu review_required.`
    )
  }

  return blockers.slice(0, 5)
}

function buildNextActions({
  validatedBaseline,
  compliancePack,
  activeDrifts,
  missingEvidenceItems,
  auditQualityGates,
}: {
  validatedBaseline: CompliScanSnapshot | null
  compliancePack: AICompliancePack
  activeDrifts: ComplianceState["driftRecords"]
  missingEvidenceItems: number
  auditQualityGates: AuditPackV2["auditQualityGates"]
}) {
  const actions: string[] = []
  const auditBlockingDrifts = activeDrifts.filter((drift) => drift.blocksAudit)
  const breachedDrifts = activeDrifts.filter((drift) => Boolean(drift.escalationBreachedAtISO))
  const urgentDrift = [...activeDrifts].sort((left, right) =>
    (left.escalationDueAtISO ?? "").localeCompare(right.escalationDueAtISO ?? "")
  )[0]
  const weakEvidenceItems = auditQualityGates.items.filter((item) => item.code === "weak_evidence")
  const staleEvidenceItems = auditQualityGates.items.filter((item) => item.code === "stale_evidence")
  const inferredOnlyItems = auditQualityGates.items.filter((item) => item.code === "inferred_only_finding")

  if (!validatedBaseline) actions.push("Valideaza snapshot-ul curent ca baseline pentru comparatii viitoare.")
  if (auditBlockingDrifts.length > 0) {
    actions.push("Trateaza mai intai drift-urile care blocheaza auditul si atasaza dovada noua pentru fiecare schimbare materiala.")
  } else if (activeDrifts.length > 0) {
    actions.push("Inchide drift-urile active si ataseaza dovezi noi pentru schimbarile tehnice.")
  }
  if (urgentDrift?.requiresHumanApproval) {
    actions.push("Obtine aprobare umana explicita pentru drift-urile marcate ca needing human approval inainte de export.")
  }
  if (breachedDrifts.length > 0) {
    actions.push("Preia sau escaladeaza drift-urile cu SLA depasit si noteaza explicit owner-ul responsabil in audit trail.")
  }
  if (missingEvidenceItems > 0) actions.push("Completeaza dovezile lipsa si ruleaza rescan pe task-urile deschise.")
  if (weakEvidenceItems.length > 0) {
    actions.push("Inlocuieste dovezile slabe cu capturi, loguri sau bundle-uri mai specifice inainte de export.")
  }
  if (staleEvidenceItems.length > 0) {
    actions.push("Revalideaza dovezile vechi sau afectate de drift si incarca variante actualizate.")
  }
  if (inferredOnlyItems.length > 0) {
    actions.push("Adauga confirmare umana sau dovada directa pentru controalele bazate doar pe semnale inferate.")
  }
  if (compliancePack.summary.reviewRequiredEntries > 0) {
    actions.push("Confirma sau respinge sistemele aflate in review pentru a stabiliza inventarul AI.")
  }
  if (actions.length === 0) {
    actions.push("Exporta dosarul si pastreaza audit pack-ul ca punct de control pentru urmatoarea revizie.")
  }

  return actions.slice(0, 4)
}
