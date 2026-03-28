// S4.2 — AI Act risk classification auto-detect
// Clasificare automată pe baza Annex III + Art. 5 + Art. 50

import type { AISystemPurpose } from "@/lib/compliance/types"

export type AIActRiskLevel =
  | "prohibited"    // Art. 5 — interzis
  | "high_risk"     // Annex III — obligații complete
  | "limited_risk"  // Art. 50 — obligații transparență
  | "minimal_risk"  // fără obligații specifice

export type AIActClassification = {
  riskLevel: AIActRiskLevel
  article: string
  reason: string
  deadline?: string
  requiredActions: string[]
  autoDetected: boolean
  confirmedByHuman: boolean
}

// Clasificare automată pentru tipuri cunoscute (din canon)
const KNOWN_CLASSIFICATIONS: Record<AISystemPurpose, {
  riskLevel: AIActRiskLevel
  article: string
  reason: string
  requiredActions: string[]
}> = {
  "hr-screening": {
    riskLevel: "high_risk",
    article: "Annex III 4(a)",
    reason: "Sistem AI folosit în recrutare/selecție personal — high-risk conform Annex III.",
    requiredActions: [
      "Documentație tehnică (Annex IV)",
      "Evaluare conformitate",
      "Înregistrare EU Database",
      "Human oversight obligatoriu",
    ],
  },
  "credit-scoring": {
    riskLevel: "high_risk",
    article: "Annex III 5(b)",
    reason: "Sistem AI pentru evaluare creditare — high-risk conform Annex III.",
    requiredActions: [
      "Documentație tehnică (Annex IV)",
      "Evaluare conformitate",
      "Înregistrare EU Database",
    ],
  },
  "biometric-identification": {
    riskLevel: "prohibited",
    article: "Art. 5(1)(e)",
    reason: "Identificare biometrică în spații publice — interzis conform Art. 5 AI Act.",
    requiredActions: [
      "Oprire imediată a sistemului",
      "Evaluare dacă se aplică excepție Art. 5(2)",
    ],
  },
  "fraud-detection": {
    riskLevel: "high_risk",
    article: "Annex III 5(b)",
    reason: "Sistem AI pentru detectare fraudă cu impact asupra persoanelor — high-risk.",
    requiredActions: [
      "Documentație tehnică (Annex IV)",
      "Evaluare conformitate",
      "Înregistrare EU Database",
    ],
  },
  "marketing-personalization": {
    riskLevel: "limited_risk",
    article: "Art. 50",
    reason: "Sistem AI pentru personalizare marketing — limited risk, obligații de transparență.",
    requiredActions: [
      "Informare utilizator că interacționează cu AI",
      "Disclosure pe pagina /trust",
    ],
  },
  "support-chatbot": {
    riskLevel: "limited_risk",
    article: "Art. 50",
    reason: "Chatbot AI — obligații de transparență (utilizatorul trebuie informat).",
    requiredActions: [
      "Informare utilizator că interacționează cu AI",
      "Disclosure pe pagina /trust",
    ],
  },
  "document-assistant": {
    riskLevel: "minimal_risk",
    article: "—",
    reason: "Asistent documente fără impact semnificativ — minimal risk, fără obligații specifice.",
    requiredActions: [],
  },
  "other": {
    riskLevel: "limited_risk",
    article: "Art. 50 (implicit)",
    reason: "Tip necunoscut — clasificat implicit ca limited risk. Confirmă manual.",
    requiredActions: [
      "Evaluare manuală a nivelului de risc",
      "Disclosure dacă utilizatorii interacționează cu AI",
    ],
  },
}

export function classifyAISystem(purpose: AISystemPurpose): AIActClassification {
  const known = KNOWN_CLASSIFICATIONS[purpose]
  return {
    riskLevel: known.riskLevel,
    article: known.article,
    reason: known.reason,
    deadline: known.riskLevel === "high_risk" ? "2026-08-02" : undefined,
    requiredActions: known.requiredActions,
    autoDetected: true,
    confirmedByHuman: false,
  }
}

export const RISK_LEVEL_LABELS: Record<AIActRiskLevel, string> = {
  prohibited: "Interzis (Art. 5)",
  high_risk: "High Risk (Annex III)",
  limited_risk: "Limited Risk (Art. 50)",
  minimal_risk: "Minimal Risk",
}

export const RISK_LEVEL_COLORS: Record<AIActRiskLevel, string> = {
  prohibited: "text-eos-error bg-eos-error-soft border-eos-error/30",
  high_risk: "text-eos-warning bg-eos-warning-soft border-eos-warning/30",
  limited_risk: "text-eos-primary bg-eos-primary-soft border-eos-primary/30",
  minimal_risk: "text-eos-success bg-eos-success-soft border-eos-success/30",
}
