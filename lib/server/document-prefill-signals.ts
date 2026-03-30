import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import type { GeneratedDocumentRecord, ScanRecord } from "@/lib/compliance/types"

type DocumentSignalInput = {
  generatedDocuments: GeneratedDocumentRecord[]
  scans: ScanRecord[]
}

type QuestionId =
  | "usesAITools"
  | "processesPersonalData"
  | "usesExternalVendors"
  | "hasSiteWithForms"
  | "hasStandardContracts"
  | "hasPrivacyPolicy"
  | "hasVendorDpas"
  | "hasAiPolicy"
  | "hasVendorDocumentation"
  | "vendorsSendPersonalData"
  | "hasSitePrivacyPolicy"

type SignalEvidence = {
  questionId: QuestionId
  sourceKey: string
  label: string
  kind: "generated" | "uploaded"
  confidence: "high" | "medium"
  reason: string
  source: "document_memory"
}

const SIGNAL_LABELS: Record<QuestionId, string> = {
  usesAITools: "tool-uri AI",
  processesPersonalData: "date personale",
  usesExternalVendors: "vendori externi",
  hasSiteWithForms: "site cu cookies sau formulare",
  hasStandardContracts: "contracte standard",
  hasPrivacyPolicy: "politica de confidențialitate",
  hasVendorDpas: "DPA-uri pentru vendori",
  hasAiPolicy: "politică AI",
  hasVendorDocumentation: "documentație vendor",
  vendorsSendPersonalData: "vendori care procesează date personale",
  hasSitePrivacyPolicy: "privacy policy publicată pe site",
}

export function buildDocumentPrefillSignals({
  generatedDocuments,
  scans,
}: DocumentSignalInput): {
  suggestions: Partial<
    Pick<
      OrgProfilePrefill["suggestions"],
      | "usesAITools"
      | "processesPersonalData"
      | "usesExternalVendors"
      | "hasSiteWithForms"
      | "hasStandardContracts"
      | "hasPrivacyPolicy"
      | "hasVendorDpas"
      | "hasAiPolicy"
      | "hasVendorDocumentation"
      | "vendorsSendPersonalData"
      | "hasSitePrivacyPolicy"
    >
  >
  documentSignals?: OrgProfilePrefill["documentSignals"]
} {
  const evidences = [
    ...generatedDocuments.flatMap(classifyGeneratedDocument),
    ...scans
      .filter((scan) => (scan.sourceKind ?? "document") === "document")
      .flatMap(classifyUploadedDocument),
  ]

  if (evidences.length === 0) {
    return { suggestions: {} }
  }

  const suggestions: Partial<
    Pick<
      OrgProfilePrefill["suggestions"],
      | "usesAITools"
      | "processesPersonalData"
      | "usesExternalVendors"
      | "hasSiteWithForms"
      | "hasStandardContracts"
      | "hasPrivacyPolicy"
      | "hasVendorDpas"
      | "hasAiPolicy"
      | "hasVendorDocumentation"
      | "vendorsSendPersonalData"
      | "hasSitePrivacyPolicy"
    >
  > = {}

  const byQuestion = new Map<QuestionId, SignalEvidence[]>()
  for (const evidence of evidences) {
    const existing = byQuestion.get(evidence.questionId) ?? []
    existing.push(evidence)
    byQuestion.set(evidence.questionId, existing)
  }

  for (const questionId of byQuestion.keys()) {
    const questionEvidence = byQuestion.get(questionId)
    if (!questionEvidence || questionEvidence.length === 0) continue
    suggestions[questionId] = buildSuggestion(questionId, questionEvidence)
  }

  const generatedCount = new Set(
    evidences
      .filter((evidence) => evidence.kind === "generated")
      .map((evidence) => evidence.sourceKey)
  ).size
  const uploadedCount = new Set(
    evidences
      .filter((evidence) => evidence.kind === "uploaded")
      .map((evidence) => evidence.sourceKey)
  ).size
  const topDocuments = [...new Set(evidences.map((evidence) => evidence.label))].slice(0, 3)
  const matchedSignals = [...new Set(evidences.map((evidence) => SIGNAL_LABELS[evidence.questionId]))]

  return {
    suggestions,
    documentSignals: {
      source: "document_memory",
      generatedCount,
      uploadedCount,
      matchedSignals,
      topDocuments,
    },
  }
}

export function enrichOrgProfilePrefillWithDocumentSignals(
  prefill: OrgProfilePrefill | null,
  input: DocumentSignalInput
): OrgProfilePrefill | null {
  if (!prefill) return null

  const { suggestions, documentSignals } = buildDocumentPrefillSignals(input)
  if (!documentSignals) return prefill

  return {
    ...prefill,
    documentSignals,
    suggestions: {
      ...suggestions,
      ...prefill.suggestions,
      hasSiteWithForms: prefill.suggestions.hasSiteWithForms ?? suggestions.hasSiteWithForms,
      hasStandardContracts:
        prefill.suggestions.hasStandardContracts ?? suggestions.hasStandardContracts,
      usesExternalVendors: prefill.suggestions.usesExternalVendors ?? suggestions.usesExternalVendors,
      processesPersonalData:
        prefill.suggestions.processesPersonalData ?? suggestions.processesPersonalData,
      usesAITools: prefill.suggestions.usesAITools ?? suggestions.usesAITools,
      hasPrivacyPolicy: prefill.suggestions.hasPrivacyPolicy ?? suggestions.hasPrivacyPolicy,
      hasVendorDpas: prefill.suggestions.hasVendorDpas ?? suggestions.hasVendorDpas,
      hasAiPolicy: prefill.suggestions.hasAiPolicy ?? suggestions.hasAiPolicy,
      hasVendorDocumentation:
        prefill.suggestions.hasVendorDocumentation ?? suggestions.hasVendorDocumentation,
      vendorsSendPersonalData:
        prefill.suggestions.vendorsSendPersonalData ?? suggestions.vendorsSendPersonalData,
      hasSitePrivacyPolicy:
        prefill.suggestions.hasSitePrivacyPolicy ?? suggestions.hasSitePrivacyPolicy,
    },
  }
}

function classifyGeneratedDocument(document: GeneratedDocumentRecord): SignalEvidence[] {
  const label = document.title.trim() || document.documentType

  switch (document.documentType) {
    case "privacy-policy":
      return [
        {
          questionId: "processesPersonalData",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai deja o politică de confidențialitate generată în CompliAI, ceea ce indică prelucrare de date personale.",
          source: "document_memory",
        },
        {
          questionId: "hasPrivacyPolicy",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai deja o politică de confidențialitate generată în CompliAI, deci există deja baza pentru politica GDPR cerută în onboarding.",
          source: "document_memory",
        },
        {
          questionId: "hasSitePrivacyPolicy",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Ai deja o politică de confidențialitate generată, deci există probabil și versiunea care trebuie publicată pe site dacă ai formulare sau cookies.",
          source: "document_memory",
        },
      ]
    case "cookie-policy":
      return [
        {
          questionId: "hasSiteWithForms",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai deja o politică de cookies generată, ceea ce indică un site cu cookies, tracking sau formulare publice.",
          source: "document_memory",
        },
      ]
    case "dpa":
      return [
        {
          questionId: "usesExternalVendors",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Ai generat deja un DPA, deci există sau se pregătește o relație cu furnizori externi care procesează date.",
          source: "document_memory",
        },
        {
          questionId: "hasStandardContracts",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Ai generat deja un DPA, deci lucrezi cu documente contractuale standard pentru furnizori sau procesatori.",
          source: "document_memory",
        },
        {
          questionId: "hasVendorDpas",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Ai generat deja un DPA în workspace, deci există deja documentație pentru vendorii care procesează date personale.",
          source: "document_memory",
        },
        {
          questionId: "hasVendorDocumentation",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Ai deja un DPA generat, deci există documentație contractuală pentru cel puțin o parte din vendorii externi.",
          source: "document_memory",
        },
        {
          questionId: "vendorsSendPersonalData",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "medium",
          reason:
            "Dacă ai generat deja un DPA, este foarte probabil că unii vendori procesează date personale în numele organizației.",
          source: "document_memory",
        },
      ]
    case "ai-governance":
      return [
        {
          questionId: "usesAITools",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai generat deja o politică de guvernanță AI, ceea ce indică utilizarea efectivă sau planificată a sistemelor AI în firmă.",
          source: "document_memory",
        },
        {
          questionId: "hasAiPolicy",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai deja o politică AI generată în CompliAI, deci răspunsul pentru existența unei politici interne AI este „da”.",
          source: "document_memory",
        },
      ]
    case "contract-template":
      return [
        {
          questionId: "hasStandardContracts",
          sourceKey: `generated:${document.id}`,
          label,
          kind: "generated",
          confidence: "high",
          reason:
            "Ai deja un contract-cadru generat în CompliAI, deci există un baseline contractual pregătit pentru relațiile comerciale standard.",
          source: "document_memory",
        },
      ]
    default:
      return []
  }
}

function classifyUploadedDocument(scan: ScanRecord): SignalEvidence[] {
  const label = scan.documentName.trim() || "Document încărcat"
  const text = `${scan.documentName} ${scan.contentExtracted ?? scan.contentPreview ?? ""}`.toLowerCase()
  const evidences: SignalEvidence[] = []

  if (matchesAny(text, ["cookie", "cookies", "consimtam", "analytics", "tracking", "newsletter", "formular", "formulare", "contact"])) {
    evidences.push({
      questionId: "hasSiteWithForms",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente încărcate despre cookies, tracking sau formulare de website, deci există probabil o suprafață publică cu colectare de date.",
      source: "document_memory",
    })
  }

  if (matchesAny(text, ["privacy", "confidentialitate", "gdpr", "date personale", "persoanelor vizate", "operator de date"])) {
    evidences.push({
      questionId: "hasPrivacyPolicy",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente încărcate despre confidențialitate sau GDPR, deci există probabil deja o politică de confidențialitate pregătită.",
      source: "document_memory",
    })
  }

  if (matchesAny(text, ["contract", "contracte", "agreement", "acord", "termeni", "terms", "msa", "addendum", "appendix"])) {
    evidences.push({
      questionId: "hasStandardContracts",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente contractuale încărcate, deci răspunsul este probabil „da” pentru contracte standard.",
      source: "document_memory",
    })
    evidences.push({
      questionId: "hasVendorDocumentation",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documentație contractuală pentru vendorii existenți, deci nu pornești de la zero în vendor review.",
      source: "document_memory",
    })
  }

  if (matchesAny(text, ["dpa", "data processing agreement", "procesator", "processor", "vendor", "furnizor", "subprocesator", "third party"])) {
    evidences.push({
      questionId: "usesExternalVendors",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente care menționează DPA, furnizori sau procesatori externi, deci folosești probabil vendori externi.",
      source: "document_memory",
    })
    evidences.push({
      questionId: "hasVendorDpas",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente DPA sau referințe la procesatori, deci există probabil deja DPA-uri sau drafturi pentru vendorii relevanți.",
      source: "document_memory",
    })
    evidences.push({
      questionId: "vendorsSendPersonalData",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Documentele menționează furnizori, DPA sau procesatori, ceea ce sugerează că anumite date personale ajung la vendori externi.",
      source: "document_memory",
    })
  }

  if (matchesAny(text, ["privacy", "confidentialitate", "gdpr", "date personale", "persoanelor vizate", "operator de date"])) {
    evidences.push({
      questionId: "processesPersonalData",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente despre confidențialitate sau GDPR, ceea ce sugerează prelucrare de date personale.",
      source: "document_memory",
    })
  }

  if (
    matchesAny(text, ["privacy", "confidentialitate", "gdpr"]) &&
    matchesAny(text, ["site", "website", "cookies", "tracking", "formular", "newsletter", "contact"])
  ) {
    evidences.push({
      questionId: "hasSitePrivacyPolicy",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente de privacy legate de site, cookies sau formulare, deci există probabil și versiunea publicată sau pregătită pentru site.",
      source: "document_memory",
    })
  }

  if (matchesAny(text, ["ai policy", "politica ai", "guvernanta ai", "governance ai", "chatgpt", "copilot", "llm"])) {
    evidences.push({
      questionId: "hasAiPolicy",
      sourceKey: `uploaded:${scan.id}`,
      label,
      kind: "uploaded",
      confidence: "medium",
      reason:
        "Am găsit documente sau mențiuni legate de guvernanță AI, deci există probabil o politică sau un draft intern pentru utilizarea AI.",
      source: "document_memory",
    })
  }

  return evidences
}

function buildSuggestion(
  questionId: QuestionId,
  evidences: SignalEvidence[]
): PrefillSuggestion<boolean> {
  const confidence = evidences.some((evidence) => evidence.confidence === "high") ? "high" : "medium"
  const examples = [...new Set(evidences.map((evidence) => evidence.label))].slice(0, 3)
  const baseReason = evidences[0]?.reason ?? "Există documente care susțin acest răspuns."
  const suffix = examples.length > 0 ? ` Exemple: ${examples.join(", ")}.` : ""

  return {
    value: true,
    confidence,
    reason: `${baseReason}${suffix}`,
    source: evidences[0]?.source ?? "document_memory",
  }
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}
