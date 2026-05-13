// Unified preventive fiscal scan endpoint.
//
// GET → rulează scanul preventiv pe state-ul curent (frecvență, filings,
// certs, consistency) și întoarce rezultat agregat FĂRĂ a persista findings.
//
// POST { persist?: boolean } → rulează scanul + persistă findings noi în
// state.findings cu idempotent dedup. Re-rularea refresh-ează entry-urile
// existente (title/severity) fără să șteargă status/closureEvidence.
//
// Funcționează în orice mediu ANAF (mock/test/prod) — toate detectoarele
// rulează pe state-ul local. NU necesită token OAuth valid.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  mergePreventiveFindings,
  runPreventiveScan,
} from "@/lib/server/fiscal-preventive-scan"
import type { ComplianceState } from "@/lib/compliance/types"
import type { CertSpvRecord } from "@/lib/compliance/cert-spv-tracker"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type StateWithFiscal = ComplianceState & {
  filingRecords?: FilingRecord[]
  certSpvRecords?: CertSpvRecord[]
}

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "scan preventiv fiscal")
    const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const result = runPreventiveScan({ state, nowISO })

    return NextResponse.json({
      ok: true,
      persisted: false,
      ...result,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare scan preventiv.", 500, "PREVENTIVE_SCAN_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "scan preventiv fiscal — persist")

    let body: { persist?: boolean } = {}
    try {
      body = (await request.json()) as { persist?: boolean }
    } catch {
      // Empty body is OK — defaults to persist=true
    }

    const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const result = runPreventiveScan({ state, nowISO })

    const shouldPersist = body.persist !== false // default true on POST
    let newCount = 0
    let refreshedCount = 0

    const calendarChanged =
      result.calendarAutoFill.enabled &&
      (result.calendarAutoFill.newCount > 0 ||
        result.calendarAutoFill.refreshedCount > 0)

    if (
      shouldPersist &&
      (result.newFindings.length > 0 || calendarChanged)
    ) {
      const { merged, newCount: nc, refreshedCount: rc } = mergePreventiveFindings(
        state.findings,
        result.newFindings,
      )
      newCount = nc
      refreshedCount = rc

      // Persistăm AMBELE: filings auto-populate + findings preventive.
      const nextState: StateWithFiscal = {
        ...state,
        findings: merged,
        filingRecords: result.calendarAutoFill.enabled
          ? result.calendarAutoFill.mergedFilings
          : state.filingRecords,
      }

      await writeStateForOrg(session.orgId, nextState, session.orgName)
    }

    return NextResponse.json({
      ok: true,
      persisted: shouldPersist,
      ...result,
      summary: {
        ...result.summary,
        newFindingsCount: newCount,
        refreshedFindingsCount: refreshedCount,
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare scan preventiv.", 500, "PREVENTIVE_SCAN_FAILED")
  }
}
