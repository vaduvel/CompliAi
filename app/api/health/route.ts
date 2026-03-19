import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { getApplicationHealthStatus } from "@/lib/server/app-health"
import { AuthzError, requireAuthenticatedSession } from "@/lib/server/auth"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/health")

  try {
    requireAuthenticatedSession(request, "verificarea health check-ului")

    const health = await getApplicationHealthStatus()

    return jsonWithRequestContext(
      {
        ok: health.state !== "blocked",
        ...health,
      },
      context
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      await logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })

      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "APP_HEALTH_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Health check-ul aplicației a eșuat.",
      500,
      "APP_HEALTH_FAILED",
      undefined,
      context
    )
  }
}
