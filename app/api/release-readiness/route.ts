import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { getReleaseReadinessStatus } from "@/lib/server/release-readiness"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/release-readiness")

  try {
    requireRole(request, ["owner", "compliance"], "verificarea release readiness")

    const readiness = await getReleaseReadinessStatus()

    return jsonWithRequestContext(
      {
        ok: readiness.ready,
        ...readiness,
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
      code: "RELEASE_READINESS_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Release readiness nu a putut fi verificat.",
      500,
      "RELEASE_READINESS_FAILED",
      undefined,
      context
    )
  }
}
