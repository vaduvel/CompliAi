import { describe, it, expect } from "vitest"
import { computeSAFTHygiene, buildSAFTHygieneFindings, checkCrossFilingConsistency } from "./saft-hygiene"
import type { FilingRecord } from "./filing-discipline"

const NOW = "2026-03-18T12:00:00.000Z"

function makeSAFT(overrides: Partial<FilingRecord> = {}): FilingRecord {
  return {
    id: "s1",
    type: "saft",
    period: "2026-02",
    status: "on_time",
    dueISO: "2026-03-25T00:00:00.000Z",
    ...overrides,
  }
}

describe("computeSAFTHygiene", () => {
  it("filters to SAF-T only", () => {
    const filings: FilingRecord[] = [
      makeSAFT(),
      { id: "d1", type: "d300_tva", period: "2026-02", status: "missing", dueISO: "2026-03-25T00:00:00.000Z" },
    ]
    const result = computeSAFTHygiene(filings, NOW)
    expect(result.totalFilings).toBe(1)
    expect(result.hygieneScore).toBe(100)
  })

  it("detects poor hygiene with missing SAF-T", () => {
    const filings = [
      makeSAFT({ status: "missing" }),
      makeSAFT({ id: "s2", period: "2026-01", status: "missing" }),
    ]
    const result = computeSAFTHygiene(filings, NOW)
    expect(result.hygieneScore).toBe(0)
    expect(result.missing).toBe(2)
  })

  it("detects multiple rectifications", () => {
    const filings = [
      makeSAFT({ status: "rectified", rectificationCount: 3 }),
      makeSAFT({ id: "s2", period: "2026-01", status: "rectified", rectificationCount: 2 }),
    ]
    const result = computeSAFTHygiene(filings, NOW)
    expect(result.multipleRectifications).toBe(2)
    expect(result.consistencyIssues.length).toBeGreaterThan(0)
  })

  it("detects period gaps", () => {
    const filings = [
      makeSAFT({ period: "2026-01" }),
      makeSAFT({ id: "s2", period: "2026-04" }),
    ]
    const result = computeSAFTHygiene(filings, NOW)
    const gaps = result.consistencyIssues.filter((i) => i.type === "gap")
    expect(gaps.length).toBe(1)
  })

  it("returns indicators", () => {
    const filings = [makeSAFT()]
    const result = computeSAFTHygiene(filings, NOW)
    expect(result.indicators.length).toBeGreaterThanOrEqual(3)
  })
})

describe("buildSAFTHygieneFindings", () => {
  it("generates finding for poor hygiene", () => {
    const hygiene = computeSAFTHygiene(
      [makeSAFT({ status: "missing" }), makeSAFT({ id: "s2", period: "2026-01", status: "missing" })],
      NOW,
    )
    const findings = buildSAFTHygieneFindings(hygiene, NOW)
    expect(findings.some((f) => f.id === "saft-hygiene-poor")).toBe(true)
  })

  it("no findings for good hygiene", () => {
    const hygiene = computeSAFTHygiene([makeSAFT()], NOW)
    const findings = buildSAFTHygieneFindings(hygiene, NOW)
    expect(findings.length).toBe(0)
  })
})

describe("checkCrossFilingConsistency", () => {
  it("detects SAF-T without D300", () => {
    const filings: FilingRecord[] = [
      makeSAFT({ period: "2026-02" }),
    ]
    const issues = checkCrossFilingConsistency(filings)
    expect(issues.some((i) => i.type === "cross_filing_mismatch")).toBe(true)
  })

  it("no issues when both exist", () => {
    const filings: FilingRecord[] = [
      makeSAFT({ period: "2026-02" }),
      { id: "d1", type: "d300_tva", period: "2026-02", status: "on_time", dueISO: "2026-03-25T00:00:00.000Z" },
    ]
    const issues = checkCrossFilingConsistency(filings)
    expect(issues.length).toBe(0)
  })
})
