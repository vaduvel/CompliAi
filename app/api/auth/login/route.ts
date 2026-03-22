import { NextResponse } from "next/server"

import {
  createSessionToken,
  findUserById,
  findUserByEmail,
  getSessionCookieOptions,
  linkUserToExternalIdentity,
  hashPassword,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { shouldUseSupabaseAuth, signInSupabaseIdentity } from "@/lib/server/supabase-auth"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/login")

  try {
    const body = requirePlainObject(await request.json())
    const email = asTrimmedString(body.email, 180)
    const password = asTrimmedString(body.password, 200)

    if (!email || !password) {
      return jsonError("Email si parola sunt obligatorii.", 400, "AUTH_REQUIRED_FIELDS", undefined, context)
    }

    const localUser = await findUserByEmail(email)
    let user = localUser

    if (shouldUseSupabaseAuth(localUser?.authProvider)) {
      try {
        const identity = await signInSupabaseIdentity(email, password)
        user =
          (await findUserById(identity.id)) ||
          (await linkUserToExternalIdentity(identity.email, identity.id, "supabase"))
      } catch (error) {
        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
          return jsonError(
            "Identitatea exista, dar nu este mapata inca la o organizatie CompliScan.",
            403,
            "AUTH_IDENTITY_NOT_MAPPED",
            undefined,
            context
          )
        }
        if (!localUser || localUser.authProvider === "supabase") {
          if (error instanceof Error && error.message === "AUTH_INVALID_CREDENTIALS") {
            return jsonError("Email sau parola incorecta.", 401, "AUTH_INVALID_CREDENTIALS", undefined, context)
          }
          throw error
        }
      }
    }

    if (!user || (user.authProvider !== "supabase" && hashPassword(password, user.salt) !== user.passwordHash)) {
      return jsonError("Email sau parola incorecta.", 401, "AUTH_INVALID_CREDENTIALS", undefined, context)
    }

    const token = createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      orgName: user.orgName,
      role: user.role,
      membershipId: user.membershipId,
      workspaceMode: "org",
    })

    const response = NextResponse.json(
      {
        ok: true,
        orgId: user.orgId,
        orgName: user.orgName,
        role: user.role,
      },
      withRequestIdHeaders(undefined, context)
    )
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    return response
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }

    const message =
      error instanceof Error ? error.message : "Autentificarea nu a putut fi pornita."
    await logRouteError(context, error, {
      code: "AUTH_LOGIN_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(message, 500, "AUTH_LOGIN_FAILED", undefined, context)
  }
}
