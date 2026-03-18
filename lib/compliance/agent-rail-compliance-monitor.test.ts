import { describe, it, expect } from "vitest"
import { runComplianceMonitorRail } from "./agent-rail-compliance-monitor"
import type { ETVADiscrepancy } from "./etva-discrepancy"
import type { FilingRecord } from "./filing-discipline"
import type { AppNotification } from "@/lib/server/notifications-store"

const NOW = "2026-03-18T12:00:00.000Z"

function makeDisc(overrides: Partial<ETVADiscrepancy> = {}): ETVADiscrepancy {
  return {
    id: "d1",
    type: "sum_mismatch",
    severity: "medium",
    status: "detected",
    period: "2026-Q1",
    description: "Test",
    detectedAtISO: "2026-03-01T00:00:00.000Z",
    deadlineISO: "2026-03-25T00:00:00.000Z",
    ...overrides,
  }
}

function makeNotif(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    type: "anaf_signal",
    title: "Test notification",
    message: "Test",
    createdAt: "2026-03-01T00:00:00.000Z",
    anafStatus: "primit",
    ...overrides,
  }
}

describe("runComplianceMonitorRail", () => {
  it("escalates overdue discrepancies", () => {
    const discs = [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })]
    const result = runComplianceMonitorRail({
      discrepancies: discs,
      filingRecords: [],
      anafNotifications: [],
      nowISO: NOW,
    })
    expect(result.escalations).toBeGreaterThanOrEqual(1)
    expect(result.refreshTriggered).toBe(true)
  })

  it("reminds for upcoming discrepancies", () => {
    const discs = [makeDisc({ deadlineISO: "2026-03-22T00:00:00.000Z" })]
    const result = runComplianceMonitorRail({
      discrepancies: discs,
      filingRecords: [],
      anafNotifications: [],
      nowISO: NOW,
    })
    expect(result.reminders).toBeGreaterThanOrEqual(1)
  })

  it("escalates poor filing discipline", () => {
    const filings: FilingRecord[] = [
      { id: "f1", type: "d300_tva", period: "2026-02", status: "missing", dueISO: "2026-03-01T00:00:00.000Z" },
      { id: "f2", type: "d300_tva", period: "2026-01", status: "missing", dueISO: "2026-02-01T00:00:00.000Z" },
    ]
    const result = runComplianceMonitorRail({
      discrepancies: [],
      filingRecords: filings,
      anafNotifications: [],
      nowISO: NOW,
    })
    expect(result.escalations).toBeGreaterThanOrEqual(1)
    expect(result.refreshTriggered).toBe(true)
  })

  it("detects stale notifications", () => {
    const notifs = [makeNotif({ createdAt: "2026-02-20T00:00:00.000Z" })]
    const result = runComplianceMonitorRail({
      discrepancies: [],
      filingRecords: [],
      anafNotifications: notifs,
      nowISO: NOW,
    })
    expect(result.staleSignals).toBe(1)
  })

  it("skips closed notifications", () => {
    const notifs = [makeNotif({ anafStatus: "inchis" })]
    const result = runComplianceMonitorRail({
      discrepancies: [],
      filingRecords: [],
      anafNotifications: notifs,
      nowISO: NOW,
    })
    expect(result.staleSignals).toBe(0)
  })

  it("triggers SAF-T escalation for poor hygiene", () => {
    const filings: FilingRecord[] = [
      { id: "s1", type: "saft", period: "2026-02", status: "missing", dueISO: "2026-03-01T00:00:00.000Z" },
      { id: "s2", type: "saft", period: "2026-01", status: "missing", dueISO: "2026-02-01T00:00:00.000Z" },
    ]
    const result = runComplianceMonitorRail({
      discrepancies: [],
      filingRecords: filings,
      anafNotifications: [],
      nowISO: NOW,
    })
    const saftEscalation = result.actions.find(
      (a) => a.type === "escalation" && "targetType" in a && a.targetType === "saft",
    )
    expect(saftEscalation).toBeDefined()
  })
})
