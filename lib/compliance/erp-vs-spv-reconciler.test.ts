import { describe, it, expect } from "vitest"

import {
  reconcileErpVsSpv,
  buildErpSpvDisparityFindings,
} from "./erp-vs-spv-reconciler"

describe("reconcileErpVsSpv", () => {
  it("flagheaza erp_says_sent_spv_says_missing cu severity critical", () => {
    const erp = [{
      source: "smartbill" as const,
      series: "FACT", number: "001",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "valida" as const,
    }]
    const spv: any[] = []  // SPV gol
    const disparities = reconcileErpVsSpv(erp, spv)
    expect(disparities.length).toBe(1)
    expect(disparities[0].type).toBe("erp_says_sent_spv_says_missing")
    expect(disparities[0].severity).toBe("critical")
  })

  it("flagheaza erp_says_valid_spv_says_rejected", () => {
    const erp = [{
      source: "smartbill" as const,
      series: "FACT", number: "001",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "valida" as const,
    }]
    const spv = [{
      invoiceNumber: "FACT-001",
      spvStatus: "respinsa" as const,
      detectedAtISO: "2026-04-16T08:00:00Z",
    }]
    const disparities = reconcileErpVsSpv(erp, spv)
    expect(disparities.length).toBe(1)
    expect(disparities[0].type).toBe("erp_says_valid_spv_says_rejected")
    expect(disparities[0].severity).toBe("critical")
  })

  it("flagheaza ERP pending dar SPV valid (sync delay)", () => {
    const erp = [{
      source: "smartbill" as const,
      series: "FACT", number: "002",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "in_validare" as const,
    }]
    const spv = [{
      invoiceNumber: "FACT002",
      spvStatus: "valida" as const,
      detectedAtISO: "2026-04-16T08:00:00Z",
    }]
    const disparities = reconcileErpVsSpv(erp, spv)
    expect(disparities.length).toBe(1)
    expect(disparities[0].type).toBe("erp_says_pending_spv_says_valid")
    expect(disparities[0].severity).toBe("medium")
  })

  it("nu flagheaza când statusurile sunt consistente", () => {
    const erp = [{
      source: "oblio" as const,
      series: "FACT", number: "003",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "valida" as const,
    }]
    const spv = [{
      invoiceNumber: "FACT-003",
      spvStatus: "valida" as const,
      detectedAtISO: "2026-04-16T08:00:00Z",
    }]
    const disparities = reconcileErpVsSpv(erp, spv)
    expect(disparities.length).toBe(0)
  })

  it("flagheaza spv_has_invoice_erp_doesnt", () => {
    const erp = [{
      source: "smartbill" as const,
      series: "FACT", number: "001",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "valida" as const,
    }]
    const spv = [
      { invoiceNumber: "FACT-001", spvStatus: "valida" as const, detectedAtISO: "x" },
      { invoiceNumber: "GHOSTFACT-999", spvStatus: "valida" as const, detectedAtISO: "x" },
    ]
    const disparities = reconcileErpVsSpv(erp, spv)
    expect(disparities.some((d) => d.type === "spv_has_invoice_erp_doesnt")).toBe(true)
  })
})

describe("buildErpSpvDisparityFindings", () => {
  it("convertește disparitățile în ScanFinding[]", () => {
    const erp = [{
      source: "smartbill" as const,
      series: "FACT", number: "001",
      issueDate: "2026-04-15", total: 119,
      efacturaStatus: "valida" as const,
    }]
    const disp = reconcileErpVsSpv(erp, [])
    const findings = buildErpSpvDisparityFindings(disp, "2026-05-10T10:00:00Z")
    expect(findings.length).toBe(1)
    expect(findings[0].category).toBe("E_FACTURA")
    expect(findings[0].severity).toBe("critical")
    expect(findings[0].id).toContain("erp-spv-disparity")
  })
})
