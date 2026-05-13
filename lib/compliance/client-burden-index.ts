// FC-8 (2026-05-14) — Client Burden Index.
//
// Doc 09 cap 5 + Doc 08 cap 4: "Calculează per client: număr de excepții/lună,
// timp estimat consumat, repetitivitate probleme, risc fiscal activ, response
// behavior. Vezi care client îți consumă cabinetul. Care e profitabil. Care e
// toxic. Care e gata să fie reclasificat la fee mai mare sau evacuat."
//
// Input: per-client bundles (filings + findings + cross-correlation + masters).
// Output: BurdenScore 0-100 + classification + top toxic clients.

import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { CrossCorrelationFinding } from "@/lib/compliance/cross-correlation-engine"
import type { FindingWithImpact } from "@/lib/compliance/economic-impact"

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Clasificare client după burden și valoare:
 * - profitable: low burden, fee normal sau peste medie
 * - normal: burden medie, fee normal
 * - toxic: high burden, fee normal sau sub — pierdere de bani/timp
 * - high-touch: high burden, dar fee corespunzător sau VIP (acceptabil)
 * - dormant: burden minimă, fee mic — candidat la fee mai mare sau evacuare
 */
export type ClientClassification =
  | "profitable"
  | "normal"
  | "toxic"
  | "high-touch"
  | "dormant"

/**
 * Response behavior — cât de repede răspunde clientul când cabinetul cere ceva.
 */
export type ResponseBehavior = "fast" | "normal" | "slow" | "non-responsive"

export type BurdenInput = {
  /** ID client (orgId). */
  orgId: string
  /** Nume firmă. */
  orgName: string
  /** Filing records pentru ultimele 12 luni. */
  filings: FilingRecord[]
  /** Cross-correlation findings cu economic impact (FC-3+FC-4+FC-5). */
  crossCorrelationFindings: FindingWithImpact[]
  /** Fee lunar facturat clientului (RON). Optional — dacă lipsește, se folosește media cabinetului pentru clasificare. */
  monthlyFeeRON?: number
  /**
   * Average response time la cereri de documente (ore).
   * Optional — derivat din missing-evidence workflow viitor sau introdus manual.
   */
  avgResponseHours?: number
  /** Onboarding date — pentru detecție clienți noi/vechi. */
  onboardingISO?: string
}

export type ClientBurdenMetrics = {
  orgId: string
  orgName: string
  /** Număr total excepții active. */
  totalExceptions: number
  /** Excepții/lună (medie pe ultimele 3 luni). */
  exceptionsPerMonth: number
  /** Excepții repetate (recurence > 1). */
  recurrentExceptions: number
  /** Timp estimat consumat de cabinet (ore/lună). */
  cabinetHoursPerMonth: number
  /** Exposure fiscală activă (sumă penalități estimate, RON). */
  activeFiscalRiskRON: number
  /** Disciplina depunerilor (% on-time în ultimele 12 luni). */
  filingComplianceRate: number
  /** Număr filings late + missing în ultimele 12 luni. */
  problematicFilings: number
  /** Response behavior. */
  responseBehavior: ResponseBehavior
  /** Fee lunar (RON) — null dacă necunoscut. */
  monthlyFeeRON: number | null
  /** Burden score 0-100 (composite — higher = more burden). */
  burdenScore: number
  /** Ratio (cost cabinet / fee) — null dacă fee necunoscut. */
  costToFeeRatio: number | null
  /** Clasificare. */
  classification: ClientClassification
  /** Sugestie acțiune. */
  recommendation: string
}

export type PortfolioBurdenReport = {
  /** Toate firmele analizate. */
  clients: ClientBurdenMetrics[]
  /** Top 10 burden (cele mai costisitoare). */
  topBurden: ClientBurdenMetrics[]
  /** Top 10 toxic — burden mare + fee mic. */
  topToxic: ClientBurdenMetrics[]
  /** Top 10 fiscal risk activ. */
  topFiscalRisk: ClientBurdenMetrics[]
  /** Summary agregat. */
  summary: {
    totalClients: number
    avgBurdenScore: number
    totalCabinetHoursPerMonth: number
    totalActiveRiskRON: number
    byClassification: Record<ClientClassification, number>
    /** % din portofoliu cu burden HIGH (>= 60). */
    highBurdenPct: number
  }
  /** Recomandare strategică pentru cabinet. */
  topRecommendation: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const CABINET_HOURLY_RATE_RON = 200
/** Pragul lunar tipic pentru un client „normal" (RON fee/lună). */
const TYPICAL_MONTHLY_FEE_RON = 800
/** Burden HIGH threshold (>= 50). */
const HIGH_BURDEN_THRESHOLD = 50
/** Cost-to-fee ratio prag pentru "toxic" (cabinet pierde bani). */
const TOXIC_COST_RATIO = 0.5
/** Burden mediu — sub care nu putem clasifica toxic chiar dacă ratio mare. */
const TOXIC_MIN_BURDEN = 40

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calculează rata de compliance filing (% on-time). */
function computeFilingComplianceRate(filings: FilingRecord[]): number {
  if (filings.length === 0) return 100
  const closed = filings.filter((f) => f.status === "on_time" || f.status === "rectified")
  if (closed.length === 0) return 0
  const onTime = closed.filter((f) => f.status === "on_time").length
  return Math.round((onTime / closed.length) * 100)
}

/** Estimează ore/lună consumate de cabinet pentru un client. */
function estimateCabinetHours(
  exceptions: FindingWithImpact[],
  problematicFilings: number,
): number {
  // 1 oră pentru fiecare excepție warning, 2 ore pentru error
  // + 0.5 ore pentru fiecare filing missing/late (re-depunere/notificare)
  const exceptionHours = exceptions.reduce((s, f) => {
    const baseHours = f.severity === "error" ? 2 : 1
    return s + (f.economicImpact?.remediationHours ?? baseHours)
  }, 0)
  const filingHours = problematicFilings * 0.5
  // Convertim în "per lună" (presupunem că datele sunt din ultimele 3 luni)
  return Math.round(((exceptionHours + filingHours) / 3) * 10) / 10
}

/** Calculează priority/burden score 0-100. */
function computeBurdenScore(metrics: {
  exceptionsPerMonth: number
  cabinetHoursPerMonth: number
  activeFiscalRiskRON: number
  filingComplianceRate: number
  recurrentExceptions: number
  responseBehavior: ResponseBehavior
}): number {
  // Score = 30% exceptions/month + 25% hours + 20% risk + 15% non-compliance + 10% repetitivity
  const expScore = Math.min(metrics.exceptionsPerMonth * 10, 30) // 3 excepții/lună = max 30 puncte
  const hoursScore = Math.min(metrics.cabinetHoursPerMonth * 2, 25) // 12.5h/lună = max
  const riskScore = Math.min(metrics.activeFiscalRiskRON / 1000, 20) // 20k RON = max 20
  const complianceScore = Math.round(((100 - metrics.filingComplianceRate) / 100) * 15)
  const recurrenceScore = Math.min(metrics.recurrentExceptions * 2, 10)
  let total = expScore + hoursScore + riskScore + complianceScore + recurrenceScore
  // Bonus penalitate pentru non-responsive
  if (metrics.responseBehavior === "non-responsive") total += 5
  if (metrics.responseBehavior === "slow") total += 2
  return Math.min(Math.round(total), 100)
}

/** Mapează avg response hours → behavior label. */
function deriveResponseBehavior(hours: number | undefined): ResponseBehavior {
  if (hours === undefined || hours < 0) return "normal"
  if (hours <= 24) return "fast"
  if (hours <= 72) return "normal"
  if (hours <= 240) return "slow" // 10 zile
  return "non-responsive"
}

/** Clasifică clientul după burden + fee. */
function classifyClient(metrics: {
  burdenScore: number
  costToFeeRatio: number | null
  monthlyFeeRON: number | null
}): ClientClassification {
  const { burdenScore, costToFeeRatio, monthlyFeeRON } = metrics

  // Dormant: burden mic + fee mic
  if (burdenScore < 20 && (monthlyFeeRON ?? 0) < TYPICAL_MONTHLY_FEE_RON * 0.5) {
    return "dormant"
  }

  // Toxic: burden semnificativ + cost cabinet > 50% din fee (cabinet pierde bani)
  if (
    burdenScore >= TOXIC_MIN_BURDEN &&
    costToFeeRatio !== null &&
    costToFeeRatio > TOXIC_COST_RATIO
  ) {
    return "toxic"
  }

  // High-touch: burden mare DAR fee acoperă (cost-to-fee < 50%)
  if (burdenScore >= HIGH_BURDEN_THRESHOLD) {
    return "high-touch"
  }

  // Profitable: burden mic-mediu + fee bun (cost-to-fee < 20%)
  if (burdenScore < 40 && costToFeeRatio !== null && costToFeeRatio < 0.2) {
    return "profitable"
  }

  return "normal"
}

/** Generează recomandare pentru client. */
function buildRecommendation(
  metrics: Omit<ClientBurdenMetrics, "recommendation">,
): string {
  switch (metrics.classification) {
    case "toxic":
      return `Re-clasificare URGENT: fee curent (${metrics.monthlyFeeRON ?? "?"} RON/lună) nu acoperă efort cabinet (~${Math.round(metrics.cabinetHoursPerMonth * CABINET_HOURLY_RATE_RON)} RON/lună). Propune fee nou sau încheiere contract.`
    case "high-touch":
      return `Client high-touch — burden mare dar fee acoperă efort. Confirmă SLA + documentează că ești la maximum capacity pentru acest cont.`
    case "dormant":
      return `Client dormant — burden minimă. Verifică dacă fee-ul curent reflectă valoarea reală (suspect undercharge) sau dacă e candidat pentru up-sell/cross-sell.`
    case "profitable":
      return `Client profitabil — burden controlată, fee bun. Folosește-l ca referință pentru ICP-ul cabinetului.`
    default:
      return `Client normal — monitorizează evoluția exception count și response time.`
  }
}

// ── Engine ───────────────────────────────────────────────────────────────────

/**
 * Calculează metrice burden pentru un singur client.
 */
export function computeClientBurden(input: BurdenInput): ClientBurdenMetrics {
  const { orgId, orgName, filings, crossCorrelationFindings } = input

  const activeFindings = crossCorrelationFindings.filter(
    (f) => f.severity === "warning" || f.severity === "error",
  )

  const totalExceptions = activeFindings.length
  const exceptionsPerMonth = Math.round((totalExceptions / 3) * 10) / 10

  // Recurence — bazat pe rule + period (apariții repetate)
  const ruleCounts = new Map<string, number>()
  for (const f of activeFindings) {
    const key = f.rule
    ruleCounts.set(key, (ruleCounts.get(key) ?? 0) + 1)
  }
  const recurrentExceptions = Array.from(ruleCounts.values()).filter((c) => c > 1).length

  // Filings problematice
  const problematicFilings = filings.filter(
    (f) => f.status === "missing" || f.status === "late",
  ).length

  const cabinetHoursPerMonth = estimateCabinetHours(activeFindings, problematicFilings)
  const cabinetCostPerMonth = cabinetHoursPerMonth * CABINET_HOURLY_RATE_RON

  // Active fiscal risk (suma penalității maxime)
  const activeFiscalRiskRON = Math.round(
    activeFindings.reduce(
      (s, f) => s + (f.economicImpact?.totalCostMaxRON ?? 0),
      0,
    ),
  )

  const filingComplianceRate = computeFilingComplianceRate(filings)
  const responseBehavior = deriveResponseBehavior(input.avgResponseHours)

  const burdenScore = computeBurdenScore({
    exceptionsPerMonth,
    cabinetHoursPerMonth,
    activeFiscalRiskRON,
    filingComplianceRate,
    recurrentExceptions,
    responseBehavior,
  })

  const monthlyFeeRON = input.monthlyFeeRON ?? null
  const costToFeeRatio = monthlyFeeRON && monthlyFeeRON > 0
    ? Math.round((cabinetCostPerMonth / monthlyFeeRON) * 100) / 100
    : null

  const classification = classifyClient({
    burdenScore,
    costToFeeRatio,
    monthlyFeeRON,
  })

  const base: Omit<ClientBurdenMetrics, "recommendation"> = {
    orgId,
    orgName,
    totalExceptions,
    exceptionsPerMonth,
    recurrentExceptions,
    cabinetHoursPerMonth,
    activeFiscalRiskRON,
    filingComplianceRate,
    problematicFilings,
    responseBehavior,
    monthlyFeeRON,
    burdenScore,
    costToFeeRatio,
    classification,
  }

  return {
    ...base,
    recommendation: buildRecommendation(base),
  }
}

/**
 * Construiește raport burden pentru tot portofoliul cabinetului.
 */
export function buildPortfolioBurdenReport(
  inputs: BurdenInput[],
): PortfolioBurdenReport {
  const clients = inputs.map(computeClientBurden)

  const sortedByBurden = [...clients].sort((a, b) => b.burdenScore - a.burdenScore)
  const sortedByRisk = [...clients].sort((a, b) => b.activeFiscalRiskRON - a.activeFiscalRiskRON)

  const topBurden = sortedByBurden.slice(0, 10)
  const topToxic = sortedByBurden
    .filter((c) => c.classification === "toxic")
    .slice(0, 10)
  const topFiscalRisk = sortedByRisk
    .filter((c) => c.activeFiscalRiskRON > 0)
    .slice(0, 10)

  const totalClients = clients.length
  const avgBurdenScore =
    totalClients > 0
      ? Math.round(clients.reduce((s, c) => s + c.burdenScore, 0) / totalClients)
      : 0
  const totalCabinetHoursPerMonth =
    Math.round(clients.reduce((s, c) => s + c.cabinetHoursPerMonth, 0) * 10) / 10
  const totalActiveRiskRON = clients.reduce((s, c) => s + c.activeFiscalRiskRON, 0)

  const byClassification: Record<ClientClassification, number> = {
    profitable: 0,
    normal: 0,
    toxic: 0,
    "high-touch": 0,
    dormant: 0,
  }
  for (const c of clients) {
    byClassification[c.classification]++
  }

  const highBurdenCount = clients.filter((c) => c.burdenScore >= HIGH_BURDEN_THRESHOLD).length
  const highBurdenPct = totalClients > 0
    ? Math.round((highBurdenCount / totalClients) * 100)
    : 0

  let topRecommendation: string
  if (topToxic.length >= 3) {
    topRecommendation = `${topToxic.length} clienți TOXICI în portofoliu — re-clasificare fee sau evacuare urgentă. Primul: "${topToxic[0]?.orgName}" (burden ${topToxic[0]?.burdenScore}/100, cost/fee ${topToxic[0]?.costToFeeRatio ?? "?"}).`
  } else if (topToxic.length > 0) {
    topRecommendation = `${topToxic.length} client(i) toxic identificat: "${topToxic[0]?.orgName}". Renegociază fee sau migrează la pachet superior.`
  } else if (highBurdenPct >= 30) {
    topRecommendation = `${highBurdenPct}% din portofoliu are burden HIGH (≥${HIGH_BURDEN_THRESHOLD}/100). Atenție la capacity cabinet — risc de overcommit.`
  } else if (totalCabinetHoursPerMonth > 80) {
    topRecommendation = `Total efort cabinet: ${totalCabinetHoursPerMonth}h/lună (~${Math.round(totalCabinetHoursPerMonth * CABINET_HOURLY_RATE_RON / 1000)}k RON cost intern). Verifică marja vs cifră de afaceri.`
  } else {
    topRecommendation = `Portofoliu sub control — burden mediu ${avgBurdenScore}/100, fără clienți toxici.`
  }

  return {
    clients,
    topBurden,
    topToxic,
    topFiscalRisk,
    summary: {
      totalClients,
      avgBurdenScore,
      totalCabinetHoursPerMonth,
      totalActiveRiskRON,
      byClassification,
      highBurdenPct,
    },
    topRecommendation,
  }
}

// ── Re-export pentru consumatori ─────────────────────────────────────────────

export type StateForBurden = ComplianceState & {
  filingRecords?: FilingRecord[]
}

/**
 * Helper: extrage filings dintr-un state.
 */
export function extractFilingsFromState(state: StateForBurden | null): FilingRecord[] {
  return state?.filingRecords ?? []
}
