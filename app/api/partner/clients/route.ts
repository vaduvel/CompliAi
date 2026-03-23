// Partner portal: list all organizations where the current user has a membership.
// Returns org summaries with compliance scores for multi-client dashboard.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import {
  buildPortfolioOverviewRows,
  loadPortfolioBundles,
  listAccessiblePortfolioMemberships,
  type PortfolioOverviewClientSummary,
} from "@/lib/server/portfolio"

export type PartnerClientSummary = PortfolioOverviewClientSummary

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 20))
    const clients = buildPortfolioOverviewRows(bundles)

    return NextResponse.json({ clients, total: memberships.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la incarcarea clientilor.", 500, "PARTNER_CLIENTS_FAILED")
  }
}
