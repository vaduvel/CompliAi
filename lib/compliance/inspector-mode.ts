// V3 P1.3 — Inspector Mode Enhanced / Simulare Control
// Simulează perspectiva unui inspector (DNSC, GDPR, AI Act) asupra conformității curente.
// Arată ce ar găsi un auditor extern: ce trece, ce pică, ce dovezi lipsesc.

import type { ComplianceState } from "@/lib/compliance/types"
import type { Nis2OrgState } from "@/lib/server/nis2-store"

export type InspectorVerdict = "pass" | "partial" | "fail" | "na"
export type InspectorOverallVerdict = "ready" | "partial" | "not-ready"

export type InspectorCheck = {
  id: string
  topic: string
  description: string
  verdict: InspectorVerdict
  detail: string
  evidence?: string          // dovada sau lipsa ei
  legalRef?: string          // articol de lege relevant
  critical: boolean          // un inspector ar bloca auditul pentru asta
}

export type InspectorFrameworkResult = {
  framework: string          // "GDPR" | "NIS2" | "EU AI Act" | "e-Factura"
  verdict: InspectorVerdict
  score: number              // 0-100
  checks: InspectorCheck[]
  applicable: boolean
}

export type InspectorSimulationResult = {
  simulatedAt: string
  overallVerdict: InspectorOverallVerdict
  readinessScore: number     // 0-100 medie ponderată
  frameworks: InspectorFrameworkResult[]
  criticalGaps: InspectorCheck[]
  summary: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function verdictScore(v: InspectorVerdict): number {
  return v === "pass" ? 100 : v === "partial" ? 50 : v === "na" ? 100 : 0
}

function frameworkVerdict(checks: InspectorCheck[]): InspectorVerdict {
  const active = checks.filter((c) => c.verdict !== "na")
  if (active.length === 0) return "na"
  if (active.every((c) => c.verdict === "pass")) return "pass"
  if (active.some((c) => c.verdict === "fail" && c.critical)) return "fail"
  if (active.some((c) => c.verdict === "fail")) return "partial"
  return "partial"
}

function frameworkScore(checks: InspectorCheck[]): number {
  const active = checks.filter((c) => c.verdict !== "na")
  if (active.length === 0) return 100
  return Math.round(active.reduce((sum, c) => sum + verdictScore(c.verdict), 0) / active.length)
}

// ── GDPR Checks ───────────────────────────────────────────────────────────────

function checkGdpr(state: ComplianceState): InspectorCheck[] {
  const criticalFindings = (state.findings ?? []).filter(
    (f) => f.category === "GDPR" && (f.severity === "critical" || f.severity === "high")
  )
  const taskState = state.taskState ?? {}
  const openCritical = criticalFindings.filter(
    (f) => taskState[f.id]?.status !== "done"
  )

  const checks: InspectorCheck[] = []

  // 1. Progres general GDPR
  checks.push({
    id: "gdpr-progress",
    topic: "Conformitate generală GDPR",
    description: "Cel puțin 60% din obligațiile GDPR trebuie să fie adresate.",
    verdict: state.gdprProgress >= 80 ? "pass" : state.gdprProgress >= 40 ? "partial" : "fail",
    detail:
      state.gdprProgress >= 80
        ? `Progres GDPR: ${state.gdprProgress}% — nivel adecvat pentru audit.`
        : state.gdprProgress >= 40
          ? `Progres GDPR: ${state.gdprProgress}% — lacune semnificative identificate.`
          : `Progres GDPR: ${state.gdprProgress}% — nivel insuficient pentru audit.`,
    evidence:
      state.gdprProgress >= 60
        ? `${state.gdprProgress}% din cerințe adresate`
        : "Cerințe critice neîndeplinite",
    legalRef: "GDPR Art. 24 — Responsabilitatea operatorului",
    critical: state.gdprProgress < 40,
  })

  // 2. Finding-uri critice GDPR deschise
  checks.push({
    id: "gdpr-open-findings",
    topic: "Finding-uri critice GDPR nerezolvate",
    description: "Finding-urile critice nerezolvate reprezintă risc direct de amendă.",
    verdict: openCritical.length === 0 ? "pass" : openCritical.length <= 2 ? "partial" : "fail",
    detail:
      openCritical.length === 0
        ? "Nicio problemă critică GDPR deschisă."
        : `${openCritical.length} finding-ur${openCritical.length > 1 ? "i" : ""} critice/high GDPR nerezolvate.`,
    evidence:
      openCritical.length > 0
        ? openCritical
            .slice(0, 3)
            .map((f) => f.title)
            .join("; ")
        : "Toate finding-urile critice sunt închise",
    legalRef: "GDPR Art. 83 — Condiții pentru amenzi",
    critical: openCritical.length > 2,
  })

  // 3. Documente scanate (baza evidenței)
  const hasDocuments = state.scannedDocuments > 0 || state.scans.length > 0
  checks.push({
    id: "gdpr-evidence-base",
    topic: "Baza documentară pentru audit",
    description: "Documentele procesate constituie baza de dovezi pentru inspector.",
    verdict: hasDocuments ? (state.scannedDocuments >= 3 ? "pass" : "partial") : "fail",
    detail: hasDocuments
      ? `${state.scannedDocuments} document${state.scannedDocuments !== 1 ? "e" : ""} procesate, ${state.scans.length} scan-uri efectuate.`
      : "Nicio documentație procesată — baza de dovezi lipsește.",
    evidence: hasDocuments
      ? `${state.scannedDocuments} doc., ${state.scans.length} scan-uri`
      : "Documentație lipsă",
    critical: !hasDocuments,
  })

  return checks
}

// ── NIS2 Checks ───────────────────────────────────────────────────────────────

function checkNis2(state: ComplianceState, nis2: Nis2OrgState, applicable: boolean): InspectorCheck[] {
  if (!applicable) {
    return [
      {
        id: "nis2-na",
        topic: "NIS2 — Aplicabilitate",
        description: "Organizația nu intră sub incidența Directivei NIS2.",
        verdict: "na",
        detail: "NIS2 nu se aplică acestei organizații.",
        critical: false,
      },
    ]
  }

  const checks: InspectorCheck[] = []

  // 1. Înregistrare DNSC
  const dnscStatus = nis2.dnscRegistrationStatus ?? "not-started"
  checks.push({
    id: "nis2-dnsc-registration",
    topic: "Înregistrare DNSC (NIS2)",
    description: "Entitățile NIS2 trebuie înregistrate la DNSC.",
    verdict:
      dnscStatus === "confirmed"
        ? "pass"
        : dnscStatus === "submitted"
          ? "partial"
          : dnscStatus === "in-progress"
            ? "partial"
            : "fail",
    detail:
      dnscStatus === "confirmed"
        ? "Înregistrarea DNSC este confirmată."
        : dnscStatus === "submitted"
          ? "Înregistrarea DNSC este depusă, în așteptare confirmare."
          : dnscStatus === "in-progress"
            ? "Procesul de înregistrare DNSC este în curs."
            : "Înregistrarea DNSC nu a fost inițiată. Înregistrarea tardivă este preferabilă lipsei totale de acțiune.",
    legalRef: "Legea 58/2023 Art. 28 — Înregistrare operatori",
    critical: dnscStatus === "not-started",
  })

  // 2. Evaluare maturitate cibernetică
  const hasAssessment = nis2.assessment !== null
  const assessmentScore = nis2.assessment?.score ?? 0
  checks.push({
    id: "nis2-maturity",
    topic: "Evaluare maturitate cibernetică",
    description: "Nivelul de maturitate cibernetică trebuie evaluat și documentat.",
    verdict: !hasAssessment ? "fail" : assessmentScore >= 60 ? "pass" : "partial",
    detail: !hasAssessment
      ? "Nicio evaluare de maturitate cibernetică efectuată."
      : `Scor maturitate: ${assessmentScore}% — ${assessmentScore >= 60 ? "nivel acceptabil" : "nivel insuficient"}.`,
    evidence: hasAssessment ? `Evaluare completată: ${assessmentScore}%` : "Evaluare lipsă",
    legalRef: "NIS2 Art. 21 — Măsuri de securitate",
    critical: !hasAssessment,
  })

  // 3. Incidente deschise / depășite deadline
  const openIncidents = (nis2.incidents ?? []).filter((i) => i.status !== "closed")
  const overdueIncidents = openIncidents.filter(
    (i) => new Date(i.deadline24hISO).getTime() < Date.now()
  )
  checks.push({
    id: "nis2-incidents",
    topic: "Raportare incidente de securitate",
    description: "Incidentele trebuie raportate la DNSC în 24h (notificare inițială).",
    verdict:
      overdueIncidents.length > 0
        ? "fail"
        : openIncidents.length > 0
          ? "partial"
          : "pass",
    detail:
      overdueIncidents.length > 0
        ? `${overdueIncidents.length} incident${overdueIncidents.length > 1 ? "e" : ""} cu deadline depășit — risc de neconformitate NIS2.`
        : openIncidents.length > 0
          ? `${openIncidents.length} incident${openIncidents.length > 1 ? "e" : ""} deschise, în termen.`
          : "Niciun incident deschis sau neraportit.",
    legalRef: "NIS2 Art. 23 — Obligații de raportare",
    critical: overdueIncidents.length > 0,
  })

  // 4. Registru furnizori (vendor risk)
  const hasVendors = (nis2.vendors ?? []).length > 0
  checks.push({
    id: "nis2-vendor-risk",
    topic: "Registru riscuri furnizori",
    description: "NIS2 impune evaluarea riscului în lanțul de aprovizionare.",
    verdict: hasVendors ? "pass" : "partial",
    detail: hasVendors
      ? `${nis2.vendors.length} furnizor${nis2.vendors.length > 1 ? "i" : ""} în registrul de risc.`
      : "Registrul de riscuri furnizori este gol — se recomandă completarea.",
    legalRef: "NIS2 Art. 21(2)(d) — Securitatea lanțului de aprovizionare",
    critical: false,
  })

  return checks
}

// ── EU AI Act Checks ───────────────────────────────────────────────────────────

function checkAiAct(state: ComplianceState, applicable: boolean): InspectorCheck[] {
  if (!applicable) {
    return [
      {
        id: "ai-na",
        topic: "EU AI Act — Aplicabilitate",
        description: "Organizația nu utilizează sisteme AI cu risc ridicat.",
        verdict: "na",
        detail: "EU AI Act nu generează obligații specifice pentru această organizație.",
        critical: false,
      },
    ]
  }

  const aiSystems = state.aiSystems ?? []
  const highRiskSystems = aiSystems.filter((s) => s.riskLevel === "high")
  const noHumanReview = aiSystems.filter((s) => !s.hasHumanReview)
  const checks: InspectorCheck[] = []

  // 1. Inventar sisteme AI
  checks.push({
    id: "ai-inventory",
    topic: "Inventar sisteme AI",
    description: "Toate sistemele AI utilizate trebuie inventariate.",
    verdict: aiSystems.length > 0 ? "pass" : "partial",
    detail:
      aiSystems.length > 0
        ? `${aiSystems.length} sistem${aiSystems.length > 1 ? "e" : ""} AI inventariat${aiSystems.length > 1 ? "e" : ""}.`
        : "Niciun sistem AI inventariat — completați inventarul dacă utilizați AI.",
    evidence: aiSystems.length > 0 ? `${aiSystems.length} sisteme înregistrate` : "Inventar gol",
    legalRef: "EU AI Act Art. 49 — Înregistrare sisteme",
    critical: false,
  })

  // 2. Supraveghere umană sisteme risc ridicat
  if (highRiskSystems.length > 0) {
    const highNoReview = noHumanReview.filter((s) => s.riskLevel === "high")
    checks.push({
      id: "ai-human-oversight",
      topic: "Supraveghere umană sisteme risc ridicat",
      description: "Sistemele AI cu risc ridicat necesită supraveghere umană obligatorie.",
      verdict: highNoReview.length === 0 ? "pass" : "fail",
      detail:
        highNoReview.length === 0
          ? `Toate cele ${highRiskSystems.length} sisteme cu risc ridicat au supraveghere umană.`
          : `${highNoReview.length} sistem${highNoReview.length > 1 ? "e" : ""} cu risc ridicat fără supraveghere umană.`,
      evidence:
        highNoReview.length > 0
          ? highNoReview
              .slice(0, 3)
              .map((s) => s.name)
              .join(", ")
          : "Supraveghere configurată",
      legalRef: "EU AI Act Art. 14 — Supraveghere umană",
      critical: highNoReview.length > 0,
    })
  }

  // 3. Sisteme detectate neconfirmate
  const unconfirmedDetected = (state.detectedAISystems ?? []).filter(
    (s) => s.detectionStatus !== "confirmed"
  )
  if (unconfirmedDetected.length > 0) {
    checks.push({
      id: "ai-unconfirmed",
      topic: "Sisteme AI detectate neconfirmate",
      description: "Sistemele AI detectate automat trebuie confirmate sau respinse.",
      verdict: "partial",
      detail: `${unconfirmedDetected.length} sistem${unconfirmedDetected.length > 1 ? "e" : ""} AI detectate necesită revizie manuală.`,
      evidence: "Revizie manuală necesară",
      critical: false,
    })
  }

  return checks
}

// ── e-Factura Checks ───────────────────────────────────────────────────────────

function checkEFactura(state: ComplianceState, applicable: boolean): InspectorCheck[] {
  if (!applicable) {
    return [
      {
        id: "efactura-na",
        topic: "e-Factura — Aplicabilitate",
        description: "Obligația e-Factura nu se aplică acestei organizații.",
        verdict: "na",
        detail: "e-Factura nu este obligatorie sau nu a fost configurată.",
        critical: false,
      },
    ]
  }

  const checks: InspectorCheck[] = []

  // 1. Conexiune SPV ANAF
  checks.push({
    id: "efactura-connection",
    topic: "Integrare SPV ANAF activă",
    description: "Conexiunea la SPV ANAF trebuie să fie activă pentru monitorizare fiscală.",
    verdict: state.efacturaConnected ? "pass" : "fail",
    detail: state.efacturaConnected
      ? "Integrarea SPV ANAF este activă."
      : "Integrarea SPV ANAF nu este configurată — semnalele de risc fiscal nu sunt monitorizate.",
    evidence: state.efacturaConnected ? "Conectat și activ" : "Integrare lipsă",
    legalRef: "ANAF — Ordinul 2.803/2022 e-Factura RO",
    critical: !state.efacturaConnected,
  })

  // 2. Semnale de risc nerezolvate
  if (state.efacturaConnected && state.efacturaSignalsCount > 0) {
    const efacturaFindings = (state.findings ?? []).filter(
      (f) => f.category === "E_FACTURA" && f.severity === "critical"
    )
    checks.push({
      id: "efactura-signals",
      topic: "Facturi respinse / nesincronizate",
      description: "Facturile respinse sau nepreluate de SPV reprezintă risc de conformitate fiscală.",
      verdict: efacturaFindings.length > 0 ? "fail" : "partial",
      detail: `${state.efacturaSignalsCount} semnal${state.efacturaSignalsCount > 1 ? "e" : ""} de risc e-Factura active — necesită remediere.`,
      evidence: `${state.efacturaSignalsCount} semnale nerezolvate`,
      legalRef: "Legea 139/2022 — e-Factura România",
      critical: efacturaFindings.length > 0,
    })
  } else if (state.efacturaConnected) {
    checks.push({
      id: "efactura-signals",
      topic: "Semnale de risc fiscal",
      description: "Monitorizarea semnalelor de risc fiscal e-Factura.",
      verdict: "pass",
      detail: "Nicio factură respinsă sau problematică detectată.",
      evidence: "Toate facturile procesate",
      critical: false,
    })
  }

  return checks
}

// ── Main simulation function ──────────────────────────────────────────────────

export function runInspectorSimulation(
  state: ComplianceState,
  nis2State: Nis2OrgState,
  nowISO: string
): InspectorSimulationResult {
  const applicability = state.applicability
  const tags = applicability?.tags ?? []

  const nis2Applicable = tags.includes("nis2")
  const aiActApplicable = state.aiSystems.length > 0 || state.highRisk > 0 || state.lowRisk > 0
  const efacturaApplicable = tags.includes("efactura") || state.efacturaConnected || state.efacturaSignalsCount > 0

  const gdprChecks = checkGdpr(state)
  const nis2Checks = checkNis2(state, nis2State, nis2Applicable)
  const aiChecks = checkAiAct(state, aiActApplicable)
  const efacturaChecks = checkEFactura(state, efacturaApplicable)

  const frameworks: InspectorFrameworkResult[] = [
    {
      framework: "GDPR",
      verdict: frameworkVerdict(gdprChecks),
      score: frameworkScore(gdprChecks),
      checks: gdprChecks,
      applicable: true,
    },
    {
      framework: "NIS2",
      verdict: frameworkVerdict(nis2Checks),
      score: frameworkScore(nis2Checks),
      checks: nis2Checks,
      applicable: nis2Applicable,
    },
    {
      framework: "EU AI Act",
      verdict: frameworkVerdict(aiChecks),
      score: frameworkScore(aiChecks),
      checks: aiChecks,
      applicable: aiActApplicable,
    },
    {
      framework: "e-Factura",
      verdict: frameworkVerdict(efacturaChecks),
      score: frameworkScore(efacturaChecks),
      checks: efacturaChecks,
      applicable: efacturaApplicable,
    },
  ]

  const criticalGaps = frameworks
    .flatMap((f) => f.checks)
    .filter((c) => c.verdict === "fail" && c.critical)

  // Weighted score: GDPR 40%, NIS2 30%, AI Act 20%, e-Factura 10%
  const weights = [0.4, 0.3, 0.2, 0.1]
  const readinessScore = Math.round(
    frameworks.reduce((sum, f, i) => sum + f.score * (weights[i] ?? 0.25), 0)
  )

  const hasCriticalFail = criticalGaps.length > 0
  const hasAnyFail = frameworks.some((f) => f.verdict === "fail")
  const overallVerdict: InspectorOverallVerdict = hasCriticalFail
    ? "not-ready"
    : hasAnyFail
      ? "partial"
      : "ready"

  const summary =
    overallVerdict === "ready"
      ? "Organizația pare pregătită pentru un control extern. Nicio problemă critică identificată."
      : overallVerdict === "partial"
        ? `${criticalGaps.length === 0 ? "Lacune minore" : `${criticalGaps.length} probleme critice`} identificate. Adresați-le înainte de un control extern.`
        : `${criticalGaps.length} probleme critice nesoluționate. Un control extern ar evidenția neconformitate semnificativă.`

  return {
    simulatedAt: nowISO,
    overallVerdict,
    readinessScore,
    frameworks,
    criticalGaps,
    summary,
  }
}
