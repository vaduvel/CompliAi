// SmartBill sync endpoint — citește facturi din SmartBill API, rulează
// validator-ul UBL CIUS-RO și updatează state cu signals + findings.
//
// POST: declanșează sync manual pentru ultimele N zile (default 30).
// Returnează summary: count facturi, count cu eroare e-Factura, count
// cu status pending, plus finding-uri generate.
//
// Pentru cron lunar: vom adăuga un cron handler ulterior care apelează
// același pattern pe toate org-urile cu integrations.smartbill setat.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import {
  listSmartBillInvoices,
  type SmartBillInvoice,
} from "@/lib/integrations/smartbill-client"
import {
  buildEFacturaRiskFindings,
  EFACTURA_RISK_FINDING_PREFIX,
  type EFacturaInvoiceSignal,
} from "@/lib/compliance/efactura-risk"
import {
  applyBatchConfirmations,
  inferEFacturaMonthlyConfirmation,
  type FilingConfirmation,
} from "@/lib/compliance/erp-filing-confirmation"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

const MAX_PAGES = 10  // safety limit pentru paginare

function smartBillToSignal(inv: SmartBillInvoice): EFacturaInvoiceSignal {
  let status: EFacturaInvoiceSignal["status"] = "rejected"
  if (inv.efacturaStatus === "valida") {
    // Skipăm — nu generăm signal pentru facturi OK
    status = "rejected" // placeholder, dar caller filtrează
  } else if (inv.efacturaStatus === "cu_eroare") {
    status = "rejected"
  } else if (inv.efacturaStatus === "in_validare" || inv.efacturaStatus === "in_curs") {
    status = "processing-delayed"
  } else if (inv.efacturaStatus === "de_trimis") {
    status = "rejected"
  }

  return {
    id: `smartbill-${inv.series}-${inv.number}`,
    vendorName: inv.clientName ?? `Client ${inv.clientCif ?? ""}`,
    date: inv.issueDate,
    status,
    reason: inv.efacturaErrorMessage ?? `Status SmartBill: ${inv.efacturaStatus ?? "necunoscut"}`,
    isTechVendor: false,
  }
}

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "sincronizare SmartBill")

  let body: { days?: number } = {}
  try {
    body = (await request.json()) as { days?: number }
  } catch {
    // empty body OK — folosim defaults
  }

  const days = Math.max(1, Math.min(90, Math.floor(body.days ?? 30)))

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

  const sb = state.integrations?.smartbill
  if (!sb) {
    return jsonError(
      "SmartBill nu este conectat. Conectează-te din /dashboard/fiscal mai întâi.",
      400,
      "SB_NOT_CONNECTED",
    )
  }

  const nowISO = new Date().toISOString()
  const startISO = new Date(Date.now() - days * 86_400_000).toISOString()

  // Paginated fetch
  const allInvoices: SmartBillInvoice[] = []
  let page = 1
  let lastError: string | null = null

  while (page <= MAX_PAGES) {
    const result = await listSmartBillInvoices(
      { email: sb.email, token: sb.token, cif: sb.cif },
      startISO,
      nowISO,
      page,
    )
    if (!result.ok) {
      lastError = `Pagina ${page}: ${result.error.message}`
      break
    }
    allInvoices.push(...result.data.invoices)
    if (!result.data.hasMore) break
    page++
  }

  // Filtrăm doar facturile cu probleme (signals); restul = OK, nu generăm finding
  const problematic = allInvoices.filter(
    (inv) =>
      inv.efacturaStatus === "cu_eroare" ||
      inv.efacturaStatus === "in_validare" ||
      inv.efacturaStatus === "de_trimis",
  )

  const signals = problematic.map(smartBillToSignal)
  const newFindings = buildEFacturaRiskFindings(signals, nowISO)

  // Înlocuim stale eFactura findings (păstrăm restul)
  const survivingFindings = (state.findings ?? []).filter(
    (f) => f.category !== "E_FACTURA" || !f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX),
  )
  const mergedFindings = [...survivingFindings, ...newFindings]

  // Auto-confirm raport lunar e-Factura B2C — pentru fiecare lună unde TOATE
  // facturile sunt validate de ANAF, flip filing-ul `efactura_monthly` la
  // on_time. Asta închide bucla: sync SmartBill → status filing flip automat.
  const filingsBefore: FilingRecord[] = (state as ComplianceState & { filingRecords?: FilingRecord[] }).filingRecords ?? []
  const invoicesByMonth = new Map<string, SmartBillInvoice[]>()
  for (const inv of allInvoices) {
    const month = inv.issueDate.slice(0, 7) // "2026-05"
    const list = invoicesByMonth.get(month) ?? []
    list.push(inv)
    invoicesByMonth.set(month, list)
  }
  const monthlyConfirmations: FilingConfirmation[] = []
  for (const [month, invoices] of invoicesByMonth.entries()) {
    const inferred = inferEFacturaMonthlyConfirmation({
      period: month,
      invoices,
      source: "smartbill",
      filedAtISO: nowISO,
    })
    if (inferred) monthlyConfirmations.push(inferred)
  }
  const confirmBatch = applyBatchConfirmations(filingsBefore, monthlyConfirmations, nowISO)
  const updatedFilings = confirmBatch.updatedFilings

  const actor = await resolveOptionalEventActor(request)
  const auditEvent = createComplianceEvent(
    {
      type: "integration.smartbill.synced",
      entityType: "integration",
      entityId: "smartbill",
      message: `Sync SmartBill: ${allInvoices.length} facturi citite, ${problematic.length} cu probleme, ${newFindings.length} findings generate.`,
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

  const updatedState: ComplianceState & { filingRecords?: FilingRecord[] } = {
    ...state,
    findings: mergedFindings,
    filingRecords: updatedFilings,
    integrations: {
      ...(state.integrations ?? {}),
      smartbill: {
        ...sb,
        lastSyncAtISO: nowISO,
        lastSyncCount: allInvoices.length,
        lastSyncError: lastError ?? undefined,
      },
    },
    efacturaSignalsCount: signals.length,
    efacturaSyncedAtISO: nowISO,
    events: appendComplianceEvents(state, [auditEvent]),
  }

  await writeStateForOrg(session.orgId, updatedState, session.orgName)

  return NextResponse.json({
    ok: true,
    syncedAtISO: nowISO,
    invoicesTotal: allInvoices.length,
    invoicesProblematic: problematic.length,
    findingsGenerated: newFindings.length,
    findings: newFindings.map((f) => ({ id: f.id, title: f.title, severity: f.severity })),
    filingsAutoConfirmed: confirmBatch.appliedCount,
    error: lastError,
  })
}
