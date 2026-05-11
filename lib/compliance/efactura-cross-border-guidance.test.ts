import { describe, expect, it } from "vitest"
import {
  evaluateCrossBorderAdvisor,
  evaluateCrossBorderEfactura,
} from "./efactura-cross-border-guidance"

describe("evaluateCrossBorderEfactura", () => {
  it("RO → RO B2B → obligation", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "RO",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "services",
    })
    expect(r.efacturaObligation).toBe("obligation")
  })

  it("RO → DE B2B cu VAT valid → optional (livrare intracom)", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "goods",
    })
    expect(r.efacturaObligation).toBe("optional")
    expect(r.reasoning).toContain("intracom")
  })

  it("RO → DE B2C → optional cu mențiune OSS", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2c",
      customerHasEuVat: false,
      transactionKind: "goods",
    })
    expect(r.efacturaObligation).toBe("optional")
    expect(r.recommendedAction).toContain("OSS")
  })

  it("RO → US B2B (non-UE) → exempt cu export 0%", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "US",
      customerType: "b2b",
      customerHasEuVat: false,
      transactionKind: "goods",
    })
    expect(r.efacturaObligation).toBe("exempt")
    expect(r.reasoning).toContain("export")
  })

  it("DE → RO B2B → investigate (reverse charge la client RO)", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "DE",
      supplierVatRegistered: true,
      customerCountry: "RO",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "services",
    })
    expect(r.efacturaObligation).toBe("investigate")
    expect(r.recommendedAction).toContain("reverse charge")
  })

  it("US → RO B2B → exempt (import vamal)", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "US",
      supplierVatRegistered: false,
      customerCountry: "RO",
      customerType: "b2b",
      customerHasEuVat: false,
      transactionKind: "goods",
    })
    expect(r.efacturaObligation).toBe("exempt")
    expect(r.reasoning).toContain("import")
  })

  it("RO → UE B2B fără VAT-ID → obligation (TVA RO)", () => {
    const r = evaluateCrossBorderEfactura({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2b",
      customerHasEuVat: false,
      transactionKind: "services",
    })
    expect(r.efacturaObligation).toBe("obligation")
    expect(r.warnings.some((w) => w.includes("FĂRĂ VAT-ID"))).toBe(true)
  })
})

describe("evaluateCrossBorderAdvisor — Sprint 5 EXTEND", () => {
  it("RO → DE B2B cu VAT → include OUG 89/2025 note + D390 checklist", () => {
    const r = evaluateCrossBorderAdvisor({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "goods",
    })
    expect(r.oug89Note).toContain("OUG 89/2025")
    expect(r.documentationChecklist.some((c) => c.item.includes("D390"))).toBe(true)
    expect(r.externalChecks.some((c) => c.url?.includes("vies"))).toBe(true)
  })

  it("RO → DE B2C → checklist OSS + prag 10K", () => {
    const r = evaluateCrossBorderAdvisor({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2c",
      customerHasEuVat: false,
      transactionKind: "goods",
    })
    expect(r.documentationChecklist.some((c) => c.item.includes("OSS"))).toBe(true)
    expect(r.externalChecks.some((c) => c.label.includes("OSS"))).toBe(true)
  })

  it("Bunuri high-risk → adaugă checklist e-Transport UIT", () => {
    const r = evaluateCrossBorderAdvisor({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "DE",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "goods",
      isHighRiskGoods: true,
    })
    expect(r.documentationChecklist.some((c) => c.item.includes("UIT"))).toBe(true)
    expect(r.externalChecks.some((c) => c.url?.includes("etransport"))).toBe(true)
  })

  it("Export non-UE → checklist EX A + mențiune scutire export", () => {
    const r = evaluateCrossBorderAdvisor({
      supplierCountry: "RO",
      supplierVatRegistered: true,
      customerCountry: "US",
      customerType: "b2b",
      customerHasEuVat: false,
      transactionKind: "goods",
    })
    expect(r.documentationChecklist.some((c) => c.item.includes("EX A"))).toBe(true)
    expect(r.documentationChecklist.some((c) => /[Ss]cutire/.test(c.item))).toBe(true)
  })

  it("Reverse charge: import B2B din UE → checklist D300 rd. 28+31", () => {
    const r = evaluateCrossBorderAdvisor({
      supplierCountry: "DE",
      supplierVatRegistered: true,
      customerCountry: "RO",
      customerType: "b2b",
      customerHasEuVat: true,
      transactionKind: "services",
    })
    expect(r.documentationChecklist.some((c) => c.item.includes("reverse charge"))).toBe(true)
    expect(r.documentationChecklist.some((c) => c.item.includes("rd. 28"))).toBe(true)
  })
})
