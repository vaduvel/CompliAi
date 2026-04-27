import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { jsonError } from "@/lib/server/api-response"
import { sendCabinetMagicLinkEmail } from "@/lib/server/cabinet-magic-link-email"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { findSharedApprovalDocument } from "@/lib/server/shared-approval"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"

// Sprint 1.2 — Issue 3 DPO — Comment flow (NU reject)
// Patron poate trimite comentariu pe document FĂRĂ să-l respingă. Util pentru
// întrebări sau cereri de clarificare. Document rămâne în starea curentă (sent
// for signature). Cabinet vede comment în UI dedicat. Nu marchează document
// rejected sau approved — doar atașează feedback.

type Params = {
  params: Promise<{
    token: string
  }>
}

type CommentBody = {
  comment?: string
  authorName?: string
}

const MIN_COMMENT_LENGTH = 4
const MAX_COMMENT_LENGTH = 2_000

function sanitizeComment(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (trimmed.length < MIN_COMMENT_LENGTH) return null
  return trimmed.slice(0, MAX_COMMENT_LENGTH)
}

function sanitizeAuthorName(raw: unknown): string {
  if (typeof raw !== "string") return "Client (magic link)"
  const trimmed = raw.trim()
  return trimmed ? trimmed.slice(0, 120) : "Client (magic link)"
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params
  const payload = resolveSignedShareToken(token)

  if (!payload) {
    return jsonError("Link invalid sau expirat.", 401, "SHARE_TOKEN_INVALID")
  }

  let body: CommentBody = {}
  try {
    const raw = await request.json()
    body = (raw ?? {}) as CommentBody
  } catch {
    return jsonError("Cerere invalidă (body JSON necesar).", 400, "INVALID_REQUEST_BODY")
  }

  const comment = sanitizeComment(body.comment)
  if (!comment) {
    return jsonError(
      `Comentariul este obligatoriu (min. ${MIN_COMMENT_LENGTH} caractere).`,
      400,
      "COMMENT_REQUIRED"
    )
  }
  const authorName = sanitizeAuthorName(body.authorName)
  const commentId = `share-comment-${Date.now().toString(36)}`
  const nowISO = new Date().toISOString()
  let commentedDocument: { id: string; title: string } | null = null
  // S1.8 — captură pentru email cabinet (după mutateStateForOrg).
  let emailContext: { documentId: string; documentTitle: string; documentType: string } | null = null

  try {
    await mutateStateForOrg(payload.orgId, (current) => {
      const targetDocument = findSharedApprovalDocument(current, payload.documentId)
      if (!targetDocument) {
        throw new Error("APPROVABLE_DOCUMENT_NOT_FOUND")
      }

      const existingComments = Array.isArray(targetDocument.shareComments)
        ? targetDocument.shareComments
        : []

      const nextDocument = {
        ...targetDocument,
        shareComments: [
          ...existingComments,
          {
            id: commentId,
            authorName,
            comment,
            recipientType: payload.recipientType,
            createdAtISO: nowISO,
            channel: "public_magic_link" as const,
          },
        ].slice(-50), // păstrăm max 50 comentarii per document
      }

      commentedDocument = {
        id: nextDocument.id,
        title: nextDocument.title,
      }
      emailContext = {
        documentId: nextDocument.id,
        documentTitle: nextDocument.title,
        documentType: nextDocument.documentType,
      }

      return {
        ...current,
        generatedDocuments: current.generatedDocuments.map((document) =>
          document.id === nextDocument.id ? nextDocument : document
        ),
        alerts: [
          {
            id: `alert-shared-comment-${nextDocument.id}-${Date.now()}`,
            message: `Comentariu primit prin magic link: ${nextDocument.title}`,
            severity: "medium" as const,
            open: true,
            sourceDocument: nextDocument.title,
            createdAtISO: nowISO,
            findingId: nextDocument.sourceFindingId,
          },
          ...(current.alerts ?? []),
        ].slice(0, 200),
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "document.shared_commented",
            entityType: "system",
            entityId: nextDocument.id,
            message: `Comentariu primit prin magic link: ${nextDocument.title}`,
            createdAtISO: nowISO,
            actorLabel: authorName,
            actorSource: "system",
            metadata: {
              documentType: nextDocument.documentType,
              shareRecipientType: payload.recipientType,
              commentId,
              commentPreview: comment.slice(0, 240),
            },
          }),
        ]),
      }
    })

    // S1.8 — Notify cabinet via Resend (best-effort, fără să blocheze response).
    if (emailContext) {
      const ctx = emailContext as { documentId: string; documentTitle: string; documentType: string }
      void sendCabinetMagicLinkEmail(payload.orgId, "commented", {
        documentId: ctx.documentId,
        documentTitle: ctx.documentTitle,
        documentType: ctx.documentType,
        recipientType: payload.recipientType,
        occurredAtISO: nowISO,
        comment,
        authorName,
      }).catch(() => {
        // email failure nu rupe comment flow-ul
      })
    }

    return NextResponse.json({
      ok: true,
      commentedAtISO: nowISO,
      commentId,
      document: commentedDocument,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVABLE_DOCUMENT_NOT_FOUND") {
      return jsonError(
        "Nu am găsit un document care poate primi comentarii prin acest link.",
        404,
        "APPROVABLE_DOCUMENT_NOT_FOUND"
      )
    }

    return jsonError("Nu am putut salva comentariul.", 500, "SHARED_COMMENT_FAILED")
  }
}
