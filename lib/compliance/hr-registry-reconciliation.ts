import {
  ORG_EMPLOYEE_COUNT_LABELS,
  type OrgEmployeeCount,
} from "@/lib/compliance/applicability"
import type { HrRegistryReconciliationRecord } from "@/lib/compliance/types"

export type HrRegistryReconciliationKey = string

export type HrRegistryReconciliationReadiness =
  | "empty"
  | "snapshot_only"
  | "checklist_only"
  | "ready"

export type HrRegistryReconciliationDerived = {
  rosterEntries: string[]
  registryChecklistItems: string[]
  rosterCount: number
  registryChecklistCount: number
  expectedEmployeeCountLabel: string | null
  rosterRangeStatus: "unknown" | "within_expected_range" | "outside_expected_range"
  readiness: HrRegistryReconciliationReadiness
  readinessLabel: string
  reconciliationHint: string
  handoffEvidenceNote: string
}

const DEFAULT_RECONCILIATION_KEY = "default"

export function getHrRegistryReconciliationKey(findingId?: string | null): HrRegistryReconciliationKey {
  const normalized = findingId?.trim()
  return normalized && normalized.length > 0 ? normalized : DEFAULT_RECONCILIATION_KEY
}

export function normalizeHrRegistryReconciliations(
  value: Record<string, HrRegistryReconciliationRecord> | undefined
): Record<string, HrRegistryReconciliationRecord> {
  if (!value || typeof value !== "object") return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      if (!entry || typeof entry !== "object") return []

      const normalizedKey = getHrRegistryReconciliationKey(
        typeof entry.findingId === "string" && entry.findingId.trim() ? entry.findingId : key
      )
      const rosterSnapshot =
        typeof entry.rosterSnapshot === "string" ? entry.rosterSnapshot.trim() : ""
      const registryChecklistText =
        typeof entry.registryChecklistText === "string" ? entry.registryChecklistText.trim() : ""
      const updatedAtISO =
        typeof entry.updatedAtISO === "string" && entry.updatedAtISO.trim()
          ? entry.updatedAtISO.trim()
          : ""

      if (!rosterSnapshot && !registryChecklistText) return []

      return [
        [
          normalizedKey,
          {
            findingId: normalizedKey,
            rosterSnapshot,
            registryChecklistText,
            updatedAtISO,
          },
        ],
      ]
    })
  )
}

export function buildHrRegistryReconciliationDerived(
  record: HrRegistryReconciliationRecord | null | undefined,
  options: {
    orgName: string
    employeeCount?: OrgEmployeeCount | null
  }
): HrRegistryReconciliationDerived {
  const rosterEntries = parseMultilineEntries(record?.rosterSnapshot)
  const registryChecklistItems = parseMultilineEntries(record?.registryChecklistText)
  const rosterCount = rosterEntries.length
  const registryChecklistCount = registryChecklistItems.length
  const readiness = getReadiness(rosterCount, registryChecklistCount)
  const expectedEmployeeCountLabel = options.employeeCount
    ? ORG_EMPLOYEE_COUNT_LABELS[options.employeeCount]
    : null
  const rosterMatchesExpectedRange = matchesEmployeeBucket(options.employeeCount ?? null, rosterCount)
  const rosterRangeStatus =
    rosterMatchesExpectedRange == null
      ? "unknown"
      : rosterMatchesExpectedRange
        ? "within_expected_range"
        : "outside_expected_range"

  const readinessLabel =
    readiness === "ready"
      ? "gata pentru handoff"
      : readiness === "snapshot_only"
        ? "lipsește checklistul REGES"
        : readiness === "checklist_only"
          ? "lipsește snapshotul intern"
          : "începe reconcilierea"

  const reconciliationHint = buildReconciliationHint({
    orgName: options.orgName,
    readiness,
    rosterCount,
    registryChecklistCount,
    expectedEmployeeCountLabel,
    rosterRangeStatus,
  })

  return {
    rosterEntries,
    registryChecklistItems,
    rosterCount,
    registryChecklistCount,
    expectedEmployeeCountLabel,
    rosterRangeStatus,
    readiness,
    readinessLabel,
    reconciliationHint,
    handoffEvidenceNote: buildHandoffEvidenceNote({
      orgName: options.orgName,
      readiness,
      rosterCount,
      registryChecklistCount,
      expectedEmployeeCountLabel,
      rosterRangeStatus,
    }),
  }
}

function parseMultilineEntries(value?: string | null): string[] {
  if (!value) return []

  return value
    .split(/\r?\n/)
    .map((entry) => entry.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
}

function getReadiness(
  rosterCount: number,
  registryChecklistCount: number
): HrRegistryReconciliationReadiness {
  if (rosterCount > 0 && registryChecklistCount > 0) return "ready"
  if (rosterCount > 0) return "snapshot_only"
  if (registryChecklistCount > 0) return "checklist_only"
  return "empty"
}

function matchesEmployeeBucket(
  employeeCount: OrgEmployeeCount | null,
  rosterCount: number
): boolean | null {
  if (!employeeCount || rosterCount === 0) return null

  switch (employeeCount) {
    case "1-9":
      return rosterCount >= 1 && rosterCount <= 9
    case "10-49":
      return rosterCount >= 10 && rosterCount <= 49
    case "50-249":
      return rosterCount >= 50 && rosterCount <= 249
    case "250+":
      return rosterCount >= 250
    default:
      return null
  }
}

function buildReconciliationHint(input: {
  orgName: string
  readiness: HrRegistryReconciliationReadiness
  rosterCount: number
  registryChecklistCount: number
  expectedEmployeeCountLabel: string | null
  rosterRangeStatus: HrRegistryReconciliationDerived["rosterRangeStatus"]
}) {
  if (input.readiness === "empty") {
    return "Adaugă snapshotul intern al angajaților / contractelor și punctele de verificat în REGES. Asta transformă handoff-ul într-o urmă clară, nu doar într-un brief generic."
  }

  if (input.readiness === "snapshot_only") {
    return `Ai listat ${input.rosterCount} intrări în snapshotul intern. Mai notează verificările concrete din REGES ca să știm ce trebuie să se întoarcă în cockpit.`
  }

  if (input.readiness === "checklist_only") {
    return `Ai listat ${input.registryChecklistCount} puncte de verificat în REGES. Mai adaugă snapshotul intern al angajaților / contractelor ca să știm ce se reconciliază efectiv.`
  }

  if (input.rosterRangeStatus === "outside_expected_range" && input.expectedEmployeeCountLabel) {
    return `Snapshotul intern nu pare să se alinieze cu profilul firmei (${input.expectedEmployeeCountLabel}). Verifică dacă lista include toate contractele active sau dacă profilul trebuie actualizat înainte de handoff.`
  }

  return `Reconcilierea REGES pentru ${input.orgName} este pregătită: ai un snapshot intern și ${input.registryChecklistCount} puncte concrete pentru registrul real.`
}

function buildHandoffEvidenceNote(input: {
  orgName: string
  readiness: HrRegistryReconciliationReadiness
  rosterCount: number
  registryChecklistCount: number
  expectedEmployeeCountLabel: string | null
  rosterRangeStatus: HrRegistryReconciliationDerived["rosterRangeStatus"]
}) {
  const orgName = input.orgName.trim() || "Organizația"
  const expectedLabel = input.expectedEmployeeCountLabel
    ? ` Profilul firmei indică ${input.expectedEmployeeCountLabel}.`
    : ""
  const rangeNote =
    input.rosterRangeStatus === "outside_expected_range"
      ? " Snapshotul intern nu pare aliniat cu profilul curent și trebuie reconciliat explicit înainte de handoff."
      : ""

  if (input.readiness === "ready") {
    return `CompliAI a pregătit reconcilierea REGES pentru ${orgName}: snapshotul intern include ${input.rosterCount} intrări, iar checklistul pentru registrul real are ${input.registryChecklistCount} puncte de verificat.${expectedLabel}${rangeNote} Următorul pas este verificarea în REGES și întoarcerea cu exportul sau confirmarea corecției.`
  }

  if (input.readiness === "snapshot_only") {
    return `CompliAI a salvat snapshotul intern pentru REGES la ${orgName}: ${input.rosterCount} intrări sunt pregătite pentru reconciliere.${expectedLabel} Mai trebuie completat checklistul de verificare din registrul real înainte de handoff.`
  }

  if (input.readiness === "checklist_only") {
    return `CompliAI a salvat checklistul REGES pentru ${orgName}: ${input.registryChecklistCount} puncte sunt pregătite pentru verificare.${expectedLabel} Mai trebuie adăugat snapshotul intern al contractelor / angajaților înainte de handoff.`
  }

  return `CompliAI a deschis reconcilierea REGES pentru ${orgName}. Următorul pas este completarea snapshotului intern și a checklistului pentru registrul real înainte de handoff.`
}
