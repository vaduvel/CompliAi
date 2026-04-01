/**
 * evidence-linker.ts — P0-5: Auto-link evidence to findings.
 *
 * When a document is generated for a finding (sourceFindingId), this module
 * ensures the bidirectional link is explicit and complete:
 *
 * Finding → Document:  finding.suggestedDocumentType + document.sourceFindingId
 * Document → Evidence: document.approvalStatus === "approved_as_evidence"
 * Evidence → Dossier:  evidence appears in dosar exports and audit packs
 *
 * This module also handles auto-creation of evidence links when:
 * - A document passes validation and is confirmed
 * - An operational evidence note is attached to a finding
 * - A finding moves to under_monitoring with a linked document
 */

import type { GeneratedDocumentRecord, ScanFinding } from "@/lib/compliance/types"
import { classifyFinding, getCloseGatingRequirements } from "@/lib/compliscan/finding-kernel"

// ── Types ────────────────────────────────────────────────────────────────────

export type EvidenceLink = {
  findingId: string
  findingTypeId: string
  documentId: string | null
  evidenceType: "generated_document" | "operational_note" | "uploaded_file"
  linkedAtISO: string
  linkedBy: "auto" | "user"
  status: "draft" | "validated" | "approved"
}

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Finds all generated documents linked to a finding via sourceFindingId.
 * Returns them sorted by most recent first.
 */
export function findLinkedDocuments(
  findingId: string,
  generatedDocuments: GeneratedDocumentRecord[]
): GeneratedDocumentRecord[] {
  return generatedDocuments
    .filter((doc) => doc.sourceFindingId === findingId)
    .sort((a, b) => b.generatedAtISO.localeCompare(a.generatedAtISO))
}

/**
 * Returns the best evidence document for a finding:
 * - Prefers approved_as_evidence over draft
 * - Prefers passed validation over pending
 * - Prefers most recent
 */
export function getBestEvidenceDocument(
  findingId: string,
  generatedDocuments: GeneratedDocumentRecord[]
): GeneratedDocumentRecord | null {
  const linked = findLinkedDocuments(findingId, generatedDocuments)

  // First: approved as evidence
  const approved = linked.find((d) => d.approvalStatus === "approved_as_evidence")
  if (approved) return approved

  // Second: validated draft
  const validated = linked.find(
    (d) => d.validationStatus === "passed" && d.approvalStatus === "draft"
  )
  if (validated) return validated

  // Third: any draft
  return linked[0] ?? null
}

/**
 * Builds the evidence links for a finding.
 * Used to serialize the finding→evidence relationship for audit.
 */
export function buildEvidenceLinks(
  finding: ScanFinding,
  generatedDocuments: GeneratedDocumentRecord[]
): EvidenceLink[] {
  const links: EvidenceLink[] = []
  const { findingTypeId } = classifyFinding(finding)
  const nowISO = new Date().toISOString()

  // Document-based evidence
  const linkedDocs = findLinkedDocuments(finding.id, generatedDocuments)
  for (const doc of linkedDocs) {
    links.push({
      findingId: finding.id,
      findingTypeId,
      documentId: doc.id,
      evidenceType: "generated_document",
      linkedAtISO: doc.approvedAtISO ?? doc.validatedAtISO ?? doc.generatedAtISO,
      linkedBy: doc.approvedByEmail ? "user" : "auto",
      status:
        doc.approvalStatus === "approved_as_evidence"
          ? "approved"
          : doc.validationStatus === "passed"
            ? "validated"
            : "draft",
    })
  }

  // Operational evidence note
  if (finding.operationalEvidenceNote?.trim()) {
    links.push({
      findingId: finding.id,
      findingTypeId,
      documentId: null,
      evidenceType: "operational_note",
      linkedAtISO: finding.findingStatusUpdatedAtISO ?? nowISO,
      linkedBy: "user",
      status: "approved",
    })
  }

  return links
}

/**
 * Checks if a finding has sufficient evidence to close, based on its type.
 * Unlike evidence-validator which checks structural quality,
 * this checks that the required evidence TYPES are present.
 */
export function hasRequiredEvidence(
  finding: ScanFinding,
  generatedDocuments: GeneratedDocumentRecord[]
): { complete: boolean; missing: string[] } {
  const { findingTypeId } = classifyFinding(finding)
  const closeGating = getCloseGatingRequirements(findingTypeId)
  const missing: string[] = []

  if (closeGating.requiresGeneratedDocument) {
    const bestDoc = getBestEvidenceDocument(finding.id, generatedDocuments)
    if (!bestDoc) {
      missing.push("Document generat")
    } else if (bestDoc.validationStatus !== "passed") {
      missing.push("Document validat")
    }
  }

  if (closeGating.requiresEvidenceNote && !finding.operationalEvidenceNote?.trim()) {
    missing.push("Notă dovadă operațională")
  }

  return {
    complete: missing.length === 0,
    missing,
  }
}

/**
 * Returns a summary of evidence completeness for display.
 */
export function getEvidenceCompleteness(
  finding: ScanFinding,
  generatedDocuments: GeneratedDocumentRecord[]
): {
  total: number
  completed: number
  percentage: number
  items: Array<{ label: string; done: boolean }>
} {
  const { findingTypeId } = classifyFinding(finding)
  const closeGating = getCloseGatingRequirements(findingTypeId)
  const items: Array<{ label: string; done: boolean }> = []

  if (closeGating.requiresGeneratedDocument) {
    const bestDoc = getBestEvidenceDocument(finding.id, generatedDocuments)
    items.push({ label: "Document generat", done: Boolean(bestDoc) })
    items.push({ label: "Document validat", done: bestDoc?.validationStatus === "passed" })
    items.push({
      label: "Document aprobat ca dovadă",
      done: bestDoc?.approvalStatus === "approved_as_evidence",
    })
  }

  if (closeGating.requiresEvidenceNote) {
    items.push({
      label: "Notă dovadă operațională",
      done: Boolean(finding.operationalEvidenceNote?.trim()),
    })
  }

  if (closeGating.requiresConfirmationChecklist) {
    const bestDoc = getBestEvidenceDocument(finding.id, generatedDocuments)
    items.push({
      label: "Checklist confirmare completat",
      done: Boolean(bestDoc?.confirmationChecklist?.length),
    })
  }

  const completed = items.filter((i) => i.done).length
  return {
    total: items.length,
    completed,
    percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 100,
    items,
  }
}
