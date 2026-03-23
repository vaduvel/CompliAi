import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  buildPortfolioAlertRows,
  loadPortfolioBundles,
  requirePortfolioAccess,
} from "@/lib/server/portfolio"

export async function GET(request: Request) {
  try {
    const { memberships } = await requirePortfolioAccess(request)
    const bundles = await loadPortfolioBundles(memberships)
    const alerts = buildPortfolioAlertRows(bundles)
    return NextResponse.json({
      alerts,
      total: alerts.length,
      critical: alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high").length,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca alertele de portofoliu.", 500, "PORTFOLIO_ALERTS_FAILED")
  }
}

