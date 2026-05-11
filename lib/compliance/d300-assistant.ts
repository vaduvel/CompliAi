// Asistent completare D300/D394 din SAF-T extras + facturi e-Factura.
//
// Pain point: contabilul completează manual D300 din ce vede în programul
// contabil, ducând la erori și diferențe față de P300 ANAF. Acest assistant
// pre-completează D300 + D394 din SAF-T XML deja încărcat (Sprint 3 GAP #4).
//
// Flow:
//   1. User încarcă SAF-T pentru perioada N
//   2. Assistant extrage din SAF-T: tranzacții TVA colectat/deductibil
//   3. Calculează totaluri pe categorii (cota standard 19%, redusă 9%/5%, scutit, reverse charge)
//   4. Pre-completează D300 propunere (rândurile 1-29 standard ANAF)
//   5. Pre-completează D394 propunere (achiziții/livrări locale)
//   6. User aprobă/modifică, sistemul exportă XML formatare ANAF
//
// Pure functions — input: SAF-T XML, output: D300Draft + D394Draft.

export type VatTransactionLine = {
  type: "collected" | "deductible"        // TVA colectat (vânzare) sau dedus (cumpărare)
  taxableBase: number                      // baza impozabilă
  vatAmount: number                        // suma TVA
  vatRate: number                          // 19, 9, 5, 0
  partyTaxId?: string                      // CIF partener
  partyName?: string
  isIntraCommunity?: boolean               // achiziție/livrare UE
  isReverseCharge?: boolean                // taxare inversă
  invoiceNumber?: string
  invoiceDate?: string
}

export type D300Draft = {
  period: string

  // Operațiuni taxabile pe cote
  collected: {
    standardRate: { taxableBase: number; vatAmount: number }   // cotă 19%
    reduced9: { taxableBase: number; vatAmount: number }       // cotă 9% (alimentare, medicamente)
    reduced5: { taxableBase: number; vatAmount: number }       // cotă 5% (cărți, periodice, etc.)
    zeroRate: { taxableBase: number; vatAmount: number }       // exportu, intracom UE livrare
    reverseCharge: { taxableBase: number; vatAmount: number }  // taxare inversă
    exempt: { taxableBase: number; vatAmount: number }         // scutire fără drept dedu
  }

  // Operațiuni taxabile (cumpărare)
  deductible: {
    standardRate: { taxableBase: number; vatAmount: number }
    reduced9: { taxableBase: number; vatAmount: number }
    reduced5: { taxableBase: number; vatAmount: number }
    intraCommunity: { taxableBase: number; vatAmount: number }
    reverseCharge: { taxableBase: number; vatAmount: number }
    nonDeductible: { taxableBase: number; vatAmount: number } // 50% deductibilitate
  }

  // Totaluri
  totalCollectedVat: number     // TVA total de plătit
  totalDeductibleVat: number    // TVA total deductibil
  vatToPay: number               // de plată = colectat - deductibil (>0)
  vatToReturn: number            // de rambursat = colectat - deductibil (<0)

  // Metadata
  generatedAtISO: string
  source: "saft_extracted" | "manual"
  warnings: string[]
}

export type D394Line = {
  partyTaxId: string             // CIF partener
  partyName: string
  taxableBase: number
  vatAmount: number
  invoiceCount: number           // câte facturi cu acest partener
  type: "achizitii" | "livrari"  // intrări vs ieșiri
}

export type D394Draft = {
  period: string
  achizitii: D394Line[]          // achiziții locale (cumpărare)
  livrari: D394Line[]            // livrări locale (vânzare)
  totalAchizitii: { taxableBase: number; vatAmount: number; partnerCount: number }
  totalLivrari: { taxableBase: number; vatAmount: number; partnerCount: number }
  generatedAtISO: string
  warnings: string[]
}

// ── D300 builder ─────────────────────────────────────────────────────────────

const ZERO = { taxableBase: 0, vatAmount: 0 }

function bucketizeVatLine(
  line: VatTransactionLine,
  buckets: D300Draft["collected"] | D300Draft["deductible"],
  isCollectedSide: boolean,
): void {
  if (line.isReverseCharge) {
    buckets.reverseCharge.taxableBase += line.taxableBase
    buckets.reverseCharge.vatAmount += line.vatAmount
    return
  }
  if (isCollectedSide && line.isIntraCommunity) {
    const c = buckets as D300Draft["collected"]
    c.zeroRate.taxableBase += line.taxableBase
    c.zeroRate.vatAmount += line.vatAmount
    return
  }
  if (!isCollectedSide && line.isIntraCommunity) {
    const d = buckets as D300Draft["deductible"]
    d.intraCommunity.taxableBase += line.taxableBase
    d.intraCommunity.vatAmount += line.vatAmount
    return
  }
  switch (line.vatRate) {
    case 19:
      buckets.standardRate.taxableBase += line.taxableBase
      buckets.standardRate.vatAmount += line.vatAmount
      break
    case 9:
      buckets.reduced9.taxableBase += line.taxableBase
      buckets.reduced9.vatAmount += line.vatAmount
      break
    case 5:
      buckets.reduced5.taxableBase += line.taxableBase
      buckets.reduced5.vatAmount += line.vatAmount
      break
    case 0: {
      if (isCollectedSide) {
        const c = buckets as D300Draft["collected"]
        c.zeroRate.taxableBase += line.taxableBase
        c.zeroRate.vatAmount += line.vatAmount
      }
      break
    }
    default:
      // Cotă necunoscută — default exempt
      if (isCollectedSide) {
        const c = buckets as D300Draft["collected"]
        c.exempt.taxableBase += line.taxableBase
        c.exempt.vatAmount += line.vatAmount
      }
  }
}

export function buildD300Draft(
  period: string,
  lines: VatTransactionLine[],
  nowISO: string,
): D300Draft {
  const draft: D300Draft = {
    period,
    collected: {
      standardRate: { ...ZERO },
      reduced9: { ...ZERO },
      reduced5: { ...ZERO },
      zeroRate: { ...ZERO },
      reverseCharge: { ...ZERO },
      exempt: { ...ZERO },
    },
    deductible: {
      standardRate: { ...ZERO },
      reduced9: { ...ZERO },
      reduced5: { ...ZERO },
      intraCommunity: { ...ZERO },
      reverseCharge: { ...ZERO },
      nonDeductible: { ...ZERO },
    },
    totalCollectedVat: 0,
    totalDeductibleVat: 0,
    vatToPay: 0,
    vatToReturn: 0,
    generatedAtISO: nowISO,
    source: "saft_extracted",
    warnings: [],
  }

  for (const line of lines) {
    if (line.type === "collected") {
      bucketizeVatLine(line, draft.collected, true)
    } else {
      bucketizeVatLine(line, draft.deductible, false)
    }
  }

  draft.totalCollectedVat =
    draft.collected.standardRate.vatAmount +
    draft.collected.reduced9.vatAmount +
    draft.collected.reduced5.vatAmount
  draft.totalDeductibleVat =
    draft.deductible.standardRate.vatAmount +
    draft.deductible.reduced9.vatAmount +
    draft.deductible.reduced5.vatAmount +
    draft.deductible.intraCommunity.vatAmount

  const balance = draft.totalCollectedVat - draft.totalDeductibleVat
  if (balance >= 0) {
    draft.vatToPay = balance
    draft.vatToReturn = 0
  } else {
    draft.vatToPay = 0
    draft.vatToReturn = -balance
  }

  // Warnings
  if (lines.length === 0) {
    draft.warnings.push("Nu am găsit tranzacții VAT pentru această perioadă în SAF-T.")
  }
  if (draft.collected.exempt.taxableBase > 0) {
    draft.warnings.push(
      `Tranzacții cu cotă VAT necunoscută (${draft.collected.exempt.taxableBase.toFixed(2)} RON). Verifică în program.`,
    )
  }

  return draft
}

// ── D394 builder ─────────────────────────────────────────────────────────────

export function buildD394Draft(
  period: string,
  lines: VatTransactionLine[],
  nowISO: string,
): D394Draft {
  // Group by partner CIF, separately for achizitii (deductible domestic) și livrari (collected domestic)
  const achizitiiMap = new Map<string, D394Line>()
  const livrariMap = new Map<string, D394Line>()

  for (const line of lines) {
    // D394 doar pentru tranzacții LOCALE (nu intracom UE, nu export)
    if (line.isIntraCommunity) continue
    if (line.vatRate === 0) continue
    if (!line.partyTaxId) continue

    const cleanCif = line.partyTaxId.replace(/^RO/i, "").trim()
    const partyName = line.partyName ?? `CIF ${cleanCif}`

    const map = line.type === "deductible" ? achizitiiMap : livrariMap
    const existing = map.get(cleanCif)

    if (existing) {
      existing.taxableBase += line.taxableBase
      existing.vatAmount += line.vatAmount
      existing.invoiceCount += 1
    } else {
      map.set(cleanCif, {
        partyTaxId: cleanCif,
        partyName,
        taxableBase: line.taxableBase,
        vatAmount: line.vatAmount,
        invoiceCount: 1,
        type: line.type === "deductible" ? "achizitii" : "livrari",
      })
    }
  }

  const achizitii = Array.from(achizitiiMap.values()).sort((a, b) => b.taxableBase - a.taxableBase)
  const livrari = Array.from(livrariMap.values()).sort((a, b) => b.taxableBase - a.taxableBase)

  const totalAchizitii = {
    taxableBase: achizitii.reduce((s, l) => s + l.taxableBase, 0),
    vatAmount: achizitii.reduce((s, l) => s + l.vatAmount, 0),
    partnerCount: achizitii.length,
  }
  const totalLivrari = {
    taxableBase: livrari.reduce((s, l) => s + l.taxableBase, 0),
    vatAmount: livrari.reduce((s, l) => s + l.vatAmount, 0),
    partnerCount: livrari.length,
  }

  const warnings: string[] = []
  if (livrari.length === 0 && achizitii.length === 0) {
    warnings.push("Nu am găsit tranzacții locale pentru D394 în această perioadă.")
  }

  return {
    period,
    achizitii,
    livrari,
    totalAchizitii,
    totalLivrari,
    generatedAtISO: nowISO,
    warnings,
  }
}

// ── SAF-T XML → VatTransactionLine[] extractor ──────────────────────────────

function findAllBlocks(xml: string, tag: string): string[] {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`<(?:\\w+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`, "gi")
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1])
  }
  return out
}

function findTagValue(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`<(?:\\w+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`, "i")
  return xml.match(re)?.[1]?.trim() ?? ""
}

export function extractVatLinesFromSaft(saftXml: string): VatTransactionLine[] {
  const lines: VatTransactionLine[] = []

  // Iterate prin Invoice/Payment în SourceDocuments (atât SalesInvoices cât și
  // PurchaseInvoices în SAF-T 2.4.7)
  const salesBlocks = findAllBlocks(saftXml, "SalesInvoices")
  const purchaseBlocks = findAllBlocks(saftXml, "PurchaseInvoices")

  for (const block of salesBlocks) {
    const invoices = findAllBlocks(block, "Invoice")
    for (const inv of invoices) {
      const vatRate = parseFloat(findTagValue(inv, "TaxPercentage")) || 0
      const taxableBase = parseFloat(findTagValue(inv, "DebitAmount") || findTagValue(inv, "TaxableAmount") || findTagValue(inv, "GrossTotal")) || 0
      const vatAmount = parseFloat(findTagValue(inv, "TaxAmount") || findTagValue(inv, "TaxPayable")) || 0
      const partyTaxId = findTagValue(inv, "CustomerID") || findTagValue(inv, "TaxRegistrationNumber")
      const partyName = findTagValue(inv, "CompanyName") || findTagValue(inv, "Name")
      const invoiceNumber = findTagValue(inv, "InvoiceNo") || findTagValue(inv, "InvoiceNumber")
      const invoiceDate = findTagValue(inv, "InvoiceDate") || findTagValue(inv, "IssueDate")

      // Detect intracom UE prin TaxCountryRegion sau by CIF prefix non-RO
      const taxCountry = findTagValue(inv, "TaxCountryRegion") || findTagValue(inv, "TaxBaseDescription")
      const isIntraCommunity = !!taxCountry && taxCountry !== "RO" && taxCountry.length === 2
      const isReverseCharge = findTagValue(inv, "ReverseCharge") === "true" || vatRate === 0 && isIntraCommunity

      lines.push({
        type: "collected",
        taxableBase,
        vatAmount,
        vatRate,
        partyTaxId: partyTaxId || undefined,
        partyName: partyName || undefined,
        isIntraCommunity,
        isReverseCharge,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate: invoiceDate || undefined,
      })
    }
  }

  for (const block of purchaseBlocks) {
    const invoices = findAllBlocks(block, "Invoice")
    for (const inv of invoices) {
      const vatRate = parseFloat(findTagValue(inv, "TaxPercentage")) || 0
      const taxableBase = parseFloat(findTagValue(inv, "CreditAmount") || findTagValue(inv, "TaxableAmount") || findTagValue(inv, "GrossTotal")) || 0
      const vatAmount = parseFloat(findTagValue(inv, "TaxAmount") || findTagValue(inv, "TaxPayable")) || 0
      const partyTaxId = findTagValue(inv, "SupplierID") || findTagValue(inv, "TaxRegistrationNumber")
      const partyName = findTagValue(inv, "CompanyName") || findTagValue(inv, "Name")
      const invoiceNumber = findTagValue(inv, "InvoiceNo") || findTagValue(inv, "InvoiceNumber")

      const taxCountry = findTagValue(inv, "TaxCountryRegion")
      const isIntraCommunity = !!taxCountry && taxCountry !== "RO" && taxCountry.length === 2
      const isReverseCharge = findTagValue(inv, "ReverseCharge") === "true"

      lines.push({
        type: "deductible",
        taxableBase,
        vatAmount,
        vatRate,
        partyTaxId: partyTaxId || undefined,
        partyName: partyName || undefined,
        isIntraCommunity,
        isReverseCharge,
        invoiceNumber: invoiceNumber || undefined,
      })
    }
  }

  return lines
}
