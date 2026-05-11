// F#1 — Predictive Audit Risk Scoring API.
//
// GET → compută scorul curent pe baza stării org (findings, alerts, filings,
// e-TVA discrepancies, semnale e-Factura). Stateless — nu salvăm scorul,
// re-calculam la fiecare cerere.
//
// Phase 2: persist + tracking trend (lună-la-lună).

import { NextRequest, NextResponse } from "next/server"

import { computeAuditRiskScore } from "@/lib/compliance/audit-risk-scoring"
import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { ComplianceState } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type StateExtended = ComplianceState & {
  filingRecords?: FilingRecord[]
  etvaDiscrepancies?: ETVADiscrepancy[]
}

export async function GET(request: NextRequest) {
  const session = requireRole(request, [...READ_ROLES], "scor risc audit")
  const orgId = session.orgId
  const state = (await readStateForOrg(orgId)) as StateExtended | null
  if (!state) {
    return jsonError(
      "Nu am putut încărca starea organizației active.",
      500,
      "AUDIT_RISK_STATE_UNAVAILABLE",
    )
  }

  const result = computeAuditRiskScore({
    state: {
      findings: state.findings ?? [],
      efacturaSignalsCount: state.efacturaSignalsCount ?? 0,
      efacturaConnected: !!state.efacturaConnected,
      efacturaSyncedAtISO: state.efacturaSyncedAtISO ?? "",
      efacturaValidations: state.efacturaValidations ?? [],
      alerts: state.alerts ?? [],
    },
    filingRecords: state.filingRecords ?? [],
    etvaDiscrepancies: state.etvaDiscrepancies ?? [],
    nowISO: new Date().toISOString(),
  })

  return NextResponse.json({
    ok: true,
    result,
    orgId,
    orgName: session.orgName,
  })
}
