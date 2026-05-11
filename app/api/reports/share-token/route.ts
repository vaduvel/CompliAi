// POST /api/reports/share-token — G2: Generate secure share link
// Creates a 72h-expiry token for sharing with accountant/counsel/partner.

import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getDocumentAdoptionFeedback, supportsDocumentAdoption } from "@/lib/compliance/document-adoption"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { generateSignedShareToken } from "@/lib/server/share-token-store"

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "generarea linkului securizat de partajare"
    )

    const body = (await request.json()) as {
      recipientType?: string
      documentId?: string
      documentTitle?: string
    }
    const recipientType = (body.recipientType === "counsel" || body.recipientType === "partner")
      ? body.recipientType
      : "accountant" as const

    const document =
      typeof body.documentId === "string" && body.documentId.trim().length > 0
        ? {
            documentId: body.documentId.trim(),
            documentTitle:
              typeof body.documentTitle === "string" && body.documentTitle.trim().length > 0
                ? body.documentTitle.trim()
                : undefined,
          }
        : undefined
    const token = document
      ? generateSignedShareToken(session.orgId, recipientType, new Date().toISOString(), document)
      : generateSignedShareToken(session.orgId, recipientType, new Date().toISOString())
    const expiresAtISO = new Date(Date.now() + 72 * 3_600_000).toISOString()

    if (document?.documentId) {
      const nowISO = new Date().toISOString()
      let found = false
      let supported = false

      await mutateStateForOrg(session.orgId, (current) => {
        const target = current.generatedDocuments.find((doc) => doc.id === document.documentId)
        found = Boolean(target)
        supported = Boolean(target && supportsDocumentAdoption(target.documentType))

        if (!target || !supported) return current
        const isFinal = target.adoptionStatus === "signed" || target.adoptionStatus === "active" || target.adoptionStatus === "rejected"
        const nextDocument = isFinal
          ? target
          : {
              ...target,
              adoptionStatus: "sent_for_signature" as const,
              adoptionUpdatedAtISO: nowISO,
              adoptionEvidenceNote:
                target.adoptionEvidenceNote ??
                `Trimis clientului prin magic link la ${new Date(nowISO).toLocaleString("ro-RO")}.`,
            }

        return {
          ...current,
          generatedDocuments: current.generatedDocuments.map((doc) =>
            doc.id === nextDocument.id ? nextDocument : doc
          ),
          events: appendComplianceEvents(current, [
            createComplianceEvent(
              {
                type: "document.shared",
                entityType: "system",
                entityId: nextDocument.id,
                message: `Document trimis la client prin magic link: ${nextDocument.title} · ${getDocumentAdoptionFeedback("sent_for_signature")}`,
                createdAtISO: nowISO,
                metadata: {
                  documentType: nextDocument.documentType,
                  adoptionStatus: nextDocument.adoptionStatus ?? "sent_for_signature",
                  shareRecipientType: recipientType,
                  expiresAtISO,
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

      if (!found) {
        return jsonError("Documentul selectat nu există în dosarul clientului.", 404, "DOCUMENT_NOT_FOUND")
      }
      if (!supported) {
        return jsonError("Documentul selectat nu are flux de aprobare client.", 400, "DOCUMENT_SHARE_NOT_SUPPORTED")
      }
    }

    return NextResponse.json({ ok: true, token, expiresAtISO })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Eroare la generarea tokenului.", 500, "SHARE_TOKEN_FAILED")
  }
}
