import type {
  AISystemPurpose,
  DetectedAISystemRecord,
  AISystemRecord,
  AISystemRiskLevel,
} from "@/lib/compliance/types"

export type AISystemDraft = {
  name: string
  purpose: AISystemPurpose
  vendor: string
  modelType: string
  usesPersonalData: boolean
  makesAutomatedDecisions: boolean
  impactsRights: boolean
  hasHumanReview: boolean
}

export type DetectedAISystemDraft = AISystemDraft & {
  discoveryMethod: "auto" | "hybrid"
  detectionStatus?: "detected" | "reviewed" | "confirmed" | "rejected"
  confidence: "low" | "medium" | "high"
  frameworks: string[]
  evidence: string[]
  sourceScanId?: string
  sourceDocument?: string
}

export function classifyAISystem(input: AISystemDraft): {
  riskLevel: AISystemRiskLevel
  annexIIIHint?: string
  recommendedActions: string[]
} {
  const highRiskPurposeMap: Partial<Record<AISystemPurpose, string>> = {
    "hr-screening": "Annex III, punctul 4 - ocuparea fortei de munca si selectie",
    "credit-scoring": "Annex III, punctul 5 - acces la servicii esentiale / scoring",
    "biometric-identification":
      "Annex III, punctul 1 - identificare biometrica si categorii sensibile",
  }

  const highRiskPurpose = highRiskPurposeMap[input.purpose]
  const isHighRisk =
    Boolean(highRiskPurpose) ||
    (input.impactsRights && input.makesAutomatedDecisions) ||
    (input.usesPersonalData && input.impactsRights && !input.hasHumanReview)

  if (isHighRisk) {
    return {
      riskLevel: "high",
      annexIIIHint: highRiskPurpose,
      recommendedActions: [
        "Documenteaza scopul, datele de intrare si decizia finala produsa de sistem.",
        "Adauga override uman explicit si jurnal pentru exceptii.",
        "Pregateste evaluare de impact, controlul calitatii datelor si monitorizare continua.",
      ],
    }
  }

  const isLimited =
    input.makesAutomatedDecisions || input.usesPersonalData || input.purpose === "support-chatbot"

  if (isLimited) {
    return {
      riskLevel: "limited",
      recommendedActions: [
        "Clarifica transparenta pentru utilizator si cand interactioneaza cu AI.",
        "Defineste reguli de revizie umana pentru cazurile sensibile.",
        "Pastreaza evidenta datelor folosite si a scopului operational.",
      ],
    }
  }

  return {
    riskLevel: "minimal",
    recommendedActions: [
      "Pastreaza inventarul actualizat si revizuieste riscul cand se schimba scopul.",
      "Noteaza furnizorul, datele folosite si owner-ul intern al sistemului.",
    ],
  }
}

export function buildAISystemRecord(input: AISystemDraft, nowISO: string): AISystemRecord {
  const classification = classifyAISystem(input)

  return {
    id: `ai-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim(),
    purpose: input.purpose,
    vendor: input.vendor.trim(),
    modelType: input.modelType.trim(),
    usesPersonalData: input.usesPersonalData,
    makesAutomatedDecisions: input.makesAutomatedDecisions,
    impactsRights: input.impactsRights,
    hasHumanReview: input.hasHumanReview,
    riskLevel: classification.riskLevel,
    annexIIIHint: classification.annexIIIHint,
    recommendedActions: classification.recommendedActions,
    createdAtISO: nowISO,
  }
}

export function buildDetectedAISystemRecord(
  input: DetectedAISystemDraft,
  nowISO: string
): DetectedAISystemRecord {
  const classification = classifyAISystem(input)

  return {
    id: `det-ai-${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim(),
    purpose: input.purpose,
    vendor: input.vendor.trim(),
    modelType: input.modelType.trim(),
    usesPersonalData: input.usesPersonalData,
    makesAutomatedDecisions: input.makesAutomatedDecisions,
    impactsRights: input.impactsRights,
    hasHumanReview: input.hasHumanReview,
    riskLevel: classification.riskLevel,
    annexIIIHint: classification.annexIIIHint,
    recommendedActions: classification.recommendedActions,
    createdAtISO: nowISO,
    sourceScanId: input.sourceScanId,
    sourceDocument: input.sourceDocument,
    discoveryMethod: input.discoveryMethod,
    detectionStatus: input.detectionStatus ?? "detected",
    confidence: input.confidence,
    frameworks: [...new Set(input.frameworks.filter(Boolean))],
    evidence: [...new Set(input.evidence.filter(Boolean))],
    detectedAtISO: nowISO,
  }
}

export function formatPurposeLabel(value: AISystemPurpose) {
  switch (value) {
    case "hr-screening":
      return "HR / screening CV"
    case "credit-scoring":
      return "Credit scoring / eligibilitate"
    case "biometric-identification":
      return "Identificare biometrica"
    case "fraud-detection":
      return "Fraud detection"
    case "marketing-personalization":
      return "Personalizare marketing"
    case "support-chatbot":
      return "Chatbot / suport"
    case "document-assistant":
      return "Asistent documente"
    default:
      return "Alt scop"
  }
}
