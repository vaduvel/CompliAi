// POST /api/fiscal/pre-anaf-simulation — răspunde la "Dacă ANAF te-ar verifica azi, unde pici?"
//
// Rulează cross-correlation engine, extrage findings cu impact economic,
// returnează Top N riscuri ordonate după magnitudine.
//
// Idempotent: re-rulare = aceleași riscuri (mai puțin id-urile).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { runCrossCorrelation } from "@/lib/compliance/cross-correlation-engine"
import { runPreAnafSimulation } from "@/lib/compliance/pre-anaf-simulation"
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
  // GET = răspunde direct cu simularea curentă bazată pe state-ul existent
  return runSimulation(request)
}

export async function POST(request: Request) {
  // POST = identic cu GET dar permite (în viitor) opțiuni (topN, filtre)
  return runSimulation(request)
}

async function runSimulation(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "rulare Pre-ANAF Simulation",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const url = new URL(request.url)
    const topN = parseInt(url.searchParams.get("topN") ?? "5", 10) || 5

    const declarations = state.parsedDeclarations ?? []
    const aga = state.parsedAga ?? []
    const invoices = state.parsedInvoices ?? []
    const onrc = state.onrcSnapshots ?? []
    const filings = state.filingRecords ?? []

    // Determinăm frecvența TVA așteptată din orgProfile (best-effort)
    let expectedVatFrequency: "monthly" | "quarterly" | null = null
    const orgProfile = (state as ComplianceState & { orgProfile?: Record<string, unknown> })
      .orgProfile
    if (orgProfile && typeof orgProfile === "object") {
      const freq = orgProfile.vatFrequency
      if (freq === "monthly" || freq === "quarterly") {
        expectedVatFrequency = freq
      }
    }

    const crossCorrReport = runCrossCorrelation({
      declarations,
      aga,
      invoices,
      onrc,
      filings,
      expectedVatFrequency,
    })

    const simulationReport = runPreAnafSimulation(
      { crossCorrelationReport: crossCorrReport },
      { topN },
    )

    return NextResponse.json({
      ok: true,
      simulation: simulationReport,
      /** Raportul complet cross-correlation pentru drill-down. */
      crossCorrelation: crossCorrReport,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare Pre-ANAF Simulation.",
      500,
      "PRE_ANAF_SIM_FAILED",
    )
  }
}
