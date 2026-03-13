import {
  normalizeCompliancePrinciples,
  normalizeComplianceSeverity,
  summarizePrinciples,
  type CompliancePrinciple,
} from "@/lib/compliance/constitution"
import type {
  AICompliancePack,
  AICompliancePackConfidenceState,
  AICompliancePackEvidenceBundle,
  AICompliancePackEntry,
  AICompliancePackFieldKey,
  AICompliancePackFieldRef,
  AICompliancePackFieldConfidenceState,
  AICompliancePackFieldStatus,
  AIComplianceSuggestedControl,
  AICompliancePackSourceOrigin,
} from "@/lib/compliance/ai-compliance-pack"
import type {
  ComplianceState,
  RemediationAction,
  TaskEvidenceKind,
  WorkspaceContext,
} from "@/lib/compliance/types"
import { getControlFamily, getControlFamilyReusePolicySummary } from "@/lib/compliance/control-families"
import type { CompliScanSnapshot, CompliScanSystem } from "@/lib/compliscan/schema"
import { parseCompliScanYaml } from "@/lib/server/compliscan-yaml"

type BuildAICompliancePackInput = {
  state: ComplianceState
  remediationPlan: RemediationAction[]
  workspace: WorkspaceContext
  snapshot: CompliScanSnapshot | null
}

type SourceMaterial = {
  id: string
  name: string
  scannedAt: string
  origin: AICompliancePackSourceOrigin
  prefilledFields: string[]
  text: string
}

export function buildAICompliancePack({
  state,
  remediationPlan,
  workspace,
  snapshot,
}: BuildAICompliancePackInput): AICompliancePack {
  const generatedAt = snapshot?.generatedAt ?? new Date().toISOString()
  const sourceOriginCounts = countSourceCoverage(state)
  const entries = (snapshot?.systems ?? []).map((system) =>
    buildPackEntry({ system, state, remediationPlan, snapshot })
  )
  const averageCompletenessScore =
    entries.length === 0
      ? 0
      : Math.round(
          entries.reduce((total, entry) => total + entry.prefill.completenessScore, 0) / entries.length
        )

  return {
    version: "4.0",
    generatedAt,
    workspace: {
      orgId: workspace.orgId,
      orgName: workspace.orgName,
      workspaceLabel: workspace.workspaceLabel,
      workspaceOwner: workspace.workspaceOwner,
    },
    snapshotId: snapshot?.snapshotId ?? null,
    comparedToSnapshotId: snapshot?.comparedToSnapshotId ?? null,
    summary: {
      totalEntries: entries.length,
      auditReadyEntries: entries.filter((entry) => entry.readiness === "audit_ready").length,
      reviewRequiredEntries: entries.filter((entry) => entry.readiness === "review_required").length,
      openFindings: entries.reduce((total, entry) => total + entry.compliance.openFindings, 0),
      openDrifts: entries.reduce((total, entry) => total + entry.compliance.openDrifts, 0),
      missingEvidenceItems: entries.reduce((total, entry) => total + entry.evidence.missingCount, 0),
      averageCompletenessScore,
      annexLiteReadyEntries: entries.filter((entry) => entry.prefill.completenessScore >= 75).length,
      bundleReadyEntries: entries.filter((entry) => entry.evidenceBundle.status === "bundle_ready")
        .length,
      confidenceCoverage: {
        detected: entries.filter((entry) => entry.confidenceModel.state === "detected").length,
        inferred: entries.filter((entry) => entry.confidenceModel.state === "inferred").length,
        confirmedByUser: entries.filter(
          (entry) => entry.confidenceModel.state === "confirmed_by_user"
        ).length,
      },
      fieldConfidenceCoverage: summarizeFieldConfidence(entries),
      sourceCoverage: sourceOriginCounts,
    },
    entries,
  }
}

function buildPackEntry({
  system,
  state,
  remediationPlan,
  snapshot,
}: {
  system: CompliScanSystem
  state: ComplianceState
  remediationPlan: RemediationAction[]
  snapshot: CompliScanSnapshot | null
}): AICompliancePackEntry {
  const materials = resolveSourceMaterials(system, state, snapshot)
  const sources = materials.map(({ id, name, scannedAt, origin, prefilledFields }) => ({
    id,
    name,
    scannedAt,
    origin,
    prefilledFields,
  }))
  const sourceIds = new Set(materials.map((source) => source.id))
  const sourceNames = new Set(materials.map((source) => source.name))
  const sourceOrigins = new Set(materials.map((source) => source.origin))
  const sourceTexts = materials.map((source) => source.text).filter(Boolean)
  const fieldOverrides = state.aiComplianceFieldOverrides[system.id] ?? {}

  const relatedFindings = (snapshot?.findings ?? []).filter(
    (finding) =>
      (finding.sourceId ? sourceIds.has(finding.sourceId) : false) ||
      (finding.sourceId ? false : sourceNames.has(findSourceDocumentForFinding(finding, state)))
  )
  const relatedDrifts = state.driftRecords.filter(
    (drift) =>
      drift.open &&
      (drift.systemLabel === system.systemName ||
        (!!drift.sourceDocument && sourceNames.has(drift.sourceDocument)))
  )
  const relatedTasks = remediationPlan.filter((task) => {
    const taskSourceMatch = task.sourceDocument ? sourceNames.has(task.sourceDocument) : false
    const taskFindingMatch = task.relatedFindingIds?.some((findingId) =>
      relatedFindings.some((finding) => finding.id === findingId)
    )
    const taskDriftMatch = task.relatedDriftIds?.some((driftId) =>
      relatedDrifts.some((drift) => drift.id === driftId)
    )

    return Boolean(taskSourceMatch || taskFindingMatch || taskDriftMatch)
  })

  const taskEntries = relatedTasks.map((task) => ({
    task,
    taskState: state.taskState[`rem-${task.id}`],
  }))
  const taskStateEntries = taskEntries.map((entry) => entry.taskState).filter(Boolean)

  const latestEvidence = taskStateEntries
    .map((item) => item?.attachedEvidenceMeta)
    .filter(Boolean)
    .sort((a, b) => (a!.uploadedAtISO < b!.uploadedAtISO ? 1 : -1))[0]

  const legalReferences = new Set<string>()
  for (const finding of relatedFindings) {
    if (finding.legalReference) legalReferences.add(finding.legalReference)
  }
  for (const task of relatedTasks) {
    if (task.lawReference) legalReferences.add(task.lawReference)
  }
  const effectiveLegalReferences =
    readLegalMappingFieldOverride(fieldOverrides, "legal_mapping") ?? [...legalReferences]

  const explicitResidency =
    readStringFieldOverride(fieldOverrides, "data_residency") ?? findMetadataValue(system, "Data residency:")
  const explicitRetention =
    readNumberFieldOverride(fieldOverrides, "retention_days") ?? findRetentionDays(system)
  const effectiveProvider = readStringFieldOverride(fieldOverrides, "provider") ?? system.provider
  const effectiveModel = readStringFieldOverride(fieldOverrides, "model") ?? system.model
  const effectivePurpose = readStringFieldOverride(fieldOverrides, "purpose") ?? system.purpose
  const effectiveRiskClass =
    readRiskClassFieldOverride(fieldOverrides, "risk_class") ?? system.riskClass
  const effectivePersonalData =
    readBooleanFieldOverride(fieldOverrides, "personal_data") ?? system.personalDataUsed
  const effectiveHumanReview =
    readHumanOversightFieldOverride(fieldOverrides, "human_oversight") ?? system.humanReview

  const missingItems = relatedTasks
    .filter((task) => {
      const persisted = state.taskState[`rem-${task.id}`]
      return !persisted?.attachedEvidenceMeta || persisted.validationStatus !== "passed"
    })
    .map((task) => task.evidence)

  const regulatoryAreas = new Set(relatedFindings.map((finding) => finding.regulatoryArea))
  if (effectivePersonalData) regulatoryAreas.add("gdpr")
  if (effectiveRiskClass === "high" || effectiveRiskClass === "limited") {
    regulatoryAreas.add("eu_ai_act")
  }

  const sourceSignals = buildSourceSignals(system, sourceTexts, explicitResidency)
  const fieldStatus = buildFieldStatus({
    system,
    sourceOrigins,
    legalReferences: effectiveLegalReferences,
    explicitResidency,
    explicitRetention,
    overrides: fieldOverrides,
    effectiveValues: {
      provider: effectiveProvider,
      model: effectiveModel,
      purpose: effectivePurpose,
      riskClass: effectiveRiskClass,
      personalDataUsed: effectivePersonalData,
      humanReview: effectiveHumanReview,
    },
  })
  const prefill = buildPrefillSummary(fieldStatus)
  const openFindings = relatedFindings.filter((finding) => finding.status === "open").length
  const openDrifts = relatedDrifts.length
  const highestSeverity = highestSeverityFrom([
    ...relatedFindings.map((finding) => finding.severity),
    ...relatedDrifts.map((drift) => drift.severity),
  ])
  const validationStatuses = taskStateEntries.map((item) => item!.validationStatus ?? "idle")
  const validationStatus = deriveValidationStatus(validationStatuses)
  const evidenceBundle = buildEvidenceBundle({
    taskEntries,
    legalReferences: effectiveLegalReferences,
  })
  const principles = normalizeCompliancePrinciples(
    system.principles,
    relatedFindings.map((finding) => finding.principle)
  )
  const confidenceModel = deriveConfidenceModel({
    system,
    fieldStatus,
    sourceOrigins,
    sourceSignals,
    relatedFindingsCount: relatedFindings.length,
  })
  const suggestedControls = buildSuggestedControls({
    system,
    relatedTasks,
    sourceTexts,
    sourceSignals,
    effectiveValues: {
      provider: effectiveProvider,
      model: effectiveModel,
      purpose: effectivePurpose,
      riskClass: effectiveRiskClass,
      personalDataUsed: effectivePersonalData,
      humanReview: effectiveHumanReview,
    },
    explicitResidency,
    explicitRetention,
    relatedFindingsCount: relatedFindings.length,
  })
  const requiredControls = suggestedControls.map((control) => control.title)
  const readiness = derivePackReadiness({
    system,
    openFindings,
    openDrifts,
    missingEvidenceCount: missingItems.length,
  })
  const traceSummary = buildTraceSummary({
    relatedTasks,
    taskStateEntries,
    openFindings,
    openDrifts,
    legalReferences: effectiveLegalReferences,
    validatedBaselinePresent: Boolean(
      state.validatedBaselineSnapshotId &&
        snapshot?.comparedToSnapshotId === state.validatedBaselineSnapshotId
    ),
    evidenceBundleStatus: evidenceBundle.status,
  })

  return {
    id: `pack-${system.id}`,
    systemId: system.id,
    systemName: system.systemName,
    readiness,
    discoveryMethod: system.discoveryMethod,
    detectionStatus: system.detectionStatus,
    confidence: system.confidence,
    confidenceModel,
    identity: {
      provider: effectiveProvider,
      model: effectiveModel,
      purpose: effectivePurpose,
      frameworks: system.frameworks,
    },
    governance: {
      riskClass: effectiveRiskClass,
      personalDataUsed: effectivePersonalData,
      automatedDecisions: system.automatedDecisions,
      impactsRights: system.impactsRights,
      humanReviewRequired: effectiveHumanReview.required,
      humanReviewPresent: effectiveHumanReview.present,
      dataResidency: explicitResidency,
      retentionDays: explicitRetention,
      owner: system.owner,
    },
    compliance: {
      principles,
      regulatoryAreas: [...regulatoryAreas],
      highestSeverity,
      openFindings,
      openDrifts,
      legalReferences: effectiveLegalReferences,
      requiredControls,
      suggestedControls,
    },
    evidence: {
      attachedCount: taskStateEntries.filter((item) => item?.attachedEvidenceMeta).length,
      validatedCount: taskStateEntries.filter((item) => item?.validationStatus === "passed").length,
      missingCount: missingItems.length,
      missingItems,
      latestEvidence,
      validationStatus,
    },
    evidenceBundle,
    traceSummary,
    sourceSignals,
    prefill,
    annexLiteDraft: buildAnnexLiteDraft({
      system,
      sources,
      sourceTexts,
      confidenceModel,
      readiness,
      validationStatus,
      evidenceBundle,
      prefill,
      openFindings,
      openDrifts,
      principles,
      legalReferences: effectiveLegalReferences,
      requiredControls,
      suggestedControls,
      sourceSignals,
      explicitResidency,
      explicitRetention,
      effectiveValues: {
        provider: effectiveProvider,
        model: effectiveModel,
        purpose: effectivePurpose,
        riskClass: effectiveRiskClass,
        personalDataUsed: effectivePersonalData,
        humanReview: effectiveHumanReview,
      },
    }),
    sources,
    suggestedNextStep: buildSuggestedNextStep({
      readiness,
      openDrifts,
      confidenceState: confidenceModel.state,
      missingEvidenceCount: missingItems.length,
      principles,
      completenessScore: prefill.completenessScore,
    }),
  }
}

function resolveSourceMaterials(
  system: CompliScanSystem,
  state: ComplianceState,
  snapshot: CompliScanSnapshot | null
): SourceMaterial[] {
  const sourcesById = new Map((snapshot?.sources ?? []).map((source) => [source.id, source]))
  const scansById = new Map(state.scans.map((scan) => [scan.id, scan]))

  const refs = system.sourceIds
    .map((sourceId) => {
      const source = sourcesById.get(sourceId)
      const scan = scansById.get(sourceId)
      if (!source || !scan) return null

      return {
        id: source.id,
        name: source.name,
        scannedAt: source.scannedAt,
        origin: mapSourceOrigin(scan.sourceKind),
        prefilledFields: prefilledFieldsForSource(scan.sourceKind),
        text: scan.contentExtracted || scan.contentPreview || "",
      }
    })
    .filter((source): source is SourceMaterial => Boolean(source))

  if (refs.length > 0) return refs

  const inferredYaml = state.scans.find(
    (scan) =>
      scan.sourceKind === "yaml" &&
      (scan.documentName.toLowerCase().includes(system.systemName.toLowerCase()) ||
        system.frameworks.includes("compliscan-yaml"))
  )

  if (!inferredYaml) return []

  return [
    {
      id: inferredYaml.id,
      name: inferredYaml.documentName,
      scannedAt: inferredYaml.createdAtISO,
      origin: "yaml",
      prefilledFields: prefilledFieldsForSource("yaml"),
      text: inferredYaml.contentExtracted || inferredYaml.contentPreview || "",
    },
  ]
}

function derivePackReadiness({
  system,
  openFindings,
  openDrifts,
  missingEvidenceCount,
}: {
  system: CompliScanSystem
  openFindings: number
  openDrifts: number
  missingEvidenceCount: number
}): AICompliancePackEntry["readiness"] {
  if (
    system.detectionStatus === "confirmed" &&
    openFindings === 0 &&
    openDrifts === 0 &&
    missingEvidenceCount === 0
  ) {
    return "audit_ready"
  }

  if (system.detectionStatus === "reviewed" || system.detectionStatus === "confirmed") {
    return "review_required"
  }

  return "draft"
}

function deriveValidationStatus(statuses: Array<"idle" | "passed" | "failed" | "needs_review">) {
  if (statuses.includes("failed")) return "failed"
  if (statuses.includes("needs_review")) return "needs_review"
  if (statuses.includes("passed")) return "passed"
  return "idle"
}

function highestSeverityFrom(values: string[]) {
  const normalized = values.map((value) => normalizeComplianceSeverity(value, "low"))
  if (normalized.includes("critical")) return "critical" as const
  if (normalized.includes("high")) return "high" as const
  if (normalized.includes("medium")) return "medium" as const
  if (normalized.includes("low")) return "low" as const
  return null
}

function buildSuggestedNextStep({
  readiness,
  openDrifts,
  confidenceState,
  missingEvidenceCount,
  principles,
  completenessScore,
}: {
  readiness: AICompliancePackEntry["readiness"]
  openDrifts: number
  confidenceState: AICompliancePackConfidenceState
  missingEvidenceCount: number
  principles: CompliancePrinciple[]
  completenessScore: number
}) {
  if (openDrifts > 0) {
    return "Revizuiești drift-ul, atașezi dovada nouă și rulezi rescan înainte de a valida baseline-ul."
  }

  if (missingEvidenceCount > 0) {
    return "Completezi dovezile lipsă și verifici task-urile asociate până când pack-ul devine audit-ready."
  }

  if (confidenceState === "detected") {
    return "Confirmi cu userul scopul, clasa de risc și controalele de bază înainte ca pack-ul să fie folosit ca referință operațională."
  }

  if (confidenceState === "inferred") {
    return "Revizuiești câmpurile inferate și confirmi explicit ce este deja corect, ca pack-ul să nu rămână doar un draft bun."
  }

  if (completenessScore < 75) {
    return "Completezi câmpurile lipsă din guvernanță și confirmi sursele tehnice ca pack-ul să poată susține documentația de audit."
  }

  if (readiness === "audit_ready") {
    return "Poți exporta dosarul de audit sau valida acest snapshot ca referință operațională."
  }

  return `Confirmi controalele pentru ${summarizePrinciples(principles)} și finalizezi review-ul uman.`
}

function buildSourceSignals(
  system: CompliScanSystem,
  sourceTexts: string[],
  explicitResidency: string | null
) {
  const capabilities = new Set<string>()
  const dataCategories = new Set(system.dataUsed)
  const residencySignals = new Set<string>()
  const oversightSignals = new Set<string>()

  for (const framework of system.frameworks) {
    if (framework.toLowerCase().includes("langchain")) capabilities.add("orchestrare LLM")
    if (framework.toLowerCase().includes("llama")) capabilities.add("retrieval / indexing")
    if (framework.toLowerCase().includes("openai")) capabilities.add("text generation")
  }

  for (const rawText of sourceTexts) {
    const parsedYaml = parseCompliScanYaml(rawText)
    if (parsedYaml.ok) {
      for (const capability of parsedYaml.config.specs.capability) capabilities.add(capability)
      if (parsedYaml.config.governance.data_residency) {
        residencySignals.add(parsedYaml.config.governance.data_residency)
      }
      if (parsedYaml.config.human_oversight.review_method) {
        oversightSignals.add(parsedYaml.config.human_oversight.review_method)
      }
    }

    const text = rawText.toLowerCase()
    if (includesAny(text, ["chatbot", "text-generation", "gpt", "assistant", "chat"])) {
      capabilities.add("text generation")
    }
    if (includesAny(text, ["image-analysis", "vision", "ocr", "image"])) {
      capabilities.add("image analysis")
    }
    if (includesAny(text, ["recommend", "recomand", "personalization"])) {
      capabilities.add("recommendation")
    }
    if (includesAny(text, ["scoring", "score", "classification", "clasific"])) {
      capabilities.add("scoring / classification")
    }

    if (includesAny(text, ["customer", "client", "message", "mesaj"])) dataCategories.add("customer messages")
    if (includesAny(text, ["analytics", "tracking", "cookie"])) dataCategories.add("analytics data")
    if (includesAny(text, ["invoice", "factura", "xml"])) dataCategories.add("invoice data")
    if (includesAny(text, ["cv", "candidate", "recruitment"])) dataCategories.add("candidate data")

    if (includesAny(text, ["eu-central-1", "eu-west", "europe", "ue", "see"])) {
      residencySignals.add("semnal regiune UE/SEE")
    }
    if (includesAny(text, ["outside eu", "non-eu", "transfer", "third country"])) {
      residencySignals.add("semnal transfer in afara UE")
    }

    if (includesAny(text, ["human_oversight", "review_method", "reviewer_role"])) {
      oversightSignals.add("config explicit de human oversight")
    }
    if (includesAny(text, ["manual review", "operator", "override", "approve"])) {
      oversightSignals.add("semnal de review uman operațional")
    }
  }

  if (system.personalDataUsed) dataCategories.add("personal data")
  if (explicitResidency) residencySignals.add(explicitResidency)
  if (system.humanReview.required) oversightSignals.add("human review required")
  if (system.humanReview.present) oversightSignals.add("human review present")

  return {
    capabilities: [...capabilities],
    dataCategories: [...dataCategories],
    residencySignals: [...residencySignals],
    oversightSignals: [...oversightSignals],
  }
}

function buildFieldStatus({
  system,
  sourceOrigins,
  legalReferences,
  explicitResidency,
  explicitRetention,
  overrides,
  effectiveValues,
}: {
  system: CompliScanSystem
  sourceOrigins: Set<AICompliancePackSourceOrigin>
  legalReferences: string[]
  explicitResidency: string | null
  explicitRetention: number | null
  overrides: ComplianceState["aiComplianceFieldOverrides"][string]
  effectiveValues: {
    provider: string
    model: string
    purpose: string
    riskClass: CompliScanSystem["riskClass"]
    personalDataUsed: boolean
    humanReview: CompliScanSystem["humanReview"]
  }
}) {
  return [
    applyFieldOverride(
      buildFieldRef(
      "provider",
      "Provider",
      effectiveValues.provider || null,
      inferStructuredFieldStatus(Boolean(effectiveValues.provider), sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("provider", Boolean(effectiveValues.provider), sourceOrigins, system),
      deriveFieldConfidenceLevel("provider", Boolean(effectiveValues.provider), sourceOrigins, system)
      ),
      overrides?.provider
    ),
    applyFieldOverride(
      buildFieldRef(
      "model",
      "Model",
      effectiveValues.model || null,
      inferStructuredFieldStatus(Boolean(effectiveValues.model), sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("model", Boolean(effectiveValues.model), sourceOrigins, system),
      deriveFieldConfidenceLevel("model", Boolean(effectiveValues.model), sourceOrigins, system)
      ),
      overrides?.model
    ),
    applyFieldOverride(
      buildFieldRef(
      "purpose",
      "Purpose",
      effectiveValues.purpose || null,
      inferPurposeFieldStatus(Boolean(effectiveValues.purpose), sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("purpose", Boolean(effectiveValues.purpose), sourceOrigins, system),
      deriveFieldConfidenceLevel("purpose", Boolean(effectiveValues.purpose), sourceOrigins, system)
      ),
      overrides?.purpose
    ),
    applyFieldOverride(
      buildFieldRef(
      "risk_class",
      "Risk class",
      effectiveValues.riskClass || null,
      inferRiskFieldStatus(Boolean(effectiveValues.riskClass), sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("risk_class", Boolean(effectiveValues.riskClass), sourceOrigins, system),
      deriveFieldConfidenceLevel("risk_class", Boolean(effectiveValues.riskClass), sourceOrigins, system)
      ),
      overrides?.risk_class
    ),
    applyFieldOverride(
      buildFieldRef(
      "personal_data",
      "Personal data",
      effectiveValues.personalDataUsed ? "yes" : "no",
      inferStructuredFieldStatus(true, sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("personal_data", true, sourceOrigins, system),
      deriveFieldConfidenceLevel("personal_data", true, sourceOrigins, system)
      ),
      overrides?.personal_data
    ),
    applyFieldOverride(
      buildFieldRef(
      "human_oversight",
      "Human oversight",
      effectiveValues.humanReview.required
        ? effectiveValues.humanReview.present
          ? "required + present"
          : "required + missing"
        : "not required",
      inferStructuredFieldStatus(true, sourceOrigins, system),
      sourceOrigins,
      deriveFieldConfidence("human_oversight", true, sourceOrigins, system),
      deriveFieldConfidenceLevel("human_oversight", true, sourceOrigins, system)
      ),
      overrides?.human_oversight
    ),
    applyFieldOverride(
      buildFieldRef(
      "data_residency",
      "Data residency",
      explicitResidency,
      explicitResidency
        ? sourceOrigins.has("yaml")
          ? "confirmed"
          : "inferred"
        : "missing",
      sourceOrigins,
      deriveFieldConfidence("data_residency", Boolean(explicitResidency), sourceOrigins, system),
      deriveFieldConfidenceLevel("data_residency", Boolean(explicitResidency), sourceOrigins, system)
      ),
      overrides?.data_residency
    ),
    applyFieldOverride(
      buildFieldRef(
      "retention_days",
      "Retention days",
      explicitRetention ? `${explicitRetention}` : null,
      explicitRetention
        ? sourceOrigins.has("yaml")
          ? "confirmed"
          : "inferred"
        : "missing",
      sourceOrigins,
      deriveFieldConfidence("retention_days", Boolean(explicitRetention), sourceOrigins, system),
      deriveFieldConfidenceLevel("retention_days", Boolean(explicitRetention), sourceOrigins, system)
      ),
      overrides?.retention_days
    ),
    applyFieldOverride(
      buildFieldRef(
      "legal_mapping",
      "Legal mapping",
      legalReferences.length > 0 ? legalReferences.join(" · ") : null,
      legalReferences.length > 0 ? "confirmed" : "missing",
      sourceOrigins,
      deriveFieldConfidence("legal_mapping", legalReferences.length > 0, sourceOrigins, system),
      deriveFieldConfidenceLevel("legal_mapping", legalReferences.length > 0, sourceOrigins, system)
      ),
      overrides?.legal_mapping
    ),
  ]
}

function buildPrefillSummary(fieldStatus: AICompliancePackFieldRef[]) {
  const filledFields = fieldStatus
    .filter((field) => field.status !== "missing")
    .map((field) => field.label)
  const missingFields = fieldStatus
    .filter((field) => field.status === "missing")
    .map((field) => field.label)
  const score = Math.round(
    (fieldStatus.reduce((total, field) => total + fieldStatusWeight(field.status), 0) /
      fieldStatus.length) *
      100
  )

  return {
    completenessScore: score,
    filledFields,
    missingFields,
    fieldStatus,
  }
}

function buildSuggestedControls({
  system,
  relatedTasks,
  sourceTexts,
  sourceSignals,
  effectiveValues,
  explicitResidency,
  explicitRetention,
  relatedFindingsCount,
}: {
  system: CompliScanSystem
  relatedTasks: RemediationAction[]
  sourceTexts: string[]
  sourceSignals: AICompliancePackEntry["sourceSignals"]
  effectiveValues: {
    provider: string
    model: string
    purpose: string
    riskClass: CompliScanSystem["riskClass"]
    personalDataUsed: boolean
    humanReview: CompliScanSystem["humanReview"]
  }
  explicitResidency: string | null
  explicitRetention: number | null
  relatedFindingsCount: number
}): AIComplianceSuggestedControl[] {
  const suggestions = new Map<string, AIComplianceSuggestedControl>()
  const combinedText = `${effectiveValues.purpose} ${sourceTexts.join(" ")}`.toLowerCase()
  const systemGroup = deriveSystemGroupLabel(combinedText)

  const pushSuggestion = (control: AIComplianceSuggestedControl) => {
    if (!suggestions.has(control.key)) {
      const familyKey = control.controlFamily?.key ?? null

      suggestions.set(control.key, {
        ...control,
        ownerRoute:
          control.ownerRoute ??
          deriveSuggestedControlOwnerRoute({
            systemGroup,
            familyKey,
          }),
        businessImpact:
          control.businessImpact ??
          deriveSuggestedControlBusinessImpact({
            systemGroup,
            familyKey,
          }),
        bundleHint:
          control.bundleHint ??
          deriveSuggestedControlBundleHint({
            systemGroup,
            familyKey,
          }),
      })
    }
  }

  for (const task of relatedTasks) {
    const family = getControlFamily({
      validationKind: task.validationKind,
      lawReference: task.lawReference,
      principles: task.principles,
      title: task.title,
    })
    pushSuggestion({
      key: `task:${task.id}`,
      title: task.title,
      rationale: task.why,
      evidence: task.evidence,
      lawReference: task.lawReference ?? null,
      priority: task.priority,
      source: "task",
      systemGroup,
      controlFamily: {
        key: family.key,
        label: family.label,
      },
    })
  }

  if (
    includesAny(combinedText, ["chatbot", "assistant", "generative", "gpt", "llm", "support"]) ||
    sourceSignals.capabilities.some((item) => item.includes("text generation"))
  ) {
    pushSuggestion({
      key: "pack:ai-transparency",
      title: "Mesaj clar de transparență pentru interfața AI",
      rationale:
        "Sistemul pare să interacționeze direct cu utilizatori finali și are nevoie de un disclaimer vizibil despre rolul AI-ului.",
      evidence: "Screenshot cu bannerul sau mesajul de informare activ în interfață.",
      lawReference: "EU AI Act Art. 52",
      priority: "P1",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "ai-transparency",
        label: "Transparență AI și informare utilizator",
      },
    })
  }

  if (
    effectiveValues.humanReview.required ||
    effectiveValues.riskClass === "high" ||
    system.automatedDecisions ||
    system.impactsRights ||
    sourceSignals.capabilities.some((item) => item.includes("scoring"))
  ) {
    pushSuggestion({
      key: "pack:human-oversight",
      title: "Punct de aprobare umană înainte de decizia finală",
      rationale:
        "Fluxul are risc operațional sau impact asupra drepturilor și trebuie să demonstreze că un om poate opri sau revizui decizia.",
      evidence: "Log de aprobare / override și descrierea clară a pasului de review uman.",
      lawReference: "EU AI Act Art. 14",
      priority: effectiveValues.riskClass === "high" || system.impactsRights ? "P1" : "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "human-oversight",
        label: "Human oversight și aprobare umană",
      },
    })
  }

  if (effectiveValues.personalDataUsed) {
    pushSuggestion({
      key: "pack:personal-data-governance",
      title: "Bază legală și minimizare pentru date personale",
      rationale:
        "Sistemul procesează date personale și are nevoie de justificare explicită pentru scop, categorii de date și limitarea lor.",
      evidence: "Extras de politică internă sau DPA care descrie baza legală și datele folosite.",
      lawReference: "GDPR Art. 5 / Art. 6",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "governance-baseline",
        label: "Guvernanță și baseline operațional",
      },
    })
  }

  if (effectiveValues.personalDataUsed && explicitRetention === null) {
    pushSuggestion({
      key: "pack:retention-schedule",
      title: "Program de retenție și dovadă de ștergere / anonimizare",
      rationale:
        "Există date personale în flux, dar nu avem încă un termen clar de păstrare sau o dovadă a ștergerii după termen.",
      evidence: "Politică de retenție și exemplu de log de ștergere sau anonimizare.",
      lawReference: "GDPR Art. 5(1)(e)",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "retention-and-deletion",
        label: "Retenție, ștergere și anonimizare",
      },
    })
  }

  if (!explicitResidency) {
    pushSuggestion({
      key: "pack:data-residency-confirmation",
      title: "Confirmare rezidență date și traseu de transfer",
      rationale:
        "Sursele nu stabilesc clar unde sunt procesate datele, iar auditul cere o explicație clară a rezidenței și a transferurilor.",
      evidence: "compliscan.yaml actualizat sau document tehnic cu regiunea și traseul de procesare.",
      lawReference: effectiveValues.personalDataUsed ? "GDPR Chapter V" : "Control operațional",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "data-residency",
        label: "Rezidență date și transfer internațional",
      },
    })
  }

  if (
    sourceSignals.residencySignals.some((signal) =>
      includesAny(signal.toLowerCase(), ["outside eu", "non-eu", "transfer"])
    )
  ) {
    pushSuggestion({
      key: "pack:transfer-assessment",
      title: "Evaluare de transfer în afara UE / SEE",
      rationale:
        "Există semnale de transfer extra-UE și trebuie justificată baza contractuală și măsura compensatorie.",
      evidence: "Evaluare de transfer, clauze contractuale și dovada regiunii folosite.",
      lawReference: "GDPR Chapter V",
      priority: "P1",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "data-residency",
        label: "Rezidență date și transfer internațional",
      },
    })
  }

  if (effectiveValues.humanReview.required || sourceSignals.oversightSignals.length > 0) {
    pushSuggestion({
      key: "pack:monitoring-override-logs",
      title: "Monitorizare periodică și log-uri de override",
      rationale:
        "Pack-ul trebuie să demonstreze că oversight-ul nu există doar declarativ, ci și în operațiune zilnică.",
      evidence: "Export de log sau captură cu acțiuni de review și override.",
      lawReference: effectiveValues.humanReview.required ? "EU AI Act Art. 14" : "Control operațional",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "human-oversight",
        label: "Human oversight și aprobare umană",
      },
    })
  }

  if (effectiveValues.riskClass === "high" || relatedFindingsCount >= 3) {
    pushSuggestion({
      key: "pack:baseline-review",
      title: "Review formal al baseline-ului înainte de validare",
      rationale:
        "Profilul actual de risc cere o revizie coordonată între owner, compliance și echipa tehnică înainte de a valida snapshot-ul.",
      evidence: "Notă de review, decizie de acceptare a riscului sau baseline validat.",
      lawReference: "Control de guvernanță",
      priority: "P1",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "governance-baseline",
        label: "Guvernanță și baseline operațional",
      },
    })
  }

  if (systemGroup === "customer-support") {
    pushSuggestion({
      key: "pack:customer-support-escalation",
      title: "Escaladare clară către operator uman pentru suport clienți",
      rationale:
        "Sistemul pare orientat spre suport clienți și are nevoie de o cale clară de transfer către operator atunci când răspunsul AI nu este suficient.",
      evidence: "Screenshot cu butonul sau fluxul de transfer către operator și procedura asociată.",
      lawReference: "EU AI Act Art. 14 / control operațional",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "human-oversight",
        label: "Human oversight și aprobare umană",
      },
    })
  }

  if (systemGroup === "hr-recruitment") {
    pushSuggestion({
      key: "pack:hr-review-gate",
      title: "Review obligatoriu pentru decizii sau recomandări HR",
      rationale:
        "Sistemele cu semnale de HR / recrutare trebuie să păstreze o etapă explicită de review uman înainte ca recomandarea să producă efecte.",
      evidence: "Workflow HR aprobat și log de validare sau override înainte de comunicarea deciziei.",
      lawReference: "EU AI Act Art. 14",
      priority: "P1",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "human-oversight",
        label: "Human oversight și aprobare umană",
      },
    })
  }

  if (systemGroup === "finance-operations") {
    pushSuggestion({
      key: "pack:finance-reconciliation",
      title: "Dovadă de reconciliere și owner operațional pentru fluxuri financiare",
      rationale:
        "Sistemele cu impact pe facturare sau fluxuri financiare trebuie să aibă owner clar și dovadă de reconciliere între ieșirea AI și procesul operațional.",
      evidence: "Runbook operațional, owner confirmat și exemplu de reconciliere sau verificare manuală.",
      lawReference: "Control operațional / e-Factura",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "efactura-operations",
        label: "Operațiuni e-Factura și dovadă operațională",
      },
    })
  }

  if (systemGroup === "marketing-analytics") {
    pushSuggestion({
      key: "pack:marketing-consent-bundle",
      title: "Bundle CMP + tracking pentru suprafețe marketing",
      rationale:
        "Pentru sisteme apropiate de analytics sau marketing, auditul cere să poți arăta împreună bannerul CMP, logul de consimțământ și textul legal curent.",
      evidence: "Screenshot CMP, export de log și textul politicii active în același bundle de dovadă.",
      lawReference: "GDPR Art. 6 / Art. 7",
      priority: "P2",
      source: "pack_inference",
      systemGroup,
      controlFamily: {
        key: "privacy-tracking",
        label: "Privacy, tracking și consimțământ",
      },
    })
  }

  return [...suggestions.values()].sort((left, right) => priorityRank(left.priority) - priorityRank(right.priority))
}

function deriveSystemGroupLabel(combinedText: string) {
  if (includesAny(combinedText, ["candidate", "cv", "recruitment", "hiring", "interview"])) {
    return "hr-recruitment"
  }
  if (includesAny(combinedText, ["invoice", "factura", "accounting", "finance", "anaf"])) {
    return "finance-operations"
  }
  if (includesAny(combinedText, ["marketing", "analytics", "tracking", "campaign", "cookie"])) {
    return "marketing-analytics"
  }
  if (includesAny(combinedText, ["customer", "client", "support", "chatbot", "assistant", "shop", "buyer"])) {
    return "customer-support"
  }
  return "general-operations"
}

function deriveSuggestedControlOwnerRoute({
  systemGroup,
  familyKey,
}: {
  systemGroup: string
  familyKey: string | null
}) {
  if (familyKey === "human-oversight") {
    return "Owner sistem + Product/Ops + reviewer uman desemnat"
  }
  if (familyKey === "privacy-tracking") {
    return "Marketing Ops + Frontend + owner legal text"
  }
  if (familyKey === "data-residency") {
    return "Tech Lead / Infra + Compliance"
  }
  if (familyKey === "retention-and-deletion") {
    return "DPO / Privacy Ops + Backend owner"
  }
  if (familyKey === "governance-baseline") {
    return "Owner operațional + Compliance"
  }
  if (familyKey === "efactura-operations") {
    return "Finance Ops + owner integrare"
  }

  if (systemGroup === "customer-support") return "Support Ops + Product owner"
  if (systemGroup === "hr-recruitment") return "HR Ops + Product owner"
  if (systemGroup === "finance-operations") return "Finance Ops + Tech lead"
  if (systemGroup === "marketing-analytics") return "Marketing Ops + Frontend"

  return "Owner sistem + responsabil compliance"
}

function deriveSuggestedControlBusinessImpact({
  systemGroup,
  familyKey,
}: {
  systemGroup: string
  familyKey: string | null
}) {
  if (familyKey === "human-oversight") {
    return "Fără review uman, sistemul poate genera decizii sau recomandări greu de apărat la audit."
  }
  if (familyKey === "privacy-tracking") {
    return "Bundle-ul de consimțământ și tracking decide dacă poți susține legal colectarea și profilarea."
  }
  if (familyKey === "data-residency") {
    return "Lipsa clarității pe rezidență și transfer poate bloca exportul și baseline-ul."
  }
  if (familyKey === "retention-and-deletion") {
    return "Fără retenție clară, datele personale rămân expuse și greu de justificat."
  }
  if (familyKey === "governance-baseline") {
    return "Acest control ține evidența operațională coerentă între scop, risc și baseline."
  }
  if (familyKey === "efactura-operations") {
    return "Controalele financiare susțin reconcilierea și apărarea fluxurilor operaționale."
  }

  if (systemGroup === "customer-support") {
    return "Trebuie apărat modul în care utilizatorul final vede AI-ul și ajunge la un operator uman."
  }
  if (systemGroup === "hr-recruitment") {
    return "Fluxul afectează candidați și cere justificare mai strictă pentru review, fairness și dovadă."
  }
  if (systemGroup === "finance-operations") {
    return "Fluxul are efect operațional pe facturare, aprobare sau reconciliere."
  }
  if (systemGroup === "marketing-analytics") {
    return "Controlul afectează consimțământul, tracking-ul și defensibilitatea politicilor publice."
  }

  return "Controlul clarifică cine răspunde și ce dovadă susține sistemul în audit."
}

function deriveSuggestedControlBundleHint({
  systemGroup,
  familyKey,
}: {
  systemGroup: string
  familyKey: string | null
}) {
  if (familyKey === "human-oversight") {
    return "Bundle minim: workflow de review, log de override și procedură de escaladare."
  }
  if (familyKey === "privacy-tracking") {
    return "Bundle minim: screenshot CMP, export de consimțământ și textul legal activ."
  }
  if (familyKey === "data-residency") {
    return "Bundle minim: regiune declarată, traseu de transfer și dovadă contractuală."
  }
  if (familyKey === "retention-and-deletion") {
    return "Bundle minim: politică de retenție și log de ștergere / anonimizare."
  }
  if (familyKey === "governance-baseline") {
    return "Bundle minim: baseline validat, notă de review și owner confirmat."
  }
  if (familyKey === "efactura-operations") {
    return "Bundle minim: runbook, owner operațional și exemplu de reconciliere."
  }

  if (systemGroup === "customer-support") {
    return "Bundle recomandat: disclaimer AI, transfer către operator și log de monitorizare."
  }
  if (systemGroup === "hr-recruitment") {
    return "Bundle recomandat: workflow HR, aprobări umane și justificare a recomandărilor."
  }
  if (systemGroup === "finance-operations") {
    return "Bundle recomandat: owner financiar, dovadă de reconciliere și review de baseline."
  }
  if (systemGroup === "marketing-analytics") {
    return "Bundle recomandat: CMP, consent log, policy activă și semnal tehnic de blocking."
  }

  return "Bundle recomandat: owner, dovadă operațională și confirmare a controlului."
}

function buildAnnexLiteDraft({
  system,
  sources,
  sourceTexts,
  confidenceModel,
  readiness,
  validationStatus,
  evidenceBundle,
  prefill,
  openFindings,
  openDrifts,
  principles,
  legalReferences,
  requiredControls,
  suggestedControls,
  sourceSignals,
  explicitResidency,
  explicitRetention,
  effectiveValues,
}: {
  system: CompliScanSystem
  sources: AICompliancePackEntry["sources"]
  sourceTexts: string[]
  confidenceModel: AICompliancePackEntry["confidenceModel"]
  readiness: AICompliancePackEntry["readiness"]
  validationStatus: AICompliancePackEntry["evidence"]["validationStatus"]
  evidenceBundle: AICompliancePackEvidenceBundle
  prefill: AICompliancePackEntry["prefill"]
  openFindings: number
  openDrifts: number
  principles: CompliancePrinciple[]
  legalReferences: string[]
  requiredControls: string[]
  suggestedControls: AIComplianceSuggestedControl[]
  sourceSignals: AICompliancePackEntry["sourceSignals"]
  explicitResidency: string | null
  explicitRetention: number | null
  effectiveValues: {
    provider: string
    model: string
    purpose: string
    riskClass: CompliScanSystem["riskClass"]
    personalDataUsed: boolean
    humanReview: CompliScanSystem["humanReview"]
  }
}): AICompliancePackEntry["annexLiteDraft"] {
  const capabilities =
    sourceSignals.capabilities.length > 0
      ? sourceSignals.capabilities.join(", ")
      : system.frameworks.join(", ") || "capabilități în curs de confirmare"
  const dataSummary =
    sourceSignals.dataCategories.length > 0
      ? sourceSignals.dataCategories.join(", ")
      : system.dataUsed.join(", ") || "date neconfirmate încă"
  const legalSummary =
    legalReferences.length > 0 ? legalReferences.join(", ") : "mapare legală în curs de completare"
  const controlsSummary =
    suggestedControls.length > 0
      ? suggestedControls
          .slice(0, 4)
          .map((control) => `${control.title} (${control.priority})`)
          .join("; ")
      : requiredControls.length > 0
        ? requiredControls.slice(0, 4).join("; ")
      : "controalele necesare vor fi extrase după confirmarea surselor"
  const sourceSummary =
    sources.length > 0
      ? sources.map((source) => `${source.origin}:${source.name}`).join(" · ")
      : "surse încă nelegate explicit"
  const affectedPersons = effectiveValues.personalDataUsed
    ? "utilizatori finali și persoane ale căror date personale intră în flux"
    : "utilizatori finali și persoane afectate indirect de recomandările generate"
  const rightsImpact = system.impactsRights
    ? "există un impact direct asupra drepturilor sau eligibilității persoanelor"
    : "impactul asupra drepturilor este în prezent limitat, dar trebuie reevaluat la schimbare de scop sau decizie automată"
  const dependencies =
    [
      `${effectiveValues.provider} / ${effectiveValues.model}`,
      ...system.frameworks,
      ...sourceSignals.capabilities,
    ]
      .filter(Boolean)
      .join(", ") || "dependințe tehnice în curs de clarificare"
  const evidenceSummary =
    evidenceBundle.requiredItems > 0
      ? `${evidenceBundle.validatedItems}/${evidenceBundle.requiredItems} controale validate; status bundle ${evidenceBundle.status}.`
      : "încă nu există controale formale în bundle."
  const validationSummary =
    validationStatus === "passed"
      ? "ultimul ciclu de rescan a confirmat dovezile existente."
      : validationStatus === "failed"
        ? "ultima validare a eșuat și cere remediere suplimentară."
        : validationStatus === "needs_review"
          ? "există dovadă, dar cere încă review uman înainte de audit."
          : "validarea finală nu a fost încă executată."
  const deploymentContext = deriveDeploymentContext({ system, sources, sourceTexts })
  const affectedPersonsSummary = deriveAffectedPersonsSummary({
    sourceTexts,
    system,
    personalDataUsed: effectiveValues.personalDataUsed,
    fallback: affectedPersons,
  })
  const monitoringSummary = deriveMonitoringSignals({
    sourceSignals,
    evidenceBundle,
    requiredControls,
    openDrifts,
    validationStatus,
  })
  const escalationPath = deriveEscalationPath({
    sourceTexts,
    system,
    humanReview: effectiveValues.humanReview,
  })

  return {
    systemDescription: `${system.systemName} folosește ${effectiveValues.provider} (${effectiveValues.model}) pentru ${effectiveValues.purpose}. Semnalele tehnice sugerează capabilități de tip ${capabilities}.`,
    systemScope: `${system.systemName} este urmărit prin ${sourceSummary}. Contextul de implementare sugerat este ${deploymentContext}. Metoda de descoperire este ${system.discoveryMethod}, iar nivelul curent de încredere operațională este ${confidenceModel.state}. Starea pack-ului este ${readiness}.`,
    intendedPurpose: `Scopul declarat este ${effectiveValues.purpose}. Sistemul este clasificat provizoriu ca ${effectiveValues.riskClass} și este conectat la principiile ${summarizePrinciples(principles)}.`,
    intendedUsersAndAffectedPersons: `Sistemul deservește ${effectiveValues.purpose}. Părțile afectate sunt ${affectedPersonsSummary}. Câmpurile precompletate sunt acoperite în proporție de ${prefill.completenessScore}% și trebuie confirmate înainte de utilizare ca documentație defensibilă.`,
    dataAndGovernance: `Sistemul folosește ${dataSummary}. Rezidența datelor este ${explicitResidency || "neconfirmată"}, iar retenția este ${explicitRetention ? `${explicitRetention} zile` : "neconfirmată"}. Referințe legale active: ${legalSummary}.`,
    riskAndRightsImpact: `Clasificarea curentă este ${effectiveValues.riskClass}. Sistemul ${system.automatedDecisions ? "poate susține decizii automate" : "nu este marcat ca decizie automată"} și ${rightsImpact}. În acest moment sunt ${openFindings} findings și ${openDrifts} drift-uri deschise care influențează profilul de risc.`,
    humanOversight: `${
      effectiveValues.humanReview.required
      ? effectiveValues.humanReview.present
        ? "Human oversight este cerut și există semnal că este prezent în fluxul operațional."
        : "Human oversight este cerut, dar lipsește sau nu este încă demonstrat prin dovadă validată."
      : "Sistemul este marcat ca fără human oversight obligatoriu; acest lucru trebuie revizuit dacă apar schimbări de risc sau decizie automată."
    } ${escalationPath}`,
    technicalDependencies: `Dependențele și semnalele tehnice relevante includ ${dependencies}. Semnalele de rezidență sunt ${sourceSignals.residencySignals.join(", ") || "neconfirmate"}, iar semnalele de oversight sunt ${sourceSignals.oversightSignals.join(", ") || "absente sau neclare"}.`,
    monitoringAndControls: `Controalele curente recomandate sunt: ${controlsSummary}. ${monitoringSummary}`,
    evidenceAndValidation: `Bundle-ul de dovezi acoperă ${evidenceSummary} ${validationSummary} Referințele legale urmărite sunt ${legalSummary}.`,
  }
}

function deriveDeploymentContext({
  system,
  sources,
  sourceTexts,
}: {
  system: CompliScanSystem
  sources: AICompliancePackEntry["sources"]
  sourceTexts: string[]
}) {
  const text = sourceTexts.join(" ").toLowerCase()
  const contexts = new Set<string>()

  if (includesAny(text, ["site", "widget", "frontend", "browser", "landing"])) {
    contexts.add("interfață web pentru utilizatori finali")
  }
  if (includesAny(text, ["dashboard", "admin", "backoffice", "operator"])) {
    contexts.add("suprafață internă / backoffice")
  }
  if (includesAny(text, ["api", "endpoint", "service", "backend"])) {
    contexts.add("serviciu backend sau API")
  }
  if (sources.some((source) => source.origin === "yaml")) {
    contexts.add("configurat prin declarație operațională")
  }
  if (sources.some((source) => source.origin === "manifest")) {
    contexts.add("urmărit prin manifest și repo sync")
  }

  if (contexts.size === 0) {
    contexts.add(
      system.discoveryMethod === "manual"
        ? "descris manual de echipa operațională"
        : "dedus din surse tehnice și documentare"
    )
  }

  return [...contexts].join(", ")
}

function deriveAffectedPersonsSummary({
  sourceTexts,
  system,
  personalDataUsed,
  fallback,
}: {
  sourceTexts: string[]
  system: CompliScanSystem
  personalDataUsed: boolean
  fallback: string
}) {
  const text = `${system.purpose} ${sourceTexts.join(" ")}`.toLowerCase()
  const groups = new Set<string>()

  if (includesAny(text, ["customer", "client", "support", "magazin", "shop", "buyer"])) {
    groups.add("clienți și echipe de suport")
  }
  if (includesAny(text, ["candidate", "cv", "recruitment", "hiring"])) {
    groups.add("candidați și echipe HR")
  }
  if (includesAny(text, ["invoice", "factura", "accounting", "finance"])) {
    groups.add("echipe financiare și parteneri de facturare")
  }
  if (includesAny(text, ["marketing", "analytics", "tracking", "campaign"])) {
    groups.add("vizitatori ai site-ului și echipe marketing")
  }

  if (groups.size === 0) return fallback
  if (!personalDataUsed) return [...groups].join(", ")

  return `${[...groups].join(", ")}; datele personale trebuie tratate explicit în controalele de guvernanță`
}

function deriveMonitoringSignals({
  sourceSignals,
  evidenceBundle,
  requiredControls,
  openDrifts,
  validationStatus,
}: {
  sourceSignals: AICompliancePackEntry["sourceSignals"]
  evidenceBundle: AICompliancePackEvidenceBundle
  requiredControls: string[]
  openDrifts: number
  validationStatus: AICompliancePackEntry["evidence"]["validationStatus"]
}) {
  const monitoringPieces: string[] = []

  monitoringPieces.push(
    sourceSignals.oversightSignals.length > 0
      ? `Semnalele de oversight includ ${sourceSignals.oversightSignals.join(", ")}`
      : "Nu există încă suficiente semnale tehnice pentru oversight"
  )
  monitoringPieces.push(
    evidenceBundle.status === "bundle_ready"
      ? "bundle-ul de dovezi este gata pentru audit"
      : `bundle-ul de dovezi este ${evidenceBundle.status} și cere completare`
  )
  monitoringPieces.push(
    openDrifts > 0
      ? `${openDrifts} drift-uri rămân active și trebuie explicate înainte de export`
      : "nu există drift activ față de baseline-ul comparat"
  )
  monitoringPieces.push(
    validationStatus === "passed"
      ? "ultimul rescan a confirmat controalele validate"
      : validationStatus === "needs_review"
        ? "există dovadă, dar cere încă review uman"
        : validationStatus === "failed"
          ? "ultima validare a eșuat și cere remediere suplimentară"
          : "validarea finală încă nu a fost executată"
  )

  if (requiredControls.length > 4) {
    monitoringPieces.push(
      `există ${requiredControls.length} controale recomandate, deci prioritizarea lor trebuie urmărită în board-ul de remediere`
    )
  }

  return monitoringPieces.join(". ") + "."
}

function deriveEscalationPath({
  sourceTexts,
  system,
  humanReview,
}: {
  sourceTexts: string[]
  system: CompliScanSystem
  humanReview: CompliScanSystem["humanReview"]
}) {
  const text = `${system.owner} ${system.purpose} ${sourceTexts.join(" ")}`.toLowerCase()

  if (humanReview.required && humanReview.present) {
    return "Escaladarea recomandată rămâne către owner-ul operațional și reviewer-ul uman definit în flux."
  }
  if (humanReview.required && !humanReview.present) {
    return "Escaladarea recomandată este către owner-ul sistemului și către un reviewer uman desemnat înainte de folosire în producție."
  }
  if (includesAny(text, ["marketing", "frontend", "analytics"])) {
    return "Escaladarea recomandată este către Marketing Ops și Frontend pentru confirmarea controlului."
  }
  if (includesAny(text, ["finance", "accounting", "invoice", "factura"])) {
    return "Escaladarea recomandată este către Finance Ops și owner-ul integrării operaționale."
  }

  return "Escaladarea recomandată este către owner-ul sistemului și responsabilul de compliance local."
}

function readStringFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function readNumberFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value
  if (typeof value !== "string") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function readBooleanFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value?.trim().toLowerCase()
  if (!value) return null
  if (["yes", "true", "da"].includes(value)) return true
  if (["no", "false", "nu"].includes(value)) return false
  return null
}

function readRiskClassFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value?.trim().toLowerCase()
  if (value === "minimal" || value === "limited" || value === "high") return value
  return null
}

function readHumanOversightFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value?.trim().toLowerCase()
  if (!value) return null
  if (value === "required + present") return { required: true, present: true }
  if (value === "required + missing") return { required: true, present: false }
  if (value === "not required") return { required: false, present: false }
  return null
}

function readLegalMappingFieldOverride(
  overrides: ComplianceState["aiComplianceFieldOverrides"][string],
  field: AICompliancePackFieldKey
) {
  const value = overrides?.[field]?.value
  if (typeof value !== "string" || !value.trim()) return null
  return value
    .split(/[\n,;·]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildFieldRef(
  field: AICompliancePackFieldKey,
  label: string,
  value: string | null,
  status: AICompliancePackFieldStatus,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  confidenceModel: {
    state: AICompliancePackFieldConfidenceState
    reason: string
  },
  confidence: "low" | "medium" | "high"
): AICompliancePackFieldRef {
  return {
    field,
    label,
    value,
    status,
    sources: [...sourceOrigins],
    confidence,
    userConfirmed: false,
    lastUpdatedAtISO: null,
    confidenceModel,
  }
}

function applyFieldOverride(
  field: AICompliancePackFieldRef,
  override: ComplianceState["aiComplianceFieldOverrides"][string][string] | undefined
): AICompliancePackFieldRef {
  if (!override?.confirmedByUser) return field

  return {
    ...field,
    value: override.value,
    status: "confirmed",
    confidence: "high",
    userConfirmed: true,
    lastUpdatedAtISO: override.updatedAtISO,
    confidenceModel: {
      state: "confirmed_by_user",
      reason: `Câmpul ${field.label} a fost confirmat sau editat explicit în AI Compliance Pack.`,
    },
  }
}

function buildEvidenceBundle({
  taskEntries,
  legalReferences,
}: {
  taskEntries: Array<{
    task: RemediationAction
    taskState: ComplianceState["taskState"][string] | undefined
  }>
  legalReferences: string[]
}): AICompliancePackEvidenceBundle {
  const evidenceKinds = new Set<TaskEvidenceKind>()
  const files = new Set<string>()
  const familyCoverageMap = new Map<
    string,
    {
      familyKey: string
      familyLabel: string
      familyDescription: string
      totalControls: number
      attachedControls: number
      validatedControls: number
      pendingControls: number
      evidenceKinds: Set<TaskEvidenceKind>
      lawReferences: Set<string>
      includedFiles: Set<string>
      reusePolicy: string
    }
  >()
  const controls = taskEntries.map(({ task, taskState }) => {
    const meta = taskState?.attachedEvidenceMeta
    const evidenceKindsForControl = meta ? [meta.kind] : []
    const filesForControl = meta ? [meta.fileName] : []

    if (meta) {
      evidenceKinds.add(meta.kind)
      files.add(meta.fileName)
    }

    const status: AICompliancePackEvidenceBundle["controls"][number]["status"] =
      meta && taskState?.validationStatus === "passed"
        ? "covered"
        : meta
          ? "partial"
          : "missing"

    const family = getControlFamily({
      validationKind: task.validationKind,
      lawReference: task.lawReference,
      principles: task.principles,
      title: task.title,
    })
    const familyCurrent = familyCoverageMap.get(family.key) ?? {
      familyKey: family.key,
      familyLabel: family.label,
      familyDescription: family.description,
      totalControls: 0,
      attachedControls: 0,
      validatedControls: 0,
      pendingControls: 0,
      evidenceKinds: new Set<TaskEvidenceKind>(),
      lawReferences: new Set<string>(),
      includedFiles: new Set<string>(),
      reusePolicy: getControlFamilyReusePolicySummary(family.key),
    }
    familyCurrent.totalControls += 1
    if (task.lawReference) familyCurrent.lawReferences.add(task.lawReference)
    if (meta) {
      familyCurrent.attachedControls += 1
      familyCurrent.evidenceKinds.add(meta.kind)
      familyCurrent.includedFiles.add(meta.fileName)
    }
    if (status === "covered") familyCurrent.validatedControls += 1
    else familyCurrent.pendingControls += 1
    familyCoverageMap.set(family.key, familyCurrent)

    return {
      taskId: `rem-${task.id}`,
      title: task.title,
      lawReference: task.lawReference ?? null,
      remediationMode: task.remediationMode,
      status,
      validationStatus: taskState?.validationStatus ?? "idle",
      evidenceKinds: evidenceKindsForControl,
      files: filesForControl,
    }
  })

  const lawCoverageMap = new Map<
    string,
    {
      lawReference: string
      totalControls: number
      validatedControls: number
      pendingControls: number
    }
  >()

  for (const control of controls) {
    const key = control.lawReference || "fără referință legală explicită"
    const current = lawCoverageMap.get(key) ?? {
      lawReference: key,
      totalControls: 0,
      validatedControls: 0,
      pendingControls: 0,
    }
    current.totalControls += 1
    if (control.status === "covered") current.validatedControls += 1
    else current.pendingControls += 1
    lawCoverageMap.set(key, current)
  }

  for (const entry of taskEntries) {
    const meta = entry.taskState?.attachedEvidenceMeta
    if (!meta) continue
  }

  const requiredItems = taskEntries.length
  const attachedItems = taskEntries.filter((item) => item.taskState?.attachedEvidenceMeta).length
  const validatedItems = taskEntries.filter((item) => item.taskState?.validationStatus === "passed").length
  const pendingItems = Math.max(0, requiredItems - validatedItems)

  const status =
    requiredItems === 0 || (requiredItems > 0 && validatedItems >= requiredItems)
      ? "bundle_ready"
      : attachedItems > 0
        ? "partial"
        : "missing_evidence"

  return {
    status,
    requiredItems,
    attachedItems,
    validatedItems,
    pendingItems,
    evidenceKinds: [...evidenceKinds],
    lawReferences: legalReferences,
    files: [...files],
    controls,
    lawCoverage: [...lawCoverageMap.values()],
    familyCoverage: [...familyCoverageMap.values()].map((family) => ({
      familyKey: family.familyKey,
      familyLabel: family.familyLabel,
      familyDescription: family.familyDescription,
      totalControls: family.totalControls,
      attachedControls: family.attachedControls,
      validatedControls: family.validatedControls,
      pendingControls: family.pendingControls,
      evidenceKinds: [...family.evidenceKinds],
      lawReferences: [...family.lawReferences],
      includedFiles: [...family.includedFiles],
      reuseAvailable: family.includedFiles.size > 0 && family.pendingControls > 0,
      reusePolicy: family.reusePolicy,
      status:
        family.totalControls > 0 && family.validatedControls >= family.totalControls
          ? "covered"
          : family.attachedControls > 0
            ? "partial"
            : "missing",
    })),
  }
}

function buildTraceSummary({
  relatedTasks,
  taskStateEntries,
  openFindings,
  openDrifts,
  legalReferences,
  validatedBaselinePresent,
  evidenceBundleStatus,
}: {
  relatedTasks: RemediationAction[]
  taskStateEntries: Array<ComplianceState["taskState"][string]>
  openFindings: number
  openDrifts: number
  legalReferences: string[]
  validatedBaselinePresent: boolean
  evidenceBundleStatus: AICompliancePackEvidenceBundle["status"]
}): AICompliancePackEntry["traceSummary"] {
  const controlsCovered = relatedTasks.length
  const validatedControls = taskStateEntries.filter((item) => item?.validationStatus === "passed").length

  const traceStatus: AICompliancePackEntry["traceSummary"]["traceStatus"] =
    openFindings === 0 &&
    openDrifts === 0 &&
    evidenceBundleStatus === "bundle_ready" &&
    validatedBaselinePresent
      ? "validated"
      : evidenceBundleStatus === "missing_evidence"
        ? "evidence_required"
        : "action_required"

  return {
    controlsCovered,
    validatedControls: Math.min(validatedControls, controlsCovered),
    linkedFindings: openFindings,
    linkedDrifts: openDrifts,
    linkedLegalReferences: legalReferences.length,
    baselineLinked: validatedBaselinePresent,
    traceStatus,
  }
}

function summarizeFieldConfidence(entries: AICompliancePackEntry[]) {
  const summary = {
    confirmed: 0,
    inferred: 0,
    missing: 0,
  }

  for (const entry of entries) {
    for (const field of entry.prefill.fieldStatus) {
      if (field.confidenceModel.state === "confirmed_by_user") summary.confirmed += 1
      else if (field.confidenceModel.state === "inferred" || field.confidenceModel.state === "detected") {
        summary.inferred += 1
      } else {
        summary.missing += 1
      }
    }
  }

  return summary
}

function inferStructuredFieldStatus(
  hasValue: boolean,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  system: CompliScanSystem
): AICompliancePackFieldStatus {
  if (!hasValue) return "missing"
  if (sourceOrigins.has("yaml") || system.discoveryMethod === "manual" || system.detectionStatus === "confirmed") {
    return "confirmed"
  }
  return "inferred"
}

function inferPurposeFieldStatus(
  hasValue: boolean,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  system: CompliScanSystem
): AICompliancePackFieldStatus {
  if (!hasValue) return "missing"
  if (system.detectionStatus === "confirmed" || system.discoveryMethod === "manual") return "confirmed"
  if (sourceOrigins.has("document") || sourceOrigins.has("yaml")) return "confirmed"
  return "inferred"
}

function inferRiskFieldStatus(
  hasValue: boolean,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  system: CompliScanSystem
): AICompliancePackFieldStatus {
  if (!hasValue) return "missing"
  if (sourceOrigins.has("yaml")) return "confirmed"
  if (system.detectionStatus === "confirmed" || system.discoveryMethod === "manual") return "confirmed"
  return "inferred"
}

function fieldStatusWeight(status: AICompliancePackFieldStatus) {
  if (status === "confirmed") return 1
  if (status === "inferred") return 0.5
  return 0
}

function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}

function deriveConfidenceModel({
  system,
  fieldStatus,
  sourceOrigins,
  sourceSignals,
  relatedFindingsCount,
}: {
  system: CompliScanSystem
  fieldStatus: AICompliancePackFieldRef[]
  sourceOrigins: Set<AICompliancePackSourceOrigin>
  sourceSignals: AICompliancePackEntry["sourceSignals"]
  relatedFindingsCount: number
}) {
  if (system.discoveryMethod === "manual" || system.detectionStatus === "confirmed") {
    return {
      state: "confirmed_by_user" as const,
      reason:
        "Sistemul a fost confirmat explicit de user sau introdus manual, deci poate fi tratat ca sursă confirmată de adevăr.",
    }
  }

  const coreFields = fieldStatus.filter((field) =>
    ["provider", "model", "purpose", "risk_class", "human_oversight", "personal_data"].includes(
      field.field
    )
  )
  const confirmedCore = coreFields.filter((field) => field.status === "confirmed").length
  const inferredOrBetterCore = coreFields.filter((field) => field.status !== "missing").length
  const hasStrongSignals =
    sourceOrigins.has("yaml") ||
    sourceSignals.capabilities.length > 0 ||
    sourceSignals.oversightSignals.length > 0 ||
    relatedFindingsCount > 0

  if (
    system.detectionStatus === "reviewed" ||
    confirmedCore >= 3 ||
    (inferredOrBetterCore >= 4 && hasStrongSignals)
  ) {
    return {
      state: "inferred" as const,
      reason:
        "Pack-ul are suficiente semnale și câmpuri completate pentru a propune un control coerent, dar încă lipsește confirmarea explicită din partea userului.",
    }
  }

  return {
    state: "detected" as const,
    reason:
      "Există semnal tehnic de sistem AI, dar identitatea, scopul sau guvernanța nu sunt încă suficient de mature pentru a susține un verdict confirmat.",
  }
}

function deriveFieldConfidence(
  field: AICompliancePackFieldKey,
  hasValue: boolean,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  system: CompliScanSystem
): {
  state: AICompliancePackFieldConfidenceState
  reason: string
} {
  if (!hasValue) {
    return {
      state: "missing",
      reason: `Câmpul ${field} nu este încă suficient susținut de nicio sursă scanată sau confirmată.`,
    }
  }

  if (system.discoveryMethod === "manual" || system.detectionStatus === "confirmed") {
    return {
      state: "confirmed_by_user",
      reason: `Câmpul ${field} aparține unui sistem confirmat explicit, deci poate fi folosit ca referință operațională.`,
    }
  }

  if (sourceOrigins.has("yaml")) {
    return {
      state: "inferred",
      reason: `Câmpul ${field} este declarat explicit în compliscan.yaml, dar nu a fost încă reconfirmat în UI.`,
    }
  }

  if (sourceOrigins.has("document") || sourceOrigins.has("manifest")) {
    return {
      state: "inferred",
      reason: `Câmpul ${field} este dedus din documente sau manifests și cere încă o confirmare umană ușoară.`,
    }
  }

  return {
    state: "detected",
    reason: `Există semnal tehnic pentru ${field}, dar sursa nu este încă suficient de clară pentru un verdict stabil.`,
  }
}

function deriveFieldConfidenceLevel(
  field: AICompliancePackFieldKey,
  hasValue: boolean,
  sourceOrigins: Set<AICompliancePackSourceOrigin>,
  system: CompliScanSystem
): "low" | "medium" | "high" {
  if (!hasValue) return "low"
  if (system.discoveryMethod === "manual" || system.detectionStatus === "confirmed") return "high"
  if (sourceOrigins.has("yaml")) return "high"
  if (field === "legal_mapping") return "medium"
  if (sourceOrigins.has("document") || sourceOrigins.has("manifest")) return "medium"
  return "low"
}

function findSourceDocumentForFinding(
  finding: CompliScanSnapshot["findings"][number],
  state: ComplianceState
) {
  const scan = state.scans.find((item) => item.id === finding.sourceId)
  return scan?.documentName ?? ""
}

function mapSourceOrigin(sourceKind: ComplianceState["scans"][number]["sourceKind"]): AICompliancePackSourceOrigin {
  if (sourceKind === "manifest") return "manifest"
  if (sourceKind === "yaml") return "yaml"
  return "document"
}

function prefilledFieldsForSource(sourceKind: ComplianceState["scans"][number]["sourceKind"]) {
  if (sourceKind === "manifest") {
    return ["provider", "frameworks", "possible_purpose", "technical_signals"]
  }

  if (sourceKind === "yaml") {
    return [
      "provider",
      "model",
      "human_review",
      "data_residency",
      "personal_data_processed",
      "risk_class",
      "legal_mapping",
    ]
  }

  return ["regulatory_signals", "legal_text", "evidence_context", "purpose_clues"]
}

function countSourceCoverage(state: ComplianceState) {
  return state.scans.reduce(
    (acc, scan) => {
      const origin = mapSourceOrigin(scan.sourceKind)
      acc[origin] += 1
      return acc
    },
    { document: 0, manifest: 0, yaml: 0 }
  )
}

function findMetadataValue(system: CompliScanSystem, prefix: string) {
  const evidence = system.evidence.find((item) => item.value.startsWith(prefix))
  return evidence?.value.slice(prefix.length).trim() || null
}

function findRetentionDays(system: CompliScanSystem) {
  const evidence = system.evidence.find((item) => item.value.toLowerCase().includes("retention"))
  if (!evidence) return null

  const match = evidence.value.match(/(\d{1,4})/)
  return match ? Number(match[1]) : null
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}
