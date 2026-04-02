import { NextResponse } from "next/server"

import { PAY_TRANSPARENCY_FINDING_ID } from "@/lib/compliance/pay-transparency-rule"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { listPayGapReports, listSalaryRecords } from "@/lib/server/pay-transparency-store"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "citirea Pay Transparency"
    )

    const [records, reports, state] = await Promise.all([
      listSalaryRecords(session.orgId),
      listPayGapReports(session.orgId),
      readFreshStateForOrg(session.orgId, session.orgName),
    ])
    const normalizedState = state ?? normalizeComplianceState(initialComplianceState)

    const finding = normalizedState.findings.find((item) => item.id === PAY_TRANSPARENCY_FINDING_ID) ?? null

    return NextResponse.json({
      records,
      latestReport: reports[0] ?? null,
      findingStatus: finding?.findingStatus ?? finding?.reviewState ?? null,
      finding,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Nu am putut încărca fluxul Pay Transparency.", 500, "PAY_TRANSPARENCY_READ_FAILED")
  }
}
