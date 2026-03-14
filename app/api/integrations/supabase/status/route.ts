import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { getSupabaseOperationalStatus } from "@/lib/server/supabase-status"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/integrations/supabase/status")

  try {
    requireRole(request, ["owner", "compliance"], "verificarea statusului operational Supabase")

    return jsonWithRequestContext(
      {
        ok: true,
        ...(await getSupabaseOperationalStatus()),
      },
      context
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      logRouteError(context, error, {
        code: error.code,
        durationMs: getRequestDurationMs(context),
        status: error.status,
      })
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    logRouteError(context, error, {
      code: "SUPABASE_STATUS_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Statusul Supabase nu a putut fi verificat.",
      500,
      "SUPABASE_STATUS_FAILED",
      undefined,
      context
    )
  }
}
