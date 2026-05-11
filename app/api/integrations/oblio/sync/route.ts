// Oblio sync — citește facturi, recomputează findings.
//
// POST cu body { days?: number } (default 30). Refresh token automat dacă
// e expirat.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import {
  ensureValidOblioToken,
  listOblioInvoices,
  type OblioInvoice,
} from "@/lib/integrations/oblio-client"
import {
  buildEFacturaRiskFindings,
  EFACTURA_RISK_FINDING_PREFIX,
  type EFacturaInvoiceSignal,
} from "@/lib/compliance/efactura-risk"
import type { ComplianceState } from "@/lib/compliance/types"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const
const MAX_PAGES = 10

function oblioInvoiceToSignal(inv: OblioInvoice): EFacturaInvoiceSignal {
  let status: EFacturaInvoiceSignal["status"] = "rejected"
  if (inv.efacturaStatus === "respins") status = "rejected"
  else if (inv.efacturaStatus === "trimis") status = "processing-delayed"

  return {
    id: `oblio-${inv.series}-${inv.number}`,
    vendorName: inv.clientName ?? `Client ${inv.clientCif ?? ""}`,
    date: inv.issueDate,
    status,
    reason: inv.efacturaErrorMessage ?? `Status Oblio: ${inv.efacturaStatus ?? "necunoscut"}`,
    isTechVendor: false,
  }
}

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "sincronizare Oblio")

  let body: { days?: number } = {}
  try {
    body = (await request.json()) as { days?: number }
  } catch {
    // empty OK
  }
  const days = Math.max(1, Math.min(90, Math.floor(body.days ?? 30)))

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const ob = state.integrations?.oblio
  if (!ob) return jsonError("Oblio nu este conectat.", 400, "OB_NOT_CONNECTED")

  // Refresh token dacă e expirat
  const tokenResult = await ensureValidOblioToken(
    {
      email: ob.email,
      token: ob.accessToken,  // Oblio nu are refresh; trebuie din nou client_secret
      cif: ob.cif,
    },
    {
      accessToken: ob.accessToken,
      expiresAtISO: ob.tokenExpiresAtISO,
      tokenType: "Bearer",
    },
  )

  if (!tokenResult.ok) {
    return jsonError(
      `Re-autorizare Oblio eșuată: ${tokenResult.error.message}. Reconectează-te.`,
      401,
      tokenResult.error.code,
    )
  }

  const nowISO = new Date().toISOString()
  const startISO = new Date(Date.now() - days * 86_400_000).toISOString()

  const allInvoices: OblioInvoice[] = []
  let page = 1
  let lastError: string | null = null

  while (page <= MAX_PAGES) {
    const r = await listOblioInvoices(tokenResult.data, ob.cif, startISO, nowISO, page)
    if (!r.ok) {
      lastError = `Pagina ${page}: ${r.error.message}`
      break
    }
    allInvoices.push(...r.data.invoices)
    if (!r.data.hasMore) break
    page++
  }

  const problematic = allInvoices.filter(
    (inv) => inv.efacturaStatus === "respins" || inv.efacturaStatus === "trimis",
  )
  const signals = problematic.map(oblioInvoiceToSignal)
  const newFindings = buildEFacturaRiskFindings(signals, nowISO)

  const surviving = (state.findings ?? []).filter(
    (f) => f.category !== "E_FACTURA" || !f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX),
  )
  const merged = [...surviving, ...newFindings]

  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.oblio.synced",
      entityType: "integration",
      entityId: "oblio",
      message: `Sync Oblio: ${allInvoices.length} facturi citite, ${problematic.length} cu probleme, ${newFindings.length} findings.`,
      createdAtISO: nowISO,
      metadata: {
        invoicesTotal: allInvoices.length,
        invoicesProblematic: problematic.length,
        findingsGenerated: newFindings.length,
        days,
        error: lastError ?? "",
      },
    },
    actor,
  )

  const updated: ComplianceState = {
    ...state,
    findings: merged,
    integrations: {
      ...(state.integrations ?? {}),
      oblio: {
        ...ob,
        accessToken: tokenResult.data.accessToken,
        tokenExpiresAtISO: tokenResult.data.expiresAtISO,
        lastSyncAtISO: nowISO,
        lastSyncCount: allInvoices.length,
      },
    },
    efacturaSignalsCount: signals.length,
    efacturaSyncedAtISO: nowISO,
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(session.orgId, updated, session.orgName)

  return NextResponse.json({
    ok: true,
    syncedAtISO: nowISO,
    invoicesTotal: allInvoices.length,
    invoicesProblematic: problematic.length,
    findingsGenerated: newFindings.length,
    findings: newFindings.map((f) => ({ id: f.id, title: f.title, severity: f.severity })),
    error: lastError,
  })
}
