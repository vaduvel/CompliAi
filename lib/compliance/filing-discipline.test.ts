import { describe, it, expect } from "vitest"
import {
  computeFilingDisciplineScore,
  buildOverdueFilingFindings,
  generateFilingReminders,
  checkFilingConsistency,
  type FilingRecord,
} from "./filing-discipline"

const NOW = "2026-03-18T12:00:00.000Z"

function makeRecord(overrides: Partial<FilingRecord> = {}): FilingRecord {
  return {
    id: "f1",
    type: "d300_tva",
    period: "2026-02",
    status: "on_time",
    dueISO: "2026-03-25T00:00:00.000Z",
    ...overrides,
  }
}

describe("computeFilingDisciplineScore", () => {
  it("empty records returns 100", () => {
    const result = computeFilingDisciplineScore([])
    expect(result.score).toBe(100)
    expect(result.label).toBe("excelent")
  })
  it("all on_time = 100", () => {
    const records = [makeRecord(), makeRecord({ id: "f2", period: "2026-01" })]
    const result = computeFilingDisciplineScore(records)
    expect(result.score).toBe(100)
    expect(result.onTime).toBe(2)
  })
  it("all missing = 0", () => {
    const records = [makeRecord({ status: "missing" }), makeRecord({ id: "f2", status: "missing" })]
    const result = computeFilingDisciplineScore(records)
    expect(result.score).toBe(0)
    expect(result.label).toBe("critic")
  })
  it("mixed gives intermediate score", () => {
    const records = [
      makeRecord({ status: "on_time" }),
      makeRecord({ id: "f2", status: "late" }),
      makeRecord({ id: "f3", status: "missing" }),
    ]
    const result = computeFilingDisciplineScore(records)
    expect(result.score).toBe(50) // (100 + 50 + 0) / 3 = 50
  })
  it("skips upcoming in scoring", () => {
    const records = [
      makeRecord({ status: "on_time" }),
      makeRecord({ id: "f2", status: "upcoming" }),
    ]
    const result = computeFilingDisciplineScore(records)
    expect(result.score).toBe(100)
    expect(result.total).toBe(1)
  })
  it("penalizes repeated rectifications", () => {
    const records = [
      makeRecord({ status: "rectified", rectificationCount: 3 }),
      makeRecord({ id: "f2", status: "on_time" }),
    ]
    const result = computeFilingDisciplineScore(records)
    // (60 + 100) / 2 = 80, minus 5 for multi-rect = 75
    expect(result.score).toBe(75)
  })
})

describe("buildOverdueFilingFindings", () => {
  it("generates finding for overdue missing filing", () => {
    const records = [makeRecord({ status: "missing", dueISO: "2026-03-01T00:00:00.000Z" })]
    const findings = buildOverdueFilingFindings(records, NOW)
    expect(findings.length).toBe(1)
    expect(findings[0].id).toBe("filing-overdue-f1")
    expect(findings[0].category).toBe("E_FACTURA")
  })
  it("skips non-missing", () => {
    const records = [makeRecord({ status: "on_time" })]
    const findings = buildOverdueFilingFindings(records, NOW)
    expect(findings.length).toBe(0)
  })
  it("skips future due dates", () => {
    const records = [makeRecord({ status: "missing", dueISO: "2026-04-01T00:00:00.000Z" })]
    const findings = buildOverdueFilingFindings(records, NOW)
    expect(findings.length).toBe(0)
  })
})

describe("generateFilingReminders", () => {
  it("generates escalation for <=3 days", () => {
    const records = [makeRecord({ status: "upcoming", dueISO: "2026-03-20T00:00:00.000Z" })]
    const reminders = generateFilingReminders(records, NOW)
    expect(reminders.length).toBe(1)
    expect(reminders[0].escalationLevel).toBe("escalation")
  })
  it("generates warning for <=7 days", () => {
    const records = [makeRecord({ status: "upcoming", dueISO: "2026-03-24T00:00:00.000Z" })]
    const reminders = generateFilingReminders(records, NOW)
    expect(reminders.length).toBe(1)
    expect(reminders[0].escalationLevel).toBe("warning")
  })
  it("generates reminder for <=14 days", () => {
    const records = [makeRecord({ status: "upcoming", dueISO: "2026-03-30T00:00:00.000Z" })]
    const reminders = generateFilingReminders(records, NOW)
    expect(reminders.length).toBe(1)
    expect(reminders[0].escalationLevel).toBe("reminder")
  })
  it("no reminder for >14 days", () => {
    const records = [makeRecord({ status: "upcoming", dueISO: "2026-04-15T00:00:00.000Z" })]
    const reminders = generateFilingReminders(records, NOW)
    expect(reminders.length).toBe(0)
  })
})

describe("checkFilingConsistency", () => {
  it("detects repeated rectifications", () => {
    const records = [
      makeRecord({ status: "rectified" }),
      makeRecord({ id: "f2", period: "2026-01", status: "rectified" }),
      makeRecord({ id: "f3", period: "2025-12", status: "rectified" }),
    ]
    const issues = checkFilingConsistency(records)
    expect(issues.some((i) => i.severity === "error")).toBe(true)
  })
  it("detects missing filings", () => {
    const records = [makeRecord({ status: "missing" })]
    const issues = checkFilingConsistency(records)
    expect(issues.some((i) => i.message.includes("lipsă"))).toBe(true)
  })
})
