import {
  AuthzError,
  listUserMemberships,
  requireFreshAuthenticatedSession,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/auth/memberships")

  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizarea organizatiilor disponibile"
    )
    const memberships = await listUserMemberships(session.userId)

    return jsonWithRequestContext({
      memberships,
      currentMembershipId: session.membershipId ?? null,
      currentOrgId: session.orgId,
    }, context)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_MEMBERSHIPS_FETCH_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca organizatiile disponibile.",
      500,
      "AUTH_MEMBERSHIPS_FETCH_FAILED",
      undefined,
      context
    )
  }
}
