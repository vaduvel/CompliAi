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

function findAllTagBlocks(xml: string, tag: string): string[] {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:(?:\\w|-)+:)?${escapedTag}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:(?:\\w|-)+:)?${escapedTag}>`,
    "gi",
  )
  return Array.from(xml.matchAll(pattern)).map((m) => m[1] || "")
}

const BUCHAREST_SECTOR_CODES = new Set([
  "SECTOR1",
  "SECTOR2",
  "SECTOR3",
  "SECTOR4",
  "SECTOR5",
  "SECTOR6",
])

const MONEY_TOLERANCE = 0.011 // 1.1 cent — accommodates 2dp rounding per BR-DEC-XX

function parseMoney(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100
}

// V021–V025: cross-sum & math validations per BR-CO-10/13/14/15/17.
// These catch the largest class of ANAF rejections after structural errors —
// invoices with mismatched totals get rejected even when structurally valid.
function validateInvoiceMath(source: string, errors: string[]): void {
  const totalsBlock = findTagBlock(source, "LegalMonetaryTotal")
  if (!totalsBlock) return // V010 already reports missing block

  const lineBlocks = findAllTagBlocks(source, "InvoiceLine")
  const creditNoteLineBlocks = findAllTagBlocks(source, "CreditNoteLine")
  const allLineBlocks = lineBlocks.length > 0 ? lineBlocks : creditNoteLineBlocks

  const lineSum = allLineBlocks.reduce((acc, line) => {
    const value = parseMoney(findTagValue(line, "LineExtensionAmount"))
    return acc + (value ?? 0)
  }, 0)

  const documentLineTotal = parseMoney(findTagValue(totalsBlock, "LineExtensionAmount"))
  if (documentLineTotal !== null && allLineBlocks.length > 0) {
    if (Math.abs(documentLineTotal - lineSum) > MONEY_TOLERANCE) {
      errors.push(
        `V021 BR-CO-10 LegalMonetaryTotal/LineExtensionAmount=${documentLineTotal.toFixed(2)} ` +
          `nu egaleaza suma liniilor=${lineSum.toFixed(2)}.`,
      )
    }
  }

  const allowanceTotal = parseMoney(findTagValue(totalsBlock, "AllowanceTotalAmount")) ?? 0
  const chargeTotal = parseMoney(findTagValue(totalsBlock, "ChargeTotalAmount")) ?? 0
  const taxExclusive = parseMoney(findTagValue(totalsBlock, "TaxExclusiveAmount"))
  if (taxExclusive !== null && documentLineTotal !== null) {
    const expected = roundCents(documentLineTotal - allowanceTotal + chargeTotal)
    if (Math.abs(taxExclusive - expected) > MONEY_TOLERANCE) {
      errors.push(
        `V022 BR-CO-13 TaxExclusiveAmount=${taxExclusive.toFixed(2)} ` +
          `≠ LineExtensionAmount − Allowance + Charge = ${expected.toFixed(2)}.`,
      )
    }
  }

  const taxTotalBlock = findTagBlock(source, "TaxTotal")
  const taxTotalAmount = parseMoney(findTagValue(taxTotalBlock, "TaxAmount"))
  if (taxTotalBlock) {
    const subtotals = findAllTagBlocks(taxTotalBlock, "TaxSubtotal")
    if (subtotals.length > 0 && taxTotalAmount !== null) {
      const subSum = subtotals.reduce((acc, sub) => {
        const v = parseMoney(findTagValue(sub, "TaxAmount"))
        return acc + (v ?? 0)
      }, 0)
      if (Math.abs(taxTotalAmount - subSum) > MONEY_TOLERANCE) {
        errors.push(
          `V023 BR-CO-14 TaxTotal/TaxAmount=${taxTotalAmount.toFixed(2)} ` +
            `≠ suma TaxSubtotal/TaxAmount=${subSum.toFixed(2)}.`,
        )
      }
    }

    // V024 BR-CO-17: per-subtotal math TaxAmount = TaxableAmount * Percent / 100
    subtotals.forEach((sub, idx) => {
      const taxable = parseMoney(findTagValue(sub, "TaxableAmount"))
      const subTax = parseMoney(findTagValue(sub, "TaxAmount"))
      const percent = parseMoney(findTagValue(sub, "Percent"))
      if (taxable !== null && subTax !== null && percent !== null) {
        const expected = roundCents((taxable * percent) / 100)
        if (Math.abs(subTax - expected) > MONEY_TOLERANCE) {
          errors.push(
            `V024 BR-CO-17 TaxSubtotal #${idx + 1}: TaxAmount=${subTax.toFixed(2)} ` +
              `≠ round(TaxableAmount × Percent / 100)=${expected.toFixed(2)}.`,
          )
        }
      }
    })
  }

  const taxInclusive = parseMoney(findTagValue(totalsBlock, "TaxInclusiveAmount"))
  if (taxInclusive !== null && taxExclusive !== null) {
    const expected = roundCents(taxExclusive + (taxTotalAmount ?? 0))
    if (Math.abs(taxInclusive - expected) > MONEY_TOLERANCE) {
      errors.push(
        `V025 BR-CO-15 TaxInclusiveAmount=${taxInclusive.toFixed(2)} ` +
          `≠ TaxExclusiveAmount + TaxTotal = ${expected.toFixed(2)}.`,
      )
    }
  }
}

// V015–V018 + V028: address mandatory per BR-08/BR-10/BR-RO-080/090/100/110.
// Confirmat live in sandbox 2026-05-11.
function validatePostalAddress(partyBlock: string, role: string, errors: string[]): void {
  if (!partyBlock) return // V007/V008 already report missing block

  const addressBlock = findTagBlock(partyBlock, "PostalAddress")
  if (!addressBlock) {
    errors.push(`V015 BR-08/BR-10 Lipseste cac:PostalAddress pentru ${role}.`)
    return
  }

  const streetName = findTagValue(addressBlock, "StreetName")
  if (!streetName) {
    errors.push(
      `V016 BR-RO-080 Lipseste cbc:StreetName (adresa line 1) pentru ${role}.`,
    )
  }

  const cityName = findTagValue(addressBlock, "CityName")
  if (!cityName) {
    errors.push(`V017 BR-RO-090 Lipseste cbc:CityName pentru ${role}.`)
    return
  }

  const countrySubentity = findTagValue(addressBlock, "CountrySubentity")
  const countryCode = findTagValue(addressBlock, "IdentificationCode")

  if (
    /^RO-?B$/i.test(countrySubentity) &&
    !BUCHAREST_SECTOR_CODES.has(cityName.toUpperCase())
  ) {
    errors.push(
      `V018 BR-RO-100 ${role} are tara RO-B (Bucuresti) dar CityName "${cityName}" ` +
        "nu e cod SECTOR-RO. Foloseste SECTOR1, SECTOR2, SECTOR3, SECTOR4, SECTOR5 sau SECTOR6.",
    )
  }

  // V028 BR-RO-110/111: if country=RO, CountrySubentity must be ISO 3166-2:RO format.
  if (countryCode.toUpperCase() === "RO" && countrySubentity) {
    if (!/^RO-[A-Z]{1,2}$/i.test(countrySubentity)) {
      errors.push(
        `V028 BR-RO-110 ${role} CountrySubentity "${countrySubentity}" nu e format ISO 3166-2:RO. ` +
          "Exemple: RO-B, RO-CJ, RO-TM, RO-IS.",
      )
    }
  }
}

// V012 + V013: ANAF refuza la XSD daca InvoiceLine n-are cac:Item (cu Name).
// Validatorul anterior tot omitea — un sample "valid" trecea local dar ANAF il
// respingea cu cvc-complex-type.2.4.b. Confirmat live in sandbox 2026-05-11.
function validateInvoiceLine(block: string, lineIndex: number, errors: string[]): void {
  if (!hasTag(block, "Item")) {
    errors.push(
      `V012 InvoiceLine #${lineIndex} nu contine cac:Item. ANAF respinge XSD: ` +
        "fiecare linie trebuie sa descrie produsul/serviciul facturat.",
    )
    return
  }
  const itemBlock = findTagBlock(block, "Item")
  if (!findTagValue(itemBlock, "Name")) {
    errors.push(
      `V013 InvoiceLine #${lineIndex} are cac:Item dar fara cbc:Name. ` +
        "Adauga numele produsului/serviciului.",
    )
  }
  // V019 BR-CO-04 / UBL-SR-48: ClassifiedTaxCategory obligatoriu pe linie.
  // Confirmat live: ANAF respinge daca lipseste.
  if (!hasTag(itemBlock, "ClassifiedTaxCategory")) {
    errors.push(
      `V019 BR-CO-04 InvoiceLine #${lineIndex} are cac:Item dar fara ` +
        "cac:ClassifiedTaxCategory. Adauga categoria TVA (ex: <cbc:ID>S</cbc:ID>).",
    )
  }
  // V020 BR-26: Item price obligatoriu (cac:Price/cbc:PriceAmount).
  if (!hasTag(block, "Price") || !findTagValue(block, "PriceAmount")) {
    errors.push(
      `V020 BR-26 InvoiceLine #${lineIndex} lipseste cac:Price/cbc:PriceAmount. ` +
        "ANAF cere pretul per unitate pe fiecare linie.",
    )
  }
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

/**
 * Pain validat (#12 research): contabilii pierd ore din cauza confuziei
 * "GMT vs EET" — un timestamp UTC pare uneori "ziua trecută" în RO.
 *
 * Soluție: deadline-ul de raportare e END OF DAY ÎN ROMÂNIA, NU UTC midnight.
 * Returnăm 21:59:59 UTC (= 23:59:59 EET winter, sau 00:59:59 EEST summer +1 zi).
 *
 * Pentru accountants: când e afișat "deadline: 11 mai 2026", ei știu că au
 * până la 23:59 ora României în acea zi — nu trebuie să convertească UTC.
 * Pentru cron-uri server-side care verifică "e past deadline?", folosesc
 * direct .getTime() comparison cu nowMs.
 */
function endOfRomanianDay(date: Date): Date {
  // 21:59:59.999 UTC pe ziua dată = 23:59:59 EET winter / +1h în EEST summer
  // (acoperă safe end-of-day RO; DST shift considerat minor vs precizia
  // contabilă day-level care e suficientă pentru deadlines fiscale).
  const out = new Date(date)
  out.setUTCHours(21, 59, 59, 999)
  return out
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
    return endOfRomanianDay(addWorkingDays(start, 5)).toISOString()
  }

  // Legacy (facturi emise înainte de 2026-01-01) pentru B2B/unknown:
  // 5 zile calendaristice (OUG 120/2021 Art. 10 înainte de modif. OUG 89/2025).
  const calendar = new Date(start)
  calendar.setUTCDate(calendar.getUTCDate() + 5)
  return endOfRomanianDay(calendar).toISOString()
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
  // ANAF cere format EXACT: urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1
  // (BR-RO-001 — confirmat live in sandbox 2026-05-11, factura respinsa daca lipseste "efactura.mfinante.ro").
  const customizationId = findTagValue(source, "CustomizationID")
  const CIUS_RO_OFFICIAL =
    "urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1"
  if (!customizationId) {
    errors.push("V002 Lipseste cbc:CustomizationID.")
  } else if (customizationId !== CIUS_RO_OFFICIAL) {
    if (!/cius|ro/i.test(customizationId)) {
      warnings.push("V002 CustomizationID nu pare sa indice profil CIUS-RO.")
    } else {
      errors.push(
        `V014 BR-RO-001 CustomizationID trebuie sa fie exact "${CIUS_RO_OFFICIAL}". ` +
          `Gasit: "${customizationId}". ANAF respinge daca nu match perfect.`,
      )
    }
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
  // V026 BR-RO-020: RO restrictions on invoice type codes.
  const RO_INVOICE_TYPE_CODES = new Set(["380", "384", "389", "751"])
  const RO_CREDIT_NOTE_TYPE_CODES = new Set(["381"])
  if (isInvoice && invoiceTypeCode && !RO_INVOICE_TYPE_CODES.has(invoiceTypeCode)) {
    errors.push(
      `V026 BR-RO-020 InvoiceTypeCode '${invoiceTypeCode}' nu e permis in RO. ` +
        "Valori valide: 380, 384, 389, 751.",
    )
  }
  const creditNoteTypeCode = findTagValue(source, "CreditNoteTypeCode")
  if (isCreditNote && creditNoteTypeCode && !RO_CREDIT_NOTE_TYPE_CODES.has(creditNoteTypeCode)) {
    errors.push(
      `V026 BR-RO-020 CreditNoteTypeCode '${creditNoteTypeCode}' nu e permis in RO. ` +
        "Valoare valida: 381.",
    )
  }

  // --- ID ---
  const invoiceNumber = findTagValue(source, "ID")
  if (!invoiceNumber) {
    errors.push("V004 Lipseste cbc:ID pentru factura.")
  } else if (!/\d/.test(invoiceNumber)) {
    // V027 BR-RO-010: invoice number must contain at least one digit
    errors.push(
      `V027 BR-RO-010 Numarul facturii '${invoiceNumber}' trebuie sa contina cel putin o cifra.`,
    )
  }

  // --- IssueDate (V031 BR-RO-DT001 strict YYYY-MM-DD) ---
  const issueDate = findTagValue(source, "IssueDate")
  if (!issueDate) {
    errors.push("V005 Lipseste cbc:IssueDate.")
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
    errors.push("V031 BR-RO-DT001 IssueDate trebuie format strict YYYY-MM-DD.")
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
    } else {
      const lineBlocks = findAllTagBlocks(source, "InvoiceLine")
      lineBlocks.forEach((block, idx) => validateInvoiceLine(block, idx + 1, errors))
    }
  }
  if (isCreditNote) {
    const lineCount = countTags(source, "CreditNoteLine")
    if (lineCount === 0) {
      errors.push("V011 Nota de credit nu contine nicio linie CreditNoteLine.")
    } else {
      const lineBlocks = findAllTagBlocks(source, "CreditNoteLine")
      lineBlocks.forEach((block, idx) => validateInvoiceLine(block, idx + 1, errors))
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

  // --- Postal address (V015–V018) — BR-08/BR-10/BR-RO-080/BR-RO-090/BR-RO-100 ---
  // Confirmat live in sandbox 2026-05-11: factura respinsa cu BR-RO-100 cand
  // CityName din Bucuresti nu era cod SECTOR1..SECTOR6.
  validatePostalAddress(supplierPartyBlock || "", "Vanzator", errors)
  validatePostalAddress(customerPartyBlock || "", "Cumparator", errors)

  // --- Math cross-validations (V021–V025) — BR-CO-10/13/14/15/17 ---
  validateInvoiceMath(source, errors)

  // V032 UBL element ordering in LegalMonetaryTotal.
  // Confirmat live in sandbox 2026-05-11 cycle 4: ANAF respinge XSD daca elementele
  // nu sunt in ordinea UBL 2.1 (LineExt -> TaxExcl -> TaxIncl -> Allowance -> ...).
  const lmtBlock = findTagBlock(source, "LegalMonetaryTotal")
  if (lmtBlock) {
    const UBL_LMT_ORDER = [
      "LineExtensionAmount",
      "TaxExclusiveAmount",
      "TaxInclusiveAmount",
      "AllowanceTotalAmount",
      "ChargeTotalAmount",
      "PrepaidAmount",
      "PayableRoundingAmount",
      "PayableAmount",
    ]
    const positions = UBL_LMT_ORDER.map((tag) => ({
      tag,
      pos: lmtBlock.search(new RegExp(`<(?:[\\w-]+:)?${tag}[\\s>]`)),
    })).filter((p) => p.pos >= 0)
    for (let i = 1; i < positions.length; i++) {
      if (positions[i]!.pos < positions[i - 1]!.pos) {
        errors.push(
          `V032 LegalMonetaryTotal: ${positions[i]!.tag} apare inainte de ` +
            `${positions[i - 1]!.tag}. ANAF respinge XSD daca ordinea UBL 2.1 nu e respectata.`,
        )
        break
      }
    }
  }

  // V029 BR-RO-120: Buyer trebuie sa aibe legal-reg-ID sau VAT ID.
  if (customerPartyBlock) {
    const legalEntity = findTagBlock(customerPartyBlock, "PartyLegalEntity")
    const taxScheme = findTagBlock(customerPartyBlock, "PartyTaxScheme")
    const hasLegalId = !!findTagValue(legalEntity, "CompanyID")
    const hasVatId = !!findTagValue(taxScheme, "CompanyID")
    if (!hasLegalId && !hasVatId) {
      errors.push(
        "V029 BR-RO-120 Cumparatorul trebuie sa aibe legal-reg-ID " +
          "(PartyLegalEntity/CompanyID) sau VAT ID (PartyTaxScheme/CompanyID).",
      )
    }
  }

  // V030 BR-CO-09: VAT identifiers prefixed with ISO 3166-1 alpha-2 country code.
  const vatIds = Array.from(
    source.matchAll(
      /<cac:PartyTaxScheme\b[\s\S]*?<cbc:CompanyID[^>]*>([\s\S]*?)<\/cbc:CompanyID>/gi,
    ),
  ).map((m) => m[1]?.trim() || "")
  vatIds.forEach((vatId, idx) => {
    if (vatId && !/^[A-Z]{2}/i.test(vatId)) {
      errors.push(
        `V030 BR-CO-09 VAT identifier #${idx + 1} '${vatId}' nu are prefix ISO de tara ` +
          "(ex: RO12345678, FR12345678).",
      )
    }
  })

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
