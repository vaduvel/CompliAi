import type {
  ComplianceEvent,
  GeneratedDocumentRecord,
  PersistedTaskState,
  ScanFinding,
} from "@/lib/compliance/types"

export const FINDING_LIFECYCLE_STAGES = [
  "detected",
  "triaged",
  "in_progress",
  "sent_to_client",
  "client_decided",
  "evidence_attached",
  "evidence_validated",
  "resolved",
  "monitoring",
] as const

export type FindingLifecycleStage = (typeof FINDING_LIFECYCLE_STAGES)[number]

export type FindingLifecycleView = {
  findingId: string
  title: string
  severity: ScanFinding["severity"]
  category: ScanFinding["category"]
  currentStage: FindingLifecycleStage
  completedStages: FindingLifecycleStage[]
  missingStages: FindingLifecycleStage[]
  nextAction: string
  statusLabel: string
  clientDecision: "approved" | "rejected" | "commented" | "none"
  evidence: {
    attached: boolean
    validated: boolean
    sources: string[]
  }
  dossierReady: boolean
  reportable: boolean
}

type FindingLifecycleInput = {
  finding: ScanFinding
  generatedDocuments?: GeneratedDocumentRecord[]
  taskState?: Record<string, PersistedTaskState>
  events?: ComplianceEvent[]
}

export function buildFindingLifecycleView({
  finding,
  generatedDocuments = [],
  taskState = {},
  events = [],
}: FindingLifecycleInput): FindingLifecycleView {
  const linkedDocuments = generatedDocuments.filter((document) => document.sourceFindingId === finding.id)
  const latestDocument = [...linkedDocuments].sort((left, right) =>
    right.generatedAtISO.localeCompare(left.generatedAtISO)
  )[0]
  const findingEvents = events.filter(
    (event) =>
      event.entityId === finding.id ||
      linkedDocuments.some((document) => document.id === event.entityId) ||
      (typeof event.metadata?.findingId === "string" && event.metadata.findingId === finding.id)
  )
  const task = taskState[finding.id]
  const status = finding.findingStatus ?? "open"

  const hasGeneratedDocument = linkedDocuments.length > 0
  const hasSentDocument =
    linkedDocuments.some((document) =>
      ["sent_for_signature", "signed", "active", "rejected"].includes(document.adoptionStatus ?? "")
    ) ||
    findingEvents.some((event) => ["document.shared", "document_sent"].includes(event.type))

  const hasClientApproval =
    linkedDocuments.some((document) => ["signed", "active"].includes(document.adoptionStatus ?? "")) ||
    findingEvents.some((event) => event.type === "document.shared_approved")
  const hasClientRejection =
    linkedDocuments.some((document) => document.adoptionStatus === "rejected") ||
    findingEvents.some((event) => event.type === "document.shared_rejected")
  const hasClientComment =
    linkedDocuments.some((document) => (document.shareComments ?? []).length > 0) ||
    findingEvents.some((event) => event.type === "document.shared_commented")

  const evidenceSources = collectEvidenceSources({
    finding,
    linkedDocuments,
    task,
    findingEvents,
  })
  const evidenceAttached = evidenceSources.length > 0
  const evidenceValidated =
    status === "resolved" ||
    status === "under_monitoring" ||
    linkedDocuments.some((document) => document.approvalStatus === "approved_as_evidence") ||
    linkedDocuments.some((document) => document.validationStatus === "passed" && Boolean(document.validatedAtISO)) ||
    task?.validationStatus === "passed" ||
    task?.attachedEvidenceMeta?.quality?.status === "sufficient"

  const resolved = status === "resolved" || status === "under_monitoring"
  const monitoring = status === "under_monitoring" || Boolean(finding.nextMonitoringDateISO)

  const stageFlags: Record<FindingLifecycleStage, boolean> = {
    detected: true,
    triaged: hasTriagedFinding(finding),
    in_progress: status === "confirmed" || resolved || hasGeneratedDocument || Boolean(task),
    sent_to_client: hasSentDocument,
    client_decided: hasClientApproval || hasClientRejection,
    evidence_attached: evidenceAttached,
    evidence_validated: evidenceValidated,
    resolved,
    monitoring,
  }
  const completedStages = FINDING_LIFECYCLE_STAGES.filter((stage) => stageFlags[stage])
  const missingStages = FINDING_LIFECYCLE_STAGES.filter((stage) => !stageFlags[stage])
  const currentStage = [...completedStages].reverse()[0] ?? "detected"
  const clientDecision = hasClientApproval
    ? "approved"
    : hasClientRejection
      ? "rejected"
      : hasClientComment
        ? "commented"
        : "none"

  return {
    findingId: finding.id,
    title: finding.title,
    severity: finding.severity,
    category: finding.category,
    currentStage,
    completedStages,
    missingStages,
    nextAction: buildNextAction(finding, missingStages, latestDocument),
    statusLabel: buildStatusLabel(currentStage, clientDecision),
    clientDecision,
    evidence: {
      attached: evidenceAttached,
      validated: evidenceValidated,
      sources: evidenceSources,
    },
    dossierReady: monitoring && evidenceValidated,
    reportable: evidenceAttached || resolved || findingEvents.length > 0,
  }
}

function hasTriagedFinding(finding: ScanFinding) {
  return Boolean(
    finding.severity &&
      finding.category &&
      (finding.remediationHint || finding.resolution?.action || finding.evidenceRequired)
  )
}

function collectEvidenceSources({
  finding,
  linkedDocuments,
  task,
  findingEvents,
}: {
  finding: ScanFinding
  linkedDocuments: GeneratedDocumentRecord[]
  task?: PersistedTaskState
  findingEvents: ComplianceEvent[]
}) {
  const sources = new Set<string>()

  if (task?.attachedEvidenceMeta?.fileName) sources.add(task.attachedEvidenceMeta.fileName)
  if (task?.attachedEvidence) sources.add(task.attachedEvidence)
  if (finding.operationalEvidenceNote) sources.add("dovadă operațională în cockpit")
  if (finding.resolution?.closureEvidence) sources.add("closure evidence în rezoluție")

  linkedDocuments.forEach((document) => {
    if (document.approvalStatus === "approved_as_evidence") sources.add(document.title)
    if (document.validationStatus === "passed") sources.add(`${document.title} · validat`)
    if (document.adoptionStatus === "signed") sources.add(`${document.title} · aprobat client`)
    if (document.adoptionStatus === "rejected") sources.add(`${document.title} · respins client`)
    if (document.evidenceNote) sources.add(`${document.title} · notă dovadă`)
  })

  findingEvents.forEach((event) => {
    if (event.type.startsWith("document.shared_")) sources.add(event.message)
    if (event.type === "dpo.migration_imported") sources.add(event.message)
  })

  return [...sources]
}

function buildNextAction(
  finding: ScanFinding,
  missingStages: FindingLifecycleStage[],
  latestDocument?: GeneratedDocumentRecord
) {
  const firstMissing = missingStages[0]

  if (!firstMissing) return "Menține monitorizarea și păstrează dovada în Dosar."
  if (firstMissing === "triaged") return "Completează severitatea, owner-ul, termenul și dovada cerută."
  if (firstMissing === "in_progress") return finding.resolution?.action || finding.remediationHint || "Confirmă finding-ul și începe lucrul în cockpit."
  if (firstMissing === "sent_to_client") {
    return latestDocument
      ? `Trimite documentul către client prin magic link: ${latestDocument.title}.`
      : "Generează documentul sau taskul necesar și trimite-l clientului dacă are nevoie de confirmare."
  }
  if (firstMissing === "client_decided") return "Așteaptă aprobare/respingere/comentariu de la client sau marchează review-ul intern."
  if (firstMissing === "evidence_attached") return "Atașează dovada: document, screenshot, email, registru sau notă operațională."
  if (firstMissing === "evidence_validated") return "Validează dovada ca suficientă înainte de închiderea finding-ului."
  if (firstMissing === "resolved") return "Închide finding-ul numai după ce dovada este suficientă."
  return "Trimite cazul în Dosar și programează monitorizarea următoare."
}

function buildStatusLabel(stage: FindingLifecycleStage, clientDecision: FindingLifecycleView["clientDecision"]) {
  if (clientDecision === "rejected") return "Respins de client · necesită revizie"
  if (clientDecision === "approved") return "Aprobat de client"
  if (clientDecision === "commented") return "Comentariu client primit"

  const labels: Record<FindingLifecycleStage, string> = {
    detected: "Detectat",
    triaged: "Triat",
    in_progress: "În lucru",
    sent_to_client: "Trimis clientului",
    client_decided: "Decizie client capturată",
    evidence_attached: "Dovadă atașată",
    evidence_validated: "Dovadă validată",
    resolved: "Rezolvat",
    monitoring: "În Dosar și monitorizare",
  }
  return labels[stage]
}
