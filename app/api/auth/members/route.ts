import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  addOrganizationMemberByEmail,
  AuthzError,
  listOrganizationMembers,
  requireFreshRole,
  type UserRole,
} from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { eventActorFromSession, formatEventActorLabel } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/auth/members")

  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "vizualizarea membrilor organizatiei"
    )
    const members = await listOrganizationMembers(session.orgId)

    return jsonWithRequestContext({
      members,
      orgId: session.orgId,
      orgName: session.orgName,
      actorRole: session.role,
    }, context)
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_MEMBERS_FETCH_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca membrii organizatiei.",
      500,
      "AUTH_MEMBERS_FETCH_FAILED",
      undefined,
      context
    )
  }
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/members")

  try {
    const session = await requireFreshRole(request, ["owner"], "adaugarea membrilor in organizatie")
    const actor = eventActorFromSession(session)
    const actorLabel = formatEventActorLabel(actor)
    const body = requirePlainObject(await request.json())
    const email = parseEmail(body.email)
    const role = parseRole(body.role)

    const member = await addOrganizationMemberByEmail(session.orgId, email, role)

    await mutateState((current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: "auth.member-added",
            entityType: "system",
            entityId: member.membershipId,
            message: `${actorLabel} a adaugat ${member.email} in organizatie ca ${member.role}.`,
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

    return jsonWithRequestContext(
      {
        ok: true,
        member,
        message: "Membrul a fost adaugat in organizatia curenta.",
      },
      context,
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    if (error instanceof Error) {
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia curenta nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, context)
      }
      if (error.message === "USER_NOT_FOUND") {
        return jsonError(
          "Utilizatorul nu exista in workspace. Adauga doar utilizatori care au deja cont local.",
          404,
          "AUTH_MEMBER_USER_NOT_FOUND",
          undefined,
          context
        )
      }
      if (error.message === "MEMBER_ALREADY_EXISTS") {
        return jsonError(
          "Utilizatorul exista deja in organizatia curenta.",
          409,
          "AUTH_MEMBER_ALREADY_EXISTS",
          undefined,
          context
        )
      }
      if (error.message === "USER_NOT_SYNCABLE") {
        return jsonError(
          "Utilizatorul exista doar local si nu poate fi adaugat in acest mod cloud-first.",
          409,
          "AUTH_MEMBER_NOT_SYNCABLE",
          undefined,
          context
        )
      }
    }

    await logRouteError(context, error, {
      code: "AUTH_MEMBER_ADD_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut adauga membrul in organizatie.",
      500,
      "AUTH_MEMBER_ADD_FAILED",
      undefined,
      context
    )
  }
}

function parseEmail(value: unknown) {
  const rawEmail = asTrimmedString(value, 320)
  if (!rawEmail) {
    throw new RequestValidationError("Adresa de email trimisa nu este valida.", 400, "AUTH_INVALID_EMAIL")
  }
  const email = rawEmail.toLowerCase()
  if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    throw new RequestValidationError("Adresa de email trimisa nu este valida.", 400, "AUTH_INVALID_EMAIL")
  }
  return email
}

function parseRole(value: unknown): UserRole {
  const role = asTrimmedString(value, 32)
  if (role === "owner" || role === "partner_manager" || role === "compliance" || role === "reviewer" || role === "viewer") {
    return role
  }
  throw new RequestValidationError("Rolul trimis nu este valid.", 400, "AUTH_INVALID_ROLE")
}
