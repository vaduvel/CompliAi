import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildNis2Findings, buildNis2Package, readNis2State } from "@/lib/server/nis2-store"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea pachetului NIS2")

    const [state, nis2State] = await Promise.all([
      readFreshStateForOrg(session.orgId, session.orgName),
      readNis2State(session.orgId),
    ])
    const nowISO = new Date().toISOString()
    const nis2Package = buildNis2Package(nis2State, nowISO)
    const runtimeState = state ?? normalizeComplianceState(initialComplianceState)
    const applicableFromApplicability = (runtimeState.applicability?.entries ?? []).some(
      (entry) => entry.tag === "nis2" && entry.certainty !== "unlikely"
    )
    const applicable = nis2Package.applicable || applicableFromApplicability
    const findings = applicable ? buildNis2Findings(nis2State, nowISO) : []

    return NextResponse.json({
      applicable,
      nis2Package: { ...nis2Package, applicable },
      findings,
      exportReady: applicable && findings.length === 0,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca pachetul NIS2.", 500, "NIS2_PACKAGE_READ_FAILED")
  }
}
