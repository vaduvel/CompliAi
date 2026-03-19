// ANAF Signals Phase B — B1: RO e-TVA Discrepancy Workflow
// Discrepancy inbox, countdown de răspuns, explanation draft,
// response evidence, closure + revalidation.
// Pure functions — no I/O, safe in browser and server.

import type { ScanFinding, FindingResolution } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"

// ── Types ────────────────────────────────────────────────────────────────────

export type ETVADiscrepancyType =
  | "sum_mismatch"         // sume declarate vs. calculate nu corespund
  | "missing_invoice"      // facturi lipsă din declarație
  | "duplicate_invoice"    // facturi duplicate
  | "period_mismatch"      // facturi raportate în perioada greșită
  | "vat_rate_error"       // cota TVA incorectă
  | "conformity_notice"    // notificare de conformare ANAF

export type ETVADiscrepancyStatus =
  | "detected"             // discrepanță identificată
  | "acknowledged"         // confirmată de utilizator
  | "explanation_drafted"  // explicație pregătită
  | "response_sent"        // răspuns trimis la ANAF
  | "awaiting_anaf"        // așteptăm răspuns ANAF
  | "resolved"             // acceptat / închis
  | "overdue"              // termen depășit fără răspuns

export type ETVADiscrepancySeverity = "critical" | "high" | "medium"

export type ETVADiscrepancy = {
  id: string
  type: ETVADiscrepancyType
  severity: ETVADiscrepancySeverity
  status: ETVADiscrepancyStatus
  period: string               // ex: "2026-Q1", "2026-02"
  description: string
  amountDifference?: number    // RON
  vatAmountDifference?: number // RON
  detectedAtISO: string
  deadlineISO?: string         // termen de răspuns ANAF
  ownerId?: string
  explanation?: string         // draft explicație
  responseEvidence?: string    // dovada răspunsului
  resolvedAtISO?: string
  revalidationDueISO?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const DEFAULT_RESPONSE_DAYS = 30 // termen implicit de răspuns la notificare ANAF

// ── Labels ───────────────────────────────────────────────────────────────────

export const ETVA_TYPE_LABELS: Record<ETVADiscrepancyType, string> = {
  sum_mismatch: "Discrepanță sume TVA",
  missing_invoice: "Facturi lipsă din declarație",
  duplicate_invoice: "Facturi duplicate",
  period_mismatch: "Facturi raportate în perioadă greșită",
  vat_rate_error: "Cotă TVA incorectă",
  conformity_notice: "Notificare de conformare ANAF",
}

export const ETVA_STATUS_LABELS: Record<ETVADiscrepancyStatus, string> = {
  detected: "Detectat",
  acknowledged: "Confirmat",
  explanation_drafted: "Explicație pregătită",
  response_sent: "Răspuns trimis",
  awaiting_anaf: "Așteptăm ANAF",
  resolved: "Rezolvat",
  overdue: "Termen depășit",
}

export const ETVA_SEVERITY_LABELS: Record<ETVADiscrepancySeverity, string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
}

// ── Severity classification ──────────────────────────────────────────────────

export function classifyDiscrepancySeverity(
  type: ETVADiscrepancyType,
  amountDifference?: number,
): ETVADiscrepancySeverity {
  // Conformity notices are always critical — direct ANAF action
  if (type === "conformity_notice") return "critical"

  // Large amounts
  if (amountDifference && amountDifference > 10000) return "critical"
  if (amountDifference && amountDifference > 2000) return "high"

  // Missing/duplicate are high by default
  if (type === "missing_invoice" || type === "duplicate_invoice") return "high"

  return "medium"
}

// ── Countdown logic ──────────────────────────────────────────────────────────

export type CountdownResult = {
  daysRemaining: number | null
  isOverdue: boolean
  urgencyLabel: "expirat" | "urgent" | "atenție" | "ok" | "fără termen"
}

export function computeCountdown(
  discrepancy: ETVADiscrepancy,
  nowISO: string,
): CountdownResult {
  if (!discrepancy.deadlineISO) {
    return { daysRemaining: null, isOverdue: false, urgencyLabel: "fără termen" }
  }

  const nowMs = new Date(nowISO).getTime()
  const deadlineMs = new Date(discrepancy.deadlineISO).getTime()
  const daysRemaining = Math.floor((deadlineMs - nowMs) / MS_PER_DAY)

  if (daysRemaining < 0) {
    return { daysRemaining, isOverdue: true, urgencyLabel: "expirat" }
  }
  if (daysRemaining <= 5) {
    return { daysRemaining, isOverdue: false, urgencyLabel: "urgent" }
  }
  if (daysRemaining <= 14) {
    return { daysRemaining, isOverdue: false, urgencyLabel: "atenție" }
  }
  return { daysRemaining, isOverdue: false, urgencyLabel: "ok" }
}

// ── Explanation draft builder ────────────────────────────────────────────────

export function draftExplanation(discrepancy: ETVADiscrepancy, orgName: string): string {
  const typeLabel = ETVA_TYPE_LABELS[discrepancy.type]
  const amount = discrepancy.amountDifference
    ? `${discrepancy.amountDifference.toLocaleString("ro-RO")} RON`
    : "sumă nespecificată"

  return [
    `Către: ANAF — Direcția Generală Regională a Finanțelor Publice`,
    `De la: ${orgName}`,
    `Ref: Discrepanță RO e-TVA — ${typeLabel} — Perioada ${discrepancy.period}`,
    ``,
    `Stimate domnule/doamnă,`,
    ``,
    `Prin prezenta, formulăm explicațiile solicitate cu privire la discrepanța identificată ` +
      `în declarația RO e-TVA pentru perioada ${discrepancy.period}.`,
    ``,
    `Tipul discrepanței: ${typeLabel}`,
    `Diferența identificată: ${amount}`,
    discrepancy.description ? `Detalii: ${discrepancy.description}` : "",
    ``,
    `Explicație:`,
    `[Completați motivul discrepanței — eroare de înregistrare, factură întârziată, ` +
      `diferență de curs valutar, eroare sistem contabil, etc.]`,
    ``,
    `Măsuri corective:`,
    `[Descrieți acțiunile luate pentru corectarea discrepanței și prevenirea recurenței.]`,
    ``,
    `Documente anexate:`,
    `- [Factura/facturile relevante]`,
    `- [Extras cont contabil]`,
    `- [Alte documente justificative]`,
    ``,
    `Cu stimă,`,
    `${orgName}`,
    ``,
    `---`,
    `Generat de CompliAI — nu constituie aviz juridic. Verificați cu un specialist fiscal.`,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
}

// ── Finding builder ──────────────────────────────────────────────────────────

export function buildDiscrepancyFinding(
  discrepancy: ETVADiscrepancy,
  nowISO: string,
): ScanFinding {
  const typeLabel = ETVA_TYPE_LABELS[discrepancy.type]
  const amount = discrepancy.amountDifference
    ? ` (${discrepancy.amountDifference.toLocaleString("ro-RO")} RON)`
    : ""

  const countdown = computeCountdown(discrepancy, nowISO)
  const deadlineNote = countdown.daysRemaining !== null
    ? countdown.isOverdue
      ? ` TERMEN DEPĂȘIT cu ${Math.abs(countdown.daysRemaining)} zile!`
      : ` Termen răspuns: ${countdown.daysRemaining} zile.`
    : ""

  return {
    id: `etva-disc-${discrepancy.id}`,
    title: `e-TVA: ${typeLabel} — Perioada ${discrepancy.period}`,
    detail: `${typeLabel}${amount} detectată în perioada ${discrepancy.period}. ${discrepancy.description}${deadlineNote}`,
    category: "E_FACTURA", // reuse existing category — fiscal signals
    severity: discrepancy.severity === "critical" ? "critical" : discrepancy.severity === "high" ? "high" : "medium",
    risk: discrepancy.severity === "critical" || discrepancy.severity === "high" ? "high" : "low",
    principles: ["accountability"],
    createdAtISO: nowISO,
    sourceDocument: `RO e-TVA ${discrepancy.period}`,
    legalReference: "Legea 227/2015 (Cod Fiscal) · OUG 89/2025 · Ord. ANAF RO e-TVA",
    remediationHint: `Verifică discrepanța, pregătește explicație și trimite răspuns ANAF înainte de termenul limită.`,
    resolution: makeResolution(
      `${typeLabel} în declarația RO e-TVA${amount}`,
      "Discrepanțele neadresate pot duce la controale fiscale, amenzi și penalități de întârziere.",
      "Analizează discrepanța, pregătește explicația documentată, trimite răspunsul la ANAF.",
      {
        humanStep: "Verifică cu contabilul/consultantul fiscal, semnează răspunsul și trimite prin SPV.",
        closureEvidence: "Confirmare ANAF de primire răspuns + dovada corectării (declarație rectificativă dacă e cazul).",
        revalidation: "Verifică la următoarea declarație RO e-TVA dacă discrepanța persistă.",
      },
    ),
  }
}

// ── Lifecycle transitions ────────────────────────────────────────────────────

export type DiscrepancyTransition =
  | { action: "acknowledge" }
  | { action: "draft_explanation"; explanation: string }
  | { action: "send_response"; responseEvidence: string }
  | { action: "mark_resolved"; resolvedAtISO: string }
  | { action: "mark_overdue" }

export function applyDiscrepancyTransition(
  discrepancy: ETVADiscrepancy,
  transition: DiscrepancyTransition,
): ETVADiscrepancy {
  switch (transition.action) {
    case "acknowledge":
      return { ...discrepancy, status: "acknowledged" }
    case "draft_explanation":
      return { ...discrepancy, status: "explanation_drafted", explanation: transition.explanation }
    case "send_response":
      return {
        ...discrepancy,
        status: "response_sent",
        responseEvidence: transition.responseEvidence,
      }
    case "mark_resolved": {
      // Set revalidation 3 months from resolution
      const revalDate = new Date(transition.resolvedAtISO)
      revalDate.setMonth(revalDate.getMonth() + 3)
      return {
        ...discrepancy,
        status: "resolved",
        resolvedAtISO: transition.resolvedAtISO,
        revalidationDueISO: revalDate.toISOString(),
      }
    }
    case "mark_overdue":
      return { ...discrepancy, status: "overdue" }
  }
}

// ── Overdue detection ────────────────────────────────────────────────────────

/**
 * Check all discrepancies and mark overdue ones.
 */
export function detectOverdueDiscrepancies(
  discrepancies: ETVADiscrepancy[],
  nowISO: string,
): ETVADiscrepancy[] {
  return discrepancies.map((d) => {
    if (d.status === "resolved" || d.status === "overdue" || d.status === "response_sent" || d.status === "awaiting_anaf") {
      return d
    }
    const countdown = computeCountdown(d, nowISO)
    if (countdown.isOverdue) {
      return { ...d, status: "overdue" as const }
    }
    return d
  })
}

// ── Default deadline computation ─────────────────────────────────────────────

export function computeDefaultDeadline(detectedAtISO: string): string {
  const d = new Date(detectedAtISO)
  d.setDate(d.getDate() + DEFAULT_RESPONSE_DAYS)
  return d.toISOString()
}
