import { createHash } from "node:crypto"

import {
  inferPrinciplesFromCategory,
  normalizeCompliancePrinciples,
  normalizeComplianceSeverity,
} from "@/lib/compliance/constitution"
import { getResolvedFindingIds } from "@/lib/compliance/task-resolution"
import type {
  ComplianceAlert,
  ComplianceState,
  DashboardSummary,
  DetectedAISystemRecord,
  FindingCategory,
  RemediationAction,
  ScanFinding,
  ScanRecord,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type {
  CompliScanEvidence,
  CompliScanFinding,
  CompliScanPrinciple,
  CompliScanRegulatoryArea,
  CompliScanRiskLabel,
  CompliScanSeverity,
  CompliScanSnapshot,
  CompliScanSource,
  CompliScanSourceType,
  CompliScanSystem,
} from "@/lib/compliscan/schema"

type CompliScanExportInput = {
  state: ComplianceState
  summary: DashboardSummary
  remediationPlan: RemediationAction[]
  workspace: WorkspaceContext
}

export function buildCompliScanSnapshot({
  state,
  summary,
  remediationPlan,
  workspace,
}: CompliScanExportInput): CompliScanSnapshot {
  const generatedAt = new Date().toISOString()
  const sources = state.scans.map((scan) => buildSource(scan))
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const resolvedFindingIds = getResolvedFindingIds(state)
  const remediationByFindingId = buildRemediationByFindingId(remediationPlan)

  const confirmedSystems = state.aiSystems.map((system) => buildSystem(system, workspace))
  const detectedSystems = state.detectedAISystems
    .filter((system) => system.detectionStatus !== "rejected" && !system.confirmedSystemId)
    .map((system) => buildDetectedSystem(system, workspace))
  const systems = [...confirmedSystems, ...detectedSystems]
  const findings = state.findings.map((finding) =>
    buildFinding({
      finding,
      relatedAlert: findRelatedAlert(state.alerts, finding),
      remediation: remediationByFindingId.get(finding.id),
      isResolved: resolvedFindingIds.has(finding.id),
      sourceById,
    })
  )
  const snapshotId = buildSnapshotId(workspace.orgId, sources, systems, findings)
  const comparedToSnapshotId =
    (state.validatedBaselineSnapshotId &&
    state.validatedBaselineSnapshotId !== snapshotId
      ? state.validatedBaselineSnapshotId
      : null) ||
    state.snapshotHistory.find((snapshot) => snapshot.snapshotId !== snapshotId)?.snapshotId ||
    null

  return {
    version: "1.0",
    snapshotId,
    comparedToSnapshotId,
    generatedAt,
    workspace: {
      id: workspace.orgId,
      name: workspace.orgName,
      label: workspace.workspaceLabel,
      owner: workspace.workspaceOwner,
    },
    sources,
    systems,
    findings,
    drift: [],
    summary: {
      complianceScore: summary.score,
      riskLabel: mapRiskLabel(summary.riskLabel),
      openFindings: findings.filter((item) => item.status === "open").length,
      openAlerts: summary.openAlerts,
      systemsDetected: systems.length,
      highRiskSystems: systems.filter((item) => item.riskClass === "high").length,
    },
  }
}

export function serializeCompliScanYaml(snapshot: CompliScanSnapshot) {
  return `${toYaml(snapshot)}\n`
}

export function buildCompliScanFileName(
  workspaceName: string,
  generatedAt: string,
  format: "json" | "yaml"
) {
  const dateLabel = generatedAt.slice(0, 10)
  return `compliscan-${slugify(workspaceName)}-${dateLabel}.${format}`
}

function buildSource(scan: ScanRecord): CompliScanSource {
  const sourceFingerprint = hashContent([
    scan.id,
    scan.documentName,
    scan.contentPreview,
    scan.contentExtracted || "",
    scan.createdAtISO,
    scan.extractionMethod || "",
  ])

  return {
    id: scan.id,
    type: inferSourceType(scan),
    name: scan.documentName,
    path: null,
    scannedAt: scan.createdAtISO,
    hash: sourceFingerprint,
    sourceFingerprint,
    analysisStatus: scan.analysisStatus || "completed",
    extractionStatus: scan.extractionStatus || "completed",
    extractionMethod: scan.extractionMethod || null,
    previewSnippet: truncate(scan.contentExtracted || scan.contentPreview || "", 280),
  }
}

function buildSystem(system: ComplianceState["aiSystems"][number], workspace: WorkspaceContext): CompliScanSystem {
  const principles = inferSystemPrinciples(system)

  return {
    id: system.id,
    systemName: system.name,
    sourceIds: [],
    discoveryMethod: "manual",
    detectionStatus: "confirmed",
    confidence: "high",
    provider: normalizeProvider(system.vendor),
    model: system.modelType,
    frameworks: [],
    purpose: system.purpose,
    riskClass: system.riskLevel,
    dataUsed: inferDataUsed(system),
    personalDataUsed: system.usesPersonalData,
    automatedDecisions: system.makesAutomatedDecisions,
    impactsRights: system.impactsRights,
    humanReview: {
      required: system.makesAutomatedDecisions || system.impactsRights,
      present: system.hasHumanReview,
    },
    owner: workspace.workspaceOwner,
    status: system.hasHumanReview && !system.impactsRights ? "active" : "review_required",
    lastReviewedAt: system.createdAtISO,
    evidence: buildSystemEvidence(system),
    principles,
  }
}

function buildDetectedSystem(
  system: DetectedAISystemRecord,
  workspace: WorkspaceContext
): CompliScanSystem {
  const principles = inferSystemPrinciples(system)

  return {
    id: system.id,
    systemName: system.name,
    sourceIds: system.sourceScanId ? [system.sourceScanId] : [],
    discoveryMethod: system.discoveryMethod,
    detectionStatus: system.detectionStatus,
    confidence: system.confidence,
    provider: normalizeProvider(system.vendor),
    model: system.modelType,
    frameworks: system.frameworks,
    purpose: system.purpose,
    riskClass: system.riskLevel,
    dataUsed: inferDataUsed(system),
    personalDataUsed: system.usesPersonalData,
    automatedDecisions: system.makesAutomatedDecisions,
    impactsRights: system.impactsRights,
    humanReview: {
      required: system.makesAutomatedDecisions || system.impactsRights,
      present: system.hasHumanReview,
    },
    owner: workspace.workspaceOwner,
    status:
      system.detectionStatus === "confirmed"
        ? "active"
        : system.detectionStatus === "reviewed"
          ? "review_required"
          : "review_required",
    lastReviewedAt: system.detectedAtISO,
    evidence: [
      ...buildSystemEvidence(system),
      ...system.evidence.map((value) => ({
        type: "dependency" as const,
        value,
        sourceId: system.sourceScanId,
      })),
    ],
    principles,
  }
}

function buildSystemEvidence(system: ComplianceState["aiSystems"][number]): CompliScanEvidence[] {
  const evidence: CompliScanEvidence[] = [
    {
      type: "metadata",
      value: `Vendor: ${system.vendor}`,
    },
    {
      type: "metadata",
      value: `Model: ${system.modelType}`,
    },
    {
      type: "metadata",
      value: `Purpose: ${system.purpose}`,
    },
  ]

  if (system.annexIIIHint) {
    evidence.push({
      type: "metadata",
      value: `Annex III hint: ${system.annexIIIHint}`,
    })
  }

  return evidence
}

function buildFinding({
  finding,
  relatedAlert,
  remediation,
  isResolved,
  sourceById,
}: {
  finding: ScanFinding
  relatedAlert?: ComplianceAlert
  remediation?: RemediationAction
  isResolved: boolean
  sourceById: Map<string, CompliScanSource>
}): CompliScanFinding {
  const sourceId = resolveSourceId(finding, sourceById)

  return {
    id: finding.id,
    sourceId,
    issue: finding.title,
    severity: inferFindingSeverity(finding, relatedAlert),
    principle: inferFindingPrinciple(finding),
    regulatoryArea: mapRegulatoryArea(finding.category),
    evidence: buildFindingEvidence(finding),
    recommendedFix:
      finding.remediationHint ||
      remediation?.fixPreview ||
      remediation?.actions[0] ||
      remediation?.why ||
      finding.detail,
    owner: remediation?.owner || inferFindingOwner(finding.category),
    status: isResolved ? "resolved" : "open",
    detectedAt: finding.createdAtISO,
    legalReference: finding.legalReference,
    tags: buildFindingTags(finding),
  }
}

function buildRemediationByFindingId(remediationPlan: RemediationAction[]) {
  const map = new Map<string, RemediationAction>()

  for (const remediation of remediationPlan) {
    for (const findingId of remediation.relatedFindingIds ?? []) {
      if (!map.has(findingId)) map.set(findingId, remediation)
    }
  }

  return map
}

function findRelatedAlert(alerts: ComplianceAlert[], finding: ScanFinding) {
  return alerts.find(
    (alert) =>
      alert.findingId === finding.id ||
      (!!finding.scanId && alert.scanId === finding.scanId && alert.sourceDocument === finding.sourceDocument)
  )
}

function resolveSourceId(
  finding: ScanFinding,
  sourceById: Map<string, CompliScanSource>
) {
  if (finding.scanId && sourceById.has(finding.scanId)) return finding.scanId

  for (const source of sourceById.values()) {
    if (source.name === finding.sourceDocument) return source.id
  }

  return undefined
}

function buildFindingEvidence(finding: ScanFinding) {
  if (finding.provenance?.excerpt?.trim()) {
    const keywordPrefix = finding.provenance.matchedKeyword
      ? `Keyword: ${finding.provenance.matchedKeyword}. `
      : ""
    return `${keywordPrefix}${finding.provenance.excerpt.trim()}`
  }

  return finding.detail
}

function inferFindingSeverity(
  finding: ScanFinding,
  relatedAlert?: ComplianceAlert
): CompliScanSeverity {
  if (finding.severity) {
    return normalizeComplianceSeverity(finding.severity)
  }

  if (relatedAlert?.severity) {
    return normalizeComplianceSeverity(relatedAlert.severity)
  }

  return finding.category === "E_FACTURA" ? "low" : "medium"
}

function inferFindingPrinciple(finding: ScanFinding): CompliScanPrinciple {
  const explicitPrinciple = normalizeCompliancePrinciples(
    finding.principles ?? [],
    inferPrinciplesFromCategory(finding.category)
  )[0]
  if (explicitPrinciple) return explicitPrinciple

  const inferredByCategory = inferPrinciplesFromCategory(finding.category)[0]
  if (inferredByCategory) return inferredByCategory

  const text = `${finding.title} ${finding.detail} ${finding.provenance?.matchedKeyword || ""}`.toLowerCase()

  if (finding.category === "GDPR") return "privacy_data_governance"
  if (finding.category === "E_FACTURA") return "accountability"
  if (includesAny(text, ["override", "uman", "human", "decizie automata", "profilare", "scoring"])) {
    return "oversight"
  }
  if (includesAny(text, ["logic", "transparent", "explic" ])) return "transparency"
  return "accountability"
}

function inferFindingOwner(category: FindingCategory) {
  if (category === "EU_AI_ACT") return "DPO + Tech Lead"
  if (category === "GDPR") return "Marketing Ops + Legal"
  return "FinOps + Backend"
}

function buildFindingTags(finding: ScanFinding) {
  const tags = new Set<string>([
    mapRegulatoryArea(finding.category),
    finding.severity,
  ])

  if (finding.provenance?.ruleId) tags.add(finding.provenance.ruleId.toLowerCase())
  if (finding.provenance?.matchedKeyword) tags.add(slugify(finding.provenance.matchedKeyword))

  return [...tags]
}

function inferSystemPrinciples(
  system: ComplianceState["aiSystems"][number]
): CompliScanPrinciple[] {
  const principles = new Set<CompliScanPrinciple>(["accountability", "transparency"])

  if (system.makesAutomatedDecisions || system.impactsRights || !system.hasHumanReview) {
    principles.add("oversight")
  }
  if (system.usesPersonalData) principles.add("privacy_data_governance")
  if (system.makesAutomatedDecisions) principles.add("robustness")

  return [...principles]
}

function inferDataUsed(system: ComplianceState["aiSystems"][number]) {
  const purposeMap: Record<string, string[]> = {
    "hr-screening": ["candidate_profiles", "cv_data"],
    "credit-scoring": ["financial_profiles", "application_data"],
    "biometric-identification": ["biometric_templates", "identity_data"],
    "fraud-detection": ["transaction_logs", "behavioral_signals"],
    "marketing-personalization": ["customer_segments", "engagement_events"],
    "support-chatbot": ["customer_messages", "support_context"],
    "document-assistant": ["uploaded_documents", "document_metadata"],
    other: ["operational_input"],
  }

  const values = purposeMap[system.purpose] ?? purposeMap.other
  if (system.usesPersonalData && !values.includes("personal_data")) {
    return [...values, "personal_data"]
  }
  return values
}

function inferSourceType(scan: ScanRecord): CompliScanSourceType {
  if (scan.sourceKind === "manifest" || scan.sourceKind === "yaml") return "codebase"
  const lowerName = scan.documentName.toLowerCase()
  const lowerPreview = `${scan.documentName} ${scan.contentPreview}`.toLowerCase()

  if (
    lowerName.endsWith("package.json") ||
    lowerName.endsWith("package-lock.json") ||
    lowerName.endsWith("pnpm-lock.yaml") ||
    lowerName.endsWith("yarn.lock") ||
    lowerName.endsWith("requirements.txt") ||
    lowerName.endsWith("pyproject.toml") ||
    lowerName.endsWith("poetry.lock")
  ) {
    return "codebase"
  }

  if (includesAny(lowerPreview, ["http://", "https://", "politica", "privacy policy", "terms"])) {
    return "policy_web"
  }

  return "document"
}

function mapRegulatoryArea(category: FindingCategory): CompliScanRegulatoryArea {
  if (category === "EU_AI_ACT") return "eu_ai_act"
  if (category === "GDPR") return "gdpr"
  return "e_factura"
}

function mapRiskLabel(riskLabel: DashboardSummary["riskLabel"]): CompliScanRiskLabel {
  if (riskLabel === "Risc Scăzut") return "low"
  if (riskLabel === "Risc Ridicat") return "high"
  return "medium"
}

function normalizeProvider(value: string) {
  return slugify(value).replace(/-/g, "_") || "unknown_provider"
}

function buildSnapshotId(
  orgId: string,
  sources: CompliScanSource[],
  systems: CompliScanSystem[],
  findings: CompliScanFinding[]
) {
  return `snapshot-${hashContent([
    orgId,
    ...sources.map((item) => `${item.id}:${item.sourceFingerprint}:${item.analysisStatus}`),
    ...systems.map(
      (item) =>
        `${item.systemName}:${item.provider}:${item.model}:${item.riskClass}:${item.detectionStatus}:${item.frameworks.join(",")}`
    ),
    ...findings.map(
      (item) =>
        `${item.id}:${item.issue}:${item.severity}:${item.status}:${item.regulatoryArea}`
    ),
  ]).slice(0, 12)}`
}

function hashContent(parts: string[]) {
  return createHash("sha256").update(parts.join("::")).digest("hex")
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 1)}…`
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "workspace"
}

function toYaml(value: unknown, indent = 0): string {
  const spacing = " ".repeat(indent)

  if (Array.isArray(value)) {
    if (value.length === 0) return `${spacing}[]`

    return value
      .map((item) => {
        if (isScalar(item)) {
          return `${spacing}- ${formatScalar(item)}`
        }

        return `${spacing}-\n${toYaml(item, indent + 2)}`
      })
      .join("\n")
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
    if (entries.length === 0) return `${spacing}{}`

    return entries
      .map(([key, nestedValue]) => {
        if (isScalar(nestedValue) || isInlineCollection(nestedValue)) {
          return `${spacing}${key}: ${formatInlineValue(nestedValue)}`
        }

        return `${spacing}${key}:\n${toYaml(nestedValue, indent + 2)}`
      })
      .join("\n")
  }

  return `${spacing}${formatScalar(value)}`
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ["string", "number", "boolean"].includes(typeof value)
}

function isInlineCollection(value: unknown) {
  return (Array.isArray(value) && value.length === 0) ||
    (!!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
}

function formatInlineValue(value: unknown) {
  if (Array.isArray(value)) return "[]"
  if (value && typeof value === "object") return "{}"
  return formatScalar(value)
}

function formatScalar(value: unknown) {
  if (value === null || value === undefined) return "null"
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}
