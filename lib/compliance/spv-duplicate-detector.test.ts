import { describe, expect, it } from "vitest"
import {
  buildIgnoreSet,
  detectBankDuplicatePayments,
  detectSpvDuplicates,
  type BankTransactionForDedup,
  type SpvInvoiceRow,
} from "./spv-duplicate-detector"

describe("detectSpvDuplicates", () => {
  it("returnează gol pentru listă goală", () => {
    const r = detectSpvDuplicates([])
    expect(r.totalRows).toBe(0)
    expect(r.duplicateGroups).toEqual([])
  })

  it("nu raportează grupuri fără duplicate", () => {
    const rows: SpvInvoiceRow[] = [
      { spvUploadId: "u1", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u2", invoiceNumber: "F2", supplierCif: "RO1", issueDateISO: "2026-05-01" },
    ]
    const r = detectSpvDuplicates(rows)
    expect(r.duplicateGroups).toEqual([])
    expect(r.uniqueInvoices).toBe(2)
  })

  it("detectează duplicate prin (invoiceNumber + cif + date)", () => {
    const rows: SpvInvoiceRow[] = [
      { spvUploadId: "u1", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01", receivedAtISO: "2026-05-02T08:00:00Z" },
      { spvUploadId: "u2", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01", receivedAtISO: "2026-05-02T08:30:00Z" },
      { spvUploadId: "u3", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01", receivedAtISO: "2026-05-02T09:00:00Z" },
    ]
    const r = detectSpvDuplicates(rows)
    expect(r.duplicateGroups).toHaveLength(1)
    const g = r.duplicateGroups[0]
    expect(g.count).toBe(3)
    expect(g.recommendedKeepUploadId).toBe("u1") // cel mai vechi receivedAtISO
    expect(g.duplicateUploadIds).toEqual(["u2", "u3"])
    expect(r.duplicateRowsCount).toBe(2)
  })

  it("sortează grupurile descrescător după count", () => {
    const rows: SpvInvoiceRow[] = [
      // F1 dublu
      { spvUploadId: "u1", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u2", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      // F2 triplu
      { spvUploadId: "u3", invoiceNumber: "F2", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u4", invoiceNumber: "F2", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u5", invoiceNumber: "F2", supplierCif: "RO1", issueDateISO: "2026-05-01" },
    ]
    const r = detectSpvDuplicates(rows)
    expect(r.duplicateGroups[0].invoiceNumber).toBe("F2")
    expect(r.duplicateGroups[0].count).toBe(3)
    expect(r.duplicateGroups[1].invoiceNumber).toBe("F1")
    expect(r.duplicateGroups[1].count).toBe(2)
  })

  it("buildIgnoreSet returnează doar duplicate IDs (NU și originalul)", () => {
    const rows: SpvInvoiceRow[] = [
      { spvUploadId: "u1", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01", receivedAtISO: "2026-05-02T08:00:00Z" },
      { spvUploadId: "u2", invoiceNumber: "F1", supplierCif: "RO1", issueDateISO: "2026-05-01", receivedAtISO: "2026-05-02T09:00:00Z" },
    ]
    const r = detectSpvDuplicates(rows)
    const ignore = buildIgnoreSet(r)
    expect(ignore.has("u1")).toBe(false) // original
    expect(ignore.has("u2")).toBe(true)
  })

  // ── F#3 Sprint 5 EXTEND tests ──

  it("fuzzy: prinde duplicate cu format diferit (F-123 vs F123 vs F 123)", () => {
    const rows: SpvInvoiceRow[] = [
      { spvUploadId: "u1", invoiceNumber: "F-123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u2", invoiceNumber: "F123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u3", invoiceNumber: "F 123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
    ]
    // Strict mode: NU prinde (3 invoice numbers diferite)
    const strict = detectSpvDuplicates(rows)
    expect(strict.duplicateGroups).toHaveLength(0)
    // Fuzzy mode: prinde toate ca 1 group
    const fuzzy = detectSpvDuplicates(rows, { fuzzy: true })
    expect(fuzzy.duplicateGroups).toHaveLength(1)
    expect(fuzzy.duplicateGroups[0].count).toBe(3)
  })

  it("fuzzy: prinde Fac/FAC/FCT prefix variations", () => {
    const rows: SpvInvoiceRow[] = [
      { spvUploadId: "u1", invoiceNumber: "Factura 123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u2", invoiceNumber: "FAC123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
      { spvUploadId: "u3", invoiceNumber: "FCT 123", supplierCif: "RO1", issueDateISO: "2026-05-01" },
    ]
    const fuzzy = detectSpvDuplicates(rows, { fuzzy: true })
    expect(fuzzy.duplicateGroups).toHaveLength(1)
    expect(fuzzy.duplicateGroups[0].count).toBe(3)
  })
})

describe("detectBankDuplicatePayments", () => {
  it("prinde plăți duplicate cu același CUI + sumă + dată apropiată", () => {
    const transactions: BankTransactionForDedup[] = [
      { id: "t1", detectedCif: "RO12345678", absoluteAmount: 1000, dateISO: "2026-05-10", narrative: "Plata F100" },
      { id: "t2", detectedCif: "RO12345678", absoluteAmount: 1000, dateISO: "2026-05-12", narrative: "Plata F100 - retransmis" },
    ]
    const duplicates = detectBankDuplicatePayments(transactions)
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].partyCif).toBe("RO12345678")
    expect(duplicates[0].amount).toBe(1000)
    expect(duplicates[0].daysApart).toBe(2)
  })

  it("ignoră plăți cu sumă diferită chiar și pentru același CUI", () => {
    const transactions: BankTransactionForDedup[] = [
      { id: "t1", detectedCif: "RO12345678", absoluteAmount: 1000, dateISO: "2026-05-10", narrative: "Plata 1" },
      { id: "t2", detectedCif: "RO12345678", absoluteAmount: 1500, dateISO: "2026-05-11", narrative: "Plata 2" },
    ]
    expect(detectBankDuplicatePayments(transactions)).toHaveLength(0)
  })

  it("ignoră plăți la distanță mai mare de 7 zile (probabil legitim)", () => {
    const transactions: BankTransactionForDedup[] = [
      { id: "t1", detectedCif: "RO1", absoluteAmount: 1000, dateISO: "2026-05-01", narrative: "Plata 1" },
      { id: "t2", detectedCif: "RO1", absoluteAmount: 1000, dateISO: "2026-05-15", narrative: "Plata recurentă" },
    ]
    expect(detectBankDuplicatePayments(transactions)).toHaveLength(0)
  })

  it("sortează descrescător după sumă", () => {
    const transactions: BankTransactionForDedup[] = [
      { id: "small1", detectedCif: "RO1", absoluteAmount: 100, dateISO: "2026-05-10", narrative: "x" },
      { id: "small2", detectedCif: "RO1", absoluteAmount: 100, dateISO: "2026-05-11", narrative: "x" },
      { id: "big1", detectedCif: "RO2", absoluteAmount: 5000, dateISO: "2026-05-10", narrative: "y" },
      { id: "big2", detectedCif: "RO2", absoluteAmount: 5000, dateISO: "2026-05-11", narrative: "y" },
    ]
    const duplicates = detectBankDuplicatePayments(transactions)
    expect(duplicates).toHaveLength(2)
    expect(duplicates[0].amount).toBe(5000)
    expect(duplicates[1].amount).toBe(100)
  })
})
