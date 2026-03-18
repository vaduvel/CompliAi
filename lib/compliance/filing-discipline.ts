// ANAF Signals Phase B — B2: Filing Discipline Layer
// Filing discipline score, overdue filing findings, owner assignment,
// escalation, reminder logic.
// Pure functions — no I/O, safe in browser and server.

import type { ScanFinding } from "@/lib/compliance/types"
import { makeResolution } from "@/lib/compliance/finding-resolution"

// ── Types ────────────────────────────────────────────────────────────────────

export type FilingType =
  | "d300_tva"             // Declarația 300 — TVA
  | "d390_recap"           // Declarația 390 — recapitulativă
  | "d394_local"           // Declarația 394 — achiziții/livrări locale
  | "saft"                 // SAF-T (D406)
  | "efactura_monthly"     // e-Factura — raport lunar
  | "etva_precompletata"   // RO e-TVA precompletată

export type FilingStatus =
  | "on_time"              // depusă la timp
  | "late"                 // depusă cu întârziere
  | "missing"              // nedepusă
  | "rectified"            // depusă rectificativă
  | "upcoming"             // termen viitor

export type FilingRecord = {
  id: string
  type: FilingType
  period: string           // ex: "2026-02", "2026-Q1"
  status: FilingStatus
  dueISO: string           // termen limită
  filedAtISO?: string      // când a fost depusă
  rectificationCount?: number
  ownerId?: string
  note?: string
}

export type FilingDisciplineScore = {
  score: number            // 0-100
  label: "excelent" | "bun" | "acceptabil" | "slab" | "critic"
  onTime: number
  late: number
  missing: number
  rectified: number
  total: number
  details: string
}

export type EscalationLevel = "reminder" | "warning" | "escalation"

export type FilingReminder = {
  filingId: string
  filingType: FilingType
  period: string
  dueISO: string
  daysUntilDue: number
  escalationLevel: EscalationLevel
  message: string
  ownerId?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000

// ── Labels ───────────────────────────────────────────────────────────────────

export const FILING_TYPE_LABELS: Record<FilingType, string> = {
  d300_tva: "Declarația 300 (TVA)",
  d390_recap: "Declarația 390 (Recapitulativă)",
  d394_local: "Declarația 394 (Achiziții/Livrări)",
  saft: "SAF-T (D406)",
  efactura_monthly: "e-Factura — raport lunar",
  etva_precompletata: "RO e-TVA precompletată",
}

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  on_time: "La timp",
  late: "Cu întârziere",
  missing: "Lipsă",
  rectified: "Rectificată",
  upcoming: "Viitoare",
}

// ── Discipline score computation ─────────────────────────────────────────────

/**
 * Compute filing discipline score from historical records.
 * Only considers non-upcoming filings for scoring.
 */
export function computeFilingDisciplineScore(
  records: FilingRecord[],
): FilingDisciplineScore {
  const scorable = records.filter((r) => r.status !== "upcoming")
  const total = scorable.length

  if (total === 0) {
    return {
      score: 100,
      label: "excelent",
      onTime: 0,
      late: 0,
      missing: 0,
      rectified: 0,
      total: 0,
      details: "Nicio depunere înregistrată — scor implicit.",
    }
  }

  const onTime = scorable.filter((r) => r.status === "on_time").length
  const late = scorable.filter((r) => r.status === "late").length
  const missing = scorable.filter((r) => r.status === "missing").length
  const rectified = scorable.filter((r) => r.status === "rectified").length

  // Scoring: on_time = 100%, late = 50%, rectified = 60%, missing = 0%
  const rawScore = (onTime * 100 + late * 50 + rectified * 60 + missing * 0) / total
  const score = Math.round(Math.max(0, Math.min(100, rawScore)))

  // Penalty for repeated rectifications
  const multiRectified = scorable.filter(
    (r) => r.rectificationCount && r.rectificationCount >= 2,
  ).length
  const finalScore = Math.max(0, score - multiRectified * 5)

  const label: FilingDisciplineScore["label"] =
    finalScore >= 90
      ? "excelent"
      : finalScore >= 75
        ? "bun"
        : finalScore >= 60
          ? "acceptabil"
          : finalScore >= 40
            ? "slab"
            : "critic"

  const details = [
    `${onTime}/${total} la timp`,
    late > 0 ? `${late} cu întârziere` : null,
    missing > 0 ? `${missing} lipsă` : null,
    rectified > 0 ? `${rectified} rectificate` : null,
  ]
    .filter(Boolean)
    .join(", ")

  return { score: finalScore, label, onTime, late, missing, rectified, total, details }
}

// ── Overdue filing findings ──────────────────────────────────────────────────

/**
 * Generate findings for missing and overdue filings.
 */
export function buildOverdueFilingFindings(
  records: FilingRecord[],
  nowISO: string,
): ScanFinding[] {
  const nowMs = new Date(nowISO).getTime()
  const findings: ScanFinding[] = []

  for (const record of records) {
    if (record.status !== "missing") continue

    const dueMs = new Date(record.dueISO).getTime()
    const daysOverdue = Math.floor((nowMs - dueMs) / MS_PER_DAY)

    if (daysOverdue <= 0) continue // not yet overdue

    const typeLabel = FILING_TYPE_LABELS[record.type]

    findings.push({
      id: `filing-overdue-${record.id}`,
      title: `Declarație fiscală lipsă — ${typeLabel}`,
      detail: `${typeLabel} pentru perioada ${record.period} nu a fost depusă. Termen depășit cu ${daysOverdue} zile.${record.ownerId ? ` Responsabil: ${record.ownerId}` : " Fără responsabil atribuit."}`,
      category: "E_FACTURA",
      severity: daysOverdue > 30 ? "critical" : daysOverdue > 7 ? "high" : "medium",
      risk: daysOverdue > 7 ? "high" : "low",
      principles: ["accountability"],
      createdAtISO: nowISO,
      sourceDocument: `${typeLabel} ${record.period}`,
      legalReference: "Cod Fiscal · Cod Procedură Fiscală Art. 336-338",
      remediationHint: `Depune declarația ${typeLabel} pentru ${record.period} imediat. Penalizare estimată: 0.06%/zi întârziere.`,
      resolution: makeResolution(
        `${typeLabel} nedepusă pentru ${record.period} (${daysOverdue} zile întârziere)`,
        "Nedepunerea declarațiilor fiscale atrage amenzi contravenționale (1.000 - 5.000 RON) și penalități de întârziere.",
        `Depune imediat ${typeLabel} prin SPV ANAF. Verifică datele cu contabilul înainte.`,
        {
          humanStep: "Contactează contabilul, verifică datele, depune prin SPV ANAF.",
          closureEvidence: "Confirmare SPV de depunere cu număr de înregistrare.",
          revalidation: "Monitorizează termenul pentru următoarea perioadă.",
        },
      ),
    })
  }

  return findings
}

// ── Reminder logic ───────────────────────────────────────────────────────────

/**
 * Generate reminders for upcoming filings.
 */
export function generateFilingReminders(
  records: FilingRecord[],
  nowISO: string,
): FilingReminder[] {
  const nowMs = new Date(nowISO).getTime()
  const reminders: FilingReminder[] = []

  for (const record of records) {
    if (record.status !== "upcoming" && record.status !== "missing") continue

    const dueMs = new Date(record.dueISO).getTime()
    const daysUntilDue = Math.floor((dueMs - nowMs) / MS_PER_DAY)

    // Already overdue — handled by findings
    if (daysUntilDue < 0) continue

    const typeLabel = FILING_TYPE_LABELS[record.type]

    if (daysUntilDue <= 3) {
      reminders.push({
        filingId: record.id,
        filingType: record.type,
        period: record.period,
        dueISO: record.dueISO,
        daysUntilDue,
        escalationLevel: "escalation",
        message: `URGENT: ${typeLabel} (${record.period}) — termen în ${daysUntilDue} zile!`,
        ownerId: record.ownerId,
      })
    } else if (daysUntilDue <= 7) {
      reminders.push({
        filingId: record.id,
        filingType: record.type,
        period: record.period,
        dueISO: record.dueISO,
        daysUntilDue,
        escalationLevel: "warning",
        message: `Atenție: ${typeLabel} (${record.period}) — termen în ${daysUntilDue} zile.`,
        ownerId: record.ownerId,
      })
    } else if (daysUntilDue <= 14) {
      reminders.push({
        filingId: record.id,
        filingType: record.type,
        period: record.period,
        dueISO: record.dueISO,
        daysUntilDue,
        escalationLevel: "reminder",
        message: `Reminder: ${typeLabel} (${record.period}) — termen în ${daysUntilDue} zile.`,
        ownerId: record.ownerId,
      })
    }
  }

  return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

// ── Consistency check ────────────────────────────────────────────────────────

export type ConsistencyIssue = {
  message: string
  severity: "warning" | "error"
  filingIds: string[]
}

/**
 * Check filing consistency — repeated rectifications, gaps in sequence.
 */
export function checkFilingConsistency(records: FilingRecord[]): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []

  // Check repeated rectifications per type
  const byType = new Map<FilingType, FilingRecord[]>()
  for (const r of records) {
    const list = byType.get(r.type) ?? []
    list.push(r)
    byType.set(r.type, list)
  }

  for (const [type, filings] of byType) {
    const rectified = filings.filter((f) => f.status === "rectified")
    if (rectified.length >= 3) {
      issues.push({
        message: `${FILING_TYPE_LABELS[type]}: ${rectified.length} rectificări — posibil problemă sistemică în procesul contabil.`,
        severity: "error",
        filingIds: rectified.map((f) => f.id),
      })
    } else if (rectified.length >= 2) {
      issues.push({
        message: `${FILING_TYPE_LABELS[type]}: ${rectified.length} rectificări — monitorizează calitatea datelor.`,
        severity: "warning",
        filingIds: rectified.map((f) => f.id),
      })
    }

    // Check for missing periods (gaps)
    const missing = filings.filter((f) => f.status === "missing")
    if (missing.length > 0) {
      issues.push({
        message: `${FILING_TYPE_LABELS[type]}: ${missing.length} declarații lipsă — risc de penalități fiscale.`,
        severity: "error",
        filingIds: missing.map((f) => f.id),
      })
    }
  }

  return issues
}
