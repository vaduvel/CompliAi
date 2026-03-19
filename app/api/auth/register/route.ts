import { NextResponse } from "next/server"

import {
  createSessionToken,
  getSessionCookieOptions,
  registerUser,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { RequestValidationError, asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { shouldUseSupabaseAuth, registerSupabaseIdentity } from "@/lib/server/supabase-auth"
import { activateTrial } from "@/lib/server/plan"
import { sendOnboardingEmail } from "@/lib/server/onboarding-emails"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/auth/register")

  try {
    const body = requirePlainObject(await request.json())
    const email = asTrimmedString(body.email, 180)
    const password = asTrimmedString(body.password, 200)
    const orgName = asTrimmedString(body.orgName, 180) || ""

    if (!email || !password) {
      return jsonError("Email si parola sunt obligatorii.", 400, "AUTH_REQUIRED_FIELDS", undefined, context)
    }

    if (password.length < 8) {
      return jsonError(
        "Parola trebuie sa aiba cel putin 8 caractere.",
        400,
        "AUTH_PASSWORD_TOO_SHORT",
        undefined,
        context
      )
    }

    const user = shouldUseSupabaseAuth()
      ? await (async () => {
          const identity = await registerSupabaseIdentity(email, password)
          return registerUser(identity.email, password, orgName, {
            externalUserId: identity.id,
            authProvider: "supabase",
          })
        })()
      : await registerUser(email, password, orgName)

    await activateTrial(user.orgId)
    void sendOnboardingEmail("welcome", user.email, user.orgName || "utilizator nou")

    const token = createSessionToken({
      userId: user.id,
      orgId: user.orgId,
      email: user.email,
      orgName: user.orgName,
      role: user.role,
      membershipId: user.membershipId,
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

    const message = error instanceof Error ? error.message : "Eroare la inregistrare."
    if (
      message === "AUTH_EMAIL_ALREADY_REGISTERED" ||
      message === "Adresa de email este deja inregistrata."
    ) {
      return jsonError("Adresa de email este deja inregistrata.", 400, "AUTH_REGISTER_FAILED", undefined, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_REGISTER_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    return jsonError(message, 500, "AUTH_REGISTER_FAILED", undefined, context)
  }
}
