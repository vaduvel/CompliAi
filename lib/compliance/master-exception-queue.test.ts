// Unit tests pentru Master Exception Queue (FC-7).

import { describe, expect, it } from "vitest"

import {
  buildMasterExceptionQueue,
  filterByCategory,
  filterBySeverity,
  type ExceptionQueueInput,
} from "./master-exception-queue"
import type { FindingWithImpact } from "./economic-impact"
import type { FilingRecord } from "./filing-discipline"

function mkFinding(
  rule: "R1" | "R2" | "R3" | "R5" | "R6" | "R7",
  severity: "ok" | "info" | "warning" | "error",
  costMax: number,
): FindingWithImpact {
  return {
    id: `f-${rule}-${Math.random().toString(36).slice(2, 6)}`,
    rule,
    ruleName: `${rule} rule`,
    severity,
    title: `${rule} title`,
    summary: "Summary",
    detail: "Detail",
    period: "2026-04",
    sources: [],
    suggestion: "Rezolvă urgent.",
    legalReference: "Cod Fiscal Art. 219",
    economicImpact: {
      affectedAmountRON: null,
      penaltyMinRON: costMax * 0.5,
      penaltyMaxRON: costMax,
      remediationHours: 2,
      retransmissions: 1,
      totalCostMinRON: costMax * 0.5,
      totalCostMaxRON: costMax,
      legalReferences: ["Cod Fiscal Art. 219"],
      computationNote: "",
    },
  }
}

function mkFiling(
  override: Partial<FilingRecord> & Pick<FilingRecord, "period" | "dueISO" | "status">,
): FilingRecord {
  return {
    id: `f-${override.period}-${Math.random().toString(36).slice(2, 6)}`,
    type: "d300_tva",
    ...override,
  }
}

describe("buildMasterExceptionQueue", () => {
  it("returnează 0 items pentru input gol", () => {
    const r = buildMasterExceptionQueue({})
    expect(r.items).toHaveLength(0)
    expect(r.summary.total).toBe(0)
    expect(r.topRecommendation).toContain("Niciun excepție")
  })

  it("filtrează findings cu severity ok/info", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [
        mkFinding("R1", "ok", 0),
        mkFinding("R2", "warning", 1500),
      ],
    })
    expect(r.items).toHaveLength(1)
    expect(r.items[0]?.title).toContain("R2")
  })

  it("agregă findings + filings + audit risk signals", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [mkFinding("R1", "warning", 1500)],
      filings: [
        mkFiling({
          period: "2026-03",
          dueISO: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 zile overdue
          status: "missing",
        }),
      ],
      auditRiskSignals: [
        { id: "audit-1", title: "Sequence gap detected", severity: "high", impactRON: 800 },
      ],
    })
    expect(r.items.length).toBeGreaterThanOrEqual(3)
    expect(r.summary.byCategory["cross-correlation"]).toBe(1)
    expect(r.summary.byCategory["filing-missing"]).toBe(1)
    expect(r.summary.byCategory["audit-risk"]).toBe(1)
  })

  it("sortează items după priorityScore descrescător", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [
        mkFinding("R1", "warning", 500), // mic impact
        mkFinding("R5", "error", 15000), // mare impact, critic
        mkFinding("R3", "warning", 2000), // mediu
      ],
    })
    // Primul ar trebui să fie R5 (critic + 15k RON)
    expect(r.items[0]?.title).toContain("R5")
  })

  it("severitate critic pentru error findings", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [mkFinding("R2", "error", 5000)],
    })
    expect(r.items[0]?.severity).toBe("critic")
  })

  it("severitate important pentru filing missing", () => {
    const r = buildMasterExceptionQueue({
      filings: [
        mkFiling({
          period: "2025-12",
          dueISO: new Date(Date.now() - 10 * 86400000).toISOString(),
          status: "missing",
        }),
      ],
    })
    const item = r.items.find((i) => i.category === "filing-missing")
    expect(item?.severity).toBe("important")
  })

  it("severitate critic pentru filing missing >30 zile", () => {
    const r = buildMasterExceptionQueue({
      filings: [
        mkFiling({
          period: "2025-10",
          dueISO: new Date(Date.now() - 45 * 86400000).toISOString(),
          status: "missing",
        }),
      ],
    })
    const item = r.items.find((i) => i.category === "filing-missing")
    expect(item?.severity).toBe("critic")
  })

  it("recomandare strategică pentru ≥3 critice", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [
        mkFinding("R1", "error", 8000),
        mkFinding("R2", "error", 7000),
        mkFinding("R5", "error", 9000),
      ],
    })
    expect(r.topRecommendation).toContain("3 excepții CRITICE")
  })

  it("calculează deadline + overdueCount", () => {
    const r = buildMasterExceptionQueue({
      filings: [
        mkFiling({
          period: "2026-02",
          dueISO: new Date(Date.now() - 10 * 86400000).toISOString(),
          status: "missing",
        }),
        mkFiling({
          period: "2026-04",
          dueISO: new Date(Date.now() + 3 * 86400000).toISOString(),
          status: "upcoming",
        }),
      ],
    })
    expect(r.summary.overdueCount).toBe(1)
    expect(r.summary.dueIn7DaysCount).toBe(1)
  })

  it("filterByCategory funcționează", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [mkFinding("R1", "warning", 1500)],
      filings: [
        mkFiling({
          period: "2026-03",
          dueISO: new Date(Date.now() - 5 * 86400000).toISOString(),
          status: "missing",
        }),
      ],
    })
    const filtered = filterByCategory(r.items, "filing-missing")
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.category).toBe("filing-missing")
  })

  it("filterBySeverity funcționează", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [
        mkFinding("R1", "warning", 1000), // important
        mkFinding("R2", "error", 5000), // critic
      ],
    })
    const critice = filterBySeverity(r.items, "critic")
    expect(critice).toHaveLength(1)
  })

  it("priority score range 0-100", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [mkFinding("R1", "error", 50000)],
    })
    expect(r.items[0]?.priorityScore).toBeGreaterThan(0)
    expect(r.items[0]?.priorityScore).toBeLessThanOrEqual(100)
  })

  it("owner: R2 + R5 = ambii, restul = cabinet", () => {
    const r = buildMasterExceptionQueue({
      crossCorrelationFindings: [
        mkFinding("R1", "warning", 1000),
        mkFinding("R2", "warning", 1000),
        mkFinding("R5", "warning", 1000),
        mkFinding("R7", "warning", 1000),
      ],
    })
    const r2 = r.items.find((i) => i.title.includes("R2"))
    const r5 = r.items.find((i) => i.title.includes("R5"))
    const r1 = r.items.find((i) => i.title.includes("R1"))
    expect(r2?.owner).toBe("ambii")
    expect(r5?.owner).toBe("ambii")
    expect(r1?.owner).toBe("cabinet")
  })
})
