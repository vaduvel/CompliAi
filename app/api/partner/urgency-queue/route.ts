// GET /api/partner/urgency-queue — Fix #6: cross-client urgency queue
// Returns findings sorted by severity across all partner clients

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
  buildPortfolioAlertRows,
} from "@/lib/server/portfolio"
import type { ComplianceState, ScanFinding } from "@/lib/compliance/types"

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const DAY_MS = 24 * 60 * 60 * 1000

type UrgencyItem = {
  orgId: string
  orgName: string
  findingId: string
  title: string
  severity: ScanFinding["severity"]
  framework: string
  deadline: string | null
  deadlineLabel: string | null
  deadlineStatus: "overdue" | "due_soon" | "scheduled" | "none"
  legalReference: string | null
  badges: string[]
  alertIds: string[]
  createdAtISO: string
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "accesarea cozii de urgențe"
    )

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError("Doar utilizatorii în modul partner pot accesa coada de urgențe.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))
    const alertRows = buildPortfolioAlertRows(bundles)

    const itemsByKey = new Map<string, UrgencyItem>()

    // Build cross-client findings from state. Closed/resolved findings do not belong
    // in "ce arde azi"; they stay visible in client history and evidence ledger.
    for (const { membership, state } of bundles) {
      if (!state) continue

      for (const finding of state.findings) {
        if (!isOpenFinding(finding, state)) continue
        const deadline = deriveFindingDeadline(finding)
        const key = `${membership.orgId}:${finding.id}`
        itemsByKey.set(key, {
          orgId: membership.orgId,
          orgName: membership.orgName,
          findingId: finding.id,
          title: finding.title,
          severity: finding.severity,
          framework: finding.category,
          deadline: deadline.deadline,
          deadlineLabel: deadline.deadlineLabel,
          deadlineStatus: deadline.deadlineStatus,
          legalReference: finding.legalReference ?? null,
          badges: buildFindingBadges(finding, deadline),
          alertIds: [],
          createdAtISO: finding.createdAtISO,
        })
      }
    }

    // Merge alerts into their related finding instead of duplicating rows.
    for (const alert of alertRows) {
      const bundle = bundles.find((candidate) => candidate.membership.orgId === alert.orgId)
      const state = bundle?.state
      const linkedFinding = alert.findingId && state
        ? state.findings.find((finding) => finding.id === alert.findingId)
        : null

      if (linkedFinding && !isOpenFinding(linkedFinding, state!)) continue

      const key = `${alert.orgId}:${alert.findingId ?? alert.alertId}`
      const existing = itemsByKey.get(key)
      if (existing) {
        existing.alertIds.push(alert.alertId)
        existing.badges = mergeBadges(existing.badges, ["alertă activă"])
        if ((SEV_ORDER[alert.severity] ?? 3) < (SEV_ORDER[existing.severity] ?? 3)) {
          existing.severity = alert.severity
        }
        continue
      }

      const deadline = linkedFinding ? deriveFindingDeadline(linkedFinding) : noDeadline()
      itemsByKey.set(key, {
        orgId: alert.orgId,
        orgName: alert.orgName,
        findingId: alert.findingId ?? alert.alertId,
        title: alert.title,
        severity: alert.severity,
        framework: alert.framework,
        deadline: deadline.deadline,
        deadlineLabel: deadline.deadlineLabel,
        deadlineStatus: deadline.deadlineStatus,
        legalReference: linkedFinding?.legalReference ?? null,
        badges: mergeBadges(["alertă activă"], linkedFinding ? buildFindingBadges(linkedFinding, deadline) : []),
        alertIds: [alert.alertId],
        createdAtISO: alert.createdAtISO,
      })
    }

    const allItems = [...itemsByKey.values()].sort(compareUrgencyItems)

    // Group by framework
    const groupedByFramework: Record<string, number> = {}
    for (const item of allItems) {
      groupedByFramework[item.framework] = (groupedByFramework[item.framework] ?? 0) + 1
    }

    // Group by severity
    const groupedBySeverity: Record<string, number> = {}
    for (const item of allItems) {
      groupedBySeverity[item.severity] = (groupedBySeverity[item.severity] ?? 0) + 1
    }

    return NextResponse.json({
      items: allItems.slice(0, 100),
      total: allItems.length,
      groupedByFramework,
      groupedBySeverity,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcarea cozii de urgențe.", 500, "URGENCY_QUEUE_FAILED")
  }
}

function isOpenFinding(finding: ScanFinding, state: ComplianceState) {
  if (["resolved", "dismissed", "under_monitoring"].includes(finding.findingStatus ?? "open")) {
    return false
  }

  const tasks = state.taskState ?? {}
  const taskState = tasks[finding.id] ?? tasks[`finding-${finding.id}`]
  if (taskState?.status === "done" && taskState.validationStatus === "passed") return false

  return true
}

function deriveFindingDeadline(finding: ScanFinding): Pick<UrgencyItem, "deadline" | "deadlineLabel" | "deadlineStatus"> {
  const text = `${finding.id} ${finding.title} ${finding.detail} ${finding.legalReference ?? ""}`.toLowerCase()
  const baseISO = extractDateFromText(`${finding.sourceDocument} ${finding.detail}`) ?? finding.createdAtISO
  let deadlineISO: string | null = null
  let legalLabel = "termen operațional"

  if (text.includes("dsar") || text.includes("art. 15")) {
    deadlineISO = addDaysISO(baseISO, 30)
    legalLabel = "termen legal DSAR: 30 zile"
  } else if (text.includes("dpa") || text.includes("art. 28")) {
    deadlineISO = addDaysISO(finding.createdAtISO, text.includes("expirat") ? 7 : 14)
    legalLabel = text.includes("expirat") ? "DPA expirat: revizie în 7 zile" : "DPA: revizie în 14 zile"
  } else if (text.includes("dpia") || text.includes("art. 35")) {
    deadlineISO = addDaysISO(finding.createdAtISO, 14)
    legalLabel = "DPIA: review în 14 zile"
  } else if (text.includes("cookie") || text.includes("consim")) {
    deadlineISO = addDaysISO(finding.createdAtISO, 10)
    legalLabel = "cookie/consimțământ: dovadă în 10 zile"
  } else if (text.includes("audit") || text.includes("dovad")) {
    deadlineISO = addDaysISO(finding.createdAtISO, 14)
    legalLabel = "dovadă audit: 14 zile"
  }

  if (!deadlineISO) return noDeadline()

  const days = Math.ceil((Date.parse(deadlineISO) - Date.now()) / DAY_MS)
  const status = days < 0 ? "overdue" : days <= 7 ? "due_soon" : "scheduled"
  const label = days < 0
    ? `depășit cu ${Math.abs(days)} zile · ${legalLabel}`
    : days === 0
      ? `scadent azi · ${legalLabel}`
      : `${days} zile rămase · ${legalLabel}`

  return {
    deadline: deadlineISO,
    deadlineLabel: label,
    deadlineStatus: status,
  }
}

function noDeadline(): Pick<UrgencyItem, "deadline" | "deadlineLabel" | "deadlineStatus"> {
  return { deadline: null, deadlineLabel: null, deadlineStatus: "none" }
}

function extractDateFromText(value: string) {
  const match = value.match(/(?:^|[^0-9])(20\d{2})-(\d{2})-(\d{2})(?!\d)/)
  if (!match) return null
  return `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`
}

function addDaysISO(value: string, days: number) {
  const time = Date.parse(value)
  const base = Number.isFinite(time) ? time : Date.now()
  return new Date(base + days * DAY_MS).toISOString()
}

function buildFindingBadges(
  finding: ScanFinding,
  deadline: Pick<UrgencyItem, "deadlineStatus">
) {
  const badges: string[] = [finding.severity]
  if (deadline.deadlineStatus === "overdue") badges.push("deadline depășit")
  if (deadline.deadlineStatus === "due_soon") badges.push("deadline apropiat")
  if (finding.suggestedDocumentType) badges.push(`document: ${finding.suggestedDocumentType}`)
  return mergeBadges(badges)
}

function mergeBadges(...groups: string[][]) {
  return [...new Set(groups.flat().filter(Boolean))]
}

function compareUrgencyItems(left: UrgencyItem, right: UrgencyItem) {
  const bySeverity = (SEV_ORDER[left.severity] ?? 3) - (SEV_ORDER[right.severity] ?? 3)
  if (bySeverity !== 0) return bySeverity

  const byDeadline = deadlineRank(left.deadlineStatus) - deadlineRank(right.deadlineStatus)
  if (byDeadline !== 0) return byDeadline

  if (left.deadline && right.deadline && left.deadline !== right.deadline) {
    return left.deadline.localeCompare(right.deadline)
  }

  return left.createdAtISO.localeCompare(right.createdAtISO)
}

function deadlineRank(status: UrgencyItem["deadlineStatus"]) {
  switch (status) {
    case "overdue":
      return 0
    case "due_soon":
      return 1
    case "scheduled":
      return 2
    default:
      return 3
  }
}
