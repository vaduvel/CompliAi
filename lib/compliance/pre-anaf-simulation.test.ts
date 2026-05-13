// Unit tests pentru Pre-ANAF Simulation (FC-6).

import { describe, expect, it } from "vitest"

import { runPreAnafSimulation } from "./pre-anaf-simulation"
import type { CrossCorrelationReport } from "./cross-correlation-engine"
import type { FindingWithImpact } from "./economic-impact"

function mkReport(findings: FindingWithImpact[]): CrossCorrelationReport {
  return {
    generatedAtISO: new Date().toISOString(),
    findings,
    summary: {
      totalChecks: findings.length,
      ok: 0,
      info: 0,
      warnings: 0,
      errors: 0,
      byRule: {
        R1: { ok: 0, warning: 0, error: 0, info: 0 },
        R2: { ok: 0, warning: 0, error: 0, info: 0 },
        R3: { ok: 0, warning: 0, error: 0, info: 0 },
        R5: { ok: 0, warning: 0, error: 0, info: 0 },
        R6: { ok: 0, warning: 0, error: 0, info: 0 },
        R7: { ok: 0, warning: 0, error: 0, info: 0 },
      },
    },
    inputs: {
      d300Count: 0,
      d205Count: 0,
      d100Count: 0,
      agaCount: 0,
      invoicesCount: 0,
      onrcCount: 0,
    },
  }
}

function mkFinding(
  rule: "R1" | "R2" | "R3" | "R5" | "R6" | "R7",
  severity: "ok" | "info" | "warning" | "error",
  costMin: number,
  costMax: number,
): FindingWithImpact {
  return {
    id: `f-${rule}-${Math.random().toString(36).slice(2, 6)}`,
    rule,
    ruleName: `${rule} rule`,
    severity,
    title: `${rule} ${severity} test`,
    summary: `Summary ${rule}`,
    detail: "Detail",
    period: "2026-04",
    sources: [{ type: "d300", id: "d1", label: "D300 2026-04" }],
    legalReference: "Cod Fiscal Art. 219",
    suggestion: "Rezolvă urgent.",
    economicImpact: {
      affectedAmountRON: 1000,
      penaltyMinRON: costMin * 0.5,
      penaltyMaxRON: costMax * 0.5,
      remediationHours: 2,
      retransmissions: 1,
      totalCostMinRON: costMin,
      totalCostMaxRON: costMax,
      legalReferences: ["Cod Fiscal Art. 219"],
      computationNote: "Note",
    },
  }
}

describe("runPreAnafSimulation", () => {
  it("returnează 0 risks pentru report fără findings cu impact", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R1", "ok", 0, 0),
        mkFinding("R2", "info", 0, 0),
      ]),
    })
    expect(result.topRisks).toHaveLength(0)
    expect(result.summary.totalRisks).toBe(0)
    expect(result.strategicRecommendation).toContain("Niciun risc")
  })

  it("filtrează ok/info, păstrează doar warning + error", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R1", "ok", 0, 0),
        mkFinding("R2", "warning", 500, 1500),
        mkFinding("R3", "error", 1000, 3000),
      ]),
    })
    expect(result.topRisks).toHaveLength(2)
    // error înaintea warning (ranking mai mare)
    expect(result.topRisks[0]?.title).toContain("R3")
  })

  it("topN limitează lista", () => {
    const findings = [
      mkFinding("R1", "error", 500, 1500),
      mkFinding("R2", "error", 600, 2000),
      mkFinding("R3", "error", 700, 2500),
      mkFinding("R5", "warning", 300, 900),
      mkFinding("R6", "warning", 400, 1100),
      mkFinding("R7", "error", 800, 3000),
    ]
    const result = runPreAnafSimulation(
      { crossCorrelationReport: mkReport(findings) },
      { topN: 3 },
    )
    expect(result.topRisks).toHaveLength(3)
    expect(result.summary.totalRisks).toBe(6)
  })

  it("error >5000 RON → imminent probability", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R5", "error", 8000, 15000),
      ]),
    })
    expect(result.topRisks[0]?.probability).toBe("imminent")
    expect(result.summary.breakdown.imminent).toBe(1)
    expect(result.strategicRecommendation).toContain("IMINENTE")
  })

  it("warning <2000 RON → medium probability", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R1", "warning", 500, 1500),
      ]),
    })
    expect(result.topRisks[0]?.probability).toBe("medium")
  })

  it("R2 missing CNP → owner ambii (cabinet + client)", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R2", "error", 1000, 3000),
      ]),
    })
    expect(result.topRisks[0]?.owner).toBe("ambii")
    expect(result.topRisks[0]?.missingDocs.length).toBeGreaterThan(0)
  })

  it("calculează corect summary aggregate", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R1", "error", 1000, 3000),
        mkFinding("R2", "warning", 500, 1500),
      ]),
    })
    expect(result.summary.totalExposureMinRON).toBe(1500)
    expect(result.summary.totalExposureMaxRON).toBe(4500)
    expect(result.summary.totalAvoidedIfResolvedRON).toBe(4500)
  })

  it("ordonează după ranking descrescător", () => {
    const result = runPreAnafSimulation({
      crossCorrelationReport: mkReport([
        mkFinding("R1", "warning", 100, 300), // low ranking
        mkFinding("R2", "error", 5000, 10000), // imminent
        mkFinding("R3", "error", 800, 2000), // high
      ]),
    })
    expect(result.topRisks[0]?.title).toContain("R2") // imminent first
    expect(result.topRisks[1]?.title).toContain("R3")
    expect(result.topRisks[2]?.title).toContain("R1")
  })
})
