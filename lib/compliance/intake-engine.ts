// Intake Engine — Questionnaire Automation Blueprint → Cod
// Transformă intake-ul din formular lung în confirmare asistată.
//
// Model: prefill → 7 întrebări decisive → condiționare → findings + doc requests + next action
// Funcție pură, fără I/O, safe în browser și pe server.

import { dashboardFindingRoute } from "@/lib/compliscan/dashboard-routes"
import type { OrgProfile } from "@/lib/compliance/applicability"
import type {
  OrgProfilePrefill,
  PrefillConfidence,
  PrefillSuggestionSource,
} from "@/lib/compliance/org-profile-prefill"
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
  hasRopaRegistry?: IntakeAnswer
  hasVendorDpas?: IntakeAnswer
  hasRetentionSchedule?: IntakeAnswer
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
  confidence: PrefillConfidence
  reason: string
  source: PrefillSuggestionSource
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
    id: "hasRopaRegistry",
    text: "Aveți registrul de prelucrări (RoPA) actualizat?",
    conditional: true,
    showWhen: (a) => isPositive(a.processesPersonalData),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
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
  {
    id: "hasRetentionSchedule",
    text: "Aveți reguli clare de retenție și ștergere pentru datele personale?",
    conditional: true,
    showWhen: (a) => isPositive(a.processesPersonalData),
    options: [
      { value: "yes", label: "Da" },
      { value: "no", label: "Nu" },
      { value: "partial", label: "Parțial" },
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
    source: "profile_confirmed",
  })

  // Q3 — Personal data: prefer direct signals from onboarding prefill
  if (prefill?.suggestions.processesPersonalData) {
    suggestions.push({
      questionId: "processesPersonalData",
      value: prefill.suggestions.processesPersonalData.value ? "yes" : "no",
      confidence: prefill.suggestions.processesPersonalData.confidence,
      reason: prefill.suggestions.processesPersonalData.reason,
      source: prefill.suggestions.processesPersonalData.source,
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
        source: "profile_inference",
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
      source: prefill.suggestions.usesExternalVendors.source,
    })
  } else if (profile.requiresEfactura) {
    suggestions.push({
      questionId: "usesExternalVendors",
      value: "probably",
      confidence: "medium",
      reason: "Facturezi B2B prin e-Factura, deci cel mai probabil ai furnizori externi.",
      source: "profile_inference",
    })
  }

  if (prefill?.suggestions.hasSiteWithForms) {
    suggestions.push({
      questionId: "hasSiteWithForms",
      value: prefill.suggestions.hasSiteWithForms.value ? "yes" : "no",
      confidence: prefill.suggestions.hasSiteWithForms.confidence,
      reason: prefill.suggestions.hasSiteWithForms.reason,
      source: prefill.suggestions.hasSiteWithForms.source,
    })
  }

  if (prefill?.suggestions.hasStandardContracts) {
    suggestions.push({
      questionId: "hasStandardContracts",
      value: prefill.suggestions.hasStandardContracts.value ? "yes" : "no",
      confidence: prefill.suggestions.hasStandardContracts.confidence,
      reason: prefill.suggestions.hasStandardContracts.reason,
      source: prefill.suggestions.hasStandardContracts.source,
    })
  }

  if (prefill?.suggestions.hasPrivacyPolicy) {
    suggestions.push({
      questionId: "hasPrivacyPolicy",
      value: prefill.suggestions.hasPrivacyPolicy.value ? "yes" : "no",
      confidence: prefill.suggestions.hasPrivacyPolicy.confidence,
      reason: prefill.suggestions.hasPrivacyPolicy.reason,
      source: prefill.suggestions.hasPrivacyPolicy.source,
    })
  }

  if (prefill?.suggestions.hasVendorDpas) {
    suggestions.push({
      questionId: "hasVendorDpas",
      value: prefill.suggestions.hasVendorDpas.value ? "yes" : "no",
      confidence: prefill.suggestions.hasVendorDpas.confidence,
      reason: prefill.suggestions.hasVendorDpas.reason,
      source: prefill.suggestions.hasVendorDpas.source,
    })
  }

  if (prefill?.suggestions.aiUsesConfidentialData) {
    suggestions.push({
      questionId: "aiUsesConfidentialData",
      value: prefill.suggestions.aiUsesConfidentialData.value ? "yes" : "no",
      confidence: prefill.suggestions.aiUsesConfidentialData.confidence,
      reason: prefill.suggestions.aiUsesConfidentialData.reason,
      source: prefill.suggestions.aiUsesConfidentialData.source,
    })
  }

  if (prefill?.suggestions.hasAiPolicy) {
    suggestions.push({
      questionId: "hasAiPolicy",
      value: prefill.suggestions.hasAiPolicy.value ? "yes" : "no",
      confidence: prefill.suggestions.hasAiPolicy.confidence,
      reason: prefill.suggestions.hasAiPolicy.reason,
      source: prefill.suggestions.hasAiPolicy.source,
    })
  }

  if (prefill?.suggestions.hasVendorDocumentation) {
    suggestions.push({
      questionId: "hasVendorDocumentation",
      value: prefill.suggestions.hasVendorDocumentation.value ? "yes" : "no",
      confidence: prefill.suggestions.hasVendorDocumentation.confidence,
      reason: prefill.suggestions.hasVendorDocumentation.reason,
      source: prefill.suggestions.hasVendorDocumentation.source,
    })
  }

  if (prefill?.suggestions.vendorsSendPersonalData) {
    suggestions.push({
      questionId: "vendorsSendPersonalData",
      value: prefill.suggestions.vendorsSendPersonalData.value ? "yes" : "no",
      confidence: prefill.suggestions.vendorsSendPersonalData.confidence,
      reason: prefill.suggestions.vendorsSendPersonalData.reason,
      source: prefill.suggestions.vendorsSendPersonalData.source,
    })
  }

  if (prefill?.suggestions.hasSitePrivacyPolicy) {
    suggestions.push({
      questionId: "hasSitePrivacyPolicy",
      value: prefill.suggestions.hasSitePrivacyPolicy.value ? "yes" : "no",
      confidence: prefill.suggestions.hasSitePrivacyPolicy.confidence,
      reason: prefill.suggestions.hasSitePrivacyPolicy.reason,
      source: prefill.suggestions.hasSitePrivacyPolicy.source,
    })
  }

  if (prefill?.suggestions.hasCookiesConsent) {
    suggestions.push({
      questionId: "hasCookiesConsent",
      value: prefill.suggestions.hasCookiesConsent.value ? "yes" : "no",
      confidence: prefill.suggestions.hasCookiesConsent.confidence,
      reason: prefill.suggestions.hasCookiesConsent.reason,
      source: prefill.suggestions.hasCookiesConsent.source,
    })
  }

  // Q1 — B2C: inferred from sector
  if (profile.sector === "retail") {
    suggestions.push({
      questionId: "sellsToConsumers",
      value: "yes",
      confidence: "medium",
      reason: "Sectorul retail implică de regulă vânzări către persoane fizice.",
      source: "profile_inference",
    })
  }

  return suggestions
}

export function shouldAutofillSuggestedAnswer(
  suggestion: Pick<SuggestedAnswer, "confidence">
) {
  return suggestion.confidence === "high"
}

export function buildInitialIntakeAnswers(
  profile: OrgProfile,
  prefill?: OrgProfilePrefill | null
): FullIntakeAnswers {
  const initial: FullIntakeAnswers = {
    usesAITools: profile.usesAITools ? "yes" : "no",
  }

  for (const suggestion of deriveSuggestedAnswers(profile, prefill)) {
    if (!shouldAutofillSuggestedAnswer(suggestion)) continue
    ;(initial as Record<string, string | undefined>)[suggestion.questionId] = suggestion.value
  }

  return initial
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
    suggestedDocumentType?: ScanFinding["suggestedDocumentType"]
    evidenceRequired?: ScanFinding["evidenceRequired"]
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
    suggestedDocumentType: opts?.suggestedDocumentType,
    evidenceRequired: opts?.evidenceRequired,
    resolution: opts?.resolution,
  }
}

/**
 * Generate initial findings from intake answers.
 * Maps directly from blueprint section 10.
 */
export function buildInitialFindings(
  answers: FullIntakeAnswers,
  opts?: { supplementalFindings?: ScanFinding[] }
): ScanFinding[] {
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
          suggestedDocumentType: "privacy-policy",
          resolution: {
            problem: "Activitate B2C fără politică de confidențialitate dedicată consumatorilor.",
            impact: "Risc de amendă GDPR și pierderea încrederii clienților.",
            action: "Generează politica de confidențialitate B2C din CompliScan.",
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
            suggestedDocumentType: "job-description",
            resolution: {
              problem: "Fișe de post lipsă sau neactualizate.",
              impact: "Risc de sancțiune la control ITM.",
              action: "Generează template fișe de post din CompliScan.",
              generatedAsset: "Fișă de Post (generată AI)",
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
            suggestedDocumentType: "reges-correction-brief",
            resolution: {
              problem: "REGES / evidență contracte neactualizată.",
              impact: "Sancțiuni de la ITM pentru neconformitate (5.000-10.000 RON/angajat).",
              action: "Generează Brief Corecție REGES din CompliScan și trimite-l contabilului.",
              generatedAsset: "Brief Corecție REGES/Revisal (generat AI)",
              humanStep: "Contabilul sau HR-ul verifică Revisal-ul și confirmă conformitatea.",
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
            remediationHint: "Generează regulament intern din CompliScan.",
            suggestedDocumentType: "hr-internal-procedures",
            resolution: {
              problem: "Lipsa regulamentului intern / procedurilor pentru angajați.",
              impact: "Neconformitate cu Codul Muncii.",
              action: "Generează regulament intern standard.",
              generatedAsset: "Regulament Intern (generat AI)",
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
          remediationHint: "Generează politica GDPR din CompliScan.",
          suggestedDocumentType: "privacy-policy",
          resolution: {
            problem: "Lipsește politica de confidențialitate.",
            impact: "Încălcarea obligației de informare GDPR — risc de amendă.",
              action: "Generează politica de confidențialitate din CompliScan.",
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
              action: "Creează procedura DSAR din template CompliScan.",
              humanStep: "Desemnează persoana responsabilă de cererile DSAR.",
              closureEvidence: "Procedura documentată + persoana desemnată.",
            },
          }
        )
      )
    }
    if (answers.hasRopaRegistry !== "yes") {
      const isPartialRopa = answers.hasRopaRegistry === "partial"
      findings.push(
        makeFinding(
          isPartialRopa ? "gdpr-ropa-update" : "gdpr-ropa-missing",
          isPartialRopa
            ? "Registru de prelucrări neactualizat"
            : "Registru de prelucrări lipsă (Art. 30)",
          isPartialRopa
            ? "Registrul RoPA există doar parțial sau este depășit și nu mai reflectă activitățile reale de prelucrare."
            : "Prelucrarea datelor personale cere un registru RoPA conform GDPR Art. 30, cu activitățile reale de prelucrare și măsurile de bază.",
          "GDPR",
          isPartialRopa ? "medium" : "high",
          {
            remediationHint: "Completează registrul RoPA în CompliScan și confirmă activitățile reale de prelucrare.",
            suggestedDocumentType: "ropa",
            resolution: {
              problem: isPartialRopa
                ? "Registrul RoPA nu este actualizat cu activitățile reale de prelucrare."
                : "Lipsește registrul RoPA cerut de GDPR Art. 30.",
              impact: isPartialRopa
                ? "Auditul nu poate demonstra ce prelucrări există azi și cine primește datele."
                : "Lipsește o evidență centrală a prelucrărilor de date personale, cu risc GDPR și audit slab.",
              action: "Completează sau actualizează registrul RoPA direct din CompliScan.",
              generatedAsset: "Registru de Prelucrări (RoPA)",
              humanStep: "Confirmă că activitățile, categoriile de date, temeiurile și destinatarii reflectă situația reală.",
              closureEvidence: "Registrul RoPA completat, confirmat și salvat la dosar.",
            },
          }
        )
      )
    }
    if (answers.hasRetentionSchedule !== "yes") {
      findings.push(
        makeFinding(
          "gdpr-retention",
          "Retenție date neclară",
          "Nu este clar cât păstrezi categoriile de date personale și cum dovedești ștergerea sau anonimizarea la expirare.",
          "GDPR",
          "medium",
          {
            remediationHint: "Generează politica și matricea de retenție din CompliScan.",
            suggestedDocumentType: "retention-policy",
            resolution: {
              problem: "Duratele de retenție și regula de ștergere nu sunt definite clar.",
              impact: "Risc GDPR prin păstrarea excesivă a datelor și lipsa unei urme clare de ștergere.",
              action: "Generează politica și matricea de retenție din CompliScan.",
              humanStep: "Confirmă duratele reale pe categorii de date și procesul de ștergere.",
              closureEvidence: "Matricea de retenție salvată și confirmată.",
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
            suggestedDocumentType: "ai-governance",
            remediationHint: "Generează politica de utilizare AI din CompliScan.",
            resolution: {
              problem: "Lipsește politica internă de utilizare AI.",
              impact: "Neconformitate AI Act Art.4 + risc de scurgere date confidențiale.",
              action: "Generează politica AI din CompliScan.",
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
            remediationHint: "Începe un vendor review în CompliScan pentru fiecare furnizor.",
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
          suggestedDocumentType: "dpa",
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
          suggestedDocumentType: "privacy-policy",
          resolution: {
            problem: "Site-ul nu are privacy policy publicată.",
            impact: "Colectare date fără informare — risc amendă GDPR.",
              action: "Generează privacy policy din CompliScan și publică pe site.",
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
          remediationHint: "Pregătește sau actualizează template-urile contractuale și lasă dovada clară în cockpit.",
          resolution: {
            problem: "Contracte standard lipsă sau incomplete.",
            impact: "Expunere juridică în relații comerciale + audit dificil.",
            action: "Pregătește template-uri contractuale standard și pune-le în uz pentru relațiile comerciale repetitive.",
            humanStep: "Adaptează template-urile la specificul activității, verifică-le cu un jurist și notează unde sunt salvate sau folosite.",
            closureEvidence: "Template-uri contractuale revizuite și urmă clară despre unde sunt salvate sau folosite.",
          },
        }
      )
    )
  }

  const merged = [...findings, ...(opts?.supplementalFindings ?? [])]
  const deduped = new Map<string, ScanFinding>()
  for (const finding of merged) {
    deduped.set(finding.id, finding)
  }
  return Array.from(deduped.values())
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
    docs.push({
      id: "ai-governance",
      label: "Politică guvernanță AI",
      priority: "required",
      category: "AI Act",
    })
  }

  if (isPositive(answers.processesPersonalData)) {
    docs.push({ id: "dsar-procedure", label: "Procedură DSAR", priority: "recommended", category: "GDPR" })
    if (answers.hasRopaRegistry !== "yes") {
      docs.push({
        id: "ropa",
        label: "Registru de prelucrări (RoPA)",
        priority: "required",
        category: "GDPR",
      })
    }
    if (answers.hasRetentionSchedule !== "yes") {
      docs.push({
        id: "retention-policy",
        label: "Politică și matrice de retenție",
        priority: "required",
        category: "GDPR",
      })
    }
  }

  if (isPositive(answers.usesExternalVendors)) {
    docs.push({ id: "vendor-docs", label: "Documentație furnizori externi", priority: "recommended", category: "Vendor" })
  }

  return docs
}

// ── Next best action ────────────────────────────────────────────────────────

export function buildNextBestAction(findings: ScanFinding[]): NextBestAction {
  // Priority: GDPR privacy policy > AI policy > vendor review > HR > contracts
  const privacyFinding = findings.find(
    (f) =>
      f.id === "intake-gdpr-privacy-policy" ||
      f.id === "intake-site-privacy-policy" ||
      f.id === "intake-b2c-privacy"
  )
  const ropaFinding = findings.find(
    (f) => f.id === "intake-gdpr-ropa-missing" || f.id === "intake-gdpr-ropa-update"
  )
  const aiFinding = findings.find((f) => f.id === "intake-ai-missing-policy")
  const vendorDpaFinding = findings.find((f) => f.id === "intake-vendor-no-dpa")
  const vendorPackFinding = findings.find((f) => f.id === "intake-vendor-missing-docs")
  const hrJobFinding = findings.find((f) => f.id === "intake-hr-job-descriptions")

  if (privacyFinding) {
    return {
      label: "Generează prima politică GDPR",
      href: dashboardFindingRoute(privacyFinding.id, { action: "generate" }),
      estimatedMinutes: 3,
    }
  }

  if (ropaFinding) {
    return {
      label: "Deschide registrul RoPA în cockpit",
      href: dashboardFindingRoute(ropaFinding.id),
      estimatedMinutes: 4,
    }
  }

  if (vendorDpaFinding) {
    return {
      label: "Deschide primul DPA în cockpit",
      href: dashboardFindingRoute(vendorDpaFinding.id, { action: "generate" }),
      estimatedMinutes: 4,
    }
  }

  if (vendorPackFinding) {
    return {
      label: "Deschide pachetul vendor în cockpit",
      href: dashboardFindingRoute(vendorPackFinding.id),
      estimatedMinutes: 5,
    }
  }

  if (hrJobFinding) {
    return {
      label: "Deschide pachetul fișelor de post",
      href: dashboardFindingRoute(hrJobFinding.id),
      estimatedMinutes: 5,
    }
  }

  if (aiFinding) {
    return {
      label: "Deschide politica AI în cockpit",
      href: dashboardFindingRoute(aiFinding.id, { action: "generate" }),
      estimatedMinutes: 4,
    }
  }
  if (findings.length > 0) {
    return {
      label: "Rezolvă primul finding din board",
      href: dashboardFindingRoute(findings[0].id),
      estimatedMinutes: 3,
    }
  }

  return {
    label: "Explorează dashboard-ul",
    href: "/dashboard",
    estimatedMinutes: 2,
  }
}
