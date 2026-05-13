// Unit tests pentru ERP filing confirmation matcher + reducer.

import { describe, expect, it } from "vitest"

import {
  applyBatchConfirmations,
  applyFilingConfirmation,
  inferEFacturaMonthlyConfirmation,
  matchFilingFromConfirmation,
  type FilingConfirmation,
} from "./erp-filing-confirmation"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const NOW = "2026-06-13T10:00:00.000Z"

function makeFiling(
  type: FilingRecord["type"],
  period: string,
  status: FilingRecord["status"],
  dueISO: string,
  id: string = `${type}-${period}`,
): FilingRecord {
  return { id, type, period, status, dueISO }
}

// ── matchFilingFromConfirmation ──────────────────────────────────────────────

describe("matchFilingFromConfirmation", () => {
  it("match exact pe (type, period) → on_time când filedAt ≤ due", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "2026-05",
        source: "smartbill",
        filedAtISO: "2026-06-20T10:00:00Z",
      },
      NOW,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.match.resultStatus).toBe("on_time")
    expect(result.match.wasOverdue).toBe(false)
    expect(result.match.daysVsDeadline).toBeLessThanOrEqual(0)
  })

  it("match exact + filed past due → late", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "2026-05",
        source: "manual",
        filedAtISO: "2026-07-01T10:00:00Z", // 6 zile peste termen
      },
      NOW,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.match.resultStatus).toBe("late")
    expect(result.match.daysVsDeadline).toBeGreaterThan(0)
  })

  it("missing filing flag wasOverdue=true", () => {
    const filings = [makeFiling("d300_tva", "2026-04", "missing", "2026-05-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "2026-04",
        source: "spv",
      },
      NOW,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.match.wasOverdue).toBe(true)
    expect(result.match.resultStatus).toBe("late") // depus post-deadline
  })

  it("no match când type/period nu există", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "saft",
        period: "2026-05",
        source: "saga",
      },
      NOW,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("no-matching-filing")
  })

  it("already-filed când status e on_time", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "on_time", "2026-06-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "2026-05",
        source: "smartbill",
      },
      NOW,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("already-filed")
  })

  it("invalid-period pentru format greșit", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")]
    const result = matchFilingFromConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "May 2026",
        source: "manual",
      },
      NOW,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("invalid-period")
  })
})

// ── applyFilingConfirmation ──────────────────────────────────────────────────

describe("applyFilingConfirmation", () => {
  it("returnează updatedFilings cu status flip + filedAtISO + note cu sursa", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")]
    const result = applyFilingConfirmation(
      filings,
      {
        filingType: "d300_tva",
        period: "2026-05",
        source: "smartbill",
        externalReference: "SB-12345",
      },
      NOW,
    )
    expect(result.applied).toBe(true)
    expect(result.updatedFilings[0]?.status).toBe("on_time")
    expect(result.updatedFilings[0]?.filedAtISO).toBe(NOW)
    expect(result.updatedFilings[0]?.note).toContain("SmartBill")
    expect(result.updatedFilings[0]?.note).toContain("SB-12345")
  })

  it("nu modifică alte filings", () => {
    const filings = [
      makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z"),
      makeFiling("saft", "2026-05", "upcoming", "2026-06-30T23:59:59Z"),
    ]
    const result = applyFilingConfirmation(
      filings,
      { filingType: "d300_tva", period: "2026-05", source: "smartbill" },
      NOW,
    )
    expect(result.updatedFilings[1]?.status).toBe("upcoming") // saft neatins
  })

  it("preservă nota existentă + adaugă confirmare", () => {
    const filing = makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z")
    filing.note = "[auto] D300 generată"
    const result = applyFilingConfirmation(
      [filing],
      { filingType: "d300_tva", period: "2026-05", source: "spv" },
      NOW,
    )
    expect(result.updatedFilings[0]?.note).toContain("[auto] D300 generată")
    expect(result.updatedFilings[0]?.note).toContain("ANAF SPV")
  })

  it("nu aplică dacă deja filed", () => {
    const filings = [makeFiling("d300_tva", "2026-05", "on_time", "2026-06-25T23:59:59Z")]
    const result = applyFilingConfirmation(
      filings,
      { filingType: "d300_tva", period: "2026-05", source: "smartbill" },
      NOW,
    )
    expect(result.applied).toBe(false)
    expect(result.reason).toBe("already-filed")
  })
})

// ── applyBatchConfirmations ──────────────────────────────────────────────────

describe("applyBatchConfirmations", () => {
  it("aplică multiple confirmări într-o trecere", () => {
    const filings = [
      makeFiling("d300_tva", "2026-04", "upcoming", "2026-05-25T23:59:59Z"),
      makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z"),
      makeFiling("saft", "2026-05", "upcoming", "2026-06-30T23:59:59Z"),
    ]
    const confirmations: FilingConfirmation[] = [
      { filingType: "d300_tva", period: "2026-04", source: "spv" },
      { filingType: "d300_tva", period: "2026-05", source: "spv" },
      { filingType: "saft", period: "2026-05", source: "saga" },
    ]
    const result = applyBatchConfirmations(filings, confirmations, NOW)
    expect(result.appliedCount).toBe(3)
    expect(result.skippedCount).toBe(0)
    expect(result.updatedFilings.every((f) => f.filedAtISO === NOW)).toBe(true)
  })

  it("count corect skipuri pentru no-match + already-filed", () => {
    const filings = [
      makeFiling("d300_tva", "2026-04", "on_time", "2026-05-25T23:59:59Z"),
      makeFiling("d300_tva", "2026-05", "upcoming", "2026-06-25T23:59:59Z"),
    ]
    const confirmations: FilingConfirmation[] = [
      { filingType: "d300_tva", period: "2026-04", source: "smartbill" }, // already-filed
      { filingType: "d300_tva", period: "2026-05", source: "smartbill" }, // ok
      { filingType: "saft", period: "2026-05", source: "saga" },          // no-match
    ]
    const result = applyBatchConfirmations(filings, confirmations, NOW)
    expect(result.appliedCount).toBe(1)
    expect(result.alreadyFiledCount).toBe(1)
    expect(result.noMatchCount).toBe(1)
  })
})

// ── inferEFacturaMonthlyConfirmation ─────────────────────────────────────────

describe("inferEFacturaMonthlyConfirmation", () => {
  it("returnează confirmation dacă TOATE facturile sunt valida", () => {
    const conf = inferEFacturaMonthlyConfirmation({
      period: "2026-05",
      invoices: [
        { efacturaStatus: "valida" },
        { efacturaStatus: "valida" },
        { efacturaStatus: "valida" },
      ],
      source: "smartbill",
    })
    expect(conf).not.toBeNull()
    expect(conf?.filingType).toBe("efactura_monthly")
    expect(conf?.period).toBe("2026-05")
    expect(conf?.externalReference).toContain("3 facturi")
  })

  it("returnează null dacă măcar o factură nu e valida", () => {
    const conf = inferEFacturaMonthlyConfirmation({
      period: "2026-05",
      invoices: [
        { efacturaStatus: "valida" },
        { efacturaStatus: "cu_eroare" },
      ],
      source: "smartbill",
    })
    expect(conf).toBeNull()
  })

  it("returnează null pentru perioadă invalidă", () => {
    const conf = inferEFacturaMonthlyConfirmation({
      period: "invalid",
      invoices: [{ efacturaStatus: "valida" }],
      source: "smartbill",
    })
    expect(conf).toBeNull()
  })

  it("returnează null pentru listă goală", () => {
    const conf = inferEFacturaMonthlyConfirmation({
      period: "2026-05",
      invoices: [],
      source: "smartbill",
    })
    expect(conf).toBeNull()
  })
})
