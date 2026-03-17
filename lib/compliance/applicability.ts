// Applicability Engine — stratul zero al CompliScan.
// Determină ce legi se aplică organizației ÎNAINTE de a deschide modulele.
// Funcție pură, fără I/O, safe în browser și pe server.

export type OrgSector =
  | "energy"
  | "transport"
  | "banking"
  | "health"
  | "digital-infrastructure"
  | "public-admin"
  | "finance"
  | "retail"
  | "manufacturing"
  | "professional-services"
  | "other"

export type OrgEmployeeCount = "1-9" | "10-49" | "50-249" | "250+"

export type OrgProfile = {
  sector: OrgSector
  employeeCount: OrgEmployeeCount
  usesAITools: boolean        // OpenAI, Copilot, Gemini, orice LLM / AI SaaS
  requiresEfactura: boolean   // firme plătitoare de TVA cu tranzacții B2B ≥ 5.000 RON
  completedAtISO: string
}

export type ApplicabilityTag = "gdpr" | "efactura" | "nis2" | "ai-act"

export type ApplicabilityCertainty = "certain" | "probable" | "unlikely"

export type ApplicabilityEntry = {
  tag: ApplicabilityTag
  certainty: ApplicabilityCertainty
  reason: string
}

export type ApplicabilityResult = {
  tags: ApplicabilityTag[]                              // active tags (certain + probable)
  entries: ApplicabilityEntry[]                         // toate, inclusiv unlikely
  completedAtISO: string
}

// ── Sector sets ───────────────────────────────────────────────────────────────

const NIS2_ESSENTIAL_SECTORS: OrgSector[] = [
  "energy", "transport", "banking", "health", "digital-infrastructure", "public-admin",
]

const NIS2_IMPORTANT_SECTORS: OrgSector[] = [
  "finance", "manufacturing", "professional-services",
]

// ── Engine ────────────────────────────────────────────────────────────────────

/**
 * Evaluează aplicabilitatea regulamentelor pentru o organizație.
 * Returnează ApplicabilityResult cu tags active (certain + probable)
 * și reasoning per regulament.
 *
 * @param profile - Profilul organizației (4 câmpuri)
 * @returns ApplicabilityResult — pur, determinist, fără I/O
 */
export function evaluateApplicability(profile: OrgProfile): ApplicabilityResult {
  const now = new Date().toISOString()
  const entries: ApplicabilityEntry[] = []

  // ── GDPR: se aplică tuturor entităților din România care procesează date personale
  entries.push({
    tag: "gdpr",
    certainty: "certain",
    reason:
      "GDPR se aplică oricărei organizații din România (sau care prelucrează date ale cetățenilor UE), indiferent de dimensiune sau sector.",
  })

  // ── e-Factura: obligatoriu pentru firmele cu TVA în tranzacții B2B
  entries.push({
    tag: "efactura",
    certainty: profile.requiresEfactura ? "certain" : "unlikely",
    reason: profile.requiresEfactura
      ? "Ești obligat să transmiți facturile prin e-Factura (SPV/ANAF) pentru tranzacțiile B2B ≥ 5.000 RON."
      : "Organizația ta nu a indicat obligativitate e-Factura. Verifică cu contabilul dacă ești plătitor de TVA.",
  })

  // ── NIS2: entități esențiale/importante sau organizații cu infra cloud critică
  const isEssentialSector = NIS2_ESSENTIAL_SECTORS.includes(profile.sector)
  const isImportantSector = NIS2_IMPORTANT_SECTORS.includes(profile.sector)
  const isMediumPlus = profile.employeeCount === "50-249" || profile.employeeCount === "250+"

  let nis2Certainty: ApplicabilityCertainty
  let nis2Reason: string

  if (isEssentialSector) {
    nis2Certainty = "certain"
    nis2Reason =
      "Sectorul tău este clasificat ca sector esențial în NIS2 (Anexa I). Obligațiile NIS2 se aplică indiferent de dimensiunea organizației."
  } else if (isImportantSector && isMediumPlus) {
    nis2Certainty = "probable"
    nis2Reason =
      "Sectorul tău și dimensiunea organizației (≥50 angajați) sugerează că ești entitate importantă NIS2 (Anexa II). Verifică cu un specialist."
  } else if (isMediumPlus) {
    nis2Certainty = "probable"
    nis2Reason =
      "Organizațiile cu ≥50 angajați sau cifră de afaceri ≥10M€ pot fi încadrate ca entități NIS2. Recomandăm verificarea cu un consultant."
  } else {
    nis2Certainty = "unlikely"
    nis2Reason =
      "Pe baza sectorului și dimensiunii, NIS2 probabil nu se aplică direct. Poți fi afectat indirect prin cerințele furnizorilor tăi critici."
  }

  entries.push({ tag: "nis2", certainty: nis2Certainty, reason: nis2Reason })

  // ── AI Act: se aplică dacă folosești sisteme AI sau ești furnizor/deployer
  let aiActCertainty: ApplicabilityCertainty
  let aiActReason: string

  if (profile.usesAITools) {
    aiActCertainty = "probable"
    aiActReason =
      "Folosești unelte AI (LLM, copilot, clasificare automată etc.). Obligațiile de transparență și AI literacy se aplică din 2 februarie 2025. Sistemele high-risk intră sub reglementare din august 2026."
  } else {
    aiActCertainty = "unlikely"
    aiActReason =
      "Nu ai indicat utilizare de sisteme AI. Dacă în viitor integrezi unelte bazate pe modele ML sau LLM, vei intra sub incidența AI Act."
  }

  entries.push({ tag: "ai-act", certainty: aiActCertainty, reason: aiActReason })

  // ── Compile active tags (certain + probable)
  const tags = entries
    .filter((e) => e.certainty !== "unlikely")
    .map((e) => e.tag)

  return { tags, entries, completedAtISO: now }
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export const ORG_SECTOR_LABELS: Record<OrgSector, string> = {
  energy: "Energie",
  transport: "Transport",
  banking: "Servicii bancare / financiare",
  health: "Sănătate",
  "digital-infrastructure": "Infrastructură digitală / IT",
  "public-admin": "Administrație publică",
  finance: "Finanțe (non-banking)",
  retail: "Comerț / Retail",
  manufacturing: "Producție / Industrie",
  "professional-services": "Servicii profesionale (juridic, contabilitate, consultanță)",
  other: "Alt sector",
}

export const ORG_EMPLOYEE_COUNT_LABELS: Record<OrgEmployeeCount, string> = {
  "1-9": "1–9 angajați (micro)",
  "10-49": "10–49 angajați (mică)",
  "50-249": "50–249 angajați (medie)",
  "250+": "250+ angajați (mare)",
}

export const APPLICABILITY_TAG_LABELS: Record<ApplicabilityTag, string> = {
  gdpr: "GDPR",
  efactura: "e-Factura",
  nis2: "NIS2",
  "ai-act": "AI Act",
}

export const APPLICABILITY_CERTAINTY_LABELS: Record<ApplicabilityCertainty, string> = {
  certain: "Se aplică",
  probable: "Probabil aplicabil",
  unlikely: "Probabil neaplicabil",
}
