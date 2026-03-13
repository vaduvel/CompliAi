import type { ComplianceState, RemediationAction } from "@/lib/compliance/types"
import { getDriftPolicyFromRecord } from "@/lib/compliance/drift-policy"
import { getRemediationRecipe } from "@/lib/compliance/remediation-recipes"
import { severityToTaskPriority } from "@/lib/compliance/constitution"

export function buildRemediationPlan(state: ComplianceState): RemediationAction[] {
  const plan: RemediationAction[] = []
  const openAlerts = state.alerts.filter((alert) => alert.open)
  const openDrifts = state.driftRecords.filter((drift) => drift.open)
  const highRiskFinding = state.findings.find((finding) => finding.category === "EU_AI_ACT")
  const trackingFinding = state.findings.find((finding) => finding.category === "GDPR")
  const efacturaFinding = state.findings.find((finding) => finding.category === "E_FACTURA")
  const highRiskFindingIds = state.findings
    .filter(
      (finding) =>
        finding.category === "EU_AI_ACT" &&
        (finding.severity === "critical" || finding.severity === "high")
    )
    .map((finding) => finding.id)
  const trackingFindingIds = state.findings
    .filter(
      (finding) =>
        finding.category === "GDPR" &&
        `${finding.title} ${finding.detail}`.toLowerCase().match(/tracking|cookies|consim/)
    )
    .map((finding) => finding.id)
  const retentionFindingIds = state.findings
    .filter((finding) => `${finding.title} ${finding.detail}`.toLowerCase().includes("reten"))
    .map((finding) => finding.id)
  const efacturaFindingIds = state.findings
    .filter((finding) => finding.category === "E_FACTURA")
    .map((finding) => finding.id)

  if (
    openAlerts.some(
      (alert) =>
        alert.severity === "critical" ||
        alert.severity === "high" ||
        alert.message.toLowerCase().includes("impact ridicat") ||
        alert.message.toLowerCase().includes("high-risk")
    )
  ) {
    const recipe = getRemediationRecipe("high-risk-flow")
    plan.push({
      id: recipe.id,
      title: recipe.title,
      priority: recipe.priority,
      severity: "high",
      remediationMode: recipe.remediationMode,
      principles: ["oversight", "transparency", "accountability"],
      owner: highRiskFinding?.ownerSuggestion || recipe.defaultOwner,
      why:
        highRiskFinding?.impactSummary ||
        recipe.defaultWhy,
      actions: recipe.defaultActions,
      evidence:
        highRiskFinding?.evidenceRequired ||
        recipe.defaultEvidence,
      sourceDocument: highRiskFinding?.sourceDocument,
      detectedIssue:
        highRiskFinding?.provenance?.matchedKeyword
          ? `Am găsit termenul „${highRiskFinding.provenance.matchedKeyword}” în ${highRiskFinding.sourceDocument}.`
          : "A fost detectat un posibil flux de decizie automată sau profilare.",
      triggerSnippet: highRiskFinding?.provenance?.excerpt,
      lawReference: highRiskFinding?.legalReference || recipe.defaultLawReference,
      fixPreview:
        highRiskFinding?.remediationHint ||
        recipe.defaultFixPreview,
      readyTextLabel: recipe.readyTextLabel,
      readyText: recipe.readyText,
      relatedAlertIds: openAlerts
        .filter(
          (alert) =>
            alert.severity === "critical" ||
            alert.severity === "high" ||
            alert.message.toLowerCase().includes("impact ridicat") ||
            alert.message.toLowerCase().includes("high-risk") ||
            (alert.findingId ? highRiskFindingIds.includes(alert.findingId) : false)
        )
        .map((alert) => alert.id),
      relatedFindingIds: highRiskFindingIds,
      validationKind: recipe.validationKind,
      evidenceTypes: recipe.evidenceTypes,
    })
  }

  if (
    openAlerts.some((alert) => alert.message.toLowerCase().includes("consimțământ")) ||
    state.findings.some((finding) => finding.title.toLowerCase().includes("tracking"))
  ) {
    const recipe = getRemediationRecipe("tracking-consent")
    plan.push({
      id: recipe.id,
      title: recipe.title,
      priority: recipe.priority,
      severity: "high",
      remediationMode: recipe.remediationMode,
      principles: ["privacy_data_governance", "transparency", "accountability"],
      owner: trackingFinding?.ownerSuggestion || recipe.defaultOwner,
      why:
        trackingFinding?.impactSummary ||
        recipe.defaultWhy,
      actions: recipe.defaultActions,
      evidence:
        trackingFinding?.evidenceRequired ||
        recipe.defaultEvidence,
      sourceDocument: trackingFinding?.sourceDocument,
      detectedIssue:
        trackingFinding?.provenance?.matchedKeyword
          ? `Am găsit termenul „${trackingFinding.provenance.matchedKeyword}” într-un context de tracking în ${trackingFinding.sourceDocument}.`
          : "Documentul menționează tracking/cookies fără dovadă clară de control al consimțământului.",
      triggerSnippet: trackingFinding?.provenance?.excerpt,
      lawReference: trackingFinding?.legalReference || recipe.defaultLawReference,
      fixPreview:
        trackingFinding?.remediationHint ||
        recipe.defaultFixPreview,
      readyTextLabel: recipe.readyTextLabel,
      readyText: recipe.readyText,
      relatedAlertIds: openAlerts
        .filter(
          (alert) =>
            alert.message.toLowerCase().includes("consim") ||
            (alert.findingId ? trackingFindingIds.includes(alert.findingId) : false)
        )
        .map((alert) => alert.id),
      relatedFindingIds: trackingFindingIds,
      validationKind: recipe.validationKind,
      evidenceTypes: recipe.evidenceTypes,
    })
  }

  if (
    openAlerts.some((alert) => alert.message.toLowerCase().includes("retenție")) ||
    state.findings.some((finding) => finding.detail.toLowerCase().includes("reten"))
  ) {
    const recipe = getRemediationRecipe("retention-policy")
    plan.push({
      id: recipe.id,
      title: recipe.title,
      priority: recipe.priority,
      severity: "medium",
      remediationMode: recipe.remediationMode,
      principles: ["privacy_data_governance", "accountability"],
      owner: recipe.defaultOwner,
      why: recipe.defaultWhy,
      actions: recipe.defaultActions,
      evidence: recipe.defaultEvidence,
      lawReference: recipe.defaultLawReference,
      fixPreview: recipe.defaultFixPreview,
      readyTextLabel: recipe.readyTextLabel,
      readyText: recipe.readyText,
      relatedAlertIds: openAlerts
        .filter((alert) => alert.message.toLowerCase().includes("reten"))
        .map((alert) => alert.id),
      relatedFindingIds: retentionFindingIds,
      validationKind: recipe.validationKind,
      evidenceTypes: recipe.evidenceTypes,
    })
  }

  if (
    state.findings.some((finding) => finding.category === "E_FACTURA") &&
    hoursSince(state.efacturaSyncedAtISO) > 24
  ) {
    const recipe = getRemediationRecipe("efactura-freshness")
    plan.push({
      id: recipe.id,
      title: recipe.title,
      priority: recipe.priority,
      severity: "medium",
      remediationMode: recipe.remediationMode,
      principles: ["accountability", "robustness"],
      owner: efacturaFinding?.ownerSuggestion || recipe.defaultOwner,
      why:
        efacturaFinding?.impactSummary ||
        recipe.defaultWhy,
      actions: recipe.defaultActions,
      evidence:
        efacturaFinding?.evidenceRequired ||
        recipe.defaultEvidence,
      sourceDocument: efacturaFinding?.sourceDocument,
      detectedIssue:
        efacturaFinding?.provenance?.matchedKeyword
          ? `Am găsit termenul „${efacturaFinding.provenance.matchedKeyword}” într-un document care sugerează flux e-Factura.`
          : "Există semnale de flux e-Factura fără dovadă operațională recentă.",
      triggerSnippet: efacturaFinding?.provenance?.excerpt,
      lawReference: efacturaFinding?.legalReference || recipe.defaultLawReference,
      fixPreview:
        efacturaFinding?.remediationHint ||
        recipe.defaultFixPreview,
      readyTextLabel: recipe.readyTextLabel,
      readyText: recipe.readyText,
      relatedAlertIds: openAlerts
        .filter((alert) => alert.findingId ? efacturaFindingIds.includes(alert.findingId) : false)
        .map((alert) => alert.id),
      relatedFindingIds: efacturaFindingIds,
      validationKind: recipe.validationKind,
      evidenceTypes: recipe.evidenceTypes,
    })
  }

  for (const drift of openDrifts) {
    plan.push(buildDriftRemediation(drift))
  }

  if (plan.length === 0) {
    const recipe = getRemediationRecipe("baseline-maintenance")
    plan.push({
      id: recipe.id,
      title: recipe.title,
      priority: recipe.priority,
      severity: "low",
      remediationMode: recipe.remediationMode,
      principles: ["accountability"],
      owner: recipe.defaultOwner,
      why: recipe.defaultWhy,
      actions: recipe.defaultActions,
      evidence: recipe.defaultEvidence,
      detectedIssue: "Nu există un risc critic nou, dar menținem baseline-ul prin revizie periodică.",
      lawReference: recipe.defaultLawReference,
      fixPreview: recipe.defaultFixPreview,
      readyTextLabel: recipe.readyTextLabel,
      readyText: recipe.readyText,
      validationKind: recipe.validationKind,
      evidenceTypes: recipe.evidenceTypes,
    })
  }

  return plan.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
}

function buildDriftRemediation(
  drift: ComplianceState["driftRecords"][number]
): RemediationAction {
  const policy = getDriftPolicyFromRecord(drift)
  return {
    id: `drift-${drift.id}`,
    title: buildDriftTaskTitle(drift),
    priority: severityToTaskPriority(drift.severity),
    severity: drift.severity,
    remediationMode: driftRemediationMode(drift.change),
    principles: driftPrinciples(drift.change),
    owner: policy.ownerSuggestion || driftOwner(drift.change),
    why: drift.impactSummary || policy.impactSummary || drift.summary,
    actions: driftActions(drift.change, policy.nextAction),
    evidence: drift.evidenceRequired || policy.evidenceRequired || driftEvidence(drift.change),
    sourceDocument: drift.sourceDocument,
    detectedIssue: drift.summary,
    triggerSnippet: buildDriftTriggerSnippet(drift),
    lawReference: drift.lawReference || policy.lawReference || driftLawReference(drift.change),
    fixPreview: drift.nextAction || policy.nextAction || driftFixPreview(drift.change),
    readyTextLabel: "Text / nota gata de copiat pentru review",
    readyText: driftReadyText(drift.change),
    dueDate: driftDueDateLabel(policy.escalationSlaHours),
    relatedDriftIds: [drift.id],
    validationKind: driftValidationKind(drift.change),
    evidenceTypes: driftEvidenceTypes(drift.change),
  }
}

function driftRemediationMode(change: string): RemediationAction["remediationMode"] {
  if (
    change === "human_review_removed" ||
    change === "risk_class_changed" ||
    change === "purpose_changed" ||
    change === "data_residency_changed"
  ) {
    return "structural"
  }

  return "rapid"
}

function priorityOrder(priority: RemediationAction["priority"]) {
  if (priority === "P1") return 1
  if (priority === "P2") return 2
  return 3
}

function hoursSince(iso: string) {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60))
}

function driftOwner(change: string) {
  if (change === "human_review_removed") return "DPO + Product + Tech Lead"
  if (change === "data_residency_changed" || change === "personal_data_detected") {
    return "DPO + Security + Backend"
  }
  if (change === "risk_class_changed") return "Compliance Officer + Product"
  return "Product + Tech Lead"
}

function driftActions(change: string, nextAction?: string) {
  const actions = nextAction ? [nextAction] : []

  if (change === "human_review_removed") {
    return [...actions,
      "Reintrodu un pas clar de aprobare sau override uman.",
      "Actualizeaza procedura si configuratia declarata a sistemului.",
      "Ataseaza dovada noului control si ruleaza rescan.",
    ]
  }
  if (change === "data_residency_changed") {
    return [...actions,
      "Confirma unde sunt procesate datele dupa schimbare.",
      "Actualizeaza documentatia de transfer sau rezidenta.",
      "Ataseaza dovada de configurare si ruleaza rescan.",
    ]
  }
  if (change === "personal_data_detected") {
    return [...actions,
      "Clarifica ce date personale sunt atinse de noul flux.",
      "Actualizeaza baza legala si minimizarea datelor.",
      "Ataseaza dovada noii evaluari si ruleaza rescan.",
    ]
  }
  if (change === "risk_class_changed") {
    return [...actions,
      "Revizuieste noua clasa de risc si implicatiile operationale.",
      "Actualizeaza inventarul si dovezile de control.",
      "Confirma noul baseline dupa review uman.",
    ]
  }
  return [...actions,
    "Revizuieste schimbarea fata de baseline.",
    "Actualizeaza configuratia sau documentatia care justifica noua stare.",
    "Ataseaza dovada si ruleaza rescan.",
  ]
}

function driftEvidence(change: string) {
  if (change === "human_review_removed") {
    return "Workflow aprobat, procedura de override si log de validare umana."
  }
  if (change === "data_residency_changed") {
    return "Configuratie tehnica, dovada rezidentei datelor si documentatia de transfer."
  }
  if (change === "personal_data_detected") {
    return "Evaluare de date personale, update de politica si dovada aprobarii interne."
  }
  if (change === "risk_class_changed") {
    return "Revizie de risc, owner aprobat si snapshot nou validat."
  }
  return "Nota de schimbare, dovada configuratiei si confirmare de review."
}

function driftLawReference(change: string) {
  if (change === "human_review_removed") return "AI Act Art. 14"
  if (change === "data_residency_changed") return "GDPR Chapter V"
  if (change === "personal_data_detected") return "GDPR Art. 5 / Art. 6"
  if (change === "risk_class_changed") return "AI Act Art. 9"
  return "Control operational / snapshot review"
}

function driftDueDateLabel(hours?: number | null) {
  if (!hours) return "saptamana asta"
  if (hours <= 12) return "azi"
  if (hours <= 24) return "in 24h"
  if (hours <= 48) return "in 2 zile"
  if (hours <= 72) return "in 3 zile"
  return "saptamana asta"
}

function driftFixPreview(change: string) {
  if (change === "human_review_removed") {
    return "Restabileste review-ul uman si reconfirma configuratia inainte de utilizare."
  }
  if (change === "data_residency_changed") {
    return "Documenteaza noua rezidenta si mecanismul de transfer inainte de inchidere."
  }
  if (change === "personal_data_detected") {
    return "Clarifica datele personale nou atinse si actualizeaza baza legala."
  }
  if (change === "risk_class_changed") {
    return "Reevalueaza clasa de risc si updateaza controlul operational."
  }
  return "Justifica schimbarea fata de baseline si reconfirma dovada."
}

function driftReadyText(change: string) {
  if (change === "human_review_removed") {
    return [
      "Modificarea nu poate fi considerata acceptata fara reintroducerea unui pas real de validare umana.",
      "Operatorul desemnat trebuie sa poata confirma, modifica sau bloca rezultatul generat automat.",
    ].join("\n")
  }
  if (change === "data_residency_changed") {
    return [
      "Schimbarea de rezidenta a datelor trebuie documentata explicit, impreuna cu noul furnizor, regiunea si mecanismul de transfer.",
      "Pana la confirmare, baseline-ul anterior ramane referinta valida.",
    ].join("\n")
  }
  return [
    "Schimbarea detectata fata de baseline trebuie documentata, revizuita uman si sustinuta prin dovada actualizata.",
    "Dupa confirmare, se ruleaza rescan si, daca este cazul, se seteaza un baseline nou.",
  ].join("\n")
}

function driftValidationKind(change: string): RemediationAction["validationKind"] {
  if (change === "human_review_removed") return "human-oversight"
  if (change === "data_residency_changed" || change === "personal_data_detected") {
    return "data-residency"
  }
  return "evidence-only"
}

function driftEvidenceTypes(change: string): RemediationAction["evidenceTypes"] {
  if (change === "human_review_removed") return ["policy_text", "log_export", "yaml_evidence"]
  if (change === "data_residency_changed") return ["yaml_evidence", "policy_text", "document_bundle"]
  if (change === "personal_data_detected") return ["policy_text", "document_bundle", "log_export"]
  return ["yaml_evidence", "policy_text", "other"]
}

function driftPrinciples(change: string): RemediationAction["principles"] {
  if (change === "human_review_removed") return ["oversight", "accountability"]
  if (change === "data_residency_changed" || change === "personal_data_detected") {
    return ["privacy_data_governance", "accountability"]
  }
  if (change === "risk_class_changed") return ["oversight", "robustness", "accountability"]
  return ["accountability", "robustness"]
}

function buildDriftTaskTitle(drift: ComplianceState["driftRecords"][number]) {
  if (drift.change === "human_review_removed") return "Restabileste review-ul uman pentru drift"
  if (drift.change === "data_residency_changed") return "Confirma noua rezidenta a datelor"
  if (drift.change === "personal_data_detected") return "Revizuieste impactul noilor date personale"
  if (drift.change === "risk_class_changed") return "Reevalueaza clasa de risc dupa drift"
  if (drift.change === "provider_changed" || drift.change === "model_changed") {
    return "Documenteaza schimbarea de provider / model"
  }
  return `Revizuieste drift-ul: ${drift.change}`
}

function buildDriftTriggerSnippet(drift: ComplianceState["driftRecords"][number]) {
  const before = drift.before ? JSON.stringify(drift.before) : "n/a"
  const after = drift.after ? JSON.stringify(drift.after) : "n/a"
  return `Inainte: ${before}\nDupa: ${after}`
}
