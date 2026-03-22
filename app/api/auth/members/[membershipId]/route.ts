import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  AuthzError,
  requireFreshRole,
  updateOrganizationMemberRole,
  type UserRole,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { eventActorFromSession, formatEventActorLabel } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ membershipId: string }> }
) {
  const requestContext = createRequestContext(request, "/api/auth/members/[membershipId]")

  try {
    const session = await requireFreshRole(
      request,
      ["owner"],
      "actualizarea rolurilor membrilor"
    )
    const actor = eventActorFromSession(session)
    const actorLabel = formatEventActorLabel(actor)
    const { membershipId } = await context.params
    const body = requirePlainObject(await request.json())
    const nextRole = parseRole(body.role)

    const member = await updateOrganizationMemberRole(session.orgId, membershipId, nextRole)

    await mutateState((current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "auth.member-role-updated",
            entityType: "system",
            entityId: membershipId,
            message: `${actorLabel} a actualizat rolul pentru ${member.email} la ${member.role}.`,
            createdAtISO: new Date().toISOString(),
            metadata: {
              email: member.email,
              role: member.role,
              orgId: member.orgId,
            },
          },
          actor
        ),
      ]),
    }))

    return jsonWithRequestContext({
      ok: true,
      member,
      message: "Rolul membrului a fost actualizat.",
    }, requestContext)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, requestContext)
    }
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, requestContext)
    }

    if (error instanceof Error) {
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return jsonError(
          "Membrul selectat nu exista in organizatia curenta.",
          404,
          "AUTH_MEMBER_NOT_FOUND",
          undefined,
          requestContext
        )
      }
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia curenta nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, requestContext)
      }
      if (error.message === "MEMBERSHIP_USER_NOT_FOUND") {
        await logRouteError(requestContext, error, {
          code: "AUTH_MEMBER_USER_MISSING",
          durationMs: getRequestDurationMs(requestContext),
          status: 500,
        })

        return jsonError(
          "Membrul selectat nu are un utilizator valid asociat.",
          500,
          "AUTH_MEMBER_USER_MISSING",
          undefined,
          requestContext
        )
      }
      if (error.message === "LAST_OWNER_REQUIRED") {
        return jsonError(
          "Nu poti elimina ultimul owner activ din organizatia curenta.",
          409,
          "AUTH_LAST_OWNER_REQUIRED",
          undefined,
          requestContext
        )
      }
    }

    await logRouteError(requestContext, error, {
      code: "AUTH_MEMBER_ROLE_UPDATE_FAILED",
      durationMs: getRequestDurationMs(requestContext),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut actualiza rolul membrului.",
      500,
      "AUTH_MEMBER_ROLE_UPDATE_FAILED",
      undefined,
      requestContext
    )
  }
}

function parseRole(value: unknown): UserRole {
  const role = asTrimmedString(value, 32)
  if (role === "owner" || role === "partner_manager" || role === "compliance" || role === "reviewer" || role === "viewer") {
    return role
  }
  throw new RequestValidationError("Rolul trimis nu este valid.", 400, "AUTH_INVALID_ROLE")
}
