// V3 P0.3 — e-Factura Risk Signals endpoint
// GET: returneaza semnalele de risc (mock sau real)
// POST: genereaza findings in board-ul central de conformitate

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getAnafMode } from "@/lib/server/efactura-anaf-client"
import { readState, mutateState } from "@/lib/server/mvp-store"
import {
  buildMockEFacturaSignals,
  buildEFacturaRiskFindings,
  EFACTURA_RISK_FINDING_PREFIX,
} from "@/lib/compliance/efactura-risk"

export async function GET() {
  try {
    const mode = getAnafMode()
    const state = await readState()

    // In mock mode, return demo signals
    // In real mode, signals would come from ANAF SPV polling (future sprint)
    const signals = buildMockEFacturaSignals()

    return NextResponse.json({
      signals,
      mode,
      connected: state.efacturaConnected,
      syncedAtISO: state.efacturaSyncedAtISO ?? null,
      demo: mode === "mock",
    })
  } catch {
    return jsonError("Nu am putut incarca semnalele e-Factura.", 500, "EFACTURA_SIGNALS_READ_FAILED")
  }
}

export async function POST() {
  try {
    const signals = buildMockEFacturaSignals()
    const nowISO = new Date().toISOString()
    const newFindings = buildEFacturaRiskFindings(signals, nowISO)

    await mutateState((current) => ({
      ...current,
      findings: [
        ...current.findings.filter(
          (f) => f.category !== "E_FACTURA" || !f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX)
        ),
        ...newFindings,
      ],
    }))

    return NextResponse.json({
      generated: newFindings.length,
      findings: newFindings,
    })
  } catch {
    return jsonError(
      "Nu am putut genera findings din semnalele e-Factura.",
      500,
      "EFACTURA_FINDINGS_FAILED"
    )
  }
}
