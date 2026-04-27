import { Buffer } from "node:buffer"

import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getDocumentAdoptionFeedback } from "@/lib/compliance/document-adoption"
import { jsonError } from "@/lib/server/api-response"
import { sendCabinetMagicLinkEmail } from "@/lib/server/cabinet-magic-link-email"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { findSharedApprovalDocument } from "@/lib/server/shared-approval"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"

// Sprint 1.2 — Issue 3 DPO — Reject flow
// Patron primește magic link, vede document, NU îl aprobă, ci îl respinge
// cu mandatory comment. Cabinet primește notificare (alert + event), comment
// stocat ca evidence (rejection reason). Status document → adoption "rejected".

type Params = {
  params: Promise<{
    token: string
  }>
}

type RejectBody = {
  comment?: string
}

const MIN_COMMENT_LENGTH = 8
const MAX_COMMENT_LENGTH = 2_000

function sanitizeEvidenceSegment(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "document"
  )
}

function sanitizeComment(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (trimmed.length < MIN_COMMENT_LENGTH) return null
  return trimmed.slice(0, MAX_COMMENT_LENGTH)
}

function buildRejectionEvidencePayload(input: {
  documentId: string
  documentTitle: string
  documentType: string
  orgId: string
  rejectedAtISO: string
  recipientType: string
  comment: string
}) {
  return {
    type: "client_rejection",
    title: `Respingere client: ${input.documentTitle}`,
    documentId: input.documentId,
    documentTitle: input.documentTitle,
    documentType: input.documentType,
    orgId: input.orgId,
    rejectedBy: "Client representative via magic link",
    rejectionChannel: "public_magic_link",
    shareRecipientType: input.recipientType,
    rejectionReason: input.comment,
    status: "validated",
    timestamp: input.rejectedAtISO,
  }
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params
  const payload = resolveSignedShareToken(token)

  if (!payload) {
    return jsonError("Link invalid sau expirat.", 401, "SHARE_TOKEN_INVALID")
  }

  let body: RejectBody = {}
  try {
    const raw = await request.json()
    body = (raw ?? {}) as RejectBody
  } catch {
    return jsonError("Cerere invalidă (body JSON necesar).", 400, "INVALID_REQUEST_BODY")
  }

  const comment = sanitizeComment(body.comment)
  if (!comment) {
    return jsonError(
      `Motivul respingerii este obligatoriu (min. ${MIN_COMMENT_LENGTH} caractere).`,
      400,
      "REJECTION_COMMENT_REQUIRED"
    )
  }

  const nowISO = new Date().toISOString()
  let rejectedDocument: { id: string; title: string; adoptionStatus: string } | null = null
  // S1.8 — captură pentru email cabinet (după mutateStateForOrg).
  let emailContext: { documentId: string; documentTitle: string; documentType: string } | null = null

  try {
    await mutateStateForOrg(payload.orgId, (current) => {
      const targetDocument = findSharedApprovalDocument(current, payload.documentId)
      if (!targetDocument) {
        throw new Error("APPROVABLE_DOCUMENT_NOT_FOUND")
      }

      const nextDocument = {
        ...targetDocument,
        adoptionStatus: "rejected" as const,
        adoptionUpdatedAtISO: nowISO,
        adoptionEvidenceNote: `Respins de patron prin magic link la ${new Date(nowISO).toLocaleString(
          "ro-RO"
        )}. Motiv: ${comment.slice(0, 160)}${comment.length > 160 ? "…" : ""}`,
      }
      const rejectionTaskId = `document-rejection-${nextDocument.id}`
      const rejectionEvidencePayload = buildRejectionEvidencePayload({
        documentId: nextDocument.id,
        documentTitle: nextDocument.title,
        documentType: nextDocument.documentType,
        orgId: payload.orgId,
        rejectedAtISO: nowISO,
        recipientType: payload.recipientType,
        comment,
      })
      const rejectionEvidenceJson = JSON.stringify(rejectionEvidencePayload, null, 2)

      emailContext = {
        documentId: nextDocument.id,
        documentTitle: nextDocument.title,
        documentType: nextDocument.documentType,
      }
      rejectedDocument = {
        id: nextDocument.id,
        title: nextDocument.title,
        adoptionStatus: nextDocument.adoptionStatus,
      }

      return {
        ...current,
        generatedDocuments: current.generatedDocuments.map((document) =>
          document.id === nextDocument.id ? nextDocument : document
        ),
        taskState: {
          ...(current.taskState ?? {}),
          [rejectionTaskId]: {
            status: "done" as const,
            updatedAtISO: nowISO,
            validationStatus: "passed" as const,
            validationMessage: `Respingere client capturată prin magic link pentru ${nextDocument.title}.`,
            validationConfidence: "high" as const,
            validationBasis: "direct_signal" as const,
            validatedAtISO: nowISO,
            attachedEvidenceMeta: {
              id: `evidence-${rejectionTaskId}`,
              fileName: `client-rejection-${sanitizeEvidenceSegment(nextDocument.id)}.json`,
              mimeType: "application/json",
              sizeBytes: Buffer.byteLength(rejectionEvidenceJson, "utf8"),
              uploadedAtISO: nowISO,
              kind: "document_bundle" as const,
              quality: {
                status: "sufficient" as const,
                summary:
                  "Respingerea clientului a fost capturată prin magic link cu motivare scrisă.",
                reasonCodes: [],
                checkedAtISO: nowISO,
              },
            },
          },
        },
        alerts: [
          {
            id: `alert-shared-rejection-${nextDocument.id}-${Date.now()}`,
            message: `Document respins prin magic link: ${nextDocument.title}`,
            severity: "high" as const,
            open: true,
            sourceDocument: nextDocument.title,
            createdAtISO: nowISO,
            findingId: nextDocument.sourceFindingId,
          },
          ...(current.alerts ?? []),
        ].slice(0, 200),
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "document.shared_rejected",
            entityType: "system",
            entityId: nextDocument.id,
            message: `Document respins prin magic link: ${nextDocument.title} · ${getDocumentAdoptionFeedback(
              "rejected"
            )}`,
            createdAtISO: nowISO,
            actorLabel: "Client magic link",
            actorSource: "system",
            metadata: {
              documentType: nextDocument.documentType,
              adoptionStatus: "rejected",
              shareRecipientType: payload.recipientType,
              rejectionReasonPreview: comment.slice(0, 240),
            },
          }),
        ]),
      }
    })

    // S1.8 — Notify cabinet via Resend (best-effort, fără să blocheze response).
    if (emailContext) {
      const ctx = emailContext as { documentId: string; documentTitle: string; documentType: string }
      void sendCabinetMagicLinkEmail(payload.orgId, "rejected", {
        documentId: ctx.documentId,
        documentTitle: ctx.documentTitle,
        documentType: ctx.documentType,
        recipientType: payload.recipientType,
        occurredAtISO: nowISO,
        comment,
      }).catch(() => {
        // email failure nu rupe reject flow-ul
      })
    }

    return NextResponse.json({
      ok: true,
      rejectedAtISO: nowISO,
      document: rejectedDocument,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVABLE_DOCUMENT_NOT_FOUND") {
      return jsonError(
        "Nu am găsit un document care poate fi respins prin acest link.",
        404,
        "APPROVABLE_DOCUMENT_NOT_FOUND"
      )
    }

    return jsonError("Nu am putut salva respingerea.", 500, "SHARED_REJECTION_FAILED")
  }
}
