// Catalog complet termene declarative ANAF (Romania) cu reguli de aplicabilitate
// per profil firmă. Folosit ca sursă de adevăr pentru generatorul de calendar.
//
// IMPORTANT: NU inventăm termene. Toate datele și frecvențele sunt prescrise de
// legislație (Cod Fiscal, OUG 120/2021, OG 6/2026, Ordin ANAF etc.). Sursele
// legale sunt citate pe fiecare regulă.
//
// Modelul:
//   - `FiscalDeclarationRule` definește o declarație + când se aplică + cum se
//     calculează termenul + temei legal
//   - `appliesTo(profile)` întoarce dacă regula se aplică profilului dat
//   - `frequency(profile)` întoarce frecvența concretă (poate diferi per profil)
//   - `computeDueDate(period)` calculează termenul exact ANAF
//
// Toate predicatele sunt pure, fără I/O — pot rula client-side sau server-side.

import type { FilingType } from "@/lib/compliance/filing-discipline"
import type { OrgEmployeeCount, OrgProfile } from "@/lib/compliance/applicability"

// ── Profil extins — câmpuri opționale pentru evaluare mai precisă ────────────

/**
 * Profil fiscal extins. Toate câmpurile sunt opționale — generator-ul aplică
 * defaults conservatoare când datele lipsesc.
 */
export type FiscalOrgProfile = OrgProfile & {
  /** Forma juridică — SRL/SA/PFA/ONG/etc. Dacă null, presupunem SRL. */
  legalForm?: "SRL" | "SA" | "PFA" | "II" | "IF" | "ONG" | "SCM" | "RA"
  /** Frecvență TVA reală (din vectorul fiscal). Dacă null, derivăm din CA. */
  vatFrequency?: "monthly" | "quarterly"
  /** Are angajați (relevant pentru D112). Default false dacă lipsește. */
  hasEmployees?: boolean
  /** Tranzacții intracomunitare UE. Default false. */
  hasIntraCommunityTransactions?: boolean
  /** Categorie SAF-T (Mare/Mediu/Mic) — afectează frecvența D406. */
  saftCategory?: "large" | "medium" | "small"
  /** Microîntreprindere (CA ≤ 500K EUR + condiții CF Art. 47). */
  isMicroenterprise?: boolean
  /** Plătitor impozit pe profit (vs microîntreprindere). */
  paysCorporateTax?: boolean
  /** Activitate primul an (afectează frecvențe + termene specifice). */
  isFirstYearOfActivity?: boolean
  /** Data înregistrării ca plătitor TVA (pentru prima D300). */
  vatRegistrationDateISO?: string
}

// ── Estimare CA din employeeCount (când nu avem CA directă) ──────────────────

function estimateAnnualRevenueRon(employeeCount?: OrgEmployeeCount): number | null {
  if (employeeCount === "1-9") return 200_000
  if (employeeCount === "10-49") return 800_000
  if (employeeCount === "50-249") return 5_000_000
  if (employeeCount === "250+") return 30_000_000
  return null
}

// Pragul lunar/trimestrial: CA ≥ 500K RON → LUNAR (CF Art. 322).
const VAT_MONTHLY_THRESHOLD_RON = 500_000

function deriveVatFrequency(profile: FiscalOrgProfile): "monthly" | "quarterly" {
  if (profile.vatFrequency) return profile.vatFrequency
  if (profile.hasIntraCommunityTransactions) return "monthly" // CF Art. 322 alin. (8)
  if (profile.isFirstYearOfActivity) return "quarterly" // implicit primul an
  const revenue = estimateAnnualRevenueRon(profile.employeeCount)
  if (revenue === null) return "quarterly" // conservator
  return revenue >= VAT_MONTHLY_THRESHOLD_RON ? "monthly" : "quarterly"
}

// ── Frecvențe & periode ──────────────────────────────────────────────────────

export type RuleFrequency =
  | "monthly"      // depuneri lunare (12/an)
  | "quarterly"    // depuneri trimestriale (4/an)
  | "annual"       // o singură depunere/an
  | "situational"  // doar la eveniment (înregistrare, modificare, încetare)

// ── Helpers calcul termene ───────────────────────────────────────────────────

/** Returnează ultima zi a unei luni (1-12). Anul/luna 0-indexed nu se folosesc. */
function lastDayOfMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

/** Construiește un ISO date la 23:59:59 UTC pentru ziua dată. */
function toISOEndOfDay(year: number, month1: number, day: number): string {
  const safeDay = Math.min(day, lastDayOfMonth(year, month1))
  return new Date(Date.UTC(year, month1 - 1, safeDay, 23, 59, 59)).toISOString()
}

/** Period helper: "2026-05" → { year: 2026, month: 5 } */
function parseMonthlyPeriod(period: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(period)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]) }
}

/** Period helper: "2026-Q1" → { year: 2026, quarter: 1 } */
function parseQuarterlyPeriod(period: string): { year: number; quarter: number } | null {
  const m = /^(\d{4})-Q([1-4])$/.exec(period)
  if (!m) return null
  return { year: Number(m[1]), quarter: Number(m[2]) }
}

/** "2026-05" → "2026-06" (luna următoare). */
function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/** Quarter → ultima lună a trimestrului (Q1=3, Q2=6, Q3=9, Q4=12). */
function lastMonthOfQuarter(quarter: number): number {
  return quarter * 3
}

// ── Termen ANAF generic: "ziua N a perioadei următoare" ──────────────────────

/**
 * Computează termenul ANAF pentru o perioadă: ziua `dueDay` a perioadei
 * imediat următoare. Ex: D300 perioada "2026-05" lunar → due 25 iunie 2026.
 */
function computeDueAfterPeriod(period: string, dueDay: number): string | null {
  const monthly = parseMonthlyPeriod(period)
  if (monthly) {
    const next = nextMonth(monthly.year, monthly.month)
    return toISOEndOfDay(next.year, next.month, dueDay)
  }
  const quarterly = parseQuarterlyPeriod(period)
  if (quarterly) {
    const lastMonth = lastMonthOfQuarter(quarterly.quarter)
    const next = nextMonth(quarterly.year, lastMonth)
    return toISOEndOfDay(next.year, next.month, dueDay)
  }
  return null
}

/** "2026" → due 25 martie 2027 (D101 anual). */
function computeAnnualDue(periodYear: number, monthDue: number, dayDue: number): string {
  return toISOEndOfDay(periodYear + 1, monthDue, dayDue)
}

// ── Definiția unei reguli declarative ────────────────────────────────────────

export type FiscalDeclarationRule = {
  /** Cod ANAF (D300, D406, etc.) sau identificator unic pentru declarații speciale. */
  code: string
  /** FilingType existent în filing-discipline (pentru reutilizare findings). */
  filingType: FilingType | null  // null = nu mapăm încă pe FilingType existent
  /** Nume scurt afișat user. */
  shortName: string
  /** Descriere completă. */
  fullName: string
  /** Categorie pentru grupare în UI. */
  category: "tva" | "impozit" | "muncitori" | "saft" | "efactura" | "raportari" | "registru"
  /** Predicat aplicabilitate. */
  appliesTo: (profile: FiscalOrgProfile) => boolean
  /** Frecvență calculată per profil. */
  frequencyFor: (profile: FiscalOrgProfile) => RuleFrequency
  /** Calculează termen exact pentru o perioadă. */
  computeDueDate: (period: string, profile: FiscalOrgProfile) => string | null
  /** Temei legal pentru tooltip. */
  legalReference: string
  /** Hint pentru user despre ce e + când. */
  description: string
}

// ── CATALOG — 26 declarații ANAF ─────────────────────────────────────────────
//
// Ordinea: prioritate descrescătoare per cabinet tipic.

export const FISCAL_DECLARATION_RULES: FiscalDeclarationRule[] = [
  // ─── TVA ────────────────────────────────────────────────────────────────

  {
    code: "D300",
    filingType: "d300_tva",
    shortName: "D300 — Decont TVA",
    fullName: "Decont de Taxă pe Valoarea Adăugată (Formularul 300)",
    category: "tva",
    appliesTo: (p) => p.vatRegistered === true,
    frequencyFor: (p) => deriveVatFrequency(p),
    computeDueDate: (period) => computeDueAfterPeriod(period, 25),
    legalReference: "Cod Fiscal Art. 322 · OPANAF 1253/2021",
    description: "Decont TVA — termen 25 a lunii următoare perioadei (lunar/trimestrial).",
  },

  {
    code: "D394",
    filingType: "d394_local",
    shortName: "D394 — Achiziții/livrări locale",
    fullName: "Declarație informativă privind livrările/prestările și achizițiile pe teritoriul național",
    category: "tva",
    appliesTo: (p) => p.vatRegistered === true,
    frequencyFor: (p) => deriveVatFrequency(p),
    computeDueDate: (period) => computeDueAfterPeriod(period, 30),
    legalReference: "OPANAF 705/2020 · Cod Fiscal Art. 322",
    description: "Lista livrări/achiziții B2B locale — termen 30 a lunii următoare.",
  },

  {
    code: "D390",
    filingType: "d390_recap",
    shortName: "D390 — Recapitulativă UE",
    fullName: "Declarație recapitulativă privind livrările/achizițiile/prestările intracomunitare",
    category: "tva",
    appliesTo: (p) =>
      p.vatRegistered === true && p.hasIntraCommunityTransactions === true,
    frequencyFor: () => "monthly", // obligatoriu lunar dacă există tranzacții UE
    computeDueDate: (period) => computeDueAfterPeriod(period, 25),
    legalReference: "Cod Fiscal Art. 325 · OPANAF 705/2020",
    description: "Recapitulativă UE — doar dacă există achiziții/livrări intracomunitare. Termen 25 luna următoare.",
  },

  // ─── Impozit pe profit / microîntreprinderi ────────────────────────────

  {
    code: "D100",
    filingType: null,
    shortName: "D100 — Impozit profit/microîntreprindere",
    fullName: "Declarație privind obligațiile de plată la bugetul de stat",
    category: "impozit",
    // Aplicabil tuturor plătitorilor de impozit (microîntreprindere sau profit)
    appliesTo: (p) => p.legalForm !== "PFA" && p.legalForm !== "II" && p.legalForm !== "IF",
    frequencyFor: (p) =>
      // Microîntreprinderi → trimestrial; impozit profit → trimestrial (cu plăți anticipate)
      p.isMicroenterprise === false && p.paysCorporateTax === true
        ? "quarterly"
        : "quarterly",
    computeDueDate: (period) => computeDueAfterPeriod(period, 25),
    legalReference: "Cod Fiscal Titlul III · OPANAF 587/2016",
    description: "Impozit microîntreprindere (1%/3%) sau profit (16%) — termen 25 luna următoare perioadei.",
  },

  {
    code: "D101",
    filingType: null,
    shortName: "D101 — Impozit profit anual",
    fullName: "Declarație privind impozitul pe profit (anuală)",
    category: "impozit",
    appliesTo: (p) =>
      p.legalForm !== "PFA" &&
      p.legalForm !== "II" &&
      p.legalForm !== "IF" &&
      p.paysCorporateTax === true,
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 3, 25) // 25 martie anul următor
    },
    legalReference: "Cod Fiscal Art. 41 · OPANAF 3386/2016",
    description: "Impozit pe profit anual — termen 25 martie anul următor.",
  },

  // ─── Muncă / contribuții sociale ───────────────────────────────────────

  {
    code: "D112",
    filingType: null,
    shortName: "D112 — Contribuții sociale angajator",
    fullName: "Declarație obligații de plată CAS, CASS, impozit pe venit din salarii",
    category: "muncitori",
    appliesTo: (p) => p.hasEmployees === true,
    frequencyFor: () => "monthly", // întotdeauna lunar
    computeDueDate: (period) => computeDueAfterPeriod(period, 25),
    legalReference: "Cod Fiscal Art. 147 · Lege 296/2020",
    description: "Contribuții salarii (CAS, CASS, impozit) — termen 25 luna următoare. Obligatoriu lunar dacă ai angajați.",
  },

  {
    code: "D205",
    filingType: null,
    shortName: "D205 — Impozit reținut la sursă",
    fullName: "Declarație informativă privind impozitul reținut la sursă",
    category: "muncitori",
    appliesTo: (p) =>
      p.legalForm !== "PFA" && p.legalForm !== "II" && p.legalForm !== "IF",
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 2, 28) // 28 februarie anul următor
    },
    legalReference: "Cod Fiscal Art. 132 · OPANAF 48/2019",
    description: "Impozit reținut la sursă (dividende, drepturi de autor, etc.) — anual, 28 februarie.",
  },

  // ─── SAF-T ─────────────────────────────────────────────────────────────

  {
    code: "D406",
    filingType: "saft",
    shortName: "D406 — SAF-T",
    fullName: "Declarație informativă Standard Audit File for Tax",
    category: "saft",
    // Aplicabil tuturor entităților juridice plătitoare de TVA și microîntreprinderilor mari
    appliesTo: (p) =>
      p.legalForm !== "PFA" && p.legalForm !== "II" && p.legalForm !== "IF",
    frequencyFor: (p) => {
      // Mari/Mijlocii: lunar; Mici: trimestrial (de la 1 ianuarie 2025)
      if (p.saftCategory === "small") return "quarterly"
      return "monthly"
    },
    computeDueDate: (period, p) => {
      const monthly = parseMonthlyPeriod(period)
      if (monthly) {
        const next = nextMonth(monthly.year, monthly.month)
        const lastDay = lastDayOfMonth(next.year, next.month)
        return toISOEndOfDay(next.year, next.month, lastDay)
      }
      const quarterly = parseQuarterlyPeriod(period)
      if (quarterly) {
        const lastMonth = lastMonthOfQuarter(quarterly.quarter)
        const next = nextMonth(quarterly.year, lastMonth)
        const lastDay = lastDayOfMonth(next.year, next.month)
        return toISOEndOfDay(next.year, next.month, lastDay)
      }
      return null
    },
    legalReference: "OPANAF 1783/2021 · 2002/2022 · Cod Procedură Fiscală Art. 59",
    description: "SAF-T XML cu date contabile. Termen ultima zi a lunii următoare perioadei.",
  },

  // ─── e-Factura ─────────────────────────────────────────────────────────

  {
    code: "EF-B2C-MONTHLY",
    filingType: "efactura_monthly",
    shortName: "Raport lunar e-Factura B2C",
    fullName: "Raport lunar facturi B2C transmise prin sistemul național e-Factura",
    category: "efactura",
    // Obligatoriu pentru toți plătitorii TVA cu vânzări B2C de la 2026
    appliesTo: (p) => p.vatRegistered === true,
    frequencyFor: () => "monthly",
    computeDueDate: (period) => computeDueAfterPeriod(period, 5),
    legalReference: "OUG 115/2023 · OUG 120/2021 modif.",
    description: "Raport lunar B2C — termen 5 a lunii următoare. Penalitate 15% din valoare dacă neraportate.",
  },

  // ─── e-TVA precompletată ──────────────────────────────────────────────

  {
    code: "ETVA",
    filingType: "etva_precompletata",
    shortName: "RO e-TVA — răspuns la notificare conformare",
    fullName: "Răspuns la notificare conformare RO e-TVA precompletată",
    category: "tva",
    appliesTo: (p) => p.vatRegistered === true,
    frequencyFor: () => "situational", // doar dacă ANAF trimite notificare
    computeDueDate: () => null, // termen dependent de notificare (20 zile de la primire)
    legalReference: "OUG 70/2024 · Cod Procedură Fiscală Art. 343^1",
    description: "Răspuns la notificare ANAF privind discrepanțe e-TVA precompletată. Termen 20 zile de la primirea notificării.",
  },

  // ─── PFA — declarații specifice ────────────────────────────────────────

  {
    code: "D212",
    filingType: null,
    shortName: "D212 — Declarație unică PFA",
    fullName: "Declarație unică privind impozitul pe venit și contribuțiile sociale (PFA)",
    category: "impozit",
    appliesTo: (p) =>
      p.legalForm === "PFA" || p.legalForm === "II" || p.legalForm === "IF",
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 5, 25) // 25 mai anul următor
    },
    legalReference: "Cod Fiscal Art. 122 · OPANAF 925/2017",
    description: "Declarație unică PFA (impozit + CAS + CASS) — anual, 25 mai.",
  },

  {
    code: "D200",
    filingType: null,
    shortName: "D200 — Venituri PFA",
    fullName: "Declarație privind veniturile realizate (PFA, profesii liberale)",
    category: "impozit",
    appliesTo: (p) =>
      p.legalForm === "PFA" || p.legalForm === "II" || p.legalForm === "IF",
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 5, 25)
    },
    legalReference: "Cod Fiscal Art. 122 · OPANAF 587/2016",
    description: "Venituri realizate PFA — anual, 25 mai. Înlocuiește D200 cu D212 din 2018+.",
  },

  // ─── Cesionare impozit ─────────────────────────────────────────────────

  {
    code: "D230",
    filingType: null,
    shortName: "D230 — Cesionare 3.5%",
    fullName: "Cerere privind destinația sumei reprezentând până la 3.5% din impozit",
    category: "impozit",
    appliesTo: () => true, // disponibil oricărui contribuabil
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year - 1, 5, 25) // sume din anul precedent
    },
    legalReference: "Cod Fiscal Art. 78 · OPANAF 15/2021",
    description: "Cesionare 3.5% impozit către ONG/cult religios — opțional, anual, 25 mai.",
  },

  // ─── Form 082 — PFA înregistrare e-Factura (2026 special) ─────────────

  {
    code: "FORM-082",
    filingType: null,
    shortName: "Form 082 — Înregistrare PFA e-Factura",
    fullName: "Notificare înregistrare în Registrul e-Factura pentru PFA/CNP",
    category: "efactura",
    appliesTo: (p) =>
      p.legalForm === "PFA" || p.legalForm === "II" || p.legalForm === "IF",
    frequencyFor: () => "situational",
    computeDueDate: () =>
      // Termen unic OG 6/2026: 26 mai 2026
      new Date(Date.UTC(2026, 4, 26, 23, 59, 59)).toISOString(),
    legalReference: "OG 6/2026 · Ordin ANAF 378/2026",
    description: "PFA-urile trebuie să se înregistreze în Registrul e-Factura cu Form 082 până la 26 mai 2026.",
  },

  // ─── Operațiuni speciale UE > 100K EUR ─────────────────────────────────

  {
    code: "D700",
    filingType: null,
    shortName: "D700 — Modificare vector fiscal",
    fullName: "Declarație de modificare în vector fiscal",
    category: "registru",
    appliesTo: () => true, // oricine își poate modifica vectorul
    frequencyFor: () => "situational",
    computeDueDate: () => null,
    legalReference: "OPANAF 1699/2021",
    description: "Modificare vector fiscal (schimbare frecvență TVA, înregistrare TVA, etc.). Situațional — nu are termen recurent.",
  },

  // ─── Declarații anuale informative ────────────────────────────────────

  {
    code: "D205-IS",
    filingType: null,
    shortName: "D205 — Informare salariați",
    fullName: "Declarație informativă privind impozitul reținut salariați (D205)",
    category: "muncitori",
    appliesTo: (p) => p.hasEmployees === true,
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 2, 28)
    },
    legalReference: "Cod Fiscal Art. 132 · OPANAF 48/2019",
    description: "Informativă anuală impozit salariați — termen 28 februarie anul următor.",
  },

  {
    code: "D170",
    filingType: null,
    shortName: "D170 — Bunuri valori sub 50K EUR",
    fullName: "Declarație informativă bunuri sau valori intrate sub 50K EUR",
    category: "raportari",
    appliesTo: (p) => p.legalForm !== "PFA",
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 4, 25)
    },
    legalReference: "OPANAF 2884/2018",
    description: "Informativă bunuri/valori — anual, 25 aprilie anul următor.",
  },

  {
    code: "D204",
    filingType: null,
    shortName: "D204 — Asociere fără personalitate juridică",
    fullName: "Declarație asociere fără personalitate juridică",
    category: "raportari",
    appliesTo: () => false, // doar pentru asocieri — nu aplicăm general
    frequencyFor: () => "annual",
    computeDueDate: (period) => {
      const year = Number(period)
      if (!Number.isFinite(year)) return null
      return computeAnnualDue(year, 3, 15)
    },
    legalReference: "Cod Fiscal Art. 125 · OPANAF 50/2019",
    description: "Doar pentru asocieri (DPS) — anual, 15 martie.",
  },

  // ─── Înregistrări inițiale (situaționale) ──────────────────────────────

  {
    code: "D010",
    filingType: null,
    shortName: "D010 — Înregistrare fiscală inițială",
    fullName: "Declarație de înregistrare fiscală/mențiuni persoane juridice",
    category: "registru",
    appliesTo: (p) =>
      p.legalForm !== "PFA" && p.legalForm !== "II" && p.legalForm !== "IF",
    frequencyFor: () => "situational",
    computeDueDate: () => null,
    legalReference: "OPANAF 3725/2017",
    description: "Înregistrare/modificare date fiscale persoane juridice — situațional.",
  },

  {
    code: "D070",
    filingType: null,
    shortName: "D070 — Înregistrare PFA",
    fullName: "Declarație înregistrare fiscală PFA/profesii liberale",
    category: "registru",
    appliesTo: (p) =>
      p.legalForm === "PFA" || p.legalForm === "II" || p.legalForm === "IF",
    frequencyFor: () => "situational",
    computeDueDate: () => null,
    legalReference: "OPANAF 3725/2017",
    description: "Înregistrare/modificare date fiscale PFA — situațional.",
  },

  {
    code: "D098",
    filingType: null,
    shortName: "D098 — Schimbare frecvență TVA",
    fullName: "Cerere schimbare frecvență TVA (lunar ↔ trimestrial)",
    category: "tva",
    appliesTo: (p) => p.vatRegistered === true,
    frequencyFor: () => "situational",
    computeDueDate: () => null, // depune până 25 ianuarie pentru aplicabilitate anul curent
    legalReference: "OPANAF 631/2016",
    description: "Schimbare frecvență TVA — depune până 25 ianuarie pentru a se aplica anul curent.",
  },
]

// ── API util pentru consumatori ──────────────────────────────────────────────

/**
 * Returnează toate regulile aplicabile unui profil, sortate după prioritate.
 */
export function applicableRules(profile: FiscalOrgProfile): FiscalDeclarationRule[] {
  return FISCAL_DECLARATION_RULES.filter((rule) => rule.appliesTo(profile))
}

/**
 * Numără câte declarații se aplică unui profil dat — folosit în UI summary.
 */
export function countApplicableRules(profile: FiscalOrgProfile): number {
  return applicableRules(profile).length
}

/**
 * Grupare per categorie pentru afișare în UI.
 */
export function groupRulesByCategory(
  rules: FiscalDeclarationRule[],
): Record<FiscalDeclarationRule["category"], FiscalDeclarationRule[]> {
  const groups: Record<FiscalDeclarationRule["category"], FiscalDeclarationRule[]> = {
    tva: [],
    impozit: [],
    muncitori: [],
    saft: [],
    efactura: [],
    raportari: [],
    registru: [],
  }
  for (const rule of rules) {
    groups[rule.category].push(rule)
  }
  return groups
}

// ── Export pentru testare ────────────────────────────────────────────────────

export const __test_helpers = {
  estimateAnnualRevenueRon,
  deriveVatFrequency,
  computeDueAfterPeriod,
  computeAnnualDue,
  parseMonthlyPeriod,
  parseQuarterlyPeriod,
}
