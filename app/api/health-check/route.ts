import { readState } from "@/lib/server/mvp-store"
import { runHealthCheck } from "@/lib/compliance/health-check"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { requirePlan, PlanError } from "@/lib/server/plan"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError } from "@/lib/server/request-validation"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/health-check")

  try {
    await requirePlan(request, "pro", "Health Check periodic")
    const state = await readState()
    const result = runHealthCheck(state, new Date().toISOString())
    return jsonWithRequestContext(result, context)
  } catch (error) {
    if (error instanceof PlanError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "HEALTH_CHECK_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Internal server error",
      500,
      "HEALTH_CHECK_FAILED",
      undefined,
      context
    )
  }
}
