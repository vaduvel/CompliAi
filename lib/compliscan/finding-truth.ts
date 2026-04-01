/**
 * finding-truth.ts — P0-3: Materializes kernel-computed fields onto ScanFinding.
 *
 * The finding-kernel computes everything at runtime from the raw finding.
 * This module stamps those computed values onto the finding so they are:
 * - Persisted alongside the finding in ComplianceState
 * - Available in API responses without re-computation
 * - Auditable: the truth at the moment of the stamp is preserved
 *
 * Call materializeFindingTruth() when:
 * - A finding is created (scan pipeline)
 * - A finding status changes (confirm, resolve, dismiss, reopen)
 * - A finding is enriched (evidence linked, document generated)
 */

import type { ScanFinding } from "@/lib/compliance/types"
import {
  classifyFinding,
  getCloseGatingRequirements,
  getFindingTypeDefinition,
  getResolveFlowRecipe,
} from "@/lib/compliscan/finding-kernel"

// ── Locus mapping ─────────────────────────────────────────────────────────────

type ResolutionLocus = NonNullable<ScanFinding["resolutionLocus"]>
type ResolutionMode = NonNullable<ScanFinding["resolutionMode"]>
type ReviewState = NonNullable<ScanFinding["reviewState"]>

function mapResolutionModeToLocus(mode: string): ResolutionLocus {
  switch (mode) {
    case "in_app_guided":
    case "in_app_full":
      return "in_app"
    case "external_action":
      return "external_controlled"
    case "user_attestation":
      return "hybrid"
    default:
      return "hybrid"
  }
}

function deriveReviewState(finding: ScanFinding): ReviewState {
  const status = finding.findingStatus ?? "open"

  switch (status) {
    case "open":
      return "unreviewed"
    case "confirmed":
      return "confirmed"
    case "resolved":
      return "closed"
    case "under_monitoring":
      return "monitoring"
    case "dismissed":
      return "closed"
    default:
      return "unreviewed"
  }
}

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Stamps kernel-computed truth fields onto a finding.
 * Returns a new finding object (does not mutate the input).
 */
export function materializeFindingTruth(finding: ScanFinding): ScanFinding {
  const { findingTypeId } = classifyFinding(finding)
  const findingType = getFindingTypeDefinition(findingTypeId)
  const flow = getResolveFlowRecipe(findingTypeId)
  const closeGating = getCloseGatingRequirements(findingTypeId)
  const primaryMode = findingType.resolutionModes[0] as ResolutionMode

  return {
    ...finding,
    findingTypeId,
    resolutionMode: primaryMode,
    resolutionLocus: mapResolutionModeToLocus(primaryMode),
    closeCondition: flow.closeCondition,
    requiredEvidenceKinds: closeGating.acceptedEvidence,
    reviewState: deriveReviewState(finding),
    truthMaterializedAtISO: new Date().toISOString(),
  }
}

/**
 * Batch-materialize truth on all findings.
 * Used when migrating existing findings or on state load.
 */
export function materializeAllFindingsTruth(findings: ScanFinding[]): ScanFinding[] {
  return findings.map(materializeFindingTruth)
}

/**
 * Check if a finding already has truth fields materialized.
 */
export function hasMaterializedTruth(finding: ScanFinding): boolean {
  return Boolean(finding.findingTypeId && finding.truthMaterializedAtISO)
}
