import { describe, expect, it } from "vitest"

import {
  analyzeInvoiceSequence,
  sequenceFindingsFromAnalysis,
  splitInvoiceNumber,
} from "./invoice-sequence-gap"

describe("splitInvoiceNumber", () => {
  it("splits common Romanian invoice number patterns", () => {
    expect(splitInvoiceNumber("F2026-0123")).toEqual({ series: "F2026-", number: 123 })
    expect(splitInvoiceNumber("INV/2026/0007")).toEqual({ series: "INV/2026/", number: 7 })
    expect(splitInvoiceNumber("FCT-00045")).toEqual({ series: "FCT-", number: 45 })
    expect(splitInvoiceNumber("2026-100")).toEqual({ series: "2026-", number: 100 })
    expect(splitInvoiceNumber("100")).toEqual({ series: "", number: 100 })
  })

  it("returns null for non-numeric tails", () => {
    expect(splitInvoiceNumber("ABC")).toBeNull()
    expect(splitInvoiceNumber("")).toBeNull()
  })
})

describe("analyzeInvoiceSequence", () => {
  it("detects gaps in a single series", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "F2026-1", issueDateISO: "2026-01-01" },
      { invoiceNumber: "F2026-2", issueDateISO: "2026-01-02" },
      { invoiceNumber: "F2026-5", issueDateISO: "2026-01-05" }, // gap 3, 4
      { invoiceNumber: "F2026-6", issueDateISO: "2026-01-06" },
    ])
    expect(result.hasGaps).toBe(true)
    expect(result.series).toHaveLength(1)
    expect(result.series[0]!.gaps).toEqual([3, 4])
    expect(result.series[0]!.duplicates).toEqual([])
  })

  it("detects duplicates", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "F-1", issueDateISO: "2026-01-01" },
      { invoiceNumber: "F-2", issueDateISO: "2026-01-02" },
      { invoiceNumber: "F-2", issueDateISO: "2026-01-03" },
    ])
    expect(result.hasDuplicates).toBe(true)
    expect(result.series[0]!.duplicates).toEqual([2])
  })

  it("detects out-of-order issue dates within a series", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "F-1", issueDateISO: "2026-01-10" },
      { invoiceNumber: "F-2", issueDateISO: "2026-01-05" }, // earlier date than #1
      { invoiceNumber: "F-3", issueDateISO: "2026-01-15" },
    ])
    expect(result.hasDateAnomalies).toBe(true)
    expect(result.series[0]!.outOfOrderDates).toHaveLength(1)
    expect(result.series[0]!.outOfOrderDates[0]!.earlierNumber).toBe(1)
    expect(result.series[0]!.outOfOrderDates[0]!.laterNumber).toBe(2)
  })

  it("groups multiple series independently", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "A-1", issueDateISO: "2026-01-01" },
      { invoiceNumber: "A-3", issueDateISO: "2026-01-03" },
      { invoiceNumber: "B-1", issueDateISO: "2026-01-02" },
      { invoiceNumber: "B-2", issueDateISO: "2026-01-04" },
    ])
    expect(result.series).toHaveLength(2)
    const seriesA = result.series.find((s) => s.series === "A-")
    const seriesB = result.series.find((s) => s.series === "B-")
    expect(seriesA?.gaps).toEqual([2])
    expect(seriesB?.gaps).toEqual([])
  })

  it("returns findings for gaps and duplicates", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "F2026-1", issueDateISO: "2026-01-01" },
      { invoiceNumber: "F2026-3", issueDateISO: "2026-01-03" },
      { invoiceNumber: "F2026-3", issueDateISO: "2026-01-04" },
    ])
    const findings = sequenceFindingsFromAnalysis(result, "2026-05-11T10:00:00.000Z")
    const gapFinding = findings.find((f) => f.id.startsWith("seq-gap-"))
    const dupFinding = findings.find((f) => f.id.startsWith("seq-dup-"))
    expect(gapFinding?.severity).toBe("high")
    expect(dupFinding?.severity).toBe("high")
  })

  it("collects unparseable invoice numbers separately", () => {
    const result = analyzeInvoiceSequence([
      { invoiceNumber: "F-1", issueDateISO: "2026-01-01" },
      { invoiceNumber: "ABCDEF", issueDateISO: "2026-01-02" },
    ])
    expect(result.unparsed).toEqual(["ABCDEF"])
  })
})
