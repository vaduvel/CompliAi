// POST /api/fiscal/invoice-ocr — OCR factură + persistă în state pentru R1
// GET  /api/fiscal/invoice-ocr — listă facturi OCR-ate (filtru opțional ?direction=primita|emisa)
// PATCH /api/fiscal/invoice-ocr — { id, userVerified } sau override câmpuri
// DELETE /api/fiscal/invoice-ocr?id=X — șterge record
//
// Wrapper peste lib/compliance/invoice-ocr-extract.ts (Gemini Vision) cu
// persistare per organizație — fundație pentru R1 (Σ TVA primite ↔ D300).

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
  extractInvoiceFromImage,
  type OcrExtractionInput,
} from "@/lib/compliance/invoice-ocr-extract"
import {
  periodFromDateISO,
  recentParsedInvoices,
  summarizeParsedInvoices,
  upsertParsedInvoice,
  type InvoiceDirection,
  type OcrInvoiceSource,
  type ParsedInvoiceRecord,
  type StateWithParsedInvoices,
} from "@/lib/compliance/parsed-invoices"
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

const MAX_BASE64_SIZE = 12 * 1024 * 1024 // ~9 MB binary

type StateExt = ComplianceState & StateWithParsedInvoices

function isInvoiceDirection(v: unknown): v is InvoiceDirection {
  return v === "primita" || v === "emisa"
}

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...READ_ROLES], "vizualizare facturi OCR")
    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const url = new URL(request.url)
    const directionFilter = url.searchParams.get("direction")
    let records = state.parsedInvoices ?? []
    if (isInvoiceDirection(directionFilter)) {
      records = records.filter((r) => r.direction === directionFilter)
    }

    return NextResponse.json({
      ok: true,
      records: recentParsedInvoices(records, 100),
      summary: summarizeParsedInvoices(state.parsedInvoices ?? []),
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la încărcare facturi OCR.", 500, "OCR_INV_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "OCR factură")

    const body = (await request.json().catch(() => null)) as
      | {
          imageBase64?: string
          mimeType?: string
          mode?: OcrExtractionInput["mode"]
          direction?: InvoiceDirection
          fileName?: string
        }
      | null

    if (!body || typeof body.imageBase64 !== "string") {
      return jsonError(
        "imageBase64 obligatoriu (string base64).",
        400,
        "OCR_INV_NO_IMAGE",
      )
    }
    if (body.imageBase64.length > MAX_BASE64_SIZE) {
      return jsonError("Imagine prea mare (max ~9 MB).", 413, "OCR_INV_TOO_LARGE")
    }
    const direction: InvoiceDirection = isInvoiceDirection(body.direction)
      ? body.direction
      : "primita"
    const mode: OcrExtractionInput["mode"] =
      body.mode === "local" || body.mode === "cloud" || body.mode === "auto"
        ? body.mode
        : "auto"

    const result = await extractInvoiceFromImage({
      imageBase64: body.imageBase64,
      mimeType: body.mimeType ?? "image/jpeg",
      mode,
    })

    if (!result.ok || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error ?? "Extracție OCR eșuată.",
          provider: result.provider,
        },
        { status: 422 },
      )
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const nowISO = new Date().toISOString()
    const data = result.data
    const issueDateISO = typeof data.issueDateISO === "string" ? data.issueDateISO : null
    const period = periodFromDateISO(issueDateISO)

    // Determine partner side based on direction
    const partnerCif =
      direction === "primita"
        ? (data.supplierCif ?? null)
        : (data.customerCif ?? null)
    const partnerName =
      direction === "primita"
        ? (data.supplierName ?? null)
        : (data.customerName ?? null)

    const warnings: string[] = []
    if (data.confidence === "low") {
      warnings.push("Confidence AI: scăzut. Verifică toate câmpurile.")
    }
    if (!partnerCif) {
      warnings.push(
        direction === "primita"
          ? "CIF furnizor lipsă — completează manual."
          : "CIF client lipsă — completează manual.",
      )
    }
    if (!issueDateISO) {
      warnings.push("Data emiterii lipsă — completează manual.")
    }
    // Sanity check: net + vat == gross
    if (
      typeof data.totalNetRON === "number" &&
      typeof data.totalVatRON === "number" &&
      typeof data.totalGrossRON === "number"
    ) {
      const expected = data.totalNetRON + data.totalVatRON
      if (Math.abs(expected - data.totalGrossRON) > 0.05) {
        warnings.push(
          `Inconsistență sume: net (${data.totalNetRON.toFixed(2)}) + TVA (${data.totalVatRON.toFixed(2)}) ≠ brut (${data.totalGrossRON.toFixed(2)}).`,
        )
      }
    }

    const source: OcrInvoiceSource =
      (body.mimeType ?? "").includes("pdf") ? "ocr-pdf" : "ocr-image"

    const record: ParsedInvoiceRecord = {
      id: `ocr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      direction,
      invoiceNumber: typeof data.invoiceNumber === "string" ? data.invoiceNumber : null,
      issueDateISO,
      period,
      partnerCif,
      partnerName,
      totalNetRON: typeof data.totalNetRON === "number" ? data.totalNetRON : null,
      totalVatRON: typeof data.totalVatRON === "number" ? data.totalVatRON : null,
      totalGrossRON:
        typeof data.totalGrossRON === "number" ? data.totalGrossRON : null,
      currency: typeof data.currency === "string" ? data.currency : null,
      confidence:
        data.confidence === "high" ||
        data.confidence === "medium" ||
        data.confidence === "low"
          ? data.confidence
          : null,
      aiProvider: result.provider,
      parsedAtISO: nowISO,
      source,
      fileName: body.fileName,
      data,
      userVerified: false,
      errors: [],
      warnings,
    }

    const existing = state.parsedInvoices ?? []
    const updated = upsertParsedInvoice(existing, record)

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.invoice.ocr.parsed",
        entityType: "system",
        entityId: record.id,
        message: `Factură ${direction} OCR-ată: ${record.invoiceNumber ?? "?"} (${partnerName ?? "?"}) — ${(record.totalVatRON ?? 0).toFixed(2)} RON TVA, confidence ${record.confidence ?? "?"}.`,
        createdAtISO: nowISO,
        metadata: {
          direction,
          invoiceNumber: record.invoiceNumber ?? "",
          partnerCif: partnerCif ?? "",
          period: period ?? "",
          totalVatRON: record.totalVatRON ?? 0,
          totalGrossRON: record.totalGrossRON ?? 0,
          confidence: record.confidence ?? "",
          aiProvider: record.aiProvider,
          source: record.source,
          fileName: body.fileName ?? "",
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
        parsedInvoices: updated,
        events: newEvents,
      } as StateExt,
      session.orgName,
    )

    return NextResponse.json({
      ok: true,
      record,
      extracted: data,
      auditEventId: auditEvent.id,
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare OCR factură.",
      500,
      "OCR_INV_FAILED",
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "modificare OCR factură")
    const body = (await request.json().catch(() => null)) as
      | {
          id?: string
          userVerified?: boolean
          overrides?: {
            invoiceNumber?: string | null
            issueDateISO?: string | null
            partnerCif?: string | null
            partnerName?: string | null
            totalNetRON?: number | null
            totalVatRON?: number | null
            totalGrossRON?: number | null
          }
        }
      | null
    if (!body || typeof body.id !== "string") {
      return jsonError("id obligatoriu.", 400, "OCR_INV_NO_ID")
    }

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedInvoices ?? []
    const idx = existing.findIndex((r) => r.id === body.id)
    if (idx < 0) return jsonError("Înregistrare negăsită.", 404, "OCR_INV_NOT_FOUND")

    const target = existing[idx]!
    const ov = body.overrides ?? {}
    const newIssueDate =
      ov.issueDateISO !== undefined ? ov.issueDateISO : target.issueDateISO
    const updated: ParsedInvoiceRecord = {
      ...target,
      userVerified: body.userVerified ?? target.userVerified,
      invoiceNumber:
        ov.invoiceNumber !== undefined ? ov.invoiceNumber : target.invoiceNumber,
      issueDateISO: newIssueDate,
      period:
        ov.issueDateISO !== undefined ? periodFromDateISO(newIssueDate) : target.period,
      partnerCif: ov.partnerCif !== undefined ? ov.partnerCif : target.partnerCif,
      partnerName: ov.partnerName !== undefined ? ov.partnerName : target.partnerName,
      totalNetRON:
        ov.totalNetRON !== undefined ? ov.totalNetRON : target.totalNetRON,
      totalVatRON:
        ov.totalVatRON !== undefined ? ov.totalVatRON : target.totalVatRON,
      totalGrossRON:
        ov.totalGrossRON !== undefined ? ov.totalGrossRON : target.totalGrossRON,
    }
    const next = [...existing]
    next[idx] = updated

    const actor = await resolveOptionalEventActor(request)
    const auditEvent = createComplianceEvent(
      {
        type: "fiscal.invoice.ocr.updated",
        entityType: "system",
        entityId: updated.id,
        message: `Factură OCR ${updated.invoiceNumber ?? "?"} actualizată${body.userVerified ? " (confirmată manual)" : ""}.`,
        createdAtISO: new Date().toISOString(),
        metadata: {
          direction: updated.direction,
          invoiceNumber: updated.invoiceNumber ?? "",
          userVerified: updated.userVerified,
          overridesApplied: Object.keys(ov).length,
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
      { ...state, parsedInvoices: next, events: newEvents } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, record: updated })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare actualizare factură.", 500, "OCR_INV_PATCH_FAILED")
  }
}

export async function DELETE(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "ștergere factură OCR")
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) return jsonError("id obligatoriu.", 400, "OCR_INV_NO_ID")

    const state = (await readStateForOrg(session.orgId)) as StateExt | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const existing = state.parsedInvoices ?? []
    const target = existing.find((r) => r.id === id)
    if (!target) return jsonError("Înregistrare negăsită.", 404, "OCR_INV_NOT_FOUND")

    const updated = existing.filter((r) => r.id !== id)
    await writeStateForOrg(
      session.orgId,
      { ...state, parsedInvoices: updated } as StateExt,
      session.orgName,
    )

    return NextResponse.json({ ok: true, removed: target.id })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare ștergere.", 500, "OCR_INV_DELETE_FAILED")
  }
}
