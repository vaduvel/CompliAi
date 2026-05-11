// Invoice sequence gap detector.
// Inspired by Saft-PT_4_PHP — fiscal inspectors check first that invoice
// numbering has no gaps/duplicates. CECCAR Cod Deontologic + Cod Fiscal Art.
// 319 require sequential numbering per series. Detects gaps + duplicates +
// out-of-order issue dates within a series.

import type { ScanFinding } from "@/lib/compliance/types"

export type InvoiceSequenceEntry = {
  invoiceNumber: string
  issueDateISO: string
  source?: string
}

export type SeriesAnalysis = {
  /** Prefix string (e.g., "F2026", "INV-") */
  series: string
  /** Sorted unique numeric sequence within the series */
  numbers: number[]
  minNumber: number
  maxNumber: number
  /** Missing numbers in [min, max] not present in numbers[] */
  gaps: number[]
  /** Numbers that appeared more than once across input */
  duplicates: number[]
  /** Entries whose issueDate is earlier than the previous number's issueDate */
  outOfOrderDates: Array<{
    earlierNumber: number
    earlierDateISO: string
    laterNumber: number
    laterDateISO: string
  }>
  totalEntries: number
}

export type SequenceAnalysisResult = {
  series: SeriesAnalysis[]
  unparsed: string[]
  hasGaps: boolean
  hasDuplicates: boolean
  hasDateAnomalies: boolean
}

// Strip leading separators and trim. Extract numeric tail + alphabetic prefix.
// Examples:
//   "F2026-0123"     -> { series: "F2026-", number: 123 }
//   "INV/2026/0007"  -> { series: "INV/2026/", number: 7 }
//   "FCT-00045"      -> { series: "FCT-", number: 45 }
//   "2026-100"       -> { series: "2026-", number: 100 }
//   "100"            -> { series: "", number: 100 }
export function splitInvoiceNumber(raw: string): { series: string; number: number } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(.*?)(\d+)\s*$/)
  if (!match) return null
  const seriesRaw = match[1] ?? ""
  const numberStr = match[2] ?? ""
  const number = Number.parseInt(numberStr, 10)
  if (!Number.isFinite(number)) return null
  // Normalize series: collapse trailing whitespace
  const series = seriesRaw.replace(/\s+$/, "")
  return { series, number }
}

export function analyzeInvoiceSequence(
  entries: InvoiceSequenceEntry[],
): SequenceAnalysisResult {
  type BySeries = Map<
    string,
    {
      numbers: Set<number>
      duplicates: Set<number>
      dateByNumber: Map<number, string>
      totalEntries: number
    }
  >

  const bySeries: BySeries = new Map()
  const unparsed: string[] = []

  for (const entry of entries) {
    const split = splitInvoiceNumber(entry.invoiceNumber)
    if (!split) {
      unparsed.push(entry.invoiceNumber)
      continue
    }
    const bucket =
      bySeries.get(split.series) ??
      ({
        numbers: new Set<number>(),
        duplicates: new Set<number>(),
        dateByNumber: new Map<number, string>(),
        totalEntries: 0,
      } as ReturnType<BySeries["get"]>)!
    if (bucket.numbers.has(split.number)) {
      bucket.duplicates.add(split.number)
    } else {
      bucket.numbers.add(split.number)
    }
    bucket.dateByNumber.set(split.number, entry.issueDateISO)
    bucket.totalEntries += 1
    bySeries.set(split.series, bucket)
  }

  const seriesResults: SeriesAnalysis[] = []
  for (const [series, bucket] of bySeries.entries()) {
    const sortedNumbers = Array.from(bucket.numbers).sort((a, b) => a - b)
    const minNumber = sortedNumbers[0] ?? 0
    const maxNumber = sortedNumbers[sortedNumbers.length - 1] ?? 0
    const gaps: number[] = []
    if (sortedNumbers.length >= 2) {
      for (let i = 1; i < sortedNumbers.length; i++) {
        const prev = sortedNumbers[i - 1]!
        const curr = sortedNumbers[i]!
        for (let n = prev + 1; n < curr; n++) gaps.push(n)
      }
    }

    const outOfOrderDates: SeriesAnalysis["outOfOrderDates"] = []
    let lastDate: string | null = null
    let lastNumber: number | null = null
    for (const n of sortedNumbers) {
      const date = bucket.dateByNumber.get(n)
      if (!date) continue
      if (lastDate !== null && lastNumber !== null && date < lastDate) {
        outOfOrderDates.push({
          earlierNumber: lastNumber,
          earlierDateISO: lastDate,
          laterNumber: n,
          laterDateISO: date,
        })
      }
      lastDate = date
      lastNumber = n
    }

    seriesResults.push({
      series,
      numbers: sortedNumbers,
      minNumber,
      maxNumber,
      gaps,
      duplicates: Array.from(bucket.duplicates).sort((a, b) => a - b),
      outOfOrderDates,
      totalEntries: bucket.totalEntries,
    })
  }

  const hasGaps = seriesResults.some((s) => s.gaps.length > 0)
  const hasDuplicates = seriesResults.some((s) => s.duplicates.length > 0)
  const hasDateAnomalies = seriesResults.some((s) => s.outOfOrderDates.length > 0)

  return { series: seriesResults, unparsed, hasGaps, hasDuplicates, hasDateAnomalies }
}

export function sequenceFindingsFromAnalysis(
  analysis: SequenceAnalysisResult,
  nowISO: string,
): ScanFinding[] {
  const findings: ScanFinding[] = []
  const todayKey = nowISO.split("T")[0]

  for (const series of analysis.series) {
    if (series.gaps.length > 0) {
      const sample = series.gaps.slice(0, 5).join(", ")
      findings.push({
        id: `seq-gap-${series.series || "default"}`,
        title: `Goluri în seria "${series.series || "(fără prefix)"}"`,
        detail:
          `Seria "${series.series}" are ${series.gaps.length} numere lipsă între ` +
          `${series.minNumber} și ${series.maxNumber}. Primele lipsuri: ${sample}.`,
        category: "E_FACTURA",
        severity: "high",
        risk: "high",
        principles: [],
        createdAtISO: nowISO,
        sourceDocument: "Sequence Audit",
        scanId: `seq-audit-${todayKey}`,
        impactSummary:
          "Inspectorul fiscal cere unicitate și secvențialitate. Numere lipsă pot fi interpretate ca facturi anulate fără justificare.",
        remediationHint:
          "Identifică în ERP/contabilitate facturile cu aceste numere. Dacă au fost anulate, păstrează justificarea în dosar.",
      })
    }
    if (series.duplicates.length > 0) {
      findings.push({
        id: `seq-dup-${series.series || "default"}`,
        title: `Duplicate în seria "${series.series || "(fără prefix)"}"`,
        detail:
          `Numere folosite de mai multe ori: ${series.duplicates.slice(0, 10).join(", ")}` +
          (series.duplicates.length > 10 ? "…" : ""),
        category: "E_FACTURA",
        severity: "high",
        risk: "high",
        principles: [],
        createdAtISO: nowISO,
        sourceDocument: "Sequence Audit",
        scanId: `seq-audit-${todayKey}`,
        impactSummary:
          "Duplicate de număr factură pot bloca dreptul de deducere TVA pentru cumpărător.",
        remediationHint:
          "Verifică în SmartBill/Saga/Oblio care factură e originalul și anulează duplicatul cu storno + factură nouă.",
      })
    }
    if (series.outOfOrderDates.length > 0) {
      findings.push({
        id: `seq-date-${series.series || "default"}`,
        title: `Date neordonate în seria "${series.series || "(fără prefix)"}"`,
        detail:
          `${series.outOfOrderDates.length} cazuri unde un număr mai mare are dată mai mică ` +
          "decât unul mai mic. Exemplu: " +
          (series.outOfOrderDates[0]
            ? `${series.outOfOrderDates[0].earlierNumber}(${series.outOfOrderDates[0].earlierDateISO}) ` +
              `vs ${series.outOfOrderDates[0].laterNumber}(${series.outOfOrderDates[0].laterDateISO}).`
            : ""),
        category: "E_FACTURA",
        severity: "medium",
        risk: "low",
        principles: [],
        createdAtISO: nowISO,
        sourceDocument: "Sequence Audit",
        scanId: `seq-audit-${todayKey}`,
        impactSummary:
          "Cronologie inversă în serie ridică flag la audit (factură generată retroactiv?).",
        remediationHint:
          "Verifică data de emitere corectă în programul de facturare. Corectează dacă e greșit, justifică dacă a fost intenționat.",
      })
    }
  }

  return findings
}
