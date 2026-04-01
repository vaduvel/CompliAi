/**
 * evidence-validator.ts — P0-4: Server-side evidence validation service.
 *
 * Runs structural + content checks on generated documents before they can
 * be accepted as evidence for closing a finding.
 *
 * This is the server-side equivalent of the client-side
 * validateGeneratedDocumentEvidence() — both use the same logic,
 * but this version is authoritative and runs at PATCH time.
 */

import type { GeneratedDocumentRecord, ScanFinding } from "@/lib/compliance/types"
import {
  validateGeneratedDocumentEvidence,
  type GeneratedDocumentValidationResult,
} from "@/lib/compliscan/generated-document-validation"
import type { DocumentType } from "@/lib/server/document-generator"
import { classifyFinding, getCloseGatingRequirements } from "@/lib/compliscan/finding-kernel"

export type EvidenceValidationVerdict = {
  canClose: boolean
  reason: string
  validationResult: GeneratedDocumentValidationResult | null
  missingRequirements: string[]
}

/**
 * Validates whether a finding can be closed given its current evidence state.
 * Returns a verdict with reasons if closure is blocked.
 */
export function validateEvidenceForClosure(params: {
  finding: ScanFinding
  linkedDocument: GeneratedDocumentRecord | null
  orgName: string
  evidenceNote?: string
}): EvidenceValidationVerdict {
  const { finding, linkedDocument, orgName, evidenceNote } = params
  const { findingTypeId } = classifyFinding(finding)
  const closeGating = getCloseGatingRequirements(findingTypeId)
  const missing: string[] = []

  // 1. Check if generated document is required and valid
  let validationResult: GeneratedDocumentValidationResult | null = null

  if (closeGating.requiresGeneratedDocument) {
    if (!linkedDocument) {
      missing.push("Document generat lipsește — generează și confirmă-l din cockpit.")
    } else if (linkedDocument.validationStatus !== "passed") {
      // Run validation
      if (linkedDocument.content) {
        validationResult = validateGeneratedDocumentEvidence({
          documentType: linkedDocument.documentType as DocumentType,
          title: linkedDocument.title,
          content: linkedDocument.content,
          orgName,
        })

        if (validationResult.status === "invalid") {
          const failedLabels = validationResult.checks
            .filter((c) => !c.passed)
            .map((c) => c.label)
          missing.push(`Validare document eșuată: ${failedLabels.join(", ")}`)
        }
      } else {
        missing.push("Documentul generat nu are conținut — regenerează-l.")
      }
    }

    if (linkedDocument && !linkedDocument.confirmationChecklist?.length) {
      missing.push("Checklist de confirmare incomplet (review conținut, verificare fapte, aprobare ca dovadă).")
    }
  }

  // 2. Check operational evidence note
  if (closeGating.requiresEvidenceNote && !evidenceNote?.trim()) {
    missing.push("Lipsește nota de dovadă operațională.")
  }

  // 3. Check revalidation confirmation
  if (closeGating.requiresRevalidationConfirmation) {
    // This is checked at PATCH time, we just flag it here
    missing.push("Necesită confirmare explicită de revalidare.")
  }

  return {
    canClose: missing.length === 0,
    reason:
      missing.length === 0
        ? "Dovada este completă și validată. Finding-ul poate fi închis."
        : `Blocaje: ${missing.join(" ")}`,
    validationResult,
    missingRequirements: missing,
  }
}

/**
 * Summarizes evidence status for a finding — used in API responses
 * to tell the UI what evidence state we're in.
 */
export type EvidenceSummary = {
  hasDocument: boolean
  documentValidated: boolean
  documentApproved: boolean
  hasEvidenceNote: boolean
  canClose: boolean
  missingSteps: string[]
}

export function getEvidenceSummary(params: {
  finding: ScanFinding
  linkedDocument: GeneratedDocumentRecord | null
  orgName: string
}): EvidenceSummary {
  const { finding, linkedDocument, orgName } = params
  const verdict = validateEvidenceForClosure({
    finding,
    linkedDocument,
    orgName,
    evidenceNote: finding.operationalEvidenceNote,
  })

  return {
    hasDocument: Boolean(linkedDocument),
    documentValidated: linkedDocument?.validationStatus === "passed",
    documentApproved: linkedDocument?.approvalStatus === "approved_as_evidence",
    hasEvidenceNote: Boolean(finding.operationalEvidenceNote?.trim()),
    canClose: verdict.canClose,
    missingSteps: verdict.missingRequirements,
  }
}
