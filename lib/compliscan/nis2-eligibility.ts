// Faza 2 — TASK 8: NIS2 Eligibility Gate
// Wizard simplu de 3 întrebări: sector, angajați, cifră de afaceri.
// Bazat pe OUG 155/2024 (transpunere NIS2 în România).
// Funcție pură, fără I/O.

// ── Types ────────────────────────────────────────────────────────────────────

export type Nis2Sector = {
  id: string
  label: string
  annex: "1" | "2"          // Anexa 1 = esențiale, Anexa 2 = importante
  examples?: string
}

export type Nis2EmployeeRange = "sub50" | "50-250" | "peste250"
export type Nis2RevenueRange = "sub10m" | "10-50m" | "peste50m"

export type Nis2EligibilityResult =
  | "nu_intri"
  | "posibil"
  | "intri"

export type Nis2EligibilityOutput = {
  result: Nis2EligibilityResult
  title: string
  description: string
  recommendation: string
}

// ── Sector catalogue (OUG 155/2024) ──────────────────────────────────────────

export const NIS2_SECTORS: Nis2Sector[] = [
  // Anexa 1 — Sectoare de importanță ridicată (entități esențiale)
  { id: "energy", label: "Energie (electricitate, petrol, gaz, hidrogen)", annex: "1" },
  { id: "transport", label: "Transport (aerian, feroviar, naval, rutier)", annex: "1" },
  { id: "banking", label: "Sectorul bancar", annex: "1" },
  { id: "financial-markets", label: "Infrastructuri ale piețelor financiare", annex: "1" },
  { id: "health", label: "Sănătate (spitale, laboratoare, farma)", annex: "1" },
  { id: "drinking-water", label: "Apă potabilă", annex: "1" },
  { id: "waste-water", label: "Ape uzate", annex: "1" },
  { id: "digital-infrastructure", label: "Infrastructură digitală (ISP, DNS, cloud, DC)", annex: "1" },
  { id: "ict-service-management", label: "Gestionarea serviciilor TIC (B2B)", annex: "1" },
  { id: "public-admin", label: "Administrație publică", annex: "1" },
  { id: "space", label: "Spațiu (furnizori infrastructură spațială)", annex: "1" },
  // Anexa 2 — Alte sectoare critice (entități importante)
  { id: "postal", label: "Servicii poștale și de curierat", annex: "2" },
  { id: "waste-management", label: "Gestionarea deșeurilor", annex: "2" },
  { id: "chemicals", label: "Fabricare, producere, distribuire substanțe chimice", annex: "2" },
  { id: "food", label: "Producție, prelucrare și distribuție de produse alimentare", annex: "2" },
  { id: "manufacturing", label: "Producție (dispozitive medicale, IT, auto, mașini)", annex: "2" },
  { id: "digital-providers", label: "Furnizori de servicii digitale (marketplace, search, social)", annex: "2" },
  { id: "research", label: "Cercetare (organizații de cercetare)", annex: "2" },
  // Non-NIS2
  { id: "other", label: "Alt sector (retail, servicii profesionale, educație etc.)", annex: "2" },
]

// ── Engine ────────────────────────────────────────────────────────────────────

export function evaluateNis2Eligibility(
  sectorId: string,
  employees: Nis2EmployeeRange,
  revenue: Nis2RevenueRange,
): Nis2EligibilityOutput {
  const sector = NIS2_SECTORS.find((s) => s.id === sectorId)

  // Non-NIS2 sector
  if (!sector || sectorId === "other") {
    return {
      result: "nu_intri",
      title: "Nu intri sub NIS2",
      description:
        "Sectorul tău nu este inclus în Anexele 1 sau 2 ale OUG 155/2024. " +
        "Obligațiile NIS2 nu ți se aplică în mod direct.",
      recommendation:
        "Reverificăm automat dacă sectorul tău e adăugat sau dacă dimensiunea firmei se schimbă.",
    }
  }

  const isAnnex1 = sector.annex === "1"
  const isLarge = employees === "peste250" || revenue === "peste50m"
  const isMedium = employees === "50-250" || revenue === "10-50m"
  const isSmall = employees === "sub50" && revenue === "sub10m"

  // Large enterprise in any NIS2 sector → definite
  if (isLarge) {
    return {
      result: "intri",
      title: "Intri sub NIS2",
      description:
        `Firma ta activează în sectorul „${sector.label}" (Anexa ${sector.annex}) ` +
        `și depășește pragurile de dimensiune. Ești clasificat ca entitate ` +
        `${isAnnex1 ? "esențială" : "importantă"} conform OUG 155/2024.`,
      recommendation:
        "Termenul de înregistrare la DNSC era septembrie 2025. " +
        "Începe assessment-ul NIS2 complet și înregistrează-te la DNSC cât mai repede.",
    }
  }

  // Medium enterprise in NIS2 sector → definite (NIS2 Art. 2)
  if (isMedium) {
    return {
      result: "intri",
      title: "Intri sub NIS2",
      description:
        `Firma ta activează în sectorul „${sector.label}" (Anexa ${sector.annex}) ` +
        `și îndeplinește criteriile de entitate mijlocie (50-250 angajați sau 10-50M EUR). ` +
        `Ești clasificat ca entitate ${isAnnex1 ? "esențială" : "importantă"}.`,
      recommendation:
        "Termenul de înregistrare la DNSC era septembrie 2025. " +
        "Începe evaluarea NIS2 pentru a identifica obligațiile specifice.",
    }
  }

  // Small enterprise in Annex 1 sector → possible (some exceptions apply)
  if (isSmall && isAnnex1) {
    return {
      result: "posibil",
      title: "Posibil să intri sub NIS2",
      description:
        `Firma ta activează în sectorul „${sector.label}" (Anexa 1 — importanță ridicată), ` +
        `dar dimensiunea este sub pragurile standard. Totuși, statele membre pot desemna ` +
        `și entități mici din sectoare critice ca „esențiale" (Art. 2(2) NIS2).`,
      recommendation:
        "Recomandăm o verificare detaliată. Dacă furnizezi servicii critice pentru " +
        "alte entități esențiale, poți fi desemnat indiferent de dimensiune.",
    }
  }

  // Small enterprise in Annex 2 sector → unlikely
  if (isSmall) {
    return {
      result: "nu_intri",
      title: "Nu intri sub NIS2",
      description:
        `Firma ta activează în sectorul „${sector.label}" (Anexa 2), dar dimensiunea ` +
        `este sub pragurile NIS2 (sub 50 angajați și sub 10M EUR cifra de afaceri).`,
      recommendation:
        "Reverificăm automat dacă firma ta crește sau dacă DNSC te desemnează explicit.",
    }
  }

  // Fallback
  return {
    result: "posibil",
    title: "Necesită verificare suplimentară",
    description: "Nu am putut determina cu certitudine eligibilitatea. Recomandăm assessment complet.",
    recommendation: "Începe evaluarea NIS2 pentru rezultat detaliat.",
  }
}
