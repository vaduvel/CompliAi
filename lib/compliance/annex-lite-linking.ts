import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"

export type AnnexLiteSectionKey =
  | "system_description"
  | "system_scope"
  | "intended_purpose"
  | "intended_users_and_affected_persons"
  | "data_and_governance"
  | "risk_and_rights_impact"
  | "human_oversight"
  | "technical_dependencies"
  | "monitoring_and_controls"
  | "evidence_and_validation"

export type AnnexLiteSectionRef = {
  systemId: string
  systemName: string
  sectionKey: AnnexLiteSectionKey
  sectionLabel: string
  anchorId: string
}

const SECTION_LABELS: Record<AnnexLiteSectionKey, string> = {
  system_description: "System description",
  system_scope: "System scope",
  intended_purpose: "Intended purpose",
  intended_users_and_affected_persons: "Intended users and affected persons",
  data_and_governance: "Data and governance",
  risk_and_rights_impact: "Risk and rights impact",
  human_oversight: "Human oversight",
  technical_dependencies: "Technical dependencies",
  monitoring_and_controls: "Monitoring and controls",
  evidence_and_validation: "Evidence and validation",
}

export function getAnnexSectionLabel(sectionKey: AnnexLiteSectionKey) {
  return SECTION_LABELS[sectionKey]
}

export function buildAnnexSystemAnchor(systemId: string) {
  return `annex-system-${slugify(systemId)}`
}

export function buildAnnexSectionAnchor(systemId: string, sectionKey: AnnexLiteSectionKey) {
  return `${buildAnnexSystemAnchor(systemId)}-${sectionKey}`
}

export function getAnnexSectionDescriptors(systemId: string) {
  return (Object.keys(SECTION_LABELS) as AnnexLiteSectionKey[]).map((sectionKey) => ({
    sectionKey,
    sectionLabel: getAnnexSectionLabel(sectionKey),
    anchorId: buildAnnexSectionAnchor(systemId, sectionKey),
  }))
}

export function getAnnexRefsForTaskLike(
  compliancePack: AICompliancePack,
  input: {
    taskId?: string | null
    sourceDocument?: string | null
    lawReference?: string | null
    title?: string | null
    body?: string | null
  }
): AnnexLiteSectionRef[] {
  const entry = findBestPackEntry(compliancePack, input)
  if (!entry) return []

  const sectionKeys = suggestAnnexSections({
    lawReference: input.lawReference,
    title: input.title,
    body: input.body,
  })

  return sectionKeys.map((sectionKey) => ({
    systemId: entry.systemId,
    systemName: entry.systemName,
    sectionKey,
    sectionLabel: getAnnexSectionLabel(sectionKey),
    anchorId: buildAnnexSectionAnchor(entry.systemId, sectionKey),
  }))
}

export function getAnnexRefsForTraceRecord(
  compliancePack: AICompliancePack,
  record: ComplianceTraceRecord
): AnnexLiteSectionRef[] {
  return getAnnexRefsForTaskLike(compliancePack, {
    taskId: record.entryKind === "control_task" ? record.entryId : null,
    sourceDocument: record.sourceDocuments[0] ?? null,
    lawReference: record.lawReferences[0] ?? null,
    title: record.title,
    body: [record.evidenceRequired, record.nextStep, ...record.lawReferences].filter(Boolean).join(" · "),
  })
}

function findBestPackEntry(
  compliancePack: AICompliancePack,
  input: {
    taskId?: string | null
    sourceDocument?: string | null
    lawReference?: string | null
    title?: string | null
    body?: string | null
  }
) {
  if (input.taskId) {
    const byTask = compliancePack.entries.find((entry) =>
      entry.evidenceBundle.controls.some((control) => control.taskId === input.taskId)
    )
    if (byTask) return byTask
  }

  if (input.sourceDocument) {
    const bySource = compliancePack.entries.find((entry) =>
      entry.sources.some((source) => source.name === input.sourceDocument)
    )
    if (bySource) return bySource
  }

  if (input.lawReference) {
    const lawReference = input.lawReference
    const byLaw = compliancePack.entries.find((entry) =>
      entry.compliance.legalReferences.includes(lawReference)
    )
    if (byLaw) return byLaw
  }

  const haystack = `${input.title ?? ""} ${input.body ?? ""}`.toLowerCase()

  return (
    compliancePack.entries.find((entry) =>
      [
        entry.systemName,
        entry.identity.provider,
        entry.identity.model,
        entry.identity.purpose,
      ]
        .filter(Boolean)
        .some((value) => haystack.includes(String(value).toLowerCase()))
    ) ?? null
  )
}

function suggestAnnexSections(input: {
  lawReference?: string | null
  title?: string | null
  body?: string | null
}): AnnexLiteSectionKey[] {
  const text = `${input.lawReference ?? ""} ${input.title ?? ""} ${input.body ?? ""}`.toLowerCase()
  const keys = new Set<AnnexLiteSectionKey>()

  if (includesAny(text, ["art. 14", "articolul 14", "oversight", "human review", "override"])) {
    keys.add("human_oversight")
    keys.add("monitoring_and_controls")
  }

  if (
    includesAny(text, [
      "gdpr",
      "chapter v",
      "privacy",
      "personal data",
      "consim",
      "tracking",
      "residency",
      "reziden",
      "retention",
      "reten",
    ])
  ) {
    keys.add("data_and_governance")
    keys.add("evidence_and_validation")
  }

  if (includesAny(text, ["art. 52", "transparency", "transparen", "chatbot", "assistant"])) {
    keys.add("intended_purpose")
    keys.add("monitoring_and_controls")
  }

  if (includesAny(text, ["risk", "rights", "eligibility", "scoring", "high-risk", "fairness"])) {
    keys.add("risk_and_rights_impact")
  }

  if (includesAny(text, ["provider", "model", "framework", "dependency", "sdk"])) {
    keys.add("technical_dependencies")
  }

  if (keys.size === 0) {
    keys.add("monitoring_and_controls")
  }

  return [...keys]
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
