import { NextResponse } from "next/server"

import {
  AuthzError,
  createSessionToken,
  getSessionCookieOptions,
  requireFreshAuthenticatedSession,
  resolveUserForMembership,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "schimbarea organizatiei active"
    )
    const body = requirePlainObject(await request.json())
    const membershipId = asTrimmedString(body.membershipId, 120)
    if (!membershipId) {
      throw new RequestValidationError(
        "Membership-ul selectat este obligatoriu.",
        400,
        "AUTH_MEMBERSHIP_REQUIRED"
      )
    }

    const user = await resolveUserForMembership(session.userId, membershipId)
    const token = createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      orgName: user.orgName,
      role: user.role,
      membershipId: user.membershipId,
    })

    const response = NextResponse.json({
      ok: true,
      membershipId: user.membershipId,
      orgId: user.orgId,
      orgName: user.orgName,
      role: user.role,
      message: `Organizatia activa a fost schimbata la ${user.orgName}.`,
    })
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code)
    }

    if (error instanceof Error) {
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return jsonError(
          "Organizatia selectata nu este disponibila pentru utilizatorul curent.",
          404,
          "AUTH_MEMBERSHIP_NOT_FOUND"
        )
      }
      if (error.message === "USER_NOT_FOUND") {
        return jsonError("Utilizatorul curent nu exista.", 404, "AUTH_USER_NOT_FOUND")
      }
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia selectata nu exista.", 404, "AUTH_ORG_NOT_FOUND")
      }
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut schimba organizatia activa.",
      500,
      "AUTH_SWITCH_ORG_FAILED"
    )
  }
}
