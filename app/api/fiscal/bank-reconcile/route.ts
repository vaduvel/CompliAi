// F#2 — Bank-SPV Reconciliation API.
//
// POST body: { statementContent: string, invoices: InvoiceForMatch[] }
// Returns: ReconciliationResult + CashflowForecast.
//
// Stateless — fără storage. Cabinetul uploadează extras + transmite lista
// facturi din ERP (sau le primește direct via state). Reconciliere returnată
// imediat. Phase 2: salvare istoric pentru pattern detection.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { parseBankStatement } from "@/lib/compliance/bank-statement-parser"
import { forecastCashflow, reconcile, type InvoiceForMatch } from "@/lib/compliance/bank-spv-matcher"

export async function POST(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "Bank-SPV reconcile")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "BANK_RECONCILE_AUTH_FAILED")
  }

  let body: { statementContent?: string; invoices?: InvoiceForMatch[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return jsonError("Body invalid.", 400, "BANK_INVALID_BODY")
  }

  if (!body.statementContent || typeof body.statementContent !== "string") {
    return jsonError("statementContent (string) obligatoriu.", 400, "BANK_NO_STATEMENT")
  }
  if (body.statementContent.length > 5_000_000) {
    return jsonError("Statement prea mare (max 5 MB).", 413, "BANK_TOO_LARGE")
  }

  const invoices = Array.isArray(body.invoices) ? body.invoices : []

  // Parse statement
  const parsed = parseBankStatement(body.statementContent)
  if (parsed.transactions.length === 0) {
    return NextResponse.json({
      ok: true,
      parsed,
      reconciliation: null,
      forecast: forecastCashflow([]),
      message:
        "Nu s-au extras tranzacții din extras. Verifică formatul fișierului (MT940/CAMT.053/CSV).",
    })
  }

  // Reconcile
  const reconciliation = reconcile(parsed.transactions, invoices)
  const forecast = forecastCashflow(parsed.transactions)

  return NextResponse.json({
    ok: true,
    parsed: {
      format: parsed.format,
      accountIban: parsed.accountIban,
      periodFromISO: parsed.periodFromISO,
      periodToISO: parsed.periodToISO,
      openingBalanceRON: parsed.openingBalanceRON,
      closingBalanceRON: parsed.closingBalanceRON,
      transactionCount: parsed.transactions.length,
      parseWarnings: parsed.parseWarnings,
    },
    reconciliation,
    forecast,
    note: "Reconciliere informativă — verifică manual potrivirile cu confidence 'medium' înainte de confirmare contabilă (CECCAR Art. 14).",
  })
}
