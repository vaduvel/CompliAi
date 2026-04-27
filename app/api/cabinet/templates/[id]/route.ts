// S1.1 — Cabinet templates API: PATCH (toggle active) + DELETE.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import {
  deleteCabinetTemplate,
  setTemplateActive,
} from "@/lib/server/cabinet-templates-store"

type Params = {
  params: Promise<{ id: string }>
}

function ensurePartnerMode(userMode: string | null): asserts userMode is "partner" {
  if (userMode !== "partner") {
    throw new AuthzError(
      "Template-urile cabinet sunt disponibile doar în modul partner.",
      403,
      "CABINET_TEMPLATES_FORBIDDEN"
    )
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager"],
      "toggle template cabinet"
    )
    const userMode = await resolveUserMode(session)
    ensurePartnerMode(userMode)
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { active?: boolean }
    if (typeof body.active !== "boolean") {
      return jsonError("Câmpul active (boolean) este obligatoriu.", 400, "INVALID_REQUEST_BODY")
    }
    const result = await setTemplateActive(session.orgId, id, body.active)
    if (!result.ok) {
      return jsonError(result.error, 404, "CABINET_TEMPLATE_NOT_FOUND")
    }
    return NextResponse.json({ ok: true, template: result.template })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la actualizarea template-ului.", 500, "CABINET_TEMPLATE_PATCH_FAILED")
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager"],
      "ștergere template cabinet"
    )
    const userMode = await resolveUserMode(session)
    ensurePartnerMode(userMode)
    const { id } = await params
    const result = await deleteCabinetTemplate(session.orgId, id)
    if (!result.ok) {
      return jsonError(result.error, 404, "CABINET_TEMPLATE_NOT_FOUND")
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la ștergerea template-ului.", 500, "CABINET_TEMPLATE_DELETE_FAILED")
  }
}
