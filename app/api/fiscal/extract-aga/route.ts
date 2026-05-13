// POST /api/fiscal/extract-aga — extract text hotărâre AGA via Gemini + persist
// GET  /api/fiscal/extract-aga — list AGA-uri extrase
// DELETE /api/fiscal/extract-aga?id=X — șterge record
// PATCH /api/fiscal/extract-aga — { id, userVerified, overrides? } — confirmare manuală

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import {
  appendComplianceEvents,
  createComplianceEvent,
} from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { extractAgaFromText, type AgaExtractedData } from "@/lib/compliance/parser-aga"
import {
  recentParsedAga,
  summarizeParsedAga,
  upsertParsedAga,
  type ParsedAgaRecord,
  type StateWithParsedAga,
} from "@/lib/compliance/parsed-aga"
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

const MAX_TEXT_BYTES = 200 * 1024 // 200 KB raw (parser-aga limită internă: 50_000 caractere)

type StateExt = ComplianceState & StateWithParsedAga

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "vizualizare AGA extrase")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const records = state.parsedAga ?? []
    const summary = summarizeParsedAga(records)

    return NextResponse.json({
      ok: true,
      records: recentParsedAga(records, 50),
      summary,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare AGA.", 500, "AGA_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "extracție AGA")

    let text = ""
    let fileName: string | undefined
    const contentType = request.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as
        | { text?: string; fileName?: string }
        | null
      if (!body || typeof body.text !== "string") {
        return jsonError("Body invalid (text lipsă).", 400, "AGA_INVALID_BODY")
      }
      text = body.text
      fileName = body.fileName
    } else if (contentType.includes("text/plain")) {
      text = await request.text()
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file")
      const rawText = form.get("text")
      if (file && typeof file !== "string") {
        text = await (file as File).text()
        fileName = (file as File).name
      } else if (typeof rawText === "string") {
        text = rawText
      } else {
        return jsonError("Lipsă text sau fișier.", 400, "AGA_NO_INPUT")
      }
    } else {
      text = await request.text()
    }

    if (!text || text.trim().length === 0) {
      return jsonError("Text gol pentru extracție.", 400, "AGA_EMPTY_TEXT")
    }
    if (text.length > MAX_TEXT_BYTES) {
      return jsonError(
        `Text prea mare (${(text.length / 1024).toFixed(0)} KB). Maxim 200 KB.`,
        413,
        "AGA_TOO_LARGE",
      )
    }

    const extracted: AgaExtractedData = await extractAgaFromText(text)

    // Dacă extracția a eșuat complet (no resolutionDate AND no associates AND errors), 422
    if (
      !extracted.resolutionDate &&
      extracted.associates.length === 0 &&
      extracted.errors.length > 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Extracție eșuată. Verifică textul AGA și reîncearcă.",
          errors: extracted.errors,
          warnings: extracted.warnings,
        },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const record: ParsedAgaRecord = {
      id: `aga-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      resolutionDate: extracted.resolutionDate,
      financialYear: extracted.financialYear,
      parsedAtISO: nowISO,
      source: "upload-text", // PDF→OCR pipe ajunge tot ca text — Pas 5
      fileName,
      data: extracted,
      userVerified: false,
      errors: extracted.errors,
      warnings: extracted.warnings,
    }

    const existing = state.parsedAga ?? []
    const updated = upsertParsedAga(existing, record)

    const actor = await resolveOptionalEventActor(request)
    const totalDiv = extracted.totalDividendsAmount ?? 0
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.aga.extracted",
        entityType: "system",
        entityId: record.id,
        message: `AGA extrasă (${record.resolutionDate ?? "dată necunoscută"}, an ${record.financialYear ?? "?"}): ${extracted.associates.length} asociați, ${totalDiv.toFixed(2)} RON dividende — confidence ${(extracted.confidence * 100).toFixed(0)}%.`,
        createdAtISO: nowISO,
        metadata: {
          resolutionDate: record.resolutionDate ?? "",
          financialYear: record.financialYear ?? 0,
          resolutionType: extracted.resolutionType,
          associatesCount: extracted.associates.length,
          totalDividends: totalDiv,
          confidence: extracted.confidence,
          aiProvider: extracted.aiProvider,
          source: record.source,
          fileName: fileName ?? "",
          warningsCount: extracted.warnings.length,
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
        parsedAga: updated,
        events: newEvents,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      record,
      extracted,
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare extracție AGA.",
      500,
      "AGA_EXTRACT_FAILED",
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "confirmare AGA")
    const body = (await request.json().catch(() => null)) as
      | { id?: string; userVerified?: boolean }
      | null
    if (!body || typeof body.id !== "string") {
      return jsonError("id obligatoriu.", 400, "AGA_NO_ID")
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedAga ?? []
    const idx = existing.findIndex((r) => r.id === body.id)
    if (idx < 0) return jsonError("Înregistrare negăsită.", 404, "AGA_NOT_FOUND")

    const target = existing[idx]!
    const updated: ParsedAgaRecord = {
      ...target,
      userVerified: body.userVerified ?? target.userVerified,
    }
    const next = [...existing]
    next[idx] = updated

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.aga.verified",
        entityType: "system",
        entityId: updated.id,
        message: `AGA confirmată manual (${updated.resolutionDate ?? "?"}, an ${updated.financialYear ?? "?"}).`,
        createdAtISO: new Date().toISOString(),
        metadata: {
          resolutionDate: updated.resolutionDate ?? "",
          financialYear: updated.financialYear ?? 0,
          userVerified: updated.userVerified,
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
      { ...state, parsedAga: next, events: newEvents } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, record: updated })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare confirmare AGA.", 500, "AGA_PATCH_FAILED")
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere AGA")
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return jsonError("id obligatoriu.", 400, "AGA_NO_ID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedAga ?? []
    const target = existing.find((r) => r.id === id)
    if (!target) return jsonError("Înregistrare negăsită.", 404, "AGA_NOT_FOUND")

    const updated = existing.filter((r) => r.id !== id)
    await writeStateForOrg(
      session.orgId,
      { ...state, parsedAga: updated } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: target.id })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare ștergere.", 500, "AGA_DELETE_FAILED")
  }
}
