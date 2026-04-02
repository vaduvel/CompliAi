// V3 P1.3 — Inspector Mode API
import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/inspector")

  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "Inspector Mode / Simulare Control"
    )
    await requirePlan(request, "pro", "Inspector Mode / Simulare Control")
    const [state, nis2State] = await Promise.all([
      readStateForOrg(session.orgId),
      readNis2State(session.orgId),
    ])
    const result = runInspectorSimulation(
      state ?? normalizeComplianceState(initialComplianceState),
      nis2State,
      new Date().toISOString()
    )
    return NextResponse.json(result, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "INSPECTOR_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Internal server error"
    return jsonError(message, 500, "INSPECTOR_FAILED", undefined, context)
  }
}
