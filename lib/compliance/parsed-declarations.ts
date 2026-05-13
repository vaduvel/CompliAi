// State extension pentru declarații parsate (D300, D205, D100, etc.).
// Stocăm rezultatul fiecărui upload pentru cross-correlation cu facturi/AGA/ONRC.

import type { D300ParsedData } from "@/lib/compliance/parser-d300"
import type { D205ParsedData } from "@/lib/compliance/parser-d205"

export type ParsedDeclarationType = "d300" | "d205" | "d100"
export type ParsedDeclarationSource = "upload-xml" | "upload-pdf" | "spv-fetch"

/** Union al payload-urilor parsate per tip declarație. */
export type ParsedDeclarationData = D300ParsedData | D205ParsedData

export type ParsedDeclarationRecord = {
  id: string
  type: ParsedDeclarationType
  /** Perioada normalizată (YYYY-MM sau YYYY-Qn sau YYYY). */
  period: string | null
  cui: string | null
  isRectification: boolean
  parsedAtISO: string
  source: ParsedDeclarationSource
  fileName?: string
  /** Date parsate (union pe tipuri pentru D300 / D205 / D100). */
  data: ParsedDeclarationData
  /** Erori parser (informative, înregistrarea se salvează chiar și cu erori). */
  errors: string[]
  /** Warnings parser. */
  warnings: string[]
}

export type StateWithParsedDeclarations = {
  parsedDeclarations?: ParsedDeclarationRecord[]
}

// ── Helpers (pure functions) ────────────────────────────────────────────────

const MAX_DECLARATIONS = 50 // cap per org pentru a evita state bloat

/**
 * Append idempotent: dacă un record cu același (type, period, cui) și non-
 * rectificativă există, îl înlocuim. Pentru rectificative, păstrăm toate.
 */
export function upsertParsedDeclaration(
  existing: ParsedDeclarationRecord[],
  record: ParsedDeclarationRecord,
): ParsedDeclarationRecord[] {
  // Pentru rectificative, NU înlocuim — păstrăm istoricul
  if (record.isRectification) {
    const next = [...existing, record]
    return capList(next)
  }

  // Pentru primare, înlocuim recordul anterior cu aceeași cheie (type+period+cui)
  const filtered = existing.filter(
    (r) =>
      !(
        r.type === record.type &&
        r.period === record.period &&
        r.cui === record.cui &&
        !r.isRectification
      ),
  )
  return capList([...filtered, record])
}

function capList(records: ParsedDeclarationRecord[]): ParsedDeclarationRecord[] {
  if (records.length <= MAX_DECLARATIONS) return records
  // Sortăm descrescător cronologic și păstrăm primii N
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return sorted.slice(0, MAX_DECLARATIONS)
}

/**
 * Returnează cea mai recentă declarație de un tip + perioadă.
 */
export function findLatestParsedDeclaration(
  records: ParsedDeclarationRecord[],
  type: ParsedDeclarationType,
  period: string,
): ParsedDeclarationRecord | null {
  const matches = records.filter((r) => r.type === type && r.period === period)
  if (matches.length === 0) return null
  matches.sort((a, b) => b.parsedAtISO.localeCompare(a.parsedAtISO))
  return matches[0] ?? null
}

/**
 * Sumar pentru afișare în UI (top 5 cele mai recente).
 */
export function summarizeParsedDeclarations(
  records: ParsedDeclarationRecord[],
): {
  total: number
  byType: Record<ParsedDeclarationType, number>
  recent: ParsedDeclarationRecord[]
} {
  const byType: Record<ParsedDeclarationType, number> = {
    d300: 0,
    d205: 0,
    d100: 0,
  }
  for (const r of records) {
    byType[r.type]++
  }
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return {
    total: records.length,
    byType,
    recent: sorted.slice(0, 5),
  }
}
