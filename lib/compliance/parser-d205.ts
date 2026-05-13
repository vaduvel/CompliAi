// Parser D205 (Declarație informativă privind impozitul reținut la sursă pe
// beneficiari). Anual, până 28 februarie pentru anul precedent.
//
// Folosit pentru cross-correlation R2 (AGA ↔ stat plată ↔ D205) și R5
// (D205 anual ↔ Σ D100 lunare componenta dividende).
//
// Structura D205:
//   - header: declarant CUI, an raportare, rectificativă
//   - linii: beneficiari (PF cu CNP sau PJ cu CUI) cu venit + impozit reținut
//   - tipuri venit: dividende, drepturi autor, dobânzi, redevențe, alte
//
// Suportăm format ANAF standard + variantele Saga/SmartBill cu denumiri ușor
// diferite (`beneficiar`, `linie`, `rand`).

// ── Tipuri ──────────────────────────────────────────────────────────────────

export type D205IncomeType =
  | "dividende"
  | "drepturi_autor"
  | "dobanzi"
  | "redevente"
  | "alte"
  | "necunoscut"

export type D205Beneficiary = {
  /** Tip identificator: CNP (persoană fizică) sau CUI (persoană juridică). */
  idType: "CNP" | "CUI" | "unknown"
  /** Identificator beneficiar (CNP sau CUI). */
  id: string | null
  /** Nume / denumire beneficiar. */
  name: string | null
  /** Tip venit (dividende, drepturi autor, etc.). */
  incomeType: D205IncomeType
  /** Cod tip venit ANAF (dacă apare). */
  incomeCode: string | null
  /** Venit brut. */
  grossIncome: number
  /** Impozit reținut la sursă. */
  withheldTax: number
  /** Țara rezidenței fiscale (default "RO"). */
  country: string
}

export type D205ParsedData = {
  /** CUI declarant (cabinetul/firma care emite D205). */
  declarantCui: string | null
  /** Anul raportării (ex: 2025, în D205 depusă în 2026). */
  reportingYear: number | null
  /** Indicator rectificativă. */
  isRectification: boolean
  /** Lista beneficiari extrași. */
  beneficiaries: D205Beneficiary[]
  /** Sumar pe tip venit. */
  summaryByIncomeType: Record<
    D205IncomeType,
    { count: number; totalIncome: number; totalTax: number }
  >
  /** Total venit brut. */
  totalGrossIncome: number
  /** Total impozit reținut. */
  totalWithheldTax: number
  /** Erori parser. */
  errors: string[]
  /** Warnings. */
  warnings: string[]
}

// ── Coduri tip venit ANAF D205 (subset) ──────────────────────────────────────

const INCOME_TYPE_MAP: Record<string, D205IncomeType> = {
  // Coduri standard ANAF (variază cu ediția OPANAF)
  "401": "dividende",
  "402": "dividende",
  "501": "drepturi_autor",
  "502": "drepturi_autor",
  "601": "dobanzi",
  "701": "redevente",
  // Aliases din software contabil
  dividende: "dividende",
  dividend: "dividende",
  "drepturi de autor": "drepturi_autor",
  "drepturi_autor": "drepturi_autor",
  dobanzi: "dobanzi",
  redevente: "redevente",
}

function classifyIncome(rawCode: string | null, label: string | null): {
  type: D205IncomeType
  code: string | null
} {
  if (rawCode) {
    const code = rawCode.trim()
    if (INCOME_TYPE_MAP[code]) return { type: INCOME_TYPE_MAP[code], code }
  }
  if (label) {
    const lower = label.toLowerCase()
    for (const [key, type] of Object.entries(INCOME_TYPE_MAP)) {
      if (lower.includes(key.toLowerCase())) {
        return { type, code: rawCode }
      }
    }
  }
  return { type: "necunoscut", code: rawCode }
}

// ── Helpers XML ─────────────────────────────────────────────────────────────

function parseNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\s+/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")
  const num = Number.parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

function findStringValue(xml: string, aliases: string[]): string | null {
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tagRe = new RegExp(`<${escaped}[^>]*>\\s*([^<]+?)\\s*<\\/${escaped}>`, "i")
    const tagMatch = xml.match(tagRe)
    if (tagMatch) return tagMatch[1]?.trim() ?? null
    const valAttrRe = new RegExp(`<${escaped}[^>]*\\s(?:val|value)="([^"]+)"`, "i")
    const valAttrMatch = xml.match(valAttrRe)
    if (valAttrMatch) return valAttrMatch[1]?.trim() ?? null
  }
  return null
}

function extractFromRootAttribute(xml: string, attr: string): string | null {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = xml.match(new RegExp(`<declaratie[^>]*\\s${escaped}="([^"]+)"`, "i"))
  return match ? match[1] ?? null : null
}

// ── Extract beneficiari (lista) ─────────────────────────────────────────────

const BENEFICIARY_TAG_PATTERNS = [
  /<beneficiar[\s>][\s\S]*?<\/beneficiar>/gi,
  /<linie[\s>][\s\S]*?<\/linie>/gi,
  /<rand[\s>][\s\S]*?<\/rand>/gi,
  /<row[\s>][\s\S]*?<\/row>/gi,
  /<persoana[\s>][\s\S]*?<\/persoana>/gi,
]

function extractBeneficiaries(xml: string): D205Beneficiary[] {
  const beneficiaries: D205Beneficiary[] = []
  const seenBlocks = new Set<string>()

  for (const pattern of BENEFICIARY_TAG_PATTERNS) {
    const matches = xml.matchAll(pattern)
    for (const m of matches) {
      const block = m[0]
      if (seenBlocks.has(block)) continue
      seenBlocks.add(block)

      const beneficiary = parseBeneficiaryBlock(block)
      if (beneficiary) beneficiaries.push(beneficiary)
    }
  }

  return beneficiaries
}

function parseBeneficiaryBlock(block: string): D205Beneficiary | null {
  // Try CNP first (13 digits)
  const cnp = findStringValue(block, ["cnp", "CNP", "cod_numeric"])
  // Then CUI
  const cui = findStringValue(block, ["cui", "CUI", "cif", "CIF"])

  let idType: D205Beneficiary["idType"] = "unknown"
  let id: string | null = null
  if (cnp && /^\d{13}$/.test(cnp.replace(/\D/g, ""))) {
    idType = "CNP"
    id = cnp.replace(/\D/g, "")
  } else if (cui) {
    idType = "CUI"
    id = cui.trim().toUpperCase()
  }

  const name =
    findStringValue(block, ["nume", "nume_beneficiar", "denumire", "name"])

  const grossIncome =
    parseNumber(findStringValue(block, ["venit", "venit_brut", "suma", "income", "valoare"]) ?? "") ?? 0
  const withheldTax =
    parseNumber(findStringValue(block, ["impozit", "impozit_retinut", "tax", "imp"]) ?? "") ?? 0

  if (grossIncome === 0 && withheldTax === 0 && !id && !name) return null

  const incomeCode = findStringValue(block, ["cod_venit", "tip_venit", "income_code"])
  const incomeLabel = findStringValue(block, [
    "denumire_venit",
    "label_venit",
    "income_label",
    "tip",
  ])

  const classification = classifyIncome(incomeCode, incomeLabel ?? name)

  const country =
    findStringValue(block, ["tara", "country", "rezidenta_fiscala"]) ?? "RO"

  return {
    idType,
    id,
    name: name?.trim() ?? null,
    incomeType: classification.type,
    incomeCode: classification.code,
    grossIncome,
    withheldTax,
    country: country.toUpperCase(),
  }
}

// ── Parser principal ────────────────────────────────────────────────────────

export function parseD205(xmlInput: string): D205ParsedData {
  const xml = xmlInput.trim()
  const errors: string[] = []
  const warnings: string[] = []

  if (!xml || !xml.includes("<")) {
    return emptyResult(["XML invalid sau gol"])
  }

  // Declarant
  const declarantCui =
    findStringValue(xml, ["cui", "CUI", "cif", "CIF", "cui_declarant"]) ??
    extractFromRootAttribute(xml, "cui") ??
    extractFromRootAttribute(xml, "cif")
  if (!declarantCui) errors.push("CUI declarant lipsă")

  // Anul raportării
  const yearStr =
    findStringValue(xml, ["an_raportare", "an_r", "an", "year"]) ??
    extractFromRootAttribute(xml, "an") ??
    extractFromRootAttribute(xml, "an_raportare")
  const year = yearStr ? Number(yearStr) : null
  const reportingYear = year && Number.isFinite(year) ? year : null
  if (!reportingYear) errors.push("Anul raportării lipsă sau invalid")

  // Rectificativă
  const isRectification =
    /<rectificativa[^>]*>\s*(1|true|da)\s*<\/rectificativa>/i.test(xml) ||
    /<declaratie[^>]*\srectificativa="(1|true|da)"/i.test(xml) ||
    /<tip[^>]*>\s*R\s*<\/tip>/i.test(xml)

  // Beneficiari
  const beneficiaries = extractBeneficiaries(xml)
  if (beneficiaries.length === 0) {
    errors.push(
      "Niciun beneficiar detectat. Verifică dacă XML-ul e D205 sau dacă tag-urile folosesc denumiri suportate (beneficiar/linie/rand/row/persoana).",
    )
  }

  // Aggregates
  const summaryByIncomeType: D205ParsedData["summaryByIncomeType"] = {
    dividende: { count: 0, totalIncome: 0, totalTax: 0 },
    drepturi_autor: { count: 0, totalIncome: 0, totalTax: 0 },
    dobanzi: { count: 0, totalIncome: 0, totalTax: 0 },
    redevente: { count: 0, totalIncome: 0, totalTax: 0 },
    alte: { count: 0, totalIncome: 0, totalTax: 0 },
    necunoscut: { count: 0, totalIncome: 0, totalTax: 0 },
  }
  for (const b of beneficiaries) {
    summaryByIncomeType[b.incomeType].count++
    summaryByIncomeType[b.incomeType].totalIncome += b.grossIncome
    summaryByIncomeType[b.incomeType].totalTax += b.withheldTax
  }

  const totalGrossIncome = beneficiaries.reduce((sum, b) => sum + b.grossIncome, 0)
  const totalWithheldTax = beneficiaries.reduce((sum, b) => sum + b.withheldTax, 0)

  // Sanity checks
  const dividendBeneficiaries = beneficiaries.filter((b) => b.incomeType === "dividende")
  for (const b of dividendBeneficiaries) {
    if (b.grossIncome > 0) {
      const effectiveRate = b.withheldTax / b.grossIncome
      // Cota standard dividende 2026: 8% (Lege 296/2023), 10% pentru rezidenți non-UE
      if (effectiveRate > 0 && (effectiveRate < 0.07 || effectiveRate > 0.17)) {
        warnings.push(
          `Beneficiar ${b.name ?? b.id ?? "?"}: cotă efectivă impozit dividende ${(effectiveRate * 100).toFixed(1)}% e atipică (standard 8% pentru rezidenți RO/UE).`,
        )
      }
    }
  }

  const unknownCount = summaryByIncomeType.necunoscut.count
  if (unknownCount > 0 && unknownCount === beneficiaries.length) {
    warnings.push(
      "Niciun beneficiar n-a putut fi clasificat pe tip venit. Cod sau denumire venit lipsă din XML.",
    )
  }

  return {
    declarantCui,
    reportingYear,
    isRectification,
    beneficiaries,
    summaryByIncomeType,
    totalGrossIncome,
    totalWithheldTax,
    errors,
    warnings,
  }
}

function emptyResult(errors: string[]): D205ParsedData {
  return {
    declarantCui: null,
    reportingYear: null,
    isRectification: false,
    beneficiaries: [],
    summaryByIncomeType: {
      dividende: { count: 0, totalIncome: 0, totalTax: 0 },
      drepturi_autor: { count: 0, totalIncome: 0, totalTax: 0 },
      dobanzi: { count: 0, totalIncome: 0, totalTax: 0 },
      redevente: { count: 0, totalIncome: 0, totalTax: 0 },
      alte: { count: 0, totalIncome: 0, totalTax: 0 },
      necunoscut: { count: 0, totalIncome: 0, totalTax: 0 },
    },
    totalGrossIncome: 0,
    totalWithheldTax: 0,
    errors,
    warnings: [],
  }
}

// ── Helpers cross-correlation ───────────────────────────────────────────────

/**
 * Returnează dividendele totale (venit + impozit) din D205. Folosit pentru
 * R2 (AGA ↔ stat plată ↔ D205) — comparăm Σ dividende AGA cu Σ dividende D205.
 */
export function getD205DividendsTotal(parsed: D205ParsedData): {
  totalIncome: number
  totalTax: number
  count: number
} {
  return parsed.summaryByIncomeType.dividende
}

/**
 * Returnează lista beneficiarilor de dividende cu CNP — folosit pentru R4
 * (matching beneficiari plătiți ↔ asociați ONRC).
 */
export function getD205DividendBeneficiaries(parsed: D205ParsedData): D205Beneficiary[] {
  return parsed.beneficiaries.filter((b) => b.incomeType === "dividende")
}
