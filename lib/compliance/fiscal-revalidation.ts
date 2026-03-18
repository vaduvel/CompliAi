// ANAF Signals Phase C — C3: Revalidation Rules + Notification-Discrepancy Linkage
// Reopen unresolved fiscal findings, reminder on review expiry,
// stale evidence detection, notification → discrepancy linking.
// Pure functions (except linkage helpers that accept store data).

import type { ScanFinding } from "@/lib/compliance/types"
import type { ETVADiscrepancy } from "@/lib/compliance/etva-discrepancy"
import { computeCountdown } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { AppNotification } from "@/lib/server/notifications-store"

// ── Types ────────────────────────────────────────────────────────────────────

export type RevalidationAction =
  | { type: "reopen_finding"; findingId: string; reason: string }
  | { type: "reminder"; targetId: string; message: string; daysUntilExpiry: number }
  | { type: "stale_evidence"; findingId: string; evidenceAge: number; message: string }
  | { type: "escalate"; targetId: string; reason: string }

export type NotificationDiscrepancyLink = {
  notificationId: string
  discrepancyId: string
  linkedAtISO: string
  linkType: "auto" | "manual"
  confidence: "high" | "medium"
}

// ── Constants ────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000
const STALE_EVIDENCE_DAYS = 90    // evidence older than 90 days = stale
const REVALIDATION_REMINDER_DAYS = 7 // remind 7 days before revalidation due

// ── Revalidation: Reopen unresolved fiscal findings ──────────────────────────

/**
 * Check fiscal findings that were marked resolved but the underlying issue persists.
 * Returns actions to reopen findings.
 */
export function checkFiscalFindingRevalidation(
  findings: ScanFinding[],
  discrepancies: ETVADiscrepancy[],
  filings: FilingRecord[],
  nowISO: string,
): RevalidationAction[] {
  const actions: RevalidationAction[] = []

  // 1. Reopen e-TVA findings if discrepancy is still active
  const activeDiscrepancyIds = new Set(
    discrepancies
      .filter((d) => d.status !== "resolved")
      .map((d) => `etva-disc-${d.id}`),
  )

  for (const finding of findings) {
    if (finding.id.startsWith("etva-disc-") && finding.resolution?.closureEvidence) {
      // Finding was "closed" but discrepancy is still active
      if (activeDiscrepancyIds.has(finding.id)) {
        actions.push({
          type: "reopen_finding",
          findingId: finding.id,
          reason: "Discrepanța e-TVA asociată este încă activă — finding-ul nu poate rămâne închis.",
        })
      }
    }
  }

  // 2. Reopen filing findings if filing is still missing
  const missingFilingIds = new Set(
    filings
      .filter((f) => f.status === "missing")
      .map((f) => `filing-overdue-${f.id}`),
  )

  for (const finding of findings) {
    if (finding.id.startsWith("filing-overdue-") && finding.resolution?.closureEvidence) {
      if (missingFilingIds.has(finding.id)) {
        actions.push({
          type: "reopen_finding",
          findingId: finding.id,
          reason: "Declarația asociată este încă lipsă — finding-ul nu poate fi considerat rezolvat.",
        })
      }
    }
  }

  return actions
}

// ── Revalidation: Reminder on review expiry ──────────────────────────────────

/**
 * Generate reminders for discrepancies approaching revalidation due date.
 */
export function checkRevalidationReminders(
  discrepancies: ETVADiscrepancy[],
  nowISO: string,
): RevalidationAction[] {
  const actions: RevalidationAction[] = []
  const nowMs = new Date(nowISO).getTime()

  for (const disc of discrepancies) {
    if (disc.status !== "resolved" || !disc.revalidationDueISO) continue

    const revalMs = new Date(disc.revalidationDueISO).getTime()
    const daysUntil = Math.floor((revalMs - nowMs) / MS_PER_DAY)

    if (daysUntil < 0) {
      // Past revalidation — escalate
      actions.push({
        type: "escalate",
        targetId: disc.id,
        reason: `Revalidarea discrepanței e-TVA (${disc.period}) depășită cu ${Math.abs(daysUntil)} zile. Verifică dacă problema a recidivat.`,
      })
    } else if (daysUntil <= REVALIDATION_REMINDER_DAYS) {
      actions.push({
        type: "reminder",
        targetId: disc.id,
        message: `Revalidare discrepanță e-TVA (${disc.period}) în ${daysUntil} zile.`,
        daysUntilExpiry: daysUntil,
      })
    }
  }

  return actions
}

// ── Revalidation: Stale evidence detection ───────────────────────────────────

/**
 * Detect fiscal findings with stale evidence (older than threshold).
 */
export function detectStaleEvidence(
  findings: ScanFinding[],
  evidenceDates: Record<string, string>, // findingId -> evidence ISO date
  nowISO: string,
): RevalidationAction[] {
  const actions: RevalidationAction[] = []
  const nowMs = new Date(nowISO).getTime()

  const fiscalCategories = new Set(["E_FACTURA"])

  for (const finding of findings) {
    if (!fiscalCategories.has(finding.category)) continue

    const evidenceDate = evidenceDates[finding.id]
    if (!evidenceDate) continue

    const evidenceMs = new Date(evidenceDate).getTime()
    const ageDays = Math.floor((nowMs - evidenceMs) / MS_PER_DAY)

    if (ageDays > STALE_EVIDENCE_DAYS) {
      actions.push({
        type: "stale_evidence",
        findingId: finding.id,
        evidenceAge: ageDays,
        message: `Dovada pentru "${finding.title}" are ${ageDays} zile — posibil depășită. Verifică dacă situația s-a schimbat.`,
      })
    }
  }

  return actions
}

// ── Notification → Discrepancy Linkage ───────────────────────────────────────

/**
 * Auto-link ANAF notifications to e-TVA discrepancies by matching period + type.
 * Heuristic: notification message or title contains the discrepancy period.
 */
export function autoLinkNotificationsToDiscrepancies(
  notifications: AppNotification[],
  discrepancies: ETVADiscrepancy[],
  existingLinks: NotificationDiscrepancyLink[],
  nowISO: string,
): NotificationDiscrepancyLink[] {
  const newLinks: NotificationDiscrepancyLink[] = []
  const existingSet = new Set(
    existingLinks.map((l) => `${l.notificationId}:${l.discrepancyId}`),
  )

  const anafNotifs = notifications.filter(
    (n) => n.type === "anaf_signal" || n.type === "anaf_deadline" || n.type === "fiscal_alert",
  )

  for (const notif of anafNotifs) {
    const notifText = `${notif.title} ${notif.message}`.toLowerCase()

    for (const disc of discrepancies) {
      const key = `${notif.id}:${disc.id}`
      if (existingSet.has(key)) continue

      // Match by period
      const periodMatch = notifText.includes(disc.period.toLowerCase())

      // Match by type keywords
      const typeKeywords: Record<string, string[]> = {
        sum_mismatch: ["discrepanță", "sume", "diferență"],
        missing_invoice: ["factură lipsă", "lipsă"],
        duplicate_invoice: ["duplicat"],
        period_mismatch: ["perioadă", "perioadă greșită"],
        vat_rate_error: ["cotă tva", "tva incorect"],
        conformity_notice: ["conformare", "notificare"],
      }
      const keywords = typeKeywords[disc.type] ?? []
      const typeMatch = keywords.some((kw) => notifText.includes(kw))

      if (periodMatch && typeMatch) {
        newLinks.push({
          notificationId: notif.id,
          discrepancyId: disc.id,
          linkedAtISO: nowISO,
          linkType: "auto",
          confidence: "high",
        })
        existingSet.add(key)
      } else if (periodMatch) {
        newLinks.push({
          notificationId: notif.id,
          discrepancyId: disc.id,
          linkedAtISO: nowISO,
          linkType: "auto",
          confidence: "medium",
        })
        existingSet.add(key)
      }
    }
  }

  return newLinks
}

// ── Aggregate revalidation check ─────────────────────────────────────────────

/**
 * Run all revalidation checks and return combined actions.
 */
export function runFiscalRevalidation(input: {
  findings: ScanFinding[]
  discrepancies: ETVADiscrepancy[]
  filings: FilingRecord[]
  evidenceDates: Record<string, string>
  nowISO: string
}): RevalidationAction[] {
  return [
    ...checkFiscalFindingRevalidation(
      input.findings,
      input.discrepancies,
      input.filings,
      input.nowISO,
    ),
    ...checkRevalidationReminders(input.discrepancies, input.nowISO),
    ...detectStaleEvidence(input.findings, input.evidenceDates, input.nowISO),
  ]
}
