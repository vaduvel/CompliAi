import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  buildPortfolioTaskRows,
  loadPortfolioBundles,
  requirePortfolioAccess,
} from "@/lib/server/portfolio"

export async function GET(request: Request) {
  try {
    const { memberships } = await requirePortfolioAccess(request)
    const bundles = await loadPortfolioBundles(memberships)
    const tasks = buildPortfolioTaskRows(bundles)
    return NextResponse.json({ tasks, total: tasks.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca remedierea de portofoliu.", 500, "PORTFOLIO_TASKS_FAILED")
  }
}

