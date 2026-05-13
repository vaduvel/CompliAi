// POST /api/fiscal/parse-d205 — upload XML D205 + parse + persist
// GET  /api/fiscal/parse-d205 — list declarații D205 parsate
// DELETE /api/fiscal/parse-d205?id=X — șterge un record
//
// Body POST identic cu parse-d300 (JSON / XML direct / multipart).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { parseD205, type D205ParsedData } from "@/lib/compliance/parser-d205"
import {
  summarizeParsedDeclarations,
  upsertParsedDeclaration,
  type ParsedDeclarationRecord,
  type StateWithParsedDeclarations,
} from "@/lib/compliance/parsed-declarations"
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

const MAX_XML_BYTES = 5 * 1024 * 1024

type StateExt = ComplianceState & StateWithParsedDeclarations

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare D205 parsate",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const all = state.parsedDeclarations ?? []
    const d205Records = all.filter((r) => r.type === "d205")
    const summary = summarizeParsedDeclarations(all)

    return NextResponse.json({
      ok: true,
      records: d205Records,
      summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare D205.", 500, "D205_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "upload D205 XML")

    let xml = ""
    let fileName: string | undefined
    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as
        | { xml?: string; fileName?: string }
        | null
      if (!body || typeof body.xml !== "string") {
        return jsonError("Body invalid.", 400, "D205_INVALID_BODY")
      }
      xml = body.xml
      fileName = body.fileName
    } else if (
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      contentType.includes("text/plain")
    ) {
      xml = await request.text()
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file")
      if (!file || typeof file === "string") {
        return jsonError("Fișier lipsă.", 400, "D205_NO_FILE")
      }
      xml = await (file as File).text()
      fileName = (file as File).name
    } else {
      xml = await request.text()
    }

    if (!xml || xml.trim().length === 0) {
      return jsonError("Conținut XML gol.", 400, "D205_EMPTY_XML")
    }
    if (xml.length > MAX_XML_BYTES) {
      return jsonError(
        `XML prea mare. Maxim 5 MB.`,
        413,
        "D205_TOO_LARGE",
      )
    }

    const parsed: D205ParsedData = parseD205(xml)

    if (!parsed.reportingYear && parsed.beneficiaries.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "XML-ul nu pare a fi D205 (nici anul, nici beneficiari detectați).",
          errors: parsed.errors,
        },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const period = parsed.reportingYear ? String(parsed.reportingYear) : null

    const record: ParsedDeclarationRecord = {
      id: `d205-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      type: "d205",
      period,
      cui: parsed.declarantCui,
      isRectification: parsed.isRectification,
      parsedAtISO: nowISO,
      source: "upload-xml",
      fileName,
      data: parsed,
      errors: parsed.errors,
      warnings: parsed.warnings,
    }

    const existing = state.parsedDeclarations ?? []
    const updated = upsertParsedDeclaration(existing, record)

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.d205.parsed",
        entityType: "system",
        entityId: record.id,
        message: `D205 parsat pentru anul ${period ?? "necunoscut"} (CUI ${record.cui ?? "n/a"}) — ${parsed.beneficiaries.length} beneficiari, ${parsed.totalWithheldTax.toFixed(2)} RON impozit total.`,
        createdAtISO: nowISO,
        metadata: {
          year: period ?? "",
          cui: record.cui ?? "",
          rectification: record.isRectification,
          source: record.source,
          fileName: fileName ?? "",
          beneficiariesCount: parsed.beneficiaries.length,
          totalGrossIncome: parsed.totalGrossIncome,
          totalWithheldTax: parsed.totalWithheldTax,
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
        parsedDeclarations: updated,
        events: newEvents,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      record,
      parsed,
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare parsare D205.",
      500,
      "D205_PARSE_FAILED",
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere D205 parsat")
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return jsonError("id obligatoriu.", 400, "D205_NO_ID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedDeclarations ?? []
    const target = existing.find((r) => r.id === id)
    if (!target) return jsonError("Înregistrare negăsită.", 404, "D205_NOT_FOUND")

    const updated = existing.filter((r) => r.id !== id)
    await writeStateForOrg(
      session.orgId,
      { ...state, parsedDeclarations: updated } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: target.id })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare ștergere.", 500, "D205_DELETE_FAILED")
  }
}
