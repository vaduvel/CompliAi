import { NextResponse } from "next/server"

import {
  createSessionToken,
  getSessionCookieOptions,
  registerUser,
  SESSION_COOKIE,
} from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { asTrimmedString, requirePlainObject } from "@/lib/server/request-validation"
import { shouldUseSupabaseAuth, registerSupabaseIdentity } from "@/lib/server/supabase-auth"

export async function POST(request: Request) {
  try {
    const body = requirePlainObject(await request.json())
    const email = asTrimmedString(body.email, 180)
    const password = asTrimmedString(body.password, 200)
    const orgName = asTrimmedString(body.orgName, 180) || ""

    if (!email || !password) {
      return jsonError("Email si parola sunt obligatorii.", 400, "AUTH_REQUIRED_FIELDS")
    }

    if (password.length < 8) {
      return jsonError(
        "Parola trebuie sa aiba cel putin 8 caractere.",
        400,
        "AUTH_PASSWORD_TOO_SHORT"
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
      orgId: user.orgId,
      orgName: user.orgName,
      role: user.role,
    })
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "Eroare la inregistrare."
    if (message === "AUTH_EMAIL_ALREADY_REGISTERED") {
      return jsonError("Adresa de email este deja inregistrata.", 400, "AUTH_REGISTER_FAILED")
    }
    return jsonError(message, 400, "AUTH_REGISTER_FAILED")
  }
}
