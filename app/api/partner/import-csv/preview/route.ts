// S1.3 — Import preview: validate + map CSV without committing
// Returns: parsed rows, detected mapping, validation errors, CUI normalization
import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"

const EXPECTED_COLUMNS = ["orgName", "cui", "sector", "employeeCount", "email"] as const
const COLUMN_ALIASES: Record<string, string> = {
  "firma": "orgName",
  "nume firma": "orgName",
  "organizatie": "orgName",
  "denumire": "orgName",
  "name": "orgName",
  "company": "orgName",
  "cui": "cui",
  "cod fiscal": "cui",
  "cif": "cui",
  "fiscal code": "cui",
  "sector": "sector",
  "domeniu": "sector",
  "angajati": "employeeCount",
  "employees": "employeeCount",
  "nr angajati": "employeeCount",
  "email": "email",
  "e-mail": "email",
  "contact": "email",
}

function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim()); cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

function normalizeCUI(raw: string): { normalized: string | null; wasFixed: boolean } {
  const clean = raw.trim().replace(/\s+/g, "").replace(/\./g, "").toUpperCase()
  const wasFixed = clean !== raw.trim().toUpperCase()
  return /^(RO)?\d{2,10}$/.test(clean) ? { normalized: clean, wasFixed } : { normalized: null, wasFixed }
}

function autoDetectMapping(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {}
  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().trim()
    const mapped = COLUMN_ALIASES[normalized]
    if (mapped) mapping[i] = mapped
  })
  return mapping
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager"], "preview import CSV")
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      throw new AuthzError("Preview disponibil doar în modul partner.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const body = await request.json() as { csvContent?: string }
    if (!body.csvContent) return jsonError("csvContent lipsă.", 400, "MISSING_CSV")

    const lines = body.csvContent.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return jsonError("CSV-ul trebuie să aibă cel puțin header + 1 rând.", 400, "CSV_TOO_SHORT")

    const headers = parseCsvRow(lines[0])
    const mapping = autoDetectMapping(headers)
    const mappedColumns = Object.values(mapping)
    const unmappedHeaders = headers.filter((_, i) => !mapping[i])

    const rows = lines.slice(1).map((line, idx) => {
      const cells = parseCsvRow(line)
      const row: Record<string, string> = {}
      for (const [colIdx, field] of Object.entries(mapping)) {
        row[field] = cells[Number(colIdx)] ?? ""
      }

      const errors: string[] = []
      if (!row.orgName?.trim()) errors.push("Nume firmă lipsă")
      if (row.cui) {
        const { normalized, wasFixed } = normalizeCUI(row.cui)
        if (!normalized) errors.push(`CUI invalid: "${row.cui}"`)
        else {
          row.cui = normalized
          if (wasFixed) row._cuiNormalized = "true"
        }
      }

      return {
        rowIndex: idx + 2,
        data: row,
        errors,
        valid: errors.length === 0,
      }
    })

    const validCount = rows.filter((r) => r.valid).length
    const invalidCount = rows.filter((r) => !r.valid).length

    return NextResponse.json({
      headers,
      mapping,
      unmappedHeaders,
      missingExpectedColumns: EXPECTED_COLUMNS.filter((c) => !mappedColumns.includes(c)),
      rows,
      summary: { total: rows.length, valid: validCount, invalid: invalidCount },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la preview.", 500, "PREVIEW_FAILED")
  }
}
