import { describe, it, expect } from "vitest"
import {
  checkFiscalFindingRevalidation,
  checkRevalidationReminders,
  detectStaleEvidence,
  autoLinkNotificationsToDiscrepancies,
  runFiscalRevalidation,
} from "./fiscal-revalidation"
import type { ScanFinding } from "./types"
import type { ETVADiscrepancy } from "./etva-discrepancy"
import type { FilingRecord } from "./filing-discipline"
import type { AppNotification } from "@/lib/server/notifications-store"

const NOW = "2026-03-18T12:00:00.000Z"

function makeFinding(id: string, closureEvidence?: string): ScanFinding {
  return {
    id,
    title: "Test finding",
    detail: "Test",
    category: "E_FACTURA",
    severity: "high",
    risk: "high",
    principles: ["accountability"],
    createdAtISO: "2026-03-01T00:00:00.000Z",
    sourceDocument: "test",
    resolution: closureEvidence ? { problem: "", impact: "", action: "", closureEvidence } : undefined,
  }
}

function makeDisc(overrides: Partial<ETVADiscrepancy> = {}): ETVADiscrepancy {
  return {
    id: "d1",
    type: "sum_mismatch",
    severity: "medium",
    status: "detected",
    period: "2026-Q1",
    description: "Test",
    detectedAtISO: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("checkFiscalFindingRevalidation", () => {
  it("reopens finding if discrepancy still active", () => {
    const findings = [makeFinding("etva-disc-d1", "Some evidence")]
    const discs = [makeDisc({ status: "acknowledged" })]
    const actions = checkFiscalFindingRevalidation(findings, discs, [], NOW)
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe("reopen_finding")
  })

  it("does not reopen if discrepancy resolved", () => {
    const findings = [makeFinding("etva-disc-d1", "Some evidence")]
    const discs = [makeDisc({ status: "resolved" })]
    const actions = checkFiscalFindingRevalidation(findings, discs, [], NOW)
    expect(actions.length).toBe(0)
  })

  it("reopens filing finding if still missing", () => {
    const findings = [makeFinding("filing-overdue-f1", "Filed")]
    const filings: FilingRecord[] = [{
      id: "f1", type: "d300_tva", period: "2026-02", status: "missing", dueISO: "2026-03-01T00:00:00.000Z",
    }]
    const actions = checkFiscalFindingRevalidation(findings, [], filings, NOW)
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe("reopen_finding")
  })
})

describe("checkRevalidationReminders", () => {
  it("escalates past revalidation date", () => {
    const discs = [makeDisc({
      status: "resolved",
      revalidationDueISO: "2026-03-10T00:00:00.000Z",
    })]
    const actions = checkRevalidationReminders(discs, NOW)
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe("escalate")
  })

  it("reminds before revalidation", () => {
    const discs = [makeDisc({
      status: "resolved",
      revalidationDueISO: "2026-03-23T00:00:00.000Z",
    })]
    const actions = checkRevalidationReminders(discs, NOW)
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe("reminder")
  })

  it("skips non-resolved", () => {
    const discs = [makeDisc({ revalidationDueISO: "2026-03-10T00:00:00.000Z" })]
    const actions = checkRevalidationReminders(discs, NOW)
    expect(actions.length).toBe(0)
  })
})

describe("detectStaleEvidence", () => {
  it("flags old evidence", () => {
    const findings = [makeFinding("etva-disc-d1")]
    const evidenceDates = { "etva-disc-d1": "2025-12-01T00:00:00.000Z" }
    const actions = detectStaleEvidence(findings, evidenceDates, NOW)
    expect(actions.length).toBe(1)
    expect(actions[0].type).toBe("stale_evidence")
  })

  it("skips recent evidence", () => {
    const findings = [makeFinding("etva-disc-d1")]
    const evidenceDates = { "etva-disc-d1": "2026-03-01T00:00:00.000Z" }
    const actions = detectStaleEvidence(findings, evidenceDates, NOW)
    expect(actions.length).toBe(0)
  })
})

describe("autoLinkNotificationsToDiscrepancies", () => {
  it("links matching notification and discrepancy", () => {
    const notifs: AppNotification[] = [{
      id: "n1",
      type: "anaf_signal",
      title: "Discrepanță sume 2026-Q1",
      message: "discrepanță în declarația 2026-Q1",
      createdAt: NOW,
    }]
    const discs = [makeDisc({ period: "2026-Q1", type: "sum_mismatch" })]
    const links = autoLinkNotificationsToDiscrepancies(notifs, discs, [], NOW)
    expect(links.length).toBe(1)
    expect(links[0].confidence).toBe("high")
  })

  it("medium confidence for period match only", () => {
    const notifs: AppNotification[] = [{
      id: "n1",
      type: "anaf_deadline",
      title: "Termen 2026-Q1",
      message: "termen de raspuns 2026-Q1",
      createdAt: NOW,
    }]
    const discs = [makeDisc({ period: "2026-Q1", type: "vat_rate_error" })]
    const links = autoLinkNotificationsToDiscrepancies(notifs, discs, [], NOW)
    expect(links.length).toBe(1)
    expect(links[0].confidence).toBe("medium")
  })

  it("skips already linked", () => {
    const notifs: AppNotification[] = [{
      id: "n1",
      type: "anaf_signal",
      title: "Discrepanță sume 2026-Q1",
      message: "discrepanță 2026-Q1",
      createdAt: NOW,
    }]
    const discs = [makeDisc()]
    const existing = [{
      notificationId: "n1",
      discrepancyId: "d1",
      linkedAtISO: NOW,
      linkType: "auto" as const,
      confidence: "high" as const,
    }]
    const links = autoLinkNotificationsToDiscrepancies(notifs, discs, existing, NOW)
    expect(links.length).toBe(0)
  })
})

describe("runFiscalRevalidation", () => {
  it("combines all checks", () => {
    const findings = [makeFinding("etva-disc-d1", "Evidence")]
    const discs = [makeDisc({ status: "acknowledged" })]
    const actions = runFiscalRevalidation({
      findings,
      discrepancies: discs,
      filings: [],
      evidenceDates: { "etva-disc-d1": "2025-11-01T00:00:00.000Z" },
      nowISO: NOW,
    })
    // reopen + stale evidence
    expect(actions.length).toBe(2)
  })
})
