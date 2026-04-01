import {
  buildAIActFindingId,
  classifyAISystem,
  getAIActRequiredActionIds,
  type AIActClassification,
  type AIActObligationId,
  type AIActRiskLevel,
} from "@/lib/compliance/ai-act-classifier"
import type { AISystemRecord, ComplianceState, GeneratedDocumentRecord, ScanFinding } from "@/lib/compliance/types"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"

export type AIActEvidencePack = {
  generatedAtISO: string
  systems: {
    systemId: string
    systemName: string
    riskClass: AIActRiskLevel
    classification: AIActClassification
    obligations: {
      id: string
      label: string
      status: "done" | "pending" | "overdue"
      evidenceTitle?: string
    }[]
    annexIvGenerated: boolean
    annexIvApproved: boolean
    euDbSubmitted: boolean
    findingsResolved: number
    findingsOpen: number
  }[]
  overallCompliance: number
  deadline: string | null
}

const OBLIGATION_LABELS: Record<AIActObligationId, string> = {
  "register-eu-database": "Înregistrare EU Database",
  "technical-documentation": "Documentație Annex IV",
  "human-oversight": "Human oversight",
  "conformity-assessment": "Evaluare de conformitate",
  "stop-system": "Oprire sistem interzis",
  "manual-classification": "Validare manuală clasificare",
  disclosure: "Disclosure utilizator",
}

export async function buildAIActEvidencePack(orgId: string): Promise<AIActEvidencePack> {
  const loadedState = await readStateForOrg(orgId)
  const state = normalizeComplianceState(loadedState ?? structuredClone(initialComplianceState))
  const generatedAtISO = new Date().toISOString()
  const systems = state.aiSystems.map((system) => buildSystemPack(system, state, generatedAtISO))
  const totalObligations = systems.reduce((sum, system) => sum + system.obligations.length, 0)
  const doneObligations = systems.reduce(
    (sum, system) => sum + system.obligations.filter((obligation) => obligation.status === "done").length,
    0
  )
  const upcomingDeadlines = systems
    .flatMap((system) =>
      system.obligations
        .filter((obligation) => obligation.status !== "done" && system.classification.deadline)
        .map(() => system.classification.deadline!)
    )
    .sort((left, right) => left.localeCompare(right))

  return {
    generatedAtISO,
    systems,
    overallCompliance:
      totalObligations === 0 ? 100 : Math.round((doneObligations / totalObligations) * 100),
    deadline: upcomingDeadlines[0] ?? null,
  }
}

function buildSystemPack(
  system: AISystemRecord,
  state: ComplianceState,
  nowISO: string
): AIActEvidencePack["systems"][number] {
  const classification = classifyAISystem(system.purpose)
  const obligationIds = getAIActRequiredActionIds(classification)
  const findings = state.findings.filter((finding) => finding.id.startsWith(`ai-act-${system.id}-`))
  const annexFindingId = buildAIActFindingId(system.id, "technical-documentation")
  const annexDocs = state.generatedDocuments.filter((document) => document.sourceFindingId === annexFindingId)
  const annexBestDoc = pickBestDocument(annexDocs)
  const obligations = obligationIds.map((obligationId) =>
    buildObligationStatus({
      obligationId,
      system,
      classification,
      findings,
      documents: state.generatedDocuments,
      nowISO,
    })
  )

  return {
    systemId: system.id,
    systemName: system.name,
    riskClass: classification.riskLevel,
    classification,
    obligations,
    annexIvGenerated: annexDocs.length > 0,
    annexIvApproved: annexBestDoc?.approvalStatus === "approved_as_evidence",
    euDbSubmitted: isFindingClosed(findings.find((finding) => finding.id === buildAIActFindingId(system.id, "register-eu-database"))),
    findingsResolved: findings.filter(isFindingClosed).length,
    findingsOpen: findings.filter((finding) => !isFindingClosed(finding)).length,
  }
}

function buildObligationStatus(input: {
  obligationId: AIActObligationId
  system: AISystemRecord
  classification: AIActClassification
  findings: ScanFinding[]
  documents: GeneratedDocumentRecord[]
  nowISO: string
}): AIActEvidencePack["systems"][number]["obligations"][number] {
  const findingId = buildAIActFindingId(input.system.id, input.obligationId)
  const finding = input.findings.find((candidate) => candidate.id === findingId)
  const linkedDocs = input.documents.filter((document) => document.sourceFindingId === findingId)
  const bestDoc = pickBestDocument(linkedDocs)
  const deadlinePassed =
    Boolean(input.classification.deadline) && input.classification.deadline!.localeCompare(input.nowISO.slice(0, 10)) < 0

  let done = isFindingClosed(finding)
  if (input.obligationId === "technical-documentation") {
    done = done || bestDoc?.approvalStatus === "approved_as_evidence"
  }
  if (input.obligationId === "human-oversight") {
    done = done || input.system.policyAttestationStatus === "attested"
  }
  if (input.obligationId === "manual-classification") {
    done = done || input.system.approvalStatus === "approved"
  }

  return {
    id: findingId,
    label: OBLIGATION_LABELS[input.obligationId],
    status: done ? "done" : deadlinePassed ? "overdue" : "pending",
    evidenceTitle: bestDoc?.title,
  }
}

function pickBestDocument(documents: GeneratedDocumentRecord[]) {
  if (documents.length === 0) return null
  return [...documents].sort((left, right) => {
    const leftScore = left.approvalStatus === "approved_as_evidence" ? 2 : left.validationStatus === "passed" ? 1 : 0
    const rightScore = right.approvalStatus === "approved_as_evidence" ? 2 : right.validationStatus === "passed" ? 1 : 0
    if (leftScore !== rightScore) return rightScore - leftScore
    return right.generatedAtISO.localeCompare(left.generatedAtISO)
  })[0] ?? null
}

function isFindingClosed(finding: ScanFinding | undefined) {
  return finding?.findingStatus === "resolved" || finding?.findingStatus === "under_monitoring"
}
