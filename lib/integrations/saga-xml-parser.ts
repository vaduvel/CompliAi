// Saga XML parser — Saga folosește format propriu (NU UBL), cu tag-uri RO.
// Schema oficială: https://manual.sagasoft.ro/sagac/topic-76-import-date.html
//
// Structură:
//   <Factura>
//     <Antet>
//       <FurnizorNume>...</FurnizorNume>
//       <FurnizorCIF>...</FurnizorCIF>
//       <ClientNume>...</ClientNume>
//       <ClientCIF>...</ClientCIF>
//       <FacturaNumar>...</FacturaNumar>
//       <FacturaData>...</FacturaData>
//       <FacturaScadenta>...</FacturaScadenta>
//       <FacturaTaxareInversa>Da|Nu</FacturaTaxareInversa>
//       <FacturaIndexSPV>...</FacturaIndexSPV>  -- ID-ul e-Factura ANAF
//       ...
//     </Antet>
//     <Detalii>
//       <Linie>
//         <LinieNrCrt>1</LinieNrCrt>
//         <Descriere>...</Descriere>
//         <UM>buc</UM>
//         <Cantitate>1</Cantitate>
//         <Pret>100</Pret>
//         <Valoare>100</Valoare>
//         <ProcTVA>19</ProcTVA>
//         <TVA>19</TVA>
//       </Linie>
//     </Detalii>
//   </Factura>
//
// File naming: F_<cif>_<numar>_<data>.xml
//
// Output: SagaInvoice tipizat + suport pentru conversie UBL CIUS-RO la nevoie.

export type SagaInvoiceLine = {
  lineNumber: number
  description: string
  uom: string
  quantity: number
  unitPrice: number
  lineTotal: number
  vatPercent: number
  vatAmount: number
  productCode?: string
  warehouse?: string
  account?: string
}

export type SagaParty = {
  name: string
  cif: string
  regCom?: string
  capital?: string
  country?: string
  city?: string
  county?: string
  address?: string
  phone?: string
  email?: string
  bank?: string
  iban?: string
}

export type SagaInvoice = {
  number: string
  date: string                    // ISO YYYY-MM-DD (normalized)
  dueDate?: string                // ISO YYYY-MM-DD
  reverseCharge: boolean
  vatOnCash: boolean
  documentType: string            // "factura" | "aviz" | "chitanta" | "stornare" | "chitanta_cu_cif"
  currency: string                // default "RON"
  weight?: number
  exciseAmount?: number
  efacturaSpvIndex?: string       // ID-ul e-Factura din SPV (dacă a fost trimisă)
  efacturaDownloadIndex?: string

  supplier: SagaParty
  customer: SagaParty

  lines: SagaInvoiceLine[]

  netTotal: number                // Σ lineTotal
  vatTotal: number                // Σ vatAmount
  grandTotal: number              // netTotal + vatTotal

  fileNamePattern?: {
    cif: string
    number: string
    date: string
  }
}

export type SagaParserResult =
  | { ok: true; invoice: SagaInvoice; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] }

// ── Detection helpers ────────────────────────────────────────────────────────

const SAGA_REQUIRED_MARKERS = [
  "<FurnizorNume",
  "<FurnizorCIF",
  "<ClientNume",
  "<ClientCIF",
  "<FacturaNumar",
]

export function isSagaInvoiceXml(xml: string): boolean {
  if (!xml || typeof xml !== "string") return false
  const head = xml.slice(0, 4000)
  // Cer minim 3 din 5 markers ca să fie cu adevărat Saga
  let count = 0
  for (const marker of SAGA_REQUIRED_MARKERS) {
    if (head.includes(marker)) count++
  }
  return count >= 3
}

// File name pattern: F_<cif>_<numar>_<data>.xml
// Acceptăm și cu liniuță sau punct înainte de extensie
export function parseSagaFileName(fileName: string): { cif: string; number: string; date: string } | null {
  if (!fileName) return null
  const base = fileName.replace(/\.[^.]+$/, "")
  const m = base.match(/^F_(\d{2,10})_([^_]+)_(\d{4}-\d{2}-\d{2}|\d{8})$/i)
  if (!m) return null
  let date = m[3]
  if (/^\d{8}$/.test(date)) {
    // Convert YYYYMMDD → YYYY-MM-DD
    date = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
  }
  return { cif: m[1], number: m[2], date }
}

// ── Tag extraction ───────────────────────────────────────────────────────────

function escapeRegexTag(tag: string): string {
  return tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractTag(xml: string, tag: string): string {
  const escaped = escapeRegexTag(tag)
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i")
  const match = xml.match(re)
  if (!match) return ""
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const escaped = escapeRegexTag(tag)
  const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "gi")
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1])
  }
  return out
}

function parseDecimal(value: string): number {
  if (!value) return 0
  // Saga acceptă atât virgulă cât și punct ca separator decimal
  const normalized = value.replace(/\s/g, "").replace(",", ".")
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

function parseInt10(value: string): number {
  if (!value) return 0
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : 0
}

function normalizeDate(value: string): string {
  if (!value) return ""
  const trimmed = value.trim()
  // YYYY-MM-DD direct
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  // DD.MM.YYYY sau DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
  // YYYYMMDD
  if (/^\d{8}$/.test(trimmed)) return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`
  return trimmed
}

function parseYesNo(value: string): boolean {
  const v = value.trim().toLowerCase()
  return v === "da" || v === "yes" || v === "true" || v === "1"
}

function mapDocumentType(raw: string): SagaInvoice["documentType"] {
  const code = raw.trim().toUpperCase()
  switch (code) {
    case "":
      return "factura"
    case "A":
      return "aviz"
    case "B":
      return "chitanta"
    case "T":
      return "stornare"
    case "C":
      return "chitanta_cu_cif"
    default:
      return "factura"
  }
}

// ── Party (Furnizor / Client) extraction ─────────────────────────────────────

function extractParty(xml: string, prefix: "Furnizor" | "Client"): SagaParty {
  return {
    name: extractTag(xml, `${prefix}Nume`),
    cif: extractTag(xml, `${prefix}CIF`).replace(/^RO/i, "").trim(),
    regCom: extractTag(xml, `${prefix}NrRegCom`) || undefined,
    capital: extractTag(xml, `${prefix}Capital`) || undefined,
    country: extractTag(xml, `${prefix}Tara`) || undefined,
    city: extractTag(xml, `${prefix}Localitate`) || undefined,
    county: extractTag(xml, `${prefix}Judet`) || undefined,
    address: extractTag(xml, `${prefix}Adresa`) || undefined,
    phone: extractTag(xml, `${prefix}Telefon`) || undefined,
    email: extractTag(xml, `${prefix}Mail`) || undefined,
    bank: extractTag(xml, `${prefix}Banca`) || undefined,
    iban: extractTag(xml, `${prefix}IBAN`) || undefined,
  }
}

// ── Line item extraction ─────────────────────────────────────────────────────

function extractLines(xml: string): SagaInvoiceLine[] {
  // Liniile sunt grupate sub <Detalii><Linie>...</Linie>...</Detalii>
  // dar uneori apar fără container <Linie>; encadrează direct sub <Detalii>.
  const detaliiBlock = extractAllBlocks(xml, "Detalii").join("\n")
  if (!detaliiBlock) return []

  const lineBlocks = extractAllBlocks(detaliiBlock, "Linie")

  return lineBlocks.map((block, idx) => ({
    lineNumber: parseInt10(extractTag(block, "LinieNrCrt")) || idx + 1,
    description: extractTag(block, "Descriere"),
    uom: extractTag(block, "UM") || "buc",
    quantity: parseDecimal(extractTag(block, "Cantitate")),
    unitPrice: parseDecimal(extractTag(block, "Pret")),
    lineTotal: parseDecimal(extractTag(block, "Valoare")),
    vatPercent: parseDecimal(extractTag(block, "ProcTVA")),
    vatAmount: parseDecimal(extractTag(block, "TVA")),
    productCode:
      extractTag(block, "CodArticolFurnizor") || extractTag(block, "CodArticolClient") || undefined,
    warehouse: extractTag(block, "Gestiune") || undefined,
    account: extractTag(block, "Cont") || undefined,
  }))
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseSagaInvoice(
  xml: string,
  fileName?: string,
): SagaParserResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!xml || xml.trim().length === 0) {
    return { ok: false, errors: ["Conținut XML gol."], warnings: [] }
  }

  if (!isSagaInvoiceXml(xml)) {
    return {
      ok: false,
      errors: [
        "Fișierul nu pare a fi factură Saga (lipsesc tag-urile FurnizorNume/CIF, ClientNume/CIF, FacturaNumar).",
      ],
      warnings: [],
    }
  }

  const antetBlock = extractAllBlocks(xml, "Antet")[0] ?? xml
  const supplier = extractParty(antetBlock, "Furnizor")
  const customer = extractParty(antetBlock, "Client")

  if (!supplier.name) errors.push("S-A001 Lipsește FurnizorNume.")
  if (!supplier.cif) errors.push("S-A002 Lipsește FurnizorCIF.")
  if (!customer.name) errors.push("S-A003 Lipsește ClientNume.")
  if (!customer.cif) errors.push("S-A004 Lipsește ClientCIF.")

  const number = extractTag(antetBlock, "FacturaNumar")
  if (!number) errors.push("S-A005 Lipsește FacturaNumar.")

  const dateRaw = extractTag(antetBlock, "FacturaData")
  if (!dateRaw) errors.push("S-A006 Lipsește FacturaData.")
  const date = normalizeDate(dateRaw)
  if (date && !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    warnings.push("S-A006 FacturaData nu se poate normaliza la YYYY-MM-DD.")
  }

  const dueDateRaw = extractTag(antetBlock, "FacturaScadenta")
  const dueDate = dueDateRaw ? normalizeDate(dueDateRaw) : undefined

  const lines = extractLines(xml)
  if (lines.length === 0) {
    errors.push("S-D001 Niciun produs/serviciu (lipsesc <Linie> sub <Detalii>).")
  }
  for (const [i, ln] of lines.entries()) {
    if (!ln.description) warnings.push(`S-D002 Linia ${i + 1}: descriere lipsă.`)
    if (ln.quantity <= 0) warnings.push(`S-D003 Linia ${i + 1}: cantitate ≤ 0.`)
    if (ln.lineTotal === 0 && ln.unitPrice * ln.quantity !== 0) {
      warnings.push(`S-D004 Linia ${i + 1}: Valoare = 0 dar Pret × Cantitate ≠ 0.`)
    }
  }

  // Summary
  const netTotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  const vatTotal = lines.reduce((s, l) => s + l.vatAmount, 0)
  const grandTotal = netTotal + vatTotal

  const fileNamePattern = fileName ? parseSagaFileName(fileName) ?? undefined : undefined
  if (fileName && !fileNamePattern) {
    warnings.push(
      `S-N001 Numele fișierului nu respectă convenția Saga F_<cif>_<numar>_<data>.xml (este "${fileName}").`,
    )
  } else if (fileNamePattern) {
    if (fileNamePattern.cif !== supplier.cif && fileNamePattern.cif !== customer.cif) {
      warnings.push(
        `S-N002 CIF din numele fișierului (${fileNamePattern.cif}) nu corespunde nici cu FurnizorCIF (${supplier.cif}) nici cu ClientCIF (${customer.cif}).`,
      )
    }
    if (fileNamePattern.number !== number) {
      warnings.push(
        `S-N003 Numărul din nume (${fileNamePattern.number}) nu corespunde cu FacturaNumar (${number}).`,
      )
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings }
  }

  const invoice: SagaInvoice = {
    number,
    date,
    dueDate,
    reverseCharge: parseYesNo(extractTag(antetBlock, "FacturaTaxareInversa")),
    vatOnCash: parseYesNo(extractTag(antetBlock, "FacturaTVAIncasare")),
    documentType: mapDocumentType(extractTag(antetBlock, "FacturaTip")),
    currency: extractTag(antetBlock, "FacturaMoneda") || "RON",
    weight: parseDecimal(extractTag(antetBlock, "FacturaGreutate")) || undefined,
    exciseAmount: parseDecimal(extractTag(antetBlock, "FacturaAccize")) || undefined,
    efacturaSpvIndex: extractTag(antetBlock, "FacturaIndexSPV") || undefined,
    efacturaDownloadIndex: extractTag(antetBlock, "FacturaIndexDescarcareSPV") || undefined,
    supplier,
    customer,
    lines,
    netTotal,
    vatTotal,
    grandTotal,
    fileNamePattern,
  }

  return { ok: true, invoice, warnings }
}

// ── Validation (post-parse) ──────────────────────────────────────────────────

export type SagaValidationFinding = {
  code: string
  severity: "error" | "warning"
  message: string
}

export function validateSagaInvoice(inv: SagaInvoice): SagaValidationFinding[] {
  const findings: SagaValidationFinding[] = []

  // CIF validation: cifre, eventual cu RO prefix
  const cifPattern = /^\d{2,10}$/
  if (!cifPattern.test(inv.supplier.cif)) {
    findings.push({
      code: "S-V001",
      severity: "error",
      message: `FurnizorCIF "${inv.supplier.cif}" nu pare valid (așteptăm cifre 2-10).`,
    })
  }
  if (!cifPattern.test(inv.customer.cif)) {
    findings.push({
      code: "S-V002",
      severity: "error",
      message: `ClientCIF "${inv.customer.cif}" nu pare valid.`,
    })
  }

  // Coerență totaluri
  for (const [i, ln] of inv.lines.entries()) {
    const expected = ln.unitPrice * ln.quantity
    if (Math.abs(expected - ln.lineTotal) > 0.05) {
      findings.push({
        code: "S-V003",
        severity: "warning",
        message: `Linia ${i + 1}: Valoare ${ln.lineTotal} ≠ Pret × Cantitate (${expected.toFixed(2)}).`,
      })
    }
    if (ln.vatPercent > 0) {
      const expectedVat = (ln.lineTotal * ln.vatPercent) / 100
      if (Math.abs(expectedVat - ln.vatAmount) > 0.05) {
        findings.push({
          code: "S-V004",
          severity: "warning",
          message: `Linia ${i + 1}: TVA ${ln.vatAmount} ≠ Valoare × ${ln.vatPercent}% (${expectedVat.toFixed(2)}).`,
        })
      }
    }
  }

  // Reverse charge — clienți UE fără TVA
  if (inv.reverseCharge && inv.vatTotal > 0) {
    findings.push({
      code: "S-V005",
      severity: "error",
      message: "Taxare inversă activă dar TVA total > 0.",
    })
  }

  // e-Factura status
  if (!inv.efacturaSpvIndex) {
    findings.push({
      code: "S-V006",
      severity: "warning",
      message:
        "FacturaIndexSPV lipsește — factura nu e marcată ca trimisă în e-Factura. Verifică în Saga (Iesiri → Trimite e-Factura).",
    })
  }

  // Date validation
  if (inv.dueDate && inv.dueDate < inv.date) {
    findings.push({
      code: "S-V007",
      severity: "warning",
      message: `FacturaScadenta (${inv.dueDate}) e înainte de FacturaData (${inv.date}).`,
    })
  }

  return findings
}

// ── Conversion to UBL CIUS-RO equivalent (best-effort, lossy) ────────────────

/**
 * Conversie minimă Saga → UBL Invoice ca să poată fi rulată prin
 * validateEFacturaXml() existent. Strict pentru cazuri simple — nu acoperă
 * stornare, taxare inversă complexă, etc.
 */
export function convertSagaToUbl(inv: SagaInvoice): string {
  const xmlEscape = (s: string) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const linesXml = inv.lines
    .map(
      (ln) => `
  <cac:InvoiceLine>
    <cbc:ID>${ln.lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${xmlEscape(ln.uom)}">${ln.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${inv.currency}">${ln.lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${xmlEscape(ln.description)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${inv.currency}">${ln.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`,
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>${xmlEscape(inv.number)}</cbc:ID>
  <cbc:IssueDate>${inv.date}</cbc:IssueDate>
  ${inv.dueDate ? `<cbc:DueDate>${inv.dueDate}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${inv.currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${xmlEscape(inv.supplier.name)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${xmlEscape(inv.supplier.cif)}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${xmlEscape(inv.customer.name)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>RO${xmlEscape(inv.customer.cif)}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${inv.currency}">${inv.vatTotal.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="${inv.currency}">${inv.grandTotal.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  ${linesXml}
</Invoice>`
}
