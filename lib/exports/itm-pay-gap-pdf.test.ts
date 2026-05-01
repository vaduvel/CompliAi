// Pay Transparency — ITM PDF tests (markdown only — PDF binary is integration)

import { describe, expect, it } from "vitest"

import type { PayGapReport } from "@/lib/server/pay-transparency-store"
import type { WhiteLabelConfig } from "@/lib/server/white-label"
import { buildItmReportMarkdown } from "./itm-pay-gap-pdf"

const fakeReport: PayGapReport = {
  id: "rep_test",
  orgId: "org-test",
  generatedAtISO: "2026-05-15T10:00:00.000Z",
  periodYear: 2026,
  totalEmployees: 247,
  avgSalaryM: 7500,
  avgSalaryF: 7185,
  gapPercent: 4.2,
  gapByRole: [
    { role: "Marketing", avgSalaryM: 6500, avgSalaryF: 6300, gap: 200, gapPercent: 3.1 },
    { role: "Sales", avgSalaryM: 8000, avgSalaryF: 7700, gap: 300, gapPercent: 3.75 },
  ],
  gapByDepartment: [{ dept: "Tech", gapPercent: 2.5 }],
  riskLevel: "low",
  obligationMet: true,
  status: "draft",
  recommendations: [
    "Continuă monitorizarea ecartului trimestrial.",
    "Audit job architecture pentru roluri cu volum mic.",
  ],
}

describe("itm-pay-gap-pdf — markdown", () => {
  it("includes core report sections", () => {
    const md = buildItmReportMarkdown({
      report: fakeReport,
      orgName: "Demo SRL",
    })
    expect(md).toContain("# Raport Pay Transparency")
    expect(md).toContain("Directivei (UE) 2023/970")
    expect(md).toContain("Demo SRL")
    expect(md).toContain("247")
    expect(md).toContain("4.20%")
    expect(md).toContain("Marketing")
    expect(md).toContain("Sales")
    expect(md).toContain("## Ecart pe roluri")
    expect(md).toContain("## Recomandări")
  })

  it("includes white-label partner name + signer", () => {
    const wl: WhiteLabelConfig = {
      orgId: "org-test",
      partnerName: "Cabinet HR Demo",
      tagline: "Pay Transparency made easy",
      logoUrl: null,
      brandColor: "#ff66aa",
      aiEnabled: true,
      signatureUrl: null,
      signerName: "Andreea Popescu, HR Director",
      icpSegment: "imm-hr",
      aiProvider: null,
      updatedAtISO: null,
    }
    const md = buildItmReportMarkdown({
      report: fakeReport,
      orgName: "Demo SRL",
      whiteLabel: wl,
    })
    expect(md).toContain("Cabinet HR Demo")
    expect(md).toContain("Pay Transparency made easy")
    expect(md).toContain("Andreea Popescu")
  })

  it("shows compliance interpretation under 5%", () => {
    const md = buildItmReportMarkdown({ report: fakeReport, orgName: "X" })
    expect(md).toContain("sub pragul de 5%")
    expect(md).not.toContain("Inițieze evaluarea comună")
  })

  it("shows non-compliance interpretation over 5%", () => {
    const high: PayGapReport = { ...fakeReport, gapPercent: 7.5, obligationMet: false }
    const md = buildItmReportMarkdown({ report: high, orgName: "X" })
    expect(md).toContain("depășește pragul de 5%")
    expect(md).toContain("Inițieze evaluarea comună")
  })

  it("handles empty roles and departments gracefully", () => {
    const empty: PayGapReport = {
      ...fakeReport,
      gapByRole: [],
      gapByDepartment: [],
      recommendations: [],
    }
    const md = buildItmReportMarkdown({ report: empty, orgName: "X" })
    expect(md).toContain("Nu există suficiente date pe roluri")
    expect(md).not.toContain("## Recomandări")
  })

  it("includes legal references section", () => {
    const md = buildItmReportMarkdown({ report: fakeReport, orgName: "X" })
    expect(md).toContain("## Referințe legale")
    expect(md).toContain("2023/970")
    expect(md).toContain("Codul Muncii")
  })
})
