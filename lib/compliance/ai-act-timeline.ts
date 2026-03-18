// AI Act Timeline — Sprint 8
// Mapeaza obligatii per categorie de risc cu statut juridic clar.
// Bazat pe Regulament (EU) 2024/1689 + Digital Omnibus on AI (propunere nov 2025).

import type { AISystemRiskLevel } from "@/lib/compliance/types"

export type TimelineObligationStatus = "active" | "proposed_delay" | "unknown"

export type TimelineObligation = {
  description: string
  deadline: string          // ex: "august 2026"
  deadlineStatus: TimelineObligationStatus
  legalBasis: string        // ex: "AI Act Art.5"
  note?: string             // ex: "Propunere amânare — neconfirmat"
}

export type AISystemTimeline = {
  riskLevel: AISystemRiskLevel
  riskLabel: string
  obligations: TimelineObligation[]
  sourceNote: string
}

// Configurație timeline per nivel de risc — actualizată: 2026-03-17
const TIMELINES: Record<AISystemRiskLevel, AISystemTimeline> = {
  high: {
    riskLevel: "high",
    riskLabel: "Risc ridicat",
    obligations: [
      {
        description: "Practici AI interzise (Art.5) — verifică dacă sistemul tău se încadrează",
        deadline: "2 august 2025",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.5",
      },
      {
        description: "Alfabetizare AI (Art.4) — training obligatoriu pentru utilizatorii sistemelor AI",
        deadline: "2 august 2025",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.4",
        note: "Digital Omnibus propune mutarea obligației pe statele membre ⚠️ (propunere, neconfirmat)",
      },
      {
        description: "Obligații sisteme high-risk Anexa III — conformitate completă, documentație, auditabilitate",
        deadline: "2 august 2026 (oficial) / decembrie 2027 (propunere amânare)",
        deadlineStatus: "proposed_delay",
        legalBasis: "AI Act Art.6-49, Anexa III",
        note: "⚠️ Propunere amânare la dec 2027 (Digital Omnibus, Consiliul UE 16 mar 2026) — neconfirmat, nu e lege finală",
      },
      {
        description: "Înregistrare în baza de date UE pentru sisteme high-risk (Art.71)",
        deadline: "2 august 2026",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.71",
      },
    ],
    sourceNote: "Regulament (EU) 2024/1689 + Digital Omnibus on AI (propunere nov 2025, discutat în trilogue)",
  },
  limited: {
    riskLevel: "limited",
    riskLabel: "Risc limitat",
    obligations: [
      {
        description: "Practici AI interzise (Art.5) — verifică dacă sistemul tău se încadrează",
        deadline: "2 august 2025",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.5",
      },
      {
        description: "Transparență față de utilizatori (Art.50) — obligativitatea informării că interacționează cu AI",
        deadline: "2 august 2026",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.50",
      },
    ],
    sourceNote: "Regulament (EU) 2024/1689",
  },
  minimal: {
    riskLevel: "minimal",
    riskLabel: "Risc minim",
    obligations: [
      {
        description: "Practici AI interzise (Art.5) — verifică dacă sistemul tău se încadrează",
        deadline: "2 august 2025",
        deadlineStatus: "active",
        legalBasis: "AI Act Art.5",
      },
      {
        description: "Coduri de conduită voluntare (Art.95) — nu obligatoriu, recomandat",
        deadline: "–",
        deadlineStatus: "unknown",
        legalBasis: "AI Act Art.95",
      },
    ],
    sourceNote: "Regulament (EU) 2024/1689",
  },
}

export function getSystemTimeline(riskLevel: AISystemRiskLevel): AISystemTimeline {
  return TIMELINES[riskLevel]
}

export const STATUS_ICONS: Record<TimelineObligationStatus, string> = {
  active: "✅",
  proposed_delay: "⚠️",
  unknown: "📝",
}

export const STATUS_LABELS: Record<TimelineObligationStatus, string> = {
  active: "ACTIV",
  proposed_delay: "PROPUNERE AMÂNARE",
  unknown: "NECUNOSCUT",
}
