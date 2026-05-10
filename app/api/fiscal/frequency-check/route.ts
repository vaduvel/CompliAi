// Detector frecvență declarații — endpoint care rulează regulile pe profilul
// org curent + filings istorice. Returnează expectedFrequency + mismatches.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  detectExpectedFrequency,
  detectFrequencyMismatches,
  type FrequencyDetection,
} from "@/lib/compliance/declaration-frequency-detector"
import type { ComplianceState } from "@/lib/compliance/types"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"

type StateWithFiscal = ComplianceState & { filingRecords?: FilingRecord[] }

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "frequency check fiscal",
    )
    const state = (await readStateForOrg(session.orgId)) as StateWithFiscal | null
    if (!state) return jsonError("State indisponibil.", 500, "STATE_UNAVAILABLE")

    const profile = state.orgProfile
    const employeeCount = profile?.employeeCount

    // Estimare CA din employeeCount (nu avem CA direct în orgProfile)
    let annualRevenueRon: number | null = null
    if (employeeCount === "1-9") annualRevenueRon = 200_000
    else if (employeeCount === "10-49") annualRevenueRon = 800_000
    else if (employeeCount === "50-249") annualRevenueRon = 5_000_000
    else if (employeeCount === "250+") annualRevenueRon = 30_000_000

    const expected: FrequencyDetection = detectExpectedFrequency({
      annualRevenueRon,
      hasIntraCommunityTransactions: false,  // TODO: detect from filings/state
      isFirstYearOfActivity: false,
    })

    const filings = state.filingRecords ?? []
    const mismatches = detectFrequencyMismatches(filings, expected)

    return NextResponse.json({
      expected,
      mismatches,
      filingsAnalyzed: filings.length,
    })
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare detector frecvență.", 500, "FREQ_FAILED")
  }
}
