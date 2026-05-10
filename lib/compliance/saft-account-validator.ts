// Pre-flight validator pentru plan de conturi SAF-T (D406).
//
// Erori comune raportate de contabili pe forumul SAGA:
//   - Cont 442 cu 3 cifre în loc de 4 (de ex. "442" în loc de "4423")
//   - ProductCode lipsă pe linii de produse
//   - VAT codes nestandardizate (ex. "TVA19" în loc de "STANDARD_19")
//   - GeneralLedgerAccounts neînchise corect
//   - Customer/Supplier fără TaxID structurat (RO + 8-10 cifre)
//
// Rulăm aceste verificări ÎNAINTE ca user-ul să trimită SAF-T la ANAF, ca să
// prindă structuri eronate în clientul de contabilitate.
//
// Pure functions. Returnăm AccountValidationFinding[] cu cod + severity + linie.

export type AccountValidationFinding = {
  code: string                     // ex: SA-001, SA-002
  severity: "error" | "warning"
  category: "general_ledger" | "vat_codes" | "tax_id" | "product_codes" | "structure"
  message: string
  context?: string                 // valoarea greșită extrasă din XML
  recommendedFix?: string
}

const ACCOUNT_NUMBER_PATTERN = /^\d{3,7}$/
const VAT_ACCOUNT_PREFIX = ["442", "4423", "4426", "4427", "4428"]
const REQUIRED_VAT_ACCOUNTS = ["4423", "4426", "4427"]
const ROMANIAN_TAX_ID_PATTERN = /^(RO)?\d{2,10}$/i

// ── Tag extraction (regex-based, no DOM) ─────────────────────────────────────

function findAllTagValues(xml: string, tag: string): string[] {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:\\w+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`,
    "gi",
  )
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(xml)) !== null) {
    out.push(m[1].trim())
  }
  return out
}

function findAllBlocks(xml: string, tag: string): string[] {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(
    `<(?:\\w+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`,
    "gi",
  )
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(xml)) !== null) {
    out.push(m[1])
  }
  return out
}

function findTagValue(xml: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`<(?:\\w+:)?${escaped}(?=[\\s>])[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${escaped}>`, "i")
  return xml.match(re)?.[1]?.trim() ?? ""
}

// ── Validators ───────────────────────────────────────────────────────────────

function validateGeneralLedgerAccounts(xml: string): AccountValidationFinding[] {
  const out: AccountValidationFinding[] = []
  const accountIds = findAllTagValues(xml, "AccountID")
  const seenAccounts = new Set<string>()

  for (const id of accountIds) {
    if (!ACCOUNT_NUMBER_PATTERN.test(id)) {
      out.push({
        code: "SA-001",
        severity: "error",
        category: "general_ledger",
        message: `AccountID "${id}" nu respectă formatul plan de conturi RO (3-7 cifre).`,
        context: id,
        recommendedFix:
          "Corectează în programul contabil planul de conturi — ex: contul 442 trebuie să fie 4423/4426/4427.",
      })
    }
    seenAccounts.add(id)
  }

  // Verifică prezența conturilor TVA obligatorii
  for (const required of REQUIRED_VAT_ACCOUNTS) {
    if (!seenAccounts.has(required)) {
      const hasTruncated = Array.from(seenAccounts).some(
        (a) => a.startsWith(required.slice(0, 3)) && a !== required,
      )
      if (hasTruncated) {
        out.push({
          code: "SA-002",
          severity: "error",
          category: "general_ledger",
          message: `Cont ${required} (TVA) lipsește dar există conturi 442 trunchiate (cifre lipsă).`,
          recommendedFix: `Adaugă în plan conturile detaliate: ${REQUIRED_VAT_ACCOUNTS.join(", ")}.`,
        })
      }
    }
  }

  return out
}

function validateVatCodes(xml: string): AccountValidationFinding[] {
  const out: AccountValidationFinding[] = []
  const taxCodes = findAllTagValues(xml, "TaxCode")
  const standardCodes = ["STANDARD", "REDUCED_5", "REDUCED_9", "REDUCED_19", "ZERO", "EXEMPT", "REVERSE_CHARGE"]

  for (const code of taxCodes) {
    const upper = code.toUpperCase()
    const isStandard = standardCodes.some((std) => upper.includes(std))
    const isPercent = /^\d{1,2}$/.test(code) && parseInt(code, 10) <= 25
    if (!isStandard && !isPercent) {
      out.push({
        code: "SA-003",
        severity: "warning",
        category: "vat_codes",
        message: `TaxCode "${code}" nu pare standard. Verifică nomenclator ANAF SAF-T.`,
        context: code,
        recommendedFix: 'Folosește coduri standard: "STANDARD", "REDUCED_5", "REDUCED_9", "ZERO", etc.',
      })
    }
  }

  return out
}

function validateTaxIds(xml: string): AccountValidationFinding[] {
  const out: AccountValidationFinding[] = []
  // CIF pe Customer/Supplier
  const customerBlocks = findAllBlocks(xml, "Customer")
  const supplierBlocks = findAllBlocks(xml, "Supplier")

  for (const block of [...customerBlocks, ...supplierBlocks]) {
    const taxId = findTagValue(block, "TaxRegistrationNumber") || findTagValue(block, "CompanyID")
    if (!taxId) continue
    const cleaned = taxId.replace(/\s/g, "")
    if (!ROMANIAN_TAX_ID_PATTERN.test(cleaned)) {
      out.push({
        code: "SA-004",
        severity: "warning",
        category: "tax_id",
        message: `TaxRegistrationNumber "${taxId}" nu pare valid (așteptăm RO12345678 sau 12345678).`,
        context: taxId,
      })
    }
  }

  return out
}

function validateProductCodes(xml: string): AccountValidationFinding[] {
  const out: AccountValidationFinding[] = []
  const productBlocks = findAllBlocks(xml, "Product")
  let missingCodeCount = 0

  for (const block of productBlocks) {
    const productCode = findTagValue(block, "ProductCode") || findTagValue(block, "ProductNumberCode")
    if (!productCode) {
      missingCodeCount++
    }
  }

  if (missingCodeCount > 0) {
    out.push({
      code: "SA-005",
      severity: missingCodeCount > 5 ? "error" : "warning",
      category: "product_codes",
      message: `${missingCodeCount} produse fără ProductCode. ANAF poate respinge SAF-T pentru produse neidentificate.`,
      recommendedFix:
        "Setează un ProductCode unic per produs/serviciu în nomenclatorul aplicației contabile.",
    })
  }

  return out
}

function validateStructureBalance(xml: string): AccountValidationFinding[] {
  const out: AccountValidationFinding[] = []
  // Verifică debit/credit balance la nivel de Journal/Transaction
  const transactions = findAllBlocks(xml, "Transaction")
  for (const [idx, tx] of transactions.entries()) {
    const debits = findAllTagValues(tx, "DebitAmount")
      .map((s) => parseFloat(s) || 0)
      .reduce((s, n) => s + n, 0)
    const credits = findAllTagValues(tx, "CreditAmount")
      .map((s) => parseFloat(s) || 0)
      .reduce((s, n) => s + n, 0)
    if (debits > 0 && credits > 0 && Math.abs(debits - credits) > 0.05) {
      out.push({
        code: "SA-006",
        severity: "error",
        category: "structure",
        message: `Tranzacția #${idx + 1}: debit ${debits.toFixed(2)} ≠ credit ${credits.toFixed(2)}. SAF-T va fi respins de ANAF.`,
        recommendedFix: "Reverifică nota contabilă în program și redepune SAF-T.",
      })
    }
  }
  return out
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function validateSaftAccountStructure(xml: string): AccountValidationFinding[] {
  if (!xml || xml.length < 100) return []
  return [
    ...validateGeneralLedgerAccounts(xml),
    ...validateVatCodes(xml),
    ...validateTaxIds(xml),
    ...validateProductCodes(xml),
    ...validateStructureBalance(xml),
  ]
}
