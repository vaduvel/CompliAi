import { describe, it, expect } from "vitest"
import JSZip from "jszip"

import { processEFacturaZip } from "./efactura-bulk-zip"

const VALID_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>FAC-2026-001</cbc:ID>
  <cbc:IssueDate>2026-04-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO12345678</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO87654321</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">19.00</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="RON">119.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:LineExtensionAmount currencyID="RON">100.00</cbc:LineExtensionAmount>
  </cac:InvoiceLine>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
</Invoice>`

const INVALID_XML = `<NotInvoice><x>broken</x></NotInvoice>`

const NOW = "2026-05-09T10:00:00.000Z"

async function buildZip(files: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content)
  }
  return zip.generateAsync({ type: "arraybuffer" })
}

describe("processEFacturaZip — happy path", () => {
  it("validates a small ZIP with 2 valid invoices", async () => {
    const buf = await buildZip({
      "invoice-1.xml": VALID_INVOICE_XML,
      "invoice-2.xml": VALID_INVOICE_XML.replace("FAC-2026-001", "FAC-2026-002"),
    })
    const summary = await processEFacturaZip(buf, NOW)

    expect(summary.totalFiles).toBe(2)
    expect(summary.xmlFiles).toBe(2)
    expect(summary.validCount).toBe(2)
    expect(summary.invalidCount).toBe(0)
    expect(summary.errorCount).toBe(0)
    expect(summary.results).toHaveLength(2)
    expect(summary.results.every((r) => r.valid)).toBe(true)
  })

  it("reports invalid XMLs separately", async () => {
    const buf = await buildZip({
      "good.xml": VALID_INVOICE_XML,
      "bad.xml": INVALID_XML,
    })
    const summary = await processEFacturaZip(buf, NOW)

    expect(summary.validCount).toBe(1)
    expect(summary.invalidCount).toBe(1)
    expect(summary.errorCount).toBe(0)
  })
})

describe("processEFacturaZip — non-XML and excluded files", () => {
  it("skips non-XML files and __MACOSX entries", async () => {
    const buf = await buildZip({
      "invoice.xml": VALID_INVOICE_XML,
      "readme.txt": "ignore me",
      "__MACOSX/._invoice.xml": "spotlight metadata",
    })
    const summary = await processEFacturaZip(buf, NOW)

    expect(summary.totalFiles).toBe(3)
    expect(summary.xmlFiles).toBe(1)
    expect(summary.skippedFiles).toBe(2)
    expect(summary.validCount).toBe(1)
  })
})

describe("processEFacturaZip — large batch", () => {
  it("handles 50 invoices in parallel", async () => {
    const files: Record<string, string> = {}
    for (let i = 0; i < 50; i++) {
      files[`invoice-${String(i).padStart(3, "0")}.xml`] = VALID_INVOICE_XML.replace(
        "FAC-2026-001",
        `FAC-2026-${String(i).padStart(3, "0")}`,
      )
    }
    const buf = await buildZip(files)
    const summary = await processEFacturaZip(buf, NOW)

    expect(summary.xmlFiles).toBe(50)
    expect(summary.validCount).toBe(50)
    expect(summary.results.length).toBe(50)
  }, 15000)
})

describe("processEFacturaZip — empty / corrupt", () => {
  it("returns 0 files for empty ZIP", async () => {
    const buf = await buildZip({})
    const summary = await processEFacturaZip(buf, NOW)

    expect(summary.totalFiles).toBe(0)
    expect(summary.xmlFiles).toBe(0)
    expect(summary.validCount).toBe(0)
  })

  it("throws for corrupt input", async () => {
    const corrupt = new TextEncoder().encode("this is not a zip file at all")
    await expect(processEFacturaZip(corrupt.buffer, NOW)).rejects.toThrow()
  })
})
