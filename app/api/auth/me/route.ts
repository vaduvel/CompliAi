import { AuthzError, readFreshSessionFromRequest } from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/auth/me")

  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return jsonWithRequestContext({ user: null }, context)

    return jsonWithRequestContext({
      user: {
        email: session.email,
        orgId: session.orgId,
        orgName: session.orgName,
        role: session.role,
        membershipId: session.membershipId ?? null,
      },
    }, context)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, { user: null }, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_SESSION_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Sesiunea nu poate fi verificata."
    return jsonError(message, 500, "AUTH_SESSION_FAILED", { user: null }, context)
  }
}
