import { describe, expect, it } from "vitest"

import { validateEFacturaXml } from "./efactura-validator"

function buildInvoice(opts: {
  lineCategoryId: string
  linePercent: string
  taxSubtotalId: string
  taxSubtotalPercent: string
  taxAmount: string
  taxableAmount: string
  exemptionReasonCode?: string
  exemptionReason?: string
}): string {
  const exemptionXml = opts.exemptionReasonCode
    ? `<cbc:TaxExemptionReasonCode>${opts.exemptionReasonCode}</cbc:TaxExemptionReasonCode>`
    : opts.exemptionReason
      ? `<cbc:TaxExemptionReason>${opts.exemptionReason}</cbc:TaxExemptionReason>`
      : ""
  return `<?xml version="1.0"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>VAT-T-1</cbc:ID>
  <cbc:IssueDate>2026-05-11</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PostalAddress>
      <cbc:StreetName>X 1</cbc:StreetName>
      <cbc:CityName>SECTOR1</cbc:CityName>
      <cbc:CountrySubentity>RO-B</cbc:CountrySubentity>
      <cac:Country><cbc:IdentificationCode>RO</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    <cac:PartyTaxScheme>
      <cbc:CompanyID>RO12345678</cbc:CompanyID>
      <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
    </cac:PartyTaxScheme>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>X SRL</cbc:RegistrationName>
      <cbc:CompanyID>RO12345678</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party>
    <cac:PostalAddress>
      <cbc:StreetName>Y 1</cbc:StreetName>
      <cbc:CityName>SECTOR2</cbc:CityName>
      <cbc:CountrySubentity>RO-B</cbc:CountrySubentity>
      <cac:Country><cbc:IdentificationCode>RO</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>Y SRL</cbc:RegistrationName>
      <cbc:CompanyID>RO87654321</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">${opts.taxAmount}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="RON">${opts.taxableAmount}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="RON">${opts.taxAmount}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${opts.taxSubtotalId}</cbc:ID>
        <cbc:Percent>${opts.taxSubtotalPercent}</cbc:Percent>
        ${exemptionXml}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="RON">${opts.taxableAmount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="RON">${opts.taxableAmount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">${(Number.parseFloat(opts.taxableAmount) + Number.parseFloat(opts.taxAmount)).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">${(Number.parseFloat(opts.taxableAmount) + Number.parseFloat(opts.taxAmount)).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="RON">${opts.taxableAmount}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Test</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${opts.lineCategoryId}</cbc:ID>
        <cbc:Percent>${opts.linePercent}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="RON">${opts.taxableAmount}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`
}

describe("VAT category families (V033-V038)", () => {
  it("V034 BR-S: rejects standard rate (S) with 0% percent", () => {
    const xml = buildInvoice({
      lineCategoryId: "S",
      linePercent: "0",
      taxSubtotalId: "S",
      taxSubtotalPercent: "0",
      taxAmount: "0.00",
      taxableAmount: "100.00",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes("V034") && e.includes("standard rate trebuie > 0"))).toBe(
      true,
    )
  })

  it("V035 BR-Z: rejects zero-rate category Z with non-zero percent", () => {
    const xml = buildInvoice({
      lineCategoryId: "Z",
      linePercent: "9",
      taxSubtotalId: "Z",
      taxSubtotalPercent: "9",
      taxAmount: "9.00",
      taxableAmount: "100.00",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.errors.some((e) => e.includes("V035") && e.includes("Z"))).toBe(true)
  })

  it("V036 BR-AE: requires TaxExemptionReason for AE category", () => {
    const xml = buildInvoice({
      lineCategoryId: "AE",
      linePercent: "0",
      taxSubtotalId: "AE",
      taxSubtotalPercent: "0",
      taxAmount: "0.00",
      taxableAmount: "100.00",
      // no exemption reason
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.errors.some((e) => e.includes("V036") && e.includes("TaxExemptionReason"))).toBe(true)
  })

  it("V037 BR-AE-09: AE TaxSubtotal must have TaxAmount=0", () => {
    const xml = buildInvoice({
      lineCategoryId: "AE",
      linePercent: "0",
      taxSubtotalId: "AE",
      taxSubtotalPercent: "0",
      taxAmount: "19.00",
      taxableAmount: "100.00",
      exemptionReasonCode: "VATEX-EU-AE",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(
      r.errors.some((e) => e.includes("V037") && e.includes("AE") && e.includes("TaxAmount=0")),
    ).toBe(true)
  })

  it("V038 BR-IC-11: K category TaxAmount must be 0", () => {
    const xml = buildInvoice({
      lineCategoryId: "K",
      linePercent: "0",
      taxSubtotalId: "K",
      taxSubtotalPercent: "0",
      taxAmount: "5.00",
      taxableAmount: "100.00",
      exemptionReasonCode: "VATEX-EU-IC",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.errors.some((e) => e.includes("V038") && e.includes("K"))).toBe(true)
  })

  it("accepts a valid standard 19% invoice", () => {
    const xml = buildInvoice({
      lineCategoryId: "S",
      linePercent: "19",
      taxSubtotalId: "S",
      taxSubtotalPercent: "19",
      taxAmount: "19.00",
      taxableAmount: "100.00",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.errors.filter((e) => /V03[3-8]/.test(e))).toEqual([])
  })

  it("accepts a valid AE reverse-charge invoice", () => {
    const xml = buildInvoice({
      lineCategoryId: "AE",
      linePercent: "0",
      taxSubtotalId: "AE",
      taxSubtotalPercent: "0",
      taxAmount: "0.00",
      taxableAmount: "100.00",
      exemptionReasonCode: "VATEX-EU-AE",
    })
    const r = validateEFacturaXml({ documentName: "x", xml, nowISO: "2026-05-11T10:00:00.000Z" })
    expect(r.errors.filter((e) => /V03[3-8]/.test(e))).toEqual([])
  })
})
