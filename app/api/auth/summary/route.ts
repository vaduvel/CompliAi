import { AuthzError, listUserMemberships, readFreshSessionFromRequest } from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/auth/summary")

  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) {
      return jsonWithRequestContext({
        user: null,
        memberships: [],
        currentMembershipId: null,
        currentOrgId: null,
      }, context)
    }

    const memberships = await listUserMemberships(session.userId)

    return jsonWithRequestContext({
      user: {
        email: session.email,
        orgId: session.orgId,
        orgName: session.orgName,
        role: session.role,
        membershipId: session.membershipId ?? null,
        workspaceMode: session.workspaceMode ?? "org",
      },
      memberships,
      currentMembershipId: session.membershipId ?? null,
      currentOrgId: session.orgId,
    }, context)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_SUMMARY_FETCH_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca sumarul de sesiune.",
      500,
      "AUTH_SUMMARY_FETCH_FAILED",
      undefined,
      context
    )
  }
}
