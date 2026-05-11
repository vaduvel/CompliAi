// UBL CIUS-RO → structured object → printable HTML.
// SPV inbox delivers raw UBL XML; accountants cannot read it without a tool.
// arhivaspv.ro and ispv.ro are entire RO SaaS built on this single pain plus
// ANAF maintains anaf.ro/uploadxml/ converter. Commodity, but table stakes.
// Pure-text HTML render; client-side print-to-PDF or wkhtmltopdf at edge.

export type UblParsedLine = {
  id: string
  itemName: string
  itemDescription: string | null
  quantity: number
  unitCode: string
  unitPrice: number | null
  netAmount: number
  vatPercent: number | null
  vatCategoryId: string | null
}

export type UblParsedParty = {
  registrationName: string
  taxId: string | null
  legalId: string | null
  street: string | null
  city: string | null
  countrySubentity: string | null
  countryCode: string | null
}

export type UblParsedInvoice = {
  isCreditNote: boolean
  invoiceNumber: string
  issueDate: string
  dueDate: string | null
  invoiceTypeCode: string | null
  currency: string
  supplier: UblParsedParty
  customer: UblParsedParty
  lines: UblParsedLine[]
  totals: {
    lineExtensionAmount: number | null
    taxExclusiveAmount: number | null
    taxAmount: number | null
    taxInclusiveAmount: number | null
    allowanceTotal: number | null
    chargeTotal: number | null
    payableAmount: number | null
  }
  paymentMeansCode: string | null
  taxExemptionReason: string | null
}

function readTag(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = xml.match(
    new RegExp(
      `<(?:(?:\\w|-)+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escaped}>`,
      "i",
    ),
  )
  return m?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? ""
}

function readBlock(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = xml.match(
    new RegExp(
      `<(?:(?:\\w|-)+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escaped}>`,
      "i",
    ),
  )
  return m?.[1] ?? ""
}

function readAllBlocks(xml: string, tag: string): string[] {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return Array.from(
    xml.matchAll(
      new RegExp(
        `<(?:(?:\\w|-)+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escaped}>`,
        "gi",
      ),
    ),
  ).map((m) => m[1] ?? "")
}

function readAttr(xml: string, tag: string, attr: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = xml.match(new RegExp(`<(?:(?:\\w|-)+:)?${escaped}[^>]*${attr}="([^"]*)"`, "i"))
  return m?.[1] ?? ""
}

function toNumber(value: string): number | null {
  if (!value) return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

function parseParty(partyXml: string): UblParsedParty {
  const legal = readBlock(partyXml, "PartyLegalEntity")
  const tax = readBlock(partyXml, "PartyTaxScheme")
  const address = readBlock(partyXml, "PostalAddress")
  return {
    registrationName: readTag(legal, "RegistrationName") || readTag(partyXml, "Name"),
    taxId: readTag(tax, "CompanyID") || null,
    legalId: readTag(legal, "CompanyID") || null,
    street: readTag(address, "StreetName") || null,
    city: readTag(address, "CityName") || null,
    countrySubentity: readTag(address, "CountrySubentity") || null,
    countryCode: readTag(readBlock(address, "Country"), "IdentificationCode") || null,
  }
}

function parseLine(lineXml: string, isCreditNote: boolean): UblParsedLine {
  const item = readBlock(lineXml, "Item")
  const price = readBlock(lineXml, "Price")
  const tax = readBlock(item, "ClassifiedTaxCategory")
  const quantityValue =
    readTag(lineXml, isCreditNote ? "CreditedQuantity" : "InvoicedQuantity") || "0"
  const unitCode =
    readAttr(lineXml, isCreditNote ? "CreditedQuantity" : "InvoicedQuantity", "unitCode") || "C62"
  return {
    id: readTag(lineXml, "ID"),
    itemName: readTag(item, "Name") || "(fără nume produs)",
    itemDescription: readTag(item, "Description") || null,
    quantity: toNumber(quantityValue) ?? 0,
    unitCode,
    unitPrice: toNumber(readTag(price, "PriceAmount")),
    netAmount: toNumber(readTag(lineXml, "LineExtensionAmount")) ?? 0,
    vatPercent: toNumber(readTag(tax, "Percent")),
    vatCategoryId: readTag(tax, "ID") || null,
  }
}

export function parseUblInvoice(xml: string): UblParsedInvoice {
  const isCreditNote = /<(?:[\w-]+:)?CreditNote[\s>]/i.test(xml)
  const supplierBlock = readBlock(xml, "AccountingSupplierParty")
  const customerBlock = readBlock(xml, "AccountingCustomerParty")
  const totalsBlock = readBlock(xml, "LegalMonetaryTotal")
  const taxBlock = readBlock(xml, "TaxTotal")
  const taxSubtotal = readBlock(taxBlock, "TaxSubtotal")
  const taxCategory = readBlock(taxSubtotal, "TaxCategory")

  const lineBlocks = readAllBlocks(xml, isCreditNote ? "CreditNoteLine" : "InvoiceLine")

  return {
    isCreditNote,
    invoiceNumber: readTag(xml, "ID"),
    issueDate: readTag(xml, "IssueDate"),
    dueDate: readTag(xml, "DueDate") || null,
    invoiceTypeCode: isCreditNote
      ? readTag(xml, "CreditNoteTypeCode") || null
      : readTag(xml, "InvoiceTypeCode") || null,
    currency: readTag(xml, "DocumentCurrencyCode") || "RON",
    supplier: parseParty(readBlock(supplierBlock, "Party")),
    customer: parseParty(readBlock(customerBlock, "Party")),
    lines: lineBlocks.map((b) => parseLine(b, isCreditNote)),
    totals: {
      lineExtensionAmount: toNumber(readTag(totalsBlock, "LineExtensionAmount")),
      taxExclusiveAmount: toNumber(readTag(totalsBlock, "TaxExclusiveAmount")),
      taxAmount: toNumber(readTag(taxBlock, "TaxAmount")),
      taxInclusiveAmount: toNumber(readTag(totalsBlock, "TaxInclusiveAmount")),
      allowanceTotal: toNumber(readTag(totalsBlock, "AllowanceTotalAmount")),
      chargeTotal: toNumber(readTag(totalsBlock, "ChargeTotalAmount")),
      payableAmount: toNumber(readTag(totalsBlock, "PayableAmount")),
    },
    paymentMeansCode: readTag(readBlock(xml, "PaymentMeans"), "PaymentMeansCode") || null,
    taxExemptionReason: readTag(taxCategory, "TaxExemptionReason") || null,
  }
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return "—"
  return `${amount.toFixed(2)} ${escapeHtml(currency)}`
}

function partyHtml(party: UblParsedParty, label: string): string {
  const addressBits = [party.street, party.city, party.countrySubentity, party.countryCode]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ")
  return `
    <section class="party">
      <h3>${escapeHtml(label)}</h3>
      <p><strong>${escapeHtml(party.registrationName)}</strong></p>
      ${party.taxId ? `<p>CIF: ${escapeHtml(party.taxId)}</p>` : ""}
      ${party.legalId && party.legalId !== party.taxId ? `<p>Reg. comerț: ${escapeHtml(party.legalId)}</p>` : ""}
      ${addressBits ? `<p>${addressBits}</p>` : ""}
    </section>
  `
}

function lineRow(line: UblParsedLine, currency: string): string {
  return `
    <tr>
      <td>${escapeHtml(line.id)}</td>
      <td>${escapeHtml(line.itemName)}${line.itemDescription ? `<br/><small>${escapeHtml(line.itemDescription)}</small>` : ""}</td>
      <td class="num">${line.quantity} ${escapeHtml(line.unitCode)}</td>
      <td class="num">${formatMoney(line.unitPrice, currency)}</td>
      <td class="num">${line.vatPercent !== null ? `${line.vatPercent}% ${escapeHtml(line.vatCategoryId || "")}` : "—"}</td>
      <td class="num"><strong>${formatMoney(line.netAmount, currency)}</strong></td>
    </tr>
  `
}

export function renderUblInvoiceAsHtml(invoice: UblParsedInvoice): string {
  const currency = invoice.currency
  const docKind = invoice.isCreditNote ? "Notă de credit" : "Factură"
  const linesHtml = invoice.lines.map((l) => lineRow(l, currency)).join("")

  return `<!DOCTYPE html>
<html lang="ro"><head>
<meta charset="utf-8"/>
<title>${escapeHtml(docKind)} ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 32px; }
  h1 { margin: 0 0 8px; font-size: 22px; }
  h3 { margin: 16px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
  .meta { display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px; color: #333; }
  .meta div { min-width: 120px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
  .party { padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; }
  .party p { margin: 4px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 16px; display: grid; grid-template-columns: 1fr 200px; }
  .totals dl { display: contents; }
  .totals dt { padding: 6px 0; color: #555; }
  .totals dd { padding: 6px 0; text-align: right; margin: 0; font-variant-numeric: tabular-nums; }
  .totals .grand { font-weight: 600; font-size: 16px; border-top: 2px solid #111; padding-top: 12px; }
  .footer { margin-top: 32px; font-size: 11px; color: #888; }
</style>
</head><body>
<h1>${escapeHtml(docKind)} ${escapeHtml(invoice.invoiceNumber)}</h1>
<div class="meta">
  <div><strong>Emitere:</strong> ${escapeHtml(invoice.issueDate)}</div>
  ${invoice.dueDate ? `<div><strong>Scadență:</strong> ${escapeHtml(invoice.dueDate)}</div>` : ""}
  <div><strong>Tip:</strong> ${escapeHtml(invoice.invoiceTypeCode ?? "—")}</div>
  <div><strong>Monedă:</strong> ${escapeHtml(invoice.currency)}</div>
</div>
<div class="parties">
  ${partyHtml(invoice.supplier, "Furnizor")}
  ${partyHtml(invoice.customer, "Client")}
</div>
<table>
  <thead><tr>
    <th>#</th><th>Produs / serviciu</th><th class="num">Cantitate</th>
    <th class="num">Preț unitar</th><th class="num">TVA</th><th class="num">Total fără TVA</th>
  </tr></thead>
  <tbody>${linesHtml}</tbody>
</table>
<div class="totals">
  <dl>
    <dt>Subtotal linii (BT-106)</dt><dd>${formatMoney(invoice.totals.lineExtensionAmount, currency)}</dd>
    ${invoice.totals.allowanceTotal !== null ? `<dt>Reduceri document (BT-107)</dt><dd>− ${formatMoney(invoice.totals.allowanceTotal, currency)}</dd>` : ""}
    ${invoice.totals.chargeTotal !== null ? `<dt>Suprataxe document (BT-108)</dt><dd>+ ${formatMoney(invoice.totals.chargeTotal, currency)}</dd>` : ""}
    <dt>Total fără TVA (BT-109)</dt><dd>${formatMoney(invoice.totals.taxExclusiveAmount, currency)}</dd>
    <dt>TVA (BT-110)</dt><dd>${formatMoney(invoice.totals.taxAmount, currency)}</dd>
    <dt class="grand">Total de plată (BT-115)</dt><dd class="grand">${formatMoney(invoice.totals.payableAmount, currency)}</dd>
  </dl>
</div>
${invoice.taxExemptionReason ? `<p style="margin-top:16px"><em>Notă fiscală:</em> ${escapeHtml(invoice.taxExemptionReason)}</p>` : ""}
<div class="footer">
  Generat de CompliScan din XML UBL CIUS-RO. Conținut neoficial — sursa autoritativă rămâne XML-ul original semnat ANAF.
</div>
</body></html>`
}

/**
 * Convenience: take raw XML → render HTML in one call.
 */
export function renderUblXmlAsHtml(xml: string): string {
  return renderUblInvoiceAsHtml(parseUblInvoice(xml))
}
