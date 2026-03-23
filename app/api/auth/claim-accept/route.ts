import { createSessionToken, getSessionCookieOptions, readFreshSessionFromRequest, SESSION_COOKIE } from "@/lib/server/auth"
import { acceptClaimInvite, getClaimInviteByToken } from "@/lib/server/claim-ownership"
import { claimOrganizationOwnership } from "@/lib/server/auth"
import { jsonError, jsonWithRequestContext } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/claim-accept")

  try {
    const body = requirePlainObject(await request.json())
    const token = asTrimmedString(body.token, 200)
    const password = asTrimmedString(body.password, 200) || undefined

    if (!token) {
      return jsonError("Tokenul de claim este obligatoriu.", 400, "CLAIM_TOKEN_REQUIRED", undefined, context)
    }

    const invite = await getClaimInviteByToken(token)
    if (!invite) {
      return jsonError("Invitatia de claim nu exista.", 404, "CLAIM_INVITE_NOT_FOUND", undefined, context)
    }
    if (invite.status === "expired") {
      return jsonError("Invitatia de claim a expirat.", 410, "CLAIM_INVITE_EXPIRED", undefined, context)
    }
    if (invite.status === "accepted") {
      return jsonError("Invitatia de claim a fost deja folosita.", 409, "CLAIM_INVITE_USED", undefined, context)
    }
    if (invite.status === "revoked") {
      return jsonError("Invitatia de claim nu mai este activa.", 409, "CLAIM_INVITE_REVOKED", undefined, context)
    }

    const session = await readFreshSessionFromRequest(request)
    if (session && session.email.toLowerCase() !== invite.invitedEmail.toLowerCase()) {
      return jsonError(
        "Sesiunea curenta nu corespunde cu emailul invitat pentru claim.",
        403,
        "CLAIM_EMAIL_MISMATCH",
        undefined,
        context
      )
    }

    const claimedUser = await claimOrganizationOwnership(invite.orgId, invite.invitedEmail, {
      currentUserId: session?.userId,
      password,
    })
    await acceptClaimInvite(token, claimedUser.id)

    const nextToken = createSessionToken({
      userId: claimedUser.id,
      orgId: claimedUser.orgId,
      email: claimedUser.email,
      orgName: claimedUser.orgName,
      role: claimedUser.role,
      membershipId: claimedUser.membershipId,
      workspaceMode: "org",
    })

    const response = jsonWithRequestContext(
      {
        ok: true,
        orgId: claimedUser.orgId,
        orgName: claimedUser.orgName,
        role: claimedUser.role,
        message: "Ownership-ul a fost revendicat cu succes.",
      },
      context
    )
    response.cookies.set(SESSION_COOKIE, nextToken, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ORGANIZATION_NOT_FOUND") {
        return jsonError("Organizatia selectata nu exista.", 404, "AUTH_ORG_NOT_FOUND", undefined, context)
      }
      if (error.message === "OWNER_ALREADY_CLAIMED") {
        return jsonError(
          "Organizatia are deja un owner activ. Claim-ul nu mai poate fi procesat.",
          409,
          "CLAIM_ALREADY_OWNED",
          undefined,
          context
        )
      }
      if (error.message === "CLAIM_LOGIN_REQUIRED") {
        return jsonError(
          "Pentru acest email exista deja un cont. Autentifica-te inainte sa accepti claim-ul.",
          401,
          "CLAIM_LOGIN_REQUIRED",
          undefined,
          context
        )
      }
      if (error.message === "CLAIM_EMAIL_MISMATCH") {
        return jsonError(
          "Sesiunea curenta nu corespunde cu emailul invitat pentru claim.",
          403,
          "CLAIM_EMAIL_MISMATCH",
          undefined,
          context
        )
      }
      if (error.message === "CLAIM_PASSWORD_REQUIRED") {
        return jsonError(
          "Pentru a revendica organizatia trebuie sa alegi o parola de cel putin 8 caractere.",
          400,
          "CLAIM_PASSWORD_REQUIRED",
          undefined,
          context
        )
      }
      if (error.message === "USER_NOT_SYNCABLE") {
        return jsonError(
          "Contul invitat nu poate fi revendicat prin acest flow cloud-first.",
          409,
          "CLAIM_USER_NOT_SYNCABLE",
          undefined,
          context
        )
      }
    }

    await logRouteError(context, error, {
      code: "AUTH_CLAIM_ACCEPT_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut accepta claim-ul.",
      500,
      "AUTH_CLAIM_ACCEPT_FAILED",
      undefined,
      context
    )
  }
}
