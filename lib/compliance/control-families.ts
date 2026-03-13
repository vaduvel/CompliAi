import type { CompliancePrinciple } from "@/lib/compliance/constitution"
import type { TaskEvidenceKind, TaskValidationKind } from "@/lib/compliance/types"

export type ControlFamilyRef = {
  key: string
  label: string
  description: string
}

type ControlFamilyPolicy = {
  allowedEvidenceKinds: TaskEvidenceKind[]
  requireSameLawGroup: boolean
  requireSameValidationKind: boolean
  reuseLabel: string
}

export type ControlFamilyReuseDecision = {
  allowed: boolean
  reason: string
  mode: "blocked" | "review_required"
}

type ControlFamilyReuseInput = {
  familyKey: string
  sourceEvidenceKind: TaskEvidenceKind
  sourceLawReference?: string | null
  sourceValidationKind?: TaskValidationKind | null
  targetEvidenceKinds?: TaskEvidenceKind[]
  targetLawReference?: string | null
  targetValidationKind?: TaskValidationKind | null
}

type ControlFamilyInput = {
  validationKind?: TaskValidationKind | null
  lawReference?: string | null
  principles?: CompliancePrinciple[]
  title?: string | null
}

export function getControlFamily(input: ControlFamilyInput): ControlFamilyRef {
  const validationKind = input.validationKind ?? null
  const lawReference = (input.lawReference ?? "").toLowerCase()
  const title = (input.title ?? "").toLowerCase()
  const principles = new Set(input.principles ?? [])

  if (validationKind === "tracking-consent" || includesAny(`${lawReference} ${title}`, ["gdpr", "tracking", "cookie", "consim"])) {
    return {
      key: "privacy-tracking",
      label: "Privacy, tracking și consimțământ",
      description: "Controale pentru consimțământ explicit, tracking și păstrarea dovezii de alegere.",
    }
  }

  if (validationKind === "human-oversight" || principles.has("oversight") || includesAny(`${lawReference} ${title}`, ["art. 14", "oversight", "override", "review"])) {
    return {
      key: "human-oversight",
      label: "Human oversight și aprobare umană",
      description: "Controale pentru aprobare, override și trasabilitate umană în deciziile asistate de AI.",
    }
  }

  if (validationKind === "ai-transparency" || includesAny(`${lawReference} ${title}`, ["art. 52", "transparen", "assistant", "chatbot", "ai"])) {
    return {
      key: "ai-transparency",
      label: "Transparență AI și informare utilizator",
      description: "Controale pentru disclaimere AI, informare și claritatea interacțiunii automate.",
    }
  }

  if (validationKind === "retention-policy" || includesAny(`${lawReference} ${title}`, ["reten", "storage", "deletion", "ștergere", "anonimiz"])) {
    return {
      key: "retention-and-deletion",
      label: "Retenție, ștergere și anonimizare",
      description: "Controale pentru termene de retenție, ștergere și dovada ciclului de viață al datelor.",
    }
  }

  if (validationKind === "data-residency" || includesAny(`${lawReference} ${title}`, ["chapter v", "transfer", "residency", "reziden"])) {
    return {
      key: "data-residency",
      label: "Rezidență date și transfer internațional",
      description: "Controale pentru rezidența datelor, transferuri și justificarea traseului de procesare.",
    }
  }

  if (validationKind === "efactura-sync" || includesAny(`${lawReference} ${title}`, ["factura", "invoice", "anaf", "xml"])) {
    return {
      key: "efactura-operations",
      label: "Operațiuni e-Factura și dovadă operațională",
      description: "Controale pentru validare XML, transmitere, răspuns de sincronizare și arhivare.",
    }
  }

  return {
    key: "governance-baseline",
    label: "Guvernanță și baseline operațional",
    description: "Controale generale pentru documentare, revizie periodică și menținerea baseline-ului de conformitate.",
  }
}

export function canReuseEvidenceWithinFamily(
  input: ControlFamilyReuseInput
): ControlFamilyReuseDecision {
  const policy = getControlFamilyPolicy(input.familyKey)
  const targetEvidenceKinds = input.targetEvidenceKinds ?? []

  if (!policy.allowedEvidenceKinds.includes(input.sourceEvidenceKind)) {
    return {
      allowed: false,
      mode: "blocked",
      reason: `${policy.reuseLabel}: dovada sursă de tip ${formatEvidenceKind(
        input.sourceEvidenceKind
      )} nu este suficientă pentru această familie.`,
    }
  }

  if (targetEvidenceKinds.length > 0 && !targetEvidenceKinds.includes(input.sourceEvidenceKind)) {
    return {
      allowed: false,
      mode: "blocked",
      reason: `Controlul țintă cere ${targetEvidenceKinds
        .map(formatEvidenceKind)
        .join(" / ")}, iar dovada disponibilă este ${formatEvidenceKind(
        input.sourceEvidenceKind
      )}.`,
    }
  }

  if (policy.requireSameValidationKind) {
    const sourceKind = input.sourceValidationKind ?? null
    const targetKind = input.targetValidationKind ?? null

    if (sourceKind && targetKind && sourceKind !== targetKind) {
      return {
        allowed: false,
        mode: "blocked",
        reason: `${policy.reuseLabel}: familia permite reuse doar între controale cu aceeași validare tehnică.`,
      }
    }
  }

  if (policy.requireSameLawGroup) {
    const sourceLawGroup = normalizeLawReferenceGroup(input.sourceLawReference)
    const targetLawGroup = normalizeLawReferenceGroup(input.targetLawReference)

    if (sourceLawGroup && targetLawGroup && sourceLawGroup !== targetLawGroup) {
      return {
        allowed: false,
        mode: "blocked",
        reason: `${policy.reuseLabel}: dovada poate fi refolosită doar în interiorul aceluiași articol sau grup legal.`,
      }
    }
  }

  return {
    allowed: true,
    mode: "review_required",
    reason: `${policy.reuseLabel}: dovada este compatibilă cu acest control, dar rămâne necesar un rescan și review final.`,
  }
}

export function getControlFamilyReusePolicySummary(familyKey: string) {
  const policy = getControlFamilyPolicy(familyKey)
  const constraints = [
    policy.requireSameLawGroup ? "aceeași familie legală" : null,
    policy.requireSameValidationKind ? "aceeași validare tehnică" : null,
  ].filter(Boolean)

  const constraintsLabel =
    constraints.length > 0 ? `, cu reuse permis doar pentru ${constraints.join(" și ")}` : ""

  return `${policy.reuseLabel}: acceptă ${policy.allowedEvidenceKinds
    .map(formatEvidenceKind)
    .join(", ")}${constraintsLabel}.`
}

function getControlFamilyPolicy(familyKey: string): ControlFamilyPolicy {
  switch (familyKey) {
    case "privacy-tracking":
      return {
        allowedEvidenceKinds: ["screenshot", "log_export", "policy_text"],
        requireSameLawGroup: true,
        requireSameValidationKind: false,
        reuseLabel: "Reuse pentru tracking și consimțământ",
      }
    case "human-oversight":
      return {
        allowedEvidenceKinds: ["log_export", "policy_text", "screenshot", "yaml_evidence"],
        requireSameLawGroup: true,
        requireSameValidationKind: true,
        reuseLabel: "Reuse pentru human oversight",
      }
    case "ai-transparency":
      return {
        allowedEvidenceKinds: ["screenshot", "policy_text"],
        requireSameLawGroup: true,
        requireSameValidationKind: false,
        reuseLabel: "Reuse pentru transparență AI",
      }
    case "retention-and-deletion":
      return {
        allowedEvidenceKinds: ["policy_text", "log_export", "yaml_evidence"],
        requireSameLawGroup: true,
        requireSameValidationKind: false,
        reuseLabel: "Reuse pentru retenție și ștergere",
      }
    case "data-residency":
      return {
        allowedEvidenceKinds: ["yaml_evidence", "policy_text", "document_bundle"],
        requireSameLawGroup: true,
        requireSameValidationKind: true,
        reuseLabel: "Reuse pentru rezidență date",
      }
    case "efactura-operations":
      return {
        allowedEvidenceKinds: ["document_bundle", "log_export"],
        requireSameLawGroup: false,
        requireSameValidationKind: true,
        reuseLabel: "Reuse pentru operațiuni e-Factura",
      }
    default:
      return {
        allowedEvidenceKinds: ["policy_text", "yaml_evidence", "other"],
        requireSameLawGroup: false,
        requireSameValidationKind: false,
        reuseLabel: "Reuse pentru guvernanță generală",
      }
  }
}

function normalizeLawReferenceGroup(lawReference?: string | null) {
  const value = (lawReference ?? "").trim().toLowerCase()
  if (!value) return null
  const articleMatch = value.match(/art\.?\s*\d+/)
  if (articleMatch) return articleMatch[0].replace(/\s+/g, " ")
  if (value.includes("chapter v")) return "chapter-v"
  if (value.includes("gdpr")) return "gdpr"
  if (value.includes("eu ai act")) return "eu-ai-act"
  if (value.includes("anaf")) return "anaf"
  return value
}

function formatEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "screenshot"
  if (kind === "policy_text") return "text de politică"
  if (kind === "log_export") return "export de log"
  if (kind === "yaml_evidence") return "evidence YAML"
  if (kind === "document_bundle") return "bundle de documente"
  return "alt tip de dovadă"
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}
