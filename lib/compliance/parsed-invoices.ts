// State extension pentru facturi extrase via OCR (lib/compliance/invoice-ocr-extract.ts).
// Persistăm facturi primite (de la furnizori) pentru cross-correlation R1:
//   Σ TVA facturi primite ↔ D300 TVA deductibil (rd24-rd33).
// Și opțional facturi emise pentru auto-completare e-Factura.

import type { ExtractedInvoiceData } from "@/lib/compliance/invoice-ocr-extract"

export type InvoiceDirection = "primita" | "emisa"

export type OcrInvoiceSource =
  | "ocr-image"
  | "ocr-pdf"
  | "ocr-voice"
  | "manual"

export type ParsedInvoiceRecord = {
  id: string
  /** Direcție: primită (de la furnizor) vs emisă (către client). */
  direction: InvoiceDirection
  /** Număr factură extras (poate fi null dacă AI n-a putut detecta). */
  invoiceNumber: string | null
  /** Data emiterii (YYYY-MM-DD) — null dacă AI n-a putut detecta. */
  issueDateISO: string | null
  /** Perioada normalizată YYYY-MM pentru filtrare/cross-correlation. */
  period: string | null
  /** CIF furnizor (pentru "primita") sau client (pentru "emisa"). */
  partnerCif: string | null
  partnerName: string | null
  totalNetRON: number | null
  totalVatRON: number | null
  totalGrossRON: number | null
  currency: string | null
  /** Confidence raw din AI: "high" | "medium" | "low" sau null. */
  confidence: "high" | "medium" | "low" | null
  /** Provider AI folosit. */
  aiProvider: string
  parsedAtISO: string
  source: OcrInvoiceSource
  fileName?: string
  /** Payload complet (lines, raw notes, etc.). */
  data: ExtractedInvoiceData
  /** Indicator: utilizatorul a verificat manual datele extrase. */
  userVerified: boolean
  errors: string[]
  warnings: string[]
}

export type StateWithParsedInvoices = {
  parsedInvoices?: ParsedInvoiceRecord[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MAX_INVOICES = 500 // cap per org

/** Normalizează data ISO la perioadă YYYY-MM. */
export function periodFromDateISO(iso: string | null): string | null {
  if (!iso) return null
  const m = iso.match(/^(\d{4})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}` : null
}

/**
 * Append idempotent pe (direction, invoiceNumber, partnerCif). Dacă există
 * factură cu aceeași cheie, înlocuiește. Altfel adăugă.
 */
export function upsertParsedInvoice(
  existing: ParsedInvoiceRecord[],
  record: ParsedInvoiceRecord,
): ParsedInvoiceRecord[] {
  // Fără număr/CIF nu putem face dedup
  if (!record.invoiceNumber || !record.partnerCif) {
    return capList([...existing, record])
  }
  const filtered = existing.filter(
    (r) =>
      !(
        r.direction === record.direction &&
        r.invoiceNumber === record.invoiceNumber &&
        r.partnerCif === record.partnerCif
      ),
  )
  return capList([...filtered, record])
}

function capList(records: ParsedInvoiceRecord[]): ParsedInvoiceRecord[] {
  if (records.length <= MAX_INVOICES) return records
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return sorted.slice(0, MAX_INVOICES)
}

/** Filtru pentru cross-correlation: facturi primite dintr-o perioadă. */
export function findInvoicesByPeriod(
  records: ParsedInvoiceRecord[],
  direction: InvoiceDirection,
  period: string,
): ParsedInvoiceRecord[] {
  return records.filter(
    (r) => r.direction === direction && r.period === period,
  )
}

/** Sumă TVA totală facturi primite pe o perioadă — pentru R1 vs D300. */
export function sumVatForPeriod(
  records: ParsedInvoiceRecord[],
  direction: InvoiceDirection,
  period: string,
): { totalNet: number; totalVat: number; totalGross: number; count: number } {
  const filtered = findInvoicesByPeriod(records, direction, period)
  let totalNet = 0
  let totalVat = 0
  let totalGross = 0
  for (const r of filtered) {
    totalNet += r.totalNetRON ?? 0
    totalVat += r.totalVatRON ?? 0
    totalGross += r.totalGrossRON ?? 0
  }
  return { totalNet, totalVat, totalGross, count: filtered.length }
}

/** Sumar pentru dashboard. */
export function summarizeParsedInvoices(records: ParsedInvoiceRecord[]): {
  total: number
  byDirection: Record<InvoiceDirection, number>
  verified: number
  lowConfidence: number
  totalVatPrimita: number
  totalVatEmisa: number
} {
  const byDirection: Record<InvoiceDirection, number> = {
    primita: 0,
    emisa: 0,
  }
  let verified = 0
  let lowConfidence = 0
  let totalVatPrimita = 0
  let totalVatEmisa = 0
  for (const r of records) {
    byDirection[r.direction]++
    if (r.userVerified) verified++
    if (r.confidence === "low") lowConfidence++
    if (r.direction === "primita") totalVatPrimita += r.totalVatRON ?? 0
    else totalVatEmisa += r.totalVatRON ?? 0
  }
  return {
    total: records.length,
    byDirection,
    verified,
    lowConfidence,
    totalVatPrimita,
    totalVatEmisa,
  }
}

/** Cele mai recente N facturi. */
export function recentParsedInvoices(
  records: ParsedInvoiceRecord[],
  limit = 20,
): ParsedInvoiceRecord[] {
  const sorted = [...records].sort((a, b) =>
    b.parsedAtISO.localeCompare(a.parsedAtISO),
  )
  return sorted.slice(0, limit)
}
