// GET /api/partner/urgency-queue — Fix #6: cross-client urgency queue
// Returns findings sorted by severity across all partner clients

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
  buildPortfolioAlertRows,
  buildPortfolioOverviewRows,
} from "@/lib/server/portfolio"

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

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

    // Build cross-client findings from state
    const items = bundles.flatMap(({ membership, state }) => {
      if (!state) return []
      return state.findings.map((f) => ({
        orgId: membership.orgId,
        orgName: membership.orgName,
        findingId: f.id,
        title: f.title,
        severity: f.severity,
        framework: f.category,
        deadline: null as string | null,
        legalReference: f.legalReference ?? null,
      }))
    })

    // Merge alert rows as urgency items too
    const alertItems = alertRows.map((a) => ({
      orgId: a.orgId,
      orgName: a.orgName,
      findingId: a.alertId,
      title: a.title,
      severity: a.severity as string,
      framework: a.framework,
      deadline: null as string | null,
      legalReference: null as string | null,
    }))

    const allItems = [...items, ...alertItems].sort(
      (a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
    )

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
