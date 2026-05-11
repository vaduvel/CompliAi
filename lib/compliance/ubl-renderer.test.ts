import { describe, expect, it } from "vitest"

import { parseUblInvoice, renderUblXmlAsHtml } from "./ubl-renderer"

const SAMPLE_INVOICE = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>F2026-100</cbc:ID>
  <cbc:IssueDate>2026-05-11</cbc:IssueDate>
  <cbc:DueDate>2026-06-10</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PostalAddress>
      <cbc:StreetName>Strada Test 1</cbc:StreetName>
      <cbc:CityName>SECTOR1</cbc:CityName>
      <cbc:CountrySubentity>RO-B</cbc:CountrySubentity>
      <cac:Country><cbc:IdentificationCode>RO</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    <cac:PartyTaxScheme>
      <cbc:CompanyID>RO45758405</cbc:CompanyID>
      <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
    </cac:PartyTaxScheme>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>Marketing Growth Hub SRL</cbc:RegistrationName>
      <cbc:CompanyID>RO45758405</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party>
    <cac:PostalAddress>
      <cbc:StreetName>Strada Client 1</cbc:StreetName>
      <cbc:CityName>SECTOR2</cbc:CityName>
      <cbc:CountrySubentity>RO-B</cbc:CountrySubentity>
      <cac:Country><cbc:IdentificationCode>RO</cbc:IdentificationCode></cac:Country>
    </cac:PostalAddress>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>
      <cbc:CompanyID>RO87654321</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party></cac:AccountingCustomerParty>
  <cac:PaymentMeans><cbc:PaymentMeansCode>42</cbc:PaymentMeansCode></cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">19.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="RON">100.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="RON">19.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="RON">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="RON">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">119.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">119.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="H87">2</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="RON">100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Serviciu IT</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID><cbc:Percent>19</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="RON">50.00</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`

describe("parseUblInvoice", () => {
  it("extracts header fields from a CIUS-RO invoice", () => {
    const result = parseUblInvoice(SAMPLE_INVOICE)
    expect(result.isCreditNote).toBe(false)
    expect(result.invoiceNumber).toBe("F2026-100")
    expect(result.issueDate).toBe("2026-05-11")
    expect(result.dueDate).toBe("2026-06-10")
    expect(result.invoiceTypeCode).toBe("380")
    expect(result.currency).toBe("RON")
    expect(result.paymentMeansCode).toBe("42")
  })

  it("extracts both parties with address + taxId", () => {
    const result = parseUblInvoice(SAMPLE_INVOICE)
    expect(result.supplier.registrationName).toBe("Marketing Growth Hub SRL")
    expect(result.supplier.taxId).toBe("RO45758405")
    expect(result.supplier.city).toBe("SECTOR1")
    expect(result.supplier.countryCode).toBe("RO")
    expect(result.customer.registrationName).toBe("Client Test SRL")
    expect(result.customer.legalId).toBe("RO87654321")
    expect(result.customer.city).toBe("SECTOR2")
  })

  it("extracts invoice lines with items, prices and VAT category", () => {
    const result = parseUblInvoice(SAMPLE_INVOICE)
    expect(result.lines).toHaveLength(1)
    const line = result.lines[0]!
    expect(line.itemName).toBe("Serviciu IT")
    expect(line.quantity).toBe(2)
    expect(line.unitCode).toBe("H87")
    expect(line.unitPrice).toBe(50)
    expect(line.netAmount).toBe(100)
    expect(line.vatPercent).toBe(19)
    expect(line.vatCategoryId).toBe("S")
  })

  it("extracts monetary totals", () => {
    const result = parseUblInvoice(SAMPLE_INVOICE)
    expect(result.totals.lineExtensionAmount).toBe(100)
    expect(result.totals.taxExclusiveAmount).toBe(100)
    expect(result.totals.taxAmount).toBe(19)
    expect(result.totals.taxInclusiveAmount).toBe(119)
    expect(result.totals.payableAmount).toBe(119)
  })

  it("detects CreditNote root and uses CreditNoteLine", () => {
    const cn = SAMPLE_INVOICE
      .replace(/Invoice xmlns=/g, "CreditNote xmlns=")
      .replace(/<\/Invoice>/g, "</CreditNote>")
      .replace(/InvoiceLine/g, "CreditNoteLine")
      .replace(/InvoicedQuantity/g, "CreditedQuantity")
    const result = parseUblInvoice(cn)
    expect(result.isCreditNote).toBe(true)
    expect(result.lines).toHaveLength(1)
  })
})

describe("renderUblXmlAsHtml", () => {
  it("renders a printable HTML document", () => {
    const html = renderUblXmlAsHtml(SAMPLE_INVOICE)
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("F2026-100")
    expect(html).toContain("Marketing Growth Hub SRL")
    expect(html).toContain("Client Test SRL")
    expect(html).toContain("Serviciu IT")
    expect(html).toContain("119.00 RON")
  })

  it("escapes HTML in user-controlled fields", () => {
    const malicious = SAMPLE_INVOICE.replace(
      "Marketing Growth Hub SRL",
      "<script>alert('x')</script>",
    )
    const html = renderUblXmlAsHtml(malicious)
    expect(html).not.toContain("<script>alert")
    expect(html).toContain("&lt;script&gt;")
  })
})
