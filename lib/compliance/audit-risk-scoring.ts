// F#1 — Predictive Audit Risk Scoring (Sprint 8-9 - 2026-05-11).
//
// Pain: contabilii nu pot prezice care din clienții lor riscă audit ANAF.
// IRS folosește DIF (Discriminant Function) din 1969. Aici facem un MVP
// rule-based cu CECCAR Art. 14 explainability — fiecare punctaj e motivat.
//
// Score 0-100 (mai mare = risc audit mai mare).
// Phase 2: Transformers.js / Brain.js pe pattern istoric per client.
//
// Pure functions. Nu mutează state.

import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import { computeFilingDisciplineScore } from "@/lib/compliance/filing-discipline"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

export type RiskCategory = "low" | "medium" | "high" | "critical"

export type RiskFactor = {
  /** ID stabil pentru UI keying. */
  id: string
  /** Etichetă scurtă afișată în breakdown. */
  label: string
  /** Categorie pentru grupare (filing, etva, efactura, findings, hygiene, anomalies). */
  category: "filing" | "etva" | "efactura" | "findings" | "hygiene" | "anomalies"
  /** Greutatea max pe care factorul o poate aduce. */
  weight: number
  /** Cât a contribuit la scor (0..weight). */
  contribution: number
  /** Explicație în română — citată în CECCAR Art. 14 disclaimer. */
  reason: string
  /** Recomandare actionable pentru cabinet. */
  recommendation?: string
  /** "high" | "medium" | "low" severitate factorului individual. */
  severity: "high" | "medium" | "low"
}

export type AuditRiskResult = {
  /** Scor agregat 0-100. */
  score: number
  category: RiskCategory
  /** Top-3 contribuții — folosit în alerts. */
  topContributors: RiskFactor[]
  /** Toate factorii (sortați descrescător după contribuție). */
  factors: RiskFactor[]
  /** Summary text generat pentru afișare. */
  summary: string
  /** ISO timestamp scorare. */
  scoredAtISO: string
  /** Disclaimer CECCAR (informativ). */
  ceccarDisclaimer: string
}

export type AuditRiskInput = {
  /** Stare org (din mvp-store). */
  state: Pick<
    ComplianceState,
    | "findings"
    | "efacturaSignalsCount"
    | "efacturaConnected"
    | "efacturaSyncedAtISO"
    | "efacturaValidations"
    | "alerts"
  >
  /** Filings (din persistent-fiscal-store sau test fixture). */
  filingRecords?: FilingRecord[]
  /** Discrepanțe e-TVA. */
  etvaDiscrepancies?: ETVADiscrepancy[]
  /** Semnale e-Factura deschise (din state.efacturaSignalsCount sau hardening tracker). */
  openEfacturaSignalCount?: number
  /** Acum (default: new Date().toISOString()). */
  nowISO?: string
}

const MS_PER_DAY = 86_400_000

const CECCAR_DISCLAIMER =
  "Scor informativ generat din evidențele actuale. NU înlocuiește analiza profesională — CECCAR Art. 14: judecata contabilă rămâne în responsabilitatea cabinetului. Folosește scorul pentru prioritizare clienți, nu pentru decizii fiscale automate."

// ── Helpers ──────────────────────────────────────────────────────────────────

function categorize(score: number): RiskCategory {
  if (score >= 76) return "critical"
  if (score >= 51) return "high"
  if (score >= 26) return "medium"
  return "low"
}

function severityFromContribution(contribution: number, weight: number): RiskFactor["severity"] {
  const ratio = contribution / weight
  if (ratio >= 0.75) return "high"
  if (ratio >= 0.35) return "medium"
  return "low"
}

// ── Individual factor evaluators ─────────────────────────────────────────────

function evalFilingDiscipline(filingRecords: FilingRecord[]): RiskFactor {
  const weight = 20
  const score = computeFilingDisciplineScore(filingRecords)
  // Discipline 100 = no risk, 0 = max risk
  const contribution = Math.round(((100 - score.score) / 100) * weight)
  const detail =
    score.total === 0
      ? "Nicio depunere înregistrată — folosește calendar fiscal pentru a urmări declarațiile."
      : `${score.late} cu întârziere, ${score.missing} lipsă, ${score.rectified} rectificate din ${score.total} depuneri.`
  return {
    id: "filing-discipline",
    label: "Disciplină declarații (D300/D394/SAF-T)",
    category: "filing",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason: `Scor disciplină ${score.score}/100 (${score.label}). ${detail}`,
    recommendation:
      score.score < 70
        ? "Recuperează declarațiile lipsă (D300/D394) și depune rectificative pentru perioadele cu erori. ANAF prioritizează contribuabilii cu pattern de întârziere."
        : undefined,
  }
}

function evalSaftHygiene(filingRecords: FilingRecord[], nowISO: string): RiskFactor {
  const weight = 15
  const hygiene = computeSAFTHygiene(filingRecords, nowISO)
  const contribution =
    hygiene.totalFilings === 0
      ? 0
      : Math.round(((100 - hygiene.hygieneScore) / 100) * weight)
  const detail =
    hygiene.totalFilings === 0
      ? "Nicio raportare SAF-T în istoricul cabinetului."
      : `${hygiene.missing} D406 lipsă, ${hygiene.late} cu întârziere, ${hygiene.consistencyIssues.length} probleme consistență.`
  return {
    id: "saft-hygiene",
    label: "Igienă SAF-T D406",
    category: "hygiene",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason: `Scor igienă SAF-T ${hygiene.hygieneScore}/100 (${hygiene.hygieneLabel}). ${detail}`,
    recommendation:
      hygiene.totalFilings > 0 && hygiene.hygieneScore < 70
        ? "Rulează verificarea cross-filing (D300 vs D394 vs SAF-T). Rezolvă inconsistențele înainte ca ANAF să le ridice."
        : undefined,
  }
}

function evalEtvaDiscrepancies(
  discrepancies: ETVADiscrepancy[],
  nowISO: string,
): RiskFactor {
  const weight = 20
  if (discrepancies.length === 0) {
    return {
      id: "etva-discrepancies",
      label: "Discrepanțe RO e-TVA",
      category: "etva",
      weight,
      contribution: 0,
      severity: "low",
      reason: "Nicio discrepanță e-TVA detectată în precompletare.",
    }
  }

  const nowMs = new Date(nowISO).getTime()
  let raw = 0
  let critical = 0
  let overdue = 0
  for (const d of discrepancies) {
    if (d.status === "resolved") continue
    const isOverdue =
      d.status === "overdue" ||
      (d.deadlineISO ? new Date(d.deadlineISO).getTime() < nowMs : false)
    if (isOverdue) {
      raw += 6
      overdue++
    } else {
      raw += d.severity === "critical" ? 4 : d.severity === "high" ? 3 : 2
    }
    if (d.severity === "critical") critical++
  }
  const contribution = Math.min(weight, raw)
  return {
    id: "etva-discrepancies",
    label: "Discrepanțe RO e-TVA",
    category: "etva",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason: `${discrepancies.filter((d) => d.status !== "resolved").length} discrepanțe deschise (${critical} critice, ${overdue} cu termen depășit).`,
    recommendation:
      overdue > 0
        ? "URGENT: răspunde la discrepanțele cu termen depășit. ANAF poate emite Decizie de Impunere automată după 30 zile fără răspuns."
        : critical > 0
          ? "Trimite Răspuns 30/90 prin SPV pentru discrepanțele critice. Generează pack-ul de la Drafts în Cockpit."
          : undefined,
  }
}

function evalEfacturaCompliance(
  state: AuditRiskInput["state"],
  openSignalCount: number | undefined,
  nowISO: string,
): RiskFactor {
  const weight = 15
  let raw = 0
  const reasons: string[] = []

  // Not connected
  if (!state.efacturaConnected) {
    raw += 6
    reasons.push("integrare e-Factura ANAF neconectată")
  }

  // Sync gap > 30 days
  if (state.efacturaSyncedAtISO) {
    const syncMs = new Date(state.efacturaSyncedAtISO).getTime()
    const daysSinceSync = Math.floor((new Date(nowISO).getTime() - syncMs) / MS_PER_DAY)
    if (daysSinceSync > 30) {
      raw += 3
      reasons.push(`ultima sincronizare ${daysSinceSync} zile`)
    } else if (daysSinceSync > 14) {
      raw += 1
    }
  } else if (state.efacturaConnected) {
    raw += 2
    reasons.push("nicio sincronizare înregistrată")
  }

  // Open signals (respins/eroare/blocat)
  const effectiveSignals = openSignalCount ?? state.efacturaSignalsCount
  if (effectiveSignals > 0) {
    raw += Math.min(6, effectiveSignals)
    reasons.push(`${effectiveSignals} semnale e-Factura deschise (respins/eroare/blocat)`)
  }

  // Validări recente eșuate
  const cutoff = new Date(nowISO).getTime() - 30 * MS_PER_DAY
  const recentFailedValidations = state.efacturaValidations.filter(
    (v) => !v.valid && new Date(v.createdAtISO).getTime() > cutoff,
  ).length
  if (recentFailedValidations > 0) {
    raw += Math.min(3, recentFailedValidations)
    reasons.push(`${recentFailedValidations} validări XML eșuate în ultimele 30 zile`)
  }

  const contribution = Math.min(weight, raw)
  return {
    id: "efactura-compliance",
    label: "Conformitate e-Factura SPV",
    category: "efactura",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason:
      reasons.length === 0
        ? "Integrare e-Factura sincronizată, fără semnale critice."
        : `Probleme detectate: ${reasons.join("; ")}.`,
    recommendation:
      contribution >= weight * 0.5
        ? "Conectează integrarea ANAF (cert SPV activ) + rezolvă semnalele deschise. e-Factura ratată = amendă conform OUG 13/2026."
        : undefined,
  }
}

function evalFindings(findings: ScanFinding[]): RiskFactor {
  const weight = 10
  if (findings.length === 0) {
    return {
      id: "scan-findings",
      label: "Findings open din scanări",
      category: "findings",
      weight,
      contribution: 0,
      severity: "low",
      reason: "Niciun finding deschis în scanare.",
    }
  }

  const open = findings.filter(
    (f) => f.findingStatus !== "resolved" && f.findingStatus !== "dismissed",
  )
  let raw = 0
  let critical = 0
  let high = 0
  for (const f of open) {
    if (f.severity === "critical") {
      raw += 2
      critical++
    } else if (f.severity === "high") {
      raw += 1
      high++
    } else if (f.severity === "medium") {
      raw += 0.5
    } else {
      raw += 0.2
    }
  }
  const contribution = Math.min(weight, Math.round(raw))
  return {
    id: "scan-findings",
    label: "Findings open din scanări",
    category: "findings",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason: `${open.length} findings deschise (${critical} critice, ${high} severitate high).`,
    recommendation:
      critical > 0
        ? "Atribuie owners pe findings critice și rezolvă-le în secțiunea De rezolvat — risc audit direct."
        : open.length > 5
          ? "Prioritizează closure pe findings high — backlog mare semnalează lipsa de igienă fiscală."
          : undefined,
  }
}

function evalAlertVolume(
  alerts: AuditRiskInput["state"]["alerts"],
  nowISO: string,
): RiskFactor {
  const weight = 10
  const nowMs = new Date(nowISO).getTime()
  const recentAlerts = alerts.filter(
    (a) => a.open && new Date(a.createdAtISO).getTime() > nowMs - 30 * MS_PER_DAY,
  )
  const critical = recentAlerts.filter((a) => a.severity === "critical").length
  const high = recentAlerts.filter((a) => a.severity === "high").length
  const medium = recentAlerts.filter((a) => a.severity === "medium").length
  const raw = Math.min(weight, critical * 3 + high * 2 + medium * 0.5)
  const contribution = Math.round(raw)
  return {
    id: "recent-alerts",
    label: "Alerte deschise (30 zile)",
    category: "anomalies",
    weight,
    contribution,
    severity: severityFromContribution(contribution, weight),
    reason:
      recentAlerts.length === 0
        ? "Fără alerte deschise în ultimele 30 zile."
        : `${recentAlerts.length} alerte open (${critical} critice, ${high} high, ${medium} medium).`,
    recommendation:
      critical + high >= 3
        ? "Volum mare de alerte critice/high — investighează pattern (drift, semnale ANAF, schimbări legislative)."
        : undefined,
  }
}

// ── Main scorer ──────────────────────────────────────────────────────────────

/**
 * Compute predictive audit risk score for an organization based on
 * the current compliance state + filings + e-TVA + e-Factura signals.
 *
 * Returns explainable factor breakdown (CECCAR Art. 14 friendly).
 */
export function computeAuditRiskScore(input: AuditRiskInput): AuditRiskResult {
  const nowISO = input.nowISO ?? new Date().toISOString()
  const filings = input.filingRecords ?? []
  const discrepancies = input.etvaDiscrepancies ?? []

  const factors: RiskFactor[] = [
    evalFilingDiscipline(filings),
    evalSaftHygiene(filings, nowISO),
    evalEtvaDiscrepancies(discrepancies, nowISO),
    evalEfacturaCompliance(input.state, input.openEfacturaSignalCount, nowISO),
    evalFindings(input.state.findings),
    evalAlertVolume(input.state.alerts, nowISO),
  ]

  const totalContribution = factors.reduce((acc, f) => acc + f.contribution, 0)
  const totalWeight = factors.reduce((acc, f) => acc + f.weight, 0)
  // Normalize: contribution / weight * 100 = score 0..100
  const score = Math.round((totalContribution / totalWeight) * 100)
  const category = categorize(score)

  const sortedFactors = [...factors].sort((a, b) => b.contribution - a.contribution)
  const topContributors = sortedFactors.filter((f) => f.contribution > 0).slice(0, 3)

  const summary = buildSummary(score, category, topContributors)

  return {
    score,
    category,
    topContributors,
    factors: sortedFactors,
    summary,
    scoredAtISO: nowISO,
    ceccarDisclaimer: CECCAR_DISCLAIMER,
  }
}

function buildSummary(
  score: number,
  category: RiskCategory,
  top: RiskFactor[],
): string {
  const categoryLabel: Record<RiskCategory, string> = {
    low: "scăzut",
    medium: "moderat",
    high: "ridicat",
    critical: "critic",
  }
  if (top.length === 0) {
    return `Risc audit ANAF ${categoryLabel[category]} (${score}/100). Igienă fiscală foarte bună — fără factori de risc relevanți.`
  }
  const topReasons = top
    .slice(0, 2)
    .map((f) => f.label.toLowerCase())
    .join(" și ")
  return `Risc audit ANAF ${categoryLabel[category]} (${score}/100). Factori dominanți: ${topReasons}.`
}
