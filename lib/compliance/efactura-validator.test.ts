import { describe, expect, it } from "vitest"

import { validateEFacturaXml } from "./efactura-validator"

const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:ro:cius</cbc:CustomizationID>
  <cbc:ProfileID>urn:ro:invoice:basic</cbc:ProfileID>
  <cbc:ID>INV-2026-0001</cbc:ID>
  <cbc:IssueDate>2026-03-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Furnizor Test SRL</cbc:RegistrationName>
        <cbc:CompanyID>RO12345678</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>42</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">190.00</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:TaxExclusiveAmount currencyID="RON">1000.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">1190.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">1190.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="H87">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="RON">1000.00</cbc:LineExtensionAmount>
  </cac:InvoiceLine>
</Invoice>`

describe("efactura-validator", () => {
  it("extrage numele si CUI-ul furnizorului si clientului din blocurile UBL", () => {
    const result = validateEFacturaXml({
      documentName: "valid.xml",
      xml: VALID_XML,
      nowISO: "2026-03-20T10:00:00.000Z",
    })

    expect(result.valid).toBe(true)
    expect(result.supplierName).toBe("Furnizor Test SRL")
    expect(result.supplierCui).toBe("RO12345678")
    expect(result.customerName).toBe("Client Test SRL")
    expect(result.customerCui).toBe("RO87654321")
  })

  it("B2B post-2026 (issueDate ≥ 2026-01-01): folosește 5 zile lucrătoare unificat (OUG 89/2025)", () => {
    const xmlB2B = VALID_XML.replace(
      "<cac:PartyLegalEntity>\n        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>\n        <cbc:CompanyID>RO87654321</cbc:CompanyID>\n      </cac:PartyLegalEntity>",
      `<cac:PartyTaxScheme>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
      </cac:PartyLegalEntity>`,
    )
    const result = validateEFacturaXml({
      documentName: "b2b.xml",
      xml: xmlB2B,
      nowISO: "2026-03-20T10:00:00.000Z",
    })
    expect(result.customerType).toBe("b2b")
    // Issue 2026-03-15 (duminică) → 5 zile lucrătoare = 16 (lu) 17 (ma) 18 (mi) 19 (jo) 20 (vi)
    expect(result.reportingDeadlineISO).toBe("2026-03-20T00:00:00.000Z")
    expect(result.warnings.some((w) => w.includes("OUG 89/2025"))).toBe(true)
  })

  it("B2B legacy (issueDate < 2026-01-01): 5 zile calendaristice", () => {
    // Issue date pre-2026 → legacy regime
    const xmlB2B = VALID_XML
      .replace("<cbc:IssueDate>2026-03-15</cbc:IssueDate>", "<cbc:IssueDate>2025-12-29</cbc:IssueDate>")
      .replace(
        "<cac:PartyLegalEntity>\n        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>\n        <cbc:CompanyID>RO87654321</cbc:CompanyID>\n      </cac:PartyLegalEntity>",
        `<cac:PartyTaxScheme>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
      </cac:PartyLegalEntity>`,
      )
    const result = validateEFacturaXml({
      documentName: "b2b-legacy.xml",
      xml: xmlB2B,
      nowISO: "2026-01-05T10:00:00.000Z",
    })
    expect(result.customerType).toBe("b2b")
    // 5 zile calendaristice: 2025-12-29 + 5 = 2026-01-03
    expect(result.reportingDeadlineISO).toBe("2026-01-03T00:00:00.000Z")
  })

  it("detectează B2C când customer-ul nu are PartyTaxScheme (persoană fizică)", () => {
    const xmlB2C = VALID_XML.replace(
      "<cac:PartyLegalEntity>\n        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>\n        <cbc:CompanyID>RO87654321</cbc:CompanyID>\n      </cac:PartyLegalEntity>",
      `<cac:PartyName><cbc:Name>Ionescu Ion</cbc:Name></cac:PartyName>`,
    )
    const result = validateEFacturaXml({
      documentName: "b2c.xml",
      xml: xmlB2C,
      nowISO: "2026-03-20T10:00:00.000Z",
    })
    expect(result.customerType).toBe("b2c")
    // 5 zile lucrătoare de la 2026-03-15 (duminică) → 16, 17, 18, 19, 20 (vineri) = 2026-03-20
    expect(result.reportingDeadlineISO).toBe("2026-03-20T00:00:00.000Z")
    expect(result.warnings.some((w) => w.includes("B2C"))).toBe(true)
  })

  it("B2C: termen 5 zile lucrătoare sare peste weekend", () => {
    // Luni 2026-03-30 → ma 31, mi 04-01, jo 04-02, vi 04-03, [sb/du] → lu 04-06 = 5th workday
    const xmlB2C = VALID_XML
      .replace("<cbc:IssueDate>2026-03-15</cbc:IssueDate>", "<cbc:IssueDate>2026-03-30</cbc:IssueDate>")
      .replace(
        "<cac:PartyLegalEntity>\n        <cbc:RegistrationName>Client Test SRL</cbc:RegistrationName>\n        <cbc:CompanyID>RO87654321</cbc:CompanyID>\n      </cac:PartyLegalEntity>",
        `<cac:PartyName><cbc:Name>Persoana Fizica</cbc:Name></cac:PartyName>`,
      )
    const result = validateEFacturaXml({
      documentName: "b2c-week.xml",
      xml: xmlB2C,
      nowISO: "2026-04-01T10:00:00.000Z",
    })
    expect(result.customerType).toBe("b2c")
    // Luni 30/03 + 5 zile lucrătoare (sare peste sâmbătă-duminică) = Luni 06/04
    expect(result.reportingDeadlineISO).toBe("2026-04-06T00:00:00.000Z")
  })

  it("B2C: detectează CNP (13 cifre) ca persoană fizică chiar dacă există PartyTaxScheme", () => {
    const xmlCnp = VALID_XML.replace(
      "<cbc:CompanyID>RO87654321</cbc:CompanyID>",
      "<cbc:CompanyID>1980101080011</cbc:CompanyID>",
    )
    const result = validateEFacturaXml({
      documentName: "cnp.xml",
      xml: xmlCnp,
      nowISO: "2026-03-20T10:00:00.000Z",
    })
    expect(result.customerType).toBe("b2c")
  })
})
