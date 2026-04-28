import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { inferValidationKindFromFinding } from "@/lib/compliance/remediation-recipes"
import { getTaskResolutionTargets } from "@/lib/compliance/task-resolution"
import { COMPLIANCE_RULE_LIBRARY } from "@/lib/compliance/rule-library"
import type {
  ComplianceAlert,
  ComplianceState,
  PersistedTaskStatus,
  ScanFinding,
  TaskValidationKind,
  TaskValidationStatus,
} from "@/lib/compliance/types"

export type TaskValidationResult = {
  status: TaskValidationStatus
  nextStatus: PersistedTaskStatus
  message: string
  confidence: "high" | "medium" | "low"
  basis: "direct_signal" | "inferred_signal" | "operational_state"
  checkedSource?: string
}

export function validateTaskAgainstState(
  state: ComplianceState,
  taskId: string,
  attachedEvidence?: string
): TaskValidationResult {
  const remediation = taskId.startsWith("rem-")
    ? buildRemediationPlan(state).find((item) => `rem-${item.id}` === taskId)
    : undefined
  const resolution = getTaskResolutionTargets(state, taskId)
  const relatedFindings = state.findings.filter((finding) => resolution.findingIds.includes(finding.id))
  const relatedAlerts = state.alerts.filter((alert) => resolution.alertIds.includes(alert.id))
  const primaryFinding = relatedFindings[0]
  const validationKind =
    remediation?.validationKind ?? inferValidationKindFromFinding(primaryFinding)
  const latestSource = getLatestRelevantSourceText(state, remediation?.sourceDocument, primaryFinding)
  const currentTaskState = state.taskState[taskId]
  const openRelatedAlerts = relatedAlerts.some((alert) => alert.open)
  const activeRelatedFindings = relatedFindings.filter((finding) => !isResolvedFindingStatus(finding.findingStatus))
  const openIssueStillPresent = activeRelatedFindings.length > 0 || openRelatedAlerts
  const hasEvidence = Boolean(attachedEvidence?.trim())
  const primaryRule = primaryFinding?.provenance?.ruleId
    ? COMPLIANCE_RULE_LIBRARY.find((rule) => rule.ruleId === primaryFinding.provenance?.ruleId)
    : undefined
  const validationMeta = deriveValidationMeta(primaryFinding, validationKind)

  if (!hasEvidence && validationKind !== "efactura-sync") {
    return {
      status: "needs_review",
      nextStatus: "todo",
      message: primaryRule
        ? `Atașează dovada cerută pentru ${primaryRule.legalReference} înainte de Mark as fixed & rescan.`
        : "Atașează dovada cerută înainte de Mark as fixed & rescan.",
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
      checkedSource: latestSource?.documentName,
    }
  }

  if (
    hasEvidence &&
    currentTaskState?.status === "done" &&
    relatedFindings.length > 0 &&
    !openRelatedAlerts
  ) {
    return {
      status: "passed",
      nextStatus: "done",
      message: buildValidationMessage({
        message:
          "Task-ul este închis operațional, are dovadă atașată și nu mai există alerte active pentru finding-ul asociat.",
        status: "passed",
        basis: validationMeta.basis,
      }),
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
      checkedSource: latestSource?.documentName,
    }
  }

  if (!latestSource && validationKind !== "efactura-sync") {
    return {
      status: "needs_review",
      nextStatus: "todo",
      message:
        "Nu există încă o sursă rescannată pentru acest task. Reîncarcă documentul, manifestul sau compliscan.yaml și rulează din nou analiza.",
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
    }
  }

  const signalCheck = runSignalValidation({
    state,
    validationKind,
    sourceText: latestSource?.text ?? "",
    relatedAlerts,
    primaryFinding,
    primaryRule,
  })

  if (!signalCheck.pass && signalCheck.status === "needs_review") {
    return {
      status: "needs_review",
      nextStatus: "todo",
      message: buildValidationMessage({
        message: signalCheck.message,
        status: "needs_review",
        basis: validationMeta.basis,
      }),
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
      checkedSource: latestSource?.documentName,
    }
  }

  if (signalCheck.pass && hasEvidence) {
    return {
      status: "passed",
      nextStatus: "done",
      message: buildValidationMessage({
        message:
          signalCheck.message ||
          "Semnalul de risc nu mai apare în sursa curentă sau există indicatori suficienți de remediere și dovada a fost atașată.",
        status: "passed",
        basis: validationMeta.basis,
      }),
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
      checkedSource: latestSource?.documentName,
    }
  }

  if (!signalCheck.pass && openIssueStillPresent) {
    return {
      status: "failed",
      nextStatus: "todo",
      message: buildValidationMessage({
        message: signalCheck.message,
        status: "failed",
        basis: validationMeta.basis,
      }),
      confidence: validationMeta.confidence,
      basis: validationMeta.basis,
      checkedSource: latestSource?.documentName,
    }
  }

  return {
    status: hasEvidence ? "passed" : "needs_review",
    nextStatus: hasEvidence ? "done" : "todo",
    message: buildValidationMessage({
      message: hasEvidence
        ? "Task-ul are dovadă și nu mai există semnale deschise pe sursa curentă."
        : "Task-ul pare remediat, dar încă lipsește dovada pentru audit.",
      status: hasEvidence ? "passed" : "needs_review",
      basis: validationMeta.basis,
    }),
    confidence: validationMeta.confidence,
    basis: validationMeta.basis,
    checkedSource: latestSource?.documentName,
  }
}

function deriveValidationMeta(
  finding: ScanFinding | undefined,
  validationKind: TaskValidationKind
): {
  confidence: "high" | "medium" | "low"
  basis: "direct_signal" | "inferred_signal" | "operational_state"
} {
  if (validationKind === "efactura-sync") {
    return {
      confidence: "medium",
      basis: "operational_state",
    }
  }

  if (finding?.provenance?.verdictBasis === "direct_signal") {
    return {
      confidence: finding.verdictConfidence || "high",
      basis: "direct_signal",
    }
  }

  if (finding?.provenance?.verdictBasis === "inferred_signal") {
    return {
      confidence: finding.verdictConfidence || "medium",
      basis: "inferred_signal",
    }
  }

  return {
    confidence: finding?.verdictConfidence || "low",
    basis: "operational_state",
  }
}

function isResolvedFindingStatus(status: ScanFinding["findingStatus"] | undefined) {
  return status === "resolved" || status === "under_monitoring" || status === "dismissed"
}

function buildValidationContextSuffix(
  basis: "direct_signal" | "inferred_signal" | "operational_state"
) {
  if (basis === "direct_signal") {
    return "Verificarea curentă se bazează pe un semnal direct din sursa rescannată."
  }
  if (basis === "inferred_signal") {
    return "Verificarea curentă se bazează pe un semnal inferat din manifest sau configurare și poate cere confirmare umană suplimentară."
  }
  return "Verificarea curentă se bazează pe starea operațională disponibilă."
}

function buildValidationMessage({
  message,
  status,
  basis,
}: {
  message: string
  status: TaskValidationStatus
  basis: "direct_signal" | "inferred_signal" | "operational_state"
}) {
  const prefix = buildValidationMessagePrefix(status, basis)
  const suffix = buildValidationContextSuffix(basis)
  return `${prefix} ${message} ${suffix}`.trim()
}

function buildValidationMessagePrefix(
  status: TaskValidationStatus,
  basis: "direct_signal" | "inferred_signal" | "operational_state"
) {
  if (status === "passed") {
    if (basis === "direct_signal") return "Confirmare puternică:"
    if (basis === "inferred_signal") return "Confirmare parțială:"
    return "Confirmare operațională:"
  }

  if (status === "failed") {
    if (basis === "direct_signal") return "Semnal direct încă prezent:"
    if (basis === "inferred_signal") return "Semnal inferat încă neclar:"
    return "Control operațional insuficient:"
  }

  if (basis === "direct_signal") return "Necesită verificare suplimentară:"
  if (basis === "inferred_signal") return "Necesită confirmare umană:"
  return "Necesită review operațional:"
}

function runSignalValidation({
  state,
  validationKind,
  sourceText,
  relatedAlerts,
  primaryFinding,
  primaryRule,
}: {
  state: ComplianceState
  validationKind: TaskValidationKind
  sourceText: string
  relatedAlerts: ComplianceAlert[]
  primaryFinding?: ScanFinding
  primaryRule?: (typeof COMPLIANCE_RULE_LIBRARY)[number]
}): {
  pass: boolean
  status?: TaskValidationStatus
  message: string
} {
  const lower = sourceText.toLowerCase()
  const findingKeyword = primaryFinding?.provenance?.matchedKeyword?.toLowerCase()
  const ruleLabel = primaryRule?.legalReference || primaryFinding?.legalReference

  switch (validationKind) {
    case "human-oversight": {
      const oversightSignals = [
        "validare umana",
        "revizuire umana",
        "operator uman",
        "human oversight",
        "override uman",
        "interventie umana",
        "required: true",
      ]
      const automationSignals = [
        "decizie automata",
        "scoring",
        "profilare",
        "automated decision",
      ]
      return containsAny(lower, oversightSignals)
        ? {
            pass: true,
            message: ruleLabel
              ? `Rescan-ul a găsit semnale de supraveghere umană compatibile cu ${ruleLabel}.`
              : "Rescan-ul a găsit semnale de supraveghere umană în sursa curentă.",
          }
        : {
            pass: false,
            message: containsAny(lower, automationSignals)
              ? "Sursa curentă încă arată decizie automată, dar fără pas clar de validare umană sau override operațional."
              : "Sursa curentă nu arată încă un pas clar de validare umană sau override operațional.",
          }
    }

    case "tracking-consent": {
      const consentSignals = [
        "accept",
        "refuz",
        "consim",
        "preferinte",
        "cookie-uri non-esențiale",
        "cookie-uri non-esentiale",
        "cmp",
      ]
      const gatingSignals = [
        "blocat",
        "activate doar după",
        "dupa acord",
        "dupa accept",
        "explicit",
        "before consent",
        "pana la accept",
      ]
      return containsAny(lower, consentSignals) && containsAny(lower, gatingSignals)
        ? {
            pass: true,
            message: ruleLabel
              ? `Rescan-ul a găsit semnale de consimțământ explicit și control al tracking-ului pentru ${ruleLabel}.`
              : "Rescan-ul a găsit semnale de consimțământ explicit și control al tracking-ului.",
          }
        : {
            pass: false,
            message: findingKeyword
              ? `Sursa curentă încă semnalează ${findingKeyword}, dar nu arată un banner sau centru de preferințe suficient de clar.`
              : "Sursa curentă nu arată încă un banner sau centru de preferințe suficient de clar pentru tracking.",
          }
    }

    case "retention-policy": {
      const retentionSignals = [
        "retentie",
        "retenție",
        "retention",
        "termen",
        "stergere",
        "ștergere",
        "anonimiz",
      ]
      const enforcementSignals = ["la expirare", "după expirare", "automat", "control periodic"]
      return containsAny(lower, retentionSignals) && containsAny(lower, enforcementSignals)
        ? {
            pass: true,
            message:
              "Rescan-ul a găsit termeni de retenție plus semnale de ștergere sau anonimizare operațională.",
          }
        : {
            pass: false,
            message:
              "Sursa curentă nu arată încă atât termenul de retenție, cât și procesul clar de ștergere sau anonimizare.",
          }
    }

    case "ai-transparency": {
      const disclosureSignals = [
        "asistent",
        "inteligență artificială",
        "inteligenta artificiala",
        "generat de ai",
        "generat automat",
        "sistem ai",
      ]
      const operatorSignals = ["operator uman", "intervenția unui operator", "interventia unui operator"]
      return containsAny(lower, disclosureSignals)
        ? {
            pass: true,
            message:
              containsAny(lower, operatorSignals)
                ? "Rescan-ul a găsit un notice de transparență AI și o cale clară de escalare către om."
                : "Rescan-ul a găsit un notice de transparență pentru interacțiunea cu AI.",
          }
        : {
            pass: false,
            message:
              "Nu apare încă un disclaimer sau notice clar că utilizatorul interacționează cu un sistem AI.",
          }
    }

    case "data-residency": {
      const euSignals = ["eu-central-1", "eu-west", "eea", "in ue", "in ue/see", "uniunea europeana"]
      const badSignals = ["outside eu", "non-eea", "us-east-1", "statele unite"]
      if (containsAny(lower, euSignals) && !containsAny(lower, badSignals)) {
        return {
          pass: true,
          message:
            "Rescan-ul indică rezidență sau procesare în UE/SEE fără semnale de transfer problematic.",
        }
      }
      return {
        pass: false,
        message:
          "Sursa curentă încă sugerează transfer sau rezidență de date care trebuie clarificată.",
      }
    }

    case "efactura-sync": {
      const syncedRecently = hoursSince(state.efacturaSyncedAtISO) <= 24
      if (state.efacturaConnected && syncedRecently) {
        return {
          pass: true,
          message:
            "Starea operațională arată o sincronizare e-Factura recentă și conexiune activă.",
        }
      }
      return {
        pass: false,
        message:
          "Nu există încă o sincronizare e-Factura suficient de recentă pentru a închide task-ul.",
      }
    }

    case "evidence-only": {
      return {
        pass: relatedAlerts.every((alert) => !alert.open),
        status: relatedAlerts.length === 0 ? "needs_review" : undefined,
        message:
          relatedAlerts.length === 0
            ? "Task-ul nu mai are semnal tehnic direct. Verifică manual și păstrează dovada."
            : "Există încă alerte deschise legate de acest task.",
      }
    }
  }
}

function getLatestRelevantSourceText(
  state: ComplianceState,
  sourceDocument?: string,
  finding?: ScanFinding
) {
  const relatedScan = state.scans.find(
    (scan) =>
      (finding?.scanId ? scan.id === finding.scanId : false) ||
      (sourceDocument ? scan.documentName === sourceDocument : false) ||
      (finding?.sourceDocument ? scan.documentName === finding.sourceDocument : false)
  )

  if (!relatedScan) return null

  return {
    documentName: relatedScan.documentName,
    text:
      relatedScan.contentExtracted ||
      relatedScan.contentPreview ||
      finding?.detail ||
      "",
  }
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle.toLowerCase()))
}

function hoursSince(iso: string) {
  if (!iso) return Number.POSITIVE_INFINITY
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
}

// ── D2 — Re-open Rules ─────────────────────────────────────────────────────

export type ReopenReason = {
  source: "evidence_expired" | "drift_detected" | "legislation_changed"
  message: string
  detectedAtISO: string
}

export type ReopenCheckResult = {
  shouldReopen: boolean
  reasons: ReopenReason[]
}

const MS_PER_DAY = 86_400_000
const DPA_EXPIRY_DAYS = 365       // 12 months
const POLICY_EXPIRY_DAYS = 730    // 24 months

/**
 * D2: Check if a resolved task should be re-opened.
 * Triggers:
 * - Evidence attached has expired (DPA: 12 months, policies: 24 months)
 * - Drift detected on the same control
 * - Legislative change affects the finding
 */
export function checkTaskReopenRules(params: {
  state: ComplianceState
  taskId: string
  resolvedAtISO?: string
  evidenceUploadedAtISO?: string
  evidenceDocumentType?: string
}): ReopenCheckResult {
  const reasons: ReopenReason[] = []
  const nowMs = Date.now()
  const nowISO = new Date().toISOString()

  // 1. Evidence expiry check
  if (params.evidenceUploadedAtISO && params.resolvedAtISO) {
    const uploadDate = new Date(params.evidenceUploadedAtISO).getTime()
    const ageMs = nowMs - uploadDate

    const isDpa = params.evidenceDocumentType === "dpa"
    const expiryDays = isDpa ? DPA_EXPIRY_DAYS : POLICY_EXPIRY_DAYS
    const expiryLabel = isDpa ? "12 luni (DPA)" : "24 luni (politică)"

    if (ageMs > expiryDays * MS_PER_DAY) {
      reasons.push({
        source: "evidence_expired",
        message: `Dovada atașată a depășit ${expiryLabel}. Revalidare necesară.`,
        detectedAtISO: nowISO,
      })
    }
  }

  // 2. Drift on same control
  const resolution = getTaskResolutionTargets(params.state, params.taskId)
  const relatedFindingIds = new Set(resolution.findingIds)
  const relatedDriftIds = new Set(resolution.driftIds)
  const relatedFindings = params.state.findings.filter((f) => relatedFindingIds.has(f.id))

  // Check open drifts that affect related findings
  const openDrifts = params.state.driftRecords?.filter((d) => d.open) ?? []
  for (const drift of openDrifts) {
    // Check if drift was created after task was resolved
    if (params.resolvedAtISO && drift.detectedAtISO > params.resolvedAtISO) {
      // Check if drift affects the same control/finding
      const driftAffectsTask =
        relatedDriftIds.has(drift.id) ||
        (drift.sourceDocument && relatedFindings.some((f) => f.sourceDocument === drift.sourceDocument))

      if (driftAffectsTask) {
        reasons.push({
          source: "drift_detected",
          message: `Drift detectat ("${drift.summary.slice(0, 60)}") după rezolvarea task-ului.`,
          detectedAtISO: drift.detectedAtISO,
        })
      }
    }
  }

  // 3. Legislative changes (check events for legislation.changed after resolution)
  if (params.resolvedAtISO) {
    const legislationEvents = (params.state.events ?? []).filter(
      (e) =>
        e.type === "legislation.changed" &&
        e.createdAtISO > params.resolvedAtISO!
    )

    for (const event of legislationEvents.slice(0, 3)) {
      // Check if the legislation change is relevant to the task's framework
      const relatedFindings = params.state.findings.filter((f) =>
        relatedFindingIds.has(f.id)
      )
      const taskFrameworks = new Set(relatedFindings.map((f) => f.category))

      const eventFramework = (event.metadata as Record<string, unknown>)?.framework as string | undefined
      if (eventFramework && taskFrameworks.has(eventFramework as never)) {
        reasons.push({
          source: "legislation_changed",
          message: `Modificare legislativă detectată (${eventFramework}) — task-ul poate necesita re-evaluare.`,
          detectedAtISO: event.createdAtISO,
        })
      }
    }
  }

  return {
    shouldReopen: reasons.length > 0,
    reasons,
  }
}
