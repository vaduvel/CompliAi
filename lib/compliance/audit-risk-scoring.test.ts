import { describe, expect, it } from "vitest"

import { computeAuditRiskScore } from "./audit-risk-scoring"
import type { ETVADiscrepancy } from "./etva-discrepancy"
import type { FilingRecord } from "./filing-discipline"
import type { ComplianceAlert, ScanFinding } from "./types"

const NOW = "2026-05-11T10:00:00.000Z"

function baseState() {
  return {
    findings: [] as ScanFinding[],
    efacturaSignalsCount: 0,
    efacturaConnected: true,
    efacturaSyncedAtISO: NOW,
    efacturaValidations: [],
    alerts: [] as ComplianceAlert[],
  }
}

describe("computeAuditRiskScore", () => {
  it("clean state → low risc cu summary explicit", () => {
    const r = computeAuditRiskScore({
      state: baseState(),
      nowISO: NOW,
    })
    expect(r.score).toBeLessThan(26)
    expect(r.category).toBe("low")
    expect(r.factors.length).toBe(6)
    expect(r.summary).toContain("scăzut")
    expect(r.ceccarDisclaimer).toContain("CECCAR")
  })

  it("filing discipline scor scăzut → contribuție mare la risc", () => {
    const filings: FilingRecord[] = [
      { id: "f1", type: "d300_tva", period: "2026-01", status: "missing", dueISO: "2026-02-25T00:00:00.000Z" },
      { id: "f2", type: "d300_tva", period: "2026-02", status: "missing", dueISO: "2026-03-25T00:00:00.000Z" },
      { id: "f3", type: "saft", period: "2026-01", status: "late", dueISO: "2026-02-25T00:00:00.000Z", filedAtISO: "2026-03-10T00:00:00.000Z" },
    ]
    const r = computeAuditRiskScore({
      state: baseState(),
      filingRecords: filings,
      nowISO: NOW,
    })
    const filing = r.factors.find((f) => f.id === "filing-discipline")
    expect(filing?.contribution).toBeGreaterThan(10)
    expect(filing?.recommendation).toContain("declarațiile lipsă")
    expect(r.score).toBeGreaterThan(25)
  })

  it("e-TVA discrepanță overdue → top contributor + recomandare urgentă", () => {
    const discrepancies: ETVADiscrepancy[] = [
      {
        id: "d1",
        type: "sum_mismatch",
        period: "2026-Q1",
        status: "overdue",
        severity: "critical",
        detectedAtISO: "2026-02-01T00:00:00.000Z",
        deadlineISO: "2026-03-01T00:00:00.000Z", // overdue față de NOW=2026-05-11
        amountDifference: 10000,
        description: "Diferență 10K RON între D300 și e-TVA precompletată.",
      },
    ]
    const r = computeAuditRiskScore({
      state: baseState(),
      etvaDiscrepancies: discrepancies,
      nowISO: NOW,
    })
    const etva = r.factors.find((f) => f.id === "etva-discrepancies")
    expect(etva?.contribution).toBeGreaterThan(0)
    expect(etva?.recommendation).toContain("URGENT")
    expect(r.topContributors[0].id).toBe("etva-discrepancies")
  })

  it("findings critice → contribute la scor + recomandare owners", () => {
    const findings: ScanFinding[] = [
      {
        id: "f1",
        title: "GDPR Art. 30",
        detail: "Registru lipsă",
        category: "process",
        severity: "critical",
        risk: "high",
        principles: [],
        createdAtISO: NOW,
        sourceDocument: "doc1",
      } as unknown as ScanFinding,
      {
        id: "f2",
        title: "e-Factura V002",
        detail: "CustomizationID lipsă",
        category: "process",
        severity: "high",
        risk: "high",
        principles: [],
        createdAtISO: NOW,
        sourceDocument: "doc2",
      } as unknown as ScanFinding,
    ]
    const r = computeAuditRiskScore({
      state: { ...baseState(), findings },
      nowISO: NOW,
    })
    const findFactor = r.factors.find((f) => f.id === "scan-findings")
    expect(findFactor?.contribution).toBeGreaterThan(0)
    expect(findFactor?.recommendation).toContain("owners")
  })

  it("e-Factura deconectat + sync gap mare → contribuție vizibilă", () => {
    const r = computeAuditRiskScore({
      state: {
        ...baseState(),
        efacturaConnected: false,
        efacturaSyncedAtISO: "2026-01-01T00:00:00.000Z", // > 100 zile față de NOW
        efacturaSignalsCount: 5,
      },
      nowISO: NOW,
    })
    const eflag = r.factors.find((f) => f.id === "efactura-compliance")
    expect(eflag?.contribution).toBeGreaterThan(8)
    expect(eflag?.reason).toContain("neconectată")
    expect(eflag?.recommendation).toContain("OUG 13/2026")
  })

  it("scenariu cumulat critic → category critic + topContributors prezenți", () => {
    const filings: FilingRecord[] = [
      { id: "f1", type: "d300_tva", period: "2026-01", status: "missing", dueISO: "2026-02-25T00:00:00.000Z" },
      { id: "f2", type: "d394_local", period: "2026-01", status: "missing", dueISO: "2026-02-30T00:00:00.000Z" },
      { id: "f3", type: "saft", period: "2026-01", status: "missing", dueISO: "2026-02-25T00:00:00.000Z" },
      { id: "f4", type: "saft", period: "2026-02", status: "late", dueISO: "2026-03-25T00:00:00.000Z", filedAtISO: "2026-04-15T00:00:00.000Z", rectificationCount: 2 },
    ]
    const discrepancies: ETVADiscrepancy[] = [
      {
        id: "d1",
        type: "sum_mismatch",
        period: "2026-Q1",
        status: "overdue",
        severity: "critical",
        detectedAtISO: NOW,
        deadlineISO: "2026-03-01T00:00:00.000Z",
        amountDifference: 50000,
        description: "Diferență mare",
      },
      {
        id: "d2",
        type: "vat_rate_error",
        period: "2026-Q1",
        status: "detected",
        severity: "high",
        detectedAtISO: NOW,
        deadlineISO: "2026-06-01T00:00:00.000Z",
        amountDifference: 8000,
        description: "Diferență TVA",
      },
    ]
    const r = computeAuditRiskScore({
      state: {
        ...baseState(),
        efacturaConnected: false,
        efacturaSignalsCount: 10,
        alerts: [
          { id: "a1", message: "Alert critic", severity: "critical", open: true, createdAtISO: NOW },
          { id: "a2", message: "Alert high", severity: "high", open: true, createdAtISO: NOW },
          { id: "a3", message: "Alert high 2", severity: "high", open: true, createdAtISO: NOW },
        ],
      },
      filingRecords: filings,
      etvaDiscrepancies: discrepancies,
      nowISO: NOW,
    })
    expect(r.score).toBeGreaterThanOrEqual(51)
    expect(["high", "critical"]).toContain(r.category)
    expect(r.topContributors.length).toBeGreaterThanOrEqual(3)
  })
})
