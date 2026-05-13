// Parser D300 (Decont TVA) — extrage conținut din XML descărcat de la ANAF
// sau exportat din software contabil (Saga, SmartBill).
//
// Sursa adevărului: OPANAF 1253/2021 + actualizări ulterioare. Schema XML are
// elemente cu nume gen `rd1_baza`, `rd1_tva`, etc. Suportăm și format vechi
// cu attribute (`<rd1 baza="..." tva="..."/>`) și format cu copii.
//
// IMPORTANT: parser-ul e best-effort — extrage ce poate, marchează erori și
// warnings explicit. NU validează XSD complet (asta cere DUKIntegrator ANAF).
//
// Format PDF/XFA: PDF-ul ANAF conține XML embedded în XFA datasets node.
// Pentru extracție din PDF, caller-ul trebuie să folosească pdfjs-dist sau
// pdftk + să trimită XML-ul extras la acest parser. MVP-ul acceptă DOAR XML.

// ── Tipuri ──────────────────────────────────────────────────────────────────

export type D300Period = {
  /** Anul perioadei (ex: 2026). */
  year: number
  /** Luna 1-12 (pentru frecvență lunară) sau null. */
  month: number | null
  /** Trimestrul 1-4 (pentru frecvență trimestrială) sau null. */
  quarter: number | null
  /** String normalizat "YYYY-MM" sau "YYYY-Qn". */
  period: string
  /** Frecvența detectată ("monthly" / "quarterly" / "unknown"). */
  frequency: "monthly" | "quarterly" | "unknown"
}

export type D300VatLine = {
  /** Codul rândului D300 (ex: "rd1", "rd2", "rd15"). */
  code: string
  /** Eticheta human-readable. */
  label: string
  /** Cota TVA (19, 9, 5, 0) sau null pentru rânduri agregat. */
  vatRate: number | null
  /** Baza impozabilă (RON). */
  base: number
  /** TVA colectat sau deductibil (RON). */
  vat: number
  /** Categorie: collected (colectat) / deductible (deductibil) / summary (totaluri). */
  category: "collected" | "deductible" | "summary"
}

export type D300ParsedData = {
  /** CUI declarant (RO + cifre sau doar cifre). */
  cui: string | null
  /** Perioada raportării. */
  period: D300Period | null
  /** Indicator rectificativă (false = primară). */
  isRectification: boolean
  /** Liniile TVA detectate. */
  lines: D300VatLine[]
  /** Total bază TVA colectat (suma rd1+rd2+rd3+...). */
  totalCollectedBase: number
  /** Total TVA colectat. */
  totalCollectedVat: number
  /** Total bază TVA deductibil. */
  totalDeductibleBase: number
  /** Total TVA deductibil. */
  totalDeductibleVat: number
  /** TVA de plată (rd30) — pozitiv dacă datorăm la stat. */
  vatToPay: number
  /** TVA de restituit (rd35) — pozitiv dacă recuperăm. */
  vatToRefund: number
  /** Erori parser (fields critice lipsă). */
  errors: string[]
  /** Warnings (best-effort detection, opt-in fields). */
  warnings: string[]
}

// ── Mapping coduri ANAF D300 (subset relevant pentru cross-correlation) ─────

const D300_ROW_DEFINITIONS: Array<{
  code: string
  label: string
  vatRate: number | null
  category: D300VatLine["category"]
  /** Aliases XML pentru baza impozabilă. */
  baseAliases: string[]
  /** Aliases XML pentru TVA. */
  vatAliases: string[]
}> = [
  // Livrări interne (TVA colectat)
  {
    code: "rd1",
    label: "Livrări 19% (colectat)",
    vatRate: 19,
    category: "collected",
    baseAliases: ["rd1_baza", "rd1baza", "a1", "rd_1_baza", "rand1baza"],
    vatAliases: ["rd1_tva", "rd1tva", "a2", "rd_1_tva", "rand1tva"],
  },
  {
    code: "rd2",
    label: "Livrări 9% (colectat)",
    vatRate: 9,
    category: "collected",
    baseAliases: ["rd2_baza", "rd2baza", "a3", "rd_2_baza"],
    vatAliases: ["rd2_tva", "rd2tva", "a4", "rd_2_tva"],
  },
  {
    code: "rd3",
    label: "Livrări 5% (colectat)",
    vatRate: 5,
    category: "collected",
    baseAliases: ["rd3_baza", "rd3baza", "a5", "rd_3_baza"],
    vatAliases: ["rd3_tva", "rd3tva", "a6", "rd_3_tva"],
  },
  {
    code: "rd4",
    label: "Achiziții intracomunitare bunuri (taxabile)",
    vatRate: null,
    category: "collected", // TVA cu taxare inversă apare în colectat
    baseAliases: ["rd4_baza", "rd4baza", "a7"],
    vatAliases: ["rd4_tva", "rd4tva", "a8"],
  },
  {
    code: "rd5",
    label: "Achiziții intracomunitare servicii",
    vatRate: null,
    category: "collected",
    baseAliases: ["rd5_baza", "rd5baza", "a9"],
    vatAliases: ["rd5_tva", "rd5tva", "a10"],
  },
  {
    code: "rd14",
    label: "Total TVA colectat (sumă rd1-rd13)",
    vatRate: null,
    category: "summary",
    baseAliases: ["rd14_baza", "rd14baza"],
    vatAliases: ["rd14_tva", "rd14tva", "a25"],
  },
  // Achiziții (TVA deductibil)
  {
    code: "rd20",
    label: "Achiziții 19% (deductibil)",
    vatRate: 19,
    category: "deductible",
    baseAliases: ["rd20_baza", "rd20baza", "a27"],
    vatAliases: ["rd20_tva", "rd20tva", "a28"],
  },
  {
    code: "rd21",
    label: "Achiziții 9% (deductibil)",
    vatRate: 9,
    category: "deductible",
    baseAliases: ["rd21_baza", "rd21baza", "a29"],
    vatAliases: ["rd21_tva", "rd21tva", "a30"],
  },
  {
    code: "rd22",
    label: "Achiziții 5% (deductibil)",
    vatRate: 5,
    category: "deductible",
    baseAliases: ["rd22_baza", "rd22baza", "a31"],
    vatAliases: ["rd22_tva", "rd22tva", "a32"],
  },
  {
    code: "rd25",
    label: "Total TVA deductibil",
    vatRate: null,
    category: "summary",
    baseAliases: ["rd25_baza"],
    vatAliases: ["rd25_tva", "a40"],
  },
  // Totaluri finale
  {
    code: "rd30",
    label: "TVA de plată",
    vatRate: null,
    category: "summary",
    baseAliases: [],
    vatAliases: ["rd30_tva", "rd30", "a45"],
  },
  {
    code: "rd35",
    label: "TVA de restituit",
    vatRate: null,
    category: "summary",
    baseAliases: [],
    vatAliases: ["rd35_tva", "rd35", "a46"],
  },
]

// ── Helpers XML extraction ──────────────────────────────────────────────────

/**
 * Caută o valoare numerică în XML pe baza listei de aliases. Suportă:
 *   - <alias>value</alias>
 *   - <alias attr="value"/>
 *   - <alias val="value"/>
 *   - <rd1 baza="50000" tva="9500"/>  (attribute pe element)
 */
function findNumericValue(xml: string, aliases: string[]): number | null {
  for (const alias of aliases) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    // Pattern 1: <alias>123.45</alias>
    const tagRe = new RegExp(`<${escapedAlias}[^>]*>\\s*([\\d.,\\-]+)\\s*<\\/${escapedAlias}>`, "i")
    const tagMatch = xml.match(tagRe)
    if (tagMatch) {
      const num = parseNumber(tagMatch[1] ?? "")
      if (num !== null) return num
    }

    // Pattern 2: <alias val="123.45"/> or <alias value="123.45"/>
    const valAttrRe = new RegExp(`<${escapedAlias}[^>]*\\s(?:val|value)="([\\d.,\\-]+)"`, "i")
    const valAttrMatch = xml.match(valAttrRe)
    if (valAttrMatch) {
      const num = parseNumber(valAttrMatch[1] ?? "")
      if (num !== null) return num
    }

    // Pattern 3: just attribute on root row element (e.g., <rd1 baza="50000"/>)
    // Already handled via aliases like ["rd1_baza"] which won't match this
  }
  return null
}

/**
 * Pattern special pentru rânduri cu attribute pe element rd: `<rd1 baza="X" tva="Y"/>`.
 */
function findRowAttributes(
  xml: string,
  rowCode: string,
): { base: number | null; vat: number | null } {
  const escapedCode = rowCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`<${escapedCode}\\s+([^>]+)\\/?>`, "i")
  const match = xml.match(re)
  if (!match) return { base: null, vat: null }
  const attrs = match[1] ?? ""

  const baseMatch = attrs.match(/baza="([\d.,\-]+)"/i)
  const vatMatch = attrs.match(/tva="([\d.,\-]+)"/i)

  return {
    base: baseMatch ? parseNumber(baseMatch[1] ?? "") : null,
    vat: vatMatch ? parseNumber(vatMatch[1] ?? "") : null,
  }
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Acceptă atât format US (1234.56) cât și RO (1234,56)
  const normalized = trimmed.replace(/\s+/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")
  const num = Number.parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

function findStringValue(xml: string, aliases: string[]): string | null {
  for (const alias of aliases) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    // Pattern: <alias>value</alias>
    const tagRe = new RegExp(`<${escapedAlias}[^>]*>\\s*([^<]+?)\\s*<\\/${escapedAlias}>`, "i")
    const tagMatch = xml.match(tagRe)
    if (tagMatch) return tagMatch[1]?.trim() ?? null

    // Pattern: <alias val="value"/>
    const valAttrRe = new RegExp(`<${escapedAlias}[^>]*\\s(?:val|value)="([^"]+)"`, "i")
    const valAttrMatch = xml.match(valAttrRe)
    if (valAttrMatch) return valAttrMatch[1]?.trim() ?? null
  }
  return null
}

// ── Parser principal ────────────────────────────────────────────────────────

export function parseD300(xmlInput: string): D300ParsedData {
  const xml = xmlInput.trim()
  const errors: string[] = []
  const warnings: string[] = []

  if (!xml || !xml.includes("<")) {
    return {
      cui: null,
      period: null,
      isRectification: false,
      lines: [],
      totalCollectedBase: 0,
      totalCollectedVat: 0,
      totalDeductibleBase: 0,
      totalDeductibleVat: 0,
      vatToPay: 0,
      vatToRefund: 0,
      errors: ["XML invalid sau gol"],
      warnings: [],
    }
  }

  // CUI
  const cui =
    findStringValue(xml, ["cui", "CUI", "cif", "CIF", "cui_pl", "cifPlatitor"]) ??
    extractCuiFromAttribute(xml)
  if (!cui) errors.push("CUI lipsă din declarație")

  // Period
  const period = extractPeriod(xml)
  if (!period) errors.push("Perioada lipsă sau invalidă")

  // Rectificativă
  const isRectification = detectRectification(xml)

  // Liniile TVA
  const lines: D300VatLine[] = []
  for (const def of D300_ROW_DEFINITIONS) {
    let base = findNumericValue(xml, def.baseAliases)
    let vat = findNumericValue(xml, def.vatAliases)

    // Fallback: încearcă atribute pe element rd
    if (base === null || vat === null) {
      const attrs = findRowAttributes(xml, def.code)
      if (base === null) base = attrs.base
      if (vat === null) vat = attrs.vat
    }

    if (base === null && vat === null) continue // rândul nu apare în XML

    lines.push({
      code: def.code,
      label: def.label,
      vatRate: def.vatRate,
      base: base ?? 0,
      vat: vat ?? 0,
      category: def.category,
    })
  }

  if (lines.length === 0) {
    errors.push(
      "Niciun rând TVA detectat. Verifică dacă XML-ul este D300 sau dacă formatul e suportat (Saga/SmartBill/ANAF standard).",
    )
  }

  // Aggregates
  const collectedLines = lines.filter((l) => l.category === "collected")
  const deductibleLines = lines.filter((l) => l.category === "deductible")
  const totalCollectedBase = collectedLines.reduce((sum, l) => sum + l.base, 0)
  const totalCollectedVat = collectedLines.reduce((sum, l) => sum + l.vat, 0)
  const totalDeductibleBase = deductibleLines.reduce((sum, l) => sum + l.base, 0)
  const totalDeductibleVat = deductibleLines.reduce((sum, l) => sum + l.vat, 0)

  const rd30Line = lines.find((l) => l.code === "rd30")
  const rd35Line = lines.find((l) => l.code === "rd35")
  const vatToPay = rd30Line?.vat ?? Math.max(0, totalCollectedVat - totalDeductibleVat)
  const vatToRefund = rd35Line?.vat ?? Math.max(0, totalDeductibleVat - totalCollectedVat)

  // Sanity check warnings
  if (totalCollectedVat > 0 && totalDeductibleVat === 0) {
    warnings.push(
      "TVA colectat detectat dar zero TVA deductibil. Verifică dacă achizițiile sunt prezente în XML.",
    )
  }
  if (Math.abs(totalCollectedVat - totalCollectedBase * 0.19) / Math.max(totalCollectedBase, 1) > 0.5 && totalCollectedBase > 0) {
    warnings.push(
      `Raport TVA colectat / bază (${((totalCollectedVat / totalCollectedBase) * 100).toFixed(1)}%) e atipic pentru cota standard 19%. Posibil mix de cote.`,
    )
  }

  return {
    cui,
    period,
    isRectification,
    lines,
    totalCollectedBase,
    totalCollectedVat,
    totalDeductibleBase,
    totalDeductibleVat,
    vatToPay,
    vatToRefund,
    errors,
    warnings,
  }
}

// ── Helpers specifice ──────────────────────────────────────────────────────

function extractCuiFromAttribute(xml: string): string | null {
  // Pattern <declaratie cui="RO123"/>
  const match = xml.match(/<declaratie[^>]*\s(?:cui|cif)="([^"]+)"/i)
  return match ? match[1]?.trim() ?? null : null
}

function extractPeriod(xml: string): D300Period | null {
  // Try direct period field "YYYY-MM"
  const periodDirect = findStringValue(xml, ["perioada", "period"])
  if (periodDirect) {
    const monthMatch = periodDirect.match(/^(\d{4})-(\d{2})$/)
    if (monthMatch) {
      const year = Number(monthMatch[1])
      const month = Number(monthMatch[2])
      return {
        year,
        month,
        quarter: null,
        period: `${year}-${String(month).padStart(2, "0")}`,
        frequency: "monthly",
      }
    }
    const quarterMatch = periodDirect.match(/^(\d{4})-Q([1-4])$/i)
    if (quarterMatch) {
      const year = Number(quarterMatch[1])
      const quarter = Number(quarterMatch[2])
      return {
        year,
        month: null,
        quarter,
        period: `${year}-Q${quarter}`,
        frequency: "quarterly",
      }
    }
  }

  // Try separate fields
  const yearStr = findStringValue(xml, ["an", "an_r", "year"]) ?? extractFromRootAttribute(xml, "an")
  const monthStr = findStringValue(xml, ["luna", "luna_r", "month"]) ?? extractFromRootAttribute(xml, "luna")
  const quarterStr = findStringValue(xml, ["trimestru", "quarter"]) ?? extractFromRootAttribute(xml, "trimestru")

  const year = yearStr ? Number(yearStr) : null
  if (!year || !Number.isFinite(year)) return null

  if (monthStr) {
    const month = Number(monthStr)
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
      return {
        year,
        month,
        quarter: null,
        period: `${year}-${String(month).padStart(2, "0")}`,
        frequency: "monthly",
      }
    }
  }

  if (quarterStr) {
    const quarter = Number(quarterStr)
    if (Number.isFinite(quarter) && quarter >= 1 && quarter <= 4) {
      return {
        year,
        month: null,
        quarter,
        period: `${year}-Q${quarter}`,
        frequency: "quarterly",
      }
    }
  }

  // Year-only fallback
  return {
    year,
    month: null,
    quarter: null,
    period: `${year}`,
    frequency: "unknown",
  }
}

function extractFromRootAttribute(xml: string, attr: string): string | null {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = xml.match(new RegExp(`<declaratie[^>]*\\s${escaped}="([^"]+)"`, "i"))
  return match ? match[1] ?? null : null
}

function detectRectification(xml: string): boolean {
  // Common signals: <rectificativa>1</rectificativa>, or attribute rectificativa="1"
  if (/<rectificativa[^>]*>\s*(1|true|da)\s*<\/rectificativa>/i.test(xml)) return true
  if (/<declaratie[^>]*\srectificativa="(1|true|da)"/i.test(xml)) return true
  if (/<tip_decont[^>]*>\s*R\s*<\/tip_decont>/i.test(xml)) return true
  return false
}

// ── Helper: filing key derivat din D300 pentru cross-correlation ────────────

/**
 * Returnează cheia de filing standardizată ("YYYY-MM" sau "YYYY-Qn") pentru
 * cross-correlation cu FilingRecord-urile din state.filingRecords.
 */
export function getD300FilingKey(parsed: D300ParsedData): string | null {
  return parsed.period?.period ?? null
}

/**
 * Returnează baza TVA totală pe cotă specifică — folosit pentru R1 (Σ facturi
 * SmartBill cu cotă X ↔ baza D300 cota X).
 */
export function getD300BaseByVatRate(
  parsed: D300ParsedData,
  vatRate: number,
): { base: number; vat: number } {
  const line = parsed.lines.find(
    (l) => l.category === "collected" && l.vatRate === vatRate,
  )
  return { base: line?.base ?? 0, vat: line?.vat ?? 0 }
}
