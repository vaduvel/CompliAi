import { supportsDocumentAdoption } from "@/lib/compliance/document-adoption"
import type { ComplianceState, GeneratedDocumentRecord } from "@/lib/compliance/types"

export function findSharedApprovalDocument(
  state: ComplianceState,
  documentId?: string | null
): GeneratedDocumentRecord | null {
  const approvableDocuments = state.generatedDocuments
    .filter((document) => supportsDocumentAdoption(document.documentType))
    .sort((a, b) => new Date(b.generatedAtISO).getTime() - new Date(a.generatedAtISO).getTime())

  if (documentId?.trim()) {
    return approvableDocuments.find((document) => document.id === documentId.trim()) ?? null
  }

  return approvableDocuments[0] ?? null
}

export function isSharedDocumentApproved(document?: GeneratedDocumentRecord | null) {
  return document?.adoptionStatus === "signed" || document?.adoptionStatus === "active"
}

// Sprint 1.2 — Issue 3 DPO: helpers pentru reject + comment flow
export function isSharedDocumentRejected(document?: GeneratedDocumentRecord | null) {
  return document?.adoptionStatus === "rejected"
}

export function isSharedDocumentFinal(document?: GeneratedDocumentRecord | null) {
  return isSharedDocumentApproved(document) || isSharedDocumentRejected(document)
}

export function getSharedDocumentComments(document?: GeneratedDocumentRecord | null) {
  return Array.isArray(document?.shareComments) ? document!.shareComments! : []
}
