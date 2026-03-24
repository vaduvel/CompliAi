/**
 * GOLD 2 — Monthly SPV check cron.
 * Iterates all active orgs with TVA, checks SPV status,
 * generates findings for rejected/error/delayed invoices.
 */
import { NextResponse } from "next/server"

import {
  buildEFacturaRiskFindings,
  buildMockEFacturaSignals,
  EFACTURA_RISK_FINDING_PREFIX,
} from "@/lib/compliance/efactura-risk"
import {
  detectRepeatedRejectionFindings,
  detectPendingTooLong,
} from "@/lib/compliance/efactura-signal-hardening"
import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const orgIds = await listAllOrgIds()
  const nowISO = new Date().toISOString()
  let processed = 0
  let findingsGenerated = 0

  for (const orgId of orgIds) {
    const state = await readStateForOrg(orgId)
    if (!state) continue

    // Only process orgs that have eFactura relevance
    if (!state.efacturaConnected && state.efacturaSignalsCount === 0) continue

    // In production: fetch real signals from ANAF SPV per org CUI
    // For now: use mock signals as demo baseline
    const signals = buildMockEFacturaSignals()
    const baseFindings = buildEFacturaRiskFindings(signals, nowISO)
    const repeatedFindings = detectRepeatedRejectionFindings(signals, nowISO)
    const pendingResults = detectPendingTooLong(signals, nowISO)
    const pendingFindings = pendingResults.map((r) => r.finding)

    const allNewFindings = [...baseFindings, ...repeatedFindings, ...pendingFindings]
    if (allNewFindings.length === 0) continue

    // Merge: remove stale eFactura findings, add fresh ones
    const updatedFindings = [
      ...state.findings.filter(
        (f) => f.category !== "E_FACTURA" || !f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX)
      ),
      ...allNewFindings,
    ]

    await writeStateForOrg(orgId, {
      ...state,
      findings: updatedFindings,
      efacturaSignalsCount: signals.length,
      efacturaSyncedAtISO: nowISO,
    })

    processed++
    findingsGenerated += allNewFindings.length
  }

  return NextResponse.json({
    processed,
    findingsGenerated,
    timestamp: nowISO,
  })
}
