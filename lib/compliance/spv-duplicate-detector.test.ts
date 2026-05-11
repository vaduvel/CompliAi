import { describe, expect, it } from "vitest"
import { buildIgnoreSet, detectSpvDuplicates, type SpvInvoiceRow } from "./spv-duplicate-detector"

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
})
