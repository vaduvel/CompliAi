// Sprint 11 — Explainability Layer
// Surse legale oficiale și explicații per regulament.
// Funcții pure — fără I/O, safe în browser și pe server.

import type { ApplicabilityTag, ApplicabilityCertainty } from "@/lib/compliance/applicability"
import type { FindingCategory } from "@/lib/compliance/types"

// ── Tipuri ────────────────────────────────────────────────────────────────────

export type LegalSource = {
  citation: string          // ex: "Regulament UE 2016/679"
  shortName: string         // ex: "GDPR"
  articleHint?: string      // ex: "Art. 5, Art. 13-14"
  officialUrl?: string      // URL la text oficial EUR-Lex / legislație.ro
  applicabilityNote?: string // ex: "Aplicabil complet din mai 2018"
}

// Sprint 6.2: Helper pentru statut juridic per cerință/obligație
export type LegalStatus = "active_ro" | "active_eu" | "proposed_eu" | "draft_dnsc"

export type LegalBasis = {
  status: LegalStatus
  reference: string        // ex: "OUG 155/2024 Art.23"
  description: string      // ex: "Alertă inițială 24h la DNSC"
  lastVerified: string     // ISO date — când a fost verificat textul legal
  note?: string            // ex: "Propunere amânare — neconfirmat"
}

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  active_ro:   "✅ Activ — legislație română",
  active_eu:   "✅ Activ — regulament UE",
  proposed_eu: "⚠️ Propunere UE — neconfirmat",
  draft_dnsc:  "📝 Draft DNSC — consultare",
}

export const LEGAL_STATUS_SHORT: Record<LegalStatus, string> = {
  active_ro:   "✅ Activ",
  active_eu:   "✅ Activ",
  proposed_eu: "⚠️ Propunere",
  draft_dnsc:  "📝 Draft",
}

// Statut juridic per framework — pentru afișare în framework cards
export const FRAMEWORK_LEGAL_STATUS: Record<string, { status: LegalStatus; note: string }> = {
  gdpr: {
    status: "active_eu",
    note: "Regulament UE 2016/679 — activ din 25 mai 2018",
  },
  nis2: {
    status: "active_ro",
    note: "OUG 155/2024, aprobat prin Legea 124/2025 — activ",
  },
  "ai-act": {
    status: "proposed_eu",
    note: "Art.5 interdicții: ✅ activ aug 2025 · High-risk Annex III: ⚠️ propunere amânare dec 2027 (Digital Omnibus, neconfirmat)",
  },
  efactura: {
    status: "active_ro",
    note: "OUG 89/2025 — obligatoriu B2B de la 1 ian 2025",
  },
  cer: {
    status: "active_eu",
    note: "Directiva (EU) 2022/2557 — transpunere națională în curs",
  },
  saft: {
    status: "active_ro",
    note: "D406 SAF-T — obligatoriu din 2025 inclusiv pentru contribuabili mici (comunicare ANAF 2024-2025)",
  },
}

export type SuggestionExplanation = {
  legalSource: LegalSource
  reasoning: string         // DE CE se aplică / DE CE a fost sugerat
  certaintyLabel: string    // "Cert" | "Probabil" | "Puțin probabil"
  certaintyColor: "green" | "yellow" | "gray"
}

// ── Surse legale per modul ────────────────────────────────────────────────────

const LEGAL_SOURCES: Record<ApplicabilityTag, LegalSource> = {
  gdpr: {
    citation: "Regulament UE 2016/679",
    shortName: "GDPR",
    articleHint: "Art. 5, Art. 13-14, Art. 28",
    applicabilityNote: "Aplicabil complet din 25 mai 2018",
  },
  nis2: {
    citation: "OUG 155/2024, Legea 124/2025",
    shortName: "NIS2",
    articleHint: "Art. 21, Art. 23",
    applicabilityNote: "Transpunere NIS2 în România — DNSC autoritate competentă",
  },
  "ai-act": {
    citation: "Regulament UE 2024/1689",
    shortName: "AI Act",
    articleHint: "Art. 6, Art. 13, Anexa III",
    applicabilityNote: "Aplicare completă august 2026; interdicții din 2 august 2025",
  },
  efactura: {
    citation: "OUG 89/2025, OUG 120/2021",
    shortName: "e-Factura",
    articleHint: "Art. 10-12",
    applicabilityNote: "Obligatoriu pentru tranzacții B2B plătitoare de TVA",
  },
  cer: {
    citation: "Directiva (EU) 2022/2557",
    shortName: "CER",
    articleHint: "Art. 13",
    applicabilityNote: "Reziliența entităților critice — obligații fizice în paralel cu NIS2",
  },
  saft: {
    citation: "Ordinul MFP 1783/2021, Comunicare ANAF 2024",
    shortName: "SAF-T (D406)",
    articleHint: "Art. 5-7",
    applicabilityNote: "Declarația D406 SAF-T — obligatorie pentru contribuabili, inclusiv mici, din 2025",
  },
}

// Surse per FindingCategory (pentru findings NIS2/GDPR în scan results)
const FINDING_CATEGORY_SOURCES: Record<FindingCategory, LegalSource> = {
  GDPR: LEGAL_SOURCES.gdpr,
  NIS2: LEGAL_SOURCES.nis2,
  EU_AI_ACT: LEGAL_SOURCES["ai-act"],
  E_FACTURA: LEGAL_SOURCES.efactura,
}

const CERTAINTY_META: Record<
  ApplicabilityCertainty,
  { label: string; color: "green" | "yellow" | "gray" }
> = {
  certain:  { label: "Cert aplicabil",         color: "green"  },
  probable: { label: "Probabil aplicabil",      color: "yellow" },
  unlikely: { label: "Puțin probabil aplicabil", color: "gray"  },
}

// ── Factory functions ─────────────────────────────────────────────────────────

/**
 * Returnează sursa legală pentru un tag de aplicabilitate.
 */
export function getLegalSource(tag: ApplicabilityTag): LegalSource {
  return LEGAL_SOURCES[tag]
}

/**
 * Returnează sursa legală pentru o categorie de finding.
 */
export function getLegalSourceForFinding(category: FindingCategory): LegalSource {
  return FINDING_CATEGORY_SOURCES[category]
}

/**
 * Construiește explicația completă pentru o sugestie de aplicabilitate.
 * Folosit în tooltip-urile din dashboard și cards.
 */
export function getSuggestionExplanation(
  tag: ApplicabilityTag,
  reason: string,
  certainty: ApplicabilityCertainty
): SuggestionExplanation {
  const legalSource = LEGAL_SOURCES[tag]
  const meta = CERTAINTY_META[certainty]
  return {
    legalSource,
    reasoning: reason,
    certaintyLabel: meta.label,
    certaintyColor: meta.color,
  }
}

/**
 * Returnează toate sursele legale active (certain + probable).
 */
export function getActiveLegalSources(tags: ApplicabilityTag[]): LegalSource[] {
  return tags.map((tag) => LEGAL_SOURCES[tag]).filter(Boolean)
}
