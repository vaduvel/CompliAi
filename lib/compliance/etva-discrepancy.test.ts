import { describe, it, expect } from "vitest"
import {
  classifyDiscrepancySeverity,
  computeCountdown,
  applyDiscrepancyTransition,
  detectOverdueDiscrepancies,
  buildDiscrepancyFinding,
  draftExplanation,
  computeDefaultDeadline,
  type ETVADiscrepancy,
} from "./etva-discrepancy"

const NOW = "2026-03-18T12:00:00.000Z"

function makeDisc(overrides: Partial<ETVADiscrepancy> = {}): ETVADiscrepancy {
  return {
    id: "d1",
    type: "sum_mismatch",
    severity: "medium",
    status: "detected",
    period: "2026-Q1",
    description: "Test discrepancy",
    detectedAtISO: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("classifyDiscrepancySeverity", () => {
  it("conformity_notice is always critical", () => {
    expect(classifyDiscrepancySeverity("conformity_notice")).toBe("critical")
  })
  it("large amounts are critical", () => {
    expect(classifyDiscrepancySeverity("sum_mismatch", 15000)).toBe("critical")
  })
  it("medium amounts are high", () => {
    expect(classifyDiscrepancySeverity("sum_mismatch", 5000)).toBe("high")
  })
  it("missing_invoice defaults to high", () => {
    expect(classifyDiscrepancySeverity("missing_invoice")).toBe("high")
  })
  it("small sum_mismatch is medium", () => {
    expect(classifyDiscrepancySeverity("sum_mismatch", 500)).toBe("medium")
  })
})

describe("computeCountdown", () => {
  it("no deadline returns null", () => {
    const disc = makeDisc()
    const result = computeCountdown(disc, NOW)
    expect(result.daysRemaining).toBeNull()
    expect(result.urgencyLabel).toBe("fără termen")
  })
  it("overdue deadline", () => {
    const disc = makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })
    const result = computeCountdown(disc, NOW)
    expect(result.isOverdue).toBe(true)
    expect(result.urgencyLabel).toBe("expirat")
  })
  it("urgent (<=5 days)", () => {
    const disc = makeDisc({ deadlineISO: "2026-03-21T00:00:00.000Z" })
    const result = computeCountdown(disc, NOW)
    expect(result.isOverdue).toBe(false)
    expect(result.urgencyLabel).toBe("urgent")
  })
  it("ok (>14 days)", () => {
    const disc = makeDisc({ deadlineISO: "2026-04-15T00:00:00.000Z" })
    const result = computeCountdown(disc, NOW)
    expect(result.urgencyLabel).toBe("ok")
  })
})

describe("applyDiscrepancyTransition", () => {
  it("acknowledge sets status", () => {
    const disc = makeDisc()
    const updated = applyDiscrepancyTransition(disc, { action: "acknowledge" })
    expect(updated.status).toBe("acknowledged")
  })
  it("draft_explanation stores text", () => {
    const disc = makeDisc({ status: "acknowledged" })
    const updated = applyDiscrepancyTransition(disc, {
      action: "draft_explanation",
      explanation: "Test explanation",
    })
    expect(updated.status).toBe("explanation_drafted")
    expect(updated.explanation).toBe("Test explanation")
  })
  it("mark_resolved sets revalidation", () => {
    const disc = makeDisc({ status: "response_sent" })
    const updated = applyDiscrepancyTransition(disc, {
      action: "mark_resolved",
      resolvedAtISO: NOW,
    })
    expect(updated.status).toBe("resolved")
    expect(updated.revalidationDueISO).toBeDefined()
  })
})

describe("detectOverdueDiscrepancies", () => {
  it("marks overdue when past deadline", () => {
    const discs = [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })]
    const result = detectOverdueDiscrepancies(discs, NOW)
    expect(result[0].status).toBe("overdue")
  })
  it("skips resolved", () => {
    const discs = [makeDisc({ status: "resolved", deadlineISO: "2026-03-10T00:00:00.000Z" })]
    const result = detectOverdueDiscrepancies(discs, NOW)
    expect(result[0].status).toBe("resolved")
  })
})

describe("buildDiscrepancyFinding", () => {
  it("produces valid ScanFinding", () => {
    const disc = makeDisc({ amountDifference: 5000 })
    const finding = buildDiscrepancyFinding(disc, NOW)
    expect(finding.id).toBe("etva-disc-d1")
    expect(finding.category).toBe("E_FACTURA")
    expect(finding.resolution).toBeDefined()
  })
})

describe("draftExplanation", () => {
  it("generates explanation text", () => {
    const disc = makeDisc({ amountDifference: 3000 })
    const text = draftExplanation(disc, "Test SRL")
    expect(text).toContain("ANAF")
    expect(text).toContain("Test SRL")
    expect(text).toContain("2026-Q1")
  })
})

describe("computeDefaultDeadline", () => {
  it("adds 30 days", () => {
    const deadline = computeDefaultDeadline("2026-03-01T00:00:00.000Z")
    expect(new Date(deadline).getDate()).toBe(31)
  })
})
