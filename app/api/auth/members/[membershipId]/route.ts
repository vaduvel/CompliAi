import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  AuthzError,
  requireFreshRole,
  updateOrganizationMemberRole,
  type UserRole,
} from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { eventActorFromSession, formatEventActorLabel } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ membershipId: string }> }
) {
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

    return NextResponse.json({
      ok: true,
      member,
      message: "Rolul membrului a fost actualizat.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error) {
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return jsonError("Membrul selectat nu exista in organizatia curenta.", 404, "AUTH_MEMBER_NOT_FOUND")
      }
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia curenta nu exista.", 404, "AUTH_ORG_NOT_FOUND")
      }
      if (error.message === "MEMBERSHIP_USER_NOT_FOUND") {
        return jsonError("Membrul selectat nu are un utilizator valid asociat.", 500, "AUTH_MEMBER_USER_MISSING")
      }
      if (error.message === "LAST_OWNER_REQUIRED") {
        return jsonError(
          "Nu poti elimina ultimul owner activ din organizatia curenta.",
          409,
          "AUTH_LAST_OWNER_REQUIRED"
        )
      }
      return jsonError(error.message, 500, "AUTH_MEMBER_ROLE_UPDATE_FAILED")
    }

    return jsonError("Nu am putut actualiza rolul membrului.", 500, "AUTH_MEMBER_ROLE_UPDATE_FAILED")
  }
}

function parseRole(value: unknown): UserRole {
  const role = asTrimmedString(value, 32)
  if (role === "owner" || role === "compliance" || role === "reviewer" || role === "viewer") {
    return role
  }
  throw new RequestValidationError("Rolul trimis nu este valid.", 400, "AUTH_INVALID_ROLE")
}
