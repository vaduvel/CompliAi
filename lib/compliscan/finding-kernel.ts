/**
 * finding-kernel.ts — Sprint 1: Contract Kernel in Code
 *
 * Stratul unic de decizie care elimină if-urile răspândite și hardcodate.
 * Orice finding → tip canonic → flow recipe → cockpit recipe.
 *
 * Ordinea de folosire:
 *   classifyFinding(record) → FindingClassification
 *   getFindingTypeDefinition(findingTypeId) → FindingTypeDefinition
 *   getResolveFlowRecipe(findingTypeId) → ResolveFlowRecipe
 *   deriveCockpitUIState({ record, findingType, flow, documentFlowState }) → CockpitUIState
 *   buildCockpitRecipe(record, artifacts?) → CockpitRecipe
 */

import type { GeneratedDocumentKind, ScanFinding } from "@/lib/compliance/types"
import type { FindingDocumentFlowState } from "@/lib/compliscan/finding-cockpit"
import { fingerprintMatch, listLibraryVendors } from "@/lib/compliance/vendor-library"
import { ANSPDCP_FINDING_PREFIX, getIncidentIdFromAnspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"
import { lookupAnafError, type AnafErrorEntry } from "@/lib/compliance/efactura-error-codes"
import { MATURITY_DOMAINS } from "@/lib/compliance/nis2-maturity"

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FindingFramework = "GDPR" | "NIS2" | "eFactura" | "AI Act" | "Cross" | "Codul Muncii"

export type ResolutionMode =
  | "in_app_guided"
  | "in_app_full"
  | "external_action"
  | "user_attestation"

export type AutoRecheckMode = "no" | "partial" | "yes"

export type FindingTypeDefinition = {
  findingTypeId: string
  framework: FindingFramework
  title: string
  category: string
  typicalSeverity: string
  signalTypes: string[]
  resolutionModes: ResolutionMode[]
  primaryActors: string[]
  compliCapabilities: string[]
  userResponsibilities: string[]
  requiredEvidenceKinds: string[]
  autoRecheck: AutoRecheckMode
  closingRule: string
}

export type ResolveFlowState =
  | "detected"
  | "ready_to_generate"
  | "need_your_input"
  | "external_action_required"
  | "needs_revalidation"
  | "evidence_required"

export type ResolveFlowRecipe = {
  findingTypeId: string
  initialFlowState: ResolveFlowState
  primaryCTA: string
  secondaryCTA?: string
  whatUserSees: string
  whatCompliDoes: string
  whatUserMustDo: string
  closeCondition: string
  revalidationTriggers: string[]
}

export type CockpitUIState =
  | "detected"
  | "need_your_input"
  | "ready_to_generate"
  | "external_action_required"
  | "evidence_uploaded"
  | "rechecking"
  | "resolved"
  | "needs_revalidation"
  | "false_positive"

export type CockpitBlockKey =
  | "generator"
  | "input"
  | "external_action"
  | "evidence"
  | "confirmation"
  | "recheck"
  | "revalidation"
  | "audit_meta"

export type CockpitVisibleBlocks = {
  collapsedPrimaryCTA: string
  collapsedStatusLabel: string
  detailBlocks: CockpitBlockKey[]
  aboveTheFoldBlocks: CockpitBlockKey[]
  belowTheFoldBlocks: CockpitBlockKey[]
}

export type ResolutionModeBlockRules = {
  resolutionMode: ResolutionMode
  generatorBlock: boolean
  inputBlock: boolean
  externalActionBlock: boolean
  evidenceBlock: boolean
  confirmationBlock: boolean
  recheckBlock: boolean
  revalidationBlock: boolean
}

export type FindingClassification = {
  findingTypeId: string
  framework: FindingFramework
}

/** Contractul complet runtime — uiState se derivă din celelalte câmpuri */
export type FindingRuntimeContract = {
  record: ScanFinding
  findingType: FindingTypeDefinition
  flow: ResolveFlowRecipe
  documentFlowState: FindingDocumentFlowState
  uiState?: CockpitUIState
}

export type CockpitRecipe = {
  findingTypeId: string
  framework: FindingFramework
  executionClass: SmartResolveExecutionClass
  documentSupport?: {
    documentType: GeneratedDocumentKind
    mode: "required" | "assistive"
  }
  resolutionMode: ResolutionMode
  statusLabel: string
  collapsedStatusLabel: string
  uiState: CockpitUIState
  resolveFlowState: ResolveFlowState
  whatUserSees: string
  heroTitle: string
  heroSummary: string
  whatCompliDoes: string
  whatUserMustDo: string
  primaryCTA: {
    label: string
    action:
      | "confirm"
      | "confirm_and_generate"
      | "open_generator"
      | "open_external_steps"
      | "upload_evidence"
      | "revalidate"
      | "rescan"
  }
  secondaryCTA?: {
    label: string
    action:
      | "show_diff"
      | "show_old_document"
      | "show_requirements"
      | "skip_vendor"
      | "already_have_evidence"
  }
  workflowLink?: {
    href: string
    label: string
  }
  specialistHandoff?: SpecialistHandoffContract
  closureCTA?: string
  acceptedEvidence: string[]
  visibleBlocks: CockpitVisibleBlocks
  closeCondition: string
  dossierOutcome: string
  monitoringSignals: string[]
  vendorContext?: {
    vendorId: string
    vendorName: string
    dpaUrl?: string | null
    matchConfidence: number
    matchType: "exact" | "contains" | "fuzzy"
  }
}

export type CloseGatingRequirements = {
  requiresGeneratedDocument: boolean
  requiresConfirmationChecklist: boolean
  requiresEvidenceNote: boolean
  requiresRevalidationConfirmation: boolean
  requiresNextReviewDate: boolean
  acceptedEvidence: string[]
}

export type SmartResolveExecutionClass = "documentary" | "operational" | "specialist_handoff"

export type SpecialistHandoffSurface =
  | "job_description_pack"
  | "vendor_review_pack"
  | "dsar_process"
  | "dsar_access"
  | "dsar_erasure"
  | "anspdcp_breach"
  | "nis2_eligibility"
  | "nis2_assessment"
  | "nis2_incident"
  | "nis2_governance"
  | "nis2_maturity"
  | "nis2_vendor_registry"

export type SpecialistHandoffRuntimeReturnMode =
  | "manual_banner"
  | "manual_link"
  | "conditional_link"
  | "automatic"

export type SpecialistHandoffContract = {
  surface: SpecialistHandoffSurface
  startHref: string
  startLabel: string
  targetReturnMode: "automatic"
  runtimeReturnMode: SpecialistHandoffRuntimeReturnMode
  runtimeStatusNote: string
  returnEvidenceLabel: string
  returnEvidenceInstruction: string
}

const DOCUMENTARY_FINDING_TYPE_IDS = new Set([
  "GDPR-001",
  "GDPR-002",
  "GDPR-003",
  "GDPR-010",
  "GDPR-016",
  "GDPR-020",
  "AI-005",
  "HR-001",
  "HR-002",
  "HR-003",
])

const SPECIALIST_HANDOFF_FINDING_TYPE_IDS = new Set([
  "GDPR-021",
  "GDPR-011",
  "GDPR-012",
  "GDPR-013",
  "GDPR-014",
  "GDPR-019",
  "NIS2-001",
  "NIS2-005",
  "NIS2-015",
  "NIS2-GENERIC",
])

export function getSmartResolveExecutionClass(
  findingTypeId: string
): SmartResolveExecutionClass {
  if (DOCUMENTARY_FINDING_TYPE_IDS.has(findingTypeId)) return "documentary"
  if (SPECIALIST_HANDOFF_FINDING_TYPE_IDS.has(findingTypeId)) return "specialist_handoff"
  return "operational"
}

export function isSmartResolveDocumentaryFindingType(findingTypeId: string) {
  return getSmartResolveExecutionClass(findingTypeId) === "documentary"
}

const CANONICAL_DOCUMENT_TYPE_BY_FINDING_TYPE_ID: Partial<Record<string, GeneratedDocumentKind>> = {
  "GDPR-001": "privacy-policy",
  "GDPR-002": "privacy-policy",
  "GDPR-003": "cookie-policy",
  "GDPR-010": "dpa",
  "GDPR-016": "retention-policy",
  "GDPR-020": "contract-template",
  "AI-005": "ai-governance",
  "HR-001": "job-description",
  "HR-002": "hr-internal-procedures",
  "HR-003": "reges-correction-brief",
}

const ASSISTIVE_DOCUMENT_TYPE_BY_FINDING_TYPE_ID: Partial<Record<string, GeneratedDocumentKind>> = {
  "GDPR-005": "cookie-policy",
  "GDPR-017": "deletion-attestation",
  "AI-OPS": "ai-governance",
}

export function getCanonicalSuggestedDocumentTypeForFindingType(findingTypeId: string): GeneratedDocumentKind | null {
  return CANONICAL_DOCUMENT_TYPE_BY_FINDING_TYPE_ID[findingTypeId] ?? null
}

export function getAssistiveDocumentTypeForFindingType(findingTypeId: string): GeneratedDocumentKind | null {
  return ASSISTIVE_DOCUMENT_TYPE_BY_FINDING_TYPE_ID[findingTypeId] ?? null
}

export function getDocumentSupportForFindingType(
  findingTypeId: string
): CockpitRecipe["documentSupport"] | undefined {
  const canonicalType = getCanonicalSuggestedDocumentTypeForFindingType(findingTypeId)
  if (canonicalType) {
    return {
      documentType: canonicalType,
      mode: "required",
    }
  }

  const assistiveType = getAssistiveDocumentTypeForFindingType(findingTypeId)
  if (assistiveType) {
    return {
      documentType: assistiveType,
      mode: "assistive",
    }
  }

  return undefined
}

export function getRuntimeSuggestedDocumentType(record: ScanFinding): string | null {
  const { findingTypeId } = classifyFinding(record)
  return getCanonicalSuggestedDocumentTypeForFindingType(findingTypeId) ?? record.suggestedDocumentType ?? null
}

export function getRuntimeCockpitDocumentType(record: ScanFinding): GeneratedDocumentKind | null {
  const { findingTypeId } = classifyFinding(record)
  return (
    getDocumentSupportForFindingType(findingTypeId)?.documentType ??
    (record.suggestedDocumentType as GeneratedDocumentKind | undefined) ??
    null
  )
}

export function normalizeFindingSuggestedDocumentType<T extends ScanFinding>(record: T): T {
  const runtimeSuggestedDocumentType = getRuntimeSuggestedDocumentType(record) ?? undefined

  if ((record.suggestedDocumentType ?? undefined) === runtimeSuggestedDocumentType) {
    return record
  }

  return {
    ...record,
    suggestedDocumentType: runtimeSuggestedDocumentType,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FINDING TYPE DEFINITIONS — Catalog canonic
// ─────────────────────────────────────────────────────────────────────────────

const FINDING_TYPE_DEFINITIONS: Record<string, FindingTypeDefinition> = {
  "GDPR-001": {
    findingTypeId: "GDPR-001",
    framework: "GDPR",
    title: "Politică de confidențialitate lipsă",
    category: "Privacy notice",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["generează draft", "precompleteată pe baza datelor firmei", "leagă artefactul de finding"],
    userResponsibilities: ["completează datele reale", "confirmă", "salvează"],
    requiredEvidenceKinds: ["generated_document", "confirmation"],
    autoRecheck: "partial",
    closingRule: "document generat, confirmat și salvat la dosar",
  },
  "GDPR-002": {
    findingTypeId: "GDPR-002",
    framework: "GDPR",
    title: "Politică de confidențialitate generică",
    category: "Privacy notice",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["marchează zonele lipsă", "propune actualizare"],
    userResponsibilities: ["completează diferențele reale"],
    requiredEvidenceKinds: ["generated_document", "confirmation"],
    autoRecheck: "partial",
    closingRule: "document actualizat și confirmat",
  },
  "GDPR-003": {
    findingTypeId: "GDPR-003",
    framework: "GDPR",
    title: "Politică de cookies lipsă",
    category: "Cookies",
    typicalSeverity: "medium",
    signalTypes: ["direct"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["generează draft de politică / copy"],
    userResponsibilities: ["completează și publică"],
    requiredEvidenceKinds: ["generated_document", "public_link"],
    autoRecheck: "partial",
    closingRule: "document + link / screenshot",
  },
  "GDPR-005": {
    findingTypeId: "GDPR-005",
    framework: "GDPR",
    title: "Banner de cookies neconform",
    category: "Cookies",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "web dev"],
    compliCapabilities: ["explică lipsa / problema", "cere rescan"],
    userResponsibilities: ["corectează implementarea bannerului și a consentului"],
    requiredEvidenceKinds: ["screenshot", "system_recheck"],
    autoRecheck: "yes",
    closingRule: "screenshot + rescan curat",
  },
  "GDPR-010": {
    findingTypeId: "GDPR-010",
    framework: "GDPR",
    title: "DPA lipsă pentru vendor cunoscut",
    category: "Vendor / processor",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_full", "in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["propune DPA / template / link vendor", "deschide upload"],
    userResponsibilities: ["confirmă relația și încarcă / semnează"],
    requiredEvidenceKinds: ["vendor_document", "confirmation"],
    autoRecheck: "partial",
    closingRule: "DPA prezent și confirmat",
  },
  "GDPR-011": {
    findingTypeId: "GDPR-011",
    framework: "GDPR",
    title: "Furnizori externi fără documentație",
    category: "Vendor governance",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["pregătește Vendor Pack", "deschide vendor review", "structurează solicitarea către furnizori"],
    userResponsibilities: ["pornește review pentru vendorii relevanți", "trimite solicitările reale", "păstrează urma de follow-up"],
    requiredEvidenceKinds: ["vendor_document", "uploaded_file", "note"],
    autoRecheck: "partial",
    closingRule: "Vendor Pack revizuit și primul review pornit cu urmă clară",
  },
  "GDPR-012": {
    findingTypeId: "GDPR-012",
    framework: "GDPR",
    title: "Proces DSAR lipsă",
    category: "Data subject rights",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["generează procedura, registrul și playbook-ul minim", "deschide modulul DSAR cu pachetul pregătit"],
    userResponsibilities: ["desemnează ownerul", "confirmă circuitul real", "păstrează urma la dosar"],
    requiredEvidenceKinds: ["uploaded_file", "note"],
    autoRecheck: "partial",
    closingRule: "pachet DSAR revizuit și owner desemnat",
  },
  "GDPR-013": {
    findingTypeId: "GDPR-013",
    framework: "GDPR",
    title: "Cerere de acces activă",
    category: "Data subject rights",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["creează cazul", "calculează deadline", "generează draft răspuns"],
    userResponsibilities: ["verifică identitatea", "trimite răspunsul"],
    requiredEvidenceKinds: ["email_sent", "uploaded_file"],
    autoRecheck: "no",
    closingRule: "dovada trimiterii + status responded",
  },
  "NIS2-001": {
    findingTypeId: "NIS2-001",
    framework: "NIS2",
    title: "Eligibilitate NIS2 neclară",
    category: "Applicability",
    typicalSeverity: "high",
    signalTypes: ["inferred"],
    resolutionModes: ["user_attestation", "in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["rulează wizard de eligibilitate"],
    userResponsibilities: ["confirmă sector, dimensiune, rol"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "rezultat eligibilitate salvat",
  },
  "NIS2-005": {
    findingTypeId: "NIS2-005",
    framework: "NIS2",
    title: "Assessment NIS2 neînceput",
    category: "Assessment",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["deschide assessment-ul", "propune răspunsuri unde poate"],
    userResponsibilities: ["completează și confirmă"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "assessment salvat",
  },
  "NIS2-015": {
    findingTypeId: "NIS2-015",
    framework: "NIS2",
    title: "Incident activ fără Early Warning",
    category: "Incident",
    typicalSeverity: "critical",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "dpo"],
    compliCapabilities: ["generează draft 24h", "countdown vizibil"],
    userResponsibilities: ["trimite manual și adaugă referință"],
    requiredEvidenceKinds: ["official_reference", "uploaded_file"],
    autoRecheck: "no",
    closingRule: "dovada trimiterii prezentă",
  },
  "GDPR-014": {
    findingTypeId: "GDPR-014",
    framework: "GDPR",
    title: "Cerere de ștergere activă",
    category: "Data subject rights",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["structurează răspunsul", "loghează cazul", "pregătește handoff-ul DSAR"],
    userResponsibilities: ["execută ștergerea reală", "trimite răspunsul"],
    requiredEvidenceKinds: ["email_sent", "confirmation"],
    autoRecheck: "no",
    closingRule: "dovada răspunsului și confirmarea execuției",
  },
  "GDPR-016": {
    findingTypeId: "GDPR-016",
    framework: "GDPR",
    title: "Retenție date neclară",
    category: "Retention",
    typicalSeverity: "medium",
    signalTypes: ["inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["generează matrice / policy de retenție", "leagă documentul de finding"],
    userResponsibilities: ["confirmă duratele reale și procesul de ștergere"],
    requiredEvidenceKinds: ["generated_document", "confirmation"],
    autoRecheck: "no",
    closingRule: "matricea de retenție este salvată și confirmată",
  },
  "GDPR-017": {
    findingTypeId: "GDPR-017",
    framework: "GDPR",
    title: "Ștergere / anonimizare neconfirmată",
    category: "Retention execution",
    typicalSeverity: "medium",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "data owner"],
    compliCapabilities: ["arată dovada operațională cerută", "păstrează urma de execuție în dosar"],
    userResponsibilities: ["rulează ștergerea sau anonimizarea", "păstrează logul sau exportul de control"],
    requiredEvidenceKinds: ["log_export", "uploaded_file", "screenshot"],
    autoRecheck: "partial",
    closingRule: "log de ștergere / anonimizare sau export de control salvat la dosar",
  },
  "GDPR-019": {
    findingTypeId: "GDPR-019",
    framework: "GDPR",
    title: "Bresă cu impact pe date personale",
    category: "Breach",
    typicalSeverity: "critical",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "dpo"],
    compliCapabilities: ["deschide incidentul corect", "pregătește flow-ul ANSPDCP", "păstrează urma în dosar"],
    userResponsibilities: ["decide notificarea", "trimite manual sau documentează raționamentul"],
    requiredEvidenceKinds: ["official_reference", "email_sent", "uploaded_file"],
    autoRecheck: "no",
    closingRule: "dovada trimiterii sau raționament documentat",
  },
  "GDPR-020": {
    findingTypeId: "GDPR-020",
    framework: "GDPR",
    title: "Contracte standard lipsă sau incomplete",
    category: "Contractual baseline",
    typicalSeverity: "medium",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "owner"],
    compliCapabilities: ["explică dovada contractuală cerută", "ține cazul deschis până la urmă clară"],
    userResponsibilities: ["pregătește sau actualizează template-urile", "notează unde sunt salvate și cum sunt folosite"],
    requiredEvidenceKinds: ["uploaded_file", "public_link", "note"],
    autoRecheck: "partial",
    closingRule: "template-uri contractuale revizuite și urmă clară salvată la dosar",
  },
  "GDPR-021": {
    findingTypeId: "GDPR-021",
    framework: "GDPR",
    title: "Fișe de post lipsă sau incomplete",
    category: "HR / job descriptions",
    typicalSeverity: "medium",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user", "owner"],
    compliCapabilities: ["pregătește pachetul HR", "deschide suprafața Documente", "orientează spre generatorul fișei de post"],
    userResponsibilities: ["confirmă rolurile reale", "adaptează fișele per rol", "obține semnătura sau dovada de comunicare"],
    requiredEvidenceKinds: ["uploaded_file", "note"],
    autoRecheck: "partial",
    closingRule: "pachetul HR este revizuit și există urmă clară pentru rollout-ul fișelor de post",
  },
  "GDPR-OPS": {
    findingTypeId: "GDPR-OPS",
    framework: "GDPR",
    title: "Măsură operațională GDPR / HR",
    category: "Operational follow-up",
    typicalSeverity: "medium",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "owner"],
    compliCapabilities: ["explică măsura și dovada cerută", "ține urma în cockpit"],
    userResponsibilities: ["aplică măsura reală", "lasă dovada verificabilă"],
    requiredEvidenceKinds: ["uploaded_file", "note"],
    autoRecheck: "partial",
    closingRule: "măsura este aplicată și urmă clară este salvată la dosar",
  },
  "AI-001": {
    findingTypeId: "AI-001",
    framework: "AI Act",
    title: "Sistem AI nedeclarat în inventar",
    category: "Inventory",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["propune intrarea în inventar"],
    userResponsibilities: ["confirmă și completează"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "sistem salvat în inventar",
  },
  "AI-005": {
    findingTypeId: "AI-005",
    framework: "AI Act",
    title: "Human oversight nedefinit",
    category: "Governance / transparency",
    typicalSeverity: "high",
    signalTypes: ["inferred"],
    resolutionModes: ["in_app_guided", "user_attestation"],
    primaryActors: ["owner", "dpo"],
    compliCapabilities: ["generează checklist / policy de oversight"],
    userResponsibilities: ["confirmă persoanele și regulile"],
    requiredEvidenceKinds: ["confirmation", "generated_document"],
    autoRecheck: "no",
    closingRule: "oversight definit și salvat",
  },
  "AI-OPS": {
    findingTypeId: "AI-OPS",
    framework: "AI Act",
    title: "Măsură operațională AI",
    category: "Operational follow-up",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["external_action"],
    primaryActors: ["user", "owner"],
    compliCapabilities: ["explică măsura de control AI", "ține urma în cockpit"],
    userResponsibilities: ["aplică regula reală", "lasă dovada verificabilă"],
    requiredEvidenceKinds: ["uploaded_file", "note"],
    autoRecheck: "partial",
    closingRule: "măsura AI este aplicată și urmă clară este salvată la dosar",
  },
  "EF-001": {
    findingTypeId: "EF-001",
    framework: "eFactura",
    title: "SPV lipsă / neverificat",
    category: "SPV",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["oferă wizard interactiv SPV", "verifică automat API-ul ANAF"],
    userResponsibilities: ["verifică SPV din aplicație", "încarcă token-ul dacă e cerut"],
    requiredEvidenceKinds: ["screenshot", "official_reference"],
    autoRecheck: "partial",
    closingRule: "dovada activării",
  },
  "EF-003": {
    findingTypeId: "EF-003",
    framework: "eFactura",
    title: "Factură respinsă ANAF",
    category: "Invoice error",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["in_app_guided", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["parsează XML-ul", "identifică eroarea", "propune auto-fix", "generează XML corectat"],
    userResponsibilities: ["confirmă corecția", "retransmite XML-ul"],
    requiredEvidenceKinds: ["xml", "screenshot", "confirmation"],
    autoRecheck: "yes",
    closingRule: "status nou valid sau dovada corecției",
  },
  "EF-004": {
    findingTypeId: "EF-004",
    framework: "eFactura",
    title: "Factură în prelucrare blocată",
    category: "Processing delay",
    typicalSeverity: "medium",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["explică statusul și ce înseamnă 'în prelucrare'", "cere verificarea în SPV"],
    userResponsibilities: ["verifică în SPV ANAF", "retransmite dacă depășit termenul"],
    requiredEvidenceKinds: ["screenshot"],
    autoRecheck: "yes",
    closingRule: "confirmare status final din SPV (ok sau respinsă)",
  },
  "EF-005": {
    findingTypeId: "EF-005",
    framework: "eFactura",
    title: "Factură generată, netransmisă SPV",
    category: "Unsubmitted invoice",
    typicalSeverity: "medium",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["explică obligația de transmitere", "cere dovada transmiterii"],
    userResponsibilities: ["transmite factura spre SPV ANAF"],
    requiredEvidenceKinds: ["screenshot", "xml"],
    autoRecheck: "partial",
    closingRule: "confirmare transmitere și acceptare în SPV ANAF",
  },
  "EF-006": {
    findingTypeId: "EF-006",
    framework: "eFactura",
    title: "Date identificare client invalide",
    category: "Buyer identification",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["identifică câmpul client cu problemă", "explică corecția necesară"],
    userResponsibilities: ["verifică CUI/CNP client", "corectează în soft", "retransmite"],
    requiredEvidenceKinds: ["screenshot", "official_reference"],
    autoRecheck: "yes",
    closingRule: "factură cu date client corecte transmisă și confirmată",
  },
  "SYS-001": {
    findingTypeId: "SYS-001",
    framework: "Cross",
    title: "Finding rezolvat fără dovadă",
    category: "Evidence",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["user_attestation", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["blochează închiderea finală și cere dovada"],
    userResponsibilities: ["încarcă dovada"],
    requiredEvidenceKinds: ["uploaded_file", "screenshot", "public_link"],
    autoRecheck: "partial",
    closingRule: "dovadă atașată",
  },
  "SYS-002": {
    findingTypeId: "SYS-002",
    framework: "Cross",
    title: "Dovadă veche / necesită revalidare",
    category: "Revalidation",
    typicalSeverity: "medium",
    signalTypes: ["direct"],
    resolutionModes: ["user_attestation", "external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["ridică finding de revalidare", "arată diferența față de documentul anterior"],
    userResponsibilities: ["reconfirmă / reînnoiește"],
    requiredEvidenceKinds: ["confirmation", "uploaded_file"],
    autoRecheck: "partial",
    closingRule: "dată nouă de review salvată",
  },
  // Generic fallbacks per framework
  "GDPR-GENERIC": {
    findingTypeId: "GDPR-GENERIC",
    framework: "GDPR",
    title: "Finding GDPR",
    category: "General",
    typicalSeverity: "medium",
    signalTypes: ["inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["ghidează remedierea"],
    userResponsibilities: ["confirmă și atașează dovada"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "confirmare și dovadă prezentă",
  },
  "NIS2-GENERIC": {
    findingTypeId: "NIS2-GENERIC",
    framework: "NIS2",
    title: "Finding NIS2",
    category: "General",
    typicalSeverity: "high",
    signalTypes: ["inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["ghidează evaluarea și remedierea"],
    userResponsibilities: ["confirmă și atașează dovada"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "confirmare și dovadă prezentă",
  },
  "EF-GENERIC": {
    findingTypeId: "EF-GENERIC",
    framework: "eFactura",
    title: "Finding eFactură",
    category: "General",
    typicalSeverity: "high",
    signalTypes: ["direct"],
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["explică problema și pașii de remediere"],
    userResponsibilities: ["corectează și adaugă dovada"],
    requiredEvidenceKinds: ["screenshot"],
    autoRecheck: "partial",
    closingRule: "dovadă prezentă",
  },
  "AI-GENERIC": {
    findingTypeId: "AI-GENERIC",
    framework: "AI Act",
    title: "Finding AI Act",
    category: "General",
    typicalSeverity: "high",
    signalTypes: ["inferred"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user"],
    compliCapabilities: ["ghidează evaluarea sistemului AI"],
    userResponsibilities: ["confirmă și documentează"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "confirmare și documentație prezentă",
  },
  "CROSS-GENERIC": {
    findingTypeId: "CROSS-GENERIC",
    framework: "Cross",
    title: "Finding transversal",
    category: "General",
    typicalSeverity: "medium",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["user_attestation"],
    primaryActors: ["user"],
    compliCapabilities: ["solicită confirmarea dovezii"],
    userResponsibilities: ["atestează sau încarcă dovada"],
    requiredEvidenceKinds: ["confirmation"],
    autoRecheck: "no",
    closingRule: "confirmare prezentă",
  },
  "HR-001": {
    findingTypeId: "HR-001",
    framework: "Codul Muncii",
    title: "Fișe de post lipsă sau incomplete",
    category: "HR",
    typicalSeverity: "medium",
    signalTypes: ["questionnaire"],
    resolutionModes: ["in_app_full"],
    primaryActors: ["user", "compli"],
    compliCapabilities: ["generează fișa de post pe baza datelor firmei", "pre-completează structura Art. 17"],
    userResponsibilities: ["completează titlul postului și atribuțiile specifice", "verifică cu HR/managementul"],
    requiredEvidenceKinds: ["generated_document"],
    autoRecheck: "no",
    closingRule: "fișă de post generată, confirmată și salvată la dosar",
  },
  "HR-002": {
    findingTypeId: "HR-002",
    framework: "Codul Muncii",
    title: "Regulament intern lipsă sau incomplet",
    category: "HR",
    typicalSeverity: "medium",
    signalTypes: ["questionnaire"],
    resolutionModes: ["in_app_full"],
    primaryActors: ["user", "compli"],
    compliCapabilities: ["generează regulament intern conform Art. 241-246", "include capitolele obligatorii"],
    userResponsibilities: ["personalizează programul și politicile specifice", "aduce la cunoștința angajaților"],
    requiredEvidenceKinds: ["generated_document"],
    autoRecheck: "no",
    closingRule: "regulament generat, confirmat și confirmare luare la cunoștință",
  },
  "HR-003": {
    findingTypeId: "HR-003",
    framework: "Codul Muncii",
    title: "REGES / Revisal neconform sau neverificat",
    category: "HR",
    typicalSeverity: "high",
    signalTypes: ["questionnaire"],
    resolutionModes: ["in_app_guided"],
    primaryActors: ["user", "compli"],
    compliCapabilities: ["generează brief corecție pentru contabil", "include checklist verificare și termene ITM"],
    userResponsibilities: ["trimite brief-ul la contabil", "obține export Revisal actualizat ca dovadă"],
    requiredEvidenceKinds: ["generated_document", "uploaded_file"],
    autoRecheck: "no",
    closingRule: "brief trimis + export Revisal primit ca dovadă",
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RESOLVE FLOW RECIPES — Flow UX per finding type
// ─────────────────────────────────────────────────────────────────────────────

const RESOLVE_FLOW_RECIPES: Record<string, ResolveFlowRecipe> = {
  "GDPR-001": {
    findingTypeId: "GDPR-001",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Generează acum",
    secondaryCTA: "Am deja documentul",
    whatUserSees:
      "Nu ai o politică de confidențialitate potrivită. Putem genera una pe baza datelor firmei tale.",
    whatCompliDoes:
      "Deschide generatorul, precompleteată ce știe, leagă artefactul de finding.",
    whatUserMustDo: "Confirmă findingul, apoi completezi datele reale și generezi documentul.",
    closeCondition: "Document generat, confirmat și salvat la dosar.",
    revalidationTriggers: ["website schimbat", "date firmă schimbate", ">6-12 luni"],
  },
  "GDPR-002": {
    findingTypeId: "GDPR-002",
    initialFlowState: "need_your_input",
    primaryCTA: "Actualizează acum",
    secondaryCTA: "Vezi diferențele",
    whatUserSees:
      "Politica existentă pare prea generică și nu reflectă complet activitatea firmei.",
    whatCompliDoes: "Evidențiază golurile și deschide update flow.",
    whatUserMustDo: "Completează diferențele reale.",
    closeCondition: "Document actualizat și confirmat.",
    revalidationTriggers: ["rescan website", "furnizori noi", "dată review expirată"],
  },
  "GDPR-003": {
    findingTypeId: "GDPR-003",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Generează acum",
    secondaryCTA: "Analizează site-ul din nou",
    whatUserSees:
      "Ai nevoie de o politică de cookies pentru trackerele detectate pe site.",
    whatCompliDoes: "Generează draft bazat pe site scan.",
    whatUserMustDo: "Confirmă findingul, apoi verifici draftul și publici politica.",
    closeCondition: "Document publicat și salvat.",
    revalidationTriggers: ["trackere noi", "site schimbat"],
  },
  "GDPR-005": {
    findingTypeId: "GDPR-005",
    initialFlowState: "external_action_required",
    primaryCTA: "Corectează bannerul",
    secondaryCTA: "Vezi de ce contează",
    whatUserSees:
      "Bannerul de cookies nu pare să colecteze consimțământ valid.",
    whatCompliDoes: "Explică ce lipsește în banner și cere reverificare.",
    whatUserMustDo: "Corectează implementarea reală și revino cu dovada.",
    closeCondition: "Screenshot + rescan curat.",
    revalidationTriggers: ["modificări website", "trackere noi"],
  },
  "GDPR-010": {
    findingTypeId: "GDPR-010",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Adaugă DPA",
    secondaryCTA: "Nu folosim acest vendor pentru date personale",
    whatUserSees:
      "Furnizorul pare să proceseze date pentru tine și nu avem un DPA atașat.",
    whatCompliDoes: "Propune DPA / link / template și deschide upload.",
    whatUserMustDo: "Confirmă findingul, apoi completezi relația reală și generezi sau semnezi DPA-ul.",
    closeCondition: "DPA prezent și confirmat.",
    revalidationTriggers: ["expirare DPA", "vendor schimbat"],
  },
  "GDPR-011": {
    findingTypeId: "GDPR-011",
    initialFlowState: "need_your_input",
    primaryCTA: "Deschide pachetul vendor",
    secondaryCTA: "Vezi ce pregătește",
    whatUserSees:
      "Nu avem încă documentația minimă și review-ul clar pentru furnizorii externi relevanți.",
    whatCompliDoes:
      "Deschide modulul Vendor Review și pregătește pachetul de solicitare, checklistul de evaluare și pașii de follow-up.",
    whatUserMustDo:
      "Revizuiești pachetul, pornești cel puțin un vendor review pentru un furnizor relevant și confirmi urma reală de solicitare sau follow-up.",
    closeCondition: "Vendor Pack revizuit și primul review vendor pornit cu urmă clară.",
    revalidationTriggers: ["vendor nou", "schimbare contractuală", "review periodic"],
  },
  "GDPR-012": {
    findingTypeId: "GDPR-012",
    initialFlowState: "need_your_input",
    primaryCTA: "Deschide pachetul DSAR",
    secondaryCTA: "Vezi ce pregătește",
    whatUserSees:
      "Nu avem încă un proces clar pentru cereri de acces, ștergere și celelalte drepturi GDPR.",
    whatCompliDoes:
      "Deschide modulul DSAR și pregătește procedura, registrul și playbook-ul minim de care ai nevoie pentru a porni corect.",
    whatUserMustDo:
      "Revizuiești pachetul, desemnezi responsabilul și confirmi că registrul și procedura vor fi folosite în practică.",
    closeCondition: "Pachet DSAR revizuit și urmă clară salvată în cockpit.",
    revalidationTriggers: ["proces nou", "sistem nou", "review periodic"],
  },
  "GDPR-013": {
    findingTypeId: "GDPR-013",
    initialFlowState: "need_your_input",
    primaryCTA: "Deschide cazul",
    secondaryCTA: "Vezi termenul",
    whatUserSees:
      "Ai o cerere activă de acces la date cu termen legal.",
    whatCompliDoes: "Creează cazul, calculează deadline-ul, generează draft.",
    whatUserMustDo: "Verifică identitatea și trimite răspunsul.",
    closeCondition: "Dovada trimiterii + status responded.",
    revalidationTriggers: [],
  },
  "GDPR-014": {
    findingTypeId: "GDPR-014",
    initialFlowState: "need_your_input",
    primaryCTA: "Gestionează cererea",
    secondaryCTA: "Vezi ce trebuie să trimiți",
    whatUserSees:
      "Ai o cerere activă de ștergere care cere răspuns și acțiune operațională.",
    whatCompliDoes: "Structurează cazul, pregătește handoff-ul DSAR și păstrează urma pentru dosar.",
    whatUserMustDo: "Execută ștergerea reală și trimite răspunsul către persoana vizată.",
    closeCondition: "Dovada răspunsului și confirmarea execuției.",
    revalidationTriggers: [],
  },
  "GDPR-016": {
    findingTypeId: "GDPR-016",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Definește retenția",
    secondaryCTA: "Vezi categoriile afectate",
    whatUserSees:
      "Nu este clar cât păstrezi anumite categorii de date și cum dovedești ștergerea la expirare.",
    whatCompliDoes:
      "Generează o politică și matrice de retenție pe care o legăm direct de finding ca dovadă de bază.",
    whatUserMustDo: "Confirmă findingul, apoi completezi duratele reale și generezi matricea de retenție.",
    closeCondition: "Matrice de retenție salvată și confirmată.",
    revalidationTriggers: ["proces nou", "categorie nouă de date", "review periodic"],
  },
  "GDPR-017": {
    findingTypeId: "GDPR-017",
    initialFlowState: "external_action_required",
    primaryCTA: "Confirmă ștergerea",
    secondaryCTA: "Vezi dovada cerută",
    whatUserSees:
      "Ai regula de retenție, dar nu avem încă dovada că ștergerea sau anonimizarea se execută în practică.",
    whatCompliDoes:
      "Spune ce urmă operațională trebuie să rămână la dosar și păstrează cazul sub monitorizare după execuție.",
    whatUserMustDo:
      "Rulează ștergerea sau anonimizarea și lasă un log, export sau screenshot verificabil.",
    closeCondition: "Log, export sau screenshot de control salvat la dosar.",
    revalidationTriggers: ["proces nou", "sistem nou", "review periodic"],
  },
  "GDPR-019": {
    findingTypeId: "GDPR-019",
    initialFlowState: "external_action_required",
    primaryCTA: "Deschide flow-ul de breach",
    secondaryCTA: "Vezi ce înseamnă",
    whatUserSees:
      "Acest incident poate necesita notificare către ANSPDCP în 72h.",
    whatCompliDoes:
      "Deschide incidentul corect, scoate în față formularul ANSPDCP și te întoarce în cockpit cu dovada pregătită.",
    whatUserMustDo:
      "Completează conținutul obligatoriu, trimite manual notificarea sau documentează de ce nu este necesară.",
    closeCondition: "Notificare trimisă sau raționament complet documentat.",
    revalidationTriggers: ["doar dacă incidentul evoluează"],
  },
  "GDPR-020": {
    findingTypeId: "GDPR-020",
    initialFlowState: "external_action_required",
    primaryCTA: "Pregătește baseline-ul contractual",
    secondaryCTA: "Vezi dovada cerută",
    whatUserSees:
      "Nu avem încă un baseline contractual clar pentru clienți și furnizori, iar cazul nu se poate închide doar prin confirmare.",
    whatCompliDoes:
      "Ține cazul în cockpit până când documentezi ce template-uri există, unde sunt salvate și ce urmă contractuală poți arăta la audit.",
    whatUserMustDo:
      "Pregătește sau actualizează template-urile contractuale, apoi notează explicit unde sunt salvate, pentru ce relații le folosești și ce ai verificat cu juristul sau responsabilul intern.",
    closeCondition: "Template-uri contractuale pregătite și urmă clară salvată în cockpit.",
    revalidationTriggers: ["model contractual schimbat", "jurisdicție nouă", "review contractual periodic"],
  },
  "GDPR-021": {
    findingTypeId: "GDPR-021",
    initialFlowState: "need_your_input",
    primaryCTA: "Deschide pachetul HR",
    secondaryCTA: "Vezi ce pregătește",
    whatUserSees:
      "Nu avem încă un set clar de fișe de post și nici o urmă coerentă despre rolurile care trebuie acoperite.",
    whatCompliDoes:
      "Deschide suprafața Documente cu pachetul HR pregătit: modelul de fișă, inventarul de roluri și checklistul de rollout.",
    whatUserMustDo:
      "Revizuiești pachetul, confirmi rolurile reale, apoi adaptezi și semnezi fișele de post pentru pozițiile relevante.",
    closeCondition: "Pachetul HR este revizuit și există urmă clară pentru rollout-ul fișelor de post.",
    revalidationTriggers: ["rol nou", "schimbare de organigramă", "review HR periodic"],
  },
  "GDPR-OPS": {
    findingTypeId: "GDPR-OPS",
    initialFlowState: "external_action_required",
    primaryCTA: "Aplică măsura și lasă dovada",
    secondaryCTA: "Vezi dovada cerută",
    whatUserSees: "Riscul are nevoie de aplicare reală și urmă clară.",
    whatCompliDoes: "Ține cazul în cockpit și cere dovada operațională potrivită.",
    whatUserMustDo: "Aplică măsura în procesul real și notează clar ce ai făcut, unde și cu ce urmă verificabilă.",
    closeCondition: "Dovada operațională este salvată în cockpit.",
    revalidationTriggers: ["review periodic", "schimbare de proces"],
  },
  "NIS2-001": {
    findingTypeId: "NIS2-001",
    initialFlowState: "need_your_input",
    primaryCTA: "Verifică eligibilitatea",
    secondaryCTA: "Vezi de ce contează",
    whatUserSees: "Nu este clar dacă firma ta intră sub NIS2.",
    whatCompliDoes: "Rulează wizardul de eligibilitate.",
    whatUserMustDo: "Completează datele cerute.",
    closeCondition: "Eligibilitate salvată.",
    revalidationTriggers: ["sector / dimensiune / activitate schimbată"],
  },
  "NIS2-005": {
    findingTypeId: "NIS2-005",
    initialFlowState: "need_your_input",
    primaryCTA: "Începe evaluarea",
    secondaryCTA: "Vezi ce conține",
    whatUserSees: "Nu avem încă o evaluare NIS2 pentru firma ta.",
    whatCompliDoes: "Deschide assessment-ul și prefill-ul unde există.",
    whatUserMustDo: "Răspunde și confirmă.",
    closeCondition: "Assessment salvat.",
    revalidationTriggers: ["review periodic"],
  },
  "NIS2-015": {
    findingTypeId: "NIS2-015",
    initialFlowState: "external_action_required",
    primaryCTA: "Generează și continuă",
    secondaryCTA: "Vezi deadline-ul",
    whatUserSees: "Incidentul cere Early Warning.",
    whatCompliDoes: "Generează draftul și countdown-ul.",
    whatUserMustDo: "Trimite manual și pune referința.",
    closeCondition: "Dovada trimiterii prezentă.",
    revalidationTriggers: ["dacă lipsește referința", "progres incident"],
  },
  "AI-001": {
    findingTypeId: "AI-001",
    initialFlowState: "need_your_input",
    primaryCTA: "Adaugă în inventar",
    secondaryCTA: "Nu este AI / nu se aplică",
    whatUserSees: "Am detectat un posibil sistem AI care nu este în inventar.",
    whatCompliDoes: "Propune intrarea și precompleteată câmpurile.",
    whatUserMustDo: "Confirmă și completează.",
    closeCondition: "Sistem salvat în inventar.",
    revalidationTriggers: ["tool nou", "detecție nouă"],
  },
  "AI-005": {
    findingTypeId: "AI-005",
    initialFlowState: "need_your_input",
    primaryCTA: "Definește oversight-ul",
    secondaryCTA: "Vezi modelul recomandat",
    whatUserSees:
      "Nu este clar cine aprobă sau supraveghează acest sistem AI.",
    whatCompliDoes: "Generează structura minimă de oversight.",
    whatUserMustDo: "Confirmă findingul, apoi completezi persoanele și regulile de oversight.",
    closeCondition: "Oversight definit și salvat.",
    revalidationTriggers: ["reorganizare", "sistem nou"],
  },
  "AI-OPS": {
    findingTypeId: "AI-OPS",
    initialFlowState: "external_action_required",
    primaryCTA: "Aplică regula AI și lasă dovada",
    secondaryCTA: "Vezi dovada cerută",
    whatUserSees: "Riscul AI cere aplicare reală și urmă clară.",
    whatCompliDoes: "Ține cazul în cockpit și cere dovada operațională a regulii AI aplicate.",
    whatUserMustDo: "Aplică regula AI în procesul real și notează clar ce ai restricționat, instruit sau actualizat.",
    closeCondition: "Dovada operațională este salvată în cockpit.",
    revalidationTriggers: ["tool nou", "schimbare de proces", "review periodic"],
  },
  "EF-001": {
    findingTypeId: "EF-001",
    initialFlowState: "external_action_required",
    primaryCTA: "Activează SPV",
    secondaryCTA: "Vezi pașii",
    whatUserSees: "Nu avem dovada că SPV este activ și operațional.",
    whatCompliDoes: "Explică fluxul și cere dovada activării.",
    whatUserMustDo: "Activează și confirmă.",
    closeCondition: "Dovada activării.",
    revalidationTriggers: ["dacă accesul expiră", "schimbări SPV"],
  },
  "EF-003": {
    findingTypeId: "EF-003",
    initialFlowState: "external_action_required",
    primaryCTA: "Vezi ce trebuie corectat",
    secondaryCTA: "Vezi eroarea exactă",
    whatUserSees: "O factură a fost respinsă de ANAF.",
    whatCompliDoes: "Afișează motivul și remedierea probabilă.",
    whatUserMustDo: "Corectează în softul de facturare.",
    closeCondition: "Status nou valid sau dovada retransmiterii.",
    revalidationTriggers: ["până la validare"],
  },
  "EF-004": {
    findingTypeId: "EF-004",
    initialFlowState: "external_action_required",
    primaryCTA: "Verifică statusul în SPV",
    secondaryCTA: "Ce înseamnă în prelucrare",
    whatUserSees: "O factură este blocată în prelucrare ANAF de prea mult timp.",
    whatCompliDoes: "Aceasta nu este o respingere — factura e în coada ANAF. Verificăm dacă s-a blocat sau e întârziere normală.",
    whatUserMustDo: "Verifică statusul în SPV ANAF. Dacă depășit 72h, retransmite sau contactează ANAF.",
    closeCondition: "Status final confirmat din SPV: ok sau respinsă (cu acțiune corectivă).",
    revalidationTriggers: ["după 24h dacă statusul nu se schimbă", "după retransmitere"],
  },
  "EF-005": {
    findingTypeId: "EF-005",
    initialFlowState: "external_action_required",
    primaryCTA: "Transmite spre SPV ANAF",
    secondaryCTA: "Validează XML înainte",
    whatUserSees: "O factură a fost generată local dar nu a fost niciodată transmisă spre ANAF.",
    whatCompliDoes: "Factura există în sistem dar ANAF nu o știe. TVA-ul nu poate fi dedus până la transmitere.",
    whatUserMustDo: "Transmite factura XML spre SPV ANAF. Validează XML-ul cu validatorul e-Factura înainte de upload.",
    closeCondition: "Confirmare transmitere și acceptare în SPV ANAF.",
    revalidationTriggers: ["dacă termenul de 5 zile lucrătoare se apropie", "la fiecare run de reconciliere"],
  },
  "EF-006": {
    findingTypeId: "EF-006",
    initialFlowState: "external_action_required",
    primaryCTA: "Corectează datele clientului",
    secondaryCTA: "Verifică CUI la ANAF",
    whatUserSees: "Datele de identificare ale clientului (CUI sau denumire) sunt invalide sau lipsesc din factură.",
    whatCompliDoes: "Aceasta este o eroare buyer-side — problema este la datele clientului din factură, nu la structura XML.",
    whatUserMustDo: "Verifică CUI-ul clientului la anaf.ro/verificare-cif. Corectează în softul de facturare și retransmite.",
    closeCondition: "Factură cu date client corecte transmisă și confirmată în SPV.",
    revalidationTriggers: ["la fiecare factură pentru același client", "dacă clientul schimbă datele fiscale"],
  },
  "SYS-001": {
    findingTypeId: "SYS-001",
    initialFlowState: "evidence_required",
    primaryCTA: "Adaugă dovada",
    whatUserSees: "Spui că problema este rezolvată, dar nu avem dovada.",
    whatCompliDoes: "Cere artefactul lipsă.",
    whatUserMustDo: "Încarcă dovada.",
    closeCondition: "Dovadă prezentă și legată de finding.",
    revalidationTriggers: ["la lipsa artefactului"],
  },
  "SYS-002": {
    findingTypeId: "SYS-002",
    initialFlowState: "needs_revalidation",
    primaryCTA: "Reconfirmă acum",
    secondaryCTA: "Vezi dovada veche",
    whatUserSees:
      "O dovadă sau un document din dosar necesită reconfirmare.",
    whatCompliDoes:
      "Ridică finding de revalidare și arată diferența față de documentul anterior.",
    whatUserMustDo: "Reconfirmă sau reînnoiește dovada.",
    closeCondition: "Dată nouă de review salvată.",
    revalidationTriggers: ["la expirarea review-ului", "politică învechiată"],
  },
  // ── HR Pack — Sprint 16/16 ──────────────────────────────────────────────────
  "HR-001": {
    findingTypeId: "HR-001",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Generează Fișa de Post",
    secondaryCTA: "Ce conține",
    whatUserSees: "Fișele de post lipsesc sau sunt incomplete — sunt obligatorii conform Codului Muncii Art. 17.",
    whatCompliDoes: "Generăm fișa de post cu structura legală completă. Tu completezi titlul, departamentul și atribuțiile specifice.",
    whatUserMustDo: "Personalizează, revizuiește cu HR și semnează cu angajatul.",
    closeCondition: "Fișă generată, confirmată și salvată la Dosar.",
    revalidationTriggers: ["la schimbarea rolului", "la modificarea structurii organizaționale"],
  },
  "HR-002": {
    findingTypeId: "HR-002",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Generează Regulament Intern",
    secondaryCTA: "De ce e obligatoriu",
    whatUserSees: "Regulamentul intern lipsește — este obligatoriu conform Codului Muncii Art. 241-246.",
    whatCompliDoes: "Generăm regulament cu toate capitolele obligatorii (program, concedii, disciplină, SSM, GDPR, whistleblowing).",
    whatUserMustDo: "Personalizează programul, regulile specifice și asigură confirmarea luării la cunoștință de fiecare angajat.",
    closeCondition: "Regulament generat, confirmat și cu dovadă de comunicare la angajați.",
    revalidationTriggers: ["la schimbarea legislației muncii", "anual recomandat"],
  },
  "HR-003": {
    findingTypeId: "HR-003",
    initialFlowState: "ready_to_generate",
    primaryCTA: "Generează Brief Corecție REGES",
    secondaryCTA: "Ce riscuri sunt",
    whatUserSees: "REGES/Revisal nu a fost verificat sau are neconcordanțe — amendă ITM: 5.000-10.000 RON/angajat.",
    whatCompliDoes: "Generăm un brief structurat cu checklist pentru contabilul tău: ce să verifice, termene legale și consecințe.",
    whatUserMustDo: "Trimite brief-ul la contabil. Când revine cu export Revisal actualizat, încarcă-l ca dovadă.",
    closeCondition: "Brief trimis + export Revisal primit și salvat la Dosar.",
    revalidationTriggers: ["la fiecare angajare/plecare", "la orice modificare contract"],
  },
  // Generic fallbacks
  "GDPR-GENERIC": {
    findingTypeId: "GDPR-GENERIC",
    initialFlowState: "need_your_input",
    primaryCTA: "Completează acum",
    whatUserSees: "Am detectat un risc GDPR care necesită atenție.",
    whatCompliDoes: "Ghidează remedierea și cere dovada potrivită.",
    whatUserMustDo: "Confirmă și atașează dovada.",
    closeCondition: "Confirmare și dovadă prezentă.",
    revalidationTriggers: ["review periodic"],
  },
  "NIS2-GENERIC": {
    findingTypeId: "NIS2-GENERIC",
    initialFlowState: "need_your_input",
    primaryCTA: "Completează acum",
    whatUserSees: "Am detectat un risc NIS2 care necesită atenție.",
    whatCompliDoes: "Ghidează evaluarea și remedierea.",
    whatUserMustDo: "Confirmă și atașează dovada.",
    closeCondition: "Confirmare și dovadă prezentă.",
    revalidationTriggers: ["review periodic"],
  },
  "EF-GENERIC": {
    findingTypeId: "EF-GENERIC",
    initialFlowState: "external_action_required",
    primaryCTA: "Vezi ce trebuie să faci",
    whatUserSees: "Am detectat un semnal fiscal care necesită acțiune.",
    whatCompliDoes: "Explică problema și pașii de remediere.",
    whatUserMustDo: "Corectează și adaugă dovada.",
    closeCondition: "Dovadă prezentă.",
    revalidationTriggers: ["semnale noi"],
  },
  "AI-GENERIC": {
    findingTypeId: "AI-GENERIC",
    initialFlowState: "need_your_input",
    primaryCTA: "Completează acum",
    whatUserSees: "Am detectat un risc AI Act care necesită atenție.",
    whatCompliDoes: "Ghidează evaluarea sistemului AI.",
    whatUserMustDo: "Confirmă și documentează.",
    closeCondition: "Confirmare și documentație prezentă.",
    revalidationTriggers: ["schimbare de use case", "sistem nou"],
  },
  "CROSS-GENERIC": {
    findingTypeId: "CROSS-GENERIC",
    initialFlowState: "evidence_required",
    primaryCTA: "Adaugă dovada",
    whatUserSees: "Există un gap de conformitate care necesită dovadă.",
    whatCompliDoes: "Solicită confirmarea dovezii.",
    whatUserMustDo: "Atestează sau încarcă dovada.",
    closeCondition: "Confirmare prezentă.",
    revalidationTriggers: ["la orice schimbare relevantă"],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RESOLUTION MODE BLOCK RULES — Blocks vizibile per mod de rezolvare
// ─────────────────────────────────────────────────────────────────────────────

const RESOLUTION_MODE_BLOCK_RULES: Record<ResolutionMode, ResolutionModeBlockRules> = {
  in_app_full: {
    resolutionMode: "in_app_full",
    generatorBlock: true,
    inputBlock: false,
    externalActionBlock: false,
    evidenceBlock: true,
    confirmationBlock: true,
    recheckBlock: false,
    revalidationBlock: false,
  },
  in_app_guided: {
    resolutionMode: "in_app_guided",
    generatorBlock: false,
    inputBlock: true,
    externalActionBlock: false,
    evidenceBlock: true,
    confirmationBlock: true,
    recheckBlock: false,
    revalidationBlock: false,
  },
  external_action: {
    resolutionMode: "external_action",
    generatorBlock: false,
    inputBlock: false,
    externalActionBlock: true,
    evidenceBlock: true,
    confirmationBlock: true,
    recheckBlock: true,
    revalidationBlock: false,
  },
  user_attestation: {
    resolutionMode: "user_attestation",
    generatorBlock: false,
    inputBlock: true,
    externalActionBlock: false,
    evidenceBlock: false,
    confirmationBlock: true,
    recheckBlock: false,
    revalidationBlock: false,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LABELS
// ─────────────────────────────────────────────────────────────────────────────

const UI_STATE_STATUS_LABELS: Record<CockpitUIState, { full: string; collapsed: string }> = {
  detected: { full: "Detectat", collapsed: "Nou" },
  need_your_input: { full: "Așteaptă informația ta", collapsed: "Așteaptă informația ta" },
  ready_to_generate: { full: "Gata de generat", collapsed: "Gata de generat" },
  external_action_required: { full: "Acțiune externă necesară", collapsed: "Acțiune externă necesară" },
  evidence_uploaded: { full: "Dovadă încărcată — în review", collapsed: "Dovadă încărcată" },
  rechecking: { full: "Se reverifică automat", collapsed: "Reverificăm" },
  resolved: { full: "Rezolvat", collapsed: "Rezolvat" },
  needs_revalidation: { full: "Necesită revalidare", collapsed: "Necesită revalidare" },
  false_positive: { full: "Marcat ca nevalid", collapsed: "Marcat ca nevalid" },
}

const EVIDENCE_KIND_LABELS: Record<string, string> = {
  generated_document: "Document generat și aprobat",
  confirmation: "Confirmare explicită",
  vendor_document: "Document de la vendor (DPA, contract)",
  uploaded_file: "Fișier încărcat",
  log_export: "Export log / jurnal operațional",
  screenshot: "Screenshot dovadă",
  xml: "Fișier XML factură",
  public_link: "Link public verificabil",
  official_reference: "Referință oficială (număr corespondență)",
  manual_attestation: "Atestare manuală",
  email_sent: "Email trimis (dovadă)",
  note: "Notă explicativă",
  system_recheck: "Reverificare automată sistem",
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. HELPERS (private)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_TO_FRAMEWORK: Record<string, FindingFramework> = {
  GDPR: "GDPR",
  NIS2: "NIS2",
  E_FACTURA: "eFactura",
  EU_AI_ACT: "AI Act",
}

function deriveTypeId(record: ScanFinding, framework: FindingFramework): string {
  const id = record.id
  const docType = record.suggestedDocumentType ?? ""
  const ruleId = record.provenance?.ruleId ?? ""
  const title = record.title.toLowerCase()
  const detail = record.detail.toLowerCase()
  const evidence = (record.evidenceRequired ?? "").toLowerCase()
  const remediation = (record.remediationHint ?? "").toLowerCase()

  // Specific id pattern mappings first
  if (id === "dsar-no-procedure") return "GDPR-013"
  if (id === "dsar-erasure-active") return "GDPR-014"
  if (id === "intake-gdpr-dsar") return "GDPR-012"
  if (id === "intake-hr-job-descriptions") return "GDPR-021"
  if (id === "intake-vendor-missing-docs") return "GDPR-011"
  if (id.startsWith(ANSPDCP_FINDING_PREFIX)) return "GDPR-019"
  if (ruleId === "GDPR-RET-001") return "GDPR-016"
  if (
    id === "intake-b2c-privacy" ||
    id === "intake-gdpr-privacy-policy" ||
    id === "intake-site-privacy-policy"
  ) {
    return "GDPR-001"
  }
  if (id === "contracts-baseline" || id === "intake-contracts-baseline") return "GDPR-020"
  if (id === "intake-vendor-no-dpa") return "GDPR-010"
  if (id === "intake-site-cookies") return "GDPR-005"
  if (id.startsWith("intake-") && !docType) {
    if (framework === "GDPR") return "GDPR-OPS"
    if (framework === "AI Act") return "AI-OPS"
  }
  if (id === "saft-d406-registration") return "EF-001"
  // SPV-specific findings from /api/fiscal/spv-check → EF-001
  if (
    framework === "eFactura" &&
    (
      id.startsWith("spv-missing-") ||
      (id.startsWith("spv-") && !id.includes("ok")) ||
      title.includes("înregistrare spv lipsă") ||
      title.includes("inregistrare spv lipsa") ||
      title.includes("spv neverificat") ||
      title.includes("token spv expirat") ||
      title.includes("acces spv lipsă") ||
      title.includes("acces spv lipsa") ||
      title.includes("spv lipsă") ||
      title.includes("spv lipsa") ||
      (
        title.includes("spv") &&
        (
          detail.includes("nu este înregistrat") ||
          detail.includes("nu este inregistrat") ||
          detail.includes("neînregistrat") ||
          detail.includes("neinregistrat") ||
          detail.includes("nu am putut verifica") ||
          detail.includes("neverificat") ||
          detail.includes("token expirat") ||
          detail.includes("acces lipsă") ||
          detail.includes("acces lipsa")
        )
      )
    )
  ) {
    return "EF-001"
  }
  if (id.startsWith("saft-")) return "EF-GENERIC"
  if (id === "nis2-finding-eligibility") return "NIS2-001"
  if (id.startsWith("nis2-finding-") && docType !== "nis2-incident-response") return "NIS2-005"

  // processing-delayed findings → EF-004 (check before EF-003 to avoid misclassification)
  if (
    framework === "eFactura" &&
    (
      title.includes("prelucrare blocată") ||
      title.includes("prelucrare blocata") ||
      detail.includes("prelucrare anaf de peste") ||
      (detail.includes("în prelucrare") && (detail.includes("72") || detail.includes("48") || detail.includes("ore"))) ||
      (detail.includes("prelucrare") && detail.includes("blocat"))
    )
  ) {
    return "EF-004"
  }

  // unsubmitted findings → EF-005
  if (
    framework === "eFactura" &&
    (
      title.includes("netransmisă spv") ||
      title.includes("netransmisa spv") ||
      detail.includes("netransmisă spre spv") ||
      detail.includes("netransmisa spre spv") ||
      detail.includes("generată local") ||
      detail.includes("generata local") ||
      (detail.includes("netransmis") && detail.includes("spv"))
    )
  ) {
    return "EF-005"
  }

  // buyer-side / client identification risk → EF-006
  if (
    framework === "eFactura" &&
    (
      title.includes("date identificare client") ||
      (detail.includes("c002") || detail.includes("v008")) ||
      (detail.includes("accountingcustomerparty") && (detail.includes("invalid") || detail.includes("lipsă") || detail.includes("lipsa"))) ||
      (
        (detail.includes("client") || detail.includes("cumparător") || detail.includes("cumparator")) &&
        (detail.includes("cui") || detail.includes("cnp")) &&
        (detail.includes("invalid") || detail.includes("lipsă") || detail.includes("lipsa") || detail.includes("neidentificat"))
      )
    )
  ) {
    return "EF-006"
  }

  if (
    framework === "eFactura" &&
    (
      title.includes("factură anaf respinsă") ||
      title.includes("factura anaf respinsa") ||
      title.includes("respinsă anaf") ||
      title.includes("respinsa anaf") ||
      title.includes("eroare xml") ||
      detail.includes("respinsă de spv anaf") ||
      detail.includes("respinsa de spv anaf") ||
      detail.includes("taxtotal") ||
      detail.includes("codul de eroare e1") ||
      id.startsWith("demo-efactura-")
    )
  ) {
    return "EF-003"
  }

  if (
    framework === "GDPR" &&
    (
      title.includes("proces dsar") ||
      (title.includes("procedur") && title.includes("dsar")) ||
      detail.includes("proces dsar") ||
      (detail.includes("procedur") && detail.includes("dsar"))
    )
  ) {
    return "GDPR-012"
  }

  if (
    framework === "GDPR" &&
    (
      id.includes("dsar-erasure") ||
      ((title.includes("cerere") || detail.includes("cerere")) &&
        (title.includes("ștergere") ||
          title.includes("stergere") ||
          title.includes("erasure") ||
          detail.includes("ștergere") ||
          detail.includes("stergere") ||
          detail.includes("erasure")))
    )
  ) {
    return "GDPR-014"
  }

  if (
    framework === "GDPR" &&
    (
      id.includes("deletion-proof") ||
      id.includes("anonymization-proof") ||
      (
        (
          title.includes("șterger") ||
          title.includes("sterg") ||
          title.includes("anonimiz") ||
          detail.includes("șterger") ||
          detail.includes("sterg") ||
          detail.includes("anonimiz") ||
          remediation.includes("șterger") ||
          remediation.includes("sterg") ||
          remediation.includes("anonimiz")
        ) &&
        (
          title.includes("neconfirm") ||
          detail.includes("log de ștergere") ||
          detail.includes("log de stergere") ||
          detail.includes("dovadă de rulare") ||
          detail.includes("dovada de rulare") ||
          detail.includes("control operațional") ||
          detail.includes("control operational") ||
          evidence.includes("log de ștergere") ||
          evidence.includes("log de stergere") ||
          evidence.includes("dovadă de rulare") ||
          evidence.includes("dovada de rulare") ||
          remediation.includes("log de ștergere") ||
          remediation.includes("log de stergere") ||
          remediation.includes("dovadă de rulare") ||
          remediation.includes("dovada de rulare") ||
          remediation.includes("execu") ||
          remediation.includes("control operațional") ||
          remediation.includes("control operational")
        )
      )
    )
  ) {
    return "GDPR-017"
  }

  if (
    framework === "GDPR" &&
    (
      title.includes("reten") ||
      detail.includes("reten") ||
      remediation.includes("reten") ||
      title.includes("retention") ||
      detail.includes("retention")
    )
  ) {
    return "GDPR-016"
  }

  if (
    framework === "GDPR" &&
    (
      title.includes("cookies consent") ||
      title.includes("cookie consent") ||
      title.includes("banner de cookies") ||
      detail.includes("consimțământ explicit pentru cookies") ||
      detail.includes("consimtamant explicit pentru cookies") ||
      detail.includes("banner de consent")
    )
  ) {
    return "GDPR-005"
  }

  if (
    (
      title.includes("necesită revalidare") ||
      title.includes("dovadă veche") ||
      title.includes("dovada veche") ||
      detail.includes("trebuie reconfirmată") ||
      detail.includes("trebuie reconfirmata") ||
      evidence.includes("review") ||
      remediation.includes("reconfirm")
    ) &&
    framework !== "eFactura"
  ) {
    return "SYS-002"
  }

  // Document type mappings — these override generic framework fallbacks
  if (docType === "privacy-policy") return "GDPR-001"
  if (docType === "cookie-policy") return "GDPR-003"
  if (docType === "dpa") return "GDPR-010"
  if (docType === "retention-policy") return "GDPR-016"
  if (docType === "nis2-incident-response") return "NIS2-015"
  if (docType === "ai-governance") return "AI-005"

  // Framework-level fallbacks
  switch (framework) {
    case "GDPR": return "GDPR-GENERIC"
    case "NIS2": return "NIS2-GENERIC"
    case "eFactura": return "EF-GENERIC"
    case "AI Act": return "AI-GENERIC"
    default: return "CROSS-GENERIC"
  }
}

function inferVendorContext(
  record: ScanFinding,
  findingTypeId: string
): CockpitRecipe["vendorContext"] | undefined {
  const supportsVendorContext =
    findingTypeId === "GDPR-010" ||
    (findingTypeId === "NIS2-GENERIC" &&
      isNis2SupplyChainFinding(record) &&
      !deriveNis2GovernanceFocus(record) &&
      !deriveNis2MaturityFocus(record))

  if (!supportsVendorContext) return undefined

  const candidates = [
    record.title,
    record.detail,
    record.remediationHint,
    [record.title, record.detail].filter(Boolean).join(" · "),
  ].filter(Boolean) as string[]

  const directMatches = new Map<string, CockpitRecipe["vendorContext"]>()

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase()
    for (const vendor of listLibraryVendors()) {
      const vendorNeedles = Array.from(new Set([vendor.canonicalName, ...vendor.aliases]))
      const matchedAlias = vendorNeedles.find((alias) => candidateLower.includes(alias.toLowerCase()))
      if (!matchedAlias) continue

      if (!directMatches.has(vendor.id)) {
        directMatches.set(vendor.id, {
          vendorId: vendor.id,
          vendorName: vendor.canonicalName,
          dpaUrl: vendor.dpaUrl,
          matchConfidence: 0.9,
          matchType: "contains",
        })
      }
    }
  }

  if (findingTypeId === "NIS2-GENERIC" && directMatches.size > 1) {
    return undefined
  }

  const firstDirectMatch = directMatches.values().next().value
  if (firstDirectMatch) return firstDirectMatch

  const match = candidates
    .map((candidate) => fingerprintMatch(candidate))
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((left, right) => right.confidence - left.confidence)[0]

  if (!match) return undefined
  if (match.matchType === "fuzzy" && match.confidence < 0.45) return undefined

  return {
    vendorId: match.vendor.id,
    vendorName: match.vendor.canonicalName,
    dpaUrl: match.vendor.dpaUrl,
    matchConfidence: match.confidence,
    matchType: match.matchType,
  }
}

function resolveDocumentFlowState(
  record: ScanFinding,
  artifacts?: FindingArtifacts
): FindingDocumentFlowState {
  if (artifacts?.documentFlowState) return artifacts.documentFlowState
  const doc = artifacts?.linkedGeneratedDocument
  if (doc?.approvalStatus === "approved_as_evidence") return "attached_as_evidence"
  if (doc?.approvalStatus === "draft") return "draft_ready"
  if (getRuntimeCockpitDocumentType(record)) return "draft_missing"
  return "not_required"
}

function getCollapsedPresentation(
  uiState: CockpitUIState,
  primaryCTA: string
): { collapsedStatusLabel: string; collapsedPrimaryCTA: string } {
  const labels = UI_STATE_STATUS_LABELS[uiState]

  const ctaOverrides: Partial<Record<CockpitUIState, string>> = {
    detected: "Vezi și începe",
    evidence_uploaded: "Vezi statusul",
    rechecking: "Vezi progresul",
    resolved: "Vezi dovada",
    false_positive: "Vezi motivul",
  }

  return {
    collapsedStatusLabel: labels.collapsed,
    collapsedPrimaryCTA: ctaOverrides[uiState] ?? primaryCTA,
  }
}

function buildVisibleBlocks(
  uiState: CockpitUIState,
  flow: ResolveFlowRecipe,
  findingType: FindingTypeDefinition,
  documentFlowState: FindingDocumentFlowState
): CockpitVisibleBlocks {
  const primaryMode = findingType.resolutionModes[0]
  const rules = RESOLUTION_MODE_BLOCK_RULES[primaryMode]
  const documentSupport = getDocumentSupportForFindingType(findingType.findingTypeId)
  const { collapsedPrimaryCTA, collapsedStatusLabel } = getCollapsedPresentation(
    uiState,
    flow.primaryCTA
  )

  const allBlocks: CockpitBlockKey[] = []
  const hasDocumentTrack = documentFlowState !== "not_required" && Boolean(documentSupport)
  const shouldShowGenerator =
    Boolean(documentSupport) &&
    (
      documentSupport?.mode === "assistive" ||
      rules.generatorBlock ||
      (primaryMode === "in_app_guided" &&
        (uiState === "ready_to_generate" || uiState === "evidence_uploaded" || hasDocumentTrack))
    )

  if (shouldShowGenerator) allBlocks.push("generator")
  if (rules.inputBlock) allBlocks.push("input")
  if (rules.externalActionBlock) allBlocks.push("external_action")
  if (rules.evidenceBlock) allBlocks.push("evidence")
  if (rules.confirmationBlock) allBlocks.push("confirmation")
  if (rules.recheckBlock && findingType.autoRecheck !== "no") allBlocks.push("recheck")
  if (flow.revalidationTriggers.length > 0) allBlocks.push("revalidation")
  allBlocks.push("audit_meta")

  const ABOVE_FOLD_KEYS: CockpitBlockKey[] = [
    "generator",
    "input",
    "external_action",
    "evidence",
  ]

  return {
    collapsedPrimaryCTA,
    collapsedStatusLabel,
    detailBlocks: allBlocks,
    aboveTheFoldBlocks: allBlocks.filter((b) => ABOVE_FOLD_KEYS.includes(b)),
    belowTheFoldBlocks: allBlocks.filter((b) => !ABOVE_FOLD_KEYS.includes(b)),
  }
}

function uiStateToFlowState(
  uiState: CockpitUIState,
  fallback: ResolveFlowState
): ResolveFlowState {
  const map: Partial<Record<CockpitUIState, ResolveFlowState>> = {
    detected: "detected",
    need_your_input: "need_your_input",
    ready_to_generate: "ready_to_generate",
    external_action_required: "external_action_required",
    evidence_uploaded: "evidence_required",
    rechecking: "evidence_required",
    needs_revalidation: "needs_revalidation",
    false_positive: "detected",
  }
  return map[uiState] ?? fallback
}

function getPrimaryCTAAction(
  uiState: CockpitUIState,
  primaryMode: ResolutionMode
): CockpitRecipe["primaryCTA"]["action"] {
  if (uiState === "needs_revalidation") return "revalidate"
  if (uiState === "rechecking") return "rescan"
  if (uiState === "evidence_uploaded") return "upload_evidence"

  switch (primaryMode) {
    case "in_app_full":
      return "open_generator"
    case "in_app_guided":
      return uiState === "ready_to_generate" ? "open_generator" : "confirm_and_generate"
    case "external_action":
      return "open_external_steps"
    case "user_attestation":
      return "confirm"
  }
}

function getSecondaryCTA(
  label?: string
): CockpitRecipe["secondaryCTA"] | undefined {
  if (!label) return undefined

  const actionMap: Record<string, CockpitRecipe["secondaryCTA"]> = {
    "Am deja documentul": { label, action: "already_have_evidence" },
    "Nu folosim acest vendor": { label, action: "skip_vendor" },
    "Nu este AI / nu se aplică": { label, action: "skip_vendor" },
    "Nu mai folosim acest vendor": { label, action: "skip_vendor" },
    "Vezi documentul vechi": { label, action: "show_old_document" },
    "Vezi dovada veche": { label, action: "show_old_document" },
  }

  for (const [key, val] of Object.entries(actionMap)) {
    if (label.includes(key)) return val
  }

  return { label, action: "show_requirements" }
}

function getDossierOutcome(primaryMode: ResolutionMode): string {
  switch (primaryMode) {
    case "in_app_full":
    case "in_app_guided":
      return "Documentul generat și aprobat intră în Dosar ca dovadă verificabilă."
    case "external_action":
      return "Dovada operațională (screenshot, referință oficială) se atașează la dosar."
    case "user_attestation":
      return "Atestarea documentează și confirmă conformitatea pentru audit."
  }
}

function deriveNis2IncidentId(record: ScanFinding): string | null {
  const candidates = [
    record.id,
    record.sourceDocument,
    record.title,
    record.detail,
    record.remediationHint,
    record.reasoning,
    record.sourceParagraph,
    record.provenance?.excerpt,
    record.provenance?.matchedKeyword,
    record.resolution?.problem,
    record.resolution?.action,
    record.resolution?.closureEvidence,
    record.resolution?.humanStep,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    const searchParamMatch = candidate.match(/(?:^|[?&])incidentId=([A-Za-z0-9-]+)/)
    if (searchParamMatch?.[1]) return searchParamMatch[1]

    const demoMatch = candidate.match(/\bdemo-incident-\d+\b/i)
    if (demoMatch?.[0]) return demoMatch[0]

    const uidMatch = candidate.match(/\b(?:incident-[a-z0-9]+-\d+|inc-[a-z0-9]{6,}|inc-\d+)\b/i)
    if (uidMatch?.[0] && uidMatch[0] !== "incident-response") return uidMatch[0]
  }

  return null
}

function isNis2SupplyChainFinding(record: ScanFinding): boolean {
  if (record.category !== "NIS2") return false

  const text = [
    record.title,
    record.detail,
    record.remediationHint,
    record.impactSummary,
    record.evidenceRequired,
    record.resolution?.problem,
    record.resolution?.action,
    record.resolution?.closureEvidence,
  ]
    .filter(Boolean)
    .join(" · ")
    .toLowerCase()

  return (
    text.includes("supply chain") ||
    text.includes("lanțul de aprovizionare") ||
    text.includes("lantul de aprovizionare") ||
    text.includes("furnizor") ||
    text.includes("vendor") ||
    text.includes("dpa") ||
    text.includes("cloud") ||
    text.includes("microsoft") ||
    text.includes("aws")
  )
}

type Nis2MaturityFocus =
  | "risk-management"
  | "incident-response"
  | "business-continuity"
  | "supply-chain"
  | "secure-development"
  | "audit-testing"
  | "basic-hygiene"
  | "cryptography"
  | "access-control"
  | "mfa"

type Nis2GovernanceFocus = "training" | "certification"

const NIS2_MATURITY_DOMAIN_MAP = new Map(
  MATURITY_DOMAINS.map((domain) => [domain.id, domain])
)

// Sprint 7 — evidence per control: dovezi specifice per domeniu NIS2 Art.21(2)
const NIS2_CONTROL_EVIDENCE: Record<string, readonly string[]> = {
  "risk-management": [
    "Politică de Management al Riscului Cibernetic semnată de management",
    "Evaluare de risc cibernetic documentată (cel puțin anuală)",
  ],
  "incident-response": [
    "Plan de Răspuns la Incidente semnat de management",
    "Incident înregistrat și analizat în modulul NIS2",
  ],
  "business-continuity": [
    "Plan BCP + DRP documentat și semnat",
    "Dovada testului de recuperare din backup (raport sau screenshot)",
  ],
  "supply-chain": [
    "Registru furnizori critici cu clauze de securitate NIS2 completat",
    "Contract furnizor cu clauze NIS2 Art.21(2)(d) atașat",
  ],
  "secure-development": [
    "Politică patch management și achiziții IT documentată",
    "Dovada actualizărilor de securitate recente (log sau screenshot)",
  ],
  "audit-testing": [
    "Raport pentest sau audit de securitate extern (cel puțin anual)",
    "Plan de remediere a vulnerabilităților identificate atașat",
  ],
  "basic-hygiene": [
    "Dovada training securitate pentru angajați (liste participanți sau certificate)",
    "Politică de igienă cibernetică documentată",
  ],
  "cryptography": [
    "Screenshot sau raport HTTPS/TLS activ pe serviciile expuse",
    "Politică de criptare și protecție date sensibile documentată",
  ],
  "access-control": [
    "Politică control acces (least-privilege) documentată și semnată",
    "Procedura de offboarding documentată cu dovada revocării accesului",
  ],
  "mfa": [
    "Screenshot MFA activat pe conturi critice (admin, email business, acces remote)",
    "Politică de autentificare cu MFA documentată și atașată",
  ],
}

function getNis2Text(record: ScanFinding) {
  return [
    record.id,
    record.title,
    record.detail,
    record.remediationHint,
    record.impactSummary,
    record.evidenceRequired,
    record.sourceDocument,
    record.legalReference,
    record.reasoning,
    record.resolution?.problem,
    record.resolution?.action,
    record.resolution?.closureEvidence,
  ]
    .filter(Boolean)
    .join(" · ")
    .toLowerCase()
}

function getNis2GovernanceText(record: ScanFinding) {
  return [
    record.id,
    record.title,
    record.detail,
    record.sourceDocument,
    record.legalReference,
    record.reasoning,
  ]
    .filter(Boolean)
    .join(" · ")
    .toLowerCase()
}

function deriveNis2GovernanceFocus(record: ScanFinding): Nis2GovernanceFocus | null {
  if (record.category !== "NIS2") return null

  if (record.id.startsWith("nis2-gov-cert-expired-")) return "certification"
  if (record.id.startsWith("nis2-gov-training-")) return "training"

  const text = getNis2GovernanceText(record)

  if (
    text.includes("board training tracker") ||
    text.includes("registru guvernanță") ||
    text.includes("registru guvernanță") ||
    text.includes("board & ciso")
  ) {
    return text.includes("certific") || text.includes("ciso") ? "certification" : "training"
  }

  if (
    text.includes("board") ||
    text.includes("membrul conducerii") ||
    text.includes("board & ciso") ||
    text.includes("training") ||
    text.includes("certific")
  ) {
    return text.includes("certific") || text.includes("ciso") ? "certification" : "training"
  }

  return null
}

function deriveNis2MaturityFocus(record: ScanFinding): Nis2MaturityFocus | null {
  if (record.category !== "NIS2") return null

  if (record.id.startsWith("nis2-maturity-")) {
    const domainId = record.id.slice("nis2-maturity-".length) as Nis2MaturityFocus
    if (NIS2_MATURITY_DOMAIN_MAP.has(domainId)) return domainId
  }

  const text = getNis2Text(record)

  const matchers: Array<[Nis2MaturityFocus, string[]]> = [
    ["risk-management", ["managementul riscului", "management al riscului", "risk management", "evaluări de risc", "evaluari de risc"]],
    ["incident-response", ["gestionarea incidentelor", "incidentelor", "plan de răspuns", "plan de raspuns"]],
    ["business-continuity", ["continuitatea activității", "continuitatea activitatii", "bcp", "drp", "backup"]],
    ["supply-chain", ["supply chain", "lanțul de aprovizionare", "lantul de aprovizionare"]],
    ["secure-development", ["achizi", "patch management", "actualizări de securitate", "actualizari de securitate"]],
    ["audit-testing", ["test de penetrare", "audit de securitate", "evaluarea eficacității", "evaluarea eficacitatii"]],
    ["basic-hygiene", ["igienă cibernetică", "igiena cibernetica", "inventar actualizat al activelor", "training de securitate"]],
    ["cryptography", ["criptograf", "tls", "https", "protecția datelor", "protectia datelor"]],
    ["access-control", ["controlul accesului", "least-privilege", "need-to-know", "offboarding"]],
    ["mfa", ["mfa", "autentificare multi-factor", "autentificare multifactor"]],
  ]

  for (const [domainId, needles] of matchers) {
    if (needles.some((needle) => text.includes(needle))) {
      return domainId
    }
  }

  return null
}

function deriveNis2VendorId(record: ScanFinding): string | null {
  if (!record.id.startsWith("nis2-vendor-risk-")) return null
  const vendorId = record.id.slice("nis2-vendor-risk-".length).trim()
  return vendorId || null
}

function getWorkflowLink(
  findingTypeId: string,
  record: ScanFinding
): CockpitRecipe["workflowLink"] | undefined {
  switch (findingTypeId) {
    case "NIS2-001":
      return {
        href: `/dashboard/nis2/eligibility?${new URLSearchParams({
          findingId: record.id,
          source: "cockpit",
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide eligibilitatea NIS2",
      }
    case "NIS2-005":
      return {
        href: `/dashboard/nis2?${new URLSearchParams({
          tab: "assessment",
          focus: "assessment",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide evaluarea NIS2",
      }
    case "NIS2-015": {
      const incidentId = deriveNis2IncidentId(record)
      const search = new URLSearchParams({
        tab: "incidents",
        focus: "incident",
        findingId: record.id,
        returnTo: `/dashboard/resolve/${record.id}`,
      })
      if (incidentId) {
        search.set("incidentId", incidentId)
      }
      return {
        href: `/dashboard/nis2?${search.toString()}`,
        label: incidentId ? "Deschide timeline-ul incidentului" : "Deschide flow-ul de incident",
      }
    }
    case "NIS2-GENERIC": {
      const governanceFocus = deriveNis2GovernanceFocus(record)
      if (governanceFocus) {
        return {
          href: `/dashboard/nis2/governance?${new URLSearchParams({
            findingId: record.id,
            source: "cockpit",
            focus: governanceFocus,
            returnTo: `/dashboard/resolve/${record.id}`,
          }).toString()}`,
          label:
            governanceFocus === "certification"
              ? "Deschide registrul CISO"
              : "Deschide registrul de guvernanță",
        }
      }

      const maturityFocus = deriveNis2MaturityFocus(record)
      if (maturityFocus) {
        return {
          href: `/dashboard/nis2/maturitate?${new URLSearchParams({
            findingId: record.id,
            source: "cockpit",
            focus: maturityFocus,
            returnTo: `/dashboard/resolve/${record.id}`,
          }).toString()}`,
          label: "Deschide evaluarea de maturitate",
        }
      }

      if (!isNis2SupplyChainFinding(record)) return undefined
      const vendorContext = inferVendorContext(record, findingTypeId)
      const vendorId = vendorContext?.vendorId ?? deriveNis2VendorId(record)
      const search = new URLSearchParams({
        tab: "vendors",
        focus: "vendor",
        findingId: record.id,
        returnTo: `/dashboard/resolve/${record.id}`,
      })
      if (vendorId) {
        search.set("vendorId", vendorId)
      }
      if (vendorContext?.vendorName) {
        search.set("vendor", vendorContext.vendorName)
      }
      return {
        href: `/dashboard/nis2?${search.toString()}`,
        label: vendorContext?.vendorName
          ? `Deschide registrul pentru ${vendorContext.vendorName}`
          : "Deschide registrul furnizorilor",
      }
    }
    case "GDPR-013":
      return {
        href: `/dashboard/dsar?${new URLSearchParams({
          action: "new",
          type: "access",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide DSAR",
      }
    case "GDPR-021":
      return {
        href: `/dashboard/documente?${new URLSearchParams({
          focus: "job-descriptions",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide pachetul HR",
      }
    case "GDPR-011":
      return {
        href: `/dashboard/vendor-review?${new URLSearchParams({
          focus: "pack",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide pachetul vendor",
      }
    case "GDPR-012":
      return {
        href: `/dashboard/dsar?${new URLSearchParams({
          focus: "process",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide pachetul DSAR",
      }
    case "GDPR-014":
      return {
        href: `/dashboard/dsar?${new URLSearchParams({
          action: "new",
          type: "erasure",
          findingId: record.id,
          returnTo: `/dashboard/resolve/${record.id}`,
        }).toString()}`,
        label: "Deschide cererea de ștergere",
      }
    case "GDPR-019": {
      const incidentId = getIncidentIdFromAnspdcpFindingId(record.id)
      if (!incidentId) return undefined
      const search = new URLSearchParams({
        tab: "incidents",
        incidentId,
        focus: "anspdcp",
        findingId: record.id,
        returnTo: `/dashboard/resolve/${record.id}`,
      })
      return {
        href: `/dashboard/nis2?${search.toString()}`,
        label: "Deschide flow-ul de breach",
      }
    }
    case "GDPR-005": {
      const search = new URLSearchParams({
        action: "site",
        findingId: record.id,
        findingTitle: record.title,
      })
      return {
        href: `/dashboard/scan?${search.toString()}`,
        label: "Scanează site-ul din nou",
      }
    }
    case "EF-001": {
      const search = new URLSearchParams({
        tab: "spv",
        findingId: record.id,
      })
      return {
        href: `/dashboard/fiscal?${search.toString()}`,
        label: "Verifică SPV în Fiscal",
      }
    }
    default:
      return undefined
  }
}

function getSpecialistHandoffSurface(
  findingTypeId: string,
  record: ScanFinding
): SpecialistHandoffSurface | null {
  switch (findingTypeId) {
    case "GDPR-021":
      return "job_description_pack"
    case "GDPR-011":
      return "vendor_review_pack"
    case "GDPR-012":
      return "dsar_process"
    case "GDPR-013":
      return "dsar_access"
    case "GDPR-014":
      return "dsar_erasure"
    case "GDPR-019":
      return "anspdcp_breach"
    case "NIS2-001":
      return "nis2_eligibility"
    case "NIS2-005":
      return "nis2_assessment"
    case "NIS2-015":
      return "nis2_incident"
    case "NIS2-GENERIC": {
      const governanceFocus = deriveNis2GovernanceFocus(record)
      if (governanceFocus) return "nis2_governance"

      const maturityFocus = deriveNis2MaturityFocus(record)
      if (maturityFocus) return "nis2_maturity"

      if (isNis2SupplyChainFinding(record)) return "nis2_vendor_registry"
      return null
    }
    default:
      return null
  }
}

export function getSpecialistHandoffContract(
  findingTypeId: string,
  record: ScanFinding
): SpecialistHandoffContract | undefined {
  if (getSmartResolveExecutionClass(findingTypeId) !== "specialist_handoff") return undefined

  const workflowLink = getWorkflowLink(findingTypeId, record)
  const surface = getSpecialistHandoffSurface(findingTypeId, record)
  if (!workflowLink || !surface) return undefined

  switch (surface) {
    case "job_description_pack":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce pachetul HR este revizuit și planul de rollout pentru fișele de post este clar, suprafața Documente te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Pachet HR pregătit",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească dovada că modelul de fișă, inventarul de roluri și checklistul de rollout au fost revizuite și asumate pentru pașii următori.",
      }
    case "vendor_review_pack":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce pachetul vendor este revizuit și pornești primul review relevant, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Vendor Pack pregătit și review pornit",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească dovada că pachetul vendor a fost revizuit și că există cel puțin un vendor review pornit pentru furnizorii relevanți.",
      }
    case "dsar_process":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce procedura, registrul și responsabilul DSAR sunt confirmați, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Pachet DSAR confirmat",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească dovada că procedura, registrul și ownerul DSAR au fost revizuite și asumate intern.",
      }
    case "dsar_access":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce răspunsul DSAR este trimis sau refuzul este documentat, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Dovadă răspuns DSAR",
        returnEvidenceInstruction:
          "După finalizarea cazului în modulul DSAR, cockpitul primește automat dovada verificării identității și a răspunsului trimis.",
      }
    case "dsar_erasure":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce execuția ștergerii și răspunsul final sunt documentate, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Dovadă ștergere și răspuns DSAR",
        returnEvidenceInstruction:
          "După finalizarea cazului de ștergere în modulul DSAR, cockpitul primește automat dovada sistemelor afectate și a răspunsului trimis persoanei vizate.",
      }
    case "anspdcp_breach":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce notificarea ANSPDCP este salvată sau marcată ca trimisă, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Dovadă ANSPDCP sau raționament documentat",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească numărul de înregistrare ANSPDCP sau raționamentul complet documentat pentru ne-notificare.",
      }
    case "nis2_eligibility":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce eligibilitatea NIS2 este salvată, wizardul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Rezultat eligibilitate salvat",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească automat rezultatul eligibilității și justificarea salvată pentru sector, mărime și rol.",
      }
    case "nis2_assessment":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce evaluarea NIS2 este salvată, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Assessment NIS2 salvat",
        returnEvidenceInstruction:
          "După salvarea evaluării, cockpitul primește automat scorul și dovada că assessment-ul a fost completat.",
      }
    case "nis2_incident":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce early warning-ul NIS2 este salvat, modulul de incidente te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Dovadă early warning DNSC",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească automat referința early warning-ului, incidentul legat și nota de progres pentru 72h / raport final.",
      }
    case "nis2_governance":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce actualizezi training-ul sau certificarea în registrul Board & CISO, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Actualizare registru Board & CISO",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească automat training-ul sau certificarea actualizată, împreună cu urma salvată în registru.",
      }
    case "nis2_maturity":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce evaluarea de maturitate este salvată, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Evaluare maturitate salvată",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească automat domeniul evaluat, răspunsurile salvate și planul de remediere aferent.",
      }
    case "nis2_vendor_registry":
      return {
        surface,
        startHref: workflowLink.href,
        startLabel: workflowLink.label,
        targetReturnMode: "automatic",
        runtimeReturnMode: "automatic",
        runtimeStatusNote:
          "După ce marchezi revizuirea furnizorului în registrul NIS2, modulul te readuce automat în același cockpit pentru închidere.",
        returnEvidenceLabel: "Revizuire furnizor salvată",
        returnEvidenceInstruction:
          "Cockpitul trebuie să primească automat revizuirea contractuală, vendorul afectat și dovada salvată în registru.",
      }
  }
}

function getClosureCTA(
  findingTypeId: string,
  primaryMode: ResolutionMode
): string | undefined {
  switch (findingTypeId) {
    case "GDPR-021":
      return "Marchează pachetul HR pregătit"
    case "GDPR-011":
      return "Marchează pachetul vendor pregătit"
    case "NIS2-001":
      return "Salvează eligibilitatea"
    case "NIS2-005":
      return "Salvează evaluarea NIS2"
    case "NIS2-015":
      return "Marchează early warning trimis"
    case "GDPR-005":
      return "Trimite la dosar și monitorizare"
    case "GDPR-012":
      return "Marchează pachetul DSAR pregătit"
    case "GDPR-013":
      return "Marchează răspunsul trimis"
    case "GDPR-014":
      return "Marchează răspunsul și ștergerea"
    case "GDPR-017":
      return "Marchează ștergerea / anonimizarea"
    case "GDPR-019":
      return "Marchează notificarea ANSPDCP"
    case "GDPR-020":
      return "Marchează baseline-ul contractual"
    case "GDPR-OPS":
      return "Marchează măsura aplicată"
    case "AI-OPS":
      return "Marchează regula AI aplicată"
    case "EF-001":
      return "Confirmă activarea SPV"
    default:
      return primaryMode === "external_action" ? "Marchează rezolvat" : undefined
  }
}

const MONITORING_INTERVAL_DAYS: Record<string, number | null> = {
  "GDPR-001": 180,
  "GDPR-002": 180,
  "GDPR-003": 90,
  "GDPR-005": 60,
  "GDPR-010": 180,
  "GDPR-011": 180,
  "GDPR-012": 180,
  "GDPR-013": 30,
  "GDPR-014": 30,
  "GDPR-016": 180,
  "GDPR-017": 90,
  "GDPR-019": null,
  "GDPR-020": 180,
  "GDPR-021": 180,
  "GDPR-OPS": 180,
  "NIS2-001": 365,
  "NIS2-005": 180,
  "NIS2-015": 7,
  "AI-001": 180,
  "AI-005": 180,
  "AI-OPS": 180,
  "EF-001": 30,
  "EF-003": 7,
  "EF-004": 2,
  "EF-005": 3,
  "EF-006": 7,
  "SYS-001": 30,
  "SYS-002": 90,
  "GDPR-GENERIC": 180,
  "NIS2-GENERIC": 180,
  "EF-GENERIC": 30,
  "AI-GENERIC": 180,
  "CROSS-GENERIC": 90,
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ARTIFACTS TYPE (helper for buildCockpitRecipe)
// ─────────────────────────────────────────────────────────────────────────────

export type FindingArtifacts = {
  /** Starea explicită a documentului — dacă e disponibilă, se folosește direct */
  documentFlowState?: FindingDocumentFlowState
  /** Document generat legat de finding */
  linkedGeneratedDocument?: {
    approvalStatus?: "draft" | "approved_as_evidence"
    nextReviewDateISO?: string
    expiresAtISO?: string
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. EF-003 EXPLAINABILITY (Sprint 6A)
// ─────────────────────────────────────────────────────────────────────────────

export type EF003Explainability = {
  /** Codul ANAF/CIUS-RO extras din finding (ex. "V009") */
  errorCode: string | null
  /** Intrarea completă din ANAF_ERROR_MAP, dacă codul a fost recunoscut */
  errorEntry: AnafErrorEntry | null
  /** Referința facturii extrasă din titlu (ex. "FACT-2026-001") */
  invoiceRef: string | null
  /** Textul brut al problemei din finding (fallback când nu există cod clar) */
  rawReasonText: string | null
}

/**
 * Extrage explainability structurat pentru un finding EF-003.
 * Normalizează codul ANAF/CIUS-RO și returnează fix-ul concret.
 * Dacă nu există cod recunoscut, returnează textul brut ca fallback.
 */
export function extractEF003Explainability(record: ScanFinding): EF003Explainability {
  const allText = [
    record.title,
    record.detail,
    record.remediationHint ?? "",
    record.resolution?.problem ?? "",
    record.resolution?.action ?? "",
  ].join(" ")

  // Caută coduri ANAF: E001, V009, D001, S001, C001, T001 etc.
  const codeMatch = allText.match(/\b([EVDSTC]\d{3})\b/)
  const errorCode = codeMatch ? codeMatch[1].toUpperCase() : null
  const errorEntry = errorCode ? lookupAnafError(errorCode) : null

  // Referință factură din titlu: pattern "— FACT-2026-001" sau "# FAC-001"
  const invoiceMatch = record.title.match(/(?:—\s*|#\s*)([\w-]*\d{3,}[\w-]*)/)
  const invoiceRef = invoiceMatch ? invoiceMatch[1] : null

  const rawReasonText = record.resolution?.problem ?? record.detail ?? null

  return { errorCode, errorEntry, invoiceRef, rawReasonText }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. EF-001 SPV STATE MODEL (Sprint 6B)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sub-stările SPV derivate la runtime din semnalele din finding.
 * Nu sunt câmpuri persistate — se derivă din titlu/detail/provenance.
 */
export type SpvSubState =
  | "spv_not_registered"   // SPV nu este activat deloc pentru CUI
  | "spv_access_missing"   // Accesul la API SPV nu a fost configurat
  | "spv_token_expired"    // Token-ul SPV a expirat
  | "spv_check_needed"     // SPV-ul există dar nu a fost verificat recent

export type EF001SpvExplainability = {
  spvSubState: SpvSubState
  /** Eticheta umană a sub-stării, folosită în cockpit */
  stateLabel: string
  /** Textul explicativ pentru user — ce s-a detectat concret */
  description: string
  /** Acțiunea concretă de remediere */
  fix: string
  /** Dovada care închide cazul */
  evidenceNote: string
  /** Regula de închidere, distinctă de dovadă */
  closeCondition: string
  /** Semnalul de reverificare */
  recheckSignal: string
  /** CUI-ul firmei dacă e inclus în finding id */
  cuiRef: string | null
}

const SPV_SUB_STATE_CONTENT: Record<
  SpvSubState,
  { stateLabel: string; description: string; fix: string; evidenceNote: string; closeCondition: string; recheckSignal: string }
> = {
  spv_not_registered: {
    stateLabel: "SPV neînregistrat",
    description: "Firma nu are SPV activat în Spațiul Privat Virtual ANAF. Fără SPV, facturile e-Factura nu pot fi primite sau transmise legal.",
    fix: "Accesează portalul ANAF (anaf.ro), autentifică-te cu certificat digital sau card electronic, și înregistrează firma în SPV. Permite accesul pentru transmiterea facturilor e-Factura.",
    evidenceNote: "Screenshot din SPV ANAF care confirmă înregistrarea firmei, sau referința oficială primită de la ANAF.",
    closeCondition: "SPV este activat pentru firmă și dovada înregistrării este salvată la dosar.",
    recheckSignal: "Verifică statusul SPV la 30 de zile după înregistrare.",
  },
  spv_access_missing: {
    stateLabel: "Acces SPV neconfigurat",
    description: "Accesul API la SPV ANAF nu a fost configurat. CompliScan nu poate verifica automat statusul facturilor.",
    fix: "Configurează credențialele ANAF OAuth2 în Setări → Integrări ANAF pentru a permite verificarea automată.",
    evidenceNote: "Confirmare din setări că integrarea ANAF este activă și testată.",
    closeCondition: "Integrarea SPV este configurată și verificarea automată răspunde corect.",
    recheckSignal: "Reverificare automată după configurarea integrării.",
  },
  spv_token_expired: {
    stateLabel: "Token SPV expirat",
    description: "Token-ul de acces la SPV ANAF a expirat. Facturile nu mai pot fi verificate sau transmise automat.",
    fix: "Reautentifică-te în Setări → Integrări ANAF pentru a reînnoi token-ul de acces.",
    evidenceNote: "Confirmare că token-ul ANAF este reînnoit și verificarea automată funcționează.",
    closeCondition: "Token-ul SPV este reînnoit și verificarea automată funcționează din nou.",
    recheckSignal: "Verifică statusul token-ului la 7 zile după reînnoire.",
  },
  spv_check_needed: {
    stateLabel: "Verificare SPV necesară",
    description: "SPV-ul nu a fost verificat recent. Nu putem confirma că facturile sunt procesate corect.",
    fix: "Rulează verificarea SPV din pagina Fiscal → SPV pentru a confirma statusul curent.",
    evidenceNote: "Rezultatul verificării SPV cu status activ și fără erori.",
    closeCondition: "Verificarea SPV confirmă status activ și fără erori relevante.",
    recheckSignal: "Verifică statusul SPV la 30 de zile.",
  },
}

/**
 * Derivă sub-starea SPV din semnalele unui finding EF-001.
 * Runtime — nu persistat.
 */
export function extractEF001SpvState(record: ScanFinding): EF001SpvExplainability {
  const allText = [
    record.title,
    record.detail,
    record.remediationHint ?? "",
    record.resolution?.problem ?? "",
    record.operationalEvidenceNote ?? "",
  ].join(" ").toLowerCase()

  // Extrage CUI din id-ul finding-ului (pattern: spv-missing-{cui})
  const cuiMatch = record.id.match(/spv-missing-(\d+)/)
  const cuiRef = cuiMatch ? cuiMatch[1] : null

  // Detectează sub-starea
  let spvSubState: SpvSubState

  if (
    allText.includes("token") &&
    (allText.includes("expirat") || allText.includes("expired") || allText.includes("token_expired"))
  ) {
    spvSubState = "spv_token_expired"
  } else if (
    allText.includes("acces") &&
    (allText.includes("lipsă") || allText.includes("lipsa") || allText.includes("neconfigurata") || allText.includes("neconfigurată"))
  ) {
    spvSubState = "spv_access_missing"
  } else if (
    record.id.startsWith("spv-missing-") ||
    allText.includes("nu este înregistrat") ||
    allText.includes("nu este inregistrat") ||
    allText.includes("înregistrare spv lipsă") ||
    allText.includes("inregistrare spv lipsa") ||
    allText.includes("neînregistrat") ||
    allText.includes("neinregistrat")
  ) {
    spvSubState = "spv_not_registered"
  } else {
    spvSubState = "spv_check_needed"
  }

  const content = SPV_SUB_STATE_CONTENT[spvSubState]
  const description = cuiRef && spvSubState === "spv_not_registered"
    ? `${content.description} CUI verificat: ${cuiRef}.`
    : content.description

  return {
    spvSubState,
    stateLabel: content.stateLabel,
    description,
    fix: content.fix,
    evidenceNote: content.evidenceNote,
    closeCondition: content.closeCondition,
    recheckSignal: content.recheckSignal,
    cuiRef,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. FISCAL OPERATIONAL RISK EXPLAINABILITY (Sprint 6C)
// EF-004 processing-delayed · EF-005 unsubmitted · EF-006 buyer-side risk
// ─────────────────────────────────────────────────────────────────────────────

export type FiscalRiskClass = "processing_delayed" | "unsubmitted" | "buyer_side_risk"

export type FiscalOperationalExplainability = {
  riskClass: FiscalRiskClass
  description: string
  fix: string
  evidenceNote: string
  recheckSignal: string
  invoiceRef: string | null
  entityRef: string | null
}

const FISCAL_RISK_CLASS_LABELS: Record<FiscalRiskClass, string> = {
  processing_delayed: "factură blocată în prelucrare",
  unsubmitted: "factură netransmisă în SPV",
  buyer_side_risk: "date client invalide",
}

function extractEntityRef(record: ScanFinding): string | null {
  const dashMatch = record.title.match(/—\s+(.+)$/)
  if (dashMatch) return dashMatch[1].trim()
  const delaMatch = record.detail.match(/de la ([^(.\n]+)/)
  if (delaMatch) return delaMatch[1].trim()
  return null
}

/**
 * Explainability pentru EF-004 — factură în prelucrare blocată.
 * Distinge clar: NU este o respingere, e blocare în coada de procesare.
 */
export function extractEF004State(record: ScanFinding): FiscalOperationalExplainability {
  const entityRef = extractEntityRef(record)
  const invoiceMatch =
    record.title.match(/(?:—\s*|#\s*)([\w/-]*\d{3,}[\w/-]*)/) ??
    record.detail.match(/#([\w/-]*\d{3,}[\w/-]*)/)
  const invoiceRef = invoiceMatch ? invoiceMatch[1] : null

  const pendingMatch = (record.detail + (record.resolution?.problem ?? "")).match(/(\d+)\s*(?:ore|zile)/)
  const pendingInfo = pendingMatch ? ` (blocat de ${pendingMatch[0]})` : ""
  const entityDesc = entityRef ? ` de la ${entityRef}` : ""
  const invoiceDesc = invoiceRef ? ` (#${invoiceRef})` : ""

  return {
    riskClass: "processing_delayed",
    description: `Factura${invoiceDesc}${entityDesc} este în prelucrare la ANAF de prea mult timp${pendingInfo}. Aceasta NU este o respingere — factura e în coada ANAF. Trebuie verificat dacă s-a blocat sau e o întârziere temporară.`,
    fix: "Accesează portalul SPV ANAF și verifică statusul facturii. Dacă a depășit 72 de ore fără confirmare, retransmite sau contactează helpdesk ANAF.",
    evidenceNote: "Screenshot din SPV ANAF cu statusul curent al facturii (ok, în prelucrare sau respinsă).",
    recheckSignal: `Verifică statusul${invoiceRef ? ` facturii ${invoiceRef}` : ""} în SPV ANAF la 24 ore după verificare.`,
    invoiceRef,
    entityRef,
  }
}

/**
 * Explainability pentru EF-005 — factură generată, netransmisă SPV.
 * Distinge clar: factura există local dar ANAF nu o știe.
 */
export function extractEF005State(record: ScanFinding): FiscalOperationalExplainability {
  const entityRef = extractEntityRef(record)
  const invoiceMatch =
    record.title.match(/(?:—\s*|#\s*)([\w/-]*\d{3,}[\w/-]*)/) ??
    record.detail.match(/#([\w/-]*\d{3,}[\w/-]*)/)
  const invoiceRef = invoiceMatch ? invoiceMatch[1] : null

  const entityDesc = entityRef ? ` pentru ${entityRef}` : ""
  const invoiceDesc = invoiceRef ? ` (#${invoiceRef})` : ""

  return {
    riskClass: "unsubmitted",
    description: `Factura${invoiceDesc}${entityDesc} a fost generată local dar NU a fost transmisă spre SPV ANAF. ANAF nu are cunoștință de această factură — TVA-ul nu poate fi dedus și există risc de penalitate pentru transmitere tardivă.`,
    fix: "Transmite factura XML spre SPV ANAF. Validează fișierul XML cu validatorul e-Factura înainte de upload. Termen legal: 5 zile lucrătoare de la emitere.",
    evidenceNote: "Screenshot din SPV ANAF cu status ok sau numărul mesajului de acceptare după transmitere.",
    recheckSignal: `Verifică că factura${invoiceRef ? ` ${invoiceRef}` : ""} a fost transmisă și confirmată în termen.`,
    invoiceRef,
    entityRef,
  }
}

/**
 * Explainability pentru EF-006 — date identificare client invalide (buyer-side risk).
 * Distinge clar: problema nu e la structura XML, ci la datele clientului.
 */
export function extractEF006State(record: ScanFinding): FiscalOperationalExplainability {
  const entityRef = extractEntityRef(record)
  const invoiceMatch =
    record.title.match(/(?:—\s*|#\s*)([\w/-]*\d{3,}[\w/-]*)/) ??
    record.detail.match(/#([\w/-]*\d{3,}[\w/-]*)/)
  const invoiceRef = invoiceMatch ? invoiceMatch[1] : null

  const allText = [record.title, record.detail, record.remediationHint ?? ""].join(" ").toLowerCase()
  const isC002 = allText.includes("c002") || (allText.includes("cui") && allText.includes("client") && allText.includes("neidentificat"))
  const fieldHint = isC002
    ? "CUI-ul clientului destinatar nu există sau nu este activ în ANAF."
    : "Datele de identificare ale clientului (AccountingCustomerParty) sunt incomplete sau incorecte."

  const entityDesc = entityRef ? ` pentru clientul ${entityRef}` : ""

  return {
    riskClass: "buyer_side_risk",
    description: `${fieldHint} Aceasta este o eroare buyer-side${entityDesc} — problema nu este la structura XML, ci la datele specifice ale clientului din factură.`,
    fix: "Verifică CUI-ul clientului la anaf.ro/verificare-cif. Dacă este persoană fizică, folosește CNP, nu CUI. Corectează în softul de facturare și retransmite.",
    evidenceNote: "CUI-ul clientului verificat și confirmat valid + screenshot din SPV cu status ok după retransmitere.",
    recheckSignal: `Verifică că factura${invoiceRef ? ` ${invoiceRef}` : ""} cu datele client corecte a fost confirmată în SPV.`,
    invoiceRef,
    entityRef,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clasifică un finding în tipologia canonică.
 * Derivă `findingTypeId` din id patterns + suggestedDocumentType.
 */
export function classifyFinding(record: ScanFinding): FindingClassification {
  const categoryFramework = CATEGORY_TO_FRAMEWORK[record.category] ?? "Cross"
  const findingTypeId = deriveTypeId(record, categoryFramework)
  const framework =
    FINDING_TYPE_DEFINITIONS[findingTypeId]?.framework ??
    categoryFramework

  return { findingTypeId, framework }
}

/**
 * Returnează definiția de tip canonică.
 * Fallback: CROSS-GENERIC pentru id-uri necunoscute.
 */
export function getFindingTypeDefinition(findingTypeId: string): FindingTypeDefinition {
  return (
    FINDING_TYPE_DEFINITIONS[findingTypeId] ??
    FINDING_TYPE_DEFINITIONS["CROSS-GENERIC"]!
  )
}

/**
 * Returnează flow recipe-ul canonic.
 * Fallback: CROSS-GENERIC pentru id-uri necunoscute.
 */
export function getResolveFlowRecipe(findingTypeId: string): ResolveFlowRecipe {
  return (
    RESOLVE_FLOW_RECIPES[findingTypeId] ??
    RESOLVE_FLOW_RECIPES["CROSS-GENERIC"]!
  )
}

export function getCloseGatingRequirements(findingTypeId: string): CloseGatingRequirements {
  const findingType = getFindingTypeDefinition(findingTypeId)
  const flow = getResolveFlowRecipe(findingTypeId)
  const primaryMode = findingType.resolutionModes[0]
  const documentSupport = getDocumentSupportForFindingType(findingTypeId)
  const isOperationalAssisted = documentSupport?.mode === "assistive"
  const requiresGeneratedDocument =
    Boolean(documentSupport) &&
    (
      isOperationalAssisted ||
      findingType.requiredEvidenceKinds.includes("generated_document") ||
      (flow.initialFlowState === "ready_to_generate" &&
        (primaryMode === "in_app_guided" || primaryMode === "in_app_full"))
    )
  const requiresRevalidationConfirmation = flow.initialFlowState === "needs_revalidation"

  return {
    requiresGeneratedDocument,
    requiresConfirmationChecklist: requiresGeneratedDocument,
    requiresEvidenceNote:
      isOperationalAssisted ||
      (!requiresGeneratedDocument &&
      !requiresRevalidationConfirmation &&
      (primaryMode === "external_action" || findingType.requiredEvidenceKinds.includes("uploaded_file"))),
    requiresRevalidationConfirmation,
    requiresNextReviewDate: requiresRevalidationConfirmation,
    acceptedEvidence: findingType.requiredEvidenceKinds.map((k) => EVIDENCE_KIND_LABELS[k] ?? k),
  }
}

export function computeNextMonitoringDateISO(
  findingTypeId: string,
  baseISO = new Date().toISOString()
): string | null {
  const intervalDays = MONITORING_INTERVAL_DAYS[findingTypeId] ?? MONITORING_INTERVAL_DAYS["CROSS-GENERIC"]
  if (!intervalDays || intervalDays <= 0) return null

  const baseDate = new Date(baseISO)
  if (Number.isNaN(baseDate.getTime())) {
    return null
  }

  const nextDate = new Date(baseDate)
  nextDate.setUTCDate(nextDate.getUTCDate() + intervalDays)
  return nextDate.toISOString()
}

/**
 * Derivă CockpitUIState din starea persistată + flow recipe + documentFlowState.
 * NU persistă — se calculează la runtime.
 *
 * Logică:
 *   dismissed → false_positive
 *   resolved / under_monitoring → resolved
 *   needs_revalidation flow → needs_revalidation
 *   external_action flow → external_action_required
 *   draft_ready / attached_as_evidence → evidence_uploaded (dacă nu e deja terminal)
 *   ready_to_generate → ready_to_generate
 *   need_your_input → need_your_input
 *   default → detected
 */
export function deriveCockpitUIState(
  contract: Omit<FindingRuntimeContract, "uiState">
): CockpitUIState {
  const { record, flow, documentFlowState } = contract
  const status = record.findingStatus ?? "open"

  if (status === "dismissed") return "false_positive"
  if (status === "resolved" || status === "under_monitoring") return "resolved"

  if (documentFlowState === "attached_as_evidence") return "evidence_uploaded"
  if (documentFlowState === "draft_ready") return "evidence_uploaded"

  if (flow.initialFlowState === "needs_revalidation") return "needs_revalidation"
  if (flow.initialFlowState === "external_action_required") return "external_action_required"
  if (flow.initialFlowState === "ready_to_generate") return "ready_to_generate"
  if (flow.initialFlowState === "need_your_input") return "need_your_input"
  if (flow.initialFlowState === "evidence_required") return "need_your_input"

  return "detected"
}

/**
 * Construiește CockpitRecipe complet din finding + artefacte opționale.
 * Acesta este obiectul pe care îl consumă UI-ul cockpit-ului.
 */
export function buildCockpitRecipe(
  record: ScanFinding,
  artifacts?: FindingArtifacts
): CockpitRecipe {
  // 1. Clasificare
  const { findingTypeId } = classifyFinding(record)

  // 2. Tip + flow
  const findingType = getFindingTypeDefinition(findingTypeId)
  const flow = getResolveFlowRecipe(findingTypeId)

  // 3. Document flow state
  const documentFlowState = resolveDocumentFlowState(record, artifacts)

  // 4. UI State derivat
  const uiState = deriveCockpitUIState({ record, findingType, flow, documentFlowState })

  // 5. Prezentare
  const statusLabels = UI_STATE_STATUS_LABELS[uiState]
  const primaryMode = findingType.resolutionModes[0]
  const executionClass = getSmartResolveExecutionClass(findingTypeId)
  const documentSupport = getDocumentSupportForFindingType(findingTypeId)
  const visibleBlocks = buildVisibleBlocks(uiState, flow, findingType, documentFlowState)
  const resolveFlowState = uiStateToFlowState(uiState, flow.initialFlowState)
  const vendorContext = inferVendorContext(record, findingTypeId)
  const ef003Explainability =
    findingTypeId === "EF-003" ? extractEF003Explainability(record) : null
  const ef001SpvExplainability =
    findingTypeId === "EF-001" ? extractEF001SpvState(record) : null
  const fiscalOpExplainability =
    findingTypeId === "EF-004" ? extractEF004State(record) :
    findingTypeId === "EF-005" ? extractEF005State(record) :
    findingTypeId === "EF-006" ? extractEF006State(record) : null

  // 6. CTA principal
  const primaryCTAAction = getPrimaryCTAAction(uiState, primaryMode)

  // 7. Monitoring signals
  const signals: string[] = [...flow.revalidationTriggers]
  if (findingTypeId === "EF-001" && ef001SpvExplainability) {
    signals.splice(0, signals.length)
    signals.unshift(ef001SpvExplainability.recheckSignal)
  }
  if (fiscalOpExplainability) {
    signals.splice(0, signals.length)
    signals.unshift(fiscalOpExplainability.recheckSignal)
  }
  if (findingTypeId === "EF-003") {
    const specificRecheckSignal =
      ef003Explainability?.invoiceRef
        ? `Verifică statusul facturii ${ef003Explainability.invoiceRef} în SPV ANAF la 7 zile după retransmitere.`
        : "Verifică statusul facturii în SPV ANAF la 7 zile după retransmitere."

    signals.splice(
      0,
      signals.length,
      ...signals.filter((signal) => !signal.toLowerCase().includes("validare"))
    )
    signals.unshift(specificRecheckSignal)
  }
  if (record.rescanHint) signals.push(record.rescanHint)
  if (record.resolution?.revalidation) signals.push(record.resolution.revalidation)
  const doc = artifacts?.linkedGeneratedDocument
  if (doc?.nextReviewDateISO) {
    signals.push(
      `Reverificare recomandată la ${new Date(doc.nextReviewDateISO).toLocaleDateString("ro-RO")}`
    )
  }
  if (record.nextMonitoringDateISO) {
    signals.push(
      `Următor control la ${new Date(record.nextMonitoringDateISO).toLocaleDateString("ro-RO")}`
    )
  }
  if (doc?.expiresAtISO) {
    signals.push(
      `Documentul expiră la ${new Date(doc.expiresAtISO).toLocaleDateString("ro-RO")}`
    )
  }
  if (record.reopenedFromISO) {
    signals.push(
      `Caz redeschis după închidere din ${new Date(record.reopenedFromISO).toLocaleDateString("ro-RO")}`
    )
  }
  const monitoringSignals = Array.from(new Set(signals)).slice(0, 5)

  // 8. Hero content
  const heroTitle = record.title
  let heroSummary =
    record.resolution?.problem ??
    flow.whatUserSees ??
    record.detail
  let whatCompliDoes =
    findingTypeId === "GDPR-010" && vendorContext?.dpaUrl
      ? `${flow.whatCompliDoes} Ți-am găsit și linkul public DPA pentru ${vendorContext.vendorName}.`
      : flow.whatCompliDoes
  let whatUserMustDo =
    findingTypeId === "GDPR-010" && vendorContext
      ? `${flow.whatUserMustDo} Confirmă relația cu ${vendorContext.vendorName} și atașează acordul semnat sau draftul aprobat.`
      : flow.whatUserMustDo
  let primaryCTALabel = flow.primaryCTA
  let acceptedEvidence = findingType.requiredEvidenceKinds.map(
    (k) => EVIDENCE_KIND_LABELS[k] ?? k
  )
  let closeCondition = flow.closeCondition
  const nis2GovernanceFocus = findingTypeId === "NIS2-GENERIC" ? deriveNis2GovernanceFocus(record) : null
  const nis2MaturityFocus = findingTypeId === "NIS2-GENERIC" ? deriveNis2MaturityFocus(record) : null
  const nis2MaturityDomain = nis2MaturityFocus ? NIS2_MATURITY_DOMAIN_MAP.get(nis2MaturityFocus) : null
  const nis2SupplyChainFinding =
    findingTypeId === "NIS2-GENERIC" &&
    !nis2GovernanceFocus &&
    !nis2MaturityFocus &&
    isNis2SupplyChainFinding(record)

  if (findingTypeId === "GDPR-010" && vendorContext) {
    acceptedEvidence.unshift(`DPA semnat cu ${vendorContext.vendorName}`)
  } else if (findingTypeId === "GDPR-020") {
    acceptedEvidence = Array.from(
      new Set([
        "Template contractual salvat sau încărcat la dosar",
        "Notă clară despre unde este salvat și pentru ce relații este folosit",
        ...acceptedEvidence,
      ])
    )
    closeCondition = "Baseline-ul contractual este pregătit și documentat clar în cockpit."
  } else if (findingTypeId === "GDPR-021") {
    acceptedEvidence = Array.from(
      new Set([
        "Model de fișă de post adaptat sau încărcat la dosar",
        "Inventar clar al rolurilor acoperite și al rolurilor rămase",
        ...acceptedEvidence,
      ])
    )
    closeCondition = "Pachetul HR este revizuit, iar următorii pași pentru fișele de post sunt documentați clar în cockpit."
  } else if (findingTypeId === "NIS2-GENERIC" && nis2GovernanceFocus) {
    primaryCTALabel =
      nis2GovernanceFocus === "certification" ? "Actualizează certificarea CISO" : "Actualizează training-ul boardului"
    heroSummary =
      nis2GovernanceFocus === "certification"
        ? "Registrul de guvernanță arată o certificare CISO expirată sau neactualizată. Finding-ul trebuie închis numai după ce actualizezi urma reală în registru."
        : "Registrul de guvernanță arată un gap de training pentru conducere. Finding-ul trebuie închis numai după ce actualizezi urma reală în registru."
    whatCompliDoes =
      nis2GovernanceFocus === "certification"
        ? "Am legat finding-ul de registrul Board & CISO și deschidem exact zona unde poți actualiza certificarea, expirarea și notele de guvernanță."
        : "Am legat finding-ul de registrul Board & CISO și deschidem exact zona unde poți documenta training-ul de securitate pentru conducere."
    whatUserMustDo =
      record.remediationHint ??
      (nis2GovernanceFocus === "certification"
        ? "Actualizează certificarea sau data de expirare CISO și salvează urma în registrul de guvernanță."
        : "Documentează training-ul de securitate pentru persoana afectată și salvează data completării în registrul de guvernanță.")
    acceptedEvidence = Array.from(
      new Set([
        nis2GovernanceFocus === "certification"
          ? "Certificare CISO sau dată nouă de expirare salvată în registru"
          : "Training board/CISO salvat în registrul de guvernanță",
        "Notă sau evidență de completare atașată în registru",
        ...acceptedEvidence,
      ])
    )
    closeCondition =
      nis2GovernanceFocus === "certification"
        ? "Registrul Board & CISO este actualizat cu certificarea valabilă sau cu data de expirare corectă."
        : "Registrul Board & CISO este actualizat cu training-ul completat pentru persoana afectată."
  } else if (findingTypeId === "NIS2-GENERIC" && nis2MaturityDomain) {
    primaryCTALabel = "Deschide evaluarea de maturitate"
    heroSummary = `Domeniul de maturitate "${nis2MaturityDomain.name}" este sub pragul sigur. Finding-ul se închide numai după ce salvezi evaluarea și clarifici planul pentru acest control.`
    whatCompliDoes = `Am legat finding-ul de domeniul de maturitate "${nis2MaturityDomain.name}" și deschidem exact secțiunea corespunzătoare din auto-evaluarea DNSC.`
    whatUserMustDo = nis2MaturityDomain.closureRecipe
    const controlEvidence = NIS2_CONTROL_EVIDENCE[nis2MaturityDomain.id] ?? []
    acceptedEvidence = Array.from(
      new Set([
        `Evaluare salvată pentru domeniul ${nis2MaturityDomain.name}`,
        ...controlEvidence,
        "Răspunsuri confirmate și plan de remediere actualizat",
        ...acceptedEvidence,
      ])
    )
    closeCondition = `Evaluarea de maturitate pentru "${nis2MaturityDomain.name}" este salvată și planul domeniului este clarificat.`
  } else if (nis2SupplyChainFinding) {
    primaryCTALabel = vendorContext?.vendorName
      ? `Revizuiește ${vendorContext.vendorName}`
      : "Revizuiește furnizorii"
    heroSummary =
      vendorContext
        ? `Risk de supply chain detectat pentru ${vendorContext.vendorName}. Registrul NIS2 arată că revizuirea contractuală sau dovada de securitate nu este completă.`
        : "Risk de supply chain detectat. Registrul NIS2 de furnizori cere revizuire contractuală și dovezi de securitate."
    whatCompliDoes =
      vendorContext
        ? `Am legat finding-ul de registrul NIS2 și am identificat vendorul ${vendorContext.vendorName}. Deschidem exact suprafața unde poți verifica DPA-ul, SLA-ul și revizuirea contractuală.`
        : "Am legat finding-ul de registrul NIS2 al furnizorilor și deschidem exact suprafața de revizuire contractuală."
    whatUserMustDo =
      vendorContext
        ? `Verifică DPA-ul, clauzele de securitate și notificarea incidentelor pentru ${vendorContext.vendorName}. Marchează revizuirea în registru și atașează urma contractuală reală.`
        : "Verifică DPA-ul, clauzele de securitate și notificarea incidentelor pentru furnizorii afectați. Marchează revizuirea în registru și atașează urma contractuală reală."
    acceptedEvidence = Array.from(
      new Set([
        vendorContext ? `Revizuire salvată în registru pentru ${vendorContext.vendorName}` : "Revizuire salvată în registrul furnizorilor ICT",
        vendorContext ? `DPA sau anexă contractuală pentru ${vendorContext.vendorName}` : "DPA sau anexă contractuală actualizată",
        ...acceptedEvidence,
      ])
    )
    closeCondition =
      vendorContext
        ? `Registrul NIS2 este actualizat pentru ${vendorContext.vendorName}, iar dovada contractuală sau de revizuire este salvată.`
        : "Registrul NIS2 al furnizorilor este actualizat și dovada contractuală sau de revizuire este salvată."
  }

  // EF-001 SPV explainability override (Sprint 6B)
  // Înlocuiește conținutul generic cu sub-starea SPV derivată la runtime.
  if (findingTypeId === "EF-001" && ef001SpvExplainability) {
    heroSummary = ef001SpvExplainability.description
    whatCompliDoes = `Am detectat starea ${ef001SpvExplainability.stateLabel.toLowerCase()}. ${flow.whatCompliDoes}`
    whatUserMustDo = ef001SpvExplainability.fix
    acceptedEvidence = Array.from(
      new Set([
        ef001SpvExplainability.evidenceNote,
        ...findingType.requiredEvidenceKinds.map((k) => EVIDENCE_KIND_LABELS[k] ?? k),
      ])
    )
    closeCondition = ef001SpvExplainability.closeCondition
  }

  // EF-003 explainability override (Sprint 6A)
  // Înlocuiește conținutul generic cu detalii exacte despre eroarea ANAF/CIUS-RO.
  if (findingTypeId === "EF-003" && ef003Explainability) {
    if (ef003Explainability.errorEntry && ef003Explainability.errorCode) {
      heroSummary = `${ef003Explainability.errorEntry.description}${ef003Explainability.invoiceRef ? ` Referință factură: ${ef003Explainability.invoiceRef}.` : ""}`
      whatCompliDoes =
        `Am identificat eroarea ${ef003Explainability.errorCode} — ${ef003Explainability.errorEntry.title}` +
        `${ef003Explainability.invoiceRef ? ` pentru factura ${ef003Explainability.invoiceRef}` : ""}. ${flow.whatCompliDoes}`
      whatUserMustDo = ef003Explainability.errorEntry.fix
      acceptedEvidence = Array.from(
        new Set([
          `Confirmare ANAF SPV cu status 'ok' după corecția ${ef003Explainability.errorCode}`,
          ...findingType.requiredEvidenceKinds.map((k) => EVIDENCE_KIND_LABELS[k] ?? k),
        ])
      )
      closeCondition =
        `Factura este retransmisă și confirmată în SPV cu status 'ok'` +
        `${ef003Explainability.errorCode ? ` după corecția ${ef003Explainability.errorCode}` : ""}.`
    } else if (
      ef003Explainability.rawReasonText &&
      ef003Explainability.rawReasonText !== flow.whatUserSees &&
      ef003Explainability.rawReasonText.length > 30
    ) {
      // Fallback: folosim textul brut din finding dacă e suficient de specific
      heroSummary = ef003Explainability.rawReasonText
    }
  }
  // EF-004 / EF-005 / EF-006 fiscal operational risk override (Sprint 6C)
  // Distinge clar: prelucrare blocată ≠ respinsă ≠ netransmisă ≠ buyer-side
  if (fiscalOpExplainability) {
    heroSummary = fiscalOpExplainability.description
    whatCompliDoes = `Am detectat riscul ${FISCAL_RISK_CLASS_LABELS[fiscalOpExplainability.riskClass]}. ${flow.whatCompliDoes}`
    whatUserMustDo = fiscalOpExplainability.fix
    acceptedEvidence = Array.from(
      new Set([
        fiscalOpExplainability.evidenceNote,
        ...findingType.requiredEvidenceKinds.map((k) => EVIDENCE_KIND_LABELS[k] ?? k),
      ])
    )
    closeCondition = flow.closeCondition
  }

  let dossierOutcome = getDossierOutcome(primaryMode)
  if (findingTypeId === "EF-001") {
    dossierOutcome = "Dovada activării SPV intră în dosar. CompliScan reverifică statusul SPV la 30 de zile."
  } else if (findingTypeId === "EF-004") {
    dossierOutcome = "Dovada statusului final din SPV (ok sau respinsă) intră în dosar pentru urmărire."
  } else if (findingTypeId === "EF-005") {
    dossierOutcome = "Dovada transmiterii în SPV ANAF intră în dosar. Factura devine trasabilă fiscal."
  } else if (findingTypeId === "EF-006") {
    dossierOutcome = "Dovada CUI client verificat + confirmare SPV intră în dosar pentru audit fiscal."
  } else if (findingTypeId === "NIS2-GENERIC" && nis2GovernanceFocus) {
    dossierOutcome = "Actualizarea registrului Board & CISO intră în dosar și rămâne legată de finding pentru auditul NIS2."
  } else if (findingTypeId === "NIS2-GENERIC" && nis2MaturityDomain) {
    dossierOutcome = `Evaluarea și planul pentru domeniul ${nis2MaturityDomain.name} intră în dosar și rămân legate de finding pentru auditul DNSC.`
  } else if (findingTypeId === "NIS2-GENERIC" && nis2SupplyChainFinding && vendorContext) {
    dossierOutcome = `Revizuirea contractuală și dovezile pentru ${vendorContext.vendorName} intră în dosar și rămân legate de finding pentru audit NIS2 / supply-chain.`
  } else if (findingTypeId === "NIS2-GENERIC" && nis2SupplyChainFinding) {
    dossierOutcome = "Revizuirea furnizorului și dovezile contractuale intră în dosar și rămân legate de finding pentru audit NIS2 / supply-chain."
  } else if (findingTypeId === "GDPR-010" && vendorContext) {
    dossierOutcome = `DPA-ul pentru ${vendorContext.vendorName} intră în dosar, rămâne legat de finding și poate fi reverificat la următoarea schimbare contractuală.`
  } else if (findingTypeId === "GDPR-020") {
    dossierOutcome = "Baseline-ul contractual și nota despre unde sunt salvate template-urile intră în dosar pentru audit și review juridic."
  } else if (findingTypeId === "GDPR-021") {
    dossierOutcome = "Pachetul HR, modelul de fișă și nota despre rollout-ul per rol intră în dosar pentru audit HR și control ITM."
  }

  let recipeMonitoringSignals = monitoringSignals
  if (findingTypeId === "GDPR-010" && vendorContext) {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        `Reverificăm schimbările contractuale și termenii DPA pentru ${vendorContext.vendorName}.`,
      ])
    ).slice(0, 5)
  } else if (findingTypeId === "GDPR-020") {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        "Reverificăm baseline-ul contractual când se schimbă modelul de contract, furnizorii sau jurisdicția.",
      ])
    ).slice(0, 5)
  } else if (findingTypeId === "GDPR-021") {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        "Reverificăm fișele de post când apar roluri noi, se schimbă organigrama sau responsabilitățile reale.",
      ])
    ).slice(0, 5)
  } else if (findingTypeId === "NIS2-GENERIC" && nis2GovernanceFocus) {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        nis2GovernanceFocus === "certification"
          ? "Reverificăm expirarea certificării CISO și actualizarea registrului Board & CISO."
          : "Reverificăm training-ul de securitate al conducerii și registrul Board & CISO.",
      ])
    ).slice(0, 5)
  } else if (findingTypeId === "NIS2-GENERIC" && nis2MaturityDomain) {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        `Reverificăm domeniul de maturitate ${nis2MaturityDomain.name} la următorul assessment DNSC.`,
      ])
    ).slice(0, 5)
  } else if (findingTypeId === "NIS2-GENERIC" && nis2SupplyChainFinding && vendorContext) {
    recipeMonitoringSignals = Array.from(
      new Set([
        ...monitoringSignals,
        `Reverificăm revizuirea contractuală și clauzele de securitate pentru ${vendorContext.vendorName}.`,
      ])
    ).slice(0, 5)
  }

  let closureCTA = getClosureCTA(findingTypeId, primaryMode)
  if (findingTypeId === "NIS2-GENERIC" && nis2GovernanceFocus === "certification") {
    closureCTA = "Marchează certificarea actualizată"
  } else if (findingTypeId === "NIS2-GENERIC" && nis2GovernanceFocus === "training") {
    closureCTA = "Marchează training-ul documentat"
  } else if (findingTypeId === "NIS2-GENERIC" && nis2MaturityDomain) {
    closureCTA = "Marchează evaluarea salvată"
  } else if (findingTypeId === "NIS2-GENERIC" && nis2SupplyChainFinding) {
    closureCTA = "Marchează furnizorul revizuit"
  }

  return {
    findingTypeId,
    framework: findingType.framework,
    executionClass,
    documentSupport,
    resolutionMode: primaryMode,
    statusLabel: statusLabels.full,
    collapsedStatusLabel: statusLabels.collapsed,
    uiState,
    resolveFlowState,
    whatUserSees: flow.whatUserSees,
    heroTitle,
    heroSummary,
    whatCompliDoes,
    whatUserMustDo,
    primaryCTA: {
      label: primaryCTALabel,
      action: primaryCTAAction,
    },
    secondaryCTA: getSecondaryCTA(flow.secondaryCTA),
    workflowLink: getWorkflowLink(findingTypeId, record),
    specialistHandoff:
      executionClass === "specialist_handoff"
        ? getSpecialistHandoffContract(findingTypeId, record)
        : undefined,
    closureCTA,
    acceptedEvidence,
    visibleBlocks,
    closeCondition,
    dossierOutcome,
    monitoringSignals: recipeMonitoringSignals,
    vendorContext,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. EXPORTS SUPLIMENTARE (pentru read-only access la cataloage)
// ─────────────────────────────────────────────────────────────────────────────

/** Returnează regulile de blocks per resolution mode */
export function getResolutionModeBlockRules(
  mode: ResolutionMode
): ResolutionModeBlockRules {
  return RESOLUTION_MODE_BLOCK_RULES[mode]
}
