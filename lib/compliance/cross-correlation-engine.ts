// FC-3 + FC-4 — Cross-Correlation Engine pentru declarații fiscale.
//
// Inima FC-3: rulează 6 reguli care detectează neconcordanțe între sursele
// fiscale ale unei firme. Output-ul intră într-un raport cu findings (OK +
// warning + error), fiecare cu surse referințe pentru drawer-ul diff.
//
// Reguli:
//   R1: Σ TVA facturi primite (OCR) ↔ D300 rd24-rd33 TVA deductibil (per perioadă).
//   R2: AGA dividende per asociat (CNP) ↔ D205 beneficiar dividende grossIncome.
//   R3: AGA procent deținere per asociat (CNP) ↔ ONRC procent (per CUI).
//   R5: D205 anual impozit dividende ↔ Σ D100 lunare cod 480 (impozit dividende).
//   R6: termen calendar fiscal ↔ data depunere (FilingRecord.dueISO ↔ filedAtISO).  [FC-4]
//   R7: frecvență reală depuneri ↔ frecvență așteptată (lunar/trimestrial).  [FC-4]
//
// Toate sumele în RON. Toleranță: 1 RON sau 1% per rule.

import type { D300ParsedData } from "@/lib/compliance/parser-d300"
import type { D205ParsedData } from "@/lib/compliance/parser-d205"
import type { D100ParsedData } from "@/lib/compliance/parser-d100"
import type { ParsedDeclarationRecord } from "@/lib/compliance/parsed-declarations"
import type { ParsedAgaRecord } from "@/lib/compliance/parsed-aga"
import type { ParsedInvoiceRecord } from "@/lib/compliance/parsed-invoices"
import type { OnrcSnapshotRecord } from "@/lib/compliance/onrc-snapshot"
import type { FilingRecord, FilingType } from "@/lib/compliance/filing-discipline"
import {
  aggregateEconomicImpact,
  annotateWithImpact,
} from "@/lib/compliance/economic-impact"

// ── Types ────────────────────────────────────────────────────────────────────

export type CrossCorrelationRule = "R1" | "R2" | "R3" | "R5" | "R6" | "R7"

export type CrossCorrelationSeverity = "ok" | "info" | "warning" | "error"

export type SourceRefType = "d300" | "d205" | "d100" | "aga" | "invoice" | "onrc" | "filing" | "calendar"

export type SourceRef = {
  type: SourceRefType
  id: string
  /** Human-readable label pentru afișare în drawer. */
  label: string
  /** Perioada/anul aferent — pentru context drawer. */
  period?: string | null
  /** Valoare numerică extrasă din această sursă (pentru diff). */
  value?: number
  /** Etichetă valoare (ex: "TVA deductibil", "dividende anuale"). */
  valueLabel?: string
}

export type DiffData = {
  /** Valoare așteptată (de referință) — ex: D300 raportat. */
  expected: number
  /** Valoare găsită — ex: Σ facturi OCR. */
  actual: number
  /** Diferența absolută (expected - actual). */
  diff: number
  /** Diferența procentuală (|diff| / max(|expected|, 0.01)). */
  diffPercent: number
  /** Etichetă pentru diff (ex: "TVA RON"). */
  label?: string
}

export type CrossCorrelationFinding = {
  id: string
  rule: CrossCorrelationRule
  ruleName: string
  severity: CrossCorrelationSeverity
  title: string
  summary: string
  detail: string
  period: string | null
  sources: SourceRef[]
  diff?: DiffData
  legalReference?: string
  suggestion?: string
  /** [FC-5] Impact economic estimat — populat de annotateWithImpact din engine. */
  economicImpact?: {
    affectedAmountRON: number | null
    penaltyMinRON: number
    penaltyMaxRON: number
    remediationHours: number
    retransmissions: number
    totalCostMinRON: number
    totalCostMaxRON: number
    legalReferences: string[]
    computationNote: string
  }
}

export type CrossCorrelationSummaryByRule = Record<
  CrossCorrelationRule,
  { ok: number; warning: number; error: number; info: number }
>

export type CrossCorrelationReport = {
  generatedAtISO: string
  findings: CrossCorrelationFinding[]
  summary: {
    totalChecks: number
    ok: number
    info: number
    warnings: number
    errors: number
    byRule: CrossCorrelationSummaryByRule
    /** [FC-5] Sumar economic agregat — total cost estimat în RON. */
    economic?: {
      totalAffectedRON: number
      totalPenaltyMinRON: number
      totalPenaltyMaxRON: number
      totalRemediationHours: number
      totalRetransmissions: number
      totalCostMinRON: number
      totalCostMaxRON: number
      impactfulFindingsCount: number
    }
  }
  inputs: {
    d300Count: number
    d205Count: number
    d100Count: number
    agaCount: number
    invoicesCount: number
    onrcCount: number
    filingsCount?: number
  }
}

export type CrossCorrelationInput = {
  declarations: ParsedDeclarationRecord[]
  aga: ParsedAgaRecord[]
  invoices: ParsedInvoiceRecord[]
  onrc: OnrcSnapshotRecord[]
  /** Filing records pentru R6 (termen ↔ depunere) și R7 (frecvență). */
  filings?: FilingRecord[]
  /** Frecvență TVA așteptată conform profilului fiscal: "monthly" sau "quarterly". */
  expectedVatFrequency?: "monthly" | "quarterly" | null
}

// ── Tolerances ──────────────────────────────────────────────────────────────

/** Sub această diferență absolută (RON), nu raportăm warning. */
const ABS_TOLERANCE_RON = 1.0
/** Sub această diferență procentuală, nu raportăm warning. */
const PCT_TOLERANCE = 0.01 // 1%
/** Toleranță % pentru procente deținere (R3). */
const OWNERSHIP_PCT_TOLERANCE = 0.5 // 0.5 puncte procentuale
/** Zile întârziere maximă tolerată pentru R6 (depunere vs termen). */
const FILING_DELAY_TOLERANCE_DAYS = 1 // max 1 zi grațiere
/** Câte filing-uri minim pentru a deduce o frecvență (R7). */
const MIN_FILINGS_FOR_FREQUENCY_INFERENCE = 3

// ── Helpers ─────────────────────────────────────────────────────────────────

let idCounter = 0
function nextId(rule: string): string {
  idCounter += 1
  return `xcorr-${rule.toLowerCase()}-${Date.now().toString(36)}-${idCounter}`
}

function computeDiff(expected: number, actual: number, label?: string): DiffData {
  const diff = expected - actual
  const denom = Math.max(Math.abs(expected), 0.01)
  return {
    expected,
    actual,
    diff,
    diffPercent: Math.abs(diff) / denom,
    label,
  }
}

function severityFromDiff(diff: DiffData): CrossCorrelationSeverity {
  if (Math.abs(diff.diff) <= ABS_TOLERANCE_RON) return "ok"
  if (diff.diffPercent <= PCT_TOLERANCE) return "ok"
  if (Math.abs(diff.diff) <= 10 || diff.diffPercent <= 0.05) return "warning"
  return "error"
}

/** Mapează un period D300/D100 quarterly ("2026-Q2") la lista lunilor componente. */
export function quarterMonths(period: string): string[] {
  const m = period.match(/^(\d{4})-Q([1-4])$/)
  if (!m) return [period]
  const year = m[1]
  const q = parseInt(m[2]!, 10)
  const start = (q - 1) * 3 + 1
  return [start, start + 1, start + 2].map(
    (mo) => `${year}-${mo.toString().padStart(2, "0")}`,
  )
}

/** Returnează lista de perioade lunare/q componenta unui an. */
export function yearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    `${year}-${(i + 1).toString().padStart(2, "0")}`,
  )
}

/** Normalizează CNP / CUI pentru comparare. */
export function normalizeId(id: string | null): string {
  if (!id) return ""
  return id.replace(/^RO/i, "").replace(/\s+/g, "").trim().toUpperCase()
}

// ── Rule R1: Σ facturi primite ↔ D300 deductibil ────────────────────────────

function ruleR1(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  const d300Records = input.declarations.filter((r) => r.type === "d300")
  if (d300Records.length === 0) {
    return [
      {
        id: nextId("R1"),
        rule: "R1",
        ruleName: "Σ TVA facturi primite ↔ D300 TVA deductibil",
        severity: "info",
        title: "R1 — Nu există D300 încărcat",
        summary: "Încarcă măcar o D300 pentru a permite reconciliere cu facturile primite.",
        detail:
          "Cross-correlation R1 compară suma TVA-ului din facturile primite OCR-ate cu valoarea TVA deductibil raportată în D300 (rd24-rd33). Pentru a rula regula, încarcă XML-uri D300 lunare/trimestriale.",
        period: null,
        sources: [],
      },
    ]
  }

  for (const decl of d300Records) {
    const data = decl.data as D300ParsedData
    if (!decl.period) continue

    // Determină lunile componente (pentru D300 trimestrial)
    const months = quarterMonths(decl.period)
    const matchingInvoices = input.invoices.filter(
      (inv) => inv.direction === "primita" && inv.period && months.includes(inv.period),
    )
    const sumOcrVat = matchingInvoices.reduce(
      (s, inv) => s + (inv.totalVatRON ?? 0),
      0,
    )
    const d300DeductibleVat = data.totalDeductibleVat

    const diff = computeDiff(
      d300DeductibleVat,
      sumOcrVat,
      "TVA deductibil RON",
    )
    const severity = matchingInvoices.length === 0 ? "info" : severityFromDiff(diff)

    const sources: SourceRef[] = [
      {
        type: "d300",
        id: decl.id,
        label: `D300 ${decl.period} (${decl.cui ?? "?"})`,
        period: decl.period,
        value: d300DeductibleVat,
        valueLabel: "TVA deductibil declarat",
      },
      ...matchingInvoices.slice(0, 50).map(
        (inv): SourceRef => ({
          type: "invoice",
          id: inv.id,
          label: `${inv.invoiceNumber ?? "fără număr"} · ${inv.partnerName ?? "?"}`,
          period: inv.period,
          value: inv.totalVatRON ?? 0,
          valueLabel: "TVA factură",
        }),
      ),
    ]

    if (severity === "info" && matchingInvoices.length === 0) {
      findings.push({
        id: nextId("R1"),
        rule: "R1",
        ruleName: "Σ TVA facturi primite ↔ D300 TVA deductibil",
        severity: "info",
        title: `R1 ${decl.period} — Fără facturi OCR pentru comparație`,
        summary: `D300 raportează ${d300DeductibleVat.toFixed(2)} RON TVA deductibil, dar nu există facturi primite OCR pentru ${decl.period}.`,
        detail: `D300 ${decl.period} are TVA deductibil de ${d300DeductibleVat.toFixed(2)} RON. Pentru a verifica că această sumă corespunde realității, încarcă facturile primite (OCR Gemini Vision) pentru lunile ${months.join(", ")}.`,
        period: decl.period,
        sources,
        legalReference: "Cod Fiscal Art. 297 + OPANAF 1253/2021 (D300).",
        suggestion: "Încarcă facturile primite din această perioadă în secțiunea OCR.",
      })
      continue
    }

    findings.push({
      id: nextId("R1"),
      rule: "R1",
      ruleName: "Σ TVA facturi primite ↔ D300 TVA deductibil",
      severity,
      title:
        severity === "ok"
          ? `R1 ${decl.period} — TVA deductibil concordant cu OCR`
          : `R1 ${decl.period} — Discrepanță TVA deductibil ${diff.diff > 0 ? "lipsește" : "suplimentar"} ${Math.abs(diff.diff).toFixed(2)} RON`,
      summary:
        severity === "ok"
          ? `D300 raportează ${d300DeductibleVat.toFixed(2)} RON, OCR facturi primite însumează ${sumOcrVat.toFixed(2)} RON — concordant.`
          : `D300 ${d300DeductibleVat.toFixed(2)} RON vs OCR Σ ${sumOcrVat.toFixed(2)} RON (${matchingInvoices.length} facturi). Diferență ${diff.diff.toFixed(2)} RON (${(diff.diffPercent * 100).toFixed(1)}%).`,
      detail: `Pentru perioada ${decl.period} D300 declară TVA deductibil de ${d300DeductibleVat.toFixed(2)} RON. Suma TVA-ului din ${matchingInvoices.length} facturi primite OCR-ate pentru această perioadă este ${sumOcrVat.toFixed(2)} RON. ${
        diff.diff > 0
          ? "D300 raportează mai mult decât OCR — fie lipsesc facturi din scan, fie D300 conține TVA dedus eronat."
          : "OCR însumează mai mult decât D300 — fie facturi neeligibile pentru deducere, fie D300 sub-raportează."
      } Toleranță: ${ABS_TOLERANCE_RON} RON sau ${(PCT_TOLERANCE * 100).toFixed(0)}%.`,
      period: decl.period,
      sources,
      diff,
      legalReference: "Cod Fiscal Art. 297 (drept de deducere TVA) + OPANAF 1253/2021.",
      suggestion:
        diff.diff > 0
          ? "Verifică dacă există facturi primite neîncărcate în OCR. Sau dacă D300 include TVA nedeductibil (cf. Art. 297 alin. 7)."
          : "Verifică dacă unele facturi OCR-ate sunt nedeductibile (achiziții pentru uz personal, exonerate, etc.) sau dacă lipsesc din D300.",
    })
  }

  return findings
}

// ── Rule R2: AGA dividende ↔ D205 dividende ─────────────────────────────────

function ruleR2(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  const d205Records = input.declarations.filter((r) => r.type === "d205")

  if (input.aga.length === 0) {
    if (d205Records.length > 0) {
      return [
        {
          id: nextId("R2"),
          rule: "R2",
          ruleName: "AGA dividende ↔ D205 dividende",
          severity: "info",
          title: "R2 — D205 conține beneficiari dar nu există AGA înregistrate",
          summary:
            "Pentru a valida sursa dividendelor declarate în D205 necesită hotărâri AGA.",
          detail:
            "D205 raportează dividende plătite asociaților. Hotărârea AGA care a aprobat distribuția trebuie încărcată pentru a putea verifica sumele și beneficiarii. Lipsa AGA face imposibilă verificarea legalității distribuției.",
          period: null,
          sources: d205Records.slice(0, 10).map(
            (d): SourceRef => ({
              type: "d205",
              id: d.id,
              label: `D205 ${d.period ?? "?"}`,
              period: d.period,
            }),
          ),
          legalReference: "Legea 31/1990 Art. 67 + OPANAF privind D205.",
          suggestion:
            "Încarcă hotărârile AGA din anii financiari aferenți D205-urilor.",
        },
      ]
    }
    return [
      {
        id: nextId("R2"),
        rule: "R2",
        ruleName: "AGA dividende ↔ D205 dividende",
        severity: "info",
        title: "R2 — Fără AGA și D205 încărcate",
        summary: "Încarcă hotărâri AGA și D205 anuale pentru a permite reconciliere.",
        detail:
          "Cross-correlation R2 compară dividendele aprobate de AGA cu cele raportate ca venit reținut la sursă în D205 (per beneficiar, matching pe CNP).",
        period: null,
        sources: [],
      },
    ]
  }

  for (const aga of input.aga) {
    const year = aga.financialYear
    if (!year) {
      findings.push({
        id: nextId("R2"),
        rule: "R2",
        ruleName: "AGA dividende ↔ D205 dividende",
        severity: "warning",
        title: "R2 — AGA fără an financiar identificat",
        summary: "AGA nu are anul financiar extras — nu putem mapa la D205.",
        detail: `Hotărârea AGA cu id ${aga.id} nu are anul financiar extras de AI. Confirmă manual câmpul "financialYear" pentru a permite cross-correlation R2.`,
        period: null,
        sources: [
          {
            type: "aga",
            id: aga.id,
            label: `AGA ${aga.resolutionDate ?? "fără dată"}`,
          },
        ],
      })
      continue
    }

    const d205 = d205Records.find((d) => {
      const data = d.data as D205ParsedData
      return data.reportingYear === year
    })
    if (!d205) {
      findings.push({
        id: nextId("R2"),
        rule: "R2",
        ruleName: "AGA dividende ↔ D205 dividende",
        severity: "warning",
        title: `R2 — AGA ${year} fără D205 corespondent`,
        summary: `Hotărârea AGA aprobă dividende pentru anul ${year}, dar nu există D205 încărcată pentru acest an.`,
        detail: `AGA din ${aga.resolutionDate ?? "data necunoscută"} aprobă distribuție de dividende pentru exercițiul financiar ${year}. D205 (declarația informativă anuală impozit reținut) pentru anul ${year} nu este încă încărcată. Termen depunere: 28 februarie ${year + 1}.`,
        period: `${year}`,
        sources: [
          {
            type: "aga",
            id: aga.id,
            label: `AGA ${aga.resolutionDate ?? "?"} (an ${year})`,
            value: aga.data.totalDividendsAmount ?? undefined,
            valueLabel: "Total dividende AGA",
          },
        ],
        legalReference: "OPANAF D205 + Cod Fiscal Art. 97 (impozit dividende).",
        suggestion: `Încarcă D205 pentru anul ${year} când va fi depusă la ANAF.`,
      })
      continue
    }

    const d205Data = d205.data as D205ParsedData
    const dividendBeneficiaries = d205Data.beneficiaries.filter(
      (b) => b.incomeType === "dividende",
    )

    // Map per CNP
    const agaByCnp = new Map<string, typeof aga.data.associates[0]>()
    for (const a of aga.data.associates) {
      const key = normalizeId(a.id)
      if (key && a.idType === "CNP") {
        agaByCnp.set(key, a)
      }
    }
    const d205ByCnp = new Map<string, typeof dividendBeneficiaries[0]>()
    for (const b of dividendBeneficiaries) {
      const key = normalizeId(b.id)
      if (key && b.idType === "CNP") {
        d205ByCnp.set(key, b)
      }
    }

    // 1. Asociați AGA → trebuie să apară în D205
    for (const [cnp, agaAssoc] of agaByCnp) {
      const d205Ben = d205ByCnp.get(cnp)
      if (!d205Ben) {
        findings.push({
          id: nextId("R2"),
          rule: "R2",
          ruleName: "AGA dividende ↔ D205 dividende",
          severity: "error",
          title: `R2 — ${agaAssoc.name ?? "Asociat"} lipsește din D205 ${year}`,
          summary: `AGA atribuie ${(agaAssoc.dividendsAmount ?? 0).toFixed(2)} RON dividende lui ${agaAssoc.name ?? "?"} (CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)}), dar D205 ${year} nu raportează aceste dividende.`,
          detail: `Hotărârea AGA pentru anul financiar ${year} aprobă plată dividende către ${agaAssoc.name ?? "?"} (CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)}) în sumă de ${(agaAssoc.dividendsAmount ?? 0).toFixed(2)} RON. D205 ${year} nu conține un beneficiar cu acest CNP în secțiunea dividende. Risc: impozit neachitat / D205 incomplet.`,
          period: `${year}`,
          sources: [
            {
              type: "aga",
              id: aga.id,
              label: `AGA ${aga.resolutionDate ?? "?"}`,
              value: agaAssoc.dividendsAmount ?? 0,
              valueLabel: `Dividende ${agaAssoc.name}`,
            },
            { type: "d205", id: d205.id, label: `D205 ${year}` },
          ],
          legalReference: "Cod Fiscal Art. 97 + OPANAF D205.",
          suggestion:
            "Verifică dacă dividendele au fost realmente plătite. Dacă da, rectifică D205. Dacă nu, marchează în registru ca neplătite.",
        })
        continue
      }

      // Match found: compare amounts
      const agaAmount = agaAssoc.dividendsAmount ?? 0
      const d205Amount = d205Ben.grossIncome
      const diff = computeDiff(agaAmount, d205Amount, "RON")
      const severity = severityFromDiff(diff)
      findings.push({
        id: nextId("R2"),
        rule: "R2",
        ruleName: "AGA dividende ↔ D205 dividende",
        severity,
        title:
          severity === "ok"
            ? `R2 — ${agaAssoc.name} concordant AGA↔D205 ${year}`
            : `R2 — ${agaAssoc.name} diferență ${Math.abs(diff.diff).toFixed(2)} RON AGA↔D205 ${year}`,
        summary:
          severity === "ok"
            ? `${agaAssoc.name}: AGA ${agaAmount.toFixed(2)} RON ≈ D205 ${d205Amount.toFixed(2)} RON.`
            : `${agaAssoc.name}: AGA ${agaAmount.toFixed(2)} RON vs D205 ${d205Amount.toFixed(2)} RON (diff ${diff.diff.toFixed(2)}).`,
        detail: `Pentru asociatul ${agaAssoc.name ?? "?"} (CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)}), exercițiul financiar ${year}: AGA aprobă ${agaAmount.toFixed(2)} RON dividende, D205 raportează ${d205Amount.toFixed(2)} RON venit brut din dividende. ${
          severity === "ok"
            ? "Sumele coincid în limita toleranței."
            : `Diferență: ${diff.diff.toFixed(2)} RON (${(diff.diffPercent * 100).toFixed(1)}%).`
        }`,
        period: `${year}`,
        sources: [
          {
            type: "aga",
            id: aga.id,
            label: `AGA ${aga.resolutionDate ?? "?"}`,
            value: agaAmount,
            valueLabel: "Dividende AGA",
          },
          {
            type: "d205",
            id: d205.id,
            label: `D205 ${year} beneficiar ${agaAssoc.name}`,
            value: d205Amount,
            valueLabel: "Venit brut D205",
          },
        ],
        diff: severity === "ok" ? undefined : diff,
        legalReference: "Cod Fiscal Art. 97 + Legea 31/1990 Art. 67.",
      })
    }

    // 2. Beneficiari D205 fără AGA corespondent
    for (const [cnp, d205Ben] of d205ByCnp) {
      if (!agaByCnp.has(cnp)) {
        findings.push({
          id: nextId("R2"),
          rule: "R2",
          ruleName: "AGA dividende ↔ D205 dividende",
          severity: "warning",
          title: `R2 — ${d205Ben.name ?? "Beneficiar"} D205 fără AGA ${year}`,
          summary: `D205 ${year} raportează ${d205Ben.grossIncome.toFixed(2)} RON dividende către ${d205Ben.name ?? "?"} (CNP), dar AGA încărcată nu include acest CNP.`,
          detail: `D205 pentru anul ${year} conține beneficiar dividende cu CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)} (${d205Ben.name ?? "?"}, ${d205Ben.grossIncome.toFixed(2)} RON), dar AGA ${aga.resolutionDate ?? "?"} nu include acest asociat. Verifică dacă există AGA suplimentară pentru același an sau dacă D205 conține eroare.`,
          period: `${year}`,
          sources: [
            { type: "aga", id: aga.id, label: `AGA ${aga.resolutionDate ?? "?"}` },
            {
              type: "d205",
              id: d205.id,
              label: `D205 ${year} · ${d205Ben.name ?? "?"}`,
              value: d205Ben.grossIncome,
              valueLabel: "Venit D205",
            },
          ],
          legalReference: "OPANAF D205.",
          suggestion:
            "Verifică dacă există o a doua AGA pentru același an sau o decizie de distribuție derogatorie.",
        })
      }
    }
  }

  return findings
}

// ── Rule R3: AGA procent ↔ ONRC procent ─────────────────────────────────────

function ruleR3(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  if (input.aga.length === 0 || input.onrc.length === 0) {
    return [
      {
        id: nextId("R3"),
        rule: "R3",
        ruleName: "AGA procent deținere ↔ ONRC procent",
        severity: "info",
        title: "R3 — Lipsesc AGA sau ONRC pentru comparare",
        summary:
          input.aga.length === 0
            ? "Încarcă hotărâri AGA pentru a verifica procentele de deținere."
            : "Caută firma în ONRC (cu asociați) pentru a verifica procentele.",
        detail:
          "Cross-correlation R3 compară procentele de deținere declarate în AGA cu cele înregistrate la ONRC (per asociat, matching pe CNP).",
        period: null,
        sources: [],
      },
    ]
  }

  // Build ONRC index pe CNP → snapshot+associate
  const onrcCnpIndex = new Map<
    string,
    { snapshot: OnrcSnapshotRecord; associate: OnrcSnapshotRecord["associates"][0] }
  >()
  for (const snap of input.onrc) {
    for (const a of snap.associates) {
      const key = normalizeId(a.id)
      if (key && a.idType === "CNP") {
        onrcCnpIndex.set(key, { snapshot: snap, associate: a })
      }
    }
  }

  for (const aga of input.aga) {
    for (const agaAssoc of aga.data.associates) {
      const cnp = normalizeId(agaAssoc.id)
      if (!cnp || agaAssoc.idType !== "CNP") continue
      const agaOwn = agaAssoc.ownershipPercent
      if (agaOwn === null) continue

      const onrcMatch = onrcCnpIndex.get(cnp)
      if (!onrcMatch) {
        findings.push({
          id: nextId("R3"),
          rule: "R3",
          ruleName: "AGA procent deținere ↔ ONRC procent",
          severity: "warning",
          title: `R3 — ${agaAssoc.name ?? "Asociat"} apare în AGA dar nu în ONRC`,
          summary: `${agaAssoc.name ?? "?"} (CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)}) deține ${agaOwn}% conform AGA, dar lipsește din snapshot-urile ONRC încărcate.`,
          detail: `Hotărârea AGA listează ${agaAssoc.name ?? "asociat"} cu ${agaOwn}% deținere. Nu există ONRC snapshot care să confirme acest asociat. Caută firma respectivă în ONRC sau introdu asociații manual.`,
          period: aga.financialYear ? `${aga.financialYear}` : null,
          sources: [
            {
              type: "aga",
              id: aga.id,
              label: `AGA ${aga.resolutionDate ?? "?"}`,
              value: agaOwn,
              valueLabel: "Deținere AGA %",
            },
          ],
          suggestion: "Adaugă snapshot ONRC pentru firma respectivă (secțiunea ONRC).",
        })
        continue
      }

      const onrcOwn = onrcMatch.associate.ownershipPercent
      const diff = computeDiff(agaOwn, onrcOwn, "puncte procentuale")
      const severity: CrossCorrelationSeverity =
        Math.abs(diff.diff) <= OWNERSHIP_PCT_TOLERANCE ? "ok" : Math.abs(diff.diff) <= 5 ? "warning" : "error"

      findings.push({
        id: nextId("R3"),
        rule: "R3",
        ruleName: "AGA procent deținere ↔ ONRC procent",
        severity,
        title:
          severity === "ok"
            ? `R3 — ${agaAssoc.name} concordant AGA↔ONRC (${agaOwn}%)`
            : `R3 — ${agaAssoc.name} diferență ${Math.abs(diff.diff).toFixed(1)}pp AGA↔ONRC`,
        summary:
          severity === "ok"
            ? `${agaAssoc.name}: ${agaOwn}% AGA = ${onrcOwn}% ONRC.`
            : `${agaAssoc.name}: AGA ${agaOwn}% vs ONRC ${onrcOwn}% (diferență ${diff.diff.toFixed(1)}pp).`,
        detail: `Pentru asociatul ${agaAssoc.name ?? "?"} (CNP ${cnp.slice(0, 4)}***${cnp.slice(-4)}): AGA atribuie ${agaOwn}% deținere, ONRC ${onrcMatch.snapshot.companyName ?? onrcMatch.snapshot.cui} înregistrează ${onrcOwn}%. ${
          severity === "ok"
            ? "Cotele coincid în limita toleranței."
            : "Discrepanță posibil cauzată de transfer părți sociale neactualizat la ONRC sau distribuție derogatorie nelegală (art. 67 alin. 2 Legea 31/1990)."
        }`,
        period: aga.financialYear ? `${aga.financialYear}` : null,
        sources: [
          {
            type: "aga",
            id: aga.id,
            label: `AGA ${aga.resolutionDate ?? "?"}`,
            value: agaOwn,
            valueLabel: "Deținere AGA %",
          },
          {
            type: "onrc",
            id: onrcMatch.snapshot.id,
            label: `ONRC ${onrcMatch.snapshot.companyName ?? onrcMatch.snapshot.cui}`,
            value: onrcOwn,
            valueLabel: "Deținere ONRC %",
          },
        ],
        diff: severity === "ok" ? undefined : diff,
        legalReference: "Legea 31/1990 Art. 7 + Art. 67.",
        suggestion:
          severity !== "ok"
            ? "Verifică dacă cesiunea părților sociale a fost înregistrată la ONRC. Sau dacă AGA a aplicat distribuție derogatorie cu acord unanim."
            : undefined,
      })
    }
  }

  return findings
}

// ── Rule R5: D205 ↔ Σ D100 dividende ────────────────────────────────────────

function ruleR5(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  const d205Records = input.declarations.filter((r) => r.type === "d205")
  const d100Records = input.declarations.filter((r) => r.type === "d100")

  if (d205Records.length === 0 && d100Records.length === 0) {
    return [
      {
        id: nextId("R5"),
        rule: "R5",
        ruleName: "D205 anual dividende ↔ Σ D100 lunare cod 480",
        severity: "info",
        title: "R5 — Fără D205 și D100 încărcate",
        summary: "Încarcă D100 lunare și D205 anuală pentru reconciliere.",
        detail:
          "Cross-correlation R5 verifică că suma impozit dividende declarată lunar în D100 (cod 480) coincide cu impozit reținut anual raportat în D205.",
        period: null,
        sources: [],
      },
    ]
  }

  for (const d205 of d205Records) {
    const d205Data = d205.data as D205ParsedData
    const year = d205Data.reportingYear
    if (!year) continue

    const dividendBeneficiaries = d205Data.beneficiaries.filter(
      (b) => b.incomeType === "dividende",
    )
    const d205TotalTax = dividendBeneficiaries.reduce(
      (s, b) => s + b.withheldTax,
      0,
    )

    // Toate D100 din același an
    const yearMonthsList = yearMonths(year)
    const d100ForYear = d100Records.filter((d) => {
      const data = d.data as D100ParsedData
      if (!data.period) return false
      // D100 poate fi lunar (YYYY-MM) sau trimestrial (YYYY-Qn)
      if (data.period.frequency === "monthly") {
        return yearMonthsList.includes(data.period.period)
      }
      if (data.period.frequency === "quarterly") {
        return data.period.year === year
      }
      return false
    })

    const d100DividendTax = d100ForYear.reduce((s, d) => {
      const data = d.data as D100ParsedData
      const div = data.summaryByCategory.dividende
      return s + (div?.totalDue ?? 0)
    }, 0)

    if (d100ForYear.length === 0) {
      findings.push({
        id: nextId("R5"),
        rule: "R5",
        ruleName: "D205 anual dividende ↔ Σ D100 lunare cod 480",
        severity: "warning",
        title: `R5 — D205 ${year} fără D100 corespondent`,
        summary: `D205 ${year} raportează impozit dividende ${d205TotalTax.toFixed(2)} RON, dar nu există D100 încărcat pentru ${year}.`,
        detail: `D205 anuală pentru ${year} indică ${d205TotalTax.toFixed(2)} RON impozit reținut pe dividende. Pentru a valida fluxul de plată la bugetul de stat (cod 480), trebuie încărcate D100 lunare/trimestriale ale anului ${year}.`,
        period: `${year}`,
        sources: [
          {
            type: "d205",
            id: d205.id,
            label: `D205 ${year}`,
            value: d205TotalTax,
            valueLabel: "Impozit dividende D205",
          },
        ],
        legalReference: "Cod Fiscal Art. 97 + OPANAF D100/D205.",
        suggestion: `Încarcă D100 lunare pentru ${year} în secțiunea D100.`,
      })
      continue
    }

    const diff = computeDiff(d205TotalTax, d100DividendTax, "RON impozit")
    const severity = severityFromDiff(diff)

    const sources: SourceRef[] = [
      {
        type: "d205",
        id: d205.id,
        label: `D205 ${year}`,
        value: d205TotalTax,
        valueLabel: "Impozit dividende anual",
      },
      ...d100ForYear.map(
        (d): SourceRef => ({
          type: "d100",
          id: d.id,
          label: `D100 ${d.period ?? "?"}`,
          period: d.period,
          value:
            ((d.data as D100ParsedData).summaryByCategory.dividende?.totalDue) ?? 0,
          valueLabel: "Impozit dividende lunar",
        }),
      ),
    ]

    findings.push({
      id: nextId("R5"),
      rule: "R5",
      ruleName: "D205 anual dividende ↔ Σ D100 lunare cod 480",
      severity,
      title:
        severity === "ok"
          ? `R5 ${year} — D205 dividende concordant cu Σ D100 lunare`
          : `R5 ${year} — Discrepanță ${Math.abs(diff.diff).toFixed(2)} RON D205↔D100`,
      summary:
        severity === "ok"
          ? `D205 ${year} impozit ${d205TotalTax.toFixed(2)} RON ≈ Σ D100 (${d100ForYear.length} luni) ${d100DividendTax.toFixed(2)} RON.`
          : `D205 ${d205TotalTax.toFixed(2)} RON vs Σ D100 (${d100ForYear.length} luni) ${d100DividendTax.toFixed(2)} RON.`,
      detail: `Pentru anul ${year}: D205 raportează ${d205TotalTax.toFixed(2)} RON impozit reținut pe dividende. Suma codului 480 (impozit dividende) din ${d100ForYear.length} D100 ale anului = ${d100DividendTax.toFixed(2)} RON. ${
        severity === "ok"
          ? "Valorile coincid în limita toleranței."
          : `Diferență: ${diff.diff.toFixed(2)} RON. Cauze probabile: D100 lipsă, rectificare necontabilizată, sau eroare cod buget (480 vs 481).`
      }`,
      period: `${year}`,
      sources,
      diff: severity === "ok" ? undefined : diff,
      legalReference: "Cod Fiscal Art. 97 + OPANAF D100 (cod 480) + OPANAF D205.",
      suggestion:
        severity !== "ok"
          ? "Verifică toate D100 ale anului (12 lunare sau 4 trimestriale). Dacă lipsesc, încarcă-le. Dacă cifrele rămân divergente, verifică pentru rectificative."
          : undefined,
    })
  }

  return findings
}

// ── Rule R6: termen calendar fiscal ↔ data depunere efectivă ───────────────
// FC-4 (2026-05-14): R6 detectează depuneri întârziate. Pentru fiecare
// FilingRecord cu filedAtISO > dueISO + grace → finding warning/error.
// "Bate la timp" e cheia compliance — penalități Cod Fiscal Art. 219 încep
// imediat după termen, cu agravare după 15 / 30 / 60 zile.

const MS_PER_DAY_CONST = 86_400_000

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round(
    (new Date(toISO).getTime() - new Date(fromISO).getTime()) / MS_PER_DAY_CONST,
  )
}

const FILING_TYPE_LABELS_LOCAL: Record<FilingType, string> = {
  d300_tva: "D300 (TVA)",
  d390_recap: "D390 (Recapitulativă VIES)",
  d394_local: "D394 (Achiziții/Livrări locale)",
  saft: "SAF-T (D406)",
  efactura_monthly: "e-Factura raport lunar",
  etva_precompletata: "RO e-TVA precompletată",
}

function ruleR6(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  const filings = input.filings ?? []

  if (filings.length === 0) {
    return [
      {
        id: nextId("R6"),
        rule: "R6",
        ruleName: "Termen calendar fiscal ↔ data depunere efectivă",
        severity: "info",
        title: "R6 — Nu există filing records înregistrate",
        summary:
          "Adaugă FilingRecord-uri pentru a detecta depuneri întârziate și expunere la penalități.",
        detail:
          "Cross-correlation R6 compară termenul fiscal cu data efectivă de depunere. Pentru fiecare declarație depusă cu întârziere se calculează expunerea la penalități (Cod Fiscal Art. 219).",
        period: null,
        sources: [],
      },
    ]
  }

  for (const filing of filings) {
    if (filing.status === "upcoming") continue
    if (filing.status === "missing") {
      // R6 raportează separat și depunerile lipsă (urgente)
      const daysOverdue = daysBetween(filing.dueISO, new Date().toISOString())
      findings.push({
        id: nextId("R6"),
        rule: "R6",
        ruleName: "Termen calendar fiscal ↔ data depunere efectivă",
        severity: daysOverdue > 30 ? "error" : "warning",
        title: `R6 ${filing.period} — ${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} nedepusă (${daysOverdue} zile întârziere)`,
        summary: `${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} pentru ${filing.period} are termenul ${filing.dueISO.slice(0, 10)} și NU a fost depusă. ${daysOverdue} zile întârziere.`,
        detail: `Termenul fiscal de depunere a fost ${filing.dueISO.slice(0, 10)}. La data curentă, declarația este încă marcată ca nedepusă. Cu cât întârzierea e mai mare, cu atât penalitatea fixă crește (Cod Fiscal Art. 219, OG 92/2003).`,
        period: filing.period,
        sources: [
          {
            type: "filing",
            id: filing.id,
            label: `${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} ${filing.period}`,
            period: filing.period,
            value: daysOverdue,
            valueLabel: "Zile întârziere (de la termen)",
          },
        ],
        legalReference: "Cod Fiscal Art. 219 + OG 92/2003 (penalități tardiv).",
        suggestion:
          "Depune urgent declarația sau marchează în calendar ca executată. Termenele expirate generează penalități cumulative.",
      })
      continue
    }

    if (!filing.filedAtISO) continue
    const daysLate = daysBetween(filing.dueISO, filing.filedAtISO)

    if (daysLate <= FILING_DELAY_TOLERANCE_DAYS) {
      findings.push({
        id: nextId("R6"),
        rule: "R6",
        ruleName: "Termen calendar fiscal ↔ data depunere efectivă",
        severity: "ok",
        title: `R6 ${filing.period} — ${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} depusă la timp`,
        summary: `${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} ${filing.period}: termen ${filing.dueISO.slice(0, 10)} → depusă ${filing.filedAtISO.slice(0, 10)}. La timp.`,
        detail: `Termenul de depunere ${filing.dueISO.slice(0, 10)} a fost respectat (depunere ${filing.filedAtISO.slice(0, 10)}, ${daysLate} zile diferență — în limita toleranței).`,
        period: filing.period,
        sources: [
          {
            type: "calendar",
            id: `calendar-${filing.id}`,
            label: `Termen calendar fiscal`,
            period: filing.period,
            value: 0,
            valueLabel: "Termen",
          },
          {
            type: "filing",
            id: filing.id,
            label: `Depunere ${filing.filedAtISO.slice(0, 10)}`,
            period: filing.period,
            value: 0,
            valueLabel: "Data efectivă",
          },
        ],
        legalReference: "Cod Fiscal Art. 219.",
      })
      continue
    }

    // Întârziere reală
    const severity: CrossCorrelationSeverity =
      daysLate <= 5 ? "warning" : daysLate <= 15 ? "warning" : "error"

    findings.push({
      id: nextId("R6"),
      rule: "R6",
      ruleName: "Termen calendar fiscal ↔ data depunere efectivă",
      severity,
      title: `R6 ${filing.period} — ${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} depusă cu ${daysLate} zile întârziere`,
      summary: `${FILING_TYPE_LABELS_LOCAL[filing.type] ?? filing.type} ${filing.period}: termen ${filing.dueISO.slice(0, 10)} → depusă ${filing.filedAtISO.slice(0, 10)} (${daysLate} zile întârziere).`,
      detail: `Termenul fiscal era ${filing.dueISO.slice(0, 10)}. Depunerea efectivă a fost ${filing.filedAtISO.slice(0, 10)}, cu ${daysLate} zile întârziere. Penalitățile cresc progresiv: până la 30 zile = penalitate fixă mică; peste 30 zile = procent din valoarea raportată (Cod Fiscal Art. 219).`,
      period: filing.period,
      sources: [
        {
          type: "calendar",
          id: `calendar-${filing.id}`,
          label: `Termen calendar fiscal ${filing.dueISO.slice(0, 10)}`,
          period: filing.period,
          value: 0,
          valueLabel: "Termen oficial",
        },
        {
          type: "filing",
          id: filing.id,
          label: `Depunere efectivă ${filing.filedAtISO.slice(0, 10)}`,
          period: filing.period,
          value: daysLate,
          valueLabel: "Zile întârziere",
        },
      ],
      diff: {
        expected: 0,
        actual: daysLate,
        diff: -daysLate,
        diffPercent: 1,
        label: "zile întârziere",
      },
      legalReference: "Cod Fiscal Art. 219, OG 92/2003 + OPANAF privind penalități.",
      suggestion:
        daysLate <= 15
          ? "Verifică dacă există motiv obiectiv pentru întârziere (notificare ANAF, indisponibilitate SPV). Documentează cazul în notes."
          : "Întârzierea peste 15 zile riscă penalitate procentuală. Verifică imediat dacă există decizie ANAF emisă pentru această perioadă.",
    })
  }

  return findings
}

// ── Rule R7: frecvență reală depuneri ↔ frecvență așteptată ─────────────────
// FC-4 (2026-05-14): R7 detectează mismatch între frecvența detectată (din
// FilingRecord-urile efective) și frecvența așteptată conform profilului
// (orgProfile.vatFrequency). Trecere de la lunar la trimestrial NEdeclarată
// la ANAF e clasic — generează rectificative + amenzi.

type DetectedFrequency = "monthly" | "quarterly" | "mixed" | "insufficient_data"

function detectFilingFrequency(filings: FilingRecord[]): DetectedFrequency {
  if (filings.length < MIN_FILINGS_FOR_FREQUENCY_INFERENCE) {
    return "insufficient_data"
  }
  let monthly = 0
  let quarterly = 0
  for (const f of filings) {
    if (f.period.match(/^\d{4}-Q\d$/)) quarterly++
    else if (f.period.match(/^\d{4}-\d{2}$/)) monthly++
  }
  if (monthly > 0 && quarterly > 0) return "mixed"
  if (monthly >= MIN_FILINGS_FOR_FREQUENCY_INFERENCE) return "monthly"
  if (quarterly >= MIN_FILINGS_FOR_FREQUENCY_INFERENCE) return "quarterly"
  return "insufficient_data"
}

function ruleR7(input: CrossCorrelationInput): CrossCorrelationFinding[] {
  const findings: CrossCorrelationFinding[] = []
  const filings = input.filings ?? []
  const expectedFreq = input.expectedVatFrequency ?? null

  // Concentrăm pe D300 (TVA) pentru frecvență, dar putem extinde la alte tipuri
  const d300Filings = filings.filter((f) => f.type === "d300_tva")

  if (d300Filings.length === 0) {
    return [
      {
        id: nextId("R7"),
        rule: "R7",
        ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
        severity: "info",
        title: "R7 — Nu există D300 filing records pentru detecția frecvenței",
        summary: "Adaugă cel puțin 3 D300-uri pentru a detecta frecvența reală.",
        detail:
          "R7 detectează schimbări de frecvență (lunar ↔ trimestrial) nedeclarate la ANAF. Pentru a rula regula, ai nevoie de cel puțin 3 filing records D300.",
        period: null,
        sources: [],
      },
    ]
  }

  const detected = detectFilingFrequency(d300Filings)

  if (detected === "insufficient_data") {
    findings.push({
      id: nextId("R7"),
      rule: "R7",
      ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
      severity: "info",
      title: `R7 — Doar ${d300Filings.length} D300 filing (minim ${MIN_FILINGS_FOR_FREQUENCY_INFERENCE} pentru detecție)`,
      summary: `Avem ${d300Filings.length} D300-uri înregistrate. Pentru detecție frecvență e nevoie de min ${MIN_FILINGS_FOR_FREQUENCY_INFERENCE}.`,
      detail: "Așteptăm mai multe filing records pentru a deduce frecvența reală.",
      period: null,
      sources: d300Filings.slice(0, 5).map((f) => ({
        type: "filing",
        id: f.id,
        label: `D300 ${f.period}`,
        period: f.period,
      })),
    })
    return findings
  }

  if (detected === "mixed") {
    findings.push({
      id: nextId("R7"),
      rule: "R7",
      ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
      severity: "error",
      title: "R7 — Frecvență MIXTĂ detectată (lunar + trimestrial în paralel)",
      summary:
        "Există atât D300 lunare cât și trimestriale înregistrate. Una dintre frecvențe e probabil greșită.",
      detail:
        "Un contribuabil are O SINGURĂ frecvență D300 (lunar SAU trimestrial, NU ambele simultan). Mixed = fie ai schimbat frecvența la mijlocul anului fără declarație 010, fie o rectificare a fost încărcată cu period eronat.",
      period: null,
      sources: d300Filings.slice(0, 10).map((f) => ({
        type: "filing",
        id: f.id,
        label: `D300 ${f.period}`,
        period: f.period,
      })),
      legalReference:
        "Cod Fiscal Art. 322 (perioada fiscală TVA) + OPANAF declarații 010 (notificare schimbare).",
      suggestion:
        "Depune declarația 010 la ANAF pentru a oficializa frecvența curentă. Verifică D300-urile cu period inconsistent dacă au fost rectificative.",
    })
    return findings
  }

  // detected e "monthly" sau "quarterly"
  if (!expectedFreq) {
    findings.push({
      id: nextId("R7"),
      rule: "R7",
      ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
      severity: "info",
      title: `R7 — Frecvență D300 detectată: ${detected === "monthly" ? "lunar" : "trimestrial"} (${d300Filings.length} declarații)`,
      summary: `Frecvența reală este ${detected === "monthly" ? "lunară" : "trimestrială"}. Setează frecvența așteptată în profilul fiscal pentru cross-check complet.`,
      detail:
        "Pentru a verifica complet R7 e necesar să avem și expectedVatFrequency din profilul fiscal. Trimite profilul prin /api/org/profile cu câmpul vatFrequency setat.",
      period: null,
      sources: d300Filings.slice(0, 5).map((f) => ({
        type: "filing",
        id: f.id,
        label: `D300 ${f.period}`,
        period: f.period,
      })),
    })
    return findings
  }

  if (detected === expectedFreq) {
    findings.push({
      id: nextId("R7"),
      rule: "R7",
      ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
      severity: "ok",
      title: `R7 — Frecvență D300 concordantă (${detected === "monthly" ? "lunar" : "trimestrial"})`,
      summary: `Detectat: ${detected}, așteptat: ${expectedFreq}. Match.`,
      detail: `${d300Filings.length} D300 înregistrate cu frecvența ${detected === "monthly" ? "lunară" : "trimestrială"} — concordant cu profilul fiscal.`,
      period: null,
      sources: d300Filings.slice(0, 5).map((f) => ({
        type: "filing",
        id: f.id,
        label: `D300 ${f.period}`,
        period: f.period,
      })),
      legalReference: "Cod Fiscal Art. 322.",
    })
    return findings
  }

  // Mismatch real: detected != expected
  findings.push({
    id: nextId("R7"),
    rule: "R7",
    ruleName: "Frecvență reală depuneri ↔ frecvență așteptată",
    severity: "error",
    title: `R7 — Mismatch frecvență: depui ${detected === "monthly" ? "LUNAR" : "TRIMESTRIAL"} dar profilul așteaptă ${expectedFreq === "monthly" ? "LUNAR" : "TRIMESTRIAL"}`,
    summary: `Frecvența reală D300 (${detected}) diferă de cea așteptată (${expectedFreq}). Risc penalitate sau notificare ANAF.`,
    detail: `Cifra de afaceri sau decizia A.G.A. determină frecvența TVA. Mismatch-ul indică fie: (a) trebuie depusă declarația 010 pentru a notifica schimbarea, fie (b) D300-urile au fost depuse cu frecvență greșită și necesită rectificative. Verifică art. 322 Cod Fiscal pentru pragul de schimbare (500.000 € cifră afaceri 12 luni).`,
    period: null,
    sources: d300Filings.slice(0, 10).map((f) => ({
      type: "filing",
      id: f.id,
      label: `D300 ${f.period}`,
      period: f.period,
    })),
    diff: {
      expected: 0,
      actual: 1,
      diff: -1,
      diffPercent: 1,
      label: `${expectedFreq} → ${detected}`,
    },
    legalReference:
      "Cod Fiscal Art. 322 (perioada fiscală TVA — modificare la pragul de 500.000 € cifră afaceri) + OPANAF declarații 010.",
    suggestion:
      "1. Depune declarația 010 pentru notificarea schimbării de frecvență. 2. Verifică dacă cifra de afaceri pe 12 luni anterioare a atins pragul de schimbare (500.000 €). 3. Dacă D300-urile sunt cu frecvență greșită, depune rectificative.",
  })

  return findings
}

// ── Orchestrator ────────────────────────────────────────────────────────────

export function runCrossCorrelation(
  input: CrossCorrelationInput,
): CrossCorrelationReport {
  // Reset counter for deterministic ids in a run
  idCounter = 0

  const findings: CrossCorrelationFinding[] = [
    ...ruleR1(input),
    ...ruleR2(input),
    ...ruleR3(input),
    ...ruleR5(input),
    ...ruleR6(input),
    ...ruleR7(input),
  ]

  // Sortează: errors first, warnings, info, ok last
  const SEV_ORDER: Record<CrossCorrelationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
    ok: 3,
  }
  findings.sort((a, b) => {
    const s = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
    if (s !== 0) return s
    return a.rule.localeCompare(b.rule)
  })

  const byRule: CrossCorrelationSummaryByRule = {
    R1: { ok: 0, warning: 0, error: 0, info: 0 },
    R2: { ok: 0, warning: 0, error: 0, info: 0 },
    R3: { ok: 0, warning: 0, error: 0, info: 0 },
    R5: { ok: 0, warning: 0, error: 0, info: 0 },
    R6: { ok: 0, warning: 0, error: 0, info: 0 },
    R7: { ok: 0, warning: 0, error: 0, info: 0 },
  }
  let ok = 0
  let info = 0
  let warnings = 0
  let errors = 0
  for (const f of findings) {
    byRule[f.rule][f.severity]++
    if (f.severity === "ok") ok++
    else if (f.severity === "info") info++
    else if (f.severity === "warning") warnings++
    else if (f.severity === "error") errors++
  }

  // [FC-5] Anotăm cu economic impact și agregăm sumar
  const findingsWithImpact = annotateWithImpact(findings)
  const economic = aggregateEconomicImpact(findingsWithImpact)

  return {
    generatedAtISO: new Date().toISOString(),
    findings: findingsWithImpact,
    summary: {
      totalChecks: findings.length,
      ok,
      info,
      warnings,
      errors,
      byRule,
      economic,
    },
    inputs: {
      d300Count: input.declarations.filter((r) => r.type === "d300").length,
      d205Count: input.declarations.filter((r) => r.type === "d205").length,
      d100Count: input.declarations.filter((r) => r.type === "d100").length,
      agaCount: input.aga.length,
      invoicesCount: input.invoices.length,
      onrcCount: input.onrc.length,
      filingsCount: (input.filings ?? []).length,
    },
  }
}
