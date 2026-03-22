import { NextResponse } from "next/server"

import { AuthzError, getUserMode, readFreshSessionFromRequest } from "@/lib/server/auth"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/auth/me")

  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return NextResponse.json({ user: null }, withRequestIdHeaders(undefined, context))

    const userMode = await getUserMode(session.userId)

    return NextResponse.json(
      {
        user: {
          email: session.email,
          orgId: session.orgId,
          orgName: session.orgName,
          role: session.role,
          membershipId: session.membershipId ?? null,
          userMode: userMode ?? null,
        },
      },
      withRequestIdHeaders(undefined, context)
    )
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, { user: null }, context)
    }

    await logRouteError(context, error, {
      code: "AUTH_SESSION_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })

    const message = error instanceof Error ? error.message : "Sesiunea nu poate fi verificata."
    return jsonError(message, 500, "AUTH_SESSION_FAILED", { user: null }, context)
  }
}
