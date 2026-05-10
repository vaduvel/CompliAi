import { describe, it, expect } from "vitest"

import {
  ALL_CATEGORIES,
  ALL_VIOLATIONS,
  estimateAggregate,
  estimateSingleViolation,
} from "./efactura-fines-calculator"

describe("estimateSingleViolation", () => {
  it("calculează corect pentru contribuabil mic — 5 facturi netransmise", () => {
    const est = estimateSingleViolation("efactura_nedepusa", 5, "mic")
    expect(est.minPerOccurrence).toBe(500)
    expect(est.maxPerOccurrence).toBe(1_000)
    expect(est.totalMinRON).toBe(2_500)
    expect(est.totalMaxRON).toBe(5_000)
    expect(est.legalReference).toContain("OUG 120/2021")
  })

  it("scalează cu count pentru contribuabil mare — 10 D406 nedepuse", () => {
    const est = estimateSingleViolation("saft_d406_nedepusa", 10, "mare")
    expect(est.minPerOccurrence).toBe(5_000)
    expect(est.maxPerOccurrence).toBe(10_000)
    expect(est.totalMinRON).toBe(50_000)
    expect(est.totalMaxRON).toBe(100_000)
    expect(est.legalReference).toContain("Art. 336")
  })

  it("trunchiază count negativ la 0", () => {
    const est = estimateSingleViolation("efactura_nedepusa", -5, "mic")
    expect(est.totalMinRON).toBe(0)
    expect(est.totalMaxRON).toBe(0)
  })

  it("trunchiază float la integer (Math.floor)", () => {
    const est = estimateSingleViolation("efactura_nedepusa", 3.7, "mic")
    expect(est.count).toBe(3)
    expect(est.totalMinRON).toBe(1_500)
  })

  it("folosește praguri ETVA dedicate pentru notificări neResponded", () => {
    const est = estimateSingleViolation("etva_neresponded", 1, "mare")
    expect(est.minPerOccurrence).toBe(10_000)
    expect(est.maxPerOccurrence).toBe(30_000)
  })
})

describe("estimateAggregate", () => {
  it("agregă multiple violations pentru aceeași categorie", () => {
    const agg = estimateAggregate(
      [
        { type: "efactura_nedepusa", count: 5 },
        { type: "saft_d406_nedepusa", count: 1 },
      ],
      "mic",
    )
    expect(agg.estimates).toHaveLength(2)
    // 5 efactura mic = 5 * 500 .. 1000 = 2500..5000
    // 1 D406 mic = 1 * 1000 .. 5000 = 1000..5000
    expect(agg.grandTotalMinRON).toBe(2_500 + 1_000)
    expect(agg.grandTotalMaxRON).toBe(5_000 + 5_000)
  })

  it("ignoră violations cu count 0", () => {
    const agg = estimateAggregate(
      [
        { type: "efactura_nedepusa", count: 5 },
        { type: "saft_d406_nedepusa", count: 0 },
        { type: "etva_neresponded", count: 0 },
      ],
      "mediu",
    )
    expect(agg.estimates).toHaveLength(1)
    expect(agg.grandTotalMinRON).toBe(5 * 2_500)
  })

  it("convertește grand total max la EUR (curs aprox 5 RON/EUR)", () => {
    const agg = estimateAggregate(
      [{ type: "etva_neresponded", count: 1 }],
      "mare",
    )
    // 30K RON / 5 = 6.000 EUR
    expect(agg.worstCaseEUR).toBe(6_000)
  })
})

describe("ALL_VIOLATIONS / ALL_CATEGORIES", () => {
  it("expune toate enum-urile pentru UI", () => {
    expect(ALL_VIOLATIONS.length).toBeGreaterThanOrEqual(8)
    expect(ALL_CATEGORIES.length).toBe(4)
  })

  it("fiecare violation poate fi calculată pentru fiecare categorie", () => {
    for (const v of ALL_VIOLATIONS) {
      for (const c of ALL_CATEGORIES) {
        const est = estimateSingleViolation(v.type, 1, c.category)
        expect(est.totalMinRON).toBeGreaterThanOrEqual(0)
        expect(est.totalMaxRON).toBeGreaterThan(0)
      }
    }
  })
})
