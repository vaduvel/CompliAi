// POST /api/fiscal/onrc-lookup — fetch ANAF + opțional RECOM + persist snapshot
// GET  /api/fiscal/onrc-lookup?cui=12345678 — preluă snapshot existent (sau toate)
// PATCH /api/fiscal/onrc-lookup — { cui, associates } — confirmă/editează asociați manual
// DELETE /api/fiscal/onrc-lookup?cui=X — șterge snapshot

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  appendComplianceEvents,
  createComplianceEvent,
} from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { buildOnrcSnapshot } from "@/lib/compliance/onrc-client"
import {
  computeSnapshotDerived,
  findOnrcSnapshot,
  isValidCui,
  normalizeCui,
  summarizeOnrcSnapshots,
  upsertOnrcSnapshot,
  type OnrcAssociate,
  type OnrcSnapshotRecord,
  type StateWithOnrcSnapshots,
} from "@/lib/compliance/onrc-snapshot"
import type { ComplianceState } from "@/lib/compliance/types"

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

type StateExt = ComplianceState & StateWithOnrcSnapshots

function sanitizeAssociates(raw: unknown): OnrcAssociate[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((a) => {
      if (!a || typeof a !== "object") return null
      const o = a as Record<string, unknown>
      const name = typeof o.name === "string" ? o.name.trim() : ""
      if (!name) return null
      const ownershipPercent = typeof o.ownershipPercent === "number" ? o.ownershipPercent : NaN
      if (!Number.isFinite(ownershipPercent) || ownershipPercent < 0) return null
      const idType = o.idType === "CNP" || o.idType === "CUI" ? o.idType : "unknown"
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : null
      const role = typeof o.role === "string" ? o.role : undefined
      return {
        idType,
        id,
        name,
        ownershipPercent: Math.max(0, Math.min(100, ownershipPercent)),
        role,
      } as OnrcAssociate
    })
    .filter((a): a is OnrcAssociate => a !== null)
}

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "vizualizare ONRC snapshots")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const url = new URL(request.url)
    const cuiParam = url.searchParams.get("cui")
    const all = state.onrcSnapshots ?? []

    if (cuiParam) {
      const found = findOnrcSnapshot(all, cuiParam)
      return NextResponse.json({ ok: true, record: found ?? null })
    }

    return NextResponse.json({
      ok: true,
      records: [...all].sort((a, b) => b.parsedAtISO.localeCompare(a.parsedAtISO)),
      summary: summarizeOnrcSnapshots(all),
      recomEnabled: Boolean(process.env.ONRC_RECOM_TOKEN),
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare ONRC.", 500, "ONRC_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "lookup ONRC")
    const body = (await request.json().catch(() => null)) as
      | { cui?: string; manualAssociates?: unknown }
      | null
    if (!body || typeof body.cui !== "string") {
      return jsonError("CUI obligatoriu.", 400, "ONRC_NO_CUI")
    }
    if (!isValidCui(body.cui)) {
      return jsonError("CUI invalid (2-10 cifre).", 400, "ONRC_CUI_INVALID")
    }
    const manualAssociates = sanitizeAssociates(body.manualAssociates)

    const result = await buildOnrcSnapshot({
      cui: body.cui,
      manualAssociates: manualAssociates.length > 0 ? manualAssociates : undefined,
    })
    if (!result.ok || !result.snapshot) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Lookup ONRC eșuat." },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const partial = result.snapshot
    const record: OnrcSnapshotRecord = computeSnapshotDerived({
      ...partial,
      parsedAtISO: nowISO,
      id: `onrc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    })

    const existing = state.onrcSnapshots ?? []
    const updated = upsertOnrcSnapshot(existing, record)

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.onrc.snapshot",
        entityType: "system",
        entityId: record.id,
        message: `Snapshot ONRC ${record.cui} (${record.companyName ?? "?"}): ${record.associates.length} asociați, ${record.totalOwnershipPercent.toFixed(1)}% deținere — surse ${record.sources.join("+")}.`,
        createdAtISO: nowISO,
        metadata: {
          cui: record.cui,
          companyName: record.companyName ?? "",
          associatesCount: record.associates.length,
          totalOwnership: record.totalOwnershipPercent,
          sources: record.sources.join("+"),
          fiscalStatus: record.fiscalStatus ?? "",
          vatRegistered: record.vatRegistered,
          isComplete: record.isComplete,
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
        onrcSnapshots: updated,
        events: newEvents,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      record,
      recomEnabled: Boolean(process.env.ONRC_RECOM_TOKEN),
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare ONRC.",
      500,
      "ONRC_LOOKUP_FAILED",
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "editare asociați ONRC")
    const body = (await request.json().catch(() => null)) as
      | { cui?: string; associates?: unknown }
      | null
    if (!body || typeof body.cui !== "string" || !isValidCui(body.cui)) {
      return jsonError("CUI obligatoriu valid.", 400, "ONRC_PATCH_NO_CUI")
    }
    const associates = sanitizeAssociates(body.associates)
    if (associates.length === 0) {
      return jsonError(
        "Cel puțin un asociat necesar (cu nume + procent).",
        400,
        "ONRC_PATCH_NO_ASSOCIATES",
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const cui = normalizeCui(body.cui)
    const existing = state.onrcSnapshots ?? []
    const target = existing.find((r) => r.cui === cui)
    if (!target) {
      return jsonError(
        "Snapshot pentru acest CUI nu există. Apelează POST /api/fiscal/onrc-lookup prima dată.",
        404,
        "ONRC_NOT_FOUND",
      )
    }

    const nowISO = new Date().toISOString()
    const sources = target.sources.includes("manual")
      ? target.sources
      : [...target.sources, target.sources.includes("recom-soap") ? "mixt" : "manual"]
    const updated = computeSnapshotDerived({
      ...target,
      associates,
      sources: sources as OnrcSnapshotRecord["sources"],
      associatesConfirmedAtISO: nowISO,
      parsedAtISO: nowISO,
    })

    const next = existing.map((r) => (r.cui === cui ? updated : r))

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.onrc.associates.updated",
        entityType: "system",
        entityId: updated.id,
        message: `ONRC ${cui}: ${associates.length} asociați confirmați manual (${updated.totalOwnershipPercent.toFixed(1)}% total).`,
        createdAtISO: nowISO,
        metadata: {
          cui,
          associatesCount: associates.length,
          totalOwnership: updated.totalOwnershipPercent,
          isComplete: updated.isComplete,
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
      { ...state, onrcSnapshots: next, events: newEvents } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, record: updated })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare actualizare ONRC.", 500, "ONRC_PATCH_FAILED")
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere ONRC snapshot")
    const url = new URL(request.url)
    const cui = url.searchParams.get("cui")
    if (!cui) return jsonError("CUI obligatoriu.", 400, "ONRC_DEL_NO_CUI")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const normalized = normalizeCui(cui)
    const existing = state.onrcSnapshots ?? []
    const updated = existing.filter((r) => r.cui !== normalized)
    if (updated.length === existing.length) {
      return jsonError("CUI inexistent.", 404, "ONRC_DEL_NOT_FOUND")
    }
    await writeStateForOrg(
      session.orgId,
      { ...state, onrcSnapshots: updated } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: normalized })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare ștergere ONRC.", 500, "ONRC_DELETE_FAILED")
  }
}
