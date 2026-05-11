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
import { parseCabinetTemplateUpload } from "@/lib/server/template-upload-parser"

const VALID_TYPES = new Set<DocumentType>([
  "privacy-policy",
  "cookie-policy",
  "dpa",
  "dpia",
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
  "dsar-response",
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

    const body = await readTemplateRequestBody(request)
    if (!body.documentType || !VALID_TYPES.has(body.documentType as DocumentType)) {
      return jsonError(
        `documentType invalid. Tipuri acceptate: ${[...VALID_TYPES].join(", ")}.`,
        400,
        "INVALID_DOCUMENT_TYPE"
      )
    }
    if (typeof body.name !== "string" || typeof body.content !== "string") {
      return jsonError(
        "Câmpurile name și content sunt obligatorii. Poți trimite content JSON sau un fișier .docx/.md/.txt în multipart.",
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
    if (error instanceof Error && error.message.startsWith("TEMPLATE_UPLOAD_INVALID:")) {
      return jsonError(
        error.message.replace("TEMPLATE_UPLOAD_INVALID:", "").trim(),
        400,
        "CABINET_TEMPLATE_UPLOAD_INVALID"
      )
    }
    return jsonError("Eroare la salvarea template-ului.", 500, "CABINET_TEMPLATE_SAVE_FAILED")
  }
}

async function readTemplateRequestBody(request: Request): Promise<Partial<CabinetTemplateInput>> {
  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return (await request.json()) as Partial<CabinetTemplateInput>
  }

  const formData = await request.formData()
  const uploaded = formData.get("file") ?? formData.get("templateFile")
  const parsed =
    uploaded instanceof File && uploaded.size > 0
      ? await parseCabinetTemplateUpload(uploaded)
      : null

  if (parsed && !parsed.ok) {
    throw new Error(`TEMPLATE_UPLOAD_INVALID: ${parsed.error}`)
  }

  const contentFromField = textValue(formData.get("content"))
  const parsedTemplate = parsed?.ok ? parsed.template : null

  return {
    documentType: textValue(formData.get("documentType")) as DocumentType | undefined,
    name: textValue(formData.get("name")) ?? parsedTemplate?.sourceFileName,
    description: textValue(formData.get("description")),
    versionLabel: textValue(formData.get("versionLabel")),
    sourceFileName: textValue(formData.get("sourceFileName")) ?? parsedTemplate?.sourceFileName,
    content: parsedTemplate?.content ?? contentFromField,
    active: parseBoolean(formData.get("active")),
  }
}

function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function parseBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}
