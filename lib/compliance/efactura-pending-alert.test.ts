import { describe, expect, it } from "vitest"

import {
  buildPendingInvoiceAlerts,
  summarizeAlerts,
  type PendingInvoiceForAlert,
} from "./efactura-pending-alert"

describe("buildPendingInvoiceAlerts", () => {
  it("ignoră facturile transmise", () => {
    const invoices: PendingInvoiceForAlert[] = [
      { invoiceNumber: "F1", issueDateISO: "2026-05-04", transmitted: true },
      { invoiceNumber: "F2", issueDateISO: "2026-05-04", transmitted: false },
    ]
    const alerts = buildPendingInvoiceAlerts(invoices, "2026-05-08T10:00:00.000Z")
    expect(alerts).toHaveLength(1)
    expect(alerts[0].invoiceNumber).toBe("F2")
  })

  it("ziua 3 lucrătoare → urgency high", () => {
    // Luni 2026-05-04 emisă, până miercuri 2026-05-06 (now) = 2 zile lucr trecute
    // până vineri 2026-05-08 = 4 zile lucr trecute
    // Test "ziua 3" — joi 2026-05-07 după luni 2026-05-04 = 3 zile lucr
    const invoices: PendingInvoiceForAlert[] = [
      { invoiceNumber: "F1", issueDateISO: "2026-05-04", transmitted: false },
    ]
    const alerts = buildPendingInvoiceAlerts(invoices, "2026-05-07T10:00:00.000Z")
    expect(alerts[0].urgency).toBe("high")
    expect(alerts[0].workingDaysSinceIssue).toBe(3)
  })

  it("ziua 5 lucrătoare → urgency critical (deadline expirat)", () => {
    // Luni 2026-05-04 + 5 zile lucr = Luni 2026-05-11 (now)
    const invoices: PendingInvoiceForAlert[] = [
      { invoiceNumber: "F1", issueDateISO: "2026-05-04", transmitted: false },
    ]
    const alerts = buildPendingInvoiceAlerts(invoices, "2026-05-11T10:00:00.000Z")
    expect(alerts[0].urgency).toBe("critical")
    expect(alerts[0].message).toContain("EXPIRAT")
  })

  it("sortare: critical primul, apoi după sumă desc", () => {
    const invoices: PendingInvoiceForAlert[] = [
      { invoiceNumber: "F-small-critical", issueDateISO: "2026-05-04", transmitted: false, totalAmount: 100 },
      { invoiceNumber: "F-big-info", issueDateISO: "2026-05-08", transmitted: false, totalAmount: 100000 },
      { invoiceNumber: "F-big-critical", issueDateISO: "2026-05-04", transmitted: false, totalAmount: 50000 },
    ]
    const alerts = buildPendingInvoiceAlerts(invoices, "2026-05-11T10:00:00.000Z")
    expect(alerts[0].invoiceNumber).toBe("F-big-critical")
    expect(alerts[1].invoiceNumber).toBe("F-small-critical")
    expect(alerts[2].invoiceNumber).toBe("F-big-info")
  })

  it("calculează corect deadlineISO (5 zile lucrătoare după issueDate)", () => {
    const invoices: PendingInvoiceForAlert[] = [
      { invoiceNumber: "F1", issueDateISO: "2026-05-04", transmitted: false },
    ]
    const alerts = buildPendingInvoiceAlerts(invoices, "2026-05-05T10:00:00.000Z")
    // Luni 2026-05-04 + 5 zile lucr: ma 5, mi 6, jo 7, vi 8, [sb/du], lu 11
    expect(alerts[0].deadlineISO).toBe("2026-05-11T00:00:00.000Z")
  })
})

describe("summarizeAlerts", () => {
  it("agregă count + sumă at-risk", () => {
    const alerts = [
      { urgency: "critical" as const, totalAmount: 1000 },
      { urgency: "critical" as const, totalAmount: 2000 },
      { urgency: "high" as const, totalAmount: 500 },
      { urgency: "info" as const },
    ].map((a) => ({
      invoiceNumber: "F",
      issueDateISO: "2026-05-04",
      workingDaysSinceIssue: 0,
      workingDaysRemaining: 0,
      deadlineISO: "2026-05-11",
      message: "",
      ...a,
    }))
    const sum = summarizeAlerts(alerts as Parameters<typeof summarizeAlerts>[0])
    expect(sum.critical).toBe(2)
    expect(sum.high).toBe(1)
    expect(sum.info).toBe(1)
    expect(sum.total).toBe(4)
    expect(sum.totalAmountAtRisk).toBe(3500)
  })
})
