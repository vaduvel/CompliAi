// POST /api/fiscal/cross-correlation — rulează motorul, persistă ultimul raport
// GET  /api/fiscal/cross-correlation — preluă ultimul raport persistat
//
// Motorul citește toate sursele din state (declarații + AGA + facturi + ONRC)
// și produce un raport cu findings + summary. Este idempotent — re-rulare
// peste aceleași inputuri produce același rezultat (mai puțin id-urile).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  appendComplianceEvents,
  createComplianceEvent,
} from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import {
  runCrossCorrelation,
  type CrossCorrelationReport,
} from "@/lib/compliance/cross-correlation-engine"
import type { ComplianceState } from "@/lib/compliance/types"
import type { StateWithParsedDeclarations } from "@/lib/compliance/parsed-declarations"
import type { StateWithParsedAga } from "@/lib/compliance/parsed-aga"
import type { StateWithParsedInvoices } from "@/lib/compliance/parsed-invoices"
import type { StateWithOnrcSnapshots } from "@/lib/compliance/onrc-snapshot"

const READ_ROLES = [
  "owner",
  "partner_manager",
  "compliance",
  "reviewer",
  "viewer",
] as const

const WRITE_ROLES = [
  "owner",
  "partner_manager",
  "compliance",
  "reviewer",
] as const

type StateExt = ComplianceState &
  StateWithParsedDeclarations &
  StateWithParsedAga &
  StateWithParsedInvoices &
  StateWithOnrcSnapshots & {
    crossCorrelationLastReport?: CrossCorrelationReport
  }

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "vizualizare cross-correlation")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    return NextResponse.json({
      ok: true,
      report: state.crossCorrelationLastReport ?? null,
      hasInputs: {
        declarations: (state.parsedDeclarations ?? []).length,
        aga: (state.parsedAga ?? []).length,
        invoices: (state.parsedInvoices ?? []).length,
        onrc: (state.onrcSnapshots ?? []).length,
      },
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare cross-correlation.", 500, "XCORR_GET_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "rulare cross-correlation")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const declarations = state.parsedDeclarations ?? []
    const aga = state.parsedAga ?? []
    const invoices = state.parsedInvoices ?? []
    const onrc = state.onrcSnapshots ?? []

    const report = runCrossCorrelation({ declarations, aga, invoices, onrc })

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.crosscorr.run",
        entityType: "system",
        entityId: `xcorr-${Date.now()}`,
        message: `Cross-correlation rulat: ${report.summary.totalChecks} verificări — ${report.summary.errors} erori, ${report.summary.warnings} warnings, ${report.summary.ok} OK.`,
        createdAtISO: report.generatedAtISO,
        metadata: {
          totalChecks: report.summary.totalChecks,
          errors: report.summary.errors,
          warnings: report.summary.warnings,
          ok: report.summary.ok,
          info: report.summary.info,
          d300Count: report.inputs.d300Count,
          d205Count: report.inputs.d205Count,
          d100Count: report.inputs.d100Count,
          agaCount: report.inputs.agaCount,
          invoicesCount: report.inputs.invoicesCount,
          onrcCount: report.inputs.onrcCount,
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
        crossCorrelationLastReport: report,
        events: newEvents,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      report,
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare rulare cross-correlation.",
      500,
      "XCORR_RUN_FAILED",
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere raport cross-correlation")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    await writeStateForOrg(
      session.orgId,
      { ...state, crossCorrelationLastReport: undefined } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: true })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare ștergere.", 500, "XCORR_DELETE_FAILED")
  }
}
