import { readState } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"
import { readNis2State } from "@/lib/server/nis2-store"
import { runInspectorSimulation } from "@/lib/compliance/inspector-mode"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError } from "@/lib/server/request-validation"

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
    return jsonWithRequestContext(result, context)
  } catch (error) {
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "INSPECTOR_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Internal server error",
      500,
      "INSPECTOR_FAILED",
      undefined,
      context
    )
  }
}
