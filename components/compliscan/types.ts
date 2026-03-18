"use client"

import type {
  FindingCategory,
  RemediationMode,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
} from "@/lib/compliance/types"
import type {
  CompliancePrinciple,
  ComplianceSeverity,
} from "@/lib/compliance/constitution"

export type TaskPriority = "P1" | "P2" | "P3"
export type TaskStatus = "todo" | "done"
export type TaskConfidence = "low" | "med" | "high"
export type TaskValidationStatus = "idle" | "passed" | "failed" | "needs_review"

export type CockpitTask = {
  id: string
  title: string
  category?: FindingCategory
  priority: TaskPriority
  severity: ComplianceSeverity
  remediationMode: RemediationMode
  principles: CompliancePrinciple[]
  summary: string
  why: string
  evidenceSnippet: string
  source: string
  triggerLabel: string
  triggerSnippet?: string
  lawReference: string
  legalSummary?: string
  fixPreview: string
  readyTextLabel: string
  readyText: string
  confidence: TaskConfidence
  owner: string
  dueDate: string
  effortLabel: string
  steps: string[]
  relatedFindingIds: string[]
  relatedDriftIds: string[]
  rescanHint?: string
  closureRecipe?: string
  resolution?: import("@/lib/compliance/types").FindingResolution
  status: TaskStatus
  sourceDocument?: string
  attachedEvidence?: TaskEvidenceAttachment
  evidenceKinds: TaskEvidenceKind[]
  validationStatus: TaskValidationStatus
  validationMessage?: string
  validationConfidence?: "high" | "medium" | "low"
  validationBasis?: "direct_signal" | "inferred_signal" | "operational_state"
  validatedAtLabel?: string
}

export type ScanInsight = {
  id: string
  label: string
  value: string
}
