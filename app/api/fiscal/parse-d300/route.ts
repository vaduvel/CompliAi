// POST /api/fiscal/parse-d300 — upload XML D300 + parse + persist
// GET  /api/fiscal/parse-d300 — list declaratii D300 parsate
//
// Body POST (JSON): { xml: string, fileName?: string }
//   sau Content-Type: application/xml cu corp XML direct
// Body POST (multipart): file XML (Saga/SmartBill export sau XFA-XML din PDF SPV)
//
// Returnează: { record: ParsedDeclarationRecord, parsed: D300ParsedData }

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { parseD300, type D300ParsedData } from "@/lib/compliance/parser-d300"
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

const MAX_XML_BYTES = 5 * 1024 * 1024 // 5 MB

type StateExt = ComplianceState & StateWithParsedDeclarations

// ── GET — list D300 parsate ─────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      [...READ_ROLES],
      "vizualizare D300 parsate",
    )
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const all = state.parsedDeclarations ?? []
    const d300Records = all.filter((r) => r.type === "d300")
    const summary = summarizeParsedDeclarations(all)

    return NextResponse.json({
      ok: true,
      records: d300Records,
      summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare D300.", 500, "D300_LIST_FAILED")
  }
}

// ── POST — upload + parse + persist ─────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "upload D300 XML")

    // Acceptăm 3 forme: text/xml direct, application/json {xml}, multipart file
    let xml = ""
    let fileName: string | undefined
    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as
        | { xml?: string; fileName?: string }
        | null
      if (!body || typeof body.xml !== "string") {
        return jsonError(
          "Body invalid. Trimite { xml: '...' } sau XML direct.",
          400,
          "D300_INVALID_BODY",
        )
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
        return jsonError(
          "Fișier XML lipsă din multipart.",
          400,
          "D300_NO_FILE",
        )
      }
      xml = await (file as File).text()
      fileName = (file as File).name
    } else {
      // Fallback: încearcă text crud
      xml = await request.text()
    }

    if (!xml || xml.trim().length === 0) {
      return jsonError("Conținut XML gol.", 400, "D300_EMPTY_XML")
    }
    if (xml.length > MAX_XML_BYTES) {
      return jsonError(
        `XML prea mare (${(xml.length / 1024 / 1024).toFixed(1)} MB). Maxim 5 MB.`,
        413,
        "D300_TOO_LARGE",
      )
    }

    // Parse
    const parsed: D300ParsedData = parseD300(xml)

    // Refuzăm dacă nu avem nici perioada nici linii TVA (probabil nu e D300)
    if (!parsed.period && parsed.lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "XML-ul nu pare a fi D300 (nici perioada, nici rânduri TVA detectate).",
          errors: parsed.errors,
        },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const record: ParsedDeclarationRecord = {
      id: `d300-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      type: "d300",
      period: parsed.period?.period ?? null,
      cui: parsed.cui,
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

    // Audit event
    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.d300.parsed",
        entityType: "system",
        entityId: record.id,
        message: `D300 parsat pentru ${record.period ?? "perioadă necunoscută"} (CUI ${record.cui ?? "n/a"})${record.isRectification ? " — rectificativă" : ""}.`,
        createdAtISO: nowISO,
        metadata: {
          period: record.period ?? "",
          cui: record.cui ?? "",
          rectification: record.isRectification,
          source: record.source,
          fileName: fileName ?? "",
          totalCollectedVat: parsed.totalCollectedVat,
          totalDeductibleVat: parsed.totalDeductibleVat,
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
      error instanceof Error ? error.message : "Eroare la parsare D300.",
      500,
      "D300_PARSE_FAILED",
    )
  }
}

// ── DELETE — șterge o declarație parsată din state ──────────────────────────

export async function DELETE(request: Request) {
  try {
    const session = requireRole(
      request,
      [...WRITE_ROLES],
      "ștergere D300 parsat",
    )
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return jsonError("id obligatoriu.", 400, "D300_NO_ID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedDeclarations ?? []
    const target = existing.find((r) => r.id === id)
    if (!target) return jsonError("Înregistrare negăsită.", 404, "D300_NOT_FOUND")

    const updated = existing.filter((r) => r.id !== id)
    await writeStateForOrg(
      session.orgId,
      {
        ...state,
        parsedDeclarations: updated,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: target.id })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la ștergere.", 500, "D300_DELETE_FAILED")
  }
}
