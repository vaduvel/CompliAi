// Detector frecvență declarații (lunar vs trimestrial) pe baza cifrei de
// afaceri — previne eroarea A9.6 ANAF („depui lunar dar ești înregistrat
// trimestrial sau invers").
//
// Reguli oficiale (Cod Fiscal Art. 322):
//   - Plătitor TVA cu CA < 100.000 EUR/an (≈ 500.000 RON) → trimestrial
//   - Plătitor TVA cu CA ≥ 100.000 EUR/an → lunar
//   - Achiziții intracomunitare → forțat lunar indiferent de CA
//   - Companii în primul an de activitate → trimestrial implicit
//
// Pure functions — pot rula în cron sau on-demand la deschiderea modulului.

import type { FilingRecord, FilingType } from "@/lib/compliance/filing-discipline"

export type ReportingFrequency = "monthly" | "quarterly" | "unknown"

export type FrequencyDetection = {
  frequency: ReportingFrequency
  confidence: "high" | "medium" | "low"
  reason: string
  recommendedAction?: string
}

export type FrequencyMismatch = {
  filingId: string
  filingType: FilingType
  period: string
  detectedFrequency: ReportingFrequency
  filedAsFrequency: ReportingFrequency
  severity: "error" | "warning"
  message: string
}

const QUARTERLY_THRESHOLD_RON = 500_000  // ~100.000 EUR la curs ~5 RON/EUR

// ── Detect din profil organizație ────────────────────────────────────────────

export function detectExpectedFrequency(opts: {
  annualRevenueRon?: number | null
  hasIntraCommunityTransactions?: boolean
  isFirstYearOfActivity?: boolean
}): FrequencyDetection {
  if (opts.hasIntraCommunityTransactions) {
    return {
      frequency: "monthly",
      confidence: "high",
      reason:
        "Achiziții intracomunitare → declarațiile D300/D394/D390 se depun LUNAR indiferent de cifra de afaceri.",
      recommendedAction:
        "Verifică D300/D394 sunt depuse lunar; D390 obligatoriu pentru fiecare achiziție UE.",
    }
  }

  if (opts.isFirstYearOfActivity) {
    return {
      frequency: "quarterly",
      confidence: "medium",
      reason: "Primul an de activitate → frecvență trimestrială implicită până anul următor.",
      recommendedAction: "În anul 2 frecvența se recalculează pe baza cifrei de afaceri.",
    }
  }

  if (opts.annualRevenueRon === null || opts.annualRevenueRon === undefined) {
    return {
      frequency: "unknown",
      confidence: "low",
      reason: "Cifra de afaceri anuală neavailablă — nu putem detecta frecvența automat.",
      recommendedAction: "Completează cifra de afaceri în profilul organizației.",
    }
  }

  if (opts.annualRevenueRon >= QUARTERLY_THRESHOLD_RON) {
    return {
      frequency: "monthly",
      confidence: "high",
      reason: `Cifra de afaceri ≥ ${QUARTERLY_THRESHOLD_RON.toLocaleString("ro-RO")} RON (≈100K EUR) → declarații LUNARE obligatorii.`,
    }
  }

  return {
    frequency: "quarterly",
    confidence: "high",
    reason: `Cifra de afaceri < ${QUARTERLY_THRESHOLD_RON.toLocaleString("ro-RO")} RON → declarații TRIMESTRIALE implicite.`,
    recommendedAction:
      "Poți opta pentru lunar dacă vrei rambursări TVA mai rapide (notificare prealabilă ANAF).",
  }
}

// ── Detect din pattern depuneri istorice ─────────────────────────────────────

export function detectFrequencyFromFilings(
  filings: FilingRecord[],
  filingType: FilingType,
): ReportingFrequency {
  const sameType = filings.filter((f) => f.type === filingType && f.status !== "upcoming")
  if (sameType.length === 0) return "unknown"

  const periods = sameType.map((f) => f.period)
  // Lunar pattern: 2026-01, 2026-02, 2026-03 (YYYY-MM)
  const monthlyCount = periods.filter((p) => /^\d{4}-\d{2}$/.test(p)).length
  // Trimestrial pattern: 2026-Q1, 2026-Q2 (YYYY-QN)
  const quarterlyCount = periods.filter((p) => /^\d{4}-Q[1-4]$/.test(p)).length

  if (monthlyCount > quarterlyCount) return "monthly"
  if (quarterlyCount > monthlyCount) return "quarterly"
  return "unknown"
}

// ── Detector mismatch — main use case ────────────────────────────────────────

export function detectFrequencyMismatches(
  filings: FilingRecord[],
  expected: FrequencyDetection,
): FrequencyMismatch[] {
  if (expected.frequency === "unknown") return []

  const mismatches: FrequencyMismatch[] = []
  const filingTypesToCheck: FilingType[] = ["d300_tva", "d394_local"]

  for (const type of filingTypesToCheck) {
    const filedAs = detectFrequencyFromFilings(filings, type)
    if (filedAs === "unknown") continue
    if (filedAs === expected.frequency) continue

    // Mismatch — flag every filing of this type
    const offending = filings.filter(
      (f) => f.type === type && f.status !== "upcoming",
    )
    for (const f of offending) {
      mismatches.push({
        filingId: f.id,
        filingType: f.type,
        period: f.period,
        detectedFrequency: expected.frequency,
        filedAsFrequency: filedAs,
        severity: "error",
        message: `${f.type === "d300_tva" ? "D300" : "D394"} ${f.period} depusă ${filedAs === "monthly" ? "LUNAR" : "TRIMESTRIAL"} dar conform CA ar trebui ${expected.frequency === "monthly" ? "LUNAR" : "TRIMESTRIAL"}. ${expected.reason}`,
      })
    }
  }

  return mismatches
}
