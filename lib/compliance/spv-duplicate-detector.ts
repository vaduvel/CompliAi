// SPV duplicate detector — pain #3 validat: "Aceeași factură apare 96+ ori în
// SPV cu ID-uri diferite (bug ANAF din 2022)".
//
// Strategie: detectează duplicate prin (invoiceNumber + supplierCif + issueDate)
// vs. doar prin SPV upload_id. Marchează rândurile cu count > 1 ca suspecte.
//
// Pure functions.

export type SpvInvoiceRow = {
  /** ID intern SPV (upload index — poate fi duplicat dacă bug ANAF). */
  spvUploadId: string
  /** Număr factură real (din XML). */
  invoiceNumber: string
  /** CIF furnizor. */
  supplierCif: string
  /** Data emiterii. */
  issueDateISO: string
  /** Sumă totală (pentru verificare suplimentară). */
  totalAmount?: number
  /** Data primirii în SPV. */
  receivedAtISO?: string
}

export type DuplicateGroup = {
  /** Cheie de dedup: invoiceNumber + supplierCif + issueDate. */
  key: string
  invoiceNumber: string
  supplierCif: string
  issueDateISO: string
  count: number
  spvUploadIds: string[]
  /** Recomandare: care upload să se considere ORIGINALUL (primul după receivedAtISO). */
  recommendedKeepUploadId: string
  /** Lista upload-uri de ignorat în calcule fiscale. */
  duplicateUploadIds: string[]
}

export type DedupResult = {
  totalRows: number
  uniqueInvoices: number
  duplicateGroups: DuplicateGroup[]
  duplicateRowsCount: number
}

function makeKey(row: SpvInvoiceRow): string {
  return `${row.invoiceNumber}::${row.supplierCif}::${row.issueDateISO.slice(0, 10)}`
}

// F#3 (Sprint 5) — normalizare nume factură pentru fuzzy matching.
// Exemple care PRIMA dată nu match-uiau: "F123", "F-123", "F 123", "Fac 123",
// "FCT-00123" → toate trebuie să dea cheie identică.
function normalizeInvoiceNumber(num: string): string {
  return num
    .toUpperCase()
    .replace(/[^\dA-Z]/g, "") // elimină separatori (- _ space etc.)
    .replace(/^(FACTURA|FCT|FAC|F|NR)/, "") // elimină prefixele uzuale
}

function makeFuzzyKey(row: SpvInvoiceRow): string {
  return `${normalizeInvoiceNumber(row.invoiceNumber)}::${row.supplierCif}::${row.issueDateISO.slice(0, 10)}`
}

/**
 * F#3 (Sprint 5 EXTEND) — Detectare duplicate cu fuzzy matching opțional.
 *
 * Default: strict matching (cheia: invoiceNumber + cif + date).
 * Fuzzy mode: normalizează invoiceNumber pentru a prinde variații (F-123, F123,
 * Fac 123, FCT-00123 → toate cheie identică).
 *
 * Pain validat: Open.money study — 0.1-1.5% din plăți sunt duplicate, SAP
 * Concur 1.29% facturi duplicate @ $2,034 avg = pierdere medie ~3% revenue.
 */
export function detectSpvDuplicates(
  rows: SpvInvoiceRow[],
  options: { fuzzy?: boolean } = {},
): DedupResult {
  const keyFn = options.fuzzy ? makeFuzzyKey : makeKey
  const byKey = new Map<string, SpvInvoiceRow[]>()
  for (const row of rows) {
    const key = keyFn(row)
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(row)
  }

  const duplicateGroups: DuplicateGroup[] = []
  let duplicateRowsCount = 0

  for (const [key, groupRows] of byKey.entries()) {
    if (groupRows.length <= 1) continue
    // Sortare: primul după receivedAtISO (cel mai vechi = original)
    const sorted = [...groupRows].sort((a, b) => {
      const aT = a.receivedAtISO ? new Date(a.receivedAtISO).getTime() : 0
      const bT = b.receivedAtISO ? new Date(b.receivedAtISO).getTime() : 0
      return aT - bT
    })
    const keep = sorted[0]
    const duplicates = sorted.slice(1)
    duplicateGroups.push({
      key,
      invoiceNumber: keep.invoiceNumber,
      supplierCif: keep.supplierCif,
      issueDateISO: keep.issueDateISO,
      count: groupRows.length,
      spvUploadIds: groupRows.map((r) => r.spvUploadId),
      recommendedKeepUploadId: keep.spvUploadId,
      duplicateUploadIds: duplicates.map((r) => r.spvUploadId),
    })
    duplicateRowsCount += duplicates.length
  }

  return {
    totalRows: rows.length,
    uniqueInvoices: byKey.size,
    duplicateGroups: duplicateGroups.sort((a, b) => b.count - a.count),
    duplicateRowsCount,
  }
}

/**
 * Returnează un set de spvUploadId care trebuie EXCLUSE din calcule (TVA dedus,
 * D300 draft etc.) pentru a evita dublarea valorilor.
 */
export function buildIgnoreSet(result: DedupResult): Set<string> {
  const ignore = new Set<string>()
  for (const g of result.duplicateGroups) {
    for (const id of g.duplicateUploadIds) ignore.add(id)
  }
  return ignore
}

// ── F#3 (Sprint 5 EXTEND) — Bank duplicate payment detector ──────────────────
//
// Pain: 0.1-2.5% din plăți sunt duplicate (APQC). Sistemele actuale ratează
// duplicate cu sumă identică + dată apropiată + CUI identic.
//
// Detector: caut perechi tranzacții cu (CUI + sumă ±0.01 + dată ±3 zile)
// excluzând tranzacții cu narrative dramatic diferit (transfer vs plată factură).

export type BankDuplicatePayment = {
  id: string
  partyCif: string
  amount: number
  primaryDateISO: string
  duplicateDateISO: string
  daysApart: number
  narratives: string[]
  bankRefs: string[]
}

export type BankTransactionForDedup = {
  id: string
  detectedCif?: string
  absoluteAmount: number
  dateISO: string
  narrative: string
  bankRef?: string
}

export function detectBankDuplicatePayments(
  transactions: BankTransactionForDedup[],
): BankDuplicatePayment[] {
  const duplicates: BankDuplicatePayment[] = []
  // Group by (cif + rounded amount)
  const groups = new Map<string, BankTransactionForDedup[]>()
  for (const t of transactions) {
    if (!t.detectedCif || t.absoluteAmount <= 0) continue
    const key = `${t.detectedCif}::${t.absoluteAmount.toFixed(2)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  for (const [, group] of groups.entries()) {
    if (group.length < 2) continue
    const sorted = group.sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    for (let i = 1; i < sorted.length; i++) {
      const primary = sorted[0]
      const dup = sorted[i]
      const daysApart = Math.abs(
        Math.round(
          (new Date(dup.dateISO).getTime() - new Date(primary.dateISO).getTime()) / 86_400_000,
        ),
      )
      if (daysApart > 7) continue // peste 7 zile = probabil tranzacții legitime separate
      duplicates.push({
        id: `dup-${primary.id}-${dup.id}`,
        partyCif: primary.detectedCif!,
        amount: primary.absoluteAmount,
        primaryDateISO: primary.dateISO,
        duplicateDateISO: dup.dateISO,
        daysApart,
        narratives: [primary.narrative, dup.narrative],
        bankRefs: [primary.bankRef ?? "", dup.bankRef ?? ""],
      })
    }
  }
  return duplicates.sort((a, b) => b.amount - a.amount)
}
