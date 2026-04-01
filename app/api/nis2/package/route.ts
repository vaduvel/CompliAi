import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { buildNis2Findings, buildNis2Package, readNis2State } from "@/lib/server/nis2-store"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const [state, nis2State] = await Promise.all([readState(), readNis2State(orgId)])
    const nowISO = new Date().toISOString()
    const nis2Package = buildNis2Package(nis2State, nowISO)
    const applicableFromApplicability = (state.applicability?.entries ?? []).some(
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
