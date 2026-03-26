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

import type { ScanFinding } from "@/lib/compliance/types"
import type { FindingDocumentFlowState } from "@/lib/compliscan/finding-cockpit"
import { fingerprintMatch, listLibraryVendors } from "@/lib/compliance/vendor-library"
import { ANSPDCP_FINDING_PREFIX, getIncidentIdFromAnspdcpFindingId } from "@/lib/compliance/anspdcp-breach-rescue"

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FindingFramework = "GDPR" | "NIS2" | "eFactura" | "AI Act" | "Cross"

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
  resolutionMode: ResolutionMode
  statusLabel: string
  collapsedStatusLabel: string
  uiState: CockpitUIState
  resolveFlowState: ResolveFlowState
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
    closingRule: "document generat, confirmat și salvat în Vault",
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
  "EF-001": {
    findingTypeId: "EF-001",
    framework: "eFactura",
    title: "SPV lipsă / neverificat",
    category: "SPV",
    typicalSeverity: "high",
    signalTypes: ["direct", "inferred"],
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["explică pașii", "cere dovada activării"],
    userResponsibilities: ["activează SPV"],
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
    resolutionModes: ["external_action"],
    primaryActors: ["user"],
    compliCapabilities: ["afișează motivul și acțiunea recomandată"],
    userResponsibilities: ["corectează în ERP / soft"],
    requiredEvidenceKinds: ["xml", "screenshot"],
    autoRecheck: "yes",
    closingRule: "status nou valid sau dovada corecției",
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
    whatUserMustDo: "Completează datele reale și confirmă.",
    closeCondition: "Document generat, confirmat și salvat în Vault.",
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
    whatUserMustDo: "Verifică și publică politica.",
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
    whatUserMustDo: "Confirmă relația și încarcă / semnează.",
    closeCondition: "DPA prezent și confirmat.",
    revalidationTriggers: ["expirare DPA", "vendor schimbat"],
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
    whatUserMustDo: "Confirmă persoanele și regulile.",
    closeCondition: "Oversight definit și salvat.",
    revalidationTriggers: ["reorganizare", "sistem nou"],
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
  const title = record.title.toLowerCase()
  const detail = record.detail.toLowerCase()
  const evidence = (record.evidenceRequired ?? "").toLowerCase()
  const remediation = (record.remediationHint ?? "").toLowerCase()

  // Specific id pattern mappings first
  if (id === "dsar-no-procedure") return "GDPR-013"
  if (id.startsWith(ANSPDCP_FINDING_PREFIX)) return "GDPR-019"
  if (
    id === "intake-b2c-privacy" ||
    id === "intake-gdpr-privacy-policy" ||
    id === "intake-site-privacy-policy"
  ) {
    return "GDPR-001"
  }
  if (id === "intake-vendor-no-dpa") return "GDPR-010"
  if (id === "intake-site-cookies") return "GDPR-005"
  if (id === "saft-d406-registration") return "EF-001"
  if (id.startsWith("saft-")) return "EF-GENERIC"
  if (id === "nis2-finding-eligibility") return "NIS2-001"
  if (id.startsWith("nis2-finding-")) return "NIS2-005"

  if (
    framework === "eFactura" &&
    (
      title.includes("factură anaf respinsă") ||
      title.includes("factura anaf respinsa") ||
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
  if (findingTypeId !== "GDPR-010") return undefined

  const candidates = [
    record.title,
    record.detail,
    record.remediationHint,
    [record.title, record.detail].filter(Boolean).join(" · "),
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase()
    for (const vendor of listLibraryVendors()) {
      const matchedAlias = vendor.aliases.find((alias) => candidateLower.includes(alias.toLowerCase()))
      if (!matchedAlias) continue

      return {
        vendorId: vendor.id,
        vendorName: vendor.canonicalName,
        dpaUrl: vendor.dpaUrl,
        matchConfidence: 0.9,
        matchType: "contains",
      }
    }
  }

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
  if (record.suggestedDocumentType) return "draft_missing"
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
  findingType: FindingTypeDefinition
): CockpitVisibleBlocks {
  const primaryMode = findingType.resolutionModes[0]
  const rules = RESOLUTION_MODE_BLOCK_RULES[primaryMode]
  const { collapsedPrimaryCTA, collapsedStatusLabel } = getCollapsedPresentation(
    uiState,
    flow.primaryCTA
  )

  const allBlocks: CockpitBlockKey[] = []
  const shouldShowGenerator =
    rules.generatorBlock ||
    (primaryMode === "in_app_guided" &&
      (uiState === "ready_to_generate" || uiState === "evidence_uploaded"))

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
      return "Documentul generat și aprobat intră în Vault ca dovadă verificabilă."
    case "external_action":
      return "Dovada operațională (screenshot, referință oficială) se atașează la dosar."
    case "user_attestation":
      return "Atestarea documentează și confirmă conformitatea pentru audit."
  }
}

function getWorkflowLink(
  findingTypeId: string,
  record: ScanFinding
): CockpitRecipe["workflowLink"] | undefined {
  switch (findingTypeId) {
    case "GDPR-013":
      return {
        href: "/dashboard/dsar?action=new",
        label: "Deschide DSAR",
      }
    case "GDPR-019": {
      const incidentId = getIncidentIdFromAnspdcpFindingId(record.id)
      if (!incidentId) return undefined
      const search = new URLSearchParams({
        tab: "incidents",
        incidentId,
        focus: "anspdcp",
        findingId: record.id,
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
    default:
      return undefined
  }
}

function getClosureCTA(
  findingTypeId: string,
  primaryMode: ResolutionMode
): string | undefined {
  switch (findingTypeId) {
    case "GDPR-005":
      return "Trimite la dosar și monitorizare"
    case "GDPR-013":
      return "Marchează răspunsul trimis"
    case "GDPR-019":
      return "Marchează notificarea ANSPDCP"
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
  "GDPR-013": 30,
  "GDPR-019": null,
  "NIS2-001": 365,
  "NIS2-005": 180,
  "NIS2-015": 7,
  "AI-001": 180,
  "AI-005": 180,
  "EF-001": 30,
  "EF-003": 7,
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
// 8. PUBLIC API
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
  const requiresGeneratedDocument =
    findingType.requiredEvidenceKinds.includes("generated_document") ||
    (flow.initialFlowState === "ready_to_generate" &&
      (primaryMode === "in_app_guided" || primaryMode === "in_app_full"))
  const requiresRevalidationConfirmation = flow.initialFlowState === "needs_revalidation"

  return {
    requiresGeneratedDocument,
    requiresConfirmationChecklist: requiresGeneratedDocument,
    requiresEvidenceNote:
      !requiresGeneratedDocument &&
      !requiresRevalidationConfirmation &&
      (primaryMode === "external_action" || findingType.requiredEvidenceKinds.includes("uploaded_file")),
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
  const visibleBlocks = buildVisibleBlocks(uiState, flow, findingType)
  const resolveFlowState = uiStateToFlowState(uiState, flow.initialFlowState)
  const vendorContext = inferVendorContext(record, findingTypeId)

  // 6. CTA principal
  const primaryCTAAction = getPrimaryCTAAction(uiState, primaryMode)

  // 7. Monitoring signals
  const signals: string[] = [...flow.revalidationTriggers]
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
  const heroSummary =
    record.resolution?.problem ??
    flow.whatUserSees ??
    record.detail
  const whatCompliDoes =
    findingTypeId === "GDPR-010" && vendorContext?.dpaUrl
      ? `${flow.whatCompliDoes} Ți-am găsit și linkul public DPA pentru ${vendorContext.vendorName}.`
      : flow.whatCompliDoes
  const whatUserMustDo =
    findingTypeId === "GDPR-010" && vendorContext
      ? `${flow.whatUserMustDo} Confirmă relația cu ${vendorContext.vendorName} și atașează acordul semnat sau draftul aprobat.`
      : flow.whatUserMustDo
  const acceptedEvidence = findingType.requiredEvidenceKinds.map(
    (k) => EVIDENCE_KIND_LABELS[k] ?? k
  )
  if (findingTypeId === "GDPR-010" && vendorContext) {
    acceptedEvidence.unshift(`DPA semnat cu ${vendorContext.vendorName}`)
  }
  const dossierOutcome =
    findingTypeId === "GDPR-010" && vendorContext
      ? `DPA-ul pentru ${vendorContext.vendorName} intră în dosar, rămâne legat de finding și poate fi reverificat la următoarea schimbare contractuală.`
      : getDossierOutcome(primaryMode)
  const recipeMonitoringSignals =
    findingTypeId === "GDPR-010" && vendorContext
      ? Array.from(
          new Set([
            ...monitoringSignals,
            `Reverificăm schimbările contractuale și termenii DPA pentru ${vendorContext.vendorName}.`,
          ])
        ).slice(0, 5)
      : monitoringSignals

  return {
    findingTypeId,
    framework: findingType.framework,
    resolutionMode: primaryMode,
    statusLabel: statusLabels.full,
    collapsedStatusLabel: statusLabels.collapsed,
    uiState,
    resolveFlowState,
    heroTitle,
    heroSummary,
    whatCompliDoes,
    whatUserMustDo,
    primaryCTA: {
      label: flow.primaryCTA,
      action: primaryCTAAction,
    },
    secondaryCTA: getSecondaryCTA(flow.secondaryCTA),
    workflowLink: getWorkflowLink(findingTypeId, record),
    closureCTA: getClosureCTA(findingTypeId, primaryMode),
    acceptedEvidence,
    visibleBlocks,
    closeCondition: flow.closeCondition,
    dossierOutcome,
    monitoringSignals: recipeMonitoringSignals,
    vendorContext,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. EXPORTS SUPLIMENTARE (pentru read-only access la cataloage)
// ─────────────────────────────────────────────────────────────────────────────

/** Returnează regulile de blocks per resolution mode */
export function getResolutionModeBlockRules(
  mode: ResolutionMode
): ResolutionModeBlockRules {
  return RESOLUTION_MODE_BLOCK_RULES[mode]
}
