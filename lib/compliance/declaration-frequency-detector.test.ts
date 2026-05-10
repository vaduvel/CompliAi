import { describe, it, expect } from "vitest"

import {
  detectExpectedFrequency,
  detectFrequencyFromFilings,
  detectFrequencyMismatches,
} from "./declaration-frequency-detector"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

describe("detectExpectedFrequency", () => {
  it("forțează LUNAR pentru achiziții intracomunitare", () => {
    const r = detectExpectedFrequency({ annualRevenueRon: 100_000, hasIntraCommunityTransactions: true })
    expect(r.frequency).toBe("monthly")
    expect(r.confidence).toBe("high")
    expect(r.reason).toContain("intracomunitare")
  })

  it("returnează TRIMESTRIAL pentru primul an de activitate", () => {
    const r = detectExpectedFrequency({ isFirstYearOfActivity: true })
    expect(r.frequency).toBe("quarterly")
    expect(r.confidence).toBe("medium")
  })

  it("returnează LUNAR pentru CA ≥ 500.000 RON", () => {
    const r = detectExpectedFrequency({ annualRevenueRon: 600_000 })
    expect(r.frequency).toBe("monthly")
  })

  it("returnează TRIMESTRIAL pentru CA < 500.000 RON", () => {
    const r = detectExpectedFrequency({ annualRevenueRon: 200_000 })
    expect(r.frequency).toBe("quarterly")
  })

  it("returnează unknown dacă lipsește CA", () => {
    const r = detectExpectedFrequency({})
    expect(r.frequency).toBe("unknown")
  })
})

describe("detectFrequencyFromFilings", () => {
  it("detectează LUNAR din pattern-uri YYYY-MM", () => {
    const filings: FilingRecord[] = [
      { id: "1", type: "d300_tva", period: "2026-01", status: "on_time", dueISO: "2026-02-25" },
      { id: "2", type: "d300_tva", period: "2026-02", status: "on_time", dueISO: "2026-03-25" },
    ]
    expect(detectFrequencyFromFilings(filings, "d300_tva")).toBe("monthly")
  })

  it("detectează TRIMESTRIAL din pattern-uri YYYY-Qn", () => {
    const filings: FilingRecord[] = [
      { id: "1", type: "d300_tva", period: "2026-Q1", status: "on_time", dueISO: "2026-04-25" },
    ]
    expect(detectFrequencyFromFilings(filings, "d300_tva")).toBe("quarterly")
  })

  it("returnează unknown când nu există filings", () => {
    expect(detectFrequencyFromFilings([], "d300_tva")).toBe("unknown")
  })
})

describe("detectFrequencyMismatches", () => {
  it("detectează mismatch când CA mare dar depui trimestrial", () => {
    const filings: FilingRecord[] = [
      { id: "f1", type: "d300_tva", period: "2026-Q1", status: "on_time", dueISO: "2026-04-25" },
    ]
    const expected = detectExpectedFrequency({ annualRevenueRon: 800_000 }) // monthly
    const mismatches = detectFrequencyMismatches(filings, expected)
    expect(mismatches.length).toBe(1)
    expect(mismatches[0].severity).toBe("error")
    expect(mismatches[0].message).toContain("LUNAR")
  })

  it("nu raportează mismatch când frecvența e corectă", () => {
    const filings: FilingRecord[] = [
      { id: "f1", type: "d300_tva", period: "2026-Q1", status: "on_time", dueISO: "2026-04-25" },
    ]
    const expected = detectExpectedFrequency({ annualRevenueRon: 200_000 }) // quarterly
    const mismatches = detectFrequencyMismatches(filings, expected)
    expect(mismatches.length).toBe(0)
  })
})
