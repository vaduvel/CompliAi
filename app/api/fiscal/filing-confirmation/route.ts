// Endpoint universal pentru confirmare depunere fiscală.
//
// POST { filingType, period, source, filedAtISO?, externalReference?, note? }
// → matchează cu state.filingRecords, flip status la on_time/late, audit event.
//
// Surse acceptate:
//   - manual: contabilul confirmă din UI (auth via session)
//   - webhook: alt soft trimite confirmare (auth via API key per org)
//   - smartbill/oblio/saga/spv: trimise programatic de hook-uri interne
//
// Idempotent: dacă filing deja e on_time/rectified, returnăm already-filed
// fără eroare.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import {
  applyFilingConfirmation,
  type ConfirmationSource,
  type FilingConfirmation,
} from "@/lib/compliance/erp-filing-confirmation"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord, FilingType } from "@/lib/compliance/filing-discipline"

const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

type StateWithFilings = ComplianceState & { filingRecords?: FilingRecord[] }

const VALID_FILING_TYPES: FilingType[] = [
  "d300_tva",
  "d390_recap",
  "d394_local",
  "saft",
  "efactura_monthly",
  "etva_precompletata",
]

const VALID_SOURCES: ConfirmationSource[] = [
  "smartbill",
  "oblio",
  "saga",
  "spv",
  "manual",
  "webhook",
]

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      [...WRITE_ROLES],
      "confirmare depunere fiscală",
    )

    let body: {
      filingType?: string
      period?: string
      source?: string
      filedAtISO?: string
      externalReference?: string
      note?: string
    }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return jsonError("Body invalid.", 400, "FILING_CONF_INVALID_BODY")
    }

    if (!body.filingType || !VALID_FILING_TYPES.includes(body.filingType as FilingType)) {
      return jsonError(
        `filingType obligatoriu. Valori valide: ${VALID_FILING_TYPES.join(", ")}.`,
        400,
        "FILING_CONF_INVALID_TYPE",
      )
    }
    if (!body.period?.trim()) {
      return jsonError("period obligatoriu.", 400, "FILING_CONF_NO_PERIOD")
    }
    if (!body.source || !VALID_SOURCES.includes(body.source as ConfirmationSource)) {
      return jsonError(
        `source obligatoriu. Valori valide: ${VALID_SOURCES.join(", ")}.`,
        400,
        "FILING_CONF_INVALID_SOURCE",
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateWithFilings | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const filings = state.filingRecords ?? []
    const nowISO = new Date().toISOString()

    const confirmation: FilingConfirmation = {
      filingType: body.filingType as FilingType,
      period: body.period.trim(),
      source: body.source as ConfirmationSource,
      filedAtISO: body.filedAtISO,
      externalReference: body.externalReference?.trim(),
      note: body.note?.trim(),
    }

    const result = applyFilingConfirmation(filings, confirmation, nowISO)

    if (!result.applied) {
      // Status code: 409 pentru already-filed (idempotent, nu e eroare reală)
      // 404 pentru no-matching-filing
      // 400 pentru invalid-period
      const status =
        result.reason === "already-filed"
          ? 409
          : result.reason === "no-matching-filing"
            ? 404
            : 400
      return NextResponse.json(
        {
          ok: false,
          applied: false,
          reason: result.reason,
        },
        { status },
      )
    }

    // Persist + audit event
    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.filing.confirmed",
        entityType: "system",
        entityId: result.match!.filingId,
        message: `${confirmation.filingType} ${confirmation.period} marcat ca depus din ${SOURCE_LABELS[confirmation.source]}.`,
        createdAtISO: nowISO,
        metadata: {
          filingType: confirmation.filingType,
          period: confirmation.period,
          source: confirmation.source,
          resultStatus: result.match!.resultStatus,
          daysVsDeadline: result.match!.daysVsDeadline,
          wasOverdue: result.match!.wasOverdue,
          externalReference: confirmation.externalReference ?? "",
        },
      },
      {
        id: actor.id,
        label: actor.label,
        role: actor.role,
        source: actor.source,
      },
    )

    const newEvents = appendComplianceEvents(state, [auditEvent])
    await writeStateForOrg(
      session.orgId,
      {
        ...state,
        filingRecords: result.updatedFilings,
        events: newEvents,
      } as StateWithFilings,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      applied: true,
      match: result.match,
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      "Eroare confirmare depunere.",
      500,
      "FILING_CONF_FAILED",
    )
  }
}

const SOURCE_LABELS: Record<ConfirmationSource, string> = {
  smartbill: "SmartBill",
  oblio: "Oblio",
  saga: "Saga",
  spv: "ANAF SPV",
  manual: "Manual",
  webhook: "Webhook extern",
}
