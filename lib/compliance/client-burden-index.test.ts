// Unit tests pentru Client Burden Index (FC-8).

import { describe, expect, it } from "vitest"

import {
  buildPortfolioBurdenReport,
  computeClientBurden,
  type BurdenInput,
} from "./client-burden-index"
import type { FindingWithImpact } from "./economic-impact"
import type { FilingRecord } from "./filing-discipline"

function mkFinding(
  rule: "R1" | "R2" | "R3" | "R5" | "R6" | "R7",
  severity: "ok" | "info" | "warning" | "error",
  costMax: number,
): FindingWithImpact {
  return {
    id: `f-${rule}-${Math.random().toString(36).slice(2, 6)}`,
    rule,
    ruleName: `${rule} rule`,
    severity,
    title: `${rule} title`,
    summary: "Summary",
    detail: "Detail",
    period: "2026-04",
    sources: [],
    suggestion: "Rezolvă.",
    legalReference: "Cod Fiscal Art. 219",
    economicImpact: {
      affectedAmountRON: null,
      penaltyMinRON: costMax * 0.5,
      penaltyMaxRON: costMax,
      remediationHours: 2,
      retransmissions: 1,
      totalCostMinRON: costMax * 0.5,
      totalCostMaxRON: costMax,
      legalReferences: ["Cod Fiscal Art. 219"],
      computationNote: "",
    },
  }
}

function mkFiling(
  override: Partial<FilingRecord> & Pick<FilingRecord, "period" | "dueISO" | "status">,
): FilingRecord {
  return {
    id: `f-${override.period}-${Math.random().toString(36).slice(2, 6)}`,
    type: "d300_tva",
    ...override,
  }
}

function mkInput(over: Partial<BurdenInput>): BurdenInput {
  return {
    orgId: "org-test",
    orgName: "Firma Test SRL",
    filings: [],
    crossCorrelationFindings: [],
    ...over,
  }
}

describe("computeClientBurden", () => {
  it("burden 0 pentru client fără excepții și fără filings", () => {
    const r = computeClientBurden(mkInput({}))
    expect(r.totalExceptions).toBe(0)
    expect(r.cabinetHoursPerMonth).toBe(0)
    expect(r.burdenScore).toBeLessThan(20)
    expect(r.activeFiscalRiskRON).toBe(0)
  })

  it("filtrează findings cu severity ok/info", () => {
    const r = computeClientBurden(
      mkInput({
        crossCorrelationFindings: [
          mkFinding("R1", "ok", 0),
          mkFinding("R2", "info", 0),
          mkFinding("R3", "warning", 1500),
        ],
      }),
    )
    expect(r.totalExceptions).toBe(1)
  })

  it("calculează burden score 0-100", () => {
    const r = computeClientBurden(
      mkInput({
        crossCorrelationFindings: [
          mkFinding("R1", "error", 10000),
          mkFinding("R2", "warning", 5000),
          mkFinding("R3", "error", 8000),
        ],
      }),
    )
    expect(r.burdenScore).toBeGreaterThan(0)
    expect(r.burdenScore).toBeLessThanOrEqual(100)
  })

  it("detectează recurrent exceptions (mai multe pe aceeași regulă)", () => {
    const r = computeClientBurden(
      mkInput({
        crossCorrelationFindings: [
          mkFinding("R1", "warning", 1000),
          mkFinding("R1", "warning", 1000),
          mkFinding("R2", "warning", 1000),
        ],
      }),
    )
    expect(r.recurrentExceptions).toBe(1) // doar R1 e repetată
  })

  it("calculează active fiscal risk din sumă penalități max", () => {
    const r = computeClientBurden(
      mkInput({
        crossCorrelationFindings: [
          mkFinding("R1", "error", 5000),
          mkFinding("R2", "warning", 3000),
        ],
      }),
    )
    expect(r.activeFiscalRiskRON).toBe(8000)
  })

  it("calculează filing compliance rate", () => {
    const r = computeClientBurden(
      mkInput({
        filings: [
          mkFiling({ period: "2026-01", dueISO: "2026-02-25", status: "on_time" }),
          mkFiling({ period: "2026-02", dueISO: "2026-03-25", status: "on_time" }),
          mkFiling({ period: "2026-03", dueISO: "2026-04-25", status: "late" }),
          mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" }),
        ],
      }),
    )
    // 2 filed, 1 late (= closed but late), 1 missing
    // closed=3, onTime=2 => 67%
    expect(r.filingComplianceRate).toBeGreaterThanOrEqual(60)
    expect(r.problematicFilings).toBe(2)
  })

  it("calculează cost-to-fee ratio când fee e specificat", () => {
    const r = computeClientBurden(
      mkInput({
        monthlyFeeRON: 1000,
        crossCorrelationFindings: [mkFinding("R1", "error", 5000)],
      }),
    )
    expect(r.costToFeeRatio).not.toBeNull()
    expect(r.costToFeeRatio).toBeGreaterThan(0)
  })

  it("classification toxic pentru burden mare + cost > 50% fee", () => {
    const r = computeClientBurden(
      mkInput({
        monthlyFeeRON: 500, // fee mic
        crossCorrelationFindings: [
          mkFinding("R1", "error", 15000),
          mkFinding("R2", "error", 10000),
          mkFinding("R5", "error", 12000),
          mkFinding("R3", "warning", 8000),
        ],
        filings: [
          mkFiling({ period: "2026-03", dueISO: "2026-04-25", status: "missing" }),
          mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" }),
        ],
      }),
    )
    expect(r.classification).toBe("toxic")
    expect(r.recommendation).toContain("URGENT")
  })

  it("classification dormant pentru burden mic + fee mic", () => {
    const r = computeClientBurden(
      mkInput({
        monthlyFeeRON: 200,
        crossCorrelationFindings: [],
      }),
    )
    expect(r.classification).toBe("dormant")
  })

  it("classification profitable pentru burden mic + fee bun", () => {
    const r = computeClientBurden(
      mkInput({
        monthlyFeeRON: 5000,
        crossCorrelationFindings: [mkFinding("R1", "warning", 500)],
      }),
    )
    expect(r.classification).toBe("profitable")
  })

  it("response behavior detectează slow/non-responsive", () => {
    const slow = computeClientBurden(mkInput({ avgResponseHours: 100 }))
    expect(slow.responseBehavior).toBe("slow")
    const nr = computeClientBurden(mkInput({ avgResponseHours: 500 }))
    expect(nr.responseBehavior).toBe("non-responsive")
    const fast = computeClientBurden(mkInput({ avgResponseHours: 5 }))
    expect(fast.responseBehavior).toBe("fast")
  })
})

describe("buildPortfolioBurdenReport", () => {
  it("returnează raport gol pentru portofoliu gol", () => {
    const r = buildPortfolioBurdenReport([])
    expect(r.clients).toHaveLength(0)
    expect(r.summary.totalClients).toBe(0)
    expect(r.topRecommendation).toContain("sub control")
  })

  it("identifică top toxic", () => {
    const r = buildPortfolioBurdenReport([
      mkInput({
        orgId: "c1",
        orgName: "Toxic SRL",
        monthlyFeeRON: 400,
        crossCorrelationFindings: [
          mkFinding("R1", "error", 20000),
          mkFinding("R2", "error", 15000),
          mkFinding("R5", "error", 18000),
        ],
        filings: [
          mkFiling({ period: "2026-03", dueISO: "2026-04-25", status: "missing" }),
          mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" }),
        ],
      }),
      mkInput({
        orgId: "c2",
        orgName: "OK SRL",
        monthlyFeeRON: 3000,
        crossCorrelationFindings: [],
      }),
    ])
    expect(r.topToxic.length).toBeGreaterThanOrEqual(1)
    expect(r.topToxic[0]?.orgId).toBe("c1")
    expect(r.summary.byClassification.toxic).toBe(1)
  })

  it("sortează topBurden descrescător după burden score", () => {
    const r = buildPortfolioBurdenReport([
      mkInput({ orgId: "c1", orgName: "Low" }),
      mkInput({
        orgId: "c2",
        orgName: "High",
        crossCorrelationFindings: [
          mkFinding("R1", "error", 10000),
          mkFinding("R2", "error", 8000),
        ],
      }),
    ])
    expect(r.topBurden[0]?.orgId).toBe("c2")
  })

  it("calculează byClassification corect", () => {
    const r = buildPortfolioBurdenReport([
      mkInput({ orgId: "c1", monthlyFeeRON: 200 }), // dormant
      mkInput({
        orgId: "c2",
        monthlyFeeRON: 5000,
        crossCorrelationFindings: [mkFinding("R1", "warning", 500)],
      }), // profitable
      mkInput({ orgId: "c3" }), // normal (no fee, no exceptions)
    ])
    expect(r.summary.byClassification.dormant).toBeGreaterThanOrEqual(1)
    expect(r.summary.byClassification.profitable).toBeGreaterThanOrEqual(1)
  })

  it("recomandare strategică pentru ≥3 toxici", () => {
    const r = buildPortfolioBurdenReport([
      mkInput({
        orgId: "c1",
        monthlyFeeRON: 300,
        crossCorrelationFindings: [
          mkFinding("R1", "error", 15000),
          mkFinding("R2", "error", 12000),
        ],
        filings: [mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" })],
      }),
      mkInput({
        orgId: "c2",
        monthlyFeeRON: 400,
        crossCorrelationFindings: [
          mkFinding("R1", "error", 18000),
          mkFinding("R5", "error", 14000),
        ],
        filings: [mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" })],
      }),
      mkInput({
        orgId: "c3",
        monthlyFeeRON: 350,
        crossCorrelationFindings: [
          mkFinding("R2", "error", 16000),
          mkFinding("R3", "error", 13000),
        ],
        filings: [mkFiling({ period: "2026-04", dueISO: "2026-05-25", status: "missing" })],
      }),
    ])
    expect(r.summary.byClassification.toxic).toBeGreaterThanOrEqual(3)
    expect(r.topRecommendation).toContain("TOXICI")
  })

  it("calculează totals corect", () => {
    const r = buildPortfolioBurdenReport([
      mkInput({
        orgId: "c1",
        crossCorrelationFindings: [mkFinding("R1", "error", 5000)],
      }),
      mkInput({
        orgId: "c2",
        crossCorrelationFindings: [mkFinding("R2", "error", 3000)],
      }),
    ])
    expect(r.summary.totalActiveRiskRON).toBe(8000)
    expect(r.summary.totalCabinetHoursPerMonth).toBeGreaterThan(0)
  })
})
