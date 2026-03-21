// E2 — Drift-linked Document Regeneration
// When drift is detected on a control:
// 1. Find documents linked to that control
// 2. Mark as 'refresh-candidate'
// 3. Notify user — do NOT regenerate automatically

import type {
  ComplianceState,
  ComplianceDriftRecord,
  GeneratedDocumentRecord,
  GeneratedDocumentKind,
} from "@/lib/compliance/types"

export type DocumentRefreshCandidate = {
  documentId: string
  documentTitle: string
  documentType: GeneratedDocumentKind
  driftId: string
  driftSummary: string
  reason: string
}

// Map drift change types to document types that may be affected
const DRIFT_TO_DOCUMENT_MAP: Record<string, GeneratedDocumentKind[]> = {
  provider_added: ["dpa", "privacy-policy"],
  provider_changed: ["dpa", "privacy-policy"],
  model_changed: ["ai-governance"],
  framework_added: ["privacy-policy", "ai-governance", "nis2-incident-response"],
}

/**
 * E2: Check if any generated documents need refreshing due to drift.
 * Returns list of documents that should be marked as 'refresh-candidate'.
 * Does NOT regenerate — proposes, user decides.
 */
export function findDocumentsAffectedByDrift(
  state: ComplianceState,
  newDrifts: ComplianceDriftRecord[]
): DocumentRefreshCandidate[] {
  const candidates: DocumentRefreshCandidate[] = []
  const documents = state.generatedDocuments ?? []

  if (documents.length === 0 || newDrifts.length === 0) return []

  for (const drift of newDrifts) {
    if (!drift.open) continue

    const affectedDocTypes = DRIFT_TO_DOCUMENT_MAP[drift.change] ?? []

    for (const doc of documents) {
      if (affectedDocTypes.includes(doc.documentType)) {
        // Skip if already marked as refresh-candidate
        if (doc.refreshStatus === "refresh-candidate") continue

        candidates.push({
          documentId: doc.id,
          documentTitle: doc.title,
          documentType: doc.documentType,
          driftId: drift.id,
          driftSummary: drift.summary.slice(0, 100),
          reason: `Drift "${drift.change}" detectat — documentul "${doc.title}" poate necesita actualizare.`,
        })
      }
    }
  }

  // Deduplicate by documentId (one document may be affected by multiple drifts)
  const seen = new Set<string>()
  return candidates.filter((c) => {
    if (seen.has(c.documentId)) return false
    seen.add(c.documentId)
    return true
  })
}

/**
 * Mark documents as 'refresh-candidate' in state.
 * Returns the updated generatedDocuments array.
 */
export function markDocumentsForRefresh(
  documents: GeneratedDocumentRecord[],
  candidateIds: Set<string>
): GeneratedDocumentRecord[] {
  return documents.map((doc) => {
    if (candidateIds.has(doc.id) && doc.refreshStatus !== "refresh-candidate") {
      return { ...doc, refreshStatus: "refresh-candidate" as const }
    }
    return doc
  })
}
