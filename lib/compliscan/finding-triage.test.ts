import { describe, expect, it } from "vitest"

import type { ScanFinding } from "@/lib/compliance/types"
import { describeFindingRiskForTriage, sortFindingsForTriage } from "@/lib/compliscan/finding-triage"

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "finding-1",
    title: "Politică de confidențialitate lipsă",
    detail: "Nu a fost găsit link spre o politică de privacy. Obligatorie GDPR Art. 13.",
    category: "GDPR",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: "2026-03-27T10:00:00.000Z",
    sourceDocument: "site-scan",
    ...overrides,
  }
}

describe("finding triage", () => {
  it("prefers explicit impact copy over raw detail", () => {
    const finding = makeFinding({
      resolution: {
        problem: "Lipsește politica.",
        impact: "Clienții nu văd cum le folosești datele și crește riscul de reclamație.",
        action: "Generează politica.",
      },
    })

    expect(describeFindingRiskForTriage(finding)).toBe(
      "Clienții nu văd cum le folosești datele și crește riscul de reclamație."
    )
  })

  it("falls back to the first sentence from finding detail", () => {
    const finding = makeFinding()

    expect(describeFindingRiskForTriage(finding)).toBe("Nu a fost găsit link spre o politică de privacy.")
  })

  it("sorts findings by severity first, then newest first", () => {
    const ordered = sortFindingsForTriage([
      makeFinding({ id: "medium", severity: "medium", createdAtISO: "2026-03-27T12:00:00.000Z" }),
      makeFinding({ id: "critical-old", severity: "critical", createdAtISO: "2026-03-26T12:00:00.000Z" }),
      makeFinding({ id: "critical-new", severity: "critical", createdAtISO: "2026-03-27T13:00:00.000Z" }),
    ])

    expect(ordered.map((finding) => finding.id)).toEqual(["critical-new", "critical-old", "medium"])
  })
})
