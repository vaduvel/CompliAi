import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError } from "@/lib/server/auth"
import {
  buildPortfolioVendorRows,
  loadPortfolioBundles,
  requirePortfolioAccess,
} from "@/lib/server/portfolio"

export async function GET(request: Request) {
  try {
    const { memberships } = await requirePortfolioAccess(request)
    const bundles = await loadPortfolioBundles(memberships)
    const vendors = buildPortfolioVendorRows(bundles)
    return NextResponse.json({ vendors, total: vendors.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca vendorii de portofoliu.", 500, "PORTFOLIO_VENDORS_FAILED")
  }
}

