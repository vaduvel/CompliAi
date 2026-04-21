// Portfolio Inbox — aggregated cross-client feed for partner workspace.
// Merges two data sources across all client orgs where partner has membership:
//   1. Compliance alerts (findings flagged critical/high) via buildPortfolioAlertRows
//   2. In-app notifications (cron output: legislation-monitor, daily-digest,
//      drift-sweep, vendor-risk, document, ANAF fiscal signals) via
//      safeListNotifications per org
//
// Returns chronological feed with dual sort (unread first, then newest).
// Consumer: /portfolio/alerte (the "killer feature" — Diana JTBD #1).

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  buildPortfolioAlertRows,
  loadPortfolioBundles,
  requirePortfolioAccess,
  type PortfolioAlertRow,
  type PortfolioOrgBundle,
} from "@/lib/server/portfolio"
import {
  safeListNotifications,
  normalizeNotificationForDisplay,
  type AppNotification,
  type NotificationType,
} from "@/lib/server/notifications-store"
import { isFindingActive } from "@/lib/compliscan/finding-cockpit"
import type { ScanFinding } from "@/lib/compliance/types"

export type InboxItemSource = "alert" | "notification"

export type InboxItem = {
  id: string
  source: InboxItemSource
  /** severity bucket for UI styling */
  severity: "critical" | "high" | "medium" | "low" | "info"
  /** framework tag when alert; notification type when notification */
  kind: string
  title: string
  message?: string
  orgId: string
  orgName: string
  /** ISO timestamp — authoritative sort key */
  createdAt: string
  /** undefined for alerts (always shown); true/false for notifications */
  unread?: boolean
  /** deep-link into org context (canonical /dashboard/...) */
  linkTo?: string
  /** original alert framework if source === "alert" */
  framework?: string
  /** original notification type if source === "notification" */
  notificationType?: NotificationType
  sourceDocument?: string
  /** underlying finding id when item corresponds to a finding (bulk-action target) */
  findingId?: string
  /** underlying notification id when source === "notification" (bulk-action target) */
  notificationId?: string
}

/** Convert notification type to a severity bucket for unified UI display. */
function notificationSeverity(type: NotificationType): InboxItem["severity"] {
  switch (type) {
    case "drift_detected":
    case "incident_deadline":
    case "anaf_deadline":
    case "fiscal_alert":
      return "high"
    case "finding_new":
    case "vendor_risk":
    case "anaf_signal":
      return "medium"
    case "document_generated":
    case "info":
    default:
      return "info"
  }
}

function alertToInboxItem(alert: PortfolioAlertRow): InboxItem {
  const findingId = alert.findingId ?? alert.alertId
  return {
    id: `alert:${alert.alertId}`,
    source: "alert",
    severity: alert.severity,
    kind: alert.framework ?? "COMPLIANCE",
    title: alert.title,
    orgId: alert.orgId,
    orgName: alert.orgName,
    createdAt: alert.createdAtISO,
    linkTo: `/dashboard/actiuni/remediere/${encodeURIComponent(findingId)}`,
    framework: alert.framework,
    sourceDocument: alert.sourceDocument,
    findingId,
  }
}

/** Map a critical/high finding to an inbox item so fresh imports show signal
 * even before cron-driven alerts populate state.alerts. Mirrors alertToInboxItem
 * shape to keep client UI uniform. */
function findingToInboxItem(
  finding: ScanFinding,
  orgId: string,
  orgName: string
): InboxItem {
  const severity: InboxItem["severity"] =
    finding.severity === "critical"
      ? "critical"
      : finding.severity === "high"
        ? "high"
        : finding.severity === "medium"
          ? "medium"
          : "low"
  return {
    id: `finding:${orgId}:${finding.id}`,
    source: "alert",
    severity,
    kind: finding.category ?? "COMPLIANCE",
    title: finding.title,
    message: finding.detail,
    orgId,
    orgName,
    createdAt: finding.createdAtISO,
    linkTo: `/dashboard/actiuni/remediere/${encodeURIComponent(finding.id)}`,
    framework: finding.category,
    sourceDocument: finding.sourceDocument,
    findingId: finding.id,
  }
}

function criticalFindingsFromBundles(bundles: PortfolioOrgBundle[]): InboxItem[] {
  return bundles.flatMap(({ membership, state }) => {
    if (!state) return []
    return state.findings
      .filter(
        (f) =>
          isFindingActive(f) && (f.severity === "critical" || f.severity === "high")
      )
      .map((f) => findingToInboxItem(f, membership.orgId, membership.orgName))
  })
}

function notificationToInboxItem(
  notification: AppNotification,
  orgId: string,
  orgName: string
): InboxItem {
  const normalized = normalizeNotificationForDisplay(notification)
  return {
    id: `notif:${orgId}:${normalized.id}`,
    source: "notification",
    severity: notificationSeverity(normalized.type),
    kind: normalized.type,
    title: normalized.title,
    message: normalized.message,
    orgId,
    orgName,
    createdAt: normalized.createdAt,
    unread: !normalized.readAt,
    linkTo: normalized.linkTo,
    notificationType: normalized.type,
    notificationId: normalized.id,
  }
}

/** Inbox sort: unread → first, then newest → first. */
function compareInbox(a: InboxItem, b: InboxItem) {
  const aUnread = a.unread === true ? 1 : 0
  const bUnread = b.unread === true ? 1 : 0
  if (aUnread !== bUnread) return bUnread - aUnread
  return b.createdAt.localeCompare(a.createdAt)
}

export async function GET(request: Request) {
  try {
    const { memberships } = await requirePortfolioAccess(request)

    // Parallel load: bundles (for alerts) + notifications per org
    const [bundles, notificationsByOrg] = await Promise.all([
      loadPortfolioBundles(memberships),
      Promise.all(
        memberships.map(async (m) => ({
          orgId: m.orgId,
          orgName: m.orgName,
          notifications: await safeListNotifications(m.orgId),
        }))
      ),
    ])

    const alertItems = buildPortfolioAlertRows(bundles).map(alertToInboxItem)
    const findingItems = criticalFindingsFromBundles(bundles)
    const notificationItems = notificationsByOrg.flatMap((entry) =>
      entry.notifications.map((n) => notificationToInboxItem(n, entry.orgId, entry.orgName))
    )

    // Dedupe: if both an alert AND a finding point to the same finding, keep the
    // alert (it carries the remediation pipeline context).
    const alertFindingIds = new Set(
      alertItems.map((a) => a.findingId).filter((id): id is string => !!id)
    )
    const dedupedFindings = findingItems.filter(
      (f) => !f.findingId || !alertFindingIds.has(f.findingId)
    )

    const items = [...alertItems, ...dedupedFindings, ...notificationItems].sort(compareInbox)

    // Aggregates for header stats
    const critical = items.filter(
      (i) => i.severity === "critical" || i.severity === "high"
    ).length
    const unread = items.filter((i) => i.unread === true).length
    const firmsAffected = new Set(items.map((i) => i.orgId)).size
    const frameworks = [
      ...new Set(items.map((i) => i.framework).filter((f): f is string => !!f)),
    ].sort()
    const firms = [...new Set(memberships.map((m) => `${m.orgId}|${m.orgName}`))]
      .map((s) => {
        const [orgId, orgName] = s.split("|")
        return { orgId, orgName }
      })
      .sort((a, b) => a.orgName.localeCompare(b.orgName, "ro"))

    return NextResponse.json({
      items,
      total: items.length,
      critical,
      unread,
      firmsAffected,
      firms,
      frameworks,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca inbox-ul portofoliu.", 500, "PORTFOLIO_INBOX_FAILED")
  }
}
