import { describe, it, expect } from "vitest"

import {
  detectFalseConformance,
  type AnafNotification,
  type OrgFiscalEvidence,
} from "./false-conformance-detector"

const ANAF_NOTIF_SUPPLIER_UNDECLARED: AnafNotification = {
  id: "anaf-1",
  type: "conformance_supplier_undeclared",
  receivedAtISO: "2026-05-10T10:00:00Z",
  period: "2026-04",
  details: {
    invoiceNumbers: ["FACT-001", "FACT-002"],
    supplierCifs: ["RO12345678"],
  },
}

describe("detectFalseConformance — supplier_undeclared", () => {
  it("returnează isFalsePositive=true high confidence când TOATE facturile sunt în SPV cu spvIndex", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [
        { invoiceNumber: "FACT-001", supplierCif: "12345678", issueDate: "2026-04-15", spvIndex: "SPV-001", receivedAtISO: "2026-04-15T09:00:00Z" },
        { invoiceNumber: "FACT-002", supplierCif: "12345678", issueDate: "2026-04-20", spvIndex: "SPV-002", receivedAtISO: "2026-04-20T09:00:00Z" },
      ],
      expenseDocuments: [],
    }
    const result = detectFalseConformance(ANAF_NOTIF_SUPPLIER_UNDECLARED, evidence)
    expect(result.isFalsePositive).toBe(true)
    expect(result.confidence).toBe("high")
    expect(result.recommendedResponse).toBe("conformare_factura_furnizor_lipsa")
  })

  it("medium confidence când facturile există dar fără spvIndex", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [
        { invoiceNumber: "FACT-001", supplierCif: "12345678", issueDate: "2026-04-15", receivedAtISO: "2026-04-15T09:00:00Z" },
        { invoiceNumber: "FACT-002", supplierCif: "12345678", issueDate: "2026-04-20", receivedAtISO: "2026-04-20T09:00:00Z" },
      ],
      expenseDocuments: [],
    }
    const result = detectFalseConformance(ANAF_NOTIF_SUPPLIER_UNDECLARED, evidence)
    expect(result.isFalsePositive).toBe(true)
    expect(result.confidence).toBe("medium")
  })

  it("partial — nu fals, recomandă investigare manuală", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [
        { invoiceNumber: "FACT-001", supplierCif: "12345678", issueDate: "2026-04-15", spvIndex: "SPV-001", receivedAtISO: "2026-04-15T09:00:00Z" },
      ],
      expenseDocuments: [],
    }
    const result = detectFalseConformance(ANAF_NOTIF_SUPPLIER_UNDECLARED, evidence)
    expect(result.isFalsePositive).toBe(false)
    expect(result.recommendedResponse).toBe("investigate_manual")
  })
})

describe("detectFalseConformance — etva duplicates", () => {
  const notif: AnafNotification = {
    id: "anaf-2",
    type: "etva_diff_with_duplicates",
    receivedAtISO: "2026-05-10T10:00:00Z",
    period: "2026-04",
    details: { duplicateCount: 3 },
  }

  it("detectează duplicate REALE în P300 → false positive ANAF", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [],
      expenseDocuments: [],
      p300Items: [
        { invoiceNumber: "FACT-A", appearsCount: 2 },
        { invoiceNumber: "FACT-B", appearsCount: 3 },
        { invoiceNumber: "FACT-C", appearsCount: 1 },
      ],
    }
    const result = detectFalseConformance(notif, evidence)
    expect(result.isFalsePositive).toBe(true)
    expect(result.confidence).toBe("high")
    expect(result.recommendedResponse).toBe("etva_duplicate_invoice")
  })

  it("nu detectează nimic dacă P300 e curat", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [],
      expenseDocuments: [],
      p300Items: [{ invoiceNumber: "FACT-A", appearsCount: 1 }],
    }
    const result = detectFalseConformance(notif, evidence)
    expect(result.isFalsePositive).toBe(false)
  })
})

describe("detectFalseConformance — unjustified expenses", () => {
  const notif: AnafNotification = {
    id: "anaf-3",
    type: "conformance_unjustified_expenses",
    receivedAtISO: "2026-05-10T10:00:00Z",
    period: "2026-04",
    details: { invoiceNumbers: ["EXP-001", "EXP-002"] },
  }

  it("high confidence false positive când TOATE documentele sunt complete", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [],
      expenseDocuments: [
        { invoiceNumber: "EXP-001", category: "energy", hasInvoice: true, hasContract: true, hasPaymentProof: true },
        { invoiceNumber: "EXP-002", category: "energy", hasInvoice: true, hasContract: true, hasPaymentProof: true },
      ],
    }
    const result = detectFalseConformance(notif, evidence)
    expect(result.isFalsePositive).toBe(true)
    expect(result.confidence).toBe("high")
    expect(result.recommendedResponse).toBe("conformare_cheltuieli_nejustificate")
  })

  it("recomandă manual review când documente parțiale", () => {
    const evidence: OrgFiscalEvidence = {
      receivedInvoices: [],
      expenseDocuments: [
        { invoiceNumber: "EXP-001", category: "energy", hasInvoice: true, hasContract: true, hasPaymentProof: true },
        { invoiceNumber: "EXP-002", category: "energy", hasInvoice: true, hasContract: false, hasPaymentProof: true },
      ],
    }
    const result = detectFalseConformance(notif, evidence)
    expect(result.isFalsePositive).toBe(false)
    expect(result.recommendedResponse).toBe("investigate_manual")
  })
})
