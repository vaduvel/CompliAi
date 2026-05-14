// FC-6 (2026-05-14) — Pre-ANAF Simulation Engine.
//
// Doc 09 cap 5: "Momentul wow ideal — Contabilul apasă un singur buton:
//   «Dacă ANAF ar verifica azi clientul ăsta, unde pic prima dată?»"
//
// Acest engine agregă toate sursele de risc (cross-correlation findings +
// audit risk + filing discipline + smart pattern + sequence gap) și produce
// un top N de riscuri ordonate după magnitude EXPUNERE × PROBABILITATE.
//
// Output: AnafSimulationReport cu top 5 riscuri active, fiecare cu:
//   - sumă potențial afectată
//   - probabilitate escalare (low/medium/high)
//   - documente sursă + ce lipsește
//   - ordine optimă de remediere (sortată după impact / efort)
//   - cost evitat dacă rezolvi

import type {
  CrossCorrelationFinding,
  CrossCorrelationReport,
} from "@/lib/compliance/cross-correlation-engine"
import type { FindingWithImpact } from "@/lib/compliance/economic-impact"

// ── Types ────────────────────────────────────────────────────────────────────

export type RiskCategory =
  | "cross-correlation" // findings R1-R7
  | "filing-discipline" // depuneri lipsă/întârziate
  | "audit-risk-signal" // semnale Audit Risk
  | "sequence-gap" // gap în secvențe facturi
  | "recurring-pattern" // pattern repetitiv detectat

export type EscalationProbability = "low" | "medium" | "high" | "imminent"

export type AnafSimulationRisk = {
  /** ID unic pentru risc. */
  id: string
  /** Categorie de risc (cross-corr, filing, etc.). */
  category: RiskCategory
  /** Titlu scurt risc — afișat ca header card. */
  title: string
  /** Detaliu explicativ (1-2 propoziții). */
  detail: string
  /** Sumă expusă în RON (penalitate + manoperă cabinet). */
  exposureRON: { min: number; max: number }
  /** Probabilitate ANAF să escaleze (control / notificare). */
  probability: EscalationProbability
  /** Document(e) care arată problema. */
  sourceDocs: string[]
  /** Document(e) lipsă pentru remediere completă. */
  missingDocs: string[]
  /** Următorul pas concret pentru utilizator. */
  nextAction: string
  /** Cine acționează (cabinet vs client). */
  owner: "cabinet" | "client" | "ambii"
  /** Cost evitat (RON) dacă remediezi în timp util. */
  avoidedCostRON: number
  /** Period afectat (YYYY-MM sau YYYY). */
  period: string | null
  /** Referință legală principală. */
  legalReference: string
  /** Ranking 1-100: cu cât mai mare, cu atât mai prioritar (probabilitate × expunere). */
  rankingScore: number
  /** ID-ul finding-ului sursă (dacă din cross-correlation). */
  sourceId?: string
}

export type AnafSimulationReport = {
  generatedAtISO: string
  /** Întrebarea care a generat raportul. */
  question: string
  /** Top N riscuri active. */
  topRisks: AnafSimulationRisk[]
  /** Sumar agregat al expunerii. */
  summary: {
    totalRisks: number
    totalExposureMinRON: number
    totalExposureMaxRON: number
    totalAvoidedIfResolvedRON: number
    breakdown: {
      imminent: number
      high: number
      medium: number
      low: number
    }
  }
  /** Recomandare strategică top-level. */
  strategicRecommendation: string
}

// ── Probability scoring ──────────────────────────────────────────────────────

/**
 * Determină probabilitatea ANAF să escaleze (controla, notifica) bazat pe:
 * - tipul de risc
 * - severitatea finding-ului
 * - sumă expusă
 */
function scoreProbability(
  category: RiskCategory,
  severity: "error" | "warning" | "info",
  exposureMaxRON: number,
): EscalationProbability {
  // Erori cross-correlation cu sume mari = imminent
  if (severity === "error" && exposureMaxRON > 5000) return "imminent"
  if (severity === "error") return "high"
  if (severity === "warning" && exposureMaxRON > 2000) return "high"
  if (severity === "warning") return "medium"
  return "low"
}

const PROBABILITY_SCORE: Record<EscalationProbability, number> = {
  imminent: 100,
  high: 70,
  medium: 40,
  low: 15,
}

/**
 * Ranking final 1-100 — combinație probabilitate × expunere normalizată.
 */
function computeRanking(
  probability: EscalationProbability,
  exposureMaxRON: number,
): number {
  const probScore = PROBABILITY_SCORE[probability]
  // Normalizăm expunerea pe 0-100 (peste 10.000 RON → 100)
  const exposureScore = Math.min(100, (exposureMaxRON / 10000) * 100)
  // Weighted: 60% probabilitate, 40% expunere
  return Math.round(probScore * 0.6 + exposureScore * 0.4)
}

// ── Risk extractors per category ─────────────────────────────────────────────

/**
 * Convertește findings cross-correlation în AnafSimulationRisk-uri.
 */
function extractCrossCorrelationRisks(
  report: CrossCorrelationReport,
): AnafSimulationRisk[] {
  const findings = report.findings as FindingWithImpact[]
  const risks: AnafSimulationRisk[] = []

  for (const f of findings) {
    if (f.severity === "ok" || f.severity === "info") continue
    const impact = f.economicImpact
    if (!impact) continue

    const sourceDocs = f.sources.map((s) => s.label)
    const missingDocs: string[] = []
    // Inferăm docs lipsă din rule (severitate deja filtrată la warning/error mai sus).
    if (f.rule === "R1") {
      missingDocs.push("Facturi primite scanate complet (OCR)")
    }
    if (f.rule === "R2" && f.severity === "error") {
      missingDocs.push("Hotărâre AGA completă cu toți asociații")
      missingDocs.push("D205 rectificativă cu beneficiarii corecți")
    }
    if (f.rule === "R3") {
      missingDocs.push("Snapshot ONRC actualizat cu cesiunile părților sociale")
    }
    if (f.rule === "R5" && f.severity === "error") {
      missingDocs.push("Rectificative D100 lunare aliniate cu D205 anual")
    }
    if (f.rule === "R6") {
      missingDocs.push("Documentare motiv întârziere (decizie ANAF, indisponibilitate SPV)")
    }
    if (f.rule === "R7") {
      missingDocs.push("Declarație 010 pentru notificare schimbare frecvență TVA")
    }

    const probability = scoreProbability(
      "cross-correlation",
      f.severity as "error" | "warning",
      impact.totalCostMaxRON,
    )
    const ranking = computeRanking(probability, impact.totalCostMaxRON)

    // Determinăm owner: R1/R3/R6/R7 = cabinet, R2/R5 = ambii (cabinet + client decizie)
    const owner: AnafSimulationRisk["owner"] =
      f.rule === "R2" || f.rule === "R5" ? "ambii" : "cabinet"

    risks.push({
      id: `risk-${f.id}`,
      category: "cross-correlation",
      title: f.title,
      detail: f.summary,
      exposureRON: {
        min: impact.totalCostMinRON,
        max: impact.totalCostMaxRON,
      },
      probability,
      sourceDocs,
      missingDocs,
      nextAction: f.suggestion ?? "Verifică manual sursa discrepanței.",
      owner,
      avoidedCostRON: impact.totalCostMaxRON, // dacă remediezi, eviți max
      period: f.period,
      legalReference: f.legalReference ?? impact.legalReferences[0] ?? "Cod Fiscal general",
      rankingScore: ranking,
      sourceId: f.id,
    })
  }

  return risks
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export type PreAnafSimulationInput = {
  crossCorrelationReport: CrossCorrelationReport
  /** [opțional] alte risk extractors viitoare — filing discipline, audit risk, etc. */
}

/**
 * Răspunde la "Dacă ANAF ar verifica azi, unde pici prima dată?".
 * Returnează top N riscuri ordonate după magnitudine.
 */
export function runPreAnafSimulation(
  input: PreAnafSimulationInput,
  options: { topN?: number } = {},
): AnafSimulationReport {
  const topN = options.topN ?? 5

  // Extragem toate riscurile din sursele disponibile
  const allRisks = [...extractCrossCorrelationRisks(input.crossCorrelationReport)]

  // Sortăm după ranking descrescător
  allRisks.sort((a, b) => b.rankingScore - a.rankingScore)

  const topRisks = allRisks.slice(0, topN)

  // Sumar agregat
  let totalExposureMinRON = 0
  let totalExposureMaxRON = 0
  let totalAvoidedIfResolvedRON = 0
  const breakdown = { imminent: 0, high: 0, medium: 0, low: 0 }
  for (const r of allRisks) {
    totalExposureMinRON += r.exposureRON.min
    totalExposureMaxRON += r.exposureRON.max
    totalAvoidedIfResolvedRON += r.avoidedCostRON
    breakdown[r.probability]++
  }

  // Recomandare strategică
  let strategicRecommendation: string
  if (allRisks.length === 0) {
    strategicRecommendation =
      "Niciun risc activ identificat. Continuă monitorizarea preventivă lunar."
  } else if (breakdown.imminent > 0) {
    strategicRecommendation = `${breakdown.imminent} risc(uri) IMINENTE. Rezolvă-le ÎN ACEASTĂ SĂPTĂMÂNĂ pentru a evita penalități cumulative. Începe cu #1 din topul ranking.`
  } else if (breakdown.high > 0) {
    strategicRecommendation = `${breakdown.high} risc(uri) cu probabilitate ÎNALTĂ de escalare. Rezolvă în următoarele 2 săptămâni pentru a evita expunerea maxim ${totalExposureMaxRON.toFixed(0)} RON.`
  } else {
    strategicRecommendation = `Riscuri preventive — fără urgență imediată. Rezolvă în ordine top→bottom pentru a reduce expunere totală ${totalExposureMaxRON.toFixed(0)} RON.`
  }

  return {
    generatedAtISO: new Date().toISOString(),
    question: "Dacă ANAF ar verifica azi, unde pici prima dată?",
    topRisks,
    summary: {
      totalRisks: allRisks.length,
      totalExposureMinRON: round2(totalExposureMinRON),
      totalExposureMaxRON: round2(totalExposureMaxRON),
      totalAvoidedIfResolvedRON: round2(totalAvoidedIfResolvedRON),
      breakdown,
    },
    strategicRecommendation,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Labels pentru UI ──────────────────────────────────────────────────────────

export const PROBABILITY_LABELS: Record<EscalationProbability, string> = {
  imminent: "IMINENT",
  high: "RIDICAT",
  medium: "MEDIU",
  low: "SCĂZUT",
}

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  "cross-correlation": "Cross-Correlation",
  "filing-discipline": "Disciplină depuneri",
  "audit-risk-signal": "Semnal audit risk",
  "sequence-gap": "Gap secvență facturi",
  "recurring-pattern": "Pattern recurent",
}
