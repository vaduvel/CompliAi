// F#2 — Bank-SPV Reconciliation: parser extras bancar.
//
// Acceptă 3 formate:
//   1. MT940 (SWIFT standard) — toate băncile RO emit gratis
//   2. CAMT.053 XML (ISO 20022 / PSD2 EU standard)
//   3. CSV custom (oricare bancă cu export)
//
// Pure-TS, zero dependențe externe (parser minimalist pentru MVP).
// Phase 2: pentru cazuri mai complexe putem folosi mt940-js / camt-parser npm.

export type BankTransaction = {
  /** ID intern generat pentru reconciliere. */
  id: string
  /** Data tranzacției (ISO YYYY-MM-DD). */
  dateISO: string
  /** Suma în RON (negativ = debit / plată out, pozitiv = credit / încasare in). */
  amountRON: number
  /** Suma absolută pentru match (ignoră semn). */
  absoluteAmount: number
  /** Tip: "debit" (plata catre furnizor) sau "credit" (incasare client). */
  type: "debit" | "credit"
  /** Cont contraparte (IBAN cumparator/furnizor). */
  counterpartyIban?: string
  /** Nume contraparte (din narrative). */
  counterpartyName?: string
  /** Descriere / narrative complet (memo, ref, observații). */
  narrative: string
  /** Bank reference number (din extras). */
  bankRef?: string
  /** CUI extras automat din narrative dacă există. */
  detectedCif?: string
  /** Număr factură extras automat din narrative dacă există. */
  detectedInvoiceNumber?: string
}

export type ParsedBankStatement = {
  format: "MT940" | "CAMT053" | "CSV"
  accountIban?: string
  /** Solid de început (din extras). */
  openingBalanceRON?: number
  /** Solid final (din extras). */
  closingBalanceRON?: number
  /** Perioada extrasului. */
  periodFromISO?: string
  periodToISO?: string
  transactions: BankTransaction[]
  parseWarnings: string[]
}

// ── Helpers pentru extragere CUI / număr factură din narrative ────────────────

/** RO CUI: prefix optional "RO" + 2-10 cifre. */
const CIF_REGEX = /\b(RO)?(\d{2,10})\b/i

/** Pattern uzual număr factură: "F123", "FAC-2026-001", "FCT 12345", "nr. 456" */
const INVOICE_REGEX = /(?:fact[u-]?[a-z]*\s*(?:nr\.?\s*)?|nr\.?\s+)([a-z0-9-/]{2,20})/i

function extractCif(narrative: string): string | undefined {
  const m = narrative.match(CIF_REGEX)
  if (!m) return undefined
  const cif = (m[1] ?? "") + m[2]
  // Filtru: doar CIF realiste (≥6 cifre — CUI-uri RO au 2-10 cifre dar majoritatea sunt 6-10)
  if (m[2].length < 6) return undefined
  return cif.toUpperCase()
}

function extractInvoiceNumber(narrative: string): string | undefined {
  const m = narrative.match(INVOICE_REGEX)
  return m?.[1]
}

function makeId(): string {
  return `txn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ── CSV parser (cel mai simplu) ──────────────────────────────────────────────

/**
 * Parser CSV minimal — recunoaște format standard cu coloane:
 * date,amount,counterparty,narrative,reference
 *
 * Header detection auto. Suportă "Sumă" / "Amount" / "Suma" / "Valoare".
 * Separatori: virgulă sau tab sau ; (auto-detect).
 * Data: YYYY-MM-DD / DD.MM.YYYY / DD/MM/YYYY.
 */
export function parseCsvStatement(content: string): ParsedBankStatement {
  const warnings: string[] = []
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    return { format: "CSV", transactions: [], parseWarnings: ["Fișier gol."] }
  }

  // Detect separator
  const sample = lines[0]
  let sep = ","
  if (sample.split(";").length > sample.split(",").length) sep = ";"
  else if (sample.split("\t").length > sample.split(",").length) sep = "\t"

  // Headers (lower-case)
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""))

  const dateIdx = headers.findIndex((h) => /^(date|data|dată)$/.test(h))
  const amountIdx = headers.findIndex((h) => /^(amount|sumă|suma|valoare|val)$/.test(h))
  const narrIdx = headers.findIndex((h) => /^(narrative|descrier|descriere|detalii|memo|observ)/i.test(h))
  const refIdx = headers.findIndex((h) => /^(ref|reference|referință|nr\.?\s*ref)/i.test(h))
  const counterpartyIdx = headers.findIndex((h) =>
    /^(counterparty|nume|beneficiar|plătitor|emitent|destinatar)/i.test(h),
  )

  if (dateIdx === -1 || amountIdx === -1) {
    return {
      format: "CSV",
      transactions: [],
      parseWarnings: ["CSV nu conține coloanele 'date' și 'amount' (sau echivalent RO)."],
    }
  }

  const transactions: BankTransaction[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""))
    if (cols.length < 2) continue

    const dateRaw = cols[dateIdx]
    const amountRaw = cols[amountIdx].replace(/\./g, "").replace(",", ".")
    const amount = parseFloat(amountRaw)
    if (!dateRaw || Number.isNaN(amount)) continue

    const dateISO = normalizeDate(dateRaw)
    if (!dateISO) {
      warnings.push(`Linia ${i + 1}: data "${dateRaw}" nu poate fi parsată.`)
      continue
    }

    const narrative = narrIdx !== -1 ? cols[narrIdx] ?? "" : ""
    const counterparty = counterpartyIdx !== -1 ? cols[counterpartyIdx] : undefined
    const bankRef = refIdx !== -1 ? cols[refIdx] : undefined

    transactions.push({
      id: makeId(),
      dateISO,
      amountRON: amount,
      absoluteAmount: Math.abs(amount),
      type: amount < 0 ? "debit" : "credit",
      counterpartyName: counterparty,
      narrative,
      bankRef,
      detectedCif: extractCif(`${narrative} ${counterparty ?? ""}`),
      detectedInvoiceNumber: extractInvoiceNumber(`${narrative} ${bankRef ?? ""}`),
    })
  }

  return {
    format: "CSV",
    transactions,
    parseWarnings: warnings,
  }
}

function normalizeDate(input: string): string | null {
  // YYYY-MM-DD
  let m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // DD.MM.YYYY sau DD/MM/YYYY
  m = input.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // YYMMDD (MT940)
  m = input.match(/^(\d{2})(\d{2})(\d{2})$/)
  if (m) return `20${m[1]}-${m[2]}-${m[3]}`
  return null
}

// ── MT940 parser (SWIFT standard) ────────────────────────────────────────────

/**
 * MT940 e text plain cu blocuri identificate prin tag-uri ":XX:":
 *   :20: reference
 *   :25: account IBAN
 *   :28C: statement number
 *   :60F: opening balance
 *   :61: transaction (date type amount ref)
 *   :86: narrative
 *   :62F: closing balance
 *
 * Parser minimalist — extragere tranzacții via :61: + :86: pereche.
 */
export function parseMt940Statement(content: string): ParsedBankStatement {
  const warnings: string[] = []
  const transactions: BankTransaction[] = []
  let accountIban: string | undefined
  let openingBalance: number | undefined
  let closingBalance: number | undefined
  let periodFrom: string | undefined
  let periodTo: string | undefined

  // Tag pattern: ":XX:" sau ":XXX:" la început de linie
  const tagRegex = /^:(\d{2,3}[A-Z]?):(.*)$/

  const lines = content.split(/\r?\n/)
  let pendingTxn: Partial<BankTransaction> | null = null

  function flush() {
    if (pendingTxn && pendingTxn.dateISO && typeof pendingTxn.amountRON === "number") {
      transactions.push({
        id: makeId(),
        dateISO: pendingTxn.dateISO,
        amountRON: pendingTxn.amountRON,
        absoluteAmount: Math.abs(pendingTxn.amountRON),
        type: pendingTxn.amountRON < 0 ? "debit" : "credit",
        counterpartyIban: pendingTxn.counterpartyIban,
        counterpartyName: pendingTxn.counterpartyName,
        narrative: pendingTxn.narrative ?? "",
        bankRef: pendingTxn.bankRef,
        detectedCif: extractCif(pendingTxn.narrative ?? ""),
        detectedInvoiceNumber: extractInvoiceNumber(pendingTxn.narrative ?? ""),
      })
    }
    pendingTxn = null
  }

  for (const rawLine of lines) {
    const m = rawLine.match(tagRegex)
    if (!m) {
      // Continuation line (de obicei pentru :86: narrative pe mai multe linii)
      if (pendingTxn) {
        pendingTxn.narrative = `${pendingTxn.narrative ?? ""} ${rawLine.trim()}`.trim()
      }
      continue
    }
    const tag = m[1]
    const value = m[2].trim()

    switch (tag) {
      case "25":
      case "25P":
        accountIban = value
        break
      case "60F":
      case "60M": {
        const bal = parseMt940Balance(value)
        openingBalance = bal.amount
        if (bal.dateISO) periodFrom = bal.dateISO
        break
      }
      case "61": {
        flush()
        const parsed = parseMt940Transaction61(value)
        if (parsed) {
          pendingTxn = {
            dateISO: parsed.dateISO,
            amountRON: parsed.amount,
            bankRef: parsed.bankRef,
          }
        } else {
          warnings.push(`Linia ":61:" nu poate fi parsată: ${value.slice(0, 50)}`)
        }
        break
      }
      case "86":
        if (pendingTxn) {
          pendingTxn.narrative = `${pendingTxn.narrative ?? ""} ${value}`.trim()
        }
        break
      case "62F":
      case "62M": {
        const bal = parseMt940Balance(value)
        closingBalance = bal.amount
        if (bal.dateISO) periodTo = bal.dateISO
        flush()
        break
      }
    }
  }
  flush()

  return {
    format: "MT940",
    accountIban,
    openingBalanceRON: openingBalance,
    closingBalanceRON: closingBalance,
    periodFromISO: periodFrom,
    periodToISO: periodTo,
    transactions,
    parseWarnings: warnings,
  }
}

function parseMt940Balance(value: string): { amount: number; dateISO?: string } {
  // Format: C/D YYMMDD CCY amount   (ex: C260511RON1234,56)
  const m = value.match(/^([CD])(\d{6})([A-Z]{3})([\d,.]+)/)
  if (!m) return { amount: 0 }
  const sign = m[1] === "D" ? -1 : 1
  const dateISO = normalizeDate(m[2]) ?? undefined
  const amount = sign * parseFloat(m[4].replace(/\./g, "").replace(",", "."))
  return { amount, dateISO }
}

function parseMt940Transaction61(value: string): { dateISO: string; amount: number; bankRef?: string } | null {
  // Format: YYMMDD[MMDD]?D/C[R]?amount[N|S]TRANSREF//BANKREF
  // Simplificat — caut date + tip + sumă.
  const m = value.match(/^(\d{6})(?:\d{4})?([CD])R?([\d,.]+)/)
  if (!m) return null
  const dateISO = normalizeDate(m[1])
  if (!dateISO) return null
  const sign = m[2] === "D" ? -1 : 1
  const amount = sign * parseFloat(m[3].replace(/\./g, "").replace(",", "."))
  const refMatch = value.match(/\/\/([^\s]+)/)
  return { dateISO, amount, bankRef: refMatch?.[1] }
}

// ── CAMT.053 XML parser ──────────────────────────────────────────────────────

/**
 * CAMT.053 (ISO 20022) — XML cu structura Document/BkToCstmrStmt/Stmt/Ntry.
 * Parser regex-based pentru simplitate (nu folosim XML DOM full).
 */
export function parseCamt053Statement(content: string): ParsedBankStatement {
  const warnings: string[] = []
  const transactions: BankTransaction[] = []

  // Account IBAN
  const ibanMatch = content.match(/<IBAN>([^<]+)<\/IBAN>/)
  const accountIban = ibanMatch?.[1]

  // Iterate prin <Ntry>...</Ntry> blocks
  const ntryRegex = /<Ntry>([\s\S]*?)<\/Ntry>/g
  let m: RegExpExecArray | null
  while ((m = ntryRegex.exec(content)) !== null) {
    const block = m[1]
    const amtMatch = block.match(/<Amt[^>]*>([\d.]+)<\/Amt>/)
    const cdtDbtMatch = block.match(/<CdtDbtInd>(CRDT|DBIT)<\/CdtDbtInd>/)
    const dateMatch =
      block.match(/<BookgDt>\s*<Dt>([^<]+)<\/Dt>/) || block.match(/<ValDt>\s*<Dt>([^<]+)<\/Dt>/)
    const refMatch = block.match(/<EndToEndId>([^<]+)<\/EndToEndId>/)
    const partyNameMatch =
      block.match(/<Dbtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/) || block.match(/<Cdtr>[\s\S]*?<Nm>([^<]+)<\/Nm>/)
    const narrMatch = block.match(/<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/)

    if (!amtMatch || !cdtDbtMatch || !dateMatch) {
      warnings.push("CAMT.053 entry incomplet (lipsește Amt/CdtDbtInd/Dt).")
      continue
    }
    const isDebit = cdtDbtMatch[1] === "DBIT"
    const amount = (isDebit ? -1 : 1) * parseFloat(amtMatch[1])
    const dateISO = normalizeDate(dateMatch[1]) ?? dateMatch[1]
    const narrative = `${narrMatch?.[1] ?? ""} ${partyNameMatch?.[1] ?? ""}`.trim()

    transactions.push({
      id: makeId(),
      dateISO,
      amountRON: amount,
      absoluteAmount: Math.abs(amount),
      type: isDebit ? "debit" : "credit",
      counterpartyName: partyNameMatch?.[1],
      narrative,
      bankRef: refMatch?.[1],
      detectedCif: extractCif(narrative),
      detectedInvoiceNumber: extractInvoiceNumber(narrative),
    })
  }

  return {
    format: "CAMT053",
    accountIban,
    transactions,
    parseWarnings: warnings,
  }
}

// ── Auto-detect format + dispatch ────────────────────────────────────────────

export function parseBankStatement(content: string): ParsedBankStatement {
  const trimmed = content.trim()
  // CAMT.053: începe cu <?xml sau <Document
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<Document") || trimmed.includes("<BkToCstmrStmt")) {
    return parseCamt053Statement(trimmed)
  }
  // MT940: începe cu :20: sau conține :61:
  if (/^:20:/m.test(trimmed) || /^:61:/m.test(trimmed)) {
    return parseMt940Statement(trimmed)
  }
  // Fallback CSV
  return parseCsvStatement(trimmed)
}
