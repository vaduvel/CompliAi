import { describe, expect, it } from "vitest"

import { preserveRuntimeStateForRegeneratedFindings, preserveRuntimeStateForSingleFinding } from "./preserve-finding-runtime-state"
import type { ScanFinding } from "@/lib/compliance/types"

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "finding-1",
    title: "Finding demo",
    detail: "Detaliu",
    category: "NIS2",
    severity: "high",
    risk: "high",
    principles: ["accountability"],
    createdAtISO: "2026-03-28T05:00:00.000Z",
    sourceDocument: "demo",
    ...overrides,
  }
}

describe("preserveRuntimeStateForRegeneratedFindings", () => {
  it("păstrează statusul confirmed și urma runtime când finding-ul este regenerat cu același id", () => {
    const existing = makeFinding({
      id: "nis2-finding-nis2-rm-01",
      findingStatus: "confirmed",
      findingStatusUpdatedAtISO: "2026-03-28T05:10:00.000Z",
      operationalEvidenceNote: "Dovadă veche",
    })
    const incoming = makeFinding({
      id: "nis2-finding-nis2-rm-01",
      detail: "Detaliu nou",
      remediationHint: "Hint nou",
    })

    const [merged] = preserveRuntimeStateForRegeneratedFindings([existing], [incoming])
    expect(merged.findingStatus).toBe("confirmed")
    expect(merged.findingStatusUpdatedAtISO).toBe("2026-03-28T05:10:00.000Z")
    expect(merged.operationalEvidenceNote).toBe("Dovadă veche")
    expect(merged.detail).toBe("Detaliu nou")
  })
})

describe("preserveRuntimeStateForSingleFinding", () => {
  it("păstrează statusul sub monitorizare pentru finding-ul singular regenerat", () => {
    const existing = makeFinding({
      id: "anspdcp-breach-inc-1",
      findingStatus: "under_monitoring",
      nextMonitoringDateISO: "2026-09-28T00:00:00.000Z",
    })
    const incoming = makeFinding({
      id: "anspdcp-breach-inc-1",
      title: "Notificare ANSPDCP obligatorie",
    })

    const merged = preserveRuntimeStateForSingleFinding([existing], incoming)
    expect(merged?.findingStatus).toBe("under_monitoring")
    expect(merged?.nextMonitoringDateISO).toBe("2026-09-28T00:00:00.000Z")
    expect(merged?.title).toBe("Notificare ANSPDCP obligatorie")
  })
})
