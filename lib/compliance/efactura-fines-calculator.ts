// Pure-function lib pentru calcul amenzi e-Factura, SAF-T D406, e-TVA, și
// neraportare ANAF SPV. Bază legală:
//   - OUG 120/2021 (e-Factura) modif. OUG 115/2023
//   - Cod Procedură Fiscală Art. 336 (SAF-T D406)
//   - OUG 70/2024 + 89/2025 (RO e-TVA)
//
// Pragurile aici sunt INFORMATIVE — pentru orientare. Decizia ANAF este
// întotdeauna în limita prevăzută de lege și depinde de circumstanțe.
//
// NU ESTE CONSULTANȚĂ JURIDICĂ. Folosit ca ghid de magnitudine pentru
// vizitatori (lead-magnet) — recomandăm verificare CECCAR / fiscalist.

// ── Categorii de contribuabili (per OPANAF 1.783/2021) ───────────────────────

export type TaxpayerCategory = "mare" | "mediu" | "mic_intermediar" | "mic"

// Reprezintă pragurile aproximative ANAF — actualizate periodic.
const CATEGORY_LABELS: Record<TaxpayerCategory, string> = {
  mare: "Contribuabil mare",
  mediu: "Contribuabil mediu",
  mic_intermediar: "Contribuabil mic — intermediar",
  mic: "Contribuabil mic / micro",
}

// ── Tipuri de încălcare ──────────────────────────────────────────────────────

export type ViolationType =
  | "efactura_nedepusa"           // factură netransmisă în SPV (5 zile calendaristice B2B)
  | "efactura_b2c_nedepusa"       // factură B2C netransmisă în 5 zile LUCRĂTOARE (din 1 ian 2025)
  | "efactura_intarziere"         // factură depusă cu întârziere
  | "efactura_xml_eroare"         // XML respins repetat (>3 ori)
  | "saft_d406_nedepusa"          // declarație D406 lipsă
  | "saft_d406_intarziere"        // D406 depus cu întârziere
  | "etva_neresponded"            // notificare conformare RO e-TVA neResponded
  | "spv_neactivat"               // neînregistrare SPV
  | "registru_facturi_neactualizat" // jurnal vânzări/cumpărări neactualizat

export type FineEstimate = {
  violation: ViolationType
  violationLabel: string
  taxpayerCategory: TaxpayerCategory
  taxpayerLabel: string
  count: number                   // câte încălcări
  minPerOccurrence: number        // amendă minimă RON
  maxPerOccurrence: number        // amendă maximă RON
  totalMinRON: number             // total minim
  totalMaxRON: number             // total maxim
  legalReference: string
  recommendation: string
}

// ── Praguri amenzi (RON) per OUG 120/2021 + Cod Proc. Fiscală Art. 336 ───────

type FineRange = { min: number; max: number; legal: string }

const EFACTURA_FINES: Record<TaxpayerCategory, FineRange> = {
  mare: {
    min: 5_000,
    max: 10_000,
    legal: "OUG 120/2021 Art. 13(2) lit. a) — modif. OUG 115/2023",
  },
  mediu: {
    min: 2_500,
    max: 5_000,
    legal: "OUG 120/2021 Art. 13(2) lit. b) — modif. OUG 115/2023",
  },
  mic_intermediar: {
    min: 1_000,
    max: 2_500,
    legal: "OUG 120/2021 Art. 13(2) lit. c) — modif. OUG 115/2023",
  },
  mic: {
    min: 500,
    max: 1_000,
    legal: "OUG 120/2021 Art. 13(2) lit. c) — modif. OUG 115/2023",
  },
}

const SAFT_FINES: Record<TaxpayerCategory, FineRange> = {
  mare: {
    min: 5_000,
    max: 10_000,
    legal: "Cod Procedură Fiscală Art. 336 alin. (1) lit. b)",
  },
  mediu: {
    min: 2_500,
    max: 5_000,
    legal: "Cod Procedură Fiscală Art. 336 alin. (1) lit. b)",
  },
  mic_intermediar: {
    min: 1_000,
    max: 2_500,
    legal: "Cod Procedură Fiscală Art. 336 alin. (1) lit. b)",
  },
  mic: {
    min: 1_000,
    max: 5_000,
    legal: "Cod Procedură Fiscală Art. 336 alin. (1) lit. b)",
  },
}

const ETVA_NOTIFICATION_FINES: Record<TaxpayerCategory, FineRange> = {
  mare: {
    min: 10_000,
    max: 30_000,
    legal: "OUG 70/2024 Art. modif. 89/2025 — neResponded la notificare",
  },
  mediu: {
    min: 5_000,
    max: 15_000,
    legal: "OUG 70/2024 Art. modif. 89/2025",
  },
  mic_intermediar: {
    min: 2_500,
    max: 7_500,
    legal: "OUG 70/2024 Art. modif. 89/2025",
  },
  mic: {
    min: 2_500,
    max: 7_500,
    legal: "OUG 70/2024 Art. modif. 89/2025",
  },
}

// ── Estimator principal ──────────────────────────────────────────────────────

export type ViolationInput = {
  type: ViolationType
  count: number
}

const VIOLATION_LABELS: Record<ViolationType, string> = {
  efactura_nedepusa: "Factură B2B netransmisă în SPV (>5 zile calendaristice)",
  efactura_b2c_nedepusa: "Factură B2C netransmisă în SPV (>5 zile lucrătoare — din 1 ian 2025)",
  efactura_intarziere: "Factură transmisă cu întârziere",
  efactura_xml_eroare: "XML respins repetat (>3 ori)",
  saft_d406_nedepusa: "D406 SAF-T nedepus",
  saft_d406_intarziere: "D406 SAF-T cu întârziere",
  etva_neresponded: "Notificare RO e-TVA neResponded (>20 zile)",
  spv_neactivat: "Cont SPV neactivat",
  registru_facturi_neactualizat: "Jurnal vânzări/cumpărări neactualizat",
}

const VIOLATION_RECOMMENDATIONS: Record<ViolationType, string> = {
  efactura_nedepusa:
    "Transmite imediat în SPV. Pentru recurența: implementează cron auto-validare lunar și conectează ERP cu webhook e-Factura.",
  efactura_b2c_nedepusa:
    "B2C are termen mai scurt (5 zile lucrătoare, NU calendaristice — OUG 120/2021 modif. OUG 69/2024). Marchează facturile B2C la emitere și activează alertă pe ziua 3 lucrătoare.",
  efactura_intarziere:
    "Stabilește SLA intern de 3 zile lucrătoare per emisă; CompliScan trimite alertă pe ziua 4.",
  efactura_xml_eroare:
    "Folosește validatorul UBL CIUS-RO ÎNAINTE de transmitere; auto-repair pentru codurile V001-V011 frecvente.",
  saft_d406_nedepusa:
    "Verifică categoria contribuabilului (lunar mare/mediu, trimestrial mic) și configurează cron lunar/trimestrial cu reminder pe ziua 25.",
  saft_d406_intarziere:
    "Implementează checklist închidere contabilă cu deadline T+25; folosește SAF-T Hygiene Calculator pentru pre-validare.",
  etva_neresponded:
    "Activează cron lunar de comparare D300 vs P300; CompliScan generează finding preventiv ÎNAINTE de notificarea oficială ANAF.",
  spv_neactivat:
    "Activează SPV imediat la registrul comerțului; fără SPV nu poți primi notificări ANAF și ești în default.",
  registru_facturi_neactualizat:
    "Sincronizează automat cu ERP-ul tău (SmartBill, Saga, Oblio) — CompliScan are connector dedicat.",
}

function pickRange(
  type: ViolationType,
  category: TaxpayerCategory,
): FineRange {
  switch (type) {
    case "efactura_nedepusa":
    case "efactura_b2c_nedepusa":
    case "efactura_intarziere":
    case "efactura_xml_eroare":
      return EFACTURA_FINES[category]
    case "saft_d406_nedepusa":
    case "saft_d406_intarziere":
      return SAFT_FINES[category]
    case "etva_neresponded":
      return ETVA_NOTIFICATION_FINES[category]
    case "spv_neactivat":
      // Praguri aliniate cu nedepunerea e-Factura (nu poți depune fără SPV)
      return EFACTURA_FINES[category]
    case "registru_facturi_neactualizat":
      // Praguri Cod Fiscal Art. 336 — registru nelegal
      return SAFT_FINES[category]
  }
}

export function estimateSingleViolation(
  type: ViolationType,
  count: number,
  category: TaxpayerCategory,
): FineEstimate {
  const safeCount = Math.max(0, Math.floor(count))
  const range = pickRange(type, category)
  return {
    violation: type,
    violationLabel: VIOLATION_LABELS[type],
    taxpayerCategory: category,
    taxpayerLabel: CATEGORY_LABELS[category],
    count: safeCount,
    minPerOccurrence: range.min,
    maxPerOccurrence: range.max,
    totalMinRON: safeCount * range.min,
    totalMaxRON: safeCount * range.max,
    legalReference: range.legal,
    recommendation: VIOLATION_RECOMMENDATIONS[type],
  }
}

// ── Estimator agregat ────────────────────────────────────────────────────────

export type AggregateEstimate = {
  category: TaxpayerCategory
  categoryLabel: string
  estimates: FineEstimate[]
  grandTotalMinRON: number
  grandTotalMaxRON: number
  worstCaseEUR: number       // grand total max ÷ 5 (curs aprox 5 RON/EUR)
}

export function estimateAggregate(
  violations: ViolationInput[],
  category: TaxpayerCategory,
): AggregateEstimate {
  const estimates = violations
    .filter((v) => v.count > 0)
    .map((v) => estimateSingleViolation(v.type, v.count, category))

  const grandTotalMinRON = estimates.reduce((s, e) => s + e.totalMinRON, 0)
  const grandTotalMaxRON = estimates.reduce((s, e) => s + e.totalMaxRON, 0)

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    estimates,
    grandTotalMinRON,
    grandTotalMaxRON,
    worstCaseEUR: Math.round(grandTotalMaxRON / 5),
  }
}

// ── Toate tipurile de violation pentru UI ────────────────────────────────────

export const ALL_VIOLATIONS: Array<{ type: ViolationType; label: string }> = (
  Object.keys(VIOLATION_LABELS) as ViolationType[]
).map((type) => ({ type, label: VIOLATION_LABELS[type] }))

export const ALL_CATEGORIES: Array<{ category: TaxpayerCategory; label: string }> = (
  Object.keys(CATEGORY_LABELS) as TaxpayerCategory[]
).map((category) => ({ category, label: CATEGORY_LABELS[category] }))
