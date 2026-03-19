// V3 P1.3 — Inspector Mode API
import { NextResponse } from "next/server"

import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { readState } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { getOrgContext } from "@/lib/server/org-context"
import { logRouteError } from "@/lib/server/operational-logger"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/inspector")

  try {
    await requirePlan(request, "pro", "Inspector Mode / Simulare Control")
    const { orgId } = await getOrgContext()
    const [state, nis2State] = await Promise.all([
      readState(),
      readNis2State(orgId),
    ])
    const result = runInspectorSimulation(state, nis2State, new Date().toISOString())
    return NextResponse.json(result, withRequestIdHeaders(undefined, context))
  } catch (error) {
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
