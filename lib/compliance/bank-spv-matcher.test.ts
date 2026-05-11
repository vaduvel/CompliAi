import { describe, expect, it } from "vitest"
import { forecastCashflow, reconcile, scoreMatch, type InvoiceForMatch } from "./bank-spv-matcher"
import type { BankTransaction } from "./bank-statement-parser"

function txn(over: Partial<BankTransaction> = {}): BankTransaction {
  return {
    id: "t1",
    dateISO: "2026-05-10",
    amountRON: -1000,
    absoluteAmount: 1000,
    type: "debit",
    narrative: "Plata factura RO12345678",
    detectedCif: "12345678",
    ...over,
  }
}

function inv(over: Partial<InvoiceForMatch> = {}): InvoiceForMatch {
  return {
    id: "i1",
    invoiceNumber: "F100",
    partyCif: "12345678",
    totalRON: 1000,
    issueDateISO: "2026-05-08",
    direction: "received",
    ...over,
  }
}

describe("bank-spv-matcher — scoreMatch", () => {
  it("match perfect (CIF + sum + 2-day gap) → high confidence", () => {
    const s = scoreMatch(txn(), inv())
    expect(s.total).toBeGreaterThanOrEqual(60)
    expect(s.cifMatch).toBe(40)
    expect(s.amountMatch).toBe(30)
    expect(s.dateMatch).toBe(10) // 2 zile diff
  })

  it("zero score pentru direction incompatibilă (txn credit cu invoice received)", () => {
    const s = scoreMatch(txn({ type: "credit", amountRON: 1000 }), inv({ direction: "received" }))
    expect(s.total).toBe(0)
  })

  it("CIF prefix RO normalizat", () => {
    const s = scoreMatch(txn({ detectedCif: "RO12345678" }), inv({ partyCif: "12345678" }))
    expect(s.cifMatch).toBe(40)
  })

  it("sumă off by 5% → partial credit", () => {
    const s = scoreMatch(txn(), inv({ totalRON: 1040 }))
    expect(s.amountMatch).toBeGreaterThan(0)
    expect(s.amountMatch).toBeLessThan(30)
  })

  it("dată >14 zile diff → zero date score", () => {
    const s = scoreMatch(txn({ dateISO: "2026-04-01" }), inv({ issueDateISO: "2026-05-08" }))
    expect(s.dateMatch).toBe(0)
  })

  it("număr factură detected → bonus 10 puncte", () => {
    const s = scoreMatch(txn({ detectedInvoiceNumber: "F100" }), inv())
    expect(s.invoiceNumberMatch).toBe(10)
  })
})

describe("bank-spv-matcher — reconcile", () => {
  it("greedy match per pair high score", () => {
    const transactions = [txn({ id: "t1" }), txn({ id: "t2", amountRON: -500, absoluteAmount: 500, detectedCif: "87654321" })]
    const invoices = [inv({ id: "i1" }), inv({ id: "i2", totalRON: 500, partyCif: "87654321" })]
    const result = reconcile(transactions, invoices)
    expect(result.matches).toHaveLength(2)
    expect(result.unmatched).toBe(0)
  })

  it("nicio potrivire dacă scor < minScore", () => {
    const transactions = [txn({ detectedCif: "99999999" })]
    const invoices = [inv({ partyCif: "12345678", totalRON: 50000, issueDateISO: "2025-01-01" })]
    const result = reconcile(transactions, invoices)
    expect(result.matches).toHaveLength(0)
    expect(result.unmatched).toBe(1)
  })

  it("coveragePct calculat corect", () => {
    const transactions = [txn(), txn({ id: "t2", detectedCif: "11111111", amountRON: -200, absoluteAmount: 200 })]
    const invoices = [inv()]
    const result = reconcile(transactions, invoices)
    expect(result.totalTransactions).toBe(2)
    expect(result.matchedHigh + result.matchedMedium).toBe(1)
    expect(result.coveragePct).toBe(50)
  })
})

describe("bank-spv-matcher — forecastCashflow", () => {
  it("returnează zero pentru lista goală", () => {
    const f = forecastCashflow([])
    expect(f.avgMonthlyNet).toBe(0)
    expect(f.trend).toBe("stable")
  })

  it("calculează inflow/outflow lunar", () => {
    const transactions: BankTransaction[] = [
      txn({ dateISO: "2026-03-01", amountRON: -1000, absoluteAmount: 1000, type: "debit" }),
      txn({ dateISO: "2026-03-10", amountRON: 2000, absoluteAmount: 2000, type: "credit" }),
      txn({ dateISO: "2026-04-01", amountRON: -500, absoluteAmount: 500, type: "debit" }),
      txn({ dateISO: "2026-04-15", amountRON: 1500, absoluteAmount: 1500, type: "credit" }),
    ]
    const f = forecastCashflow(transactions)
    expect(f.historyMonths).toBe(2)
    expect(f.avgMonthlyInflow).toBe(1750)
    expect(f.avgMonthlyOutflow).toBe(750)
    expect(f.avgMonthlyNet).toBe(1000)
    expect(f.next30Days).toBe(1000)
    expect(f.next90Days).toBe(3000)
  })

  it("detectează tendință rising", () => {
    const transactions: BankTransaction[] = [
      txn({ dateISO: "2026-01-15", amountRON: 100, absoluteAmount: 100, type: "credit" }),
      txn({ dateISO: "2026-02-15", amountRON: 150, absoluteAmount: 150, type: "credit" }),
      txn({ dateISO: "2026-03-15", amountRON: 200, absoluteAmount: 200, type: "credit" }),
      txn({ dateISO: "2026-04-15", amountRON: 500, absoluteAmount: 500, type: "credit" }),
      txn({ dateISO: "2026-05-15", amountRON: 600, absoluteAmount: 600, type: "credit" }),
    ]
    const f = forecastCashflow(transactions)
    expect(f.trend).toBe("rising")
  })
})
