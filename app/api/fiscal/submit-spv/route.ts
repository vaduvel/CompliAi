// P0-6 — Initiate e-Factura submit to ANAF SPV.
// POST: validates input, creates pending_action (ALWAYS manual), returns submission ID.
// GET:  lists submissions for the current org.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"
import { initiateSubmit, listSubmissions, cacheXmlForSubmission } from "@/lib/server/anaf-submit-flow"
import { validateEFacturaXml } from "@/lib/compliance/efactura-validator"
import type { EFacturaValidationRecord } from "@/lib/compliance/types"

const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function POST(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES], "transmitere ANAF SPV")

    const orgId = request.headers.get("x-compliscan-org-id") ?? session.orgId
    const userId = request.headers.get("x-compliscan-user-id") ?? session.userId
    const userEmail = request.headers.get("x-compliscan-user-email") ?? session.email

    const body = (await request.json()) as {
      xmlContent?: string
      invoiceId?: string
      sourceFindingId?: string
    }

    if (!body.xmlContent?.trim()) {
      return jsonError("XML-ul facturii este obligatoriu.", 400, "MISSING_XML")
    }

    // Get CUI from org profile
    const state = await readState()
    const cui = state.orgProfile?.cui
    if (!cui) {
      return jsonError("CUI-ul organizației nu este configurat. Completează profilul mai întâi.", 400, "NO_CUI")
    }

    const invoiceId = body.invoiceId || `INV-${Date.now()}`

    // Validate XML structure before allowing submit
    const nowISO = new Date().toISOString()
    const validation: EFacturaValidationRecord = validateEFacturaXml({
      documentName: invoiceId,
      xml: body.xmlContent,
      nowISO,
    })
    if (!validation.valid && validation.errors.length > 0) {
      return jsonError(
        `XML-ul are ${validation.errors.length} erori critice. Corectează-le înainte de transmitere: ${validation.errors[0]}`,
        400,
        "XML_INVALID"
      )
    }

    const { submission, pendingAction } = await initiateSubmit({
      orgId,
      userId,
      userEmail,
      invoiceId,
      xmlContent: body.xmlContent,
      cif: cui,
      sourceFindingId: body.sourceFindingId,
    })

    // Cache XML for later execution
    cacheXmlForSubmission(submission.id, body.xmlContent)

    return NextResponse.json({
      ok: true,
      submission,
      approvalActionId: pendingAction.id,
      message: "Transmiterea a fost creată și așteaptă aprobare. O poți aproba direct din tabul Fiscal sau din pagina Aprobări.",
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la inițierea transmiterii.", 500, "SUBMIT_INIT_FAILED")
  }
}

export async function GET(request: Request) {
  try {
    const session = requireRole(request, [...WRITE_ROLES, "reviewer"], "lista transmisii ANAF")

    const orgId = request.headers.get("x-compliscan-org-id") ?? session.orgId
    const submissions = await listSubmissions(orgId)

    return NextResponse.json({ submissions })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la citirea transmisiilor.", 500, "SUBMIT_LIST_FAILED")
  }
}
