import { describe, it, expect } from "vitest"

import {
  buildD300P300Finding,
  compareD300P300,
  parseDeclarationInput,
} from "./d300-p300-comparator"

const NOW = "2026-05-09T10:00:00.000Z"

const D300_BASE = {
  period: "2026-04",
  taxableBase: 100_000,
  vatCollected: 19_000,
  vatDeducted: 5_000,
  vatToPay: 14_000,
}

describe("compareD300P300 — zero diff", () => {
  it("returns no triggers when D300 == P300", () => {
    const result = compareD300P300(D300_BASE, D300_BASE, NOW)
    expect(result.triggersAnafNotification).toBe(false)
    expect(result.fieldDiffs.every((f) => !f.exceedsThreshold)).toBe(true)
    expect(result.recommendedAction).toBe("ok")
    expect(result.countdownDeadlineISO).toBeNull()
  })
})

describe("compareD300P300 — sub threshold (5K but <20%)", () => {
  it("does NOT trigger if amount ≥5K but percent ≤20%", () => {
    // declared 100K, precomputed 95K → diff 5K, 5% — under threshold
    const p300 = { ...D300_BASE, taxableBase: 95_000 }
    const result = compareD300P300(D300_BASE, p300, NOW)
    expect(result.triggersAnafNotification).toBe(false)
    expect(result.recommendedAction).toBe("review")
  })
})

describe("compareD300P300 — sub threshold (>20% but <5K)", () => {
  it("does NOT trigger if percent >20% but absolute <5K", () => {
    // declared 1000, precomputed 4500 → diff 3500, 77% — sub 5K
    const d300 = {
      period: "2026-04",
      taxableBase: 1_000,
      vatCollected: 190,
      vatDeducted: 50,
      vatToPay: 140,
    }
    const p300 = { ...d300, taxableBase: 4_500 }
    const result = compareD300P300(d300, p300, NOW)
    expect(result.triggersAnafNotification).toBe(false)
  })
})

describe("compareD300P300 — exact threshold", () => {
  it("triggers when ≥5K AND >20%", () => {
    // declared 100K, precomputed 75K → diff 25K, 25% — over threshold
    const p300 = { ...D300_BASE, taxableBase: 75_000 }
    const result = compareD300P300(D300_BASE, p300, NOW)
    expect(result.triggersAnafNotification).toBe(true)
    expect(result.recommendedAction).toBe("rectify")
    expect(result.countdownDeadlineISO).not.toBeNull()
    expect(result.worstField).toBe("taxableBase")
  })

  it("countdown deadline is +20 zile from nowISO", () => {
    const p300 = { ...D300_BASE, taxableBase: 75_000 }
    const result = compareD300P300(D300_BASE, p300, NOW)
    const deadlineDate = new Date(result.countdownDeadlineISO!)
    const nowDate = new Date(NOW)
    const diffDays = Math.round(
      (deadlineDate.getTime() - nowDate.getTime()) / 86_400_000,
    )
    expect(diffDays).toBe(20)
  })
})

describe("compareD300P300 — multiple fields over threshold", () => {
  it("identifies worst field by absolute delta", () => {
    const p300 = {
      period: "2026-04",
      taxableBase: 50_000,    // diff 50K
      vatCollected: 10_000,   // diff 9K
      vatDeducted: 5_000,     // same
      vatToPay: 5_000,        // diff 9K
    }
    const result = compareD300P300(D300_BASE, p300, NOW)
    expect(result.triggersAnafNotification).toBe(true)
    expect(result.worstField).toBe("taxableBase")
    expect(result.worstDeltaAbs).toBe(50_000)
  })
})

describe("compareD300P300 — period mismatch", () => {
  it("throws if periods differ", () => {
    const p300 = { ...D300_BASE, period: "2026-03" }
    expect(() => compareD300P300(D300_BASE, p300, NOW)).toThrow(/Periode diferite/)
  })
})

describe("buildD300P300Finding", () => {
  it("returns null if no notification trigger", () => {
    const result = compareD300P300(D300_BASE, D300_BASE, NOW)
    expect(buildD300P300Finding(result, NOW)).toBeNull()
  })

  it("creates finding when triggers", () => {
    const p300 = { ...D300_BASE, taxableBase: 75_000 }
    const result = compareD300P300(D300_BASE, p300, NOW)
    const finding = buildD300P300Finding(result, NOW)
    expect(finding).not.toBeNull()
    expect(finding!.id).toContain("etva-p300-prevent-2026-04")
    expect(finding!.severity).toBe("high")
    expect(finding!.title).toContain("D300 vs P300")
    expect(finding!.detail).toContain("Bază impozabilă")
  })
})

describe("parseDeclarationInput", () => {
  it("parses JSON input", () => {
    const raw = JSON.stringify(D300_BASE)
    expect(parseDeclarationInput(raw)).toEqual(D300_BASE)
  })

  it("parses key=value input (RO labels)", () => {
    const raw = `
      perioada: 2026-04
      bazaImpozabila: 100000
      tvaColectat: 19000
      tvaDedus: 5000
      tvaDePlata: 14000
    `
    const parsed = parseDeclarationInput(raw)
    expect(parsed).toEqual(D300_BASE)
  })

  it("returns null for empty/invalid", () => {
    expect(parseDeclarationInput("")).toBeNull()
    expect(parseDeclarationInput("nothing here")).toBeNull()
  })
})
