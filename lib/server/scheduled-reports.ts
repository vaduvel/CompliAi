/**
 * scheduled-reports.ts — P1: Scheduled report engine.
 *
 * Partners can configure recurring reports (weekly/monthly/quarterly)
 * for any subset of their portfolio clients.
 *
 * Each report can require approval before sending (creates pending_action)
 * or send directly.
 *
 * Local Map fallback when Supabase is not configured.
 */

import { hasSupabaseConfig, supabaseInsert, supabaseSelect, supabaseUpdate, supabaseDelete } from "./supabase-rest"

// ── Types ────────────────────────────────────────────────────────────────────

export type ScheduledReportType =
  | "compliance_summary"
  | "audit_pack"
  | "fiscal_status"
  | "portfolio_full"

export type ScheduledReportFrequency = "weekly" | "monthly" | "quarterly"

export type ScheduledReport = {
  id: string
  orgId: string           // partner's org
  userId: string
  reportType: ScheduledReportType
  frequency: ScheduledReportFrequency
  clientOrgIds: string[]  // which portfolio clients to include
  recipientEmails: string[]
  requiresApproval: boolean
  enabled: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  createdAtISO: string
  updatedAtISO: string
}

type ScheduledReportRow = {
  id: string
  org_id: string
  user_id: string
  report_type: string
  frequency: string
  client_org_ids: string[]
  recipient_emails: string[]
  requires_approval: boolean
  enabled: boolean
  next_run_at: string | null
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export const REPORT_TYPE_LABELS: Record<ScheduledReportType, string> = {
  compliance_summary: "Sumar conformitate",
  audit_pack: "Audit pack",
  fiscal_status: "Status fiscal",
  portfolio_full: "Portofoliu complet",
}

export const FREQUENCY_LABELS: Record<ScheduledReportFrequency, string> = {
  weekly: "Săptămânal",
  monthly: "Lunar",
  quarterly: "Trimestrial",
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function rowToReport(row: ScheduledReportRow): ScheduledReport {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    reportType: row.report_type as ScheduledReportType,
    frequency: row.frequency as ScheduledReportFrequency,
    clientOrgIds: Array.isArray(row.client_org_ids) ? row.client_org_ids : [],
    recipientEmails: Array.isArray(row.recipient_emails) ? row.recipient_emails : [],
    requiresApproval: row.requires_approval,
    enabled: row.enabled,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    createdAtISO: row.created_at,
    updatedAtISO: row.updated_at,
  }
}

// ── Local fallback ───────────────────────────────────────────────────────────

const localReports = new Map<string, ScheduledReportRow[]>()

function getLocalReports(orgId: string): ScheduledReportRow[] {
  if (!localReports.has(orgId)) localReports.set(orgId, [])
  return localReports.get(orgId)!
}

// ── Next run calculation ────────────────────────────────────────────────────

export function calculateNextRunAt(
  frequency: ScheduledReportFrequency,
  from?: Date
): string {
  const base = from ?? new Date()
  const next = new Date(base)

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      next.setDate(1) // First of next month
      break
    case "quarterly":
      next.setMonth(next.getMonth() + 3)
      next.setDate(1)
      break
  }

  next.setHours(8, 0, 0, 0) // Run at 08:00
  return next.toISOString()
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function createScheduledReport(params: {
  orgId: string
  userId: string
  reportType: ScheduledReportType
  frequency: ScheduledReportFrequency
  clientOrgIds: string[]
  recipientEmails: string[]
  requiresApproval: boolean
}): Promise<ScheduledReport> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const row: ScheduledReportRow = {
    id,
    org_id: params.orgId,
    user_id: params.userId,
    report_type: params.reportType,
    frequency: params.frequency,
    client_org_ids: params.clientOrgIds,
    recipient_emails: params.recipientEmails,
    requires_approval: params.requiresApproval,
    enabled: true,
    next_run_at: calculateNextRunAt(params.frequency),
    last_run_at: null,
    created_at: now,
    updated_at: now,
  }

  if (hasSupabaseConfig()) {
    await supabaseInsert("scheduled_reports", [row], "public")
  } else {
    getLocalReports(params.orgId).push(row)
  }

  return rowToReport(row)
}

export async function listScheduledReports(orgId: string): Promise<ScheduledReport[]> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<ScheduledReportRow>(
      "scheduled_reports",
      `select=*&org_id=eq.${orgId}&order=created_at.desc`,
      "public"
    )
    return rows.map(rowToReport)
  }

  return getLocalReports(orgId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(rowToReport)
}

export async function getScheduledReport(
  orgId: string,
  reportId: string
): Promise<ScheduledReport | null> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<ScheduledReportRow>(
      "scheduled_reports",
      `select=*&org_id=eq.${orgId}&id=eq.${reportId}&limit=1`,
      "public"
    )
    return rows[0] ? rowToReport(rows[0]) : null
  }

  const row = getLocalReports(orgId).find((r) => r.id === reportId)
  return row ? rowToReport(row) : null
}

export async function updateScheduledReport(
  orgId: string,
  reportId: string,
  updates: Partial<Pick<ScheduledReport, "reportType" | "frequency" | "clientOrgIds" | "recipientEmails" | "requiresApproval" | "enabled">>
): Promise<ScheduledReport | null> {
  const now = new Date().toISOString()

  const rowUpdates: Partial<ScheduledReportRow> = {
    updated_at: now,
  }
  if (updates.reportType !== undefined) rowUpdates.report_type = updates.reportType
  if (updates.frequency !== undefined) {
    rowUpdates.frequency = updates.frequency
    rowUpdates.next_run_at = calculateNextRunAt(updates.frequency)
  }
  if (updates.clientOrgIds !== undefined) rowUpdates.client_org_ids = updates.clientOrgIds
  if (updates.recipientEmails !== undefined) rowUpdates.recipient_emails = updates.recipientEmails
  if (updates.requiresApproval !== undefined) rowUpdates.requires_approval = updates.requiresApproval
  if (updates.enabled !== undefined) rowUpdates.enabled = updates.enabled

  if (hasSupabaseConfig()) {
    await supabaseUpdate(
      "scheduled_reports",
      `org_id=eq.${orgId}&id=eq.${reportId}`,
      rowUpdates,
      "public"
    )
  } else {
    const row = getLocalReports(orgId).find((r) => r.id === reportId)
    if (row) Object.assign(row, rowUpdates)
  }

  return getScheduledReport(orgId, reportId)
}

export async function deleteScheduledReport(orgId: string, reportId: string): Promise<void> {
  if (hasSupabaseConfig()) {
    await supabaseDelete(
      "scheduled_reports",
      `org_id=eq.${orgId}&id=eq.${reportId}`,
      "public"
    )
  } else {
    const list = getLocalReports(orgId)
    const idx = list.findIndex((r) => r.id === reportId)
    if (idx !== -1) list.splice(idx, 1)
  }
}

/** Returns reports that are due to run (next_run_at <= now). */
export async function getDueReports(nowISO: string): Promise<ScheduledReport[]> {
  if (hasSupabaseConfig()) {
    const rows = await supabaseSelect<ScheduledReportRow>(
      "scheduled_reports",
      `select=*&enabled=eq.true&next_run_at=lte.${nowISO}&limit=50`,
      "public"
    )
    return rows.map(rowToReport)
  }

  const all: ScheduledReport[] = []
  for (const [, rows] of localReports) {
    for (const row of rows) {
      if (row.enabled && row.next_run_at && row.next_run_at <= nowISO) {
        all.push(rowToReport(row))
      }
    }
  }
  return all
}

/** Mark a report as run and update next_run_at. */
export async function markReportRun(orgId: string, reportId: string, frequency: ScheduledReportFrequency): Promise<void> {
  const now = new Date().toISOString()
  const nextRunAt = calculateNextRunAt(frequency)

  if (hasSupabaseConfig()) {
    await supabaseUpdate(
      "scheduled_reports",
      `org_id=eq.${orgId}&id=eq.${reportId}`,
      { last_run_at: now, next_run_at: nextRunAt, updated_at: now },
      "public"
    )
  } else {
    const row = getLocalReports(orgId).find((r) => r.id === reportId)
    if (row) {
      row.last_run_at = now
      row.next_run_at = nextRunAt
      row.updated_at = now
    }
  }
}
