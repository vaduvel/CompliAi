// State extension pentru hotărâri AGA extrase via Gemini (parser-aga.ts).
// AGA NU sunt declarații ANAF — sunt documente corporative ce alimentează
// cross-correlation R2 (AGA ↔ stat plată ↔ D205) și R3 (AGA procent ↔ ONRC).

import type { AgaExtractedData } from "@/lib/compliance/parser-aga"

export type ParsedAgaSource = "upload-text" | "upload-pdf" | "manual"

export type ParsedAgaRecord = {
  id: string
  /** Data hotărârii (YYYY-MM-DD) — null dacă AI n-a putut extrage. */
  resolutionDate: string | null
  /** Exercițiu financiar pentru care s-au distribuit dividende. */
  financialYear: number | null
  parsedAtISO: string
  source: ParsedAgaSource
  fileName?: string
  /** Payload complet extras de AI. */
  data: AgaExtractedData
  /** Indicator: utilizatorul a verificat manual datele extrase. */
  userVerified: boolean
  errors: string[]
  warnings: string[]
}

export type StateWithParsedAga = {
  parsedAga?: ParsedAgaRecord[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MAX_AGA_RECORDS = 50

/**
 * Append cu idempotență pe (resolutionDate, financialYear). Dacă un record cu
 * aceeași dată + an există, îl înlocuim (re-upload). Altfel adăugăm.
 */
export function upsertParsedAga(
  existing: ParsedAgaRecord[],
  record: ParsedAgaRecord,
): ParsedAgaRecord[] {
  // Dacă nu avem dată extrasă, mereu adăugăm (nu putem face dedup)
  if (!record.resolutionDate) {
    return capList([...existing, record])
  }
  const filtered = existing.filter(
    (r) =>
      !(
        r.resolutionDate === record.resolutionDate &&
        r.financialYear === record.financialYear
      ),
  )
  return capList([...filtered, record])
}

function capList(records: ParsedAgaRecord[]): ParsedAgaRecord[] {
  if (records.length <= MAX_AGA_RECORDS) return records
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return sorted.slice(0, MAX_AGA_RECORDS)
}

/** Cele mai recente N hotărâri (default 5). */
export function recentParsedAga(
  records: ParsedAgaRecord[],
  limit = 5,
): ParsedAgaRecord[] {
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return sorted.slice(0, limit)
}

/** Găsește hotărârea cea mai recentă pentru un an financiar. */
export function findAgaForFinancialYear(
  records: ParsedAgaRecord[],
  year: number,
): ParsedAgaRecord | null {
  const matches = records.filter((r) => r.financialYear === year)
  if (matches.length === 0) return null
  matches.sort((a, b) => b.parsedAtISO.localeCompare(a.parsedAtISO))
  return matches[0] ?? null
}

/** Sumar pentru dashboard. */
export function summarizeParsedAga(records: ParsedAgaRecord[]): {
  total: number
  verified: number
  withWarnings: number
  totalDividendsLastYear: number | null
} {
  const total = records.length
  const verified = records.filter((r) => r.userVerified).length
  const withWarnings = records.filter((r) => r.warnings.length > 0).length

  // Calculăm dividendele totale pentru ultimul an financiar găsit
  const years = records
    .map((r) => r.financialYear)
    .filter((y): y is number => typeof y === "number")
  const lastYear = years.length > 0 ? Math.max(...years) : null
  let totalDividendsLastYear: number | null = null
  if (lastYear !== null) {
    const agaForYear = records.filter((r) => r.financialYear === lastYear)
    const dividendsSum = agaForYear.reduce(
      (sum, r) => sum + (r.data.totalDividendsAmount ?? 0),
      0,
    )
    totalDividendsLastYear = dividendsSum > 0 ? dividendsSum : null
  }

  return {
    total,
    verified,
    withWarnings,
    totalDividendsLastYear,
  }
}
