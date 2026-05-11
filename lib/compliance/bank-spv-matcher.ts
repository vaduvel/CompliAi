// F#2 — Bank-SPV reconciliation matcher (Sprint 3-4 - 2026-05-11).
//
// Fuzzy match între tranzacții bancare și facturi din SPV ANAF (sau ERP).
// Criterii (toate ponderate):
//   1. CUI / CIF — match exact = 40 puncte
//   2. Sumă — match exact (±0.01) = 30 puncte; ±5% = 15 puncte
//   3. Dată — same day = 20 puncte; ±3 zile = 10 puncte; ±7 zile = 5
//   4. Număr factură — match exact = 10 puncte; substring = 5
//
// Threshold: 60+ puncte = high confidence (auto-match)
//             40-59 puncte = manual review
//             <40 puncte = no match
//
// Phase 2: ML scoring (Transformers.js sentence similarity pe narrative).

import type { BankTransaction } from "@/lib/compliance/bank-statement-parser"

export type InvoiceForMatch = {
  /** ID intern al facturii (din SPV / ERP). */
  id: string
  /** Număr factură. */
  invoiceNumber: string
  /** CUI parte (furnizor pentru factură primită, client pentru emisă). */
  partyCif: string
  /** Nume parte. */
  partyName?: string
  /** Suma totală facturii (RON). */
  totalRON: number
  /** Data emiterii. */
  issueDateISO: string
  /** Direction: "received" sau "issued". */
  direction: "received" | "issued"
}

export type MatchScore = {
  cifMatch: number
  amountMatch: number
  dateMatch: number
  invoiceNumberMatch: number
  total: number
}

export type ReconciliationMatch = {
  transaction: BankTransaction
  invoice: InvoiceForMatch
  score: MatchScore
  confidence: "high" | "medium" | "low"
}

export type ReconciliationResult = {
  matches: ReconciliationMatch[]
  unmatched_transactions: BankTransaction[]
  unmatched_invoices: InvoiceForMatch[]
  totalTransactions: number
  totalInvoices: number
  matchedHigh: number
  matchedMedium: number
  unmatched: number
  /** Procent acoperire (matched_high + medium / total tranzacții). */
  coveragePct: number
}

const HIGH_CONFIDENCE_THRESHOLD = 60
const MEDIUM_CONFIDENCE_THRESHOLD = 40

// ── Scoring functions ────────────────────────────────────────────────────────

function normalizeCif(cif: string | undefined): string {
  if (!cif) return ""
  return cif.replace(/^RO/i, "").replace(/\s+/g, "").trim()
}

function daysApart(dateA: string, dateB: string): number {
  const a = new Date(`${dateA.slice(0, 10)}T00:00:00.000Z`).getTime()
  const b = new Date(`${dateB.slice(0, 10)}T00:00:00.000Z`).getTime()
  return Math.abs(Math.round((a - b) / 86_400_000))
}

function scoreCif(txnCif: string | undefined, invoiceCif: string): number {
  const a = normalizeCif(txnCif)
  const b = normalizeCif(invoiceCif)
  if (!a || !b) return 0
  return a === b ? 40 : 0
}

function scoreAmount(txnAbs: number, invoiceAmount: number): number {
  if (txnAbs <= 0 || invoiceAmount <= 0) return 0
  const diff = Math.abs(txnAbs - invoiceAmount)
  if (diff < 0.02) return 30 // ±0.01 = match exact (acoperă rounding)
  const pct = diff / invoiceAmount
  if (pct < 0.01) return 25
  if (pct < 0.05) return 15
  if (pct < 0.10) return 5
  return 0
}

function scoreDate(txnDate: string, invoiceDate: string): number {
  const days = daysApart(txnDate, invoiceDate)
  if (days === 0) return 20
  if (days <= 3) return 10
  if (days <= 7) return 5
  if (days <= 14) return 2
  return 0
}

function scoreInvoiceNumber(detectedNum: string | undefined, invoiceNumber: string): number {
  if (!detectedNum || !invoiceNumber) return 0
  const a = detectedNum.replace(/[\s/-]/g, "").toLowerCase()
  const b = invoiceNumber.replace(/[\s/-]/g, "").toLowerCase()
  if (a === b) return 10
  if (a.length >= 3 && b.includes(a)) return 7
  if (b.length >= 3 && a.includes(b)) return 7
  return 0
}

export function scoreMatch(txn: BankTransaction, inv: InvoiceForMatch): MatchScore {
  // Compatibility: plata out (debit) → factură primită (received) — match CUI = furnizor
  // Incasare in (credit) → factură emisă (issued) — match CUI = client
  const directionCompatible =
    (txn.type === "debit" && inv.direction === "received") ||
    (txn.type === "credit" && inv.direction === "issued")

  if (!directionCompatible) {
    return { cifMatch: 0, amountMatch: 0, dateMatch: 0, invoiceNumberMatch: 0, total: 0 }
  }

  const cifMatch = scoreCif(txn.detectedCif, inv.partyCif)
  const amountMatch = scoreAmount(txn.absoluteAmount, inv.totalRON)
  const dateMatch = scoreDate(txn.dateISO, inv.issueDateISO)
  const invoiceNumberMatch = scoreInvoiceNumber(txn.detectedInvoiceNumber, inv.invoiceNumber)

  return {
    cifMatch,
    amountMatch,
    dateMatch,
    invoiceNumberMatch,
    total: cifMatch + amountMatch + dateMatch + invoiceNumberMatch,
  }
}

function classifyConfidence(score: number): ReconciliationMatch["confidence"] {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return "high"
  if (score >= MEDIUM_CONFIDENCE_THRESHOLD) return "medium"
  return "low"
}

// ── Main reconciliation engine ───────────────────────────────────────────────

/**
 * Algoritm: Hungarian-lite greedy match.
 *   1. Calculez score per combinație txn × invoice.
 *   2. Sortez descrescător.
 *   3. Iau perechi greedy: cel mai bun match, marchez ambele ca "luate".
 *   4. Repet pentru următorul cel mai bun match.
 *
 * Pentru cabinete cu portofoliu mare (>1000 facturi × 1000 tranzacții),
 * Phase 2 putem optimiza cu prefiltrare pe CUI + dată.
 */
export function reconcile(
  transactions: BankTransaction[],
  invoices: InvoiceForMatch[],
  options: { minScore?: number } = {},
): ReconciliationResult {
  const minScore = options.minScore ?? MEDIUM_CONFIDENCE_THRESHOLD

  // Compute all pairs with score >= minScore
  type Pair = { txnIdx: number; invIdx: number; score: MatchScore }
  const pairs: Pair[] = []

  for (let t = 0; t < transactions.length; t++) {
    for (let i = 0; i < invoices.length; i++) {
      const score = scoreMatch(transactions[t], invoices[i])
      if (score.total >= minScore) {
        pairs.push({ txnIdx: t, invIdx: i, score })
      }
    }
  }

  pairs.sort((a, b) => b.score.total - a.score.total)

  // Greedy match: ia cel mai bun, marchează ambele ca used
  const usedTxn = new Set<number>()
  const usedInv = new Set<number>()
  const matches: ReconciliationMatch[] = []

  for (const p of pairs) {
    if (usedTxn.has(p.txnIdx) || usedInv.has(p.invIdx)) continue
    matches.push({
      transaction: transactions[p.txnIdx],
      invoice: invoices[p.invIdx],
      score: p.score,
      confidence: classifyConfidence(p.score.total),
    })
    usedTxn.add(p.txnIdx)
    usedInv.add(p.invIdx)
  }

  const unmatched_transactions = transactions.filter((_, idx) => !usedTxn.has(idx))
  const unmatched_invoices = invoices.filter((_, idx) => !usedInv.has(idx))
  const matchedHigh = matches.filter((m) => m.confidence === "high").length
  const matchedMedium = matches.filter((m) => m.confidence === "medium").length
  const coveragePct =
    transactions.length > 0
      ? Math.round(((matchedHigh + matchedMedium) / transactions.length) * 100)
      : 0

  return {
    matches,
    unmatched_transactions,
    unmatched_invoices,
    totalTransactions: transactions.length,
    totalInvoices: invoices.length,
    matchedHigh,
    matchedMedium,
    unmatched: unmatched_transactions.length,
    coveragePct,
  }
}

// ── Cash-flow forecasting (simple regresie pe încasări lunare) ───────────────

export type CashflowForecast = {
  historyMonths: number
  avgMonthlyInflow: number
  avgMonthlyOutflow: number
  avgMonthlyNet: number
  next30Days: number
  next60Days: number
  next90Days: number
  /** Tendință: "rising", "stable", "falling". */
  trend: "rising" | "stable" | "falling"
}

/**
 * Calcul agregate lunare pentru last N months + extrapolare liniară.
 * Pentru MVP — regresie liniară simplă pe net mensual.
 */
export function forecastCashflow(
  transactions: BankTransaction[],
  monthsHistory: number = 6,
): CashflowForecast {
  if (transactions.length === 0) {
    return {
      historyMonths: 0,
      avgMonthlyInflow: 0,
      avgMonthlyOutflow: 0,
      avgMonthlyNet: 0,
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      trend: "stable",
    }
  }

  // Group by YYYY-MM
  const byMonth = new Map<string, { inflow: number; outflow: number }>()
  for (const txn of transactions) {
    const key = txn.dateISO.slice(0, 7)
    if (!byMonth.has(key)) byMonth.set(key, { inflow: 0, outflow: 0 })
    const bucket = byMonth.get(key)!
    if (txn.amountRON >= 0) bucket.inflow += txn.amountRON
    else bucket.outflow += Math.abs(txn.amountRON)
  }

  const months = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b))
  const recent = months.slice(-monthsHistory)
  if (recent.length === 0) {
    return {
      historyMonths: 0,
      avgMonthlyInflow: 0,
      avgMonthlyOutflow: 0,
      avgMonthlyNet: 0,
      next30Days: 0,
      next60Days: 0,
      next90Days: 0,
      trend: "stable",
    }
  }

  const totalIn = recent.reduce((s, [, v]) => s + v.inflow, 0)
  const totalOut = recent.reduce((s, [, v]) => s + v.outflow, 0)
  const avgIn = totalIn / recent.length
  const avgOut = totalOut / recent.length
  const avgNet = avgIn - avgOut

  // Trend: compară prima jumătate vs a doua jumătate
  const half = Math.floor(recent.length / 2)
  const firstNet = recent.slice(0, half).reduce((s, [, v]) => s + (v.inflow - v.outflow), 0) / Math.max(1, half)
  const secondNet =
    recent.slice(half).reduce((s, [, v]) => s + (v.inflow - v.outflow), 0) / Math.max(1, recent.length - half)
  let trend: CashflowForecast["trend"] = "stable"
  if (secondNet > firstNet * 1.15) trend = "rising"
  else if (secondNet < firstNet * 0.85) trend = "falling"

  return {
    historyMonths: recent.length,
    avgMonthlyInflow: Math.round(avgIn * 100) / 100,
    avgMonthlyOutflow: Math.round(avgOut * 100) / 100,
    avgMonthlyNet: Math.round(avgNet * 100) / 100,
    next30Days: Math.round(avgNet),
    next60Days: Math.round(avgNet * 2),
    next90Days: Math.round(avgNet * 3),
    trend,
  }
}
