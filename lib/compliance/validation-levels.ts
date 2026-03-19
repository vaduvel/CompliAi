// Validation Levels — "capture more legal prep work" strategy.
// Derives the required validation level for a finding or task based on existing data.
//
// Level 1 = Auto-validat: verificabil automat (document exista, camp completat, dovada atasata)
// Level 2 = Confirmare interna: necesita confirmare interna (admin/contabil)
// Level 3 = Validare specialist: necesita review de specialitate (jurist/DPO/auditor)

import type { ScanFinding, ValidationLevel } from "@/lib/compliance/types"

// ── Inference from ScanFinding ───────────────────────────────────────────────

export function inferValidationLevel(finding: ScanFinding): ValidationLevel {
  // Level 3: specialist required
  if (isSpecialistRequired(finding)) return 3

  // Level 2: internal confirmation
  if (isBusinessConfirmationRequired(finding)) return 2

  // Level 1: automatically verifiable
  return 1
}

function isSpecialistRequired(finding: ScanFinding): boolean {
  // High severity + high risk always needs specialist
  if (finding.severity === "critical") return true
  if (finding.severity === "high" && finding.risk === "high") return true

  // Legal mappings with multiple articles suggest complexity
  if (finding.legalMappings && finding.legalMappings.length >= 2) return true

  // Resolution mentions human step that implies legal/specialist
  const humanStep = finding.resolution?.humanStep?.toLowerCase() ?? ""
  if (
    humanStep.includes("jurist") ||
    humanStep.includes("avocat") ||
    humanStep.includes("dpo") ||
    humanStep.includes("specialist") ||
    humanStep.includes("audit")
  ) {
    return true
  }

  // Category-specific: NIS2 supply-chain and access-control often need specialist
  if (finding.category === "NIS2") {
    const title = finding.title.toLowerCase()
    if (
      title.includes("transfer") ||
      title.includes("incident") ||
      title.includes("raportare") ||
      title.includes("continuitate")
    ) {
      return true
    }
  }

  // GDPR international transfer or high-risk processing
  if (finding.category === "GDPR") {
    const combined = `${finding.title} ${finding.detail}`.toLowerCase()
    if (
      combined.includes("transfer international") ||
      combined.includes("decizie automat") ||
      combined.includes("profilare") ||
      combined.includes("impact ridicat")
    ) {
      return true
    }
  }

  return false
}

function isBusinessConfirmationRequired(finding: ScanFinding): boolean {
  // Medium severity generally needs business confirmation
  if (finding.severity === "medium") return true
  if (finding.severity === "high" && finding.risk === "low") return true

  // E-Factura findings need operational confirmation
  if (finding.category === "E_FACTURA") return true

  // Resolution has humanStep but not specialist-level
  if (finding.resolution?.humanStep) return true

  // Vendor-related findings need business confirmation
  const title = finding.title.toLowerCase()
  if (
    title.includes("furnizor") ||
    title.includes("vendor") ||
    title.includes("dpa") ||
    title.includes("procesator")
  ) {
    return true
  }

  return false
}

// ── Inference from remediation tasks (fallback when full finding not available) ─

type ValidationTaskInput = {
  priority: "P1" | "P2" | "P3"
  severity: ScanFinding["severity"]
  remediationMode: "rapid" | "structural"
}

export function inferTaskValidationLevel(
  task: ValidationTaskInput,
  relatedFindings: ScanFinding[] = []
): ValidationLevel {
  // If the task is derived from findings, preserve the highest required level.
  const relatedLevel = relatedFindings.reduce<ValidationLevel>(
    (highest, finding) => Math.max(highest, inferValidationLevel(finding)) as ValidationLevel,
    1
  )
  if (relatedLevel > 1) return relatedLevel

  // P1 critical → specialist
  if (task.priority === "P1" && task.severity === "critical") return 3
  if (task.priority === "P1" && task.severity === "high") return 3

  // Structural remediation generally needs at least business confirmation
  if (task.remediationMode === "structural") return 2

  // P2 → business confirmation
  if (task.priority === "P2") return 2

  // P3 rapid → auto-close
  return 1
}

// ── Labels & metadata ────────────────────────────────────────────────────────

export type ValidationLevelMeta = {
  level: ValidationLevel
  label: string
  shortLabel: string
  description: string
  escalationCopy: string
}

const LEVEL_META: Record<ValidationLevel, Omit<ValidationLevelMeta, "level">> = {
  1: {
    label: "Închidere automată",
    shortLabel: "Auto-validat",
    description: "Verificabil automat — document existent, câmp completat sau dovadă atașată.",
    escalationCopy:
      "Acest caz poate fi închis intern. Verifică că dovada este atașată și confirmă.",
  },
  2: {
    label: "Confirmare internă",
    shortLabel: "Confirmare internă",
    description: "Necesită confirmare de la administrator, contabil sau responsabil intern.",
    escalationCopy:
      "CompliAI a pregătit cazul. Un responsabil intern trebuie să confirme datele și să valideze acțiunea recomandată.",
  },
  3: {
    label: "Validare de specialitate",
    shortLabel: "Validare specialist",
    description: "Necesită review de specialitate — jurist, DPO sau auditor extern.",
    escalationCopy:
      "Cazul este pregătit pentru validare de specialitate. Documentele, red flags și recomandările sunt deja organizate. Specialistul intervine doar pentru validare finală.",
  },
}

export function getValidationLevelMeta(level: ValidationLevel): ValidationLevelMeta {
  return { level, ...LEVEL_META[level] }
}

export function getValidationLevelLabel(level: ValidationLevel): string {
  return LEVEL_META[level].shortLabel
}

export function getValidationLevelEscalationCopy(level: ValidationLevel): string {
  return LEVEL_META[level].escalationCopy
}
