/**
 * GOLD 1 — Excel + CSV parser with fuzzy column mapping.
 *
 * Accepts .xlsx, .xls, .csv files (as Buffer).
 * Returns parsed rows with auto-detected column mapping + per-row warnings.
 */
import * as XLSX from "xlsx"

import type { OrgEmployeeCount, OrgSector } from "@/lib/compliance/applicability"

// ── Column definitions ───────────────────────────────────────────────────────

export type ImportColumnId = "orgName" | "cui" | "sector" | "employeeCount" | "email" | "website"

type ColumnDef = {
  id: ImportColumnId
  required: boolean
  aliases: string[]
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    id: "orgName",
    required: true,
    aliases: [
      "orgname", "org_name", "org name", "nume firma", "numefirma", "firma",
      "organizatie", "organizatia", "client", "company", "company_name",
      "companyname", "company name", "denumire", "denumire firma",
    ],
  },
  {
    id: "cui",
    required: false,
    aliases: [
      "cui", "cif", "cod fiscal", "codfiscal", "cod_fiscal", "fiscal_code",
      "tax_id", "taxid", "vat", "vat_number", "ro_cui", "cod unic",
    ],
  },
  {
    id: "sector",
    required: false,
    aliases: [
      "sector", "sectorul", "industrie", "industry", "domeniu", "domeniu activitate",
      "caen", "activitate", "field", "business_type", "tip activitate",
    ],
  },
  {
    id: "employeeCount",
    required: false,
    aliases: [
      "employeecount", "employee_count", "employees", "angajati", "nr angajati",
      "numar angajati", "nr_angajati", "numar_angajati", "size", "company_size",
      "dimensiune", "marime",
    ],
  },
  {
    id: "email",
    required: false,
    aliases: [
      "email", "e-mail", "mail", "contact", "email_contact", "contact_email",
      "email contact", "adresa email",
    ],
  },
  {
    id: "website",
    required: false,
    aliases: [
      "website", "website_url", "websiteurl", "site", "url", "web", "site url",
      "site web", "website url", "link", "pagina web", "adresa web", "domeniu",
    ],
  },
]

// ── Sector + employee count normalization ────────────────────────────────────

const VALID_SECTORS: OrgSector[] = [
  "energy", "transport", "banking", "health", "digital-infrastructure",
  "public-admin", "finance", "retail", "manufacturing", "professional-services", "other",
]

const SECTOR_ALIASES: Record<string, OrgSector> = {
  energie: "energy",
  energy: "energy",
  transport: "transport",
  logistica: "transport",
  bancar: "banking",
  banking: "banking",
  financiar: "finance",
  finance: "finance",
  sanatate: "health",
  health: "health",
  medical: "health",
  "digital-infrastructure": "digital-infrastructure",
  digital: "digital-infrastructure",
  it: "digital-infrastructure",
  "infrastructura digitala": "digital-infrastructure",
  "public-admin": "public-admin",
  "administratie publica": "public-admin",
  retail: "retail",
  comert: "retail",
  manufacturing: "manufacturing",
  productie: "manufacturing",
  industrie: "manufacturing",
  "professional-services": "professional-services",
  "servicii profesionale": "professional-services",
  consultanta: "professional-services",
  other: "other",
  altele: "other",
}

const VALID_EMPLOYEE_COUNTS: OrgEmployeeCount[] = ["1-9", "10-49", "50-249", "250+"]

function normalizeEmployeeCount(raw: string): OrgEmployeeCount | null {
  const clean = raw.trim().replace(/\s/g, "")
  if (VALID_EMPLOYEE_COUNTS.includes(clean as OrgEmployeeCount)) return clean as OrgEmployeeCount
  const num = parseInt(clean, 10)
  if (!isNaN(num)) {
    if (num < 10) return "1-9"
    if (num < 50) return "10-49"
    if (num < 250) return "50-249"
    return "250+"
  }
  // Try descriptive matches
  const lower = clean.toLowerCase()
  if (lower.includes("micro")) return "1-9"
  if (lower.includes("mic") || lower.includes("small")) return "10-49"
  if (lower.includes("mediu") || lower.includes("medium")) return "50-249"
  if (lower.includes("mare") || lower.includes("large")) return "250+"
  return null
}

function normalizeSector(raw: string): OrgSector | null {
  const lower = raw.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
  if (VALID_SECTORS.includes(lower as OrgSector)) return lower as OrgSector
  return SECTOR_ALIASES[lower] ?? null
}

// ── CUI normalization ────────────────────────────────────────────────────────

export function normalizeCUI(raw: string): string | null {
  const clean = raw.trim().toUpperCase().replace(/\s/g, "")
  return /^(RO)?\d{2,10}$/.test(clean) ? clean : null
}

// ── Fuzzy column mapping ─────────────────────────────────────────────────────

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
}

export type ColumnMapping = Record<ImportColumnId, number | null>

export function detectColumnMapping(headers: string[]): {
  mapping: ColumnMapping
  unmapped: string[]
  confidence: "high" | "medium" | "low"
} {
  const mapping: ColumnMapping = {
    orgName: null,
    cui: null,
    sector: null,
    employeeCount: null,
    email: null,
    website: null,
  }

  const usedIndices = new Set<number>()

  // Pass 1: exact match on aliases
  for (const def of COLUMN_DEFS) {
    for (let i = 0; i < headers.length; i++) {
      if (usedIndices.has(i)) continue
      const normalized = normalizeHeader(headers[i])
      if (def.aliases.includes(normalized)) {
        mapping[def.id] = i
        usedIndices.add(i)
        break
      }
    }
  }

  // Pass 2: partial/fuzzy match for unmapped columns
  for (const def of COLUMN_DEFS) {
    if (mapping[def.id] !== null) continue
    for (let i = 0; i < headers.length; i++) {
      if (usedIndices.has(i)) continue
      const normalized = normalizeHeader(headers[i])
      const matched = def.aliases.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized)
      )
      if (matched) {
        mapping[def.id] = i
        usedIndices.add(i)
        break
      }
    }
  }

  // Pass 3: fallback heuristics — if orgName not found, first text column
  if (mapping.orgName === null && headers.length > 0) {
    for (let i = 0; i < headers.length; i++) {
      if (!usedIndices.has(i)) {
        mapping.orgName = i
        usedIndices.add(i)
        break
      }
    }
  }

  const unmapped = headers.filter((_, i) => !usedIndices.has(i))
  const requiredMapped = COLUMN_DEFS.filter((d) => d.required).every((d) => mapping[d.id] !== null)
  const totalMapped = Object.values(mapping).filter((v) => v !== null).length

  let confidence: "high" | "medium" | "low" = "low"
  if (requiredMapped && totalMapped >= 3) confidence = "high"
  else if (requiredMapped) confidence = "medium"

  return { mapping, unmapped, confidence }
}

// ── Parsed row types ─────────────────────────────────────────────────────────

export type ImportRowParsed = {
  rowIndex: number
  orgName: string
  cui: string | null
  cuiNormalized: string | null
  sector: OrgSector | null
  sectorRaw: string | null
  employeeCount: OrgEmployeeCount | null
  employeeCountRaw: string | null
  email: string | null
  website: string | null
  warnings: string[]
  errors: string[]
  isDuplicate: boolean
  raw: Record<string, string>
}

export type ImportParseResult = {
  headers: string[]
  mapping: ColumnMapping
  mappingConfidence: "high" | "medium" | "low"
  unmappedHeaders: string[]
  rows: ImportRowParsed[]
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
}

// ── Main parse function ──────────────────────────────────────────────────────

export function parseImportFile(
  buffer: Buffer,
  fileName: string,
  existingOrgNames?: string[],
  existingCUIs?: string[]
): ImportParseResult {
  const isExcel = /\.(xlsx|xls)$/i.test(fileName)
  const isCsv = /\.csv$/i.test(fileName)

  if (!isExcel && !isCsv) {
    throw new Error("Format nesuportat. Acceptăm .xlsx, .xls sau .csv.")
  }

  let workbook: XLSX.WorkBook
  if (isExcel) {
    workbook = XLSX.read(buffer, { type: "buffer" })
  } else {
    workbook = XLSX.read(buffer, { type: "buffer", raw: true })
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Fișierul nu conține niciun sheet.")

  const sheet = workbook.Sheets[sheetName]!
  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  })

  if (jsonData.length === 0) throw new Error("Fișierul este gol.")

  // Detect header row — first row with >=2 non-empty cells
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
    const row = jsonData[i]
    const nonEmpty = row.filter((cell) => String(cell).trim() !== "").length
    if (nonEmpty >= 2) {
      headerRowIndex = i
      break
    }
  }

  const headers = jsonData[headerRowIndex].map((cell) => String(cell).trim())
  const dataRows = jsonData.slice(headerRowIndex + 1).filter((row) =>
    row.some((cell) => String(cell).trim() !== "")
  )

  if (dataRows.length === 0) throw new Error("Fișierul conține doar header, fără date.")
  if (dataRows.length > 200) throw new Error("Maximum 200 de rânduri per import.")

  const { mapping, unmapped, confidence } = detectColumnMapping(headers)

  // Normalize existing data for duplicate detection
  const existingNamesLower = new Set((existingOrgNames ?? []).map((n) => n.toLowerCase().trim()))
  const existingCUIsUpper = new Set((existingCUIs ?? []).map((c) => c.toUpperCase().trim()))

  // Track CUIs within this import for intra-file duplicates
  const seenCUIs = new Set<string>()
  const seenNames = new Set<string>()

  const rows: ImportRowParsed[] = dataRows.map((dataRow, idx) => {
    const raw: Record<string, string> = {}
    headers.forEach((h, i) => {
      raw[h] = String(dataRow[i] ?? "").trim()
    })

    const getValue = (colId: ImportColumnId): string => {
      const colIdx = mapping[colId]
      if (colIdx === null) return ""
      return String(dataRow[colIdx] ?? "").trim()
    }

    const warnings: string[] = []
    const errors: string[] = []

    // orgName
    const orgName = getValue("orgName")
    if (!orgName) errors.push("Numele firmei lipsește.")

    // CUI
    const cuiRaw = getValue("cui")
    let cuiNormalized: string | null = null
    if (cuiRaw) {
      cuiNormalized = normalizeCUI(cuiRaw)
      if (!cuiNormalized) {
        warnings.push(`CUI „${cuiRaw}" nu pare valid — va fi ignorat.`)
      }
    }

    // sector
    const sectorRaw = getValue("sector") || null
    let sector: OrgSector | null = null
    if (sectorRaw) {
      sector = normalizeSector(sectorRaw)
      if (!sector) {
        warnings.push(`Sectorul „${sectorRaw}" nu a fost recunoscut — se va folosi „other".`)
        sector = "other"
      }
    }

    // employeeCount
    const employeeCountRaw = getValue("employeeCount") || null
    let employeeCount: OrgEmployeeCount | null = null
    if (employeeCountRaw) {
      employeeCount = normalizeEmployeeCount(employeeCountRaw)
      if (!employeeCount) {
        warnings.push(`Nr. angajați „${employeeCountRaw}" nu a fost recunoscut.`)
      }
    }

    // email
    const email = getValue("email") || null
    if (email && !email.includes("@")) {
      warnings.push(`Email „${email}" nu pare valid.`)
    }

    // website
    const websiteRaw = getValue("website") || null
    const website = websiteRaw
      ? (websiteRaw.startsWith("http") ? websiteRaw : `https://${websiteRaw}`)
      : null

    // Duplicate detection
    let isDuplicate = false
    if (orgName && existingNamesLower.has(orgName.toLowerCase())) {
      warnings.push("Firmă cu același nume există deja în portofoliu.")
      isDuplicate = true
    }
    if (cuiNormalized && existingCUIsUpper.has(cuiNormalized)) {
      warnings.push("CUI deja existent în portofoliu.")
      isDuplicate = true
    }
    // Intra-file duplicates
    if (orgName && seenNames.has(orgName.toLowerCase())) {
      warnings.push("Rând duplicat în fișier (nume identic).")
      isDuplicate = true
    }
    if (cuiNormalized && seenCUIs.has(cuiNormalized)) {
      warnings.push("CUI duplicat în fișier.")
      isDuplicate = true
    }

    if (orgName) seenNames.add(orgName.toLowerCase())
    if (cuiNormalized) seenCUIs.add(cuiNormalized)

    return {
      rowIndex: idx,
      orgName,
      cui: cuiRaw || null,
      cuiNormalized,
      sector,
      sectorRaw,
      employeeCount,
      employeeCountRaw,
      email,
      website,
      warnings,
      errors,
      isDuplicate,
      raw,
    }
  })

  return {
    headers,
    mapping,
    mappingConfidence: confidence,
    unmappedHeaders: unmapped,
    rows,
    totalRows: rows.length,
    validRows: rows.filter((r) => r.errors.length === 0).length,
    errorRows: rows.filter((r) => r.errors.length > 0).length,
    warningRows: rows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length,
  }
}
