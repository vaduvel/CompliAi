"use client"

import type {
  CockpitTask,
  ScanInsight,
  TaskConfidence,
  TaskPriority,
} from "@/components/compliscan/types"
import type {
  ComplianceAlert,
  ComplianceState,
  PersistedTaskState,
  RemediationAction,
  ScanFinding,
  TaskEvidenceKind,
} from "@/lib/compliance/types"
import {
  severityToTaskConfidence,
  severityToTaskPriority,
  summarizePrinciples,
} from "@/lib/compliance/constitution"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import {
  buildDefaultReadyTextForCategory,
  getFindingRemediationRecipe,
  inferRemediationModeFromFinding,
} from "@/lib/compliance/remediation-recipes"
import {
  buildFindingTaskId,
  getTaskStateByTaskId,
  resolveFindingIdFromTaskId,
} from "@/lib/compliance/task-ids"

type CockpitTaskSourcePayload = {
  state: ComplianceState
  remediationPlan: RemediationAction[]
}

export function buildCockpitTasks(data: CockpitTaskSourcePayload): CockpitTask[] {
  const remediationTasks = data.remediationPlan
    .filter((item) => item.id !== "baseline-maintenance")
    .map(convertRemediationTask)
  const resolvedFindingIds = getResolvedFindingIdsFromPayload(data)

  const evidenceTasks = data.state.findings
    .filter((finding) => !resolvedFindingIds.has(finding.id))
    .map((finding) =>
      convertFindingTask(
        finding,
        data.state.alerts.find(
          (alert) =>
            alert.findingId === finding.id ||
            (alert.scanId === finding.scanId && alert.sourceDocument === finding.sourceDocument && alert.open)
        )
      )
    )

  return [...remediationTasks, ...evidenceTasks]
    .map((task) => applyPersistedTaskState(task, getTaskStateByTaskId(data.state.taskState, task.id)))
    .sort(compareTasks)
}

function getResolvedFindingIdsFromPayload(data: CockpitTaskSourcePayload) {
  const resolved = new Set<string>()

  for (const [taskId, taskState] of Object.entries(data.state.taskState ?? {})) {
    if (taskState?.status !== "done") continue

    if (taskId.startsWith("finding-")) {
      const findingId = resolveFindingIdFromTaskId(taskId)
      if (findingId) resolved.add(findingId)
      continue
    }

    if (!taskId.startsWith("rem-")) continue

    const remediation = data.remediationPlan.find((item) => `rem-${item.id}` === taskId)
    for (const findingId of remediation?.relatedFindingIds ?? []) {
      resolved.add(findingId)
    }
  }

  return resolved
}

function convertRemediationTask(item: RemediationAction): CockpitTask {
  return {
    id: `rem-${item.id}`,
    title: item.title,
    priority: item.priority,
    severity: item.severity,
    remediationMode: item.remediationMode,
    principles: item.principles ?? ["accountability"],
    summary: item.detectedIssue || item.why,
    why: item.why,
    evidenceSnippet: item.evidence,
    source: item.sourceDocument ? `din document: ${item.sourceDocument}` : "din planul AI",
    triggerLabel: item.sourceDocument
      ? `Semnal derivat din ${item.sourceDocument}`
      : "Semnal agregat din dashboard",
    triggerSnippet: item.triggerSnippet,
    lawReference: item.lawReference || inferLawReference(item.title, item.why),
    legalSummary: item.lawReference ? `Mapare legală: ${item.lawReference}` : undefined,
    fixPreview:
      item.fixPreview || item.actions[0] || "Revizuiește cazul și aplică remedierea recomandată.",
    readyTextLabel: item.readyTextLabel || "Text gata de copiat",
    readyText: item.readyText || buildReadyTextForRemediation(item),
    confidence: severityToTaskConfidence(item.severity),
    owner: item.owner,
    dueDate:
      item.dueDate ||
      (item.priority === "P1" ? "azi" : item.priority === "P2" ? "in 3 zile" : "saptamana asta"),
    effortLabel: item.priority === "P1" ? "5 min" : item.priority === "P2" ? "15 min" : "30 min",
    steps: item.actions,
    relatedFindingIds: item.relatedFindingIds ?? [],
    relatedDriftIds: item.relatedDriftIds ?? [],
    rescanHint: "Atașează dovada, apoi folosește Mark as fixed & rescan ca să verifici task-ul pe sursa curentă.",
    status: "todo",
    sourceDocument: item.sourceDocument,
    evidenceKinds: item.evidenceTypes ?? ["policy_text", "other"],
    validationStatus: "idle",
  }
}

function convertFindingTask(finding: ScanFinding, alert?: ComplianceAlert): CockpitTask {
  const severity = alert?.severity || finding.severity
  const priority: TaskPriority = severityToTaskPriority(severity)
  const confidence: TaskConfidence = mapFindingConfidenceToTaskConfidence(
    finding.verdictConfidence
  )
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)

  return {
    id: buildFindingTaskId(finding.id),
    title: finding.title,
    category: finding.category,
    priority,
    severity,
    remediationMode: inferRemediationModeFromFinding(finding),
    principles: finding.principles,
    summary: buildFindingSummary(finding),
    why: buildFindingWhy(finding),
    evidenceSnippet: buildProofNeeded(finding),
    source: `din document: ${finding.sourceDocument}`,
    triggerLabel: buildFindingTriggerLabel(finding),
    triggerSnippet: buildFindingTriggerSnippet(finding),
    lawReference: formatFindingLawReference(finding),
    legalSummary: buildLegalSummary(finding),
    fixPreview: finding.remediationHint || buildFixPreview(finding),
    readyTextLabel: buildReadyTextLabel(finding),
    readyText: buildReadyText(finding),
    confidence,
    owner:
      finding.ownerSuggestion ||
      recipe?.ownerFallback ||
      (priority === "P1" ? "Tu + DPO" : priority === "P2" ? "Marketing / Legal" : "Operatiuni"),
    dueDate:
      recipe?.dueDate ||
      (priority === "P1" ? "azi" : priority === "P2" ? "maine" : "cand revii pe document"),
    effortLabel: recipe?.effortLabel || (priority === "P1" ? "5 min" : priority === "P2" ? "10 min" : "20 min"),
    steps: buildStepsForFinding(finding),
    relatedFindingIds: [finding.id],
    relatedDriftIds: [],
    rescanHint: finding.rescanHint,
    closureRecipe: buildClosureRecipe(finding),
    status: "todo",
    sourceDocument: finding.sourceDocument,
    evidenceKinds: finding.evidenceTypes ?? inferEvidenceKindsFromCategory(finding.category),
    validationStatus: "idle",
  }
}

function buildClosureRecipe(finding: ScanFinding): string {
  if (finding.category === "NIS2") {
    if (finding.title.toLowerCase().includes("incident") || finding.title.toLowerCase().includes("raportare"))
      return "Generează un Plan de Răspuns la Incidente din Generator și atașează-l ca dovadă."
    if (finding.title.toLowerCase().includes("furnizor") || finding.title.toLowerCase().includes("dpa"))
      return "Încarcă DPA-ul semnat cu furnizorul sau generează unul din Generator."
    return "Documentează măsura implementată și atașează dovada (politică, procedură, screenshot sistem)."
  }
  if (finding.category === "GDPR") {
    if (finding.title.toLowerCase().includes("dpa") || finding.title.toLowerCase().includes("prelucrare"))
      return "Încarcă DPA-ul semnat cu procesatorul de date sau generează unul din Generator."
    if (finding.title.toLowerCase().includes("politică") || finding.title.toLowerCase().includes("policy"))
      return "Generează politica relevantă din Generator și publică-o. Atașează link-ul sau PDF-ul."
    return "Generează documentul GDPR relevant din Generator și atașează-l ca dovadă."
  }
  if (finding.category === "EU_AI_ACT") {
    return "Generează Politica de Guvernanță AI din Generator. Atașează documentul semnat de management."
  }
  if (finding.remediationHint) return finding.remediationHint
  return "Adaugă o dovadă (document, screenshot, link extern) care demonstrează că problema a fost remediată."
}

function applyPersistedTaskState(
  task: CockpitTask,
  persistedState?: PersistedTaskState
): CockpitTask {
  if (!persistedState) return task

  return {
    ...task,
    status: persistedState.status,
    attachedEvidence:
      persistedState.attachedEvidenceMeta ||
      (persistedState.attachedEvidence
        ? {
            id: `legacy-${task.id}`,
            fileName: persistedState.attachedEvidence,
            mimeType: "application/octet-stream",
            sizeBytes: 0,
            uploadedAtISO: persistedState.updatedAtISO,
            kind: task.evidenceKinds[0] ?? "other",
          }
        : undefined),
    validationStatus: persistedState.validationStatus ?? "idle",
    validationMessage: persistedState.validationMessage,
    validationConfidence: persistedState.validationConfidence,
    validationBasis: persistedState.validationBasis,
    validatedAtLabel: persistedState.validatedAtISO
      ? formatRelativeRomanian(persistedState.validatedAtISO)
      : undefined,
  }
}

function mapFindingConfidenceToTaskConfidence(
  confidence?: ScanFinding["verdictConfidence"]
): TaskConfidence {
  if (confidence === "high") return "high"
  if (confidence === "medium") return "med"
  if (confidence === "low") return "low"
  return "med"
}

function buildFindingSummary(finding: ScanFinding) {
  if (finding.provenance?.matchedKeyword) {
    return `Am găsit termenul „${finding.provenance.matchedKeyword}” în ${finding.sourceDocument}.`
  }

  if (finding.category === "GDPR") {
    return `Documentul ${finding.sourceDocument} conține semnale de tracking sau cookies care cer verificare.`
  }
  if (finding.category === "EU_AI_ACT") {
    return `Documentul ${finding.sourceDocument} sugerează decizie automată sau profilare cu impact.`
  }
  if (finding.category === "E_FACTURA") {
    return `Documentul ${finding.sourceDocument} sugerează un flux e-Factura care trebuie confirmat operațional.`
  }

  return finding.detail
}

function buildFindingWhy(finding: ScanFinding) {
  if (finding.legalMappings && finding.legalMappings.length > 0) {
    return `${finding.impactSummary || finding.detail} Mapare legală: ${finding.legalMappings
      .map((item) => `${item.regulation} ${item.article}`)
      .join(", ")}.`
  }

  return finding.impactSummary || finding.detail
}

function buildLegalSummary(finding: ScanFinding) {
  const legalSummary =
    finding.legalMappings && finding.legalMappings.length > 0
      ? finding.legalMappings
          .map((item) => `${item.regulation} ${item.article} - ${item.label}`)
          .join(" · ")
      : ""
  const principleSummary =
    finding.principles.length > 0 ? `Principii: ${summarizePrinciples(finding.principles)}` : ""

  return [legalSummary, principleSummary].filter(Boolean).join(" · ") || undefined
}

function buildFindingTriggerLabel(finding: ScanFinding) {
  return `Document: ${finding.sourceDocument} · Regula: ${finding.provenance?.ruleId || "fără regulă"}`
}

function buildFindingTriggerSnippet(finding: ScanFinding) {
  const excerpt = finding.provenance?.excerpt?.trim()
  if (!excerpt) return "Nu există încă excerpt salvat pentru acest finding."

  if (finding.provenance?.matchedKeyword) {
    return `Keyword: ${finding.provenance.matchedKeyword}\n${excerpt}`
  }

  return excerpt
}

function buildFixPreview(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.fixPreview) return recipe.fixPreview
  if (finding.remediationHint) return finding.remediationHint
  if (finding.category === "EU_AI_ACT") {
    return "Pune control uman obligatoriu și documentează logica operațională a deciziei."
  }
  if (finding.category === "GDPR") {
    return "Blochează tracking-ul până la accept explicit și salvează dovada consimțământului."
  }
  return "Validează XML-ul, confirmă transmiterea și arhivează dovada pentru contabil."
}

function buildProofNeeded(finding: ScanFinding) {
  if (finding.evidenceRequired) return finding.evidenceRequired
  if (finding.category === "EU_AI_ACT") {
    return "Dovadă de închidere: procedură de override uman, owner aprobat și log de validare pentru cazurile cu impact."
  }
  if (finding.category === "GDPR") {
    return "Dovadă de închidere: capturi CMP, test că scripturile sunt blocate înainte de accept și log cu timestamp + preferințe."
  }
  return "Dovadă de închidere: XML validat, răspuns de transmitere și arhivare a documentelor pentru audit."
}

function inferEvidenceKindsFromCategory(category: ScanFinding["category"]): TaskEvidenceKind[] {
  if (category === "EU_AI_ACT") return ["policy_text", "log_export", "screenshot"]
  if (category === "GDPR") return ["screenshot", "policy_text", "log_export"]
  return ["document_bundle", "log_export"]
}

export function formatEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "screenshot"
  if (kind === "policy_text") return "policy text"
  if (kind === "log_export") return "log export"
  if (kind === "yaml_evidence") return "yaml evidence"
  if (kind === "document_bundle") return "document bundle"
  return "other"
}

function buildReadyTextLabel(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.readyTextLabel) return recipe.readyTextLabel
  if (finding.readyTextLabel) return finding.readyTextLabel
  if (finding.category === "EU_AI_ACT") return "Text gata de copiat in procedura"
  if (finding.category === "GDPR") return "Text gata de copiat in banner / notice"
  return "Text gata de copiat in runbook"
}

function buildReadyText(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.readyText) return recipe.readyText
  if (finding.readyText) return finding.readyText
  return buildDefaultReadyTextForCategory(finding.category)
}

function buildReadyTextForRemediation(item: RemediationAction) {
  if (item.id === "tracking-consent") {
    return [
      "Folosim cookie-uri și tehnologii similare pentru analiză și îmbunătățirea experienței doar după acordul tău explicit.",
      "Poți accepta, refuza sau modifica preferințele în orice moment din centrul de preferințe.",
    ].join("\n")
  }

  if (item.id === "high-risk-flow") {
    return [
      "Nicio decizie cu efect asupra persoanei vizate nu este executată exclusiv automat.",
      "Înainte de rezultat final, cazul este revizuit de un operator desemnat care poate confirma, modifica sau respinge recomandarea sistemului.",
    ].join("\n")
  }

  if (item.id === "retention-policy") {
    return [
      "Datele personale sunt păstrate doar pe perioada necesară scopului pentru care au fost colectate.",
      "La expirarea termenului aplicabil, datele sunt șterse sau anonimizate prin procese automate sau controale documentate.",
    ].join("\n")
  }

  if (item.id === "efactura-freshness") {
    return [
      "Pentru fiecare factură transmisă prin e-Factura se păstrează XML-ul validat, confirmarea de transmitere și dovada de arhivare.",
      "Verificarea zilnică a răspunsurilor și a erorilor de sincronizare face parte din controlul operațional standard.",
    ].join("\n")
  }

  return item.actions.join("\n")
}

export function buildScanInsights(text: string): ScanInsight[] {
  const lower = text.toLowerCase()
  return [
    { id: "system", label: "Tip sistem", value: detectSystemType(lower) },
    { id: "data", label: "Date atinse", value: detectDataTypes(lower) },
    { id: "actions", label: "Actiuni", value: detectActions(lower) },
    { id: "focus", label: "Focus revizie", value: detectFocusArea(lower) },
  ]
}

export function getNextBestAction(tasks: CockpitTask[]) {
  return [...tasks].filter((task) => task.status !== "done").sort(compareTasks)[0] ?? null
}

function buildStepsForFinding(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe) {
    return finding.rescanHint ? [...recipe.steps, finding.rescanHint] : recipe.steps
  }

  if (finding.rescanHint) {
    const baseSteps =
      finding.category === "EU_AI_ACT"
        ? [
            "Confirma daca exista decizie automata cu impact asupra utilizatorului.",
            "Documenteaza datele folosite si logica operationala.",
            "Adauga punct de override uman inainte de decizia finala.",
          ]
        : finding.category === "GDPR"
          ? [
              "Verifica baza legala pentru tracking sau prelucrare.",
              "Revizuieste bannerul de consimtamant si textul legal.",
              "Pastreaza dovada preferintelor si a versiunii politicii.",
            ]
          : [
              "Confirma traseul operational e-Factura.",
              "Verifica logurile de transmitere si raspunsurile.",
              "Arhiveaza dovada pentru audit si contabil.",
            ]

    return [...baseSteps, finding.rescanHint]
  }

  if (finding.category === "EU_AI_ACT") {
    return [
      "Confirma daca exista decizie automata cu impact asupra utilizatorului.",
      "Documenteaza datele folosite si logica operationala.",
      "Adauga punct de override uman inainte de decizia finala.",
    ]
  }
  if (finding.category === "GDPR") {
    return [
      "Verifica baza legala pentru tracking sau prelucrare.",
      "Revizuieste bannerul de consimtamant si textul legal.",
      "Pastreaza dovada preferintelor si a versiunii politicii.",
    ]
  }
  if (finding.category === "NIS2") {
    return [
      finding.remediationHint || "Implementeaza masura de securitate NIS2 identificata.",
      "Documenteaza implementarea si testeaza masura.",
      "Pastreaza dovada pentru auditul DNSC (Art. 21).",
    ]
  }
  return [
    "Confirma traseul operational e-Factura.",
    "Verifica logurile de transmitere si raspunsurile.",
    "Arhiveaza dovada pentru audit si contabil.",
  ]
}

function formatFindingLawReference(finding: ScanFinding) {
  if (finding.legalMappings && finding.legalMappings.length > 0) {
    return finding.legalMappings.map((item) => `${item.regulation} ${item.article}`).join(" · ")
  }

  return finding.legalReference || inferLawReference(finding.title, finding.detail)
}

function detectSystemType(text: string) {
  if (includesAny(text, ["chatbot", "assistant", "assistant ai"])) return "chatbot / asistenta automata"
  if (includesAny(text, ["tracking", "analytics", "cookies"])) return "tracking / analytics"
  if (includesAny(text, ["recomand", "personalizare", "segment"])) return "recomandari / segmentare"
  if (includesAny(text, ["factura", "anaf", "xml"])) return "flux operational e-factura"
  return "document general de conformitate"
}

function detectDataTypes(text: string) {
  const hits: string[] = []
  if (includesAny(text, ["email", "mail"])) hits.push("email")
  if (includesAny(text, ["ip"])) hits.push("IP")
  if (includesAny(text, ["cookie", "cookies"])) hits.push("cookies")
  if (includesAny(text, ["telefon"])) hits.push("telefon")
  if (includesAny(text, ["istoric", "log"])) hits.push("istoric / log")
  return hits.length > 0 ? hits.join(", ") : "nu sunt mentionate explicit"
}

function detectActions(text: string) {
  const hits: string[] = []
  if (includesAny(text, ["decizie automata", "automat", "scoring"])) hits.push("decizie automata")
  if (includesAny(text, ["segment", "profil"])) hits.push("segmentare / profilare")
  if (includesAny(text, ["recomand"])) hits.push("recomandari")
  if (includesAny(text, ["sync", "anaf", "trimite"])) hits.push("transmitere operationala")
  return hits.length > 0 ? hits.join(", ") : "revizie text si scope"
}

function detectFocusArea(text: string) {
  if (includesAny(text, ["consim", "cookies", "tracking"])) return "consimtamant si baza legala"
  if (includesAny(text, ["decizie automata", "scoring", "profilare"])) return "human oversight si AI Act"
  if (includesAny(text, ["factura", "anaf"])) return "sync si dovada operationala"
  return "verificare umana a clauzelor"
}

function inferLawReference(title: string, detail: string) {
  const combined = `${title} ${detail}`.toLowerCase()
  if (includesAny(combined, ["consim", "tracking", "cookies"])) return "GDPR Art. 6 / Art. 7"
  if (includesAny(combined, ["high-risk", "impact ridicat", "decizie automata", "profilare"])) {
    return "AI Act Art. 9 / Art. 14"
  }
  if (includesAny(combined, ["factura", "anaf", "xml"])) return "RO e-Factura / flux ANAF"
  return "revizie juridica necesara"
}

function compareTasks(left: CockpitTask, right: CockpitTask) {
  const priorityDelta = priorityWeight(left.priority) - priorityWeight(right.priority)
  if (priorityDelta !== 0) return priorityDelta

  return remediationModeWeight(left.remediationMode) - remediationModeWeight(right.remediationMode)
}

function priorityWeight(priority: TaskPriority) {
  if (priority === "P1") return 1
  if (priority === "P2") return 2
  return 3
}

function remediationModeWeight(mode: CockpitTask["remediationMode"]) {
  return mode === "rapid" ? 1 : 2
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}

export function getRiskLastSyncLabel(iso: string) {
  return formatRelativeRomanian(iso)
}
