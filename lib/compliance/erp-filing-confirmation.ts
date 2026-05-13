// Unified ERP / SPV filing confirmation matcher.
//
// Când o sursă externă (SmartBill, Oblio, Saga, SPV ANAF, sau confirmare
// manuală) raportează că o declarație fiscală a fost depusă, asociem
// confirmarea la FilingRecord-ul potrivit din calendarul nostru și flip
// status la `on_time` / `late` în funcție de data depunerii vs termenul.
//
// Pure functions — caller gestionează state persistence.

import type { FilingRecord, FilingStatus, FilingType } from "@/lib/compliance/filing-discipline"

// ── Types ────────────────────────────────────────────────────────────────────

export type ConfirmationSource =
  | "smartbill"        // SmartBill API confirmare e-Factura per lună
  | "oblio"            // Oblio API similar
  | "saga"             // Saga upload SAF-T XML
  | "spv"              // ANAF SPV recipisă oficială
  | "manual"           // Contabil marchează manual din UI
  | "webhook"          // Webhook de la alt soft (Contzilla, ContaCloud, etc.)

export type FilingConfirmation = {
  /** Tipul filing-ului confirmat. */
  filingType: FilingType
  /** Perioada (YYYY-MM sau YYYY-QN sau YYYY). */
  period: string
  /** Sursa confirmării. */
  source: ConfirmationSource
  /** Data efectivă a depunerii (ISO). Default = now. */
  filedAtISO?: string
  /** Referință externă (nr. SPV, ID SmartBill, etc.). Util pentru audit. */
  externalReference?: string
  /** Notă opțională adăugată la filing. */
  note?: string
}

export type ConfirmationMatch = {
  /** FilingRecord matchat în calendar. */
  filingId: string
  /** Status care va rezulta (on_time / late). */
  resultStatus: FilingStatus
  /** Diferența în zile între filedAtISO și dueISO (negativ = înainte). */
  daysVsDeadline: number
  /** True dacă era restanță (status era missing). */
  wasOverdue: boolean
}

export type MatchResult =
  | { ok: true; match: ConfirmationMatch }
  | { ok: false; reason: "no-matching-filing" | "already-filed" | "invalid-period" }

// ── Matcher pur ──────────────────────────────────────────────────────────────

/**
 * Caută în calendarul org un FilingRecord care se potrivește cu confirmarea.
 * Strategia: match exact pe (filingType, period). Dacă period e un YYYY-MM
 * dar găsim un YYYY-QN care îl conține, match e considerat ambiguu (return
 * `no-matching-filing` — caller trebuie să dezambiguize).
 */
export function matchFilingFromConfirmation(
  filings: FilingRecord[],
  confirmation: FilingConfirmation,
  nowISO: string,
): MatchResult {
  if (!isValidPeriod(confirmation.period)) {
    return { ok: false, reason: "invalid-period" }
  }

  const filedAtISO = confirmation.filedAtISO ?? nowISO

  // Match exact (type + period)
  const exact = filings.find(
    (f) =>
      f.type === confirmation.filingType && f.period === confirmation.period,
  )

  if (!exact) {
    return { ok: false, reason: "no-matching-filing" }
  }

  // Dacă deja e depus (on_time / rectified), nu suprascriem.
  if (exact.status === "on_time" || exact.status === "rectified") {
    return { ok: false, reason: "already-filed" }
  }

  // Calculăm dacă a fost depus la timp sau cu întârziere
  const dueMs = new Date(exact.dueISO).getTime()
  const filedMs = new Date(filedAtISO).getTime()
  const daysVsDeadline = Math.floor((filedMs - dueMs) / 86_400_000)
  const wasOverdue = exact.status === "missing"
  const resultStatus: FilingStatus = daysVsDeadline > 0 ? "late" : "on_time"

  return {
    ok: true,
    match: {
      filingId: exact.id,
      resultStatus,
      daysVsDeadline,
      wasOverdue,
    },
  }
}

// ── Apply confirmation pe lista filings (reducer pur) ────────────────────────

export type ApplyResult = {
  updatedFilings: FilingRecord[]
  applied: boolean
  match?: ConfirmationMatch
  /** Reason dacă nu s-a aplicat. */
  reason?: "no-matching-filing" | "already-filed" | "invalid-period"
}

/**
 * Aplică o confirmare pe lista de filings — întoarce lista nouă cu filing-ul
 * matchat actualizat (status flip + filedAtISO + note cu sursa).
 */
export function applyFilingConfirmation(
  filings: FilingRecord[],
  confirmation: FilingConfirmation,
  nowISO: string,
): ApplyResult {
  const match = matchFilingFromConfirmation(filings, confirmation, nowISO)

  if (!match.ok) {
    return { updatedFilings: filings, applied: false, reason: match.reason }
  }

  const filedAtISO = confirmation.filedAtISO ?? nowISO
  const sourceLabel = SOURCE_LABELS[confirmation.source]
  const refLabel = confirmation.externalReference
    ? ` (ref: ${confirmation.externalReference})`
    : ""
  const noteAddendum = `[Confirmat din ${sourceLabel}${refLabel} la ${filedAtISO.slice(0, 10)}]`

  const updatedFilings = filings.map((f) => {
    if (f.id !== match.match.filingId) return f
    const existingNote = f.note ?? ""
    const newNote = existingNote
      ? `${existingNote}\n${noteAddendum}${confirmation.note ? ` — ${confirmation.note}` : ""}`
      : `${noteAddendum}${confirmation.note ? ` — ${confirmation.note}` : ""}`
    return {
      ...f,
      status: match.match.resultStatus,
      filedAtISO,
      note: newNote,
    }
  })

  return { updatedFilings, applied: true, match: match.match }
}

// ── Apply multiple confirmations (batch) ─────────────────────────────────────

/**
 * Aplică multiple confirmări într-o singură trecere — util pentru cron-uri
 * care procesează N recipise SPV o dată sau N facturi SmartBill care implică
 * raportul lunar.
 */
export function applyBatchConfirmations(
  filings: FilingRecord[],
  confirmations: FilingConfirmation[],
  nowISO: string,
): {
  updatedFilings: FilingRecord[]
  appliedCount: number
  skippedCount: number
  alreadyFiledCount: number
  noMatchCount: number
  matches: ConfirmationMatch[]
} {
  let workingFilings = filings
  let appliedCount = 0
  let skippedCount = 0
  let alreadyFiledCount = 0
  let noMatchCount = 0
  const matches: ConfirmationMatch[] = []

  for (const confirmation of confirmations) {
    const result = applyFilingConfirmation(workingFilings, confirmation, nowISO)
    if (result.applied && result.match) {
      workingFilings = result.updatedFilings
      appliedCount++
      matches.push(result.match)
    } else {
      skippedCount++
      if (result.reason === "already-filed") alreadyFiledCount++
      else if (result.reason === "no-matching-filing") noMatchCount++
    }
  }

  return {
    updatedFilings: workingFilings,
    appliedCount,
    skippedCount,
    alreadyFiledCount,
    noMatchCount,
    matches,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<ConfirmationSource, string> = {
  smartbill: "SmartBill",
  oblio: "Oblio",
  saga: "Saga",
  spv: "ANAF SPV",
  manual: "Manual",
  webhook: "Webhook extern",
}

function isValidPeriod(period: string): boolean {
  return (
    /^\d{4}-\d{2}$/.test(period) ||  // YYYY-MM
    /^\d{4}-Q[1-4]$/.test(period) || // YYYY-Q1..4
    /^\d{4}$/.test(period)           // YYYY (anual)
  )
}

// ── Inferență source: din invoice-uri SmartBill detectăm raportul lunar ─────

/**
 * Dat fiind un set de facturi SmartBill pe o lună, determinăm dacă raportul
 * lunar e-Factura B2C poate fi considerat "depus" automat — adică toate
 * facturile lunii au status `valida` la ANAF.
 *
 * Returnează confirmation sau null dacă raportul nu poate fi flip-uit (ex:
 * unele facturi încă în validare sau cu eroare).
 */
export function inferEFacturaMonthlyConfirmation(input: {
  period: string  // YYYY-MM
  invoices: Array<{ efacturaStatus?: string; total?: number }>
  source: ConfirmationSource
  filedAtISO?: string
}): FilingConfirmation | null {
  if (!isValidPeriod(input.period)) return null
  if (input.invoices.length === 0) return null

  const allValid = input.invoices.every(
    (inv) =>
      inv.efacturaStatus === "valida" ||
      inv.efacturaStatus === "validated",
  )

  if (!allValid) return null

  return {
    filingType: "efactura_monthly",
    period: input.period,
    source: input.source,
    filedAtISO: input.filedAtISO,
    externalReference: `${input.invoices.length} facturi`,
    note: `Toate ${input.invoices.length} facturi pe ${input.period} validate de ANAF.`,
  }
}
