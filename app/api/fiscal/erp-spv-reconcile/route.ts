// ERP vs ANAF SPV reconciler endpoint.
//
// Compară status local din SmartBill/Oblio vs status real din ANAF SPV.
// Detectează disparities care pot duce la amenzi 15% (ex: ERP zice
// transmis, SPV zice respins/lipsă).

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  reconcileErpVsSpv,
  buildErpSpvDisparityFindings,
  type ErpInvoiceSnapshot,
  type SpvInvoiceSnapshot,
} from "@/lib/compliance/erp-vs-spv-reconciler"
import {
  listSmartBillInvoices,
  type SmartBillInvoice,
} from "@/lib/integrations/smartbill-client"
import { ensureValidToken, fetchSpvMessages } from "@/lib/anaf-spv-client"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import type { ComplianceState } from "@/lib/compliance/types"

const ERP_SPV_FINDING_PREFIX = "erp-spv-disparity-"

function smartbillToErpSnapshot(inv: SmartBillInvoice): ErpInvoiceSnapshot {
  return {
    source: "smartbill",
    series: inv.series,
    number: inv.number,
    issueDate: inv.issueDate,
    total: inv.total,
    efacturaStatus: inv.efacturaStatus ?? "necunoscut",
  }
}

export async function POST(request: Request) {
  let session
  try {
    session = await requireFreshAuthenticatedSession(request, "ERP vs SPV reconcile")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "RECONCILE_AUTH_FAILED")
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "RECONCILE_STATE_UNAVAILABLE")

  const sb = state.integrations?.smartbill
  if (!sb) {
    return jsonError(
      "SmartBill nu este conectat. Conectează din /dashboard/fiscal → Integrări.",
      400,
      "RECONCILE_SB_NOT_CONNECTED",
    )
  }

  const cui = state.orgProfile?.cui
  if (!cui) {
    return jsonError("CUI lipsă din profilul org.", 400, "RECONCILE_NO_CUI")
  }

  const nowISO = new Date().toISOString()
  const startISO = new Date(Date.now() - 30 * 86_400_000).toISOString()

  // Fetch facturi SmartBill
  let smartbillResult
  try {
    smartbillResult = await listSmartBillInvoices(
      { email: sb.email, token: sb.token, cif: sb.cif },
      startISO,
      nowISO,
    )
  } catch (err) {
    return jsonError(
      `Eroare SmartBill: ${err instanceof Error ? err.message : "unknown"}`,
      502,
      "RECONCILE_SMARTBILL_ERROR",
    )
  }

  if (!smartbillResult.ok) {
    return jsonError(
      `SmartBill: ${smartbillResult.error.message}`,
      502,
      smartbillResult.error.code,
    )
  }

  const erpInvoices = smartbillResult.data.invoices.map(smartbillToErpSnapshot)

  // Fetch SPV invoices via ANAF
  let spvInvoices: SpvInvoiceSnapshot[] = []
  try {
    const tokenResult = await ensureValidToken(session.orgId, nowISO)
    if (tokenResult.token && !tokenResult.expired) {
      const cleanCif = cui.replace(/^RO/i, "")
      const spvResp = await fetchSpvMessages(tokenResult.token.accessToken, cleanCif, 30)
      if (spvResp && !spvResp.eroare && spvResp.mesaje) {
        spvInvoices = spvResp.mesaje
          .filter((m) => /factura/i.test(m.tip) || /factura/i.test(m.detalii))
          .map((m) => {
            const tipLower = m.tip.toLowerCase()
            const detLower = m.detalii.toLowerCase()
            let spvStatus: SpvInvoiceSnapshot["spvStatus"] = "valida"
            if (tipLower.includes("erori") || detLower.includes("respins")) {
              spvStatus = "respinsa"
            } else if (detLower.includes("validare")) {
              spvStatus = "in_validare"
            }
            // Extract invoice number heuristic
            const numMatch = m.detalii.match(/(?:factura|nr|nr\.)\s*([A-Z]+[-]?\d+)/i)
            return {
              invoiceNumber: numMatch?.[1] ?? m.id.slice(-10),
              spvStatus,
              spvIndex: m.id,
              detectedAtISO: m.dataCreare,
            }
          })
      }
    }
  } catch {
    // Fallback: SPV indisponibil
  }

  const disparities = reconcileErpVsSpv(erpInvoices, spvInvoices)
  const newFindings = buildErpSpvDisparityFindings(disparities, nowISO)

  // Persist findings — replace stale ones
  const survivingFindings = (state.findings ?? []).filter(
    (f) => !f.id.startsWith(ERP_SPV_FINDING_PREFIX),
  )
  const mergedFindings = [...survivingFindings, ...newFindings]

  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "fiscal.erp_spv_reconciled",
      entityType: "system",
      entityId: `erp-spv-${nowISO.slice(0, 10)}`,
      message: `Reconciliere ERP-SPV: ${erpInvoices.length} ERP vs ${spvInvoices.length} SPV → ${disparities.length} disparities, ${newFindings.length} findings.`,
      createdAtISO: nowISO,
      metadata: {
        erpCount: erpInvoices.length,
        spvCount: spvInvoices.length,
        disparityCount: disparities.length,
        criticalCount: disparities.filter((d) => d.severity === "critical").length,
      },
    },
    actor,
  )

  await writeStateForOrg(session.orgId, {
    ...state,
    findings: mergedFindings,
    events: appendComplianceEvents(state, [auditEvent]),
  })

  return NextResponse.json({
    ok: true,
    erpCount: erpInvoices.length,
    spvCount: spvInvoices.length,
    disparities,
    findingsGenerated: newFindings.length,
    timestamp: nowISO,
  })
}
