// Intake Engine — Questionnaire Automation Blueprint → Cod
// Transformă intake-ul din formular lung în confirmare asistată.
//
// Model: prefill → 7 întrebări decisive → condiționare → findings + doc requests + next action
// Funcție pură, fără I/O, safe în browser și pe server.

import type { OrgProfile } from "@/lib/compliance/applicability"
import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import type { ScanFinding, FindingCategory } from "@/lib/compliance/types"

// ── Answer types ─────────────────────────────────────────────────────────────

export type IntakeAnswer = "yes" | "no" | "probably" | "unknown" | "partial" | "collaborators" | "mixed"

export type IntakeAnswers = {
  sellsToConsumers?: IntakeAnswer        // Q1: B2C
  hasEmployees?: IntakeAnswer            // Q2: angajați
  processesPersonalData?: IntakeAnswer   // Q3: date personale
  usesAITools?: IntakeAnswer             // Q4: AI tools (poate fi pre-populat)
  usesExternalVendors?: IntakeAnswer     // Q5: furnizori externi / cloud / SaaS
  hasSiteWithForms?: IntakeAnswer        // Q6: site cu formulare / cookies / newsletter
  hasStandardContracts?: IntakeAnswer    // Q7: contracte standard
}

export type ConditionalAnswers = {
  // Q2=yes/mixed → HR
  hasJobDescriptions?: IntakeAnswer
  hasEmployeeRegistry?: IntakeAnswer
  hasInternalProcedures?: IntakeAnswer
  // Q3=yes/probably → GDPR
  hasPrivacyPolicy?: IntakeAnswer
  hasDsarProcess?: IntakeAnswer
  hasVendorDpas?: IntakeAnswer
  // Q4=yes/probably → AI
  aiToolsUsed?: string
  aiUsesConfidentialData?: IntakeAnswer
  hasAiPolicy?: IntakeAnswer
  // Q5=yes/probably → Vendors
  vendorsUsed?: string
  hasVendorDocumentation?: IntakeAnswer
  vendorsSendPersonalData?: IntakeAnswer
  // Q6=yes/probably → Site
  hasSitePrivacyPolicy?: IntakeAnswer
  hasCookiesConsent?: IntakeAnswer
  collectsLeads?: IntakeAnswer
}

export type FullIntakeAnswers = IntakeAnswers & ConditionalAnswers

// ── Question definitions ─────────────────────────────────────────────────────

export type IntakeQuestionId = keyof IntakeAnswers
export type ConditionalQuestionId = keyof ConditionalAnswers

export type IntakeOption = {
  value: IntakeAnswer
  label: string
}

export type IntakeQuestion = {
  id: IntakeQuestionId | ConditionalQuestionId
  text: string
  suggestedText?: string // microcopy when we have a suggestion
  options: IntakeOption[]
  conditional?: boolean
  showWhen?: (answers: FullIntakeAnswers) => boolean
}

export type SuggestedAnswer = {
  questionId: string
  value: IntakeAnswer
  confidence: "high" | "medium" | "low"
  reason: string
}

export type DocumentRequest = {
  id: string
  label: string
  priority: "required" | "recommended" | "optional"
  category: string
}

export type NextBestAction = {
  label: string
  href: string
  estimatedMinutes: number
}

// ── Decisive questions (max 7) ──────────────────────────────────────────────

export const DECISIVE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "sellsToConsumers",
    text: "Vindeți și către persoane fizice?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu / mixt" },
    ],
  },
  {
    id: "hasEmployees",
    text: "Aveți angajați?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "collaborators", label: "Doar colaboratori" },
      { value: "mixed", label: "Mixt" },
    ],
  },
  {
    id: "processesPersonalData",
    text: "Prelucrați date personale?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil da" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "usesAITools",
    text: "Folosiți tool-uri AI în firmă?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil da" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "usesExternalVendors",
    text: "Lucrați cu furnizori externi / cloud / SaaS?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil da" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasSiteWithForms",
    text: "Aveți site cu formulare, cookies sau newsletter?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil da" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasStandardContracts",
    text: "Aveți contracte standard cu clienți sau furnizori?",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
]

// ── Conditional questions ───────────────────────────────────────────────────

const isPositive = (a?: IntakeAnswer) => a === "yes" || a === "probably" || a === "mixed"

export const CONDITIONAL_QUESTIONS: IntakeQuestion[] = [
  // HR (Q2 = yes/mixed)
  {
    id: "hasJobDescriptions",
    text: "Există fișe de post / documente HR standard?",
    conditional: true,
    showWhen: (a) => a.hasEmployees === "yes" || a.hasEmployees === "mixed",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
    ],
  },
  {
    id: "hasEmployeeRegistry",
    text: "Există REGES / evidență contracte la zi?",
    conditional: true,
    showWhen: (a) => a.hasEmployees === "yes" || a.hasEmployees === "mixed",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasInternalProcedures",
    text: "Există proceduri interne pentru angajați?",
    conditional: true,
    showWhen: (a) => a.hasEmployees === "yes" || a.hasEmployees === "mixed",
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
    ],
  },
  // GDPR (Q3 = yes/probably)
  {
    id: "hasPrivacyPolicy",
    text: "Aveți politică de confidențialitate?",
    conditional: true,
    showWhen: (a) => isPositive(a.processesPersonalData),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasDsarProcess",
    text: "Aveți proces de răspuns la cereri de date (DSAR)?",
    conditional: true,
    showWhen: (a) => isPositive(a.processesPersonalData),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasVendorDpas",
    text: "Există DPA-uri pentru vendorii care procesează date?",
    conditional: true,
    showWhen: (a) => isPositive(a.processesPersonalData) && isPositive(a.usesExternalVendors),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  // AI (Q4 = yes/probably)
  {
    id: "aiUsesConfidentialData",
    text: "Se introduc date confidențiale sau personale în AI?",
    conditional: true,
    showWhen: (a) => isPositive(a.usesAITools),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasAiPolicy",
    text: "Există o politică internă de utilizare AI?",
    conditional: true,
    showWhen: (a) => isPositive(a.usesAITools),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
    ],
  },
  // Vendors (Q5 = yes/probably)
  {
    id: "hasVendorDocumentation",
    text: "Există DPA / termeni / documentație pentru furnizorii externi?",
    conditional: true,
    showWhen: (a) => isPositive(a.usesExternalVendors),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "vendorsSendPersonalData",
    text: "Se trimit date personale sau confidențiale către furnizori?",
    conditional: true,
    showWhen: (a) => isPositive(a.usesExternalVendors),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "probably", label: "Probabil" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  // Site (Q6 = yes/probably)
  {
    id: "hasSitePrivacyPolicy",
    text: "Aveți privacy policy publicată pe site?",
    conditional: true,
    showWhen: (a) => isPositive(a.hasSiteWithForms),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "hasCookiesConsent",
    text: "Aveți cookies policy / consent banner?",
    conditional: true,
    showWhen: (a) => isPositive(a.hasSiteWithForms),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "unknown", label: "Nu știu" },
    ],
  },
  {
    id: "collectsLeads",
    text: "Colectați lead-uri sau cereri prin formulare?",
    conditional: true,
    showWhen: (a) => isPositive(a.hasSiteWithForms),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
    ],
  },
]

// ── Suppression + Suggested Answers ─────────────────────────────────────────

/**
 * Derive suggested answers from an existing OrgProfile.
 * If confidence is "high", the question can be suppressed (auto-filled).
 */
export function deriveSuggestedAnswers(profile: OrgProfile, prefill?: OrgProfilePrefill | null): SuggestedAnswer[] {
  const suggestions: SuggestedAnswer[] = []

  // Q4 — AI tools: already answered in profile
  suggestions.push({
    questionId: "usesAITools",
    value: profile.usesAITools ? "yes" : "no",
    confidence: "high",
    reason: profile.usesAITools
      ? "Ai confirmat deja că folosești unelte AI."
      : "Ai indicat că nu folosești unelte AI.",
  })

  // Q3 — Personal data: prefer direct signals from onboarding prefill
  if (prefill?.suggestions.processesPersonalData) {
    suggestions.push({
      questionId: "processesPersonalData",
      value: prefill.suggestions.processesPersonalData.value ? "yes" : "no",
      confidence: prefill.suggestions.processesPersonalData.confidence,
      reason: prefill.suggestions.processesPersonalData.reason,
    })
  } else {
    const likelyProcessesData =
      profile.sector === "health" ||
      profile.sector === "banking" ||
      profile.sector === "retail" ||
      profile.employeeCount !== "1-9"
    if (likelyProcessesData) {
      suggestions.push({
        questionId: "processesPersonalData",
        value: "probably",
        confidence: "medium",
        reason: `Cel mai probabil da — ${
          profile.sector === "health"
            ? "sectorul sănătății implică date sensibile"
            : profile.sector === "banking"
              ? "serviciile financiare procesează date clienți"
              : profile.sector === "retail"
                ? "retail-ul implică date clienți/comenzi"
                : "ai angajați, deci procesezi date HR"
        }.`,
      })
    }
  }

  // Q5 — Vendors: prefer direct signals from e-Factura, fallback to e-Factura obligation heuristic
  if (prefill?.suggestions.usesExternalVendors) {
    suggestions.push({
      questionId: "usesExternalVendors",
      value: prefill.suggestions.usesExternalVendors.value ? "yes" : "no",
      confidence: prefill.suggestions.usesExternalVendors.confidence,
      reason: prefill.suggestions.usesExternalVendors.reason,
    })
  } else if (profile.requiresEfactura) {
    suggestions.push({
      questionId: "usesExternalVendors",
      value: "probably",
      confidence: "medium",
      reason: "Facturezi B2B prin e-Factura, deci cel mai probabil ai furnizori externi.",
    })
  }

  // Q1 — B2C: inferred from sector
  if (profile.sector === "retail") {
    suggestions.push({
      questionId: "sellsToConsumers",
      value: "yes",
      confidence: "medium",
      reason: "Sectorul retail implică de regulă vânzări către persoane fizice.",
    })
  }

  return suggestions
}

/**
 * Get visible conditional questions based on current answers.
 */
export function getVisibleConditionalQuestions(answers: FullIntakeAnswers): IntakeQuestion[] {
  return CONDITIONAL_QUESTIONS.filter((q) => q.showWhen?.(answers))
}

// ── Findings generation (Section 10 mapping) ────────────────────────────────

function makeFinding(
  id: string,
  title: string,
  detail: string,
  category: FindingCategory,
  severity: "critical" | "high" | "medium" | "low",
  opts?: {
    remediationHint?: string
    resolution?: ScanFinding["resolution"]
  }
): ScanFinding {
  return {
    id: `intake-${id}`,
    title,
    detail,
    category,
    severity,
    risk: severity === "critical" || severity === "high" ? "high" : "low",
    principles: [],
    createdAtISO: new Date().toISOString(),
    sourceDocument: "intake-questionnaire",
    remediationHint: opts?.remediationHint,
    resolution: opts?.resolution,
  }
}

/**
 * Generate initial findings from intake answers.
 * Maps directly from blueprint section 10.
 */
export function buildInitialFindings(answers: FullIntakeAnswers): ScanFinding[] {
  const findings: ScanFinding[] = []

  // ── B2C = Da → privacy / consumer-facing docs
  if (answers.sellsToConsumers === "yes" || answers.sellsToConsumers === "unknown") {
    findings.push(
      makeFinding(
        "b2c-privacy",
        "Obligații privacy pentru clienți persoane fizice",
        "Vânzarea către consumatori implică colectare de date personale (comenzi, livrare, facturare). Trebuie asigurate: informare GDPR, bază legală, drepturi DSAR.",
        "GDPR",
        "medium",
        {
          remediationHint: "Generează o politică de confidențialitate adaptată B2C.",
          resolution: {
            problem: "Activitate B2C fără politică de confidențialitate dedicată consumatorilor.",
            impact: "Risc de amendă GDPR și pierderea încrederii clienților.",
            action: "Generează politica de confidențialitate B2C din CompliAI.",
            humanStep: "Verifică dacă politica acoperă toate fluxurile de date (comenzi, cont, marketing).",
            closureEvidence: "Politica publicată pe site + dovada implementării.",
          },
        }
      )
    )
  }

  // ── Angajați = Da → HR / REGES / internal docs
  if (answers.hasEmployees === "yes" || answers.hasEmployees === "mixed") {
    if (answers.hasJobDescriptions !== "yes") {
      findings.push(
        makeFinding(
          "hr-job-descriptions",
          "Fișe de post lipsă sau incomplete",
          "Angajații necesită fișe de post actualizate conform Codului Muncii. Lipsa lor creează risc la ITM.",
          "GDPR",
          "medium",
          {
            remediationHint: "Pregătește fișe de post standard pentru fiecare rol.",
            resolution: {
              problem: "Fișe de post lipsă sau neactualizate.",
              impact: "Risc de sancțiune la control ITM.",
              action: "Generează template fișe de post din CompliAI.",
              humanStep: "Adaptează fișele la rolurile reale din firmă.",
              closureEvidence: "Fișele semnate și arhivate.",
            },
          }
        )
      )
    }
    if (answers.hasEmployeeRegistry !== "yes") {
      findings.push(
        makeFinding(
          "hr-registry",
          "REGES / evidență contracte angajați",
          "Evidența contractelor de muncă trebuie menținută la zi în REGES (Revisal). Lipsa sau întârzierile atrag sancțiuni.",
          "GDPR",
          "high",
          {
            remediationHint: "Verifică înregistrările în REGES și completează lipsurile.",
            resolution: {
              problem: "REGES / evidență contracte neactualizată.",
              impact: "Sancțiuni de la ITM pentru neconformitate.",
              action: "Verifică REGES și completează înregistrările lipsă.",
              humanStep: "Contabilul sau HR-ul confirmă că Revisal e la zi.",
              closureEvidence: "Export REGES actualizat.",
            },
          }
        )
      )
    }
    if (answers.hasInternalProcedures !== "yes") {
      findings.push(
        makeFinding(
          "hr-procedures",
          "Proceduri interne angajați lipsă",
          "Regulamentul intern și procedurile disciplinare sunt obligatorii conform Codului Muncii pentru firme cu angajați.",
          "GDPR",
          "medium",
          {
            remediationHint: "Generează regulament intern din CompliAI.",
            resolution: {
              problem: "Lipsa regulamentului intern / procedurilor pentru angajați.",
              impact: "Neconformitate cu Codul Muncii.",
              action: "Generează regulament intern standard.",
              humanStep: "Adaptează la specificul firmei și obține semnăturile.",
              closureEvidence: "Regulament semnat și comunicat angajaților.",
            },
          }
        )
      )
    }
  }

  // ── Date personale = Da/Probabil → privacy + DPA + DSAR
  if (isPositive(answers.processesPersonalData)) {
    if (answers.hasPrivacyPolicy !== "yes") {
      findings.push(
        makeFinding(
          "gdpr-privacy-policy",
          "Politică de confidențialitate GDPR lipsă",
          "Prelucrarea datelor personale necesită o politică de confidențialitate conformă GDPR Art.13-14.",
          "GDPR",
          "high",
          {
            remediationHint: "Generează politica GDPR din CompliAI.",
            resolution: {
              problem: "Lipsește politica de confidențialitate.",
              impact: "Încălcarea obligației de informare GDPR — risc de amendă.",
              action: "Generează politica de confidențialitate din CompliAI.",
              humanStep: "Verifică dacă acoperă toate categoriile de date procesate.",
              closureEvidence: "Politica publicată și accesibilă persoanelor vizate.",
            },
          }
        )
      )
    }
    if (answers.hasDsarProcess !== "yes") {
      findings.push(
        makeFinding(
          "gdpr-dsar",
          "Proces DSAR (cereri de date) lipsă",
          "GDPR Art.15-22 obligă la răspuns în 30 de zile la cererile persoanelor vizate. Fără un proces definit, riști neconformitate.",
          "GDPR",
          "medium",
          {
            remediationHint: "Definește procedura de răspuns la cereri DSAR.",
            resolution: {
              problem: "Nu există proces definit pentru cereri DSAR.",
              impact: "Risc de depășire termen 30 zile și plângeri la ANSPDCP.",
              action: "Creează procedura DSAR din template CompliAI.",
              humanStep: "Desemnează persoana responsabilă de cererile DSAR.",
              closureEvidence: "Procedura documentată + persoana desemnată.",
            },
          }
        )
      )
    }
  }

  // ── AI = Da/Probabil → inventar + politică + vendor review
  if (isPositive(answers.usesAITools)) {
    if (answers.hasAiPolicy !== "yes") {
      findings.push(
        makeFinding(
          "ai-missing-policy",
          "Politică de utilizare AI lipsă",
          "AI Act Art.4 impune alfabetizare AI. Fără politică internă, angajații folosesc AI fără reguli — risc de scurgere date.",
          "EU_AI_ACT",
          "high",
          {
            remediationHint: "Generează politica de utilizare AI din CompliAI.",
            resolution: {
              problem: "Lipsește politica internă de utilizare AI.",
              impact: "Neconformitate AI Act Art.4 + risc de scurgere date confidențiale.",
              action: "Generează politica AI din CompliAI.",
              humanStep: "Adaptează la tool-urile AI folosite efectiv.",
              closureEvidence: "Politica publicată și comunicată angajaților.",
            },
          }
        )
      )
    }
    if (isPositive(answers.aiUsesConfidentialData)) {
      findings.push(
        makeFinding(
          "ai-confidential-data",
          "Date confidențiale introduse în AI fără protecție",
          "Introducerea de date personale sau confidențiale în tool-uri AI externe (ChatGPT, Copilot) fără DPA sau politică creează risc GDPR și de proprietate intelectuală.",
          "EU_AI_ACT",
          "high",
          {
            remediationHint: "Limitează datele introduse în AI și activează protecțiile disponibile.",
            resolution: {
              problem: "Date confidențiale/personale trimise către AI extern fără protecție.",
              impact: "Risc GDPR (transfer date) + risc proprietate intelectuală.",
              action: "Implementează reguli de utilizare AI cu restricții pe date sensibile.",
              humanStep: "Verifică ce date sunt efectiv introduse și restricționează.",
              closureEvidence: "Politica actualizată + training angajați.",
            },
          }
        )
      )
    }
  }

  // ── Vendor extern = Da/Probabil → vendor review + DPA + transfer
  if (isPositive(answers.usesExternalVendors)) {
    if (answers.hasVendorDocumentation !== "yes") {
      findings.push(
        makeFinding(
          "vendor-missing-docs",
          "Furnizori externi fără documentație",
          "Utilizarea furnizorilor SaaS/cloud fără DPA, termeni sau evaluare de risc creează expunere GDPR și NIS2.",
          "GDPR",
          "high",
          {
            remediationHint: "Începe un vendor review în CompliAI pentru fiecare furnizor.",
            resolution: {
              problem: "Furnizori externi activi fără DPA sau documentație.",
              impact: "Expunere la transfer date fără temei legal — risc amendă GDPR.",
              action: "Pornește vendor review pentru furnizorii principali.",
              humanStep: "Solicită DPA-urile de la furnizori și verifică conformitatea.",
              closureEvidence: "DPA-uri semnate pentru toți furnizorii care procesează date.",
            },
          }
        )
      )
    }
    if (isPositive(answers.vendorsSendPersonalData) && answers.hasVendorDpas !== "yes") {
      findings.push(
        makeFinding(
          "vendor-no-dpa",
          "DPA lipsă pentru furnizori care procesează date personale",
          "GDPR Art.28 obligă la DPA (Data Processing Agreement) pentru orice furnizor care procesează date personale în numele tău.",
          "GDPR",
          "high",
          {
            remediationHint: "Pregătește și trimite DPA-uri către furnizorii care procesează date.",
            resolution: {
              problem: "Furnizori procesează date personale fără DPA.",
              impact: "Încălcarea directă a GDPR Art.28.",
              action: "Generează DPA standard și trimite-l furnizorilor.",
              humanStep: "Obține semnăturile furnizorilor pe DPA.",
              closureEvidence: "DPA-uri semnate bilateral.",
            },
          }
        )
      )
    }
  }

  // ── Site cu formulare = Da/Probabil → privacy / cookies / forms
  if (isPositive(answers.hasSiteWithForms)) {
    if (answers.hasSitePrivacyPolicy !== "yes") {
      findings.push(
        makeFinding(
          "site-privacy-policy",
          "Privacy policy lipsă de pe site",
          "Orice site care colectează date (formulare, cookies, analytics) trebuie să afișeze o politică de confidențialitate conform GDPR.",
          "GDPR",
          "high",
          {
            remediationHint: "Publică o privacy policy pe site.",
            resolution: {
              problem: "Site-ul nu are privacy policy publicată.",
              impact: "Colectare date fără informare — risc amendă GDPR.",
              action: "Generează privacy policy din CompliAI și publică pe site.",
              humanStep: "Verifică să acopere: analytics, formulare, cookies, newsletter.",
              closureEvidence: "Privacy policy live pe site + link accesibil.",
            },
          }
        )
      )
    }
    if (answers.hasCookiesConsent !== "yes") {
      findings.push(
        makeFinding(
          "site-cookies",
          "Cookies consent / policy lipsă",
          "Directiva ePrivacy și GDPR cer consimțământ explicit pentru cookies non-esențiale. Lipsa unui banner de consent e neconformitate.",
          "GDPR",
          "medium",
          {
            remediationHint: "Implementează un cookies consent banner și publică o cookies policy.",
            resolution: {
              problem: "Site-ul nu are consent banner pentru cookies.",
              impact: "Neconformitate ePrivacy + GDPR.",
              action: "Implementează cookies consent banner.",
              humanStep: "Verifică ce cookies sunt active și categorisește-le.",
              closureEvidence: "Banner live + cookies policy publicată.",
            },
          }
        )
      )
    }
  }

  // ── Contracte standard = Nu/Parțial → finding pe baseline contractual
  if (answers.hasStandardContracts === "no" || answers.hasStandardContracts === "partial") {
    findings.push(
      makeFinding(
        "contracts-baseline",
        "Contracte standard lipsă sau incomplete",
        "Lipsa contractelor standard cu clienții și furnizorii creează expunere juridică și face auditul dificil.",
        "GDPR",
        "medium",
        {
          remediationHint: "Pregătește template-uri de contracte standard.",
          resolution: {
            problem: "Contracte standard lipsă sau incomplete.",
            impact: "Expunere juridică în relații comerciale + audit dificil.",
            action: "Generează template-uri contracte din CompliAI.",
            humanStep: "Adaptează la specificul activității și verifică cu un jurist.",
            closureEvidence: "Template-uri contracte finalizate și în uz.",
          },
        }
      )
    )
  }

  return findings
}

// ── Document request list ───────────────────────────────────────────────────

export function buildDocumentRequests(answers: FullIntakeAnswers): DocumentRequest[] {
  const docs: DocumentRequest[] = []

  if (isPositive(answers.processesPersonalData) || isPositive(answers.sellsToConsumers)) {
    docs.push({ id: "privacy-policy", label: "Politică de confidențialitate", priority: "required", category: "GDPR" })
  }

  if (isPositive(answers.hasSiteWithForms)) {
    docs.push({ id: "cookies-policy", label: "Cookies policy", priority: "required", category: "GDPR" })
  }

  if (isPositive(answers.usesExternalVendors)) {
    docs.push({ id: "dpa-template", label: "DPA (Data Processing Agreement)", priority: "required", category: "GDPR" })
  }

  if (answers.hasStandardContracts !== "yes") {
    docs.push({ id: "contracts-template", label: "Contracte standard", priority: "recommended", category: "Legal" })
  }

  if (answers.hasEmployees === "yes" || answers.hasEmployees === "mixed") {
    docs.push({ id: "hr-procedures", label: "Proceduri interne HR", priority: "recommended", category: "HR" })
    docs.push({ id: "job-descriptions", label: "Fișe de post", priority: "recommended", category: "HR" })
  }

  if (isPositive(answers.usesAITools)) {
    docs.push({ id: "ai-policy", label: "Politică utilizare AI", priority: "required", category: "AI Act" })
  }

  if (isPositive(answers.processesPersonalData)) {
    docs.push({ id: "dsar-procedure", label: "Procedură DSAR", priority: "recommended", category: "GDPR" })
  }

  if (isPositive(answers.usesExternalVendors)) {
    docs.push({ id: "vendor-docs", label: "Documentație furnizori externi", priority: "recommended", category: "Vendor" })
  }

  return docs
}

// ── Next best action ────────────────────────────────────────────────────────

export function buildNextBestAction(findings: ScanFinding[]): NextBestAction {
  // Priority: GDPR privacy policy > AI policy > vendor review > HR > contracts
  const hasPrivacyFinding = findings.some((f) => f.id === "intake-gdpr-privacy-policy" || f.id === "intake-site-privacy-policy")
  const hasAiFinding = findings.some((f) => f.id === "intake-ai-missing-policy")
  const hasVendorFinding = findings.some((f) => f.id === "intake-vendor-missing-docs")

  if (hasPrivacyFinding) {
    return {
      label: "Generează prima politică GDPR",
      href: "/dashboard/scanari",
      estimatedMinutes: 3,
    }
  }

  if (hasAiFinding) {
    return {
      label: "Adaugă sistemele AI și generează politica AI",
      href: "/dashboard/sisteme",
      estimatedMinutes: 4,
    }
  }

  if (hasVendorFinding) {
    return {
      label: "Începe review-ul primului furnizor extern",
      href: "/dashboard/vendor-review",
      estimatedMinutes: 5,
    }
  }

  if (findings.length > 0) {
    return {
      label: "Rezolvă primul finding din board",
      href: "/dashboard/checklists",
      estimatedMinutes: 3,
    }
  }

  return {
    label: "Explorează dashboard-ul",
    href: "/dashboard",
    estimatedMinutes: 2,
  }
}
