import type { CompliScanSystem } from "@/lib/compliscan/schema"
import type { ComplianceSeverity } from "@/lib/compliance/constitution"
import type {
  ComplianceDriftChange,
  ComplianceDriftEscalationTier,
  ComplianceDriftRecord,
  ComplianceDriftSettings,
} from "@/lib/compliance/types"

type DriftPolicyDefinition = {
  defaultSeverity: ComplianceSeverity
  lawReference: string
  ownerSuggestion: string
  impactSummary: string
  nextAction: string
  evidenceRequired: string
  escalationTier: ComplianceDriftEscalationTier
  escalationSlaHours: number
  blocksAudit: boolean
  blocksBaseline: boolean
  requiresHumanApproval: boolean
}

type DriftPolicyInput = {
  change: ComplianceDriftChange
  type: ComplianceDriftRecord["type"]
  system?: Partial<CompliScanSystem>
  before?: Record<string, string | number | boolean | null>
  after?: Record<string, string | number | boolean | null>
  findingSeverity?: ComplianceSeverity | null
  settings?: ComplianceDriftSettings
}

export type DriftPolicyResult = DriftPolicyDefinition & {
  severity: ComplianceSeverity
  severityReason: string
  escalationDueAtISO: string | null
}

const DRIFT_POLICY: Record<ComplianceDriftChange, DriftPolicyDefinition> = {
  provider_added: {
    defaultSeverity: "medium",
    lawReference: "Control operational / inventory review",
    ownerSuggestion: "Product + Tech Lead",
    impactSummary:
      "Apariția unui sistem sau provider nou schimbă suprafața de control și poate cere inventariere, owner, review și dovezi noi.",
    nextAction:
      "Confirmi noul sistem în Control, verifici scopul și clasa de risc, apoi atașezi dovada de onboarding tehnic.",
    evidenceRequired:
      "Manifest / YAML actualizat, owner confirmat și notă de review pentru noul provider sau noul sistem.",
    escalationTier: "watch",
    escalationSlaHours: 72,
    blocksAudit: false,
    blocksBaseline: true,
    requiresHumanApproval: false,
  },
  provider_changed: {
    defaultSeverity: "medium",
    lawReference: "Control operational / change review",
    ownerSuggestion: "Product + Tech Lead",
    impactSummary:
      "Schimbarea providerului poate modifica traseul datelor, capabilitățile și obligațiile de control deja aprobate.",
    nextAction:
      "Compari providerul nou cu baseline-ul aprobat, actualizezi documentația tehnică și rulezi rescan după review uman.",
    evidenceRequired:
      "Notă de schimbare, configurație nouă și confirmare internă că obligațiile de control rămân valabile.",
    escalationTier: "urgent",
    escalationSlaHours: 48,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: false,
  },
  model_changed: {
    defaultSeverity: "medium",
    lawReference: "Control operational / change review",
    ownerSuggestion: "Product + Tech Lead",
    impactSummary:
      "Schimbarea modelului poate influența performanța, riscul, datele folosite și nivelul de supraveghere necesar.",
    nextAction:
      "Documentezi modelul nou, confirmi dacă scopul și clasa de risc rămân corecte și refaci review-ul operațional.",
    evidenceRequired:
      "Config actualizat, notă de comparație între modelul vechi și nou și dovada review-ului intern.",
    escalationTier: "urgent",
    escalationSlaHours: 48,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: false,
  },
  framework_added: {
    defaultSeverity: "low",
    lawReference: "Control operational / technical change log",
    ownerSuggestion: "Tech Lead",
    impactSummary:
      "Un framework nou nu înseamnă automat risc major, dar poate schimba orchestration-ul și suprafața de audit.",
    nextAction:
      "Verifici dacă noul framework introduce capabilități sau date noi și actualizezi sursa tehnică declarată dacă este cazul.",
    evidenceRequired:
      "Manifest actualizat și notă scurtă despre rolul framework-ului nou în fluxul AI.",
    escalationTier: "watch",
    escalationSlaHours: 72,
    blocksAudit: false,
    blocksBaseline: false,
    requiresHumanApproval: false,
  },
  human_review_removed: {
    defaultSeverity: "high",
    lawReference: "AI Act Art. 14",
    ownerSuggestion: "DPO + Product + Tech Lead",
    impactSummary:
      "Lipsa review-ului uman poate transforma o schimbare tehnică într-o problemă directă de conformitate și de control operațional.",
    nextAction:
      "Reintroduci un pas real de aprobare sau override uman înainte de a considera sistemul din nou conform.",
    evidenceRequired:
      "Workflow aprobat, log de validare umană și actualizare de procedură sau configurare care arată reactivarea controlului.",
    escalationTier: "critical",
    escalationSlaHours: 8,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: true,
  },
  personal_data_detected: {
    defaultSeverity: "high",
    lawReference: "GDPR Art. 5 / Art. 6",
    ownerSuggestion: "DPO + Security + Backend",
    impactSummary:
      "Datele personale noi schimbă imediat baza legală, minimizarea, retenția și evaluarea impactului pentru sistemul afectat.",
    nextAction:
      "Clarifici ce date personale intră în flux, actualizezi baza legală și confirmi măsurile de minimizare și retenție.",
    evidenceRequired:
      "Evaluare internă de date personale, policy actualizat și dovada aprobării review-ului de conformitate.",
    escalationTier: "critical",
    escalationSlaHours: 24,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: true,
  },
  risk_class_changed: {
    defaultSeverity: "medium",
    lawReference: "AI Act Art. 9",
    ownerSuggestion: "Compliance Officer + Product",
    impactSummary:
      "Schimbarea clasei de risc poate activa controale noi și poate face vechiul baseline insuficient pentru justificare sau audit.",
    nextAction:
      "Reevaluezi sistemul, actualizezi inventarul AI și reconfirmi controalele necesare înainte de a valida un baseline nou.",
    evidenceRequired:
      "Revizie de risc, owner aprobat și snapshot nou validat după review uman.",
    escalationTier: "critical",
    escalationSlaHours: 24,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: true,
  },
  purpose_changed: {
    defaultSeverity: "medium",
    lawReference: "AI Act / GDPR purpose limitation review",
    ownerSuggestion: "Product + Compliance Officer",
    impactSummary:
      "Schimbarea scopului declarat poate muta sistemul într-un context de utilizare diferit, cu alte obligații și alte dovezi necesare.",
    nextAction:
      "Confirmi noul scop, verifici dacă se schimbă clasa de risc sau datele folosite și actualizezi documentația aferentă.",
    evidenceRequired:
      "Descriere de scop actualizată, owner confirmat și dovada că noul scop a fost revizuit legal și operațional.",
    escalationTier: "urgent",
    escalationSlaHours: 48,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: false,
  },
  data_residency_changed: {
    defaultSeverity: "high",
    lawReference: "GDPR Chapter V",
    ownerSuggestion: "DPO + Security + Backend",
    impactSummary:
      "Rezidența datelor afectează imediat obligațiile de transfer, control contractual și dovezile cerute pentru audit.",
    nextAction:
      "Verifici noua regiune de procesare, documentezi transferul și reconfirmi dacă baseline-ul actual mai rămâne valid.",
    evidenceRequired:
      "Configuratie tehnică, dovada rezidenței datelor și documentația de transfer sau a regiunii aprobate.",
    escalationTier: "critical",
    escalationSlaHours: 24,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: true,
  },
  provider_removed: {
    defaultSeverity: "low",
    lawReference: "Control operational / inventory maintenance",
    ownerSuggestion: "Product + Tech Lead",
    impactSummary:
      "Dispariția unui sistem din snapshot poate fi benignă, dar trebuie explicată pentru a nu lăsa goluri în inventar și audit trail.",
    nextAction:
      "Confirmi dacă sistemul a fost retras intenționat și actualizezi inventarul sau baseline-ul în consecință.",
    evidenceRequired:
      "Notă de dezafectare, snapshot actualizat sau confirmare că sistemul nu mai face parte din scope.",
    escalationTier: "watch",
    escalationSlaHours: 72,
    blocksAudit: false,
    blocksBaseline: false,
    requiresHumanApproval: false,
  },
  tracking_detected: {
    defaultSeverity: "medium",
    lawReference: "GDPR Art. 6 / Art. 7",
    ownerSuggestion: "Marketing Ops + Frontend",
    impactSummary:
      "Semnalele noi de tracking pot însemna scripturi active fără consimțământ clar și risc imediat pentru baza legală.",
    nextAction:
      "Verifici bannerul de consimțământ, blochezi scripturile non-esențiale până la accept și rulezi rescan pe sursa afectată.",
    evidenceRequired:
      "Capturi CMP, log de consimțământ și test tehnic care arată că scripturile pornesc doar după accept.",
    escalationTier: "urgent",
    escalationSlaHours: 24,
    blocksAudit: true,
    blocksBaseline: false,
    requiresHumanApproval: false,
  },
  high_risk_signal_detected: {
    defaultSeverity: "high",
    lawReference: "AI Act Art. 9 / Art. 14",
    ownerSuggestion: "DPO + Product + Tech Lead",
    impactSummary:
      "Un semnal nou de high-risk poate schimba imediat cerințele de oversight, documentare și validare umană.",
    nextAction:
      "Revizuiești finding-ul nou, confirmi impactul asupra drepturilor și deschizi sau actualizezi controlul structural necesar.",
    evidenceRequired:
      "Evaluare de risc, workflow de review uman și documentație actualizată pentru noul context AI Act.",
    escalationTier: "critical",
    escalationSlaHours: 12,
    blocksAudit: true,
    blocksBaseline: true,
    requiresHumanApproval: true,
  },
  invoice_flow_signal_detected: {
    defaultSeverity: "low",
    lawReference: "RO e-Factura / flux ANAF",
    ownerSuggestion: "FinOps + Backend",
    impactSummary:
      "Un nou semnal de flux e-Factura poate indica schimbare operațională care trebuie documentată înainte de a afecta raportarea sau auditul.",
    nextAction:
      "Verifici fluxul tehnic, rulezi validarea XML și documentezi dacă schimbarea cere control operațional suplimentar.",
    evidenceRequired:
      "XML validat, răspuns de transmitere și runbook actualizat dacă fluxul s-a schimbat.",
    escalationTier: "watch",
    escalationSlaHours: 72,
    blocksAudit: false,
    blocksBaseline: false,
    requiresHumanApproval: false,
  },
}

export function assessDriftPolicy(input: DriftPolicyInput): DriftPolicyResult {
  const base = DRIFT_POLICY[input.change] ?? {
    defaultSeverity: "medium",
    lawReference: "Control operational / review",
    ownerSuggestion: "Product + Tech Lead",
    impactSummary:
      "A fost detectată o schimbare față de baseline care trebuie justificată operațional și susținută prin dovadă actualizată.",
    nextAction:
      "Revizuiești schimbarea, actualizezi sursa declarată și rulezi rescan înainte de a considera controlul închis.",
    evidenceRequired:
      "Notă de schimbare, sursă actualizată și dovadă de review intern asupra noii stări.",
    escalationTier: "watch",
    escalationSlaHours: 72,
    blocksAudit: false,
    blocksBaseline: false,
    requiresHumanApproval: false,
  }

  const severity = resolveDriftSeverity(input, base.defaultSeverity)
  const effectiveEscalation = deriveEscalation(base, severity)

  return {
    ...base,
    severity,
    severityReason: buildSeverityReason(input, severity, base.defaultSeverity),
    escalationTier: effectiveEscalation.escalationTier,
    escalationSlaHours: effectiveEscalation.escalationSlaHours,
    blocksAudit: effectiveEscalation.blocksAudit,
    blocksBaseline: effectiveEscalation.blocksBaseline,
    requiresHumanApproval: effectiveEscalation.requiresHumanApproval,
    escalationDueAtISO: buildEscalationDueAtISO(input.after?.detectedAtISO, effectiveEscalation.escalationSlaHours),
  }
}

export function getDriftPolicyFromRecord(drift: Pick<
  ComplianceDriftRecord,
  | "change"
  | "type"
  | "severity"
  | "impactSummary"
  | "nextAction"
  | "evidenceRequired"
  | "lawReference"
  | "severityReason"
  | "escalationTier"
  | "escalationSlaHours"
  | "escalationDueAtISO"
  | "blocksAudit"
  | "blocksBaseline"
  | "requiresHumanApproval"
  | "before"
  | "after"
>) {
  const policy = assessDriftPolicy({
    change: drift.change,
    type: drift.type,
    before: drift.before,
    after: drift.after,
  })

  return {
    severity: drift.severity ?? policy.severity,
    impactSummary: drift.impactSummary ?? policy.impactSummary,
    nextAction: drift.nextAction ?? policy.nextAction,
    evidenceRequired: drift.evidenceRequired ?? policy.evidenceRequired,
    lawReference: drift.lawReference ?? policy.lawReference,
    severityReason: drift.severityReason ?? policy.severityReason,
    ownerSuggestion: policy.ownerSuggestion,
    escalationTier: drift.escalationTier ?? policy.escalationTier,
    escalationSlaHours: drift.escalationSlaHours ?? policy.escalationSlaHours,
    escalationDueAtISO: drift.escalationDueAtISO ?? policy.escalationDueAtISO,
    blocksAudit: drift.blocksAudit ?? policy.blocksAudit,
    blocksBaseline: drift.blocksBaseline ?? policy.blocksBaseline,
    requiresHumanApproval: drift.requiresHumanApproval ?? policy.requiresHumanApproval,
  }
}

export function formatDriftTypeLabel(type: ComplianceDriftRecord["type"]) {
  return type === "operational_drift" ? "Operational drift" : "Compliance drift"
}

export function formatDriftEscalationTier(value: ComplianceDriftEscalationTier) {
  if (value === "critical") return "escalare critică"
  if (value === "urgent") return "escalare urgentă"
  return "watch"
}

export function formatDriftEscalationDeadline(value?: string | null) {
  if (!value) return "fără termen explicit"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "fără termen explicit"

  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function resolveDriftSeverity(
  input: DriftPolicyInput,
  fallback: ComplianceSeverity
): ComplianceSeverity {
  const override = input.settings?.severityOverrides?.[input.change]
  if (override) return override

  const system = input.system
  const highRisk =
    system?.riskClass === "high" ||
    input.after?.riskClass === "high" ||
    system?.automatedDecisions ||
    system?.impactsRights
  const personalData =
    system?.personalDataUsed || input.after?.personalDataUsed === true

  if (input.change === "human_review_removed") {
    return highRisk ? "critical" : "high"
  }

  if (input.change === "personal_data_detected") {
    return highRisk ? "critical" : "high"
  }

  if (input.change === "risk_class_changed") {
    return input.after?.riskClass === "high" ? "critical" : "high"
  }

  if (input.change === "data_residency_changed") {
    const value = String(input.after?.dataResidency ?? "")
    if (isOutsideEu(value)) return highRisk || personalData ? "critical" : "high"
    return "medium"
  }

  if (input.change === "provider_changed" || input.change === "model_changed") {
    return highRisk || personalData ? "high" : "medium"
  }

  if (input.change === "provider_added") {
    return system?.riskClass === "high" ? "high" : "medium"
  }

  if (input.change === "framework_added") {
    return highRisk || personalData ? "medium" : "low"
  }

  if (input.change === "purpose_changed") {
    return highRisk ? "high" : "medium"
  }

  if (input.change === "provider_removed") {
    return system?.riskClass === "high" ? "medium" : "low"
  }

  if (input.change === "tracking_detected") {
    return input.findingSeverity === "critical" || input.findingSeverity === "high"
      ? "high"
      : "medium"
  }

  if (input.change === "high_risk_signal_detected") {
    return input.findingSeverity === "critical" ? "critical" : "high"
  }

  if (input.change === "invoice_flow_signal_detected") {
    return input.findingSeverity === "high" || input.findingSeverity === "medium"
      ? "medium"
      : "low"
  }

  return fallback
}

function deriveEscalation(
  base: DriftPolicyDefinition,
  severity: ComplianceSeverity
) {
  if (severity === "critical") {
    return {
      escalationTier: "critical" as const,
      escalationSlaHours: Math.min(base.escalationSlaHours, 12),
      blocksAudit: true,
      blocksBaseline: true,
      requiresHumanApproval: true,
    }
  }

  if (severity === "high") {
    return {
      escalationTier: base.escalationTier === "watch" ? "urgent" as const : base.escalationTier,
      escalationSlaHours: Math.min(base.escalationSlaHours, 24),
      blocksAudit: true,
      blocksBaseline: base.blocksBaseline,
      requiresHumanApproval: base.requiresHumanApproval,
    }
  }

  return {
    escalationTier: base.escalationTier,
    escalationSlaHours: base.escalationSlaHours,
    blocksAudit: base.blocksAudit,
    blocksBaseline: base.blocksBaseline,
    requiresHumanApproval: base.requiresHumanApproval,
  }
}

function buildEscalationDueAtISO(
  detectedAtISO: unknown,
  escalationSlaHours: number
) {
  const baseDate =
    typeof detectedAtISO === "string" && detectedAtISO
      ? new Date(detectedAtISO)
      : new Date()
  return new Date(baseDate.getTime() + escalationSlaHours * 60 * 60 * 1000).toISOString()
}

function buildSeverityReason(
  input: DriftPolicyInput,
  severity: ComplianceSeverity,
  fallback: ComplianceSeverity
) {
  if (severity !== fallback) {
    if (input.change === "human_review_removed") {
      return "Severitatea a fost ridicată deoarece review-ul uman a dispărut într-un context cu impact direct asupra deciziilor sau drepturilor."
    }
    if (input.change === "personal_data_detected") {
      return "Severitatea a fost ridicată deoarece au fost detectate date personale într-un flux cu impact operațional sau de risc mai mare."
    }
    if (input.change === "data_residency_changed") {
      return "Severitatea a fost ridicată deoarece noua rezidență a datelor poate implica transfer în afara UE sau schimbare materială de control."
    }
    if (input.change === "risk_class_changed") {
      return "Severitatea a fost ridicată deoarece sistemul a ajuns într-o clasă de risc care cere controale suplimentare."
    }
    return "Severitatea a fost ajustată peste valoarea implicită pe baza contextului de risc detectat în snapshot."
  }

  return "Severitatea folosește politica implicită pentru acest tip de drift și va fi revizuită dacă apar semnale suplimentare."
}

function isOutsideEu(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return !["eu", "europe", "eea"].some((needle) => normalized.includes(needle))
}
