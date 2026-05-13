// POST /api/fiscal/parse-d100 — upload XML D100 + parse + persist
// GET  /api/fiscal/parse-d100 — list declarații D100 parsate
// DELETE /api/fiscal/parse-d100?id=X — șterge record

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { parseD100, type D100ParsedData } from "@/lib/compliance/parser-d100"
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
    const session = requireRole(request, [...READ_ROLES], "vizualizare D100 parsate")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const all = state.parsedDeclarations ?? []
    const d100Records = all.filter((r) => r.type === "d100")
    const summary = summarizeParsedDeclarations(all)

    return NextResponse.json({
      ok: true,
      records: d100Records,
      summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare D100.", 500, "D100_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "upload D100 XML")

    let xml = ""
    let fileName: string | undefined
    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as
        | { xml?: string; fileName?: string }
        | null
      if (!body || typeof body.xml !== "string") {
        return jsonError("Body invalid.", 400, "D100_INVALID_BODY")
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
        return jsonError("Fișier lipsă.", 400, "D100_NO_FILE")
      }
      xml = await (file as File).text()
      fileName = (file as File).name
    } else {
      xml = await request.text()
    }

    if (!xml || xml.trim().length === 0) {
      return jsonError("Conținut XML gol.", 400, "D100_EMPTY_XML")
    }
    if (xml.length > MAX_XML_BYTES) {
      return jsonError(`XML prea mare. Maxim 5 MB.`, 413, "D100_TOO_LARGE")
    }

    const parsed: D100ParsedData = parseD100(xml)

    if (!parsed.period && parsed.lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "XML-ul nu pare a fi D100 (nici perioada, nici linii impozit).",
          errors: parsed.errors,
        },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const record: ParsedDeclarationRecord = {
      id: `d100-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      type: "d100",
      period: parsed.period?.period ?? null,
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
        type: "fiscal.d100.parsed",
        entityType: "system",
        entityId: record.id,
        message: `D100 parsat pentru ${record.period ?? "perioadă necunoscută"} (CUI ${record.cui ?? "n/a"}) — ${parsed.lines.length} linii, ${parsed.totalDue.toFixed(2)} RON total datorat.`,
        createdAtISO: nowISO,
        metadata: {
          period: record.period ?? "",
          cui: record.cui ?? "",
          rectification: record.isRectification,
          source: record.source,
          fileName: fileName ?? "",
          linesCount: parsed.lines.length,
          totalDue: parsed.totalDue,
          totalToPay: parsed.totalToPay,
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
      error instanceof Error ? error.message : "Eroare parsare D100.",
      500,
      "D100_PARSE_FAILED",
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere D100 parsat")
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return jsonError("id obligatoriu.", 400, "D100_NO_ID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedDeclarations ?? []
    const target = existing.find((r) => r.id === id)
    if (!target) return jsonError("Înregistrare negăsită.", 404, "D100_NOT_FOUND")

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
    return jsonError("Eroare ștergere.", 500, "D100_DELETE_FAILED")
  }
}
