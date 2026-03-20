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
})
