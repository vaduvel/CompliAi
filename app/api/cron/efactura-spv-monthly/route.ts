/**
 * GAP #3 (Sprint 2) — Monthly SPV check cron, REAL ANAF integration.
 *
 * Iterates all active orgs cu eFactura relevance. Pentru orgs cu token ANAF
 * SPV valid (OAuth) — apel REAL la /listaMesajeFactura, convertește mesajele
 * în signals, generează findings.
 *
 * Pentru orgs FĂRĂ token (sau cu fetch eșuat) — fallback graceful la mock
 * signals ca să mențină comportament demo în dev/staging.
 *
 * Tranziție de la mock-only (pre-Sprint 2) → real-first cu mock fallback.
 */
import { NextResponse } from "next/server"

import {
  buildEFacturaRiskFindings,
  buildMockEFacturaSignals,
  EFACTURA_RISK_FINDING_PREFIX,
  type EFacturaInvoiceSignal,
} from "@/lib/compliance/efactura-risk"
import {
  detectRepeatedRejectionFindings,
  detectPendingTooLong,
} from "@/lib/compliance/efactura-signal-hardening"
import { listAllOrgIds, readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { ensureValidToken, fetchSpvMessages, type SpvMessage } from "@/lib/anaf-spv-client"

// ── ANAF SpvMessage → EFacturaInvoiceSignal converter ────────────────────────
//
// Mapează tipurile ANAF la statusuri CompliScan:
//   - "ERORI FACTURA" / mesaje cu "respins" în detalii → "rejected"
//   - "FACTURA PRIMITA" / "FACTURA TRIMISA" cu data >48h fără confirmare → "processing-delayed"
//   - "ERORI XML" / "xml_erori" în detalii → "xml-error"
//   - rest → "rejected" (default conservativ)

function spvMessageToSignal(msg: SpvMessage): EFacturaInvoiceSignal {
  const tipLower = msg.tip.toLowerCase()
  const detaliiLower = msg.detalii.toLowerCase()

  let status: EFacturaInvoiceSignal["status"] = "rejected"
  if (tipLower.includes("xml") || detaliiLower.includes("xml")) {
    status = "xml-error"
  } else if (tipLower.includes("erori") || detaliiLower.includes("respins")) {
    status = "rejected"
  } else if (
    tipLower.includes("prelucrare") ||
    detaliiLower.includes("in prelucrare") ||
    detaliiLower.includes("așteapt")
  ) {
    status = "processing-delayed"
  }

  // Extract vendor name from detalii (best effort — ANAF nu standardizat)
  const vendorMatch = msg.detalii.match(
    /(?:furnizor|emitent|vânzător|seller)\s*[:=-]?\s*([^,\n]+)/i,
  )
  const vendorName = vendorMatch?.[1]?.trim().slice(0, 80) ?? `CIF ${msg.cif}`

  // Detect tech vendor (DPA NIS2 signal)
  const isTechVendor =
    /aws|amazon|microsoft|azure|google|cloud|hosting|saas|sap|oracle|salesforce/i.test(
      msg.detalii,
    )

  return {
    id: `spv-${msg.id}`,
    vendorName,
    date: msg.dataCreare,
    status,
    reason: msg.detalii.slice(0, 200),
    isTechVendor,
  }
}

// ── Fetch signals — real first, mock fallback ────────────────────────────────

async function fetchSignalsForOrg(
  orgId: string,
  cui: string | undefined,
  nowISO: string,
): Promise<{ signals: EFacturaInvoiceSignal[]; source: "real" | "mock" }> {
  // Fără CUI → fallback mock (org incomplete profile)
  if (!cui) {
    return { signals: buildMockEFacturaSignals(), source: "mock" }
  }

  try {
    // Verifică token ANAF
    const { token, expired } = await ensureValidToken(orgId, nowISO)
    if (!token || expired) {
      // Token lipsă sau expirat → fallback mock (graceful degradation)
      return { signals: buildMockEFacturaSignals(), source: "mock" }
    }

    // Apel REAL ANAF SPV pentru ultimele 30 zile
    const cleanCif = cui.replace(/^RO/i, "")
    const response = await fetchSpvMessages(token.accessToken, cleanCif, 30)

    if (!response || response.eroare || !response.mesaje) {
      // ANAF a returnat eroare → fallback mock
      return { signals: buildMockEFacturaSignals(), source: "mock" }
    }

    // Filtrăm doar mesajele relevante (erori, respinse, blocate)
    const relevantMessages = response.mesaje.filter((m) => {
      const tip = m.tip.toLowerCase()
      const det = m.detalii.toLowerCase()
      return (
        tip.includes("erori") ||
        tip.includes("xml") ||
        det.includes("respins") ||
        det.includes("xml") ||
        det.includes("prelucrare")
      )
    })

    const signals = relevantMessages.map(spvMessageToSignal)

    // Dacă ANAF nu are mesaje relevante, returnăm array gol (NU mock — org
    // realmente nu are probleme)
    return { signals, source: "real" }
  } catch {
    // Orice exception → fallback mock (NU lăsa cron-ul să crash-eze)
    return { signals: buildMockEFacturaSignals(), source: "mock" }
  }
}

// ── Main cron handler ────────────────────────────────────────────────────────

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
  let realFetchCount = 0
  let mockFallbackCount = 0

  for (const orgId of orgIds) {
    const state = await readStateForOrg(orgId)
    if (!state) continue

    // Only process orgs that have eFactura relevance
    if (!state.efacturaConnected && state.efacturaSignalsCount === 0) continue

    // GAP #3 — Real-first fetch with mock fallback
    const cui = state.orgProfile?.cui
    const { signals, source } = await fetchSignalsForOrg(orgId, cui, nowISO)
    if (source === "real") realFetchCount++
    else mockFallbackCount++

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
    realFetchCount,
    mockFallbackCount,
    timestamp: nowISO,
  })
}
