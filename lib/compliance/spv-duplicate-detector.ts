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

export function detectSpvDuplicates(rows: SpvInvoiceRow[]): DedupResult {
  const byKey = new Map<string, SpvInvoiceRow[]>()
  for (const row of rows) {
    const key = makeKey(row)
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
