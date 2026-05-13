// GET /api/partner/portfolio/client-burden — FC-8 Client Burden Index.
//
// Doc 09 cap 5 + Doc 08 cap 4: pentru cabinet, calculează burden per client
// (excepții/lună, ore consumate, fiscal risk activ, classification).
//
// Auth: doar partner mode poate accesa. Reuses listAccessiblePortfolioMemberships
// + loadPortfolioBundles din infrastructura existing.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import {
  listAccessiblePortfolioMemberships,
  loadPortfolioBundles,
} from "@/lib/server/portfolio"
import { runCrossCorrelation } from "@/lib/compliance/cross-correlation-engine"
import {
  buildPortfolioBurdenReport,
  type BurdenInput,
} from "@/lib/compliance/client-burden-index"
import { annotateWithImpact } from "@/lib/compliance/economic-impact"
import type { ComplianceState } from "@/lib/compliance/types"
import type { StateWithParsedDeclarations } from "@/lib/compliance/parsed-declarations"
import type { StateWithParsedAga } from "@/lib/compliance/parsed-aga"
import type { StateWithParsedInvoices } from "@/lib/compliance/parsed-invoices"
import type { StateWithOnrcSnapshots } from "@/lib/compliance/onrc-snapshot"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

type StateExt = ComplianceState &
  StateWithParsedDeclarations &
  StateWithParsedAga &
  StateWithParsedInvoices &
  StateWithOnrcSnapshots & {
    filingRecords?: FilingRecord[]
    /** Monthly fee storage (optional, derivat din settings.tenant — viitor). */
    cabinetSettings?: { monthlyFeeRON?: number; avgResponseHours?: number }
  }

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "accesarea Client Burden Index",
    )

    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Doar utilizatorii în modul partner pot accesa Client Burden Index.",
        403,
        "CLIENT_BURDEN_FORBIDDEN",
      )
    }

    const memberships = await listAccessiblePortfolioMemberships(session)
    const bundles = await loadPortfolioBundles(memberships.slice(0, 50))

    const burdenInputs: BurdenInput[] = bundles.map((bundle) => {
      const state = bundle.state as StateExt | null
      const declarations = state?.parsedDeclarations ?? []
      const aga = state?.parsedAga ?? []
      const invoices = state?.parsedInvoices ?? []
      const onrc = state?.onrcSnapshots ?? []
      const filings = state?.filingRecords ?? []

      // Rulează cross-correlation per client + annotează cu impact
      const xcorr = runCrossCorrelation({
        declarations,
        aga,
        invoices,
        onrc,
        filings,
      })
      const annotated = annotateWithImpact(xcorr.findings)

      return {
        orgId: bundle.membership.orgId,
        orgName: bundle.membership.orgName,
        filings,
        crossCorrelationFindings: annotated,
        monthlyFeeRON: state?.cabinetSettings?.monthlyFeeRON,
        avgResponseHours: state?.cabinetSettings?.avgResponseHours,
      }
    })

    const report = buildPortfolioBurdenReport(burdenInputs)

    return NextResponse.json({
      ok: true,
      report,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Eroare Client Burden Index.",
      500,
      "CLIENT_BURDEN_FAILED",
    )
  }
}
