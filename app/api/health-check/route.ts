// V3 P1.2 — Compliance Health Check API
import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { runHealthCheck } from "@/lib/compliance/health-check"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/health-check")

  try {
    const session = await requireFreshAuthenticatedSession(request, "Health Check periodic")
    await requirePlan(request, "pro", "Health Check periodic")
    const state =
      (await readStateForOrg(session.orgId)) ??
      normalizeComplianceState(initialComplianceState)
    const result = runHealthCheck(state, new Date().toISOString())
    return NextResponse.json(result, withRequestIdHeaders(undefined, context))
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "HEALTH_CHECK_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Internal server error"
    return jsonError(message, 500, "HEALTH_CHECK_FAILED", undefined, context)
  }
}
