import type { EFacturaValidationRecord } from "@/lib/compliance/types"

type ValidationInput = {
  documentName: string
  xml: string
  nowISO: string
}

function findTagValue(xml: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escapedTag}>`,
    "i"
  )
  const match = xml.match(pattern)
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || ""
}

function findTagBlock(xml: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escapedTag}>`,
    "i"
  )
  return xml.match(pattern)?.[1] || ""
}

function hasTag(xml: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])`, "i")
  return pattern.test(xml)
}

function countTags(xml: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])`, "gi")
  return (xml.match(pattern) || []).length
}

function normalizePartyTaxId(value: string) {
  const trimmed = value.replace(/\s+/g, "").toUpperCase()
  if (!trimmed) return ""
  return /^(RO)?\d{2,10}$/.test(trimmed) ? trimmed : ""
}

/**
 * Detectare B2B vs B2C — per spec MF RO e-Factura.
 *
 * B2B (priority semnal):
 *   1. customer.PartyTaxScheme.CompanyID = CIF valid (RO + 2-10 cifre) — semn clar
 *   2. customer.PartyLegalEntity.CompanyID = CIF valid — multe XML-uri reale folosesc doar acest bloc
 *
 * B2C (priority semnal):
 *   1. CompanyID = CNP (13 cifre, începe 1/2/5/6) — persoană fizică
 *   2. customer NU are NICIUN CompanyID (persoană fizică fără identificator)
 *
 * Unknown: fallback când datele sunt ambigue (necesită verificare manuală).
 *
 * B2C declanșează termen raportare 5 zile lucrătoare (vs 5 calendaristice B2B).
 */
function detectCustomerType(customerPartyBlock: string): "b2b" | "b2c" | "unknown" {
  if (!customerPartyBlock) return "unknown"

  const taxSchemeBlock = findTagBlock(customerPartyBlock, "PartyTaxScheme")
  const legalEntityBlock = findTagBlock(customerPartyBlock, "PartyLegalEntity")

  // Strângem TOATE valorile CompanyID din blocul customer
  const candidateIds: string[] = []
  if (taxSchemeBlock) {
    const v = findTagValue(taxSchemeBlock, "CompanyID")
    if (v) candidateIds.push(v.replace(/\s+/g, "").toUpperCase())
  }
  if (legalEntityBlock) {
    const v = findTagValue(legalEntityBlock, "CompanyID")
    if (v) candidateIds.push(v.replace(/\s+/g, "").toUpperCase())
  }
  // Fallback: orice CompanyID direct sub Party
  if (candidateIds.length === 0) {
    const direct = findTagValue(customerPartyBlock, "CompanyID")
    if (direct) candidateIds.push(direct.replace(/\s+/g, "").toUpperCase())
  }

  // CNP = 13 cifre, începe cu 1/2/5/6 — semn cert B2C
  if (candidateIds.some((id) => /^[1-6]\d{12}$/.test(id))) return "b2c"

  // CIF valid în orice candidate → B2B
  if (candidateIds.some((id) => /^(RO)?\d{2,10}$/.test(id))) return "b2b"

  // Niciun CompanyID + customer există → probabil persoană fizică
  if (candidateIds.length === 0) return "b2c"

  // Există CompanyID dar nu match nici CIF nici CNP → ambiguu
  return "unknown"
}

/**
 * Calcul termen raportare SPV — actualizat pentru 2026.
 *
 *  - **De la 1 ianuarie 2026 (OUG 89/2025 "trenuleț")**: termenul e
 *    **5 zile LUCRĂTOARE** atât pentru B2B cât și pentru B2C, de la issueDate.
 *    (Înainte: B2B era 5 zile calendaristice.)
 *  - Pentru facturi emise ÎNAINTE de 2026-01-01: păstrăm 5 zile calendaristice
 *    pentru B2B (legacy backward-compat).
 *  - B2C: 5 zile lucrătoare (neschimbat) — OUG 120/2021 modif. OUG 69/2024.
 *
 *  Sărbători legale RO 2025-2026 incluse (set fix; pentru update — feed-sources.ts)
 */
const NEW_DEADLINE_RULE_FROM_ISO = "2026-01-01"
const RO_HOLIDAYS = new Set([
  "2025-01-01", "2025-01-02", "2025-01-24", "2025-04-18", "2025-04-20", "2025-04-21",
  "2025-05-01", "2025-06-01", "2025-06-08", "2025-06-09", "2025-08-15", "2025-11-30",
  "2025-12-01", "2025-12-25", "2025-12-26",
  "2026-01-01", "2026-01-02", "2026-01-24", "2026-04-10", "2026-04-12", "2026-04-13",
  "2026-05-01", "2026-06-01", "2026-05-31", "2026-06-01", "2026-08-15", "2026-11-30",
  "2026-12-01", "2026-12-25", "2026-12-26",
])

function isWorkingDay(d: Date): boolean {
  const day = d.getUTCDay()
  if (day === 0 || day === 6) return false
  const iso = d.toISOString().slice(0, 10)
  return !RO_HOLIDAYS.has(iso)
}

function addWorkingDays(start: Date, count: number): Date {
  const cur = new Date(start)
  let added = 0
  while (added < count) {
    cur.setUTCDate(cur.getUTCDate() + 1)
    if (isWorkingDay(cur)) added++
  }
  return cur
}

function computeReportingDeadline(
  issueDate: string,
  customerType: "b2b" | "b2c" | "unknown",
): string | undefined {
  if (!issueDate) return undefined
  const start = new Date(`${issueDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) return undefined

  // Din 1 ianuarie 2026 (OUG 89/2025) regula e UNIFICATĂ: 5 zile lucrătoare
  // pentru toate categoriile (B2B + B2C + unknown).
  const newRulesActive = issueDate >= NEW_DEADLINE_RULE_FROM_ISO

  if (newRulesActive || customerType === "b2c") {
    return addWorkingDays(start, 5).toISOString()
  }

  // Legacy (facturi emise înainte de 2026-01-01) pentru B2B/unknown:
  // 5 zile calendaristice (OUG 120/2021 Art. 10 înainte de modif. OUG 89/2025).
  const calendar = new Date(start)
  calendar.setUTCDate(calendar.getUTCDate() + 5)
  return calendar.toISOString()
}

export function validateEFacturaXml({
  documentName,
  xml,
  nowISO,
}: ValidationInput): EFacturaValidationRecord {
  const source = xml.trim()
  const errors: string[] = []
  const warnings: string[] = []

  // --- Basic XML check ---
  if (!source.startsWith("<")) {
    errors.push("T003 Continutul nu pare XML valid. Asigura-te ca fisierul este UTF-8.")
  }

  // --- Root element ---
  const isInvoice = /<(?:\w+:)?Invoice[\s>]/i.test(source)
  const isCreditNote = /<(?:\w+:)?CreditNote[\s>]/i.test(source)

  if (!isInvoice && !isCreditNote) {
    errors.push("V001 Radacina UBL trebuie sa fie Invoice sau CreditNote.")
  }

  // --- CustomizationID ---
  const customizationId = findTagValue(source, "CustomizationID")
  if (!customizationId) {
    errors.push("V002 Lipseste cbc:CustomizationID.")
  } else if (!/cius|ro/i.test(customizationId)) {
    warnings.push("V002 CustomizationID nu pare sa indice profil CIUS-RO.")
  }

  // --- ProfileID (optional but good to have) ---
  if (!hasTag(source, "ProfileID")) {
    warnings.push("Lipseste cbc:ProfileID. Recomandat pentru identificarea profilului de business.")
  }

  // --- InvoiceTypeCode ---
  const invoiceTypeCode = findTagValue(source, "InvoiceTypeCode")
  if (isInvoice && !invoiceTypeCode) {
    errors.push("V003 Lipseste cbc:InvoiceTypeCode. Valori uzuale: 380 (factura), 381 (stornare).")
  } else if (invoiceTypeCode && !/^\d{3}$/.test(invoiceTypeCode)) {
    warnings.push(`V003 InvoiceTypeCode '${invoiceTypeCode}' nu pare un cod numeric standard (ex: 380).`)
  }

  // --- ID ---
  const invoiceNumber = findTagValue(source, "ID")
  if (!invoiceNumber) {
    errors.push("V004 Lipseste cbc:ID pentru factura.")
  }

  // --- IssueDate ---
  const issueDate = findTagValue(source, "IssueDate")
  if (!issueDate) {
    errors.push("V005 Lipseste cbc:IssueDate.")
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    warnings.push("V005 IssueDate exista, dar formatul nu pare YYYY-MM-DD.")
  }

  // --- DueDate ---
  const dueDate = findTagValue(source, "DueDate")
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    warnings.push("DueDate exista, dar formatul nu pare YYYY-MM-DD.")
  }

  // --- DocumentCurrencyCode ---
  const currencyCode = findTagValue(source, "DocumentCurrencyCode")
  if (!currencyCode) {
    errors.push("V006 Lipseste cbc:DocumentCurrencyCode (ex: RON, EUR).")
  } else if (currencyCode.length !== 3) {
    warnings.push(`V006 DocumentCurrencyCode '${currencyCode}' nu pare un cod ISO 4217 valid (3 litere).`)
  }

  // --- Parties ---
  if (!hasTag(source, "AccountingSupplierParty")) {
    errors.push("V007 Lipseste blocul cac:AccountingSupplierParty.")
  }
  if (!hasTag(source, "AccountingCustomerParty")) {
    errors.push("V008 Lipseste blocul cac:AccountingCustomerParty.")
  }

  // --- TaxTotal ---
  if (!hasTag(source, "TaxTotal")) {
    errors.push("V009 Lipseste blocul cac:TaxTotal.")
  } else {
    const taxAmount = findTagValue(source, "TaxAmount")
    if (!taxAmount) {
      warnings.push("V009 cbc:TaxAmount lipseste sau nu a putut fi detectat in cac:TaxTotal.")
    }
  }

  // --- LegalMonetaryTotal ---
  if (!hasTag(source, "LegalMonetaryTotal")) {
    errors.push("V010 Lipseste blocul cac:LegalMonetaryTotal.")
  } else {
    if (!hasTag(source, "PayableAmount")) {
      errors.push("V010 Lipseste cbc:PayableAmount in cac:LegalMonetaryTotal.")
    }
    if (!hasTag(source, "TaxExclusiveAmount")) {
      warnings.push("V010 Lipseste cbc:TaxExclusiveAmount in cac:LegalMonetaryTotal.")
    }
    if (!hasTag(source, "TaxInclusiveAmount")) {
      warnings.push("V010 Lipseste cbc:TaxInclusiveAmount in cac:LegalMonetaryTotal.")
    }
  }

  // --- InvoiceLines ---
  if (isInvoice) {
    const lineCount = countTags(source, "InvoiceLine")
    if (lineCount === 0) {
      errors.push("V011 Factura nu contine nicio linie InvoiceLine.")
    }
  }
  if (isCreditNote) {
    const lineCount = countTags(source, "CreditNoteLine")
    if (lineCount === 0) {
      errors.push("V011 Nota de credit nu contine nicio linie CreditNoteLine.")
    }
  }

  // --- PaymentMeans ---
  if (!hasTag(source, "PaymentMeans")) {
    warnings.push(
      "Lipseste cac:PaymentMeans. Recomandat pentru a indica modalitatea de plata."
    )
  }

  // --- Seller VAT / TaxScheme ---
  if (!hasTag(source, "CompanyID")) {
    warnings.push("C001 Nu a fost detectat cbc:CompanyID pentru CIF/CUI furnizor sau client.")
  }

  // --- Resolve supplier / customer names ---
  const registrationNames = Array.from(
    source.matchAll(/<(?:\w+:)?RegistrationName[^>]*>([\s\S]*?)<\/(?:\w+:)?RegistrationName>/gi)
  )
    .map((m) => m[1]?.trim() || "")
    .filter(Boolean)

  const supplierPartyBlock = findTagBlock(source, "AccountingSupplierParty")
  const customerPartyBlock = findTagBlock(source, "AccountingCustomerParty")
  const supplierName =
    findTagValue(supplierPartyBlock, "RegistrationName") ||
    registrationNames[0] ||
    findTagValue(source, "RegistrationName")
  const customerName =
    findTagValue(customerPartyBlock, "RegistrationName") ||
    registrationNames[1] ||
    ""
  const supplierCui = normalizePartyTaxId(findTagValue(supplierPartyBlock, "CompanyID"))
  const customerCui = normalizePartyTaxId(findTagValue(customerPartyBlock, "CompanyID"))
  const customerType = detectCustomerType(customerPartyBlock)
  const reportingDeadlineISO = computeReportingDeadline(issueDate, customerType)

  // Warning regulă 2026: 5 zile lucrătoare unificat
  const isPost2026 = issueDate && issueDate >= NEW_DEADLINE_RULE_FROM_ISO
  if (isPost2026 && customerType === "b2c") {
    warnings.push(
      "B2C detectat. Din 1 ian 2026 (OUG 89/2025): 5 zile LUCRĂTOARE de la emitere — regulă unificată cu B2B.",
    )
  } else if (isPost2026) {
    warnings.push(
      "Din 1 ian 2026 (OUG 89/2025): termenul de transmitere SPV este 5 zile LUCRĂTOARE (nu calendaristice ca înainte). Aplică pentru toate facturile B2B/B2C/B2G.",
    )
  } else if (customerType === "b2c") {
    warnings.push(
      "B2C detectat. Termen raportare SPV: 5 zile LUCRĂTOARE de la emitere (OUG 120/2021 modif. OUG 69/2024, din 1 ian 2025).",
    )
  }

  return {
    id: `efxml-${Math.random().toString(36).slice(2, 10)}`,
    documentName: documentName.trim() || "Factura XML fara nume",
    valid: errors.length === 0,
    invoiceNumber: invoiceNumber || undefined,
    issueDate: issueDate || undefined,
    supplierName: supplierName || undefined,
    supplierCui: supplierCui || undefined,
    customerName: customerName || undefined,
    customerCui: customerCui || undefined,
    customerType,
    reportingDeadlineISO,
    errors,
    warnings,
    createdAtISO: nowISO,
  }
}
