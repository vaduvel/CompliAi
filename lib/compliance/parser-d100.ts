// Parser D100 (Declarație obligații de plată la bugetul de stat). Lunar /
// trimestrial pentru impozit profit, micro, impozit dividende, accize, etc.
//
// Folosit pentru cross-correlation R5 (D205 anual ↔ Σ D100 lunare componenta
// dividende). D100 conține LINII PE TIP IMPOZIT, fiecare cu (suma_datorata,
// suma_de_plata, suma_de_recuperat). Cele cu cod 480/481 sunt impozit
// dividende — folosit pentru reconciliere cu D205.
//
// Structura ANAF D100 (OPANAF 587/2016 cu actualizări):
//   - header: cui, an, luna/trimestru, rectificativă
//   - linii: <impozit cod="X"> sau <a1>, <a2>, ... cu valori per cod buget
//   - coduri principale: 480/481 (impozit dividende), 101 (impozit profit),
//     250-259 (impozit reținut salarii), 401 (impozit micro 1%/3%)

// ── Tipuri ──────────────────────────────────────────────────────────────────

export type D100Period = {
  year: number
  month: number | null
  quarter: number | null
  period: string
  frequency: "monthly" | "quarterly" | "unknown"
}

export type D100TaxCategory =
  | "dividende"
  | "profit_anual"
  | "microintreprindere"
  | "salarii"
  | "altele"
  | "necunoscut"

export type D100Line = {
  /** Cod ANAF (ex: "480" dividende). */
  code: string
  /** Etichetă human-readable. */
  label: string
  /** Categoria clasificată. */
  category: D100TaxCategory
  /** Suma datorată (calculată). */
  amountDue: number
  /** Suma de plată efectivă (după compensări). */
  amountToPay: number
  /** Suma de recuperat (dacă datorata < deja platit). */
  amountToRecover: number
}

export type D100ParsedData = {
  declarantCui: string | null
  period: D100Period | null
  isRectification: boolean
  lines: D100Line[]
  /** Suma totală obligații. */
  totalDue: number
  /** Suma totală de plată. */
  totalToPay: number
  /** Sumar pe categorii. */
  summaryByCategory: Record<
    D100TaxCategory,
    { count: number; totalDue: number; totalToPay: number }
  >
  errors: string[]
  warnings: string[]
}

// ── Mapping coduri ANAF D100 → categorie ────────────────────────────────────

const TAX_CODE_MAP: Record<
  string,
  { label: string; category: D100TaxCategory }
> = {
  "480": { label: "Impozit pe dividende (PF)", category: "dividende" },
  "481": { label: "Impozit pe dividende (PJ)", category: "dividende" },
  "482": { label: "Impozit pe dividende (nerezidenți)", category: "dividende" },
  "101": { label: "Impozit pe profit", category: "profit_anual" },
  "401": { label: "Impozit pe veniturile microîntreprinderilor (1%)", category: "microintreprindere" },
  "402": { label: "Impozit pe veniturile microîntreprinderilor (3%)", category: "microintreprindere" },
  "201": { label: "Impozit pe salarii", category: "salarii" },
  "202": { label: "Impozit pe salarii (alte)", category: "salarii" },
  "250": { label: "Impozit reținut la sursă (salarii)", category: "salarii" },
  "251": { label: "Impozit reținut la sursă (drepturi autor)", category: "altele" },
  "252": { label: "Impozit reținut la sursă (alte)", category: "altele" },
}

function classifyByCode(code: string): {
  label: string
  category: D100TaxCategory
} {
  const trimmed = code.trim()
  const known = TAX_CODE_MAP[trimmed]
  if (known) return known
  return { label: `Impozit cod ${trimmed}`, category: "necunoscut" }
}

// ── Helpers parsare ─────────────────────────────────────────────────────────

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

// ── Extract linii impozit ───────────────────────────────────────────────────

function extractLines(xml: string): D100Line[] {
  const lines: D100Line[] = []
  const seen = new Set<string>()

  // Pattern 1: <impozit cod="480" suma_datorata="..." suma_de_plata="..."/>
  const impozitPattern = /<impozit\s+([^>]+?)\/?>/gi
  for (const match of xml.matchAll(impozitPattern)) {
    const attrs = match[1] ?? ""
    const code = attrs.match(/cod="([^"]+)"/i)?.[1]
    if (!code) continue
    if (seen.has(code)) continue
    seen.add(code)

    const due =
      parseNumber(attrs.match(/suma_?datorata="([\d.,\-]+)"/i)?.[1]) ?? 0
    const toPay =
      parseNumber(attrs.match(/suma_?de_?plata="([\d.,\-]+)"/i)?.[1]) ?? 0
    const toRecover =
      parseNumber(attrs.match(/suma_?de_?recuperat="([\d.,\-]+)"/i)?.[1]) ?? 0

    const cls = classifyByCode(code)
    lines.push({
      code,
      label: cls.label,
      category: cls.category,
      amountDue: due,
      amountToPay: toPay,
      amountToRecover: toRecover,
    })
  }

  // Pattern 2: <impozit cod="X"><suma_datorata>..</suma_datorata></impozit>
  const impozitBlockPattern = /<impozit\s+cod="([^"]+)"[^>]*>([\s\S]*?)<\/impozit>/gi
  for (const match of xml.matchAll(impozitBlockPattern)) {
    const code = match[1] ?? ""
    if (!code || seen.has(code)) continue
    seen.add(code)

    const block = match[2] ?? ""
    const due = parseNumber(findStringValue(block, ["suma_datorata", "datorat", "due"]) ?? "") ?? 0
    const toPay = parseNumber(findStringValue(block, ["suma_de_plata", "plata", "toPay"]) ?? "") ?? 0
    const toRecover = parseNumber(findStringValue(block, ["suma_de_recuperat", "recuperat"]) ?? "") ?? 0

    const cls = classifyByCode(code)
    lines.push({
      code,
      label: cls.label,
      category: cls.category,
      amountDue: due,
      amountToPay: toPay,
      amountToRecover: toRecover,
    })
  }

  // Pattern 3: format vechi cu <a1>, <a2>, ... unde fiecare e o sumă single
  // În formatul ăsta, codul e implicit din poziție; nu putem mapa programmatic
  // fără tabel de poziții ANAF (variază cu ediția). Skip pentru moment.

  return lines
}

// ── Period extraction ──────────────────────────────────────────────────────

function extractPeriod(xml: string): D100Period | null {
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

  const yearStr =
    findStringValue(xml, ["an", "an_r", "year"]) ??
    extractFromRootAttribute(xml, "an")
  const monthStr =
    findStringValue(xml, ["luna", "month"]) ??
    extractFromRootAttribute(xml, "luna")
  const quarterStr =
    findStringValue(xml, ["trimestru", "quarter"]) ??
    extractFromRootAttribute(xml, "trimestru")

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

  return {
    year,
    month: null,
    quarter: null,
    period: `${year}`,
    frequency: "unknown",
  }
}

// ── Parser principal ────────────────────────────────────────────────────────

export function parseD100(xmlInput: string): D100ParsedData {
  const xml = xmlInput.trim()
  const errors: string[] = []
  const warnings: string[] = []

  if (!xml || !xml.includes("<")) {
    return emptyResult(["XML invalid sau gol"])
  }

  const declarantCui =
    findStringValue(xml, ["cui", "CUI", "cif", "CIF"]) ??
    extractFromRootAttribute(xml, "cui") ??
    extractFromRootAttribute(xml, "cif")
  if (!declarantCui) errors.push("CUI lipsă")

  const period = extractPeriod(xml)
  if (!period) errors.push("Perioada lipsă sau invalidă")

  const isRectification =
    /<rectificativa[^>]*>\s*(1|true|da)\s*<\/rectificativa>/i.test(xml) ||
    /<declaratie[^>]*\srectificativa="(1|true|da)"/i.test(xml)

  const lines = extractLines(xml)
  if (lines.length === 0) {
    errors.push(
      "Niciun rând impozit detectat. Verifică dacă XML-ul e D100 sau dacă format-ul folosește tag-uri suportate (<impozit cod=\"X\">).",
    )
  }

  const totalDue = lines.reduce((sum, l) => sum + l.amountDue, 0)
  const totalToPay = lines.reduce((sum, l) => sum + l.amountToPay, 0)

  const summaryByCategory: D100ParsedData["summaryByCategory"] = {
    dividende: { count: 0, totalDue: 0, totalToPay: 0 },
    profit_anual: { count: 0, totalDue: 0, totalToPay: 0 },
    microintreprindere: { count: 0, totalDue: 0, totalToPay: 0 },
    salarii: { count: 0, totalDue: 0, totalToPay: 0 },
    altele: { count: 0, totalDue: 0, totalToPay: 0 },
    necunoscut: { count: 0, totalDue: 0, totalToPay: 0 },
  }
  for (const l of lines) {
    summaryByCategory[l.category].count++
    summaryByCategory[l.category].totalDue += l.amountDue
    summaryByCategory[l.category].totalToPay += l.amountToPay
  }

  if (summaryByCategory.necunoscut.count > 0 && summaryByCategory.necunoscut.count === lines.length) {
    warnings.push(
      "Niciun cod impozit nu a fost recunoscut. Verifică ediția XML — coduri ANAF se actualizează cu OPANAF.",
    )
  }

  return {
    declarantCui,
    period,
    isRectification,
    lines,
    totalDue,
    totalToPay,
    summaryByCategory,
    errors,
    warnings,
  }
}

function emptyResult(errors: string[]): D100ParsedData {
  return {
    declarantCui: null,
    period: null,
    isRectification: false,
    lines: [],
    totalDue: 0,
    totalToPay: 0,
    summaryByCategory: {
      dividende: { count: 0, totalDue: 0, totalToPay: 0 },
      profit_anual: { count: 0, totalDue: 0, totalToPay: 0 },
      microintreprindere: { count: 0, totalDue: 0, totalToPay: 0 },
      salarii: { count: 0, totalDue: 0, totalToPay: 0 },
      altele: { count: 0, totalDue: 0, totalToPay: 0 },
      necunoscut: { count: 0, totalDue: 0, totalToPay: 0 },
    },
    errors,
    warnings: [],
  }
}

// ── Helpers cross-correlation ───────────────────────────────────────────────

/**
 * Returnează componenta dividende dintr-un D100 — folosit pentru R5 (sumă
 * D205 anual ↔ Σ D100 lunare componenta dividende).
 */
export function getD100DividendsTotal(parsed: D100ParsedData): {
  totalDue: number
  totalToPay: number
} {
  return {
    totalDue: parsed.summaryByCategory.dividende.totalDue,
    totalToPay: parsed.summaryByCategory.dividende.totalToPay,
  }
}

/**
 * Returnează cheia de filing pentru match cu state.filingRecords.
 */
export function getD100FilingKey(parsed: D100ParsedData): string | null {
  return parsed.period?.period ?? null
}
