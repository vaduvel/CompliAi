// ANAF Signals Phase D — D2: Compliance Monitor Agent Rail
// Pure functions for fiscal compliance monitoring.
// Input: e-TVA discrepancies, filing discipline, overdue responses, SAF-T hygiene.
// Output: reminders, stale signal detection, response pack refresh triggers, escalation.
// No dependency on V6 agent types — standalone module.

import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import { computeCountdown, ETVA_TYPE_LABELS, ETVA_STATUS_LABELS } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import { computeFilingDisciplineScore, generateFilingReminders } from "@/lib/compliance/filing-discipline"
import { computeSAFTHygiene } from "@/lib/compliance/saft-hygiene"
import type { AppNotification } from "@/lib/server/notifications-store"

// ── Types ────────────────────────────────────────────────────────────────────

export type ComplianceMonitorAction =
  | { type: "reminder"; targetType: "discrepancy" | "filing" | "notification"; targetId: string; message: string; daysRemaining: number }
  | { type: "stale_signal"; targetId: string; staleDays: number; message: string }
  | { type: "response_pack_refresh"; reason: string }
  | { type: "escalation"; targetType: "discrepancy" | "filing" | "saft"; targetId: string; message: string; severity: "critical" | "high" }

export type ComplianceMonitorOutput = {
  actions: ComplianceMonitorAction[]
  reminders: number
  staleSignals: number
  escalations: number
  refreshTriggered: boolean
  summary: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const STALE_NOTIFICATION_DAYS = 14  // notification without action for 14+ days
const DISCIPLINE_REFRESH_THRESHOLD = 60 // score below this triggers pack refresh

// ── Core logic ───────────────────────────────────────────────────────────────

/**
 * Run Compliance Monitor agent rail logic.
 */
export function runComplianceMonitorRail(input: {
  discrepancies: ETVADiscrepancy[]
  filingRecords: FilingRecord[]
  anafNotifications: AppNotification[]
  nowISO: string
}): ComplianceMonitorOutput {
  const { discrepancies, filingRecords, anafNotifications, nowISO } = input
  const actions: ComplianceMonitorAction[] = []
  const nowMs = new Date(nowISO).getTime()
  let refreshTriggered = false

  // 1. e-TVA discrepancy reminders + escalation
  for (const disc of discrepancies) {
    if (disc.status === "resolved") continue

    const countdown = computeCountdown(disc, nowISO)

    if (countdown.isOverdue) {
      actions.push({
        type: "escalation",
        targetType: "discrepancy",
        targetId: disc.id,
        message: `Discrepanță e-TVA ${ETVA_TYPE_LABELS[disc.type]} (${disc.period}) — termen depășit cu ${Math.abs(countdown.daysRemaining!)} zile. Status: ${ETVA_STATUS_LABELS[disc.status]}.`,
        severity: "critical",
      })
    } else if (countdown.daysRemaining !== null && countdown.daysRemaining <= 7) {
      actions.push({
        type: "reminder",
        targetType: "discrepancy",
        targetId: disc.id,
        message: `Discrepanță e-TVA ${ETVA_TYPE_LABELS[disc.type]} (${disc.period}) — ${countdown.daysRemaining} zile până la termen.`,
        daysRemaining: countdown.daysRemaining,
      })
    }
  }

  // 2. Filing discipline monitoring
  const filingScore = computeFilingDisciplineScore(filingRecords)
  const filingReminders = generateFilingReminders(filingRecords, nowISO)

  for (const reminder of filingReminders) {
    actions.push({
      type: "reminder",
      targetType: "filing",
      targetId: reminder.filingId,
      message: reminder.message,
      daysRemaining: reminder.daysUntilDue,
    })
  }

  if (filingScore.score < 40 && filingScore.total > 0) {
    actions.push({
      type: "escalation",
      targetType: "filing",
      targetId: "filing-discipline",
      message: `Scor disciplină declarații critic: ${filingScore.score}/100. ${filingScore.missing} lipsă, ${filingScore.late} cu întârziere.`,
      severity: "critical",
    })
  }

  // 3. SAF-T hygiene escalation
  const saftHygiene = computeSAFTHygiene(filingRecords, nowISO)
  if (saftHygiene.totalFilings > 0 && saftHygiene.hygieneScore < 50) {
    actions.push({
      type: "escalation",
      targetType: "saft",
      targetId: "saft-hygiene",
      message: `Igienă SAF-T critică: ${saftHygiene.hygieneScore}/100. ${saftHygiene.missing} lipsă, ${saftHygiene.consistencyIssues.length} probleme de consistență.`,
      severity: saftHygiene.hygieneScore < 30 ? "critical" : "high",
    })
  }

  // 4. Stale ANAF notifications (no action taken for 14+ days)
  for (const notif of anafNotifications) {
    if (notif.anafStatus === "raspuns_trimis" || notif.anafStatus === "inchis") continue

    const createdMs = new Date(notif.createdAt).getTime()
    const ageDays = Math.floor((nowMs - createdMs) / MS_PER_DAY)

    if (ageDays >= STALE_NOTIFICATION_DAYS) {
      actions.push({
        type: "stale_signal",
        targetId: notif.id,
        staleDays: ageDays,
        message: `Notificare ANAF "${notif.title}" fără acțiune de ${ageDays} zile. Status: ${notif.anafStatus ?? "necunoscut"}.`,
      })
    }
  }

  // 5. Response Pack refresh trigger
  const hasOverdueDiscrepancies = discrepancies.some((d) => {
    const c = computeCountdown(d, nowISO)
    return c.isOverdue
  })

  if (hasOverdueDiscrepancies || filingScore.score < DISCIPLINE_REFRESH_THRESHOLD) {
    refreshTriggered = true
    actions.push({
      type: "response_pack_refresh",
      reason: hasOverdueDiscrepancies
        ? "Discrepanțe e-TVA cu termen depășit — Response Pack necesită actualizare."
        : `Scor disciplină sub ${DISCIPLINE_REFRESH_THRESHOLD} — Response Pack necesită actualizare.`,
    })
  }

  const reminders = actions.filter((a) => a.type === "reminder").length
  const staleSignals = actions.filter((a) => a.type === "stale_signal").length
  const escalations = actions.filter((a) => a.type === "escalation").length

  return {
    actions,
    reminders,
    staleSignals,
    escalations,
    refreshTriggered,
    summary: `Compliance Monitor: ${reminders} remindere, ${staleSignals} semnale stale, ${escalations} escalări${refreshTriggered ? ", Response Pack refresh triggerat" : ""}.`,
  }
}
