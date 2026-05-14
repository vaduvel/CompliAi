// GET /api/fiscal/exception-queue — Master Exception Queue agregat
//
// FC-7 (2026-05-14): un singur ecran cu TOATE excepțiile sortate după
// priorityScore (Doc 09 cap 9.2). Agregă cross-correlation + filings +
// audit risk + missing evidence într-o singură listă acționabilă.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { runCrossCorrelation } from "@/lib/compliance/cross-correlation-engine"
import { buildMasterExceptionQueue } from "@/lib/compliance/master-exception-queue"
import type { FindingWithImpact } from "@/lib/compliance/economic-impact"
import type { ComplianceState } from "@/lib/compliance/types"
import type { StateWithParsedDeclarations } from "@/lib/compliance/parsed-declarations"
import type { StateWithParsedAga } from "@/lib/compliance/parsed-aga"
import type { StateWithParsedInvoices } from "@/lib/compliance/parsed-invoices"
import type { StateWithOnrcSnapshots } from "@/lib/compliance/onrc-snapshot"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

type StateExt = ComplianceState &
  StateWithParsedDeclarations &
  StateWithParsedAga &
  StateWithParsedInvoices &
  StateWithOnrcSnapshots & {
    filingRecords?: FilingRecord[]
  }

const READ_ROLES = [
  "owner",
  "partner_manager",
  "compliance",
  "reviewer",
  "viewer",
] as const

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare Master Exception Queue",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const declarations = state.parsedDeclarations ?? []
    const aga = state.parsedAga ?? []
    const invoices = state.parsedInvoices ?? []
    const onrc = state.onrcSnapshots ?? []
    const filings = state.filingRecords ?? []

    // Rulează cross-correlation
    const crossCorrReport = runCrossCorrelation({
      declarations,
      aga,
      invoices,
      onrc,
      filings,
    })

    // Construim queue
    // runCrossCorrelation populează economicImpact via annotateWithImpact,
    // așa că findings sunt în realitate FindingWithImpact — facem cast explicit
    // pentru contractul cu buildMasterExceptionQueue.
    const queue = buildMasterExceptionQueue({
      crossCorrelationFindings: (crossCorrReport.findings as FindingWithImpact[]).filter(
        (f) =>
          f.severity === "warning" ||
          f.severity === "error",
      ),
      filings,
      // auditRiskSignals — viitor: integrare cu audit risk engine
    })

    return NextResponse.json({
      ok: true,
      queue,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare exception queue.",
      500,
      "EXC_QUEUE_FAILED",
    )
  }
}
