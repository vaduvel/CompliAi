import { describe, it, expect } from "vitest"
import {
  buildD300Draft,
  buildD394Draft,
  extractVatLinesFromSaft,
  type VatTransactionLine,
} from "./d300-assistant"

const NOW = "2026-05-10T10:00:00Z"

describe("buildD300Draft — calcule pe cote", () => {
  it("calculează corect TVA colectat pe cote standard / redusă / scutit", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 1000, vatAmount: 190, vatRate: 19 },
      { type: "collected", taxableBase: 200, vatAmount: 18, vatRate: 9 },
      { type: "collected", taxableBase: 100, vatAmount: 5, vatRate: 5 },
      { type: "collected", taxableBase: 500, vatAmount: 0, vatRate: 0, isIntraCommunity: true },
    ]
    const d300 = buildD300Draft("2026-04", lines, NOW)
    expect(d300.collected.standardRate.vatAmount).toBe(190)
    expect(d300.collected.reduced9.vatAmount).toBe(18)
    expect(d300.collected.reduced5.vatAmount).toBe(5)
    expect(d300.collected.zeroRate.taxableBase).toBe(500)
    expect(d300.totalCollectedVat).toBe(213)
  })

  it("calculează TVA deductibilă inclusiv intracomunitar", () => {
    const lines: VatTransactionLine[] = [
      { type: "deductible", taxableBase: 800, vatAmount: 152, vatRate: 19 },
      { type: "deductible", taxableBase: 300, vatAmount: 57, vatRate: 19, isIntraCommunity: true },
    ]
    const d300 = buildD300Draft("2026-04", lines, NOW)
    expect(d300.deductible.standardRate.vatAmount).toBe(152)
    expect(d300.deductible.intraCommunity.vatAmount).toBe(57)
    expect(d300.totalDeductibleVat).toBe(209)
  })

  it("calculează vatToPay vs vatToReturn", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 1000, vatAmount: 190, vatRate: 19 },
      { type: "deductible", taxableBase: 500, vatAmount: 95, vatRate: 19 },
    ]
    const d300 = buildD300Draft("2026-04", lines, NOW)
    expect(d300.vatToPay).toBe(95)
    expect(d300.vatToReturn).toBe(0)
  })

  it("flagheaza vatToReturn când TVA dedusă > TVA colectată", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 100, vatAmount: 19, vatRate: 19 },
      { type: "deductible", taxableBase: 1000, vatAmount: 190, vatRate: 19 },
    ]
    const d300 = buildD300Draft("2026-04", lines, NOW)
    expect(d300.vatToPay).toBe(0)
    expect(d300.vatToReturn).toBe(171)
  })

  it("warning pentru tranzacții fără cotă cunoscută", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 100, vatAmount: 0, vatRate: 17 },  // cotă inventată
    ]
    const d300 = buildD300Draft("2026-04", lines, NOW)
    expect(d300.warnings.some((w) => w.includes("cotă VAT necunoscută"))).toBe(true)
  })
})

describe("extractVatLinesFromSaft — edge cases", () => {
  it("returnează listă goală pentru XML gol / invalid", () => {
    expect(extractVatLinesFromSaft("")).toEqual([])
    expect(extractVatLinesFromSaft("not xml at all")).toEqual([])
    expect(extractVatLinesFromSaft("<invalid><but>still</but></invalid>")).toEqual([])
  })

  it("nu cade pe XML cu blocuri SourceDocuments goale", () => {
    const xml = `<?xml version="1.0"?><AuditFile><SourceDocuments><SalesInvoices></SalesInvoices><PurchaseInvoices></PurchaseInvoices></SourceDocuments></AuditFile>`
    expect(extractVatLinesFromSaft(xml)).toEqual([])
  })

  it("ignoră facturi fără TaxAmount sau DebitAmount (date corupte)", () => {
    const xml = `<?xml version="1.0"?><AuditFile><SourceDocuments><SalesInvoices><Invoice><InvoiceNo>F1</InvoiceNo></Invoice></SalesInvoices></SourceDocuments></AuditFile>`
    const lines = extractVatLinesFromSaft(xml)
    expect(lines).toHaveLength(1)
    // Linia există dar cu zero — buildD300Draft le tratează cu default-uri
    expect(lines[0].taxableBase).toBe(0)
    expect(lines[0].vatAmount).toBe(0)
  })

  it("acceptă namespace-uri arbitrare (mfp:, ns0:, fără prefix)", () => {
    const withPrefix = `<?xml version="1.0"?><mfp:AuditFile xmlns:mfp="x"><mfp:SourceDocuments><mfp:SalesInvoices><mfp:Invoice><mfp:InvoiceNo>F1</mfp:InvoiceNo><mfp:DebitAmount>1000</mfp:DebitAmount><mfp:TaxAmount>190</mfp:TaxAmount><mfp:TaxPercentage>19</mfp:TaxPercentage></mfp:Invoice></mfp:SalesInvoices></mfp:SourceDocuments></mfp:AuditFile>`
    const lines = extractVatLinesFromSaft(withPrefix)
    expect(lines).toHaveLength(1)
    expect(lines[0].taxableBase).toBe(1000)
    expect(lines[0].vatAmount).toBe(190)
  })

  it("performanță: 1000 facturi parsează sub 500ms", () => {
    const invoices = Array.from(
      { length: 1000 },
      (_, i) =>
        `<Invoice><InvoiceNo>F${i}</InvoiceNo><DebitAmount>${100 + i}</DebitAmount><TaxAmount>${(100 + i) * 0.19}</TaxAmount><TaxPercentage>19</TaxPercentage><TaxCountryRegion>RO</TaxCountryRegion></Invoice>`,
    ).join("")
    const xml = `<?xml version="1.0"?><AuditFile><SourceDocuments><SalesInvoices>${invoices}</SalesInvoices></SourceDocuments></AuditFile>`
    const start = Date.now()
    const lines = extractVatLinesFromSaft(xml)
    const elapsed = Date.now() - start
    expect(lines).toHaveLength(1000)
    expect(elapsed).toBeLessThan(500)
  })
})

describe("buildD394Draft", () => {
  it("agregă achiziții și livrări locale per partener", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 1000, vatAmount: 190, vatRate: 19, partyTaxId: "RO12345678", partyName: "Client A" },
      { type: "collected", taxableBase: 500, vatAmount: 95, vatRate: 19, partyTaxId: "RO12345678", partyName: "Client A" },
      { type: "deductible", taxableBase: 200, vatAmount: 38, vatRate: 19, partyTaxId: "RO87654321", partyName: "Furnizor B" },
    ]
    const d394 = buildD394Draft("2026-04", lines, NOW)
    expect(d394.livrari.length).toBe(1)
    expect(d394.livrari[0].invoiceCount).toBe(2)
    expect(d394.livrari[0].taxableBase).toBe(1500)
    expect(d394.livrari[0].vatAmount).toBe(285)
    expect(d394.achizitii.length).toBe(1)
    expect(d394.totalLivrari.partnerCount).toBe(1)
    expect(d394.totalAchizitii.partnerCount).toBe(1)
  })

  it("ignoră tranzacții intracom UE și export (zero rate)", () => {
    const lines: VatTransactionLine[] = [
      { type: "collected", taxableBase: 1000, vatAmount: 0, vatRate: 0, isIntraCommunity: true, partyTaxId: "DE123" },
      { type: "collected", taxableBase: 500, vatAmount: 95, vatRate: 19, partyTaxId: "RO11111111", partyName: "Client local" },
    ]
    const d394 = buildD394Draft("2026-04", lines, NOW)
    expect(d394.livrari.length).toBe(1)  // doar local
    expect(d394.livrari[0].partyTaxId).toBe("11111111")
  })
})

describe("extractVatLinesFromSaft", () => {
  it("extrage tranzacții din SalesInvoices și PurchaseInvoices", () => {
    const saft = `<?xml version="1.0"?>
<AuditFile>
  <SourceDocuments>
    <SalesInvoices>
      <Invoice>
        <InvoiceNo>FACT-001</InvoiceNo>
        <InvoiceDate>2026-04-15</InvoiceDate>
        <CustomerID>RO12345678</CustomerID>
        <CompanyName>Client A</CompanyName>
        <TaxableAmount>1000</TaxableAmount>
        <TaxAmount>190</TaxAmount>
        <TaxPercentage>19</TaxPercentage>
      </Invoice>
    </SalesInvoices>
    <PurchaseInvoices>
      <Invoice>
        <InvoiceNo>FURN-001</InvoiceNo>
        <SupplierID>RO99999999</SupplierID>
        <TaxableAmount>500</TaxableAmount>
        <TaxAmount>95</TaxAmount>
        <TaxPercentage>19</TaxPercentage>
      </Invoice>
    </PurchaseInvoices>
  </SourceDocuments>
</AuditFile>`
    const lines = extractVatLinesFromSaft(saft)
    expect(lines.length).toBe(2)
    expect(lines[0].type).toBe("collected")
    expect(lines[0].vatAmount).toBe(190)
    expect(lines[1].type).toBe("deductible")
    expect(lines[1].vatAmount).toBe(95)
  })
})
