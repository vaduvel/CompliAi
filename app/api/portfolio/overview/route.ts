import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  buildPortfolioOverviewRows,
  loadPortfolioBundles,
  requirePortfolioAccess,
} from "@/lib/server/portfolio"

export async function GET(request: Request) {
  try {
    const { memberships } = await requirePortfolioAccess(request)
    const bundles = await loadPortfolioBundles(memberships)
    const clients = buildPortfolioOverviewRows(bundles)
    return NextResponse.json({ clients, total: clients.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca portofoliul.", 500, "PORTFOLIO_OVERVIEW_FAILED")
  }
}

