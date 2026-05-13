// Unit tests pentru parsed-invoices state extension.

import { describe, expect, it } from "vitest"

import {
  findInvoicesByPeriod,
  periodFromDateISO,
  recentParsedInvoices,
  sumVatForPeriod,
  summarizeParsedInvoices,
  upsertParsedInvoice,
  type ParsedInvoiceRecord,
} from "./parsed-invoices"

function mkInvoice(
  override: Partial<ParsedInvoiceRecord> = {},
): ParsedInvoiceRecord {
  return {
    id: `inv-${Math.random().toString(36).slice(2, 8)}`,
    direction: "primita",
    invoiceNumber: "F001",
    issueDateISO: "2026-04-15",
    period: "2026-04",
    partnerCif: "RO12345678",
    partnerName: "Furnizor SRL",
    totalNetRON: 1000,
    totalVatRON: 190,
    totalGrossRON: 1190,
    currency: "RON",
    confidence: "high",
    aiProvider: "gemini-vision",
    parsedAtISO: new Date().toISOString(),
    source: "ocr-image",
    data: { confidence: "high" },
    userVerified: false,
    errors: [],
    warnings: [],
    ...override,
  }
}

describe("periodFromDateISO", () => {
  it("extrage YYYY-MM dintr-un ISO date", () => {
    expect(periodFromDateISO("2026-04-15")).toBe("2026-04")
    expect(periodFromDateISO("2026-12-31T23:59:59Z")).toBe("2026-12")
  })

  it("returnează null pentru date invalid sau lipsă", () => {
    expect(periodFromDateISO(null)).toBeNull()
    expect(periodFromDateISO("")).toBeNull()
    expect(periodFromDateISO("invalid")).toBeNull()
  })
})

describe("upsertParsedInvoice", () => {
  it("adaugă factură nouă", () => {
    const result = upsertParsedInvoice([], mkInvoice({ id: "a" }))
    expect(result).toHaveLength(1)
  })

  it("înlocuiește factură cu aceeași cheie (direction + number + cif)", () => {
    const existing = [mkInvoice({ id: "a", invoiceNumber: "F001", partnerCif: "RO123" })]
    const newer = mkInvoice({
      id: "b",
      invoiceNumber: "F001",
      partnerCif: "RO123",
      totalNetRON: 9999,
    })
    const result = upsertParsedInvoice(existing, newer)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe("b")
    expect(result[0]?.totalNetRON).toBe(9999)
  })

  it("nu deduplică dacă lipsește număr sau CIF", () => {
    const existing = [mkInvoice({ id: "a", invoiceNumber: null })]
    const newer = mkInvoice({ id: "b", invoiceNumber: null })
    const result = upsertParsedInvoice(existing, newer)
    expect(result).toHaveLength(2)
  })

  it("permite același număr la directions diferite", () => {
    const a = mkInvoice({ id: "a", direction: "primita", invoiceNumber: "F1", partnerCif: "RO1" })
    const b = mkInvoice({ id: "b", direction: "emisa", invoiceNumber: "F1", partnerCif: "RO1" })
    const result = upsertParsedInvoice([a], b)
    expect(result).toHaveLength(2)
  })
})

describe("findInvoicesByPeriod & sumVatForPeriod", () => {
  const records = [
    mkInvoice({ id: "a", period: "2026-04", direction: "primita", totalVatRON: 100 }),
    mkInvoice({ id: "b", period: "2026-04", direction: "primita", totalVatRON: 200 }),
    mkInvoice({ id: "c", period: "2026-05", direction: "primita", totalVatRON: 50 }),
    mkInvoice({ id: "d", period: "2026-04", direction: "emisa", totalVatRON: 300 }),
  ]

  it("filtru pe perioadă + direcție", () => {
    const result = findInvoicesByPeriod(records, "primita", "2026-04")
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id).sort()).toEqual(["a", "b"])
  })

  it("sumă TVA pe perioadă", () => {
    const sum = sumVatForPeriod(records, "primita", "2026-04")
    expect(sum.count).toBe(2)
    expect(sum.totalVat).toBe(300)
  })

  it("sumă goală pentru perioadă fără facturi", () => {
    const sum = sumVatForPeriod(records, "primita", "2026-12")
    expect(sum.count).toBe(0)
    expect(sum.totalVat).toBe(0)
  })
})

describe("summarizeParsedInvoices", () => {
  it("agregă pe direction + verified + lowConfidence", () => {
    const records = [
      mkInvoice({ direction: "primita", userVerified: true, totalVatRON: 100 }),
      mkInvoice({ direction: "primita", confidence: "low", totalVatRON: 50 }),
      mkInvoice({ direction: "emisa", totalVatRON: 200 }),
    ]
    const summary = summarizeParsedInvoices(records)
    expect(summary.total).toBe(3)
    expect(summary.byDirection.primita).toBe(2)
    expect(summary.byDirection.emisa).toBe(1)
    expect(summary.verified).toBe(1)
    expect(summary.lowConfidence).toBe(1)
    expect(summary.totalVatPrimita).toBe(150)
    expect(summary.totalVatEmisa).toBe(200)
  })
})

describe("recentParsedInvoices", () => {
  it("sortează descrescător după parsedAtISO și aplică limita", () => {
    const records = [
      mkInvoice({ id: "old", parsedAtISO: "2026-01-01T00:00:00Z" }),
      mkInvoice({ id: "new", parsedAtISO: "2026-05-01T00:00:00Z" }),
      mkInvoice({ id: "mid", parsedAtISO: "2026-03-01T00:00:00Z" }),
    ]
    const result = recentParsedInvoices(records, 2)
    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe("new")
    expect(result[1]?.id).toBe("mid")
  })
})
