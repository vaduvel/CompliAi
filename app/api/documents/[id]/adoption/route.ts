import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  getDocumentAdoptionFeedback,
  supportsDocumentAdoption,
  type DocumentAdoptionStatus,
} from "@/lib/compliance/document-adoption"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"

type Params = {
  params: Promise<{
    id: string
  }>
}

type AdoptionBody = {
  adoptionStatus?: DocumentAdoptionStatus
  adoptionEvidenceNote?: string
}

const VALID_ADOPTION_STATUSES = new Set<DocumentAdoptionStatus>([
  "reviewed_internally",
  "sent_for_signature",
  "signed",
  "active",
])

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance", "reviewer"], "urmă de adoptare document")
    const { id } = await params
    const documentId = id.trim()

    if (!documentId) {
      return jsonError("Document inexistent.", 400, "DOCUMENT_ID_REQUIRED")
    }

    const body = (await request.json().catch(() => null)) as AdoptionBody | null
    const adoptionStatus = body?.adoptionStatus

    if (!adoptionStatus || !VALID_ADOPTION_STATUSES.has(adoptionStatus)) {
      return jsonError("Starea de adoptare este invalidă.", 400, "INVALID_ADOPTION_STATUS")
    }

    const adoptionEvidenceNote = body?.adoptionEvidenceNote?.trim() || undefined
    const nowISO = new Date().toISOString()
    let updatedDocument: Record<string, unknown> | null = null

    await mutateStateForOrg(session.orgId, (current) => {
      const documentIndex = current.generatedDocuments.findIndex((document) => document.id === documentId)
      if (documentIndex === -1) {
        throw new Error("DOCUMENT_NOT_FOUND")
      }

      const currentDocument = current.generatedDocuments[documentIndex]
      if (!supportsDocumentAdoption(currentDocument.documentType)) {
        throw new Error("DOCUMENT_ADOPTION_NOT_SUPPORTED")
      }

      const nextDocument = {
        ...currentDocument,
        adoptionStatus,
        adoptionUpdatedAtISO: nowISO,
        adoptionEvidenceNote: adoptionEvidenceNote ?? currentDocument.adoptionEvidenceNote,
      }

      updatedDocument = nextDocument

      return {
        ...current,
        generatedDocuments: current.generatedDocuments.map((document, index) =>
          index === documentIndex ? nextDocument : document
        ),
        events: appendComplianceEvents(current, [
          createComplianceEvent(
            {
              type: "document.generated",
              entityType: "system",
              entityId: documentId,
              message: `Document actualizat: ${currentDocument.title} · ${getDocumentAdoptionFeedback(adoptionStatus)}`,
              createdAtISO: nowISO,
              metadata: {
                adoptionStatus,
                documentType: currentDocument.documentType,
              },
            },
            {
              id: session.userId,
              label: session.email,
              role: session.role,
              source: "session",
            }
          ),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ok: true,
      document: updatedDocument,
      feedbackMessage: getDocumentAdoptionFeedback(adoptionStatus),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return jsonError("Documentul selectat nu există.", 404, "DOCUMENT_NOT_FOUND")
    }

    if (error instanceof Error && error.message === "DOCUMENT_ADOPTION_NOT_SUPPORTED") {
      return jsonError("Documentul selectat nu are circuit de semnare sau adoptare urmărit în produs.", 400, "DOCUMENT_ADOPTION_NOT_SUPPORTED")
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut salva starea de adoptare.",
      500,
      "DOCUMENT_ADOPTION_UPDATE_FAILED"
    )
  }
}
