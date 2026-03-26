import { describe, expect, it } from "vitest"

import { buildExternalFeedItems } from "./feed-sources"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

function makeFinding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: "demo-efactura-1",
    title: "Factură ANAF respinsă — FACT-2026-0021",
    detail:
      "Factura FACT-2026-0021 a fost respinsă de SPV ANAF. Codul de eroare V009 indică probleme cu câmpul TaxTotal.",
    category: "E_FACTURA",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: "2026-03-26T08:00:00.000Z",
    sourceDocument: "FACT-2026-0021.xml",
    findingStatus: "under_monitoring",
    nextMonitoringDateISO: "2026-04-02T00:00:00.000Z",
    ...overrides,
  }
}

function makeState(overrides: Partial<ComplianceState> = {}): ComplianceState {
  return {
    applicability: { tags: [], entries: [] },
    efacturaConnected: true,
    efacturaSignalsCount: 0,
    findings: [],
    ...overrides,
  } as unknown as ComplianceState
}

describe("buildExternalFeedItems", () => {
  it("arată reverificare specifică pentru factura retransmisă aflată în monitorizare", () => {
    const items = buildExternalFeedItems(
      [],
      makeState({
        findings: [
          makeFinding(),
        ],
      })
    )

    expect(items[0]).toEqual(
      expect.objectContaining({
        eyebrow: "e-Factura",
        title: "Reverificăm factura retransmisă",
        href: "/dashboard/resolve/demo-efactura-1",
      })
    )
    expect(items[0]?.detail).toContain("Următorul control este programat")
  })

  it("arată reverificare SPV clară pentru EF-001 în monitorizare", () => {
    const items = buildExternalFeedItems(
      [],
      makeState({
        findings: [
          makeFinding({
            id: "spv-missing-12345678",
            title: "SPV lipsă pentru CUI 12345678",
            detail: "Firma nu este înregistrată în SPV.",
            nextMonitoringDateISO: "2026-04-25T00:00:00.000Z",
          }),
        ],
      })
    )

    expect(items[0]).toEqual(
      expect.objectContaining({
        eyebrow: "SPV ANAF",
        title: "Reverificăm SPV-ul firmei",
        href: "/dashboard/fiscal?tab=spv&findingId=spv-missing-12345678",
      })
    )
  })
})
