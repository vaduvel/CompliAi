import { describe, expect, it } from "vitest"
import { evaluateCrossBorderEfactura } from "./efactura-cross-border-guidance"

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
