import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "vizualizarea log-ului de audit"
    )
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    return NextResponse.json({ events: state.events ?? [] })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Log-ul de audit nu a putut fi incarcat.", 500, "AUDIT_LOG_FAILED")
  }
}
