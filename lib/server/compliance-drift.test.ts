import { describe, expect, it } from "vitest"

import type { ComplianceDriftRecord } from "@/lib/compliance/types"

import { mergeDriftRecords } from "./compliance-drift"

function createDrift(overrides: Partial<ComplianceDriftRecord> = {}): ComplianceDriftRecord {
  return {
    id: "drift-1",
    snapshotId: "snap-2",
    comparedToSnapshotId: "snap-1",
    type: "compliance_drift",
    change: "risk_class_changed",
    severity: "medium",
    summary: "Scor conformitate scăzut după noul snapshot.",
    detectedAtISO: "2026-03-28T10:00:00.000Z",
    open: true,
    lifecycleStatus: "open",
    lastStatusUpdatedAtISO: "2026-03-28T10:00:00.000Z",
    ...overrides,
  }
}

describe("mergeDriftRecords", () => {
  it("păstrează drifturile existente când snapshotul curent nu mai generează altele noi", () => {
    const previous = createDrift({
      lifecycleStatus: "acknowledged",
      acknowledgedAtISO: "2026-03-28T10:05:00.000Z",
      acknowledgedBy: "demo@site.ro (compliance)",
      lastStatusUpdatedAtISO: "2026-03-28T10:05:00.000Z",
    })

    const merged = mergeDriftRecords([previous], [], "2026-03-28T10:06:00.000Z")

    expect(merged.events).toEqual([])
    expect(merged.drifts).toHaveLength(1)
    expect(merged.drifts[0]).toMatchObject({
      id: "drift-1",
      lifecycleStatus: "acknowledged",
      open: true,
      acknowledgedAtISO: "2026-03-28T10:05:00.000Z",
      acknowledgedBy: "demo@site.ro (compliance)",
      lastStatusUpdatedAtISO: "2026-03-28T10:05:00.000Z",
    })
  })

  it("actualizează drifturile regenerate, dar păstrează lifecycle-ul manual", () => {
    const previous = createDrift({
      summary: "Provider schimbat pentru CRM.",
      lifecycleStatus: "in_progress",
      inProgressAtISO: "2026-03-28T10:08:00.000Z",
    })
    const generated = createDrift({
      summary: "Provider schimbat pentru CRM.",
      snapshotId: "snap-3",
      detectedAtISO: "2026-03-28T10:10:00.000Z",
      lastStatusUpdatedAtISO: "2026-03-28T10:10:00.000Z",
    })

    const merged = mergeDriftRecords([previous], [generated], "2026-03-28T10:10:00.000Z")

    expect(merged.drifts).toHaveLength(1)
    expect(merged.drifts[0]).toMatchObject({
      id: "drift-1",
      snapshotId: "snap-3",
      lifecycleStatus: "in_progress",
      open: true,
      inProgressAtISO: "2026-03-28T10:08:00.000Z",
    })
  })
})
