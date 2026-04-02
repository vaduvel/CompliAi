import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { createClaimInvite } from "@/lib/server/claim-ownership"
import {
  AuthzError,
  getOrganizationOwnership,
  requireFreshRole,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { eventActorFromSession, formatEventActorLabel } from "@/lib/server/event-actor"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

function parseEmail(value: unknown) {
  const rawEmail = asTrimmedString(value, 320)
  if (!rawEmail) {
    throw new Error("AUTH_INVALID_EMAIL")
  }

  const email = rawEmail.toLowerCase()
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    throw new Error("AUTH_INVALID_EMAIL")
  }

  return email
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/claim-invite")

  try {
    const session = await requireFreshRole(
      request,
      ["partner_manager"],
      "trimiterea invitatiei de claim"
    )
    const ownership = await getOrganizationOwnership(session.orgId)
    if (ownership.ownerState === "claimed") {
      return jsonError(
        "Organizatia are deja un owner real. Claim-ul nu mai este necesar.",
        409,
        "CLAIM_ALREADY_OWNED",
        undefined,
        context
      )
    }

    const body = requirePlainObject(await request.json())
    const invitedEmail = parseEmail(body.email)
    const invite = await createClaimInvite({
      orgId: session.orgId,
      orgName: session.orgName,
      invitedEmail,
      invitedByUserId: session.userId,
    })

    const actor = eventActorFromSession(session)
    const actorLabel = formatEventActorLabel(actor)
    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "auth.claim-invite-created",
            entityType: "system",
            entityId: invite.id,
            message: `${actorLabel} a pregatit claim-ul de ownership pentru ${invitedEmail}.`,
            createdAtISO: new Date().toISOString(),
            metadata: {
              orgId: session.orgId,
              invitedEmail,
              expiresAtISO: invite.expiresAtISO,
            },
          },
          actor
        ),
      ]),
    }), session.orgName)

    return jsonWithRequestContext(
      {
        ok: true,
        invite,
        message: "Invitatia de claim a fost generata si poate fi trimisa clientului.",
      },
      context,
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof Error) {
      if (error.message === "AUTH_INVALID_EMAIL") {
        return jsonError("Adresa de email trimisa nu este valida.", 400, "AUTH_INVALID_EMAIL", undefined, context)
      }
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia curenta nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, context)
      }
      if (error.message === "MEMBERSHIP_USER_NOT_FOUND") {
        return jsonError(
          "Organizatia curenta nu are un owner valid asociat.",
          500,
          "AUTH_MEMBER_USER_MISSING",
          undefined,
          context
        )
      }
    }

    await logRouteError(context, error, {
      code: "AUTH_CLAIM_INVITE_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut genera invitatia de claim.",
      500,
      "AUTH_CLAIM_INVITE_FAILED",
      undefined,
      context
    )
  }
}
