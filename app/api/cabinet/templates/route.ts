// S1.1 — Cabinet templates API: list + create.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import {
  listCabinetTemplates,
  saveCabinetTemplate,
  type CabinetTemplateInput,
} from "@/lib/server/cabinet-templates-store"
import type { DocumentType } from "@/lib/server/document-generator"

const VALID_TYPES = new Set<DocumentType>([
  "privacy-policy",
  "cookie-policy",
  "dpa",
  "retention-policy",
  "nis2-incident-response",
  "ai-governance",
  "annex-iv",
  "job-description",
  "hr-internal-procedures",
  "reges-correction-brief",
  "contract-template",
  "nda",
  "supplier-contract",
  "deletion-attestation",
  "pay-gap-report",
  "ropa",
])

function ensurePartnerMode(userMode: string | null): asserts userMode is "partner" {
  if (userMode !== "partner") {
    throw new AuthzError(
      "Template-urile cabinet sunt disponibile doar în modul partner.",
      403,
      "CABINET_TEMPLATES_FORBIDDEN"
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "listare template-uri cabinet"
    )
    const userMode = await resolveUserMode(session)
    ensurePartnerMode(userMode)

    const templates = await listCabinetTemplates(session.orgId)
    return NextResponse.json({ ok: true, templates })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la listarea template-urilor.", 500, "CABINET_TEMPLATES_LIST_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager"],
      "upload template cabinet"
    )
    const userMode = await resolveUserMode(session)
    ensurePartnerMode(userMode)

    const body = (await request.json()) as Partial<CabinetTemplateInput>
    if (!body.documentType || !VALID_TYPES.has(body.documentType as DocumentType)) {
      return jsonError(
        `documentType invalid. Tipuri acceptate: ${[...VALID_TYPES].join(", ")}.`,
        400,
        "INVALID_DOCUMENT_TYPE"
      )
    }
    if (typeof body.name !== "string" || typeof body.content !== "string") {
      return jsonError(
        "Câmpurile name (string) și content (string) sunt obligatorii.",
        400,
        "INVALID_REQUEST_BODY"
      )
    }

    const result = await saveCabinetTemplate(session.orgId, {
      documentType: body.documentType as DocumentType,
      name: body.name,
      content: body.content,
      active: body.active !== false,
      description: typeof body.description === "string" ? body.description : null,
      versionLabel: typeof body.versionLabel === "string" ? body.versionLabel : null,
      sourceFileName: typeof body.sourceFileName === "string" ? body.sourceFileName : null,
    })

    if (!result.ok) {
      return jsonError(result.error, 400, "CABINET_TEMPLATE_REJECTED")
    }
    return NextResponse.json({ ok: true, template: result.template })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvarea template-ului.", 500, "CABINET_TEMPLATE_SAVE_FAILED")
  }
}
