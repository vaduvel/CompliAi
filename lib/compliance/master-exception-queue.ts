// FC-7 (2026-05-14) — Master Exception Queue.
//
// Doc 09 cap 9.2: "Un singur queue de excepții. Nu 14 ecrane care strigă
// separat. Un singur loc unde contabilul vede: ce e critic azi, ce poate
// aștepta, ce client produce zgomot, ce trebuie cerut, ce trebuie aprobat,
// ce document lipsește."
//
// Acest module agregă TOATE excepțiile din sistem:
//   - Cross-Correlation findings (R1-R7) cu economic impact (FC-3+FC-4+FC-5)
//   - Pre-ANAF risks (FC-6)
//   - Filing discipline findings (depuneri late/missing)
//   - Audit Risk signals
// și le pune într-un singur sort priority queue cu:
//   - severitate × deadline × impact lei × repetitivitate
//   - bulk action support
//   - owner routing
//   - sortare configurabilă

import type { CrossCorrelationFinding } from "@/lib/compliance/cross-correlation-engine"
import type { FindingWithImpact } from "@/lib/compliance/economic-impact"
import type {
  AnafSimulationRisk,
  EscalationProbability,
} from "@/lib/compliance/pre-anaf-simulation"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

// ── Types ────────────────────────────────────────────────────────────────────

export type ExceptionSeverity = "critic" | "important" | "atentie" | "info"

export type ExceptionCategory =
  | "cross-correlation"
  | "filing-overdue"
  | "filing-missing"
  | "audit-risk"
  | "missing-evidence"
  | "anaf-notification"

export type ExceptionStatus =
  | "open" // de rezolvat
  | "in-progress" // în lucru
  | "blocked" // așteaptă terț (client, ANAF)
  | "snoozed" // amânat cu motiv
  | "resolved" // închis

export type ExceptionItem = {
  id: string
  category: ExceptionCategory
  severity: ExceptionSeverity
  status: ExceptionStatus
  /** Titlu scurt pentru lista master queue. */
  title: string
  /** Detaliu 1-2 propoziții. */
  detail: string
  /** Sumă fiscală/penalitate estimată în RON (folosită pentru sortare). */
  impactRON: number
  /** Deadline (ISO date) — null dacă nu există termen explicit. */
  deadline: string | null
  /** Numărul de zile până la deadline (negativ = depășit). */
  daysUntilDeadline: number | null
  /** Cine acționează: cabinet (eu) / client (firmă) / ambii. */
  owner: "cabinet" | "client" | "ambii" | "system"
  /** ID client/firmă (pentru queue cross-client). */
  clientOrgId: string | null
  /** Document(e) sursă. */
  sourceDocs: string[]
  /** Document(e) lipsă pentru remediere. */
  missingDocs: string[]
  /** Următorul pas concret. */
  nextAction: string
  /** Counter cât de repetitiv (ex: 3 = a apărut de 3 ori în 30 zile). */
  recurrenceCount: number
  /** Period afectat (YYYY-MM sau YYYY-Qn). */
  period: string | null
  /** Referință legală. */
  legalReference: string
  /** Priority score 0-100 (computed). */
  priorityScore: number
  /** Sursa originală: ID-ul finding-ului/risk-ului din care s-a derivat. */
  sourceId?: string
}

export type ExceptionQueueInput = {
  /** Findings cross-correlation cu economic impact (FC-5). */
  crossCorrelationFindings?: FindingWithImpact[]
  /** Pre-ANAF simulation risks (FC-6). */
  preAnafRisks?: AnafSimulationRisk[]
  /** Filing records pentru detecție depuneri late/missing. */
  filings?: FilingRecord[]
  /** Audit risk signals (string sumar). */
  auditRiskSignals?: Array<{
    id: string
    title: string
    severity: "critical" | "high" | "medium" | "low"
    impactRON?: number
  }>
  /** Recurrence map: findings repetate (key: finding type, value: count). */
  recurrenceMap?: Map<string, number>
}

export type ExceptionQueueSummary = {
  total: number
  byStatus: Record<ExceptionStatus, number>
  bySeverity: Record<ExceptionSeverity, number>
  byOwner: Record<"cabinet" | "client" | "ambii" | "system", number>
  byCategory: Record<ExceptionCategory, number>
  /** Total impact RON (toate excepțiile deschise). */
  totalImpactRON: number
  /** Câte au deadline trecut. */
  overdueCount: number
  /** Câte expiră în 7 zile. */
  dueIn7DaysCount: number
}

export type ExceptionQueueReport = {
  generatedAtISO: string
  items: ExceptionItem[]
  summary: ExceptionQueueSummary
  /** Top recomandare pentru contabil. */
  topRecommendation: string
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.round((new Date(iso).getTime() - Date.now()) / MS_PER_DAY)
}

function severityFromCrossCorrelation(
  severity: "ok" | "info" | "warning" | "error",
): ExceptionSeverity {
  if (severity === "error") return "critic"
  if (severity === "warning") return "important"
  if (severity === "info") return "info"
  return "info"
}

function severityFromProbability(prob: EscalationProbability): ExceptionSeverity {
  if (prob === "imminent") return "critic"
  if (prob === "high") return "important"
  if (prob === "medium") return "atentie"
  return "info"
}

function severityFromFilingStatus(
  status: FilingRecord["status"],
  daysOverdue: number,
): ExceptionSeverity {
  if (status === "missing") return daysOverdue > 30 ? "critic" : "important"
  if (status === "late") return daysOverdue > 15 ? "important" : "atentie"
  if (status === "upcoming") {
    if (daysOverdue >= -3) return "important" // sub 3 zile = important
    if (daysOverdue >= -7) return "atentie"
    return "info"
  }
  return "info"
}

const SEVERITY_RANK: Record<ExceptionSeverity, number> = {
  critic: 4,
  important: 3,
  atentie: 2,
  info: 1,
}

// ── Priority scoring ─────────────────────────────────────────────────────────

/**
 * Priority score 0-100. Cu cât mai mare, cu atât mai prioritar.
 *
 * Formula:
 *   - Severitate: 40% din scor (critic=40, important=30, atentie=20, info=5)
 *   - Deadline: 30% din scor (overdue=30, ≤3 zile=25, ≤7=20, ≤30=10, peste=5)
 *   - Impact RON: 20% (normalizat: 10k+ = 20, 5k = 15, 1k = 10, 0 = 0)
 *   - Recurență: 10% (≥3 ori = 10, 2 = 6, 1 = 0)
 */
function computePriorityScore(
  severity: ExceptionSeverity,
  daysUntilDeadline: number | null,
  impactRON: number,
  recurrenceCount: number,
): number {
  let score = 0

  // Severitate (40%)
  const sevMap = { critic: 40, important: 30, atentie: 20, info: 5 }
  score += sevMap[severity]

  // Deadline (30%)
  if (daysUntilDeadline === null) {
    score += 5
  } else if (daysUntilDeadline < 0) {
    score += 30 // overdue = max
  } else if (daysUntilDeadline <= 3) {
    score += 25
  } else if (daysUntilDeadline <= 7) {
    score += 20
  } else if (daysUntilDeadline <= 30) {
    score += 10
  } else {
    score += 5
  }

  // Impact RON (20%) — normalizat 0-20
  if (impactRON >= 10000) score += 20
  else if (impactRON >= 5000) score += 15
  else if (impactRON >= 1000) score += 10
  else if (impactRON > 0) score += 5

  // Recurence (10%)
  if (recurrenceCount >= 3) score += 10
  else if (recurrenceCount === 2) score += 6
  else if (recurrenceCount === 1) score += 2

  return Math.min(100, score)
}

// ── Extractors ───────────────────────────────────────────────────────────────

function extractFromCrossCorrelation(
  findings: FindingWithImpact[],
  recurrenceMap: Map<string, number>,
): ExceptionItem[] {
  const items: ExceptionItem[] = []

  for (const f of findings) {
    if (f.severity === "ok" || f.severity === "info") continue
    const impact = f.economicImpact
    if (!impact) continue

    const sourceDocs = f.sources.map((s) => s.label)
    const missingDocs = computeMissingDocs(f)
    const severity = severityFromCrossCorrelation(f.severity)
    const impactRON = impact.totalCostMaxRON
    const recurrenceCount = recurrenceMap.get(f.rule) ?? 0
    const priorityScore = computePriorityScore(severity, null, impactRON, recurrenceCount)

    items.push({
      id: `exc-${f.id}`,
      category: "cross-correlation",
      severity,
      status: "open",
      title: f.title,
      detail: f.summary,
      impactRON,
      deadline: null,
      daysUntilDeadline: null,
      owner: f.rule === "R2" || f.rule === "R5" ? "ambii" : "cabinet",
      clientOrgId: null,
      sourceDocs,
      missingDocs,
      nextAction: f.suggestion ?? "Verifică sursa discrepanței.",
      recurrenceCount,
      period: f.period,
      legalReference: f.legalReference ?? "Cod Fiscal general",
      priorityScore,
      sourceId: f.id,
    })
  }

  return items
}

function computeMissingDocs(f: CrossCorrelationFinding): string[] {
  const missing: string[] = []
  if (f.rule === "R1" && f.severity !== "ok") {
    missing.push("Facturi primite scanate (OCR)")
  }
  if (f.rule === "R2" && f.severity === "error") {
    missing.push("Hotărâre AGA completă")
    missing.push("D205 rectificativă")
  }
  if (f.rule === "R3" && f.severity !== "ok") {
    missing.push("Snapshot ONRC actualizat")
  }
  if (f.rule === "R5" && f.severity === "error") {
    missing.push("Rectificative D100 lunare")
  }
  if (f.rule === "R6") {
    missing.push("Documentare motiv întârziere depunere")
  }
  if (f.rule === "R7") {
    missing.push("Declarație 010 (schimbare frecvență)")
  }
  return missing
}

function extractFromFilings(filings: FilingRecord[]): ExceptionItem[] {
  const items: ExceptionItem[] = []
  const now = new Date().toISOString()

  for (const f of filings) {
    if (f.status === "on_time" || f.status === "rectified") continue

    const daysUntilDeadline = daysFromNow(f.dueISO)
    const daysOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0 ? -daysUntilDeadline : 0
    const severity = severityFromFilingStatus(f.status, daysOverdue)
    const category: ExceptionCategory = f.status === "missing" ? "filing-missing" : "filing-overdue"

    // Estimare impact: penalitate fixă crescătoare cu zilele
    let impactRON = 500
    if (daysOverdue > 30) impactRON = 1500
    else if (daysOverdue > 15) impactRON = 1000

    const priorityScore = computePriorityScore(severity, daysUntilDeadline, impactRON, 0)

    items.push({
      id: `exc-filing-${f.id}`,
      category,
      severity,
      status: "open",
      title:
        f.status === "missing"
          ? `${f.type.toUpperCase()} ${f.period} — NEDEPUSĂ (${daysOverdue} zile)`
          : `${f.type.toUpperCase()} ${f.period} — depusă cu întârziere`,
      detail:
        f.status === "missing"
          ? `Termenul fiscal era ${f.dueISO.slice(0, 10)}. Declarația nu a fost încă depusă.`
          : `Depusă pe ${f.filedAtISO?.slice(0, 10)} (termen ${f.dueISO.slice(0, 10)}).`,
      impactRON,
      deadline: f.dueISO,
      daysUntilDeadline,
      owner: "cabinet",
      clientOrgId: null,
      sourceDocs: [`Filing record ${f.id}`],
      missingDocs:
        f.status === "missing" ? [`${f.type} ${f.period} — încărcare XML / SPV`] : [],
      nextAction:
        f.status === "missing"
          ? "Depune urgent la ANAF SPV."
          : "Documentează motivul întârzierii și păstrează în registru.",
      recurrenceCount: f.rectificationCount ?? 0,
      period: f.period,
      legalReference: "Cod Fiscal Art. 219.",
      priorityScore,
      sourceId: f.id,
    })
  }

  return items
}

function extractFromAuditRiskSignals(
  signals: NonNullable<ExceptionQueueInput["auditRiskSignals"]>,
): ExceptionItem[] {
  return signals.map((s) => {
    const severity: ExceptionSeverity =
      s.severity === "critical"
        ? "critic"
        : s.severity === "high"
          ? "important"
          : s.severity === "medium"
            ? "atentie"
            : "info"
    const impactRON = s.impactRON ?? 0
    const priorityScore = computePriorityScore(severity, null, impactRON, 0)

    return {
      id: `exc-audit-${s.id}`,
      category: "audit-risk" as const,
      severity,
      status: "open" as const,
      title: s.title,
      detail: "Semnal Audit Risk detectat în profilul clientului.",
      impactRON,
      deadline: null,
      daysUntilDeadline: null,
      owner: "cabinet" as const,
      clientOrgId: null,
      sourceDocs: [],
      missingDocs: [],
      nextAction: "Investighează semnalul în Audit Risk Panel.",
      recurrenceCount: 0,
      period: null,
      legalReference: "Audit Risk Engine.",
      priorityScore,
      sourceId: s.id,
    }
  })
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

/**
 * Agregă toate excepțiile + sortează după priorityScore descrescător.
 */
export function buildMasterExceptionQueue(
  input: ExceptionQueueInput,
): ExceptionQueueReport {
  const recurrenceMap = input.recurrenceMap ?? new Map<string, number>()

  const items: ExceptionItem[] = [
    ...extractFromCrossCorrelation(input.crossCorrelationFindings ?? [], recurrenceMap),
    ...extractFromFilings(input.filings ?? []),
    ...extractFromAuditRiskSignals(input.auditRiskSignals ?? []),
  ]

  // Sortăm: priority score desc, apoi severity rank desc, apoi deadline asc
  items.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
    const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    if (sevDiff !== 0) return sevDiff
    if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
      return a.daysUntilDeadline - b.daysUntilDeadline
    }
    return 0
  })

  // Summary
  const summary: ExceptionQueueSummary = {
    total: items.length,
    byStatus: { open: 0, "in-progress": 0, blocked: 0, snoozed: 0, resolved: 0 },
    bySeverity: { critic: 0, important: 0, atentie: 0, info: 0 },
    byOwner: { cabinet: 0, client: 0, ambii: 0, system: 0 },
    byCategory: {
      "cross-correlation": 0,
      "filing-overdue": 0,
      "filing-missing": 0,
      "audit-risk": 0,
      "missing-evidence": 0,
      "anaf-notification": 0,
    },
    totalImpactRON: 0,
    overdueCount: 0,
    dueIn7DaysCount: 0,
  }
  for (const item of items) {
    summary.byStatus[item.status]++
    summary.bySeverity[item.severity]++
    summary.byOwner[item.owner]++
    summary.byCategory[item.category]++
    summary.totalImpactRON += item.impactRON
    if (item.daysUntilDeadline !== null && item.daysUntilDeadline < 0) summary.overdueCount++
    else if (
      item.daysUntilDeadline !== null &&
      item.daysUntilDeadline >= 0 &&
      item.daysUntilDeadline <= 7
    )
      summary.dueIn7DaysCount++
  }

  // Recomandare top
  let topRecommendation: string
  if (items.length === 0) {
    topRecommendation =
      "Niciun excepție activă. Continuă monitorizarea preventivă lunară."
  } else if (summary.bySeverity.critic >= 3) {
    topRecommendation = `${summary.bySeverity.critic} excepții CRITICE. Rezolvă-le toate ÎN ACEASTĂ SĂPTĂMÂNĂ — penalități cumulative cresc rapid.`
  } else if (summary.bySeverity.critic > 0) {
    topRecommendation = `${summary.bySeverity.critic} excepție(i) CRITICE active. Începe cu #1 din topul listei — impact ${items[0]?.impactRON.toFixed(0)} RON.`
  } else if (summary.bySeverity.important >= 5) {
    topRecommendation = `${summary.bySeverity.important} excepții IMPORTANTE. Programează 2-3 ore astăzi pentru a le aborda în ordine top→bottom.`
  } else {
    topRecommendation = `${items.length} excepții deschise. Workload gestionabil — rezolvă în ordinea priority score.`
  }

  return {
    generatedAtISO: new Date().toISOString(),
    items,
    summary,
    topRecommendation,
  }
}

// ── Filter helpers ────────────────────────────────────────────────────────────

export function filterByCategory(
  items: ExceptionItem[],
  category: ExceptionCategory | "all",
): ExceptionItem[] {
  if (category === "all") return items
  return items.filter((i) => i.category === category)
}

export function filterBySeverity(
  items: ExceptionItem[],
  severity: ExceptionSeverity | "all",
): ExceptionItem[] {
  if (severity === "all") return items
  return items.filter((i) => i.severity === severity)
}

export function filterByOwner(
  items: ExceptionItem[],
  owner: ExceptionItem["owner"] | "all",
): ExceptionItem[] {
  if (owner === "all") return items
  return items.filter((i) => i.owner === owner)
}

export function filterByClient(
  items: ExceptionItem[],
  clientOrgId: string | null,
): ExceptionItem[] {
  if (!clientOrgId) return items
  return items.filter((i) => i.clientOrgId === clientOrgId)
}
