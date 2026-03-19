import { describe, it, expect } from "vitest"
import {
  computeClientPriority,
  determineQueuePlacement,
  prioritizeClientBatch,
} from "./agent-rail-routing"
import type { ETVADiscrepancy } from "./etva-discrepancy"
import type { FilingDisciplineScore } from "./filing-discipline"

const NOW = "2026-03-18T12:00:00.000Z"

const OK_FILING: FilingDisciplineScore = {
  score: 90, label: "excelent", onTime: 9, late: 1, missing: 0, rectified: 0, total: 10, details: "9/10 la timp",
}

const BAD_FILING: FilingDisciplineScore = {
  score: 20, label: "critic", onTime: 1, late: 2, missing: 5, rectified: 2, total: 10, details: "5 lipsă",
}

function makeDisc(overrides: Partial<ETVADiscrepancy> = {}): ETVADiscrepancy {
  return {
    id: "d1", type: "sum_mismatch", severity: "medium", status: "detected",
    period: "2026-Q1", description: "Test", detectedAtISO: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("computeClientPriority", () => {
  it("low priority for clean org", () => {
    const result = computeClientPriority({
      orgId: "org-1",
      findings: [],
      discrepancies: [],
      filingDiscipline: OK_FILING,
      nowISO: NOW,
    })
    expect(result.urgencyTier).toBe("low")
    expect(result.priorityScore).toBe(0)
    expect(result.nextBestAction).toBeNull()
  })

  it("critical for overdue discrepancies", () => {
    const result = computeClientPriority({
      orgId: "org-1",
      findings: [],
      discrepancies: [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })],
      filingDiscipline: OK_FILING,
      nowISO: NOW,
    })
    expect(result.priorityScore).toBeGreaterThanOrEqual(15)
    expect(result.nextBestAction).toBeDefined()
    expect(result.nextBestAction!.priority).toBe("critical")
  })

  it("includes sector risk", () => {
    const result = computeClientPriority({
      orgId: "org-1",
      orgProfile: {
        sector: "retail",
        employeeCount: "50-249",
        usesAITools: false,
        requiresEfactura: true,
        completedAtISO: NOW,
      },
      findings: [],
      discrepancies: [],
      filingDiscipline: OK_FILING,
      nowISO: NOW,
    })
    expect(result.priorityScore).toBe(20) // sector weight
    expect(result.factors.some((f) => f.source === "sector_risk")).toBe(true)
  })

  it("accumulates multiple factors", () => {
    const result = computeClientPriority({
      orgId: "org-1",
      orgProfile: {
        sector: "retail",
        employeeCount: "50-249",
        usesAITools: false,
        requiresEfactura: true,
        completedAtISO: NOW,
      },
      findings: [
        { id: "f1", title: "Critical", detail: "", category: "E_FACTURA", severity: "critical", risk: "high", principles: ["accountability"], createdAtISO: NOW, sourceDocument: "" },
      ],
      discrepancies: [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })],
      filingDiscipline: BAD_FILING,
      nowISO: NOW,
    })
    expect(result.factors.length).toBeGreaterThanOrEqual(3)
    expect(result.urgencyTier).toBe("critical")
  })

  it("suggests filing action when discipline is poor", () => {
    const result = computeClientPriority({
      orgId: "org-1",
      findings: [],
      discrepancies: [],
      filingDiscipline: BAD_FILING,
      nowISO: NOW,
    })
    expect(result.nextBestAction).toBeDefined()
    expect(result.nextBestAction!.action).toContain("lipsă")
  })
})

describe("determineQueuePlacement", () => {
  it("urgent queue for critical tier", () => {
    const priority = computeClientPriority({
      orgId: "org-1",
      orgProfile: {
        sector: "retail",
        employeeCount: "50-249",
        usesAITools: false,
        requiresEfactura: true,
        completedAtISO: NOW,
      },
      findings: [
        { id: "f1", title: "Critical", detail: "", category: "E_FACTURA", severity: "critical", risk: "high", principles: ["accountability"], createdAtISO: NOW, sourceDocument: "" },
      ],
      discrepancies: [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })],
      filingDiscipline: BAD_FILING,
      nowISO: NOW,
    })
    const placement = determineQueuePlacement(priority, NOW)
    expect(placement.queue).toBe("urgent")
  })

  it("monitoring queue for low tier", () => {
    const priority = computeClientPriority({
      orgId: "org-1",
      findings: [],
      discrepancies: [],
      filingDiscipline: OK_FILING,
      nowISO: NOW,
    })
    const placement = determineQueuePlacement(priority, NOW)
    expect(placement.queue).toBe("monitoring")
  })
})

describe("prioritizeClientBatch", () => {
  it("sorts by priority descending", () => {
    const clients = [
      { orgId: "org-clean", findings: [], discrepancies: [], filingDiscipline: OK_FILING },
      { orgId: "org-bad", findings: [], discrepancies: [makeDisc({ deadlineISO: "2026-03-10T00:00:00.000Z" })], filingDiscipline: BAD_FILING },
    ]
    const result = prioritizeClientBatch(clients as Parameters<typeof prioritizeClientBatch>[0], NOW)
    expect(result[0].orgId).toBe("org-bad")
    expect(result[1].orgId).toBe("org-clean")
  })
})
