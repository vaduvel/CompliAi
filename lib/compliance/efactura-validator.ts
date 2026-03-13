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
    errors.push("Continutul nu pare XML valid.")
  }

  // --- Root element ---
  const isInvoice = /<(?:\w+:)?Invoice[\s>]/i.test(source)
  const isCreditNote = /<(?:\w+:)?CreditNote[\s>]/i.test(source)

  if (!isInvoice && !isCreditNote) {
    errors.push("Radacina UBL trebuie sa fie Invoice sau CreditNote.")
  }

  // --- CustomizationID ---
  const customizationId = findTagValue(source, "CustomizationID")
  if (!customizationId) {
    errors.push("Lipseste cbc:CustomizationID.")
  } else if (!/cius|ro/i.test(customizationId)) {
    warnings.push("CustomizationID nu pare sa indice profil CIUS-RO.")
  }

  // --- ProfileID (optional but good to have) ---
  if (!hasTag(source, "ProfileID")) {
    warnings.push("Lipseste cbc:ProfileID. Recomandat pentru identificarea profilului de business.")
  }

  // --- InvoiceTypeCode ---
  const invoiceTypeCode = findTagValue(source, "InvoiceTypeCode")
  if (isInvoice && !invoiceTypeCode) {
    errors.push("Lipseste cbc:InvoiceTypeCode. Valori uzuale: 380 (factura), 381 (stornare).")
  } else if (invoiceTypeCode && !/^\d{3}$/.test(invoiceTypeCode)) {
    warnings.push(`InvoiceTypeCode '${invoiceTypeCode}' nu pare un cod numeric standard (ex: 380).`)
  }

  // --- ID ---
  const invoiceNumber = findTagValue(source, "ID")
  if (!invoiceNumber) {
    errors.push("Lipseste cbc:ID pentru factura.")
  }

  // --- IssueDate ---
  const issueDate = findTagValue(source, "IssueDate")
  if (!issueDate) {
    errors.push("Lipseste cbc:IssueDate.")
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    warnings.push("IssueDate exista, dar formatul nu pare YYYY-MM-DD.")
  }

  // --- DueDate ---
  const dueDate = findTagValue(source, "DueDate")
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    warnings.push("DueDate exista, dar formatul nu pare YYYY-MM-DD.")
  }

  // --- DocumentCurrencyCode ---
  const currencyCode = findTagValue(source, "DocumentCurrencyCode")
  if (!currencyCode) {
    errors.push("Lipseste cbc:DocumentCurrencyCode (ex: RON, EUR).")
  } else if (currencyCode.length !== 3) {
    warnings.push(`DocumentCurrencyCode '${currencyCode}' nu pare un cod ISO 4217 valid (3 litere).`)
  }

  // --- Parties ---
  if (!hasTag(source, "AccountingSupplierParty")) {
    errors.push("Lipseste blocul cac:AccountingSupplierParty.")
  }
  if (!hasTag(source, "AccountingCustomerParty")) {
    errors.push("Lipseste blocul cac:AccountingCustomerParty.")
  }

  // --- TaxTotal ---
  if (!hasTag(source, "TaxTotal")) {
    errors.push("Lipseste blocul cac:TaxTotal.")
  } else {
    const taxAmount = findTagValue(source, "TaxAmount")
    if (!taxAmount) {
      warnings.push("cbc:TaxAmount lipseste sau nu a putut fi detectat in cac:TaxTotal.")
    }
  }

  // --- LegalMonetaryTotal ---
  if (!hasTag(source, "LegalMonetaryTotal")) {
    errors.push("Lipseste blocul cac:LegalMonetaryTotal.")
  } else {
    if (!hasTag(source, "PayableAmount")) {
      errors.push("Lipseste cbc:PayableAmount in cac:LegalMonetaryTotal.")
    }
    if (!hasTag(source, "TaxExclusiveAmount")) {
      warnings.push("Lipseste cbc:TaxExclusiveAmount in cac:LegalMonetaryTotal.")
    }
    if (!hasTag(source, "TaxInclusiveAmount")) {
      warnings.push("Lipseste cbc:TaxInclusiveAmount in cac:LegalMonetaryTotal.")
    }
  }

  // --- InvoiceLines ---
  if (isInvoice) {
    const lineCount = countTags(source, "InvoiceLine")
    if (lineCount === 0) {
      errors.push("Factura nu contine nicio linie InvoiceLine.")
    }
  }
  if (isCreditNote) {
    const lineCount = countTags(source, "CreditNoteLine")
    if (lineCount === 0) {
      errors.push("Nota de credit nu contine nicio linie CreditNoteLine.")
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
    warnings.push("Nu a fost detectat cbc:CompanyID pentru CIF/CUI furnizor sau client.")
  }

  // --- Resolve supplier / customer names ---
  const registrationNames = Array.from(
    source.matchAll(/<(?:\w+:)?RegistrationName[^>]*>([\s\S]*?)<\/(?:\w+:)?RegistrationName>/gi)
  )
    .map((m) => m[1]?.trim() || "")
    .filter(Boolean)

  const supplierName = registrationNames[0] || findTagValue(source, "RegistrationName")
  const customerName = registrationNames[1] || ""

  return {
    id: `efxml-${Math.random().toString(36).slice(2, 10)}`,
    documentName: documentName.trim() || "Factura XML fara nume",
    valid: errors.length === 0,
    invoiceNumber: invoiceNumber || undefined,
    issueDate: issueDate || undefined,
    supplierName: supplierName || undefined,
    customerName: customerName || undefined,
    errors,
    warnings,
    createdAtISO: nowISO,
  }
}
