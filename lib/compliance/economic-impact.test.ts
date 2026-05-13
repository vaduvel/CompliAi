// Unit tests pentru Economic Impact Layer (FC-5).

import { describe, expect, it } from "vitest"

import {
  aggregateEconomicImpact,
  annotateWithImpact,
  computeEconomicImpact,
  type FindingWithImpact,
} from "./economic-impact"
import type {
  CrossCorrelationFinding,
  CrossCorrelationRule,
  CrossCorrelationSeverity,
} from "./cross-correlation-engine"

function mkFinding(
  rule: CrossCorrelationRule,
  severity: CrossCorrelationSeverity,
  diff?: number,
  extras: Partial<CrossCorrelationFinding> = {},
): CrossCorrelationFinding {
  return {
    id: `f-${rule}-${Math.random().toString(36).slice(2, 6)}`,
    rule,
    ruleName: `${rule} rule`,
    severity,
    title: `${rule} test`,
    summary: "",
    detail: "",
    period: null,
    sources: [],
    diff: diff !== undefined
      ? { expected: 0, actual: diff, diff, diffPercent: 1, label: "RON" }
      : undefined,
    ...extras,
  }
}

describe("computeEconomicImpact — R1 (Σ facturi ↔ D300)", () => {
  it("OK finding → zero impact", () => {
    const imp = computeEconomicImpact(mkFinding("R1", "ok"))
    expect(imp.totalCostMinRON).toBe(0)
    expect(imp.totalCostMaxRON).toBe(0)
    expect(imp.computationNote).toContain("Concordant")
  })

  it("warning cu diff 1000 RON → penalitate fixă + manoperă 1.5h", () => {
    const imp = computeEconomicImpact(mkFinding("R1", "warning", 1000))
    expect(imp.affectedAmountRON).toBe(1000)
    expect(imp.penaltyMinRON).toBe(500)
    expect(imp.penaltyMaxRON).toBe(1500)
    expect(imp.remediationHours).toBe(1.5)
    expect(imp.totalCostMinRON).toBe(800) // 500 + 1.5*200
    expect(imp.totalCostMaxRON).toBe(1800) // 1500 + 1.5*200
  })

  it("error cu diff 5000 RON → penalitate + procent + 3h", () => {
    const imp = computeEconomicImpact(mkFinding("R1", "error", 5000))
    expect(imp.affectedAmountRON).toBe(5000)
    expect(imp.penaltyMinRON).toBe(500 + 5000 * 0.05) // 750
    expect(imp.penaltyMaxRON).toBe(1500 + 5000 * 0.15) // 2250
    expect(imp.remediationHours).toBe(3.0)
    expect(imp.legalReferences.some((r) => r.includes("Art. 219"))).toBe(true)
  })
})

describe("computeEconomicImpact — R2 (AGA ↔ D205)", () => {
  it("error cu diff 10000 RON dividende → impozit 8% + penalitate", () => {
    const imp = computeEconomicImpact(mkFinding("R2", "error", 10000))
    expect(imp.affectedAmountRON).toBe(10000)
    // taxDelta = 10000 * 0.08 = 800
    // penaltyMin = 500 + 800*0.05 + 800*0.1 = 500 + 40 + 80 = 620
    // penaltyMax = 1500 + 800*0.15 + 800*0.3 = 1500 + 120 + 240 = 1860
    expect(imp.penaltyMinRON).toBeCloseTo(620, 1)
    expect(imp.penaltyMaxRON).toBeCloseTo(1860, 1)
    expect(imp.remediationHours).toBe(4.0)
    expect(imp.legalReferences.some((r) => r.includes("Art. 97"))).toBe(true)
  })

  it("warning cu diff 2000 RON → impozit 160 + penalitate mai mică", () => {
    const imp = computeEconomicImpact(mkFinding("R2", "warning", 2000))
    expect(imp.affectedAmountRON).toBe(2000)
    expect(imp.remediationHours).toBe(2.0)
  })
})

describe("computeEconomicImpact — R3 (AGA ↔ ONRC)", () => {
  it("warning fără ONRC → cost ONRC fee + 1.5h", () => {
    const imp = computeEconomicImpact(mkFinding("R3", "warning"))
    expect(imp.affectedAmountRON).toBeNull() // procentual, nu RON direct
    expect(imp.penaltyMinRON).toBe(100) // ONRC fee
    expect(imp.penaltyMaxRON).toBe(600)
    expect(imp.remediationHours).toBe(1.5)
    expect(imp.totalCostMinRON).toBe(100 + 1.5 * 200) // 400
  })

  it("error mare diff pp → 3h cabinet", () => {
    const imp = computeEconomicImpact(mkFinding("R3", "error", 10))
    expect(imp.remediationHours).toBe(3.0)
    expect(imp.legalReferences.some((r) => r.includes("Legea 31/1990"))).toBe(true)
  })
})

describe("computeEconomicImpact — R5 (D205 ↔ Σ D100)", () => {
  it("error cu diff 5000 RON → dobânzi + rectificative multiple", () => {
    const imp = computeEconomicImpact(mkFinding("R5", "error", 5000))
    expect(imp.affectedAmountRON).toBe(5000)
    expect(imp.remediationHours).toBe(5.0)
    expect(imp.retransmissions).toBe(3)
    // dobânzi: 5000 * 0.0002 * 90 = 90 RON
    expect(imp.legalReferences.some((r) => r.includes("OG 92/2003"))).toBe(true)
  })

  it("warning cu diff 1000 → 1 rectificativă", () => {
    const imp = computeEconomicImpact(mkFinding("R5", "warning", 1000))
    expect(imp.retransmissions).toBe(1)
    expect(imp.remediationHours).toBe(2.5)
  })
})

describe("computeEconomicImpact — R6 (termen calendar ↔ depunere)", () => {
  it("warning 3 zile întârziere → penalitate fixă bază", () => {
    const imp = computeEconomicImpact(mkFinding("R6", "warning", 3))
    expect(imp.penaltyMinRON).toBe(500)
    expect(imp.penaltyMaxRON).toBe(1500)
    expect(imp.remediationHours).toBe(0.5)
  })

  it("error >30 zile întârziere → penalitate dublu+", () => {
    const imp = computeEconomicImpact(mkFinding("R6", "error", 45))
    expect(imp.penaltyMinRON).toBe(1500) // 3x base
    expect(imp.penaltyMaxRON).toBe(6000) // 4x agressive
    expect(imp.remediationHours).toBe(2.0)
  })
})

describe("computeEconomicImpact — R7 (frecvență)", () => {
  it("error mismatch frecvență → declarație 010 + rectificative multiple", () => {
    const imp = computeEconomicImpact(
      mkFinding("R7", "error", undefined, { title: "R7 — Mismatch frecvență..." }),
    )
    expect(imp.retransmissions).toBe(4)
    expect(imp.remediationHours).toBe(3.0)
    expect(imp.legalReferences.some((r) => r.includes("Art. 322"))).toBe(true)
  })

  it("error MIXTĂ → penalitate posibilă + 4 retransmiteri", () => {
    const imp = computeEconomicImpact(
      mkFinding("R7", "error", undefined, { title: "R7 — Frecvență MIXTĂ detectată" }),
    )
    expect(imp.penaltyMinRON).toBe(500)
    expect(imp.penaltyMaxRON).toBe(3000) // 1500*2
  })
})

describe("annotateWithImpact + aggregateEconomicImpact", () => {
  it("anotează toate findings cu economicImpact", () => {
    const findings = [
      mkFinding("R1", "warning", 1000),
      mkFinding("R2", "error", 5000),
      mkFinding("R5", "ok"),
    ]
    const annotated = annotateWithImpact(findings)
    expect(annotated).toHaveLength(3)
    expect(annotated[0]!.economicImpact.totalCostMinRON).toBeGreaterThan(0)
    expect(annotated[2]!.economicImpact.totalCostMinRON).toBe(0)
  })

  it("agregare cumulativă peste mai multe findings", () => {
    const annotated: FindingWithImpact[] = annotateWithImpact([
      mkFinding("R1", "warning", 1000), // ~800-1800
      mkFinding("R2", "error", 10000), // ~1420-2660 (cu manoperă)
      mkFinding("R6", "warning", 5), // ~600-1600
    ])
    const summary = aggregateEconomicImpact(annotated)
    expect(summary.impactfulFindingsCount).toBe(3)
    expect(summary.totalCostMinRON).toBeGreaterThan(2000)
    expect(summary.totalRetransmissions).toBe(2) // R1=1 + R2=1 + R6=0
  })

  it("findings ok nu contribuie la summary", () => {
    const annotated = annotateWithImpact([
      mkFinding("R1", "ok"),
      mkFinding("R2", "ok"),
    ])
    const summary = aggregateEconomicImpact(annotated)
    expect(summary.totalCostMinRON).toBe(0)
    expect(summary.impactfulFindingsCount).toBe(0)
  })
})
