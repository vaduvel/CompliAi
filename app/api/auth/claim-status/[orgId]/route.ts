import { getActiveClaimInviteForOrg } from "@/lib/server/claim-ownership"
import {
  AuthzError,
  getOrganizationOwnership,
  listUserMemberships,
  readFreshSessionFromRequest,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const context = createRequestContext(request, "/api/auth/claim-status/[orgId]")

  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) {
      return jsonError("Sesiune invalida.", 401, "AUTH_SESSION_REQUIRED", undefined, context)
    }

    const { orgId } = await params
    const memberships = await listUserMemberships(session.userId)
    const membership = memberships.find((entry) => entry.orgId === orgId && entry.status === "active")
    if (!membership) {
      return jsonError(
        "Nu ai acces la organizatia selectata.",
        403,
        "AUTH_ROLE_FORBIDDEN",
        undefined,
        context
      )
    }

    const [ownership, pendingInvite] = await Promise.all([
      getOrganizationOwnership(orgId),
      getActiveClaimInviteForOrg(orgId),
    ])

    return jsonWithRequestContext(
      {
        orgId,
        orgName: ownership.orgName,
        role: membership.role,
        ownership,
        pendingInvite,
      },
      context
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof Error) {
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia selectata nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, context)
      }
      if (error.message === "MEMBERSHIP_USER_NOT_FOUND") {
        return jsonError(
          "Owner-ul curent nu are un utilizator valid asociat.",
          500,
          "AUTH_MEMBER_USER_MISSING",
          undefined,
          context
        )
      }
    }

    await logRouteError(context, error, {
      code: "AUTH_CLAIM_STATUS_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca starea de ownership.",
      500,
      "AUTH_CLAIM_STATUS_FAILED",
      undefined,
      context
    )
  }
}
