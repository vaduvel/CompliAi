// ANAF Signals Phase C — C1: SAF-T Hygiene
// Filing status, late/missing/rectified indicators, consistency warning, hygiene score.
// Extends filing-discipline with SAF-T-specific logic.
// Pure functions — no I/O, safe in browser and server.

import type { ScanFinding } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import {
  computeFilingDisciplineScore,
  FILING_TYPE_LABELS,
} from "@/lib/compliance/filing-discipline"

// ── Types ────────────────────────────────────────────────────────────────────

export type SAFTReportingPeriod = "monthly" | "quarterly"

export type SAFTHygieneStatus = {
  hygieneScore: number            // 0-100
  hygieneLabel: "excelent" | "bun" | "acceptabil" | "slab" | "critic"
  totalFilings: number
  onTime: number
  late: number
  missing: number
  rectified: number
  multipleRectifications: number  // filings with 2+ rectifications
  consistencyIssues: SAFTConsistencyIssue[]
  indicators: SAFTIndicator[]
}

export type SAFTIndicator = {
  id: string
  label: string
  status: "ok" | "warning" | "critical"
  detail: string
}

export type SAFTConsistencyIssue = {
  type: "gap" | "sequence_break" | "repeated_rectification" | "cross_filing_mismatch"
  message: string
  severity: "warning" | "error"
  periods: string[]
  filingIds: string[]
}

// ── SAF-T specific filtering ─────────────────────────────────────────────────

function isSAFTFiling(r: FilingRecord): boolean {
  return r.type === "saft"
}

// ── SAF-T Hygiene Score ──────────────────────────────────────────────────────

/**
 * Compute SAF-T specific hygiene from filing records.
 * Filters to SAF-T (D406) filings and runs extended analysis.
 */
export function computeSAFTHygiene(
  allFilings: FilingRecord[],
  nowISO: string,
): SAFTHygieneStatus {
  const saftFilings = allFilings.filter(isSAFTFiling)
  const disciplineScore = computeFilingDisciplineScore(saftFilings)

  const indicators: SAFTIndicator[] = []
  const consistencyIssues: SAFTConsistencyIssue[] = []

  // Indicator 1: Filing completeness
  const nonUpcoming = saftFilings.filter((f) => f.status !== "upcoming")
  const missingCount = nonUpcoming.filter((f) => f.status === "missing").length
  if (missingCount === 0 && nonUpcoming.length > 0) {
    indicators.push({
      id: "saft-completeness",
      label: "Completitudine SAF-T",
      status: "ok",
      detail: `Toate cele ${nonUpcoming.length} raportări SAF-T sunt depuse.`,
    })
  } else if (missingCount > 0) {
    indicators.push({
      id: "saft-completeness",
      label: "Completitudine SAF-T",
      status: missingCount >= 2 ? "critical" : "warning",
      detail: `${missingCount} raportări SAF-T lipsă din ${nonUpcoming.length} total.`,
    })
  }

  // Indicator 2: Timeliness
  const lateCount = nonUpcoming.filter((f) => f.status === "late").length
  if (lateCount === 0 && nonUpcoming.length > 0) {
    indicators.push({
      id: "saft-timeliness",
      label: "Punctualitate SAF-T",
      status: "ok",
      detail: "Nicio raportare depusă cu întârziere.",
    })
  } else if (lateCount > 0) {
    indicators.push({
      id: "saft-timeliness",
      label: "Punctualitate SAF-T",
      status: lateCount >= 3 ? "critical" : "warning",
      detail: `${lateCount} raportări depuse cu întârziere.`,
    })
  }

  // Indicator 3: Rectification frequency
  const rectifiedCount = nonUpcoming.filter((f) => f.status === "rectified").length
  const multiRect = nonUpcoming.filter(
    (f) => f.rectificationCount && f.rectificationCount >= 2,
  ).length
  if (rectifiedCount === 0) {
    indicators.push({
      id: "saft-rectifications",
      label: "Rectificări SAF-T",
      status: "ok",
      detail: "Nicio rectificare necesară.",
    })
  } else {
    indicators.push({
      id: "saft-rectifications",
      label: "Rectificări SAF-T",
      status: multiRect > 0 ? "critical" : "warning",
      detail: `${rectifiedCount} rectificări${multiRect > 0 ? ` (${multiRect} cu rectificări multiple)` : ""}.`,
    })
  }

  // Consistency: check for gaps in period sequence
  const periods = saftFilings
    .map((f) => f.period)
    .sort()
  const uniquePeriods = [...new Set(periods)]

  // Detect repeated rectifications as consistency issue
  if (multiRect >= 2) {
    const multiRectFilings = nonUpcoming.filter(
      (f) => f.rectificationCount && f.rectificationCount >= 2,
    )
    consistencyIssues.push({
      type: "repeated_rectification",
      message: `${multiRect} perioade cu rectificări multiple — posibil problemă sistemică în procesul contabil SAF-T.`,
      severity: "error",
      periods: multiRectFilings.map((f) => f.period),
      filingIds: multiRectFilings.map((f) => f.id),
    })
  }

  // Detect potential period gaps (monthly sequence check)
  if (uniquePeriods.length >= 2) {
    const monthlyPeriods = uniquePeriods.filter((p) => /^\d{4}-\d{2}$/.test(p)).sort()
    for (let i = 1; i < monthlyPeriods.length; i++) {
      const prev = monthlyPeriods[i - 1]
      const curr = monthlyPeriods[i]
      const prevDate = new Date(prev + "-01")
      const currDate = new Date(curr + "-01")
      const diffMonths =
        (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
        (currDate.getMonth() - prevDate.getMonth())
      if (diffMonths > 1) {
        consistencyIssues.push({
          type: "gap",
          message: `Gap de ${diffMonths - 1} lună/luni între ${prev} și ${curr} în raportarea SAF-T.`,
          severity: "warning",
          periods: [prev, curr],
          filingIds: [],
        })
      }
    }
  }

  // Indicator 4: Consistency
  if (consistencyIssues.length === 0) {
    indicators.push({
      id: "saft-consistency",
      label: "Consistență SAF-T",
      status: "ok",
      detail: "Secvența de raportare este consistentă.",
    })
  } else {
    const hasErrors = consistencyIssues.some((i) => i.severity === "error")
    indicators.push({
      id: "saft-consistency",
      label: "Consistență SAF-T",
      status: hasErrors ? "critical" : "warning",
      detail: `${consistencyIssues.length} problemă/probleme de consistență detectate.`,
    })
  }

  return {
    hygieneScore: disciplineScore.score,
    hygieneLabel: disciplineScore.label,
    totalFilings: nonUpcoming.length,
    onTime: disciplineScore.onTime,
    late: disciplineScore.late,
    missing: disciplineScore.missing,
    rectified: disciplineScore.rectified,
    multipleRectifications: multiRect,
    consistencyIssues,
    indicators,
  }
}

// ── SAF-T Hygiene Findings ───────────────────────────────────────────────────

/**
 * Generate findings from SAF-T hygiene analysis.
 */
export function buildSAFTHygieneFindings(
  hygiene: SAFTHygieneStatus,
  nowISO: string,
): ScanFinding[] {
  const findings: ScanFinding[] = []

  // Finding for poor hygiene score
  if (hygiene.hygieneScore < 50 && hygiene.totalFilings > 0) {
    findings.push({
      id: "saft-hygiene-poor",
      title: `SAF-T: Scor de igienă fiscal critic (${hygiene.hygieneScore}/100)`,
      detail: `Scor igienă SAF-T: ${hygiene.hygieneScore}/100. ${hygiene.missing} raportări lipsă, ${hygiene.late} cu întârziere, ${hygiene.rectified} rectificate din ${hygiene.totalFilings} total.`,
      category: "E_FACTURA",
      severity: "critical",
      risk: "high",
      principles: ["accountability"],
      createdAtISO: nowISO,
      sourceDocument: "SAF-T (D406)",
      legalReference: "Ord. ANAF 1783/2021 · Cod Procedură Fiscală Art. 336",
      remediationHint: "Depune raportările SAF-T lipsă și corectează erorile recurente din procesul contabil.",
      resolution: makeResolution(
        `Scor igienă SAF-T critic: ${hygiene.hygieneScore}/100`,
        "Raportarea SAF-T inconsistentă poate declanșa control fiscal ANAF și amenzi de 1.000-5.000 RON per declarație.",
        "Completează raportările lipsă, verifică datele cu contabilul, implementează verificări lunare.",
        {
          humanStep: "Contabilul verifică și depune raportările lipsă prin SPV ANAF.",
          closureEvidence: "Confirmări SPV de depunere pentru toate perioadele lipsă.",
          revalidation: "Verificare lunară a completitudinii SAF-T.",
        },
      ),
    })
  }

  // Finding for consistency issues
  for (const issue of hygiene.consistencyIssues) {
    if (issue.severity === "error") {
      findings.push({
        id: `saft-consistency-${issue.type}-${issue.periods[0] ?? "unknown"}`,
        title: `SAF-T: ${issue.type === "repeated_rectification" ? "Rectificări repetate" : "Problemă de consistență"}`,
        detail: issue.message,
        category: "E_FACTURA",
        severity: "high",
        risk: "high",
        principles: ["accountability"],
        createdAtISO: nowISO,
        sourceDocument: "SAF-T (D406)",
        legalReference: "Ord. ANAF 1783/2021",
        remediationHint: issue.type === "repeated_rectification"
          ? "Investigează cauza rectificărilor repetate — posibil eroare sistemică în software-ul contabil."
          : "Verifică și completează perioadele lipsă din raportarea SAF-T.",
        resolution: makeResolution(
          issue.message,
          "Inconsistențele în raportarea SAF-T cresc riscul de control fiscal și indică probleme în procesul contabil.",
          "Investigează cauza, corectează procesul și completează perioadele lipsă.",
          {
            humanStep: "Revizuiește cu contabilul procesul de generare SAF-T și identifică sursa erorilor.",
            closureEvidence: "Raport de analiză cauză + confirmări de depunere corecte.",
            revalidation: "Verificare trimestrială a consistenței SAF-T.",
          },
        ),
      })
    }
  }

  return findings
}

// ── SAF-T D406 Registration Finding (Faza 2 — TASK 7) ───────────────────────

/**
 * Generate a finding if the org has SAF-T applicability but no evidence of D406 filing.
 * Obligație activă din 1 ianuarie 2025 pentru toate firmele din România.
 */
export function buildSAFTD406Finding(opts: {
  hasSaftTag: boolean
  d406EvidenceSubmitted?: boolean
  nowISO: string
}): ScanFinding[] {
  if (!opts.hasSaftTag) return []
  if (opts.d406EvidenceSubmitted) return []

  return [
    {
      id: "saft-d406-registration",
      title: "SAF-T (D406) — obligație activă din ianuarie 2025",
      detail:
        "Toate firmele din România sunt obligate să transmită electronic " +
        "datele contabile către ANAF prin Declarația Informativă D406 (SAF-T). " +
        "Nerespectarea atrage amenzi între 1.000 și 10.000 lei, " +
        "în funcție de categoria contribuabilului.",
      category: "E_FACTURA",
      severity: "high",
      risk: "high",
      principles: ["accountability"],
      createdAtISO: opts.nowISO,
      sourceDocument: "SAF-T (D406)",
      legalReference: "Ord. ANAF 1783/2021 · OUG 188/2022 · Cod Procedură Fiscală Art. 336",
      remediationHint:
        "Verifică dacă D406 a fost depus pentru toate perioadele aplicabile. " +
        "Încarcă dovada de depunere (confirmare SPV) pentru a închide finding-ul.",
      resolution: makeResolution(
        "Nu există dovadă de depunere D406 (SAF-T) în dosarul organizației.",
        "Nedepunerea SAF-T poate declanșa amenzi ANAF de 1.000-10.000 lei per declarație și semnalizează risc fiscal crescut.",
        "Verifică statusul depunerii cu contabilul, depune dacă lipsește, și încarcă confirmarea SPV.",
        {
          humanStep: "Contabilul confirmă depunerea D406 și încarcă dovada din SPV ANAF.",
          closureEvidence: "Confirmare SPV de depunere D406 pentru toate perioadele aplicabile.",
          revalidation: "Verificare lunară/trimestrială, în funcție de categoria contribuabilului.",
        },
      ),
    },
  ]
}

// ── Cross-filing check (SAF-T vs D300/D394) ─────────────────────────────────

/**
 * Check if SAF-T periods align with D300 (TVA) and D394 filings.
 * Returns consistency issues for mismatches.
 */
export function checkCrossFilingConsistency(
  allFilings: FilingRecord[],
): SAFTConsistencyIssue[] {
  const issues: SAFTConsistencyIssue[] = []

  const saftPeriods = new Set(
    allFilings.filter((f) => f.type === "saft" && f.status !== "upcoming").map((f) => f.period),
  )
  const d300Periods = new Set(
    allFilings.filter((f) => f.type === "d300_tva" && f.status !== "upcoming").map((f) => f.period),
  )

  // SAF-T filed but no D300 for same period
  for (const period of saftPeriods) {
    if (!d300Periods.has(period)) {
      issues.push({
        type: "cross_filing_mismatch",
        message: `SAF-T depus pentru ${period} dar lipsește Declarația 300 (TVA) pentru aceeași perioadă.`,
        severity: "warning",
        periods: [period],
        filingIds: allFilings
          .filter((f) => f.type === "saft" && f.period === period)
          .map((f) => f.id),
      })
    }
  }

  // D300 filed but no SAF-T for same period
  for (const period of d300Periods) {
    if (!saftPeriods.has(period)) {
      issues.push({
        type: "cross_filing_mismatch",
        message: `Declarația 300 (TVA) depusă pentru ${period} dar lipsește SAF-T (D406) pentru aceeași perioadă.`,
        severity: "warning",
        periods: [period],
        filingIds: allFilings
          .filter((f) => f.type === "d300_tva" && f.period === period)
          .map((f) => f.id),
      })
    }
  }

  return issues
}
