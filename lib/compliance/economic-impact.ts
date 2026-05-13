// FC-5 (2026-05-14) — Economic Impact Layer.
//
// Pentru fiecare finding cross-correlation, calculează valoarea în LEI a:
//   - TVA potențial afectat
//   - Penalitate estimată (Cod Fiscal Art. 219 + OG 92/2003)
//   - Ore consumate de remediere
//   - Cost retransmitere (re-emite factură, rectificativă, recipisă)
//   - Range MIN-MAX pentru transparență (nu o singură cifră fictivă)
//
// Mesaj comercial care alimentează Doc 08:
//   ÎNAINTE: "R1 ERROR: diff 3100 RON (62%)"
//   DUPĂ:    "R1 ERROR: diff 3100 RON · penalitate estimată 620-1860 lei
//             (Cod Fiscal Art. 219) · ~1.5h remediere · 1 retransmitere"

import type {
  CrossCorrelationFinding,
  CrossCorrelationRule,
  CrossCorrelationSeverity,
} from "@/lib/compliance/cross-correlation-engine"

// ── Types ────────────────────────────────────────────────────────────────────

export type EconomicImpact = {
  /** Sumă fiscală potențial afectată (TVA, impozit) — base pentru calcul. */
  affectedAmountRON: number | null
  /** Penalitate estimată minim (RON). */
  penaltyMinRON: number
  /** Penalitate estimată maxim (RON). */
  penaltyMaxRON: number
  /** Ore consumate estimate de remediere (h). */
  remediationHours: number
  /** Câte retransmiteri / rectificative implică această problemă. */
  retransmissions: number
  /** Cost total estimat MIN (penalitate + manoperă cabinet la 200 lei/h). */
  totalCostMinRON: number
  /** Cost total estimat MAX. */
  totalCostMaxRON: number
  /** Lista referințe legale exacte pentru penalități. */
  legalReferences: string[]
  /** Notă explicativă a calculului (transparență — pentru drawer). */
  computationNote: string
}

export type FindingWithImpact = CrossCorrelationFinding & {
  economicImpact: EconomicImpact
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Tarif orar cabinet contabil (RON/h) pentru estimare cost manoperă. */
const CABINET_HOURLY_RATE_RON = 200

/** Penalitate fixă tardiv depunere — Cod Fiscal Art. 219 alin (1) lit. d.
 *  500 RON pentru SRL micro, 1000 RON pentru SRL mediu, 1500 RON mare. */
const FILING_LATE_PENALTY_BASE_RON = 500
const FILING_LATE_PENALTY_AGGRESSIVE_RON = 1500

/** Penalitate procentuală pentru sume neraportate corect (Art. 219 alin 4). */
const UNDER_REPORTED_PENALTY_PCT_MIN = 0.05 // 5%
const UNDER_REPORTED_PENALTY_PCT_MAX = 0.15 // 15%

/** Rectificare D205/D100 anuale generează majorări 0.02%/zi. */
const RECTIFICATION_DAILY_INTEREST_PCT = 0.0002 // 0.02% pe zi

// ── Helper functions ─────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Per-rule impact calculators ──────────────────────────────────────────────

/**
 * R1: Σ TVA facturi primite ↔ D300 TVA deductibil.
 * Diff = TVA dedus eronat sau lipsă din D300.
 * Impact: rectificare D300 + posibil control fiscal.
 */
function computeR1Impact(finding: CrossCorrelationFinding): EconomicImpact {
  const diff = Math.abs(finding.diff?.diff ?? 0)
  const affectedAmountRON = diff > 0 ? diff : null

  // Severitate determină cost
  if (finding.severity === "info" || finding.severity === "ok") {
    return {
      affectedAmountRON,
      penaltyMinRON: 0,
      penaltyMaxRON: 0,
      remediationHours: 0,
      retransmissions: 0,
      totalCostMinRON: 0,
      totalCostMaxRON: 0,
      legalReferences: [],
      computationNote: finding.severity === "ok"
        ? "Concordant — fără impact economic."
        : "Insuficient date pentru calcul.",
    }
  }

  // Warning sau Error: pene fixe + procent
  const penaltyMinRON =
    finding.severity === "warning"
      ? FILING_LATE_PENALTY_BASE_RON
      : FILING_LATE_PENALTY_BASE_RON + diff * UNDER_REPORTED_PENALTY_PCT_MIN
  const penaltyMaxRON =
    finding.severity === "warning"
      ? FILING_LATE_PENALTY_AGGRESSIVE_RON
      : FILING_LATE_PENALTY_AGGRESSIVE_RON + diff * UNDER_REPORTED_PENALTY_PCT_MAX

  // Remediation: identificare facturi lipsă + completare/rectificare D300
  const remediationHours = finding.severity === "warning" ? 1.5 : 3.0
  const retransmissions = 1 // 1 D300 rectificativă

  const totalCostMinRON = penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON
  const totalCostMaxRON = penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(totalCostMinRON),
    totalCostMaxRON: round2(totalCostMaxRON),
    legalReferences: [
      "Cod Fiscal Art. 219 alin (1) lit. d (penalitate fixă tardiv)",
      finding.severity === "error" ? "Cod Fiscal Art. 219 alin (4) (procent sume neraportate)" : "",
    ].filter(Boolean),
    computationNote: `Diff ${diff.toFixed(2)} RON TVA neconciliat. Penalitate ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei + ${remediationHours}h manoperă cabinet (${CABINET_HOURLY_RATE_RON} lei/h).`,
  }
}

/**
 * R2: AGA dividende ↔ D205 beneficiari.
 * Diff = impozit reținut greșit sau dividend distribuit fără raportare.
 * Impact: rectificare D205 + posibil impozit suplimentar + dobânzi.
 */
function computeR2Impact(finding: CrossCorrelationFinding): EconomicImpact {
  const diff = Math.abs(finding.diff?.diff ?? 0)
  const affectedAmountRON = diff > 0 ? diff : null

  if (finding.severity === "info" || finding.severity === "ok") {
    return zeroImpact(finding.severity)
  }

  // Calcul impozit dividende: 8% pe diferență (cota standard 2024+)
  const taxDelta = diff * 0.08

  // Penalitate fix + procent + dobânzi
  let penaltyMinRON = FILING_LATE_PENALTY_BASE_RON + taxDelta * 0.05
  let penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON + taxDelta * 0.15

  if (finding.severity === "error") {
    // Missing CNP în D205 = posibil neraportat → risc control
    penaltyMinRON += taxDelta * 0.1
    penaltyMaxRON += taxDelta * 0.3
  }

  // Ore: identificare + rectificare D205 (mai laborios decât D300)
  const remediationHours = finding.severity === "error" ? 4.0 : 2.0
  const retransmissions = 1

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON),
    totalCostMaxRON: round2(penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON),
    legalReferences: [
      "Cod Fiscal Art. 97 (impozit dividende 8%)",
      "Cod Fiscal Art. 219 alin (1) lit. d",
      "OPANAF D205 — rectificare",
    ],
    computationNote: `Diff ${diff.toFixed(2)} RON dividende între AGA și D205. Impozit afectat ${taxDelta.toFixed(2)} RON (8%). Penalitate ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei + ${remediationHours}h.`,
  }
}

/**
 * R3: AGA procent deținere ↔ ONRC procent.
 * Diff = cesiune părți sociale neînregistrată sau distribuție derogatorie.
 * Impact: depunere ONRC retroactivă + eventual recalculare dividende.
 */
function computeR3Impact(finding: CrossCorrelationFinding): EconomicImpact {
  if (finding.severity === "info" || finding.severity === "ok") {
    return zeroImpact(finding.severity)
  }

  const diffPP = Math.abs(finding.diff?.diff ?? 0) // puncte procentuale
  const affectedAmountRON = null // nu se traduce direct în RON (e ownership)

  // R3 e mai mult administrativ — taxă ONRC + manoperă
  const onrcFeeRON = 100 // taxă cesiune părți sociale ONRC
  const penaltyMinRON = onrcFeeRON
  const penaltyMaxRON = onrcFeeRON + 500 // posibil control + rectificative AGA

  const remediationHours = finding.severity === "error" ? 3.0 : 1.5
  const retransmissions = 1

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON),
    totalCostMaxRON: round2(penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON),
    legalReferences: [
      "Legea 31/1990 Art. 7 + Art. 67 (cesiune părți sociale)",
      "Taxă ONRC cesiune ~100 RON",
    ],
    computationNote: `Diferență ${diffPP.toFixed(1)} pp deținere între AGA și ONRC. Cesiune posibil neînregistrată. Cost ONRC + manoperă ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei + ${remediationHours}h cabinet.`,
  }
}

/**
 * R5: D205 anual ↔ Σ D100 lunare cod 480.
 * Diff = impozit dividende sub-raportat sau D100 lipsă/eronate.
 * Impact: rectificare D100 + dobânzi cumulate pe luni.
 */
function computeR5Impact(finding: CrossCorrelationFinding): EconomicImpact {
  const diff = Math.abs(finding.diff?.diff ?? 0)
  const affectedAmountRON = diff > 0 ? diff : null

  if (finding.severity === "info" || finding.severity === "ok") {
    return zeroImpact(finding.severity)
  }

  // Dobânzi cumulate: aprox 90 zile mediu × 0.02% pe zi
  const daysAvg = 90
  const interestDelta = diff * RECTIFICATION_DAILY_INTEREST_PCT * daysAvg

  let penaltyMinRON = FILING_LATE_PENALTY_BASE_RON + diff * 0.05 + interestDelta
  let penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON + diff * 0.15 + interestDelta * 2

  if (finding.severity === "error") {
    penaltyMinRON += diff * 0.05 // suplimentar pentru sub-raportare gravă
    penaltyMaxRON += diff * 0.10
  }

  const remediationHours = finding.severity === "error" ? 5.0 : 2.5
  const retransmissions = finding.severity === "error" ? 3 : 1 // rectificative multiple D100

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON),
    totalCostMaxRON: round2(penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON),
    legalReferences: [
      "Cod Fiscal Art. 97",
      "Cod Fiscal Art. 219 alin (1) lit. d",
      "OG 92/2003 — dobânzi de întârziere 0.02%/zi",
    ],
    computationNote: `Diff ${diff.toFixed(2)} RON impozit între D205 anual și Σ D100. Dobânzi aprox 90 zile (${interestDelta.toFixed(2)} RON). Penalitate ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei + ${remediationHours}h + ${retransmissions} rectificative.`,
  }
}

/**
 * R6: termen calendar ↔ data depunere efectivă.
 * Impact: penalitate fixă (zile întârziere) + manoperă rectificare.
 */
function computeR6Impact(finding: CrossCorrelationFinding): EconomicImpact {
  if (finding.severity === "info" || finding.severity === "ok") {
    return zeroImpact(finding.severity)
  }

  const daysLate = Math.abs(finding.diff?.actual ?? 0)
  const affectedAmountRON = null

  let penaltyMinRON: number
  let penaltyMaxRON: number

  if (daysLate <= 15) {
    penaltyMinRON = FILING_LATE_PENALTY_BASE_RON
    penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON
  } else if (daysLate <= 30) {
    penaltyMinRON = FILING_LATE_PENALTY_BASE_RON * 2
    penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON * 2
  } else {
    // peste 30 zile: penalitate fixă + procent procesual pe sume raportate
    penaltyMinRON = FILING_LATE_PENALTY_BASE_RON * 3
    penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON * 4
  }

  const remediationHours = daysLate <= 5 ? 0.5 : daysLate <= 15 ? 1.0 : 2.0
  const retransmissions = 0 // depunerea e deja făcută, doar plată penalitate

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON),
    totalCostMaxRON: round2(penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON),
    legalReferences: [
      "Cod Fiscal Art. 219 alin (1) lit. d (depunere tardiv)",
      "OG 92/2003 alin agravare",
    ],
    computationNote: `${daysLate} zile întârziere. Penalitate ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei (agravare progresivă) + ${remediationHours}h documentare cabinet.`,
  }
}

/**
 * R7: frecvență reală ↔ frecvență așteptată.
 * Impact: declarație 010 + rectificative perioade greșite.
 */
function computeR7Impact(finding: CrossCorrelationFinding): EconomicImpact {
  if (finding.severity === "info" || finding.severity === "ok") {
    return zeroImpact(finding.severity)
  }

  const affectedAmountRON = null

  // Declarație 010 nu are penalitate dacă o depui acum; dar rectificarea
  // perioadelor anterioare implică D300 rectificative + posibil dobânzi.
  let penaltyMinRON = 0 // pentru "mixed" recoltăm doar manoperă, nu penalitate
  let penaltyMaxRON = FILING_LATE_PENALTY_BASE_RON // dacă ANAF observă

  if (finding.title.includes("MIXTĂ")) {
    // mismatch grav: rectificative D300 multiple
    penaltyMinRON = FILING_LATE_PENALTY_BASE_RON
    penaltyMaxRON = FILING_LATE_PENALTY_AGGRESSIVE_RON * 2
  }

  const remediationHours = 3.0 // depunere 010 + rectificative perioade greșite
  const retransmissions = 4 // estimat: 1 declarație 010 + 2-3 D300 rectificative

  return {
    affectedAmountRON,
    penaltyMinRON: round2(penaltyMinRON),
    penaltyMaxRON: round2(penaltyMaxRON),
    remediationHours,
    retransmissions,
    totalCostMinRON: round2(penaltyMinRON + remediationHours * CABINET_HOURLY_RATE_RON),
    totalCostMaxRON: round2(penaltyMaxRON + remediationHours * CABINET_HOURLY_RATE_RON),
    legalReferences: [
      "Cod Fiscal Art. 322 (perioada fiscală TVA)",
      "OPANAF declarații 010 (notificare schimbare)",
    ],
    computationNote: `Schimbare frecvență TVA. Depunere declarație 010 + rectificative D300 perioade greșite (${retransmissions} retransmiteri). Penalitate ${penaltyMinRON.toFixed(0)}-${penaltyMaxRON.toFixed(0)} lei + ${remediationHours}h cabinet.`,
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

function zeroImpact(severity: CrossCorrelationSeverity): EconomicImpact {
  return {
    affectedAmountRON: null,
    penaltyMinRON: 0,
    penaltyMaxRON: 0,
    remediationHours: 0,
    retransmissions: 0,
    totalCostMinRON: 0,
    totalCostMaxRON: 0,
    legalReferences: [],
    computationNote: severity === "ok" ? "Concordant — fără impact economic." : "Fără date suficiente pentru calcul.",
  }
}

const IMPACT_CALCULATORS: Record<
  CrossCorrelationRule,
  (f: CrossCorrelationFinding) => EconomicImpact
> = {
  R1: computeR1Impact,
  R2: computeR2Impact,
  R3: computeR3Impact,
  R5: computeR5Impact,
  R6: computeR6Impact,
  R7: computeR7Impact,
}

/**
 * Calculează EconomicImpact pentru un finding existent.
 */
export function computeEconomicImpact(
  finding: CrossCorrelationFinding,
): EconomicImpact {
  const calc = IMPACT_CALCULATORS[finding.rule]
  return calc ? calc(finding) : zeroImpact(finding.severity)
}

/**
 * Anotaeză toate findings cu economicImpact.
 */
export function annotateWithImpact(
  findings: CrossCorrelationFinding[],
): FindingWithImpact[] {
  return findings.map((f) => ({
    ...f,
    economicImpact: computeEconomicImpact(f),
  }))
}

/**
 * Sumar agregat economic pentru toate findings non-ok.
 */
export type EconomicSummary = {
  totalAffectedRON: number
  totalPenaltyMinRON: number
  totalPenaltyMaxRON: number
  totalRemediationHours: number
  totalRetransmissions: number
  totalCostMinRON: number
  totalCostMaxRON: number
  /** Câte findings au impact > 0 (afectează costul). */
  impactfulFindingsCount: number
}

export function aggregateEconomicImpact(
  findings: FindingWithImpact[],
): EconomicSummary {
  let totalAffectedRON = 0
  let totalPenaltyMinRON = 0
  let totalPenaltyMaxRON = 0
  let totalRemediationHours = 0
  let totalRetransmissions = 0
  let totalCostMinRON = 0
  let totalCostMaxRON = 0
  let impactfulFindingsCount = 0

  for (const f of findings) {
    const imp = f.economicImpact
    if (imp.totalCostMinRON > 0 || imp.totalCostMaxRON > 0) {
      impactfulFindingsCount++
    }
    totalAffectedRON += imp.affectedAmountRON ?? 0
    totalPenaltyMinRON += imp.penaltyMinRON
    totalPenaltyMaxRON += imp.penaltyMaxRON
    totalRemediationHours += imp.remediationHours
    totalRetransmissions += imp.retransmissions
    totalCostMinRON += imp.totalCostMinRON
    totalCostMaxRON += imp.totalCostMaxRON
  }

  return {
    totalAffectedRON: round2(totalAffectedRON),
    totalPenaltyMinRON: round2(totalPenaltyMinRON),
    totalPenaltyMaxRON: round2(totalPenaltyMaxRON),
    totalRemediationHours: round2(totalRemediationHours),
    totalRetransmissions,
    totalCostMinRON: round2(totalCostMinRON),
    totalCostMaxRON: round2(totalCostMaxRON),
    impactfulFindingsCount,
  }
}
