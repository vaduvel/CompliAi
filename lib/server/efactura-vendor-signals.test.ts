import { describe, expect, it } from "vitest"

import {
  buildVendorPrefillSignal,
  collectSupplierImports,
  enrichOrgProfilePrefillWithVendorSignals,
} from "@/lib/server/efactura-vendor-signals"

describe("efactura-vendor-signals", () => {
  it("agrega furnizorii pe CUI si numara validările", () => {
    const suppliers = collectSupplierImports([
      { supplierName: "Amazon Web Services EMEA SARL", supplierCui: "RO12345678" },
      { supplierName: "AWS EMEA", supplierCui: "RO12345678" },
      { supplierName: "Microsoft Ireland Operations Limited" },
    ])

    expect(suppliers).toEqual([
      {
        name: "Amazon Web Services EMEA SARL",
        cui: "RO12345678",
        invoiceCount: 2,
      },
      {
        name: "Microsoft Ireland Operations Limited",
        invoiceCount: 1,
      },
    ])
  })

  it("construiește un semnal de vendor cu încredere mare", () => {
    const result = buildVendorPrefillSignal([
      { supplierName: "Amazon Web Services EMEA SARL", supplierCui: "RO12345678" },
      { supplierName: "Microsoft Ireland Operations Limited" },
      { supplierName: "Microsoft Ireland Operations Limited" },
    ])

    expect(result.suggestion).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "efactura_validations",
      })
    )
    expect(result.vendorSignals).toEqual({
      source: "efactura_validations",
      vendorCount: 2,
      invoiceCount: 3,
      topVendors: ["Microsoft Ireland Operations Limited", "Amazon Web Services EMEA SARL"],
    })
  })

  it("îmbogățește prefill-ul ANAF cu semnalul vendor când există validări e-Factura", () => {
    const enriched = enrichOrgProfilePrefillWithVendorSignals(
      {
        source: "anaf_vat_registry",
        fetchedAtISO: "2026-03-20T10:00:00.000Z",
        normalizedCui: "RO14399840",
        companyName: "DANTE INTERNATIONAL SA",
        address: "BUCURESTI",
        legalForm: "SA",
        mainCaen: "4754",
        caenDescription: null,
        fiscalStatus: "INREGISTRAT",
        vatRegistered: true,
        vatOnCashAccounting: false,
        efacturaRegistered: true,
        inactive: false,
        suggestions: {},
      },
      [{ supplierName: "Amazon Web Services EMEA SARL", supplierCui: "RO12345678" }]
    )

    expect(enriched?.suggestions.usesExternalVendors).toEqual(
      expect.objectContaining({
        value: true,
        confidence: "high",
        source: "efactura_validations",
      })
    )
    expect(enriched?.vendorSignals?.topVendors).toEqual(["Amazon Web Services EMEA SARL"])
  })
})
