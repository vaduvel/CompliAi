// GET /api/partner/portfolio — Fix #6: aggregate cross-client portfolio summary
// Returns metrics, scores, and top findings for Partner dashboard

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
  buildPortfolioOverviewRows,
  buildPortfolioAlertRows,
} from "@/lib/server/portfolio"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "accesarea portofoliului")

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError("Doar utilizatorii în modul partner pot accesa portofoliul.", 403, "PORTFOLIO_FORBIDDEN")
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))
    const clients = buildPortfolioOverviewRows(bundles)
    const alertRows = buildPortfolioAlertRows(bundles)

    const totalClients = clients.length
    const clientsWithData = clients.filter((c) => c.compliance?.hasData)
    const criticalCount = clients.filter((c) => (c.compliance?.criticalFindings ?? 0) > 0).length
    const urgentDsarCount = clients.reduce(
      (sum, c) => sum + (c.compliance?.urgentDsarCount ?? 0),
      0
    )
    const avgScore = clientsWithData.length > 0
      ? Math.round(clientsWithData.reduce((sum, c) => sum + (c.compliance?.score ?? 0), 0) / clientsWithData.length)
      : 0

    return NextResponse.json({
      totalClients,
      criticalCount,
      urgentDsarCount,
      avgScore,
      urgentFindings: alertRows.slice(0, 10),
      clientScores: clients.map((c) => ({
        orgId: c.orgId,
        name: c.orgName,
        score: c.compliance?.score ?? null,
        alertCount: c.compliance?.openAlerts ?? 0,
        criticalFindings: c.compliance?.criticalFindings ?? 0,
        activeDsarCount: c.compliance?.activeDsarCount ?? 0,
        urgentDsarCount: c.compliance?.urgentDsarCount ?? 0,
        hasData: c.compliance?.hasData ?? false,
      })),
      summary: {
        totalAlerts: alertRows.length,
        criticalAlerts: alertRows.filter((a) => a.severity === "critical").length,
        highAlerts: alertRows.filter((a) => a.severity === "high").length,
        urgentDsarCount,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la încărcarea portofoliului.", 500, "PORTFOLIO_FAILED")
  }
}
