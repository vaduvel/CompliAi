// GAP #5 (Sprint 4) — D300 vs P300 preventive comparator.
//
// PROBLEMA: ANAF (Decembrie 2024+) trimite RO e-TVA pre-completat (P300) și
// notifică contribuabilul DOAR DUPĂ ce diferența între D300-ul depus și P300
// depășește pragul tehnic (>20% și ≥5K lei). Contabilul reacționează după ce
// vine notificarea — costurile de „a corecta sub presiune" sunt mari.
//
// SOLUȚIE: comparăm preventiv, ÎNAINTE ca ANAF să trimită notificarea oficială.
// Generăm finding cu countdown 20 zile (termenul de răspuns conform OUG 70/2024
// modificată de 89/2025).
//
// Pure functions — NO I/O, safe în browser și server.

import type { ScanFinding } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"

// ── Types ────────────────────────────────────────────────────────────────────

export type VatDeclarationSnapshot = {
  period: string                  // "2026-04" (luna fiscală)
  taxableBase: number             // Baza impozabilă RON
  vatCollected: number            // TVA colectat RON
  vatDeducted: number             // TVA dedus RON
  vatToPay: number                // TVA de plată RON (collected - deducted)
}

export type D300P300DiffField = "taxableBase" | "vatCollected" | "vatDeducted" | "vatToPay"

export type D300P300FieldDiff = {
  field: D300P300DiffField
  fieldLabel: string
  declared: number                // ce a depus contribuabilul (D300)
  precomputed: number             // ce a calculat ANAF (P300)
  delta: number                   // declared - precomputed (positiv = subdeclarat)
  deltaAbs: number                // absolutul
  deltaPercent: number            // |delta| / max(|declared|, |precomputed|) * 100
  exceedsThreshold: boolean       // true dacă declanșează notificare ANAF
}

export type D300P300ComparisonResult = {
  period: string
  comparedAtISO: string
  fieldDiffs: D300P300FieldDiff[]
  triggersAnafNotification: boolean   // true dacă oricare field exceedsThreshold
  worstField: D300P300DiffField | null
  worstDeltaAbs: number
  recommendedAction: "ok" | "review" | "rectify" | "respond_to_notice"
  countdownDeadlineISO: string | null  // 20 zile de la astăzi dacă triggers
}

// ── Thresholds (per OUG 70/2024 art. modif. 89/2025) ─────────────────────────

const THRESHOLD_PERCENT = 20  // %
const THRESHOLD_AMOUNT = 5000 // RON
const RESPONSE_WINDOW_DAYS = 20

const FIELD_LABELS: Record<D300P300DiffField, string> = {
  taxableBase: "Bază impozabilă",
  vatCollected: "TVA colectat",
  vatDeducted: "TVA dedus",
  vatToPay: "TVA de plată",
}

// ── Single field diff ────────────────────────────────────────────────────────

function diffField(
  field: D300P300DiffField,
  declared: number,
  precomputed: number,
): D300P300FieldDiff {
  const delta = declared - precomputed
  const deltaAbs = Math.abs(delta)
  const denominator = Math.max(Math.abs(declared), Math.abs(precomputed), 1)
  const deltaPercent = (deltaAbs / denominator) * 100

  // Praguri ANAF: AMBELE condiții — diferență ≥5K LEI ȘI procent >20%
  const exceedsThreshold = deltaAbs >= THRESHOLD_AMOUNT && deltaPercent > THRESHOLD_PERCENT

  return {
    field,
    fieldLabel: FIELD_LABELS[field],
    declared,
    precomputed,
    delta,
    deltaAbs,
    deltaPercent: Math.round(deltaPercent * 100) / 100,
    exceedsThreshold,
  }
}

// ── Main comparator ──────────────────────────────────────────────────────────

export function compareD300P300(
  d300: VatDeclarationSnapshot,
  p300: VatDeclarationSnapshot,
  nowISO: string,
): D300P300ComparisonResult {
  if (d300.period !== p300.period) {
    throw new Error(
      `Periode diferite — D300: ${d300.period}, P300: ${p300.period}. Comparare imposibilă.`,
    )
  }

  const fieldDiffs: D300P300FieldDiff[] = [
    diffField("taxableBase", d300.taxableBase, p300.taxableBase),
    diffField("vatCollected", d300.vatCollected, p300.vatCollected),
    diffField("vatDeducted", d300.vatDeducted, p300.vatDeducted),
    diffField("vatToPay", d300.vatToPay, p300.vatToPay),
  ]

  const triggers = fieldDiffs.filter((f) => f.exceedsThreshold)
  const triggersAnafNotification = triggers.length > 0

  const worst = fieldDiffs.reduce<D300P300FieldDiff | null>(
    (max, f) => (max === null || f.deltaAbs > max.deltaAbs ? f : max),
    null,
  )

  let recommendedAction: D300P300ComparisonResult["recommendedAction"] = "ok"
  if (triggersAnafNotification) {
    // Diferență mare — recomandă rectificare preventivă (declarație rectificativă D300)
    recommendedAction = "rectify"
  } else if (worst && worst.deltaAbs > 0) {
    // Orice diferență non-zero — recomandă review preventiv
    recommendedAction = "review"
  }

  let countdownDeadlineISO: string | null = null
  if (triggersAnafNotification) {
    const deadline = new Date(nowISO)
    deadline.setUTCDate(deadline.getUTCDate() + RESPONSE_WINDOW_DAYS)
    countdownDeadlineISO = deadline.toISOString()
  }

  return {
    period: d300.period,
    comparedAtISO: nowISO,
    fieldDiffs,
    triggersAnafNotification,
    worstField: worst?.field ?? null,
    worstDeltaAbs: worst?.deltaAbs ?? 0,
    recommendedAction,
    countdownDeadlineISO,
  }
}

// ── Finding builder ──────────────────────────────────────────────────────────

export function buildD300P300Finding(
  result: D300P300ComparisonResult,
  nowISO: string,
): ScanFinding | null {
  if (!result.triggersAnafNotification) return null

  const triggeringFields = result.fieldDiffs.filter((f) => f.exceedsThreshold)
  const summary = triggeringFields
    .map(
      (f) =>
        `${f.fieldLabel}: ${f.declared.toLocaleString("ro-RO")} declarat vs ${f.precomputed.toLocaleString("ro-RO")} pre-calculat (Δ ${f.deltaAbs.toLocaleString("ro-RO")} RON, ${f.deltaPercent.toFixed(1)}%)`,
    )
    .join("; ")

  const countdownNote = result.countdownDeadlineISO
    ? ` Termen răspuns 20 zile: ${new Date(result.countdownDeadlineISO).toLocaleDateString("ro-RO")}.`
    : ""

  return {
    id: `etva-p300-prevent-${result.period}`,
    title: `RO e-TVA: Diferențe peste prag D300 vs P300 — ${result.period}`,
    detail: `Diferențele între D300 depus și P300 pre-completat ANAF depășesc pragul de notificare (>20% ȘI ≥5.000 RON). ${summary}.${countdownNote} Acționează preventiv ÎNAINTE ca ANAF să trimită notificarea oficială.`,
    category: "E_FACTURA",
    severity: "high",
    risk: "high",
    principles: ["accountability"],
    createdAtISO: nowISO,
    sourceDocument: `RO e-TVA ${result.period} (P300 pre-completat)`,
    legalReference: "OUG 70/2024 (modif. OUG 89/2025) · Cod Fiscal Art. 105",
    remediationHint:
      "Verifică sursele de date (facturi e-Factura, jurnale TVA), corectează D300 și depune declarație rectificativă înainte de notificarea ANAF.",
    resolution: makeResolution(
      `Diferențe D300 vs P300 peste pragul ANAF în perioada ${result.period}.`,
      "Dacă nu corectezi PREVENTIV, ANAF va trimite notificare oficială cu termen 20 zile + posibile penalități de subdeclarare.",
      "Reverifică tranzacțiile, identifică sursa diferenței (facturi lipsă, dublu-numărate, cote eronate), corectează și depune D300 rectificativă.",
      {
        humanStep:
          "Contabilul reconciliază facturile e-Factura cu jurnalul TVA, identifică sursele de divergență, depune D300 rectificativă prin SPV.",
        closureEvidence:
          "Confirmare SPV depunere D300 rectificativă + comparație nouă D300 vs P300 sub pragul de notificare.",
        revalidation:
          "Comparare lunară D300 vs P300 imediat după publicarea P300 (zilele 10-15 ale lunii N+1).",
      },
    ),
  }
}

// ── Helper: parse from raw input (textarea / form) ───────────────────────────

/**
 * Permite contabilului să introducă valori din D300 prin paste din software-ul
 * contabil. Acceptă format simplu cheie=valoare per linie sau JSON.
 */
export function parseDeclarationInput(raw: string): VatDeclarationSnapshot | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed) as Partial<VatDeclarationSnapshot>
    if (
      typeof parsed.period === "string" &&
      typeof parsed.taxableBase === "number" &&
      typeof parsed.vatCollected === "number" &&
      typeof parsed.vatDeducted === "number" &&
      typeof parsed.vatToPay === "number"
    ) {
      return parsed as VatDeclarationSnapshot
    }
  } catch {
    // not JSON — try key=value
  }

  // Key=value parser
  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)

  const map: Record<string, string> = {}
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z_]+)\s*[:=]\s*(.+)$/)
    if (m) map[m[1].toLowerCase()] = m[2].trim()
  }

  const period = map["period"] || map["perioada"]
  const taxableBase = parseFloat(map["taxablebase"] || map["baza"] || map["bazaimpozabila"] || "")
  const vatCollected = parseFloat(map["vatcollected"] || map["tvacolectat"] || map["colectat"] || "")
  const vatDeducted = parseFloat(map["vatdeducted"] || map["tvadedus"] || map["dedus"] || "")
  const vatToPay = parseFloat(map["vattopay"] || map["tvadeplata"] || map["deplata"] || "")

  if (!period || [taxableBase, vatCollected, vatDeducted, vatToPay].some((n) => Number.isNaN(n))) {
    return null
  }

  return { period, taxableBase, vatCollected, vatDeducted, vatToPay }
}
