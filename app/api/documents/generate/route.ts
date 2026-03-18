import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole, AuthzError } from "@/lib/server/auth"
import { trackEvent } from "@/lib/server/analytics"
import { RequestValidationError } from "@/lib/server/request-validation"
import {
  generateDocument,
  DOCUMENT_TYPES,
  type DocumentType,
  type DocumentGenerationInput,
} from "@/lib/server/document-generator"

const VALID_TYPES = new Set<string>(DOCUMENT_TYPES.map((d) => d.id))

export async function POST(request: Request) {
  try {
    const session = requireRole(request, ["owner", "compliance", "reviewer"], "generarea documentelor")

    const body = (await request.json()) as Partial<DocumentGenerationInput>

    const documentType = body.documentType
    if (!documentType || !VALID_TYPES.has(documentType)) {
      return jsonError(
        `documentType invalid. Valori acceptate: ${[...VALID_TYPES].join(", ")}.`,
        400,
        "INVALID_DOCUMENT_TYPE"
      )
    }

    const orgName = body.orgName?.trim()
    if (!orgName) {
      return jsonError("orgName este obligatoriu.", 400, "ORG_NAME_REQUIRED")
    }

    const input: DocumentGenerationInput = {
      documentType: documentType as DocumentType,
      orgName,
      orgWebsite: body.orgWebsite?.trim() || undefined,
      orgSector: body.orgSector?.trim() || undefined,
      orgCui: body.orgCui?.trim() || undefined,
      dpoEmail: body.dpoEmail?.trim() || undefined,
      dataFlows: body.dataFlows?.trim() || undefined,
    }

    const result = await generateDocument(input)
    void trackEvent(session.orgId, "generated_first_document", { docType: input.documentType })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    if (error instanceof RequestValidationError) return jsonError(error.message, error.status, error.code)

    const message = error instanceof Error ? error.message : "Generarea a eșuat."
    return jsonError(message, 500, "DOCUMENT_GENERATION_FAILED")
  }
}
