import { Buffer } from "node:buffer"

import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getDocumentAdoptionFeedback } from "@/lib/compliance/document-adoption"
import { jsonError } from "@/lib/server/api-response"
import { sendCabinetMagicLinkEmail } from "@/lib/server/cabinet-magic-link-email"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { findSharedApprovalDocument, isSharedDocumentFinal } from "@/lib/server/shared-approval"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"

type Params = {
  params: Promise<{
    token: string
  }>
}

function sanitizeEvidenceSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document"
}

function buildApprovalEvidencePayload(input: {
  documentId: string
  documentTitle: string
  documentType: string
  orgId: string
  approvedAtISO: string
  recipientType: string
}) {
  return {
    type: "client_approval",
    title: `Aprobare client: ${input.documentTitle}`,
    documentId: input.documentId,
    documentTitle: input.documentTitle,
    documentType: input.documentType,
    orgId: input.orgId,
    approvedBy: "Client representative via magic link",
    approvalChannel: "public_magic_link",
    shareRecipientType: input.recipientType,
    status: "validated",
    timestamp: input.approvedAtISO,
  }
}

export async function POST(_request: Request, { params }: Params) {
  const { token } = await params
  const payload = resolveSignedShareToken(token)

  if (!payload) {
    return jsonError("Link invalid sau expirat.", 401, "SHARE_TOKEN_INVALID")
  }

  const nowISO = new Date().toISOString()
  let approvedDocument: { id: string; title: string; adoptionStatus: string } | null = null
  // Captură pentru email-ul S1.8 (după mutateStateForOrg, în afara reducer-ului).
  let emailContext: { documentId: string; documentTitle: string; documentType: string } | null = null

  try {
    await mutateStateForOrg(payload.orgId, (current) => {
      const targetDocument = findSharedApprovalDocument(current, payload.documentId)
      if (!targetDocument) {
        throw new Error("APPROVABLE_DOCUMENT_NOT_FOUND")
      }
      if (isSharedDocumentFinal(targetDocument)) {
        throw new Error("APPROVABLE_DOCUMENT_ALREADY_FINAL")
      }

      const nextDocument = {
        ...targetDocument,
        adoptionStatus: "signed" as const,
        adoptionUpdatedAtISO: nowISO,
        adoptionEvidenceNote:
          targetDocument.adoptionEvidenceNote ??
          `Aprobat prin magic link public la ${new Date(nowISO).toLocaleString("ro-RO")}.`,
      }
      const approvalTaskId = `document-approval-${nextDocument.id}`
      const approvalEvidencePayload = buildApprovalEvidencePayload({
        documentId: nextDocument.id,
        documentTitle: nextDocument.title,
        documentType: nextDocument.documentType,
        orgId: payload.orgId,
        approvedAtISO: nowISO,
        recipientType: payload.recipientType,
      })
      const approvalEvidenceJson = JSON.stringify(approvalEvidencePayload, null, 2)

      approvedDocument = {
        id: nextDocument.id,
        title: nextDocument.title,
        adoptionStatus: nextDocument.adoptionStatus,
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
        taskState: {
          ...(current.taskState ?? {}),
          [approvalTaskId]: {
            status: "done" as const,
            updatedAtISO: nowISO,
            validationStatus: "passed" as const,
            validationMessage: `Aprobare client capturată prin magic link pentru ${nextDocument.title}.`,
            validationConfidence: "high" as const,
            validationBasis: "direct_signal" as const,
            validatedAtISO: nowISO,
            attachedEvidenceMeta: {
              id: `evidence-${approvalTaskId}`,
              fileName: `client-approval-${sanitizeEvidenceSegment(nextDocument.id)}.json`,
              mimeType: "application/json",
              sizeBytes: Buffer.byteLength(approvalEvidenceJson, "utf8"),
              uploadedAtISO: nowISO,
              kind: "document_bundle" as const,
              quality: {
                status: "sufficient" as const,
                summary:
                  "Aprobarea clientului a fost capturată prin magic link și poate intra în pachetul de audit.",
                reasonCodes: [],
                checkedAtISO: nowISO,
              },
            },
          },
        },
        alerts: [
          {
            id: `alert-shared-approval-${nextDocument.id}-${Date.now()}`,
            message: `Document aprobat prin magic link: ${nextDocument.title}`,
            severity: "low" as const,
            open: true,
            sourceDocument: nextDocument.title,
            createdAtISO: nowISO,
            findingId: nextDocument.sourceFindingId,
          },
          ...(current.alerts ?? []),
        ].slice(0, 200),
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "document.shared_approved",
            entityType: "system",
            entityId: nextDocument.id,
            message: `Document aprobat prin magic link: ${nextDocument.title} · ${getDocumentAdoptionFeedback("signed")}`,
            createdAtISO: nowISO,
            actorLabel: "Client magic link",
            actorSource: "system",
            metadata: {
              documentType: nextDocument.documentType,
              adoptionStatus: "signed",
              shareRecipientType: payload.recipientType,
            },
          }),
        ]),
      }
    })

    // S1.8 — Notify cabinet via Resend (best-effort, fără să blocheze response).
    if (emailContext) {
      const ctx = emailContext as { documentId: string; documentTitle: string; documentType: string }
      void sendCabinetMagicLinkEmail(payload.orgId, "approved", {
        documentId: ctx.documentId,
        documentTitle: ctx.documentTitle,
        documentType: ctx.documentType,
        recipientType: payload.recipientType,
        occurredAtISO: nowISO,
      }).catch(() => {
        // email failure nu rupe approve flow-ul; signal e deja în alerts + events
      })
    }

    return NextResponse.json({
      ok: true,
      approvedAtISO: nowISO,
      document: approvedDocument,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVABLE_DOCUMENT_NOT_FOUND") {
      return jsonError(
        "Nu am găsit un document care poate fi aprobat prin acest link.",
        404,
        "APPROVABLE_DOCUMENT_NOT_FOUND"
      )
    }
    if (error instanceof Error && error.message === "APPROVABLE_DOCUMENT_ALREADY_FINAL") {
      return jsonError(
        "Documentul are deja o decizie finală. Generează o versiune nouă pentru o nouă aprobare.",
        409,
        "APPROVABLE_DOCUMENT_ALREADY_FINAL"
      )
    }

    return jsonError("Nu am putut salva aprobarea.", 500, "SHARED_APPROVAL_FAILED")
  }
}
