import { describe, it, expect } from "vitest"
import { runFiscalSensorRail } from "./agent-rail-fiscal-sensor"
import type { EFacturaInvoiceSignal } from "./efactura-risk"

const NOW = "2026-03-18T12:00:00.000Z"

function makeSignal(overrides: Partial<EFacturaInvoiceSignal> = {}): EFacturaInvoiceSignal {
  return {
    id: "sig-1",
    vendorName: "Vendor SRL",
    invoiceNumber: "INV-001",
    date: "2026-03-15",
    status: "rejected",
    amount: 5000,
    ...overrides,
  }
}

describe("runFiscalSensorRail", () => {
  it("returns empty for no signals", () => {
    const result = runFiscalSensorRail({ signals: [], resolvedFindingIds: [], orgId: "org-1", nowISO: NOW })
    expect(result.actions.length).toBe(0)
    expect(result.summary).toContain("Niciun semnal")
  })

  it("rescores high-urgency signals", () => {
    const signals = [
      makeSignal({ amount: 25000, status: "rejected" }),
    ]
    const result = runFiscalSensorRail({ signals, resolvedFindingIds: [], orgId: "org-1", nowISO: NOW })
    expect(result.rescored).toBeGreaterThanOrEqual(1)
  })

  it("reopens resolved findings for active signals", () => {
    const signals = [makeSignal({ id: "sig-1", status: "rejected" })]
    const result = runFiscalSensorRail({
      signals,
      resolvedFindingIds: ["efactura-risk-sig-1"],
      orgId: "org-1",
      nowISO: NOW,
    })
    expect(result.reopened).toBe(1)
  })

  it("creates work items for repeated rejections", () => {
    const signals = [
      makeSignal({ id: "s1" }),
      makeSignal({ id: "s2", invoiceNumber: "INV-002" }),
      makeSignal({ id: "s3", invoiceNumber: "INV-003" }),
    ]
    const result = runFiscalSensorRail({ signals, resolvedFindingIds: [], orgId: "org-1", nowISO: NOW })
    expect(result.workItems).toBeGreaterThanOrEqual(1)
  })

  it("generates partner alert for critical situations", () => {
    const signals = [
      makeSignal({ id: "s1" }),
      makeSignal({ id: "s2", invoiceNumber: "INV-002" }),
      makeSignal({ id: "s3", invoiceNumber: "INV-003" }),
    ]
    const result = runFiscalSensorRail({ signals, resolvedFindingIds: [], orgId: "org-1", nowISO: NOW })
    expect(result.partnerAlerts).toBeGreaterThanOrEqual(1)
  })

  it("detects pending too long invoices", () => {
    const signals = [
      makeSignal({ id: "s1", status: "processing-delayed", date: "2026-03-10" }),
    ]
    const result = runFiscalSensorRail({ signals, resolvedFindingIds: [], orgId: "org-1", nowISO: NOW })
    expect(result.workItems).toBeGreaterThanOrEqual(1)
  })
})
