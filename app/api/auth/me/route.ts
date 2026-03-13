import { NextResponse } from "next/server"

import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return NextResponse.json({ user: null })

    return NextResponse.json({
      user: {
        email: session.email,
        orgId: session.orgId,
        orgName: session.orgName,
        role: session.role,
        membershipId: session.membershipId ?? null,
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, { user: null })
    }
    const message = error instanceof Error ? error.message : "Sesiunea nu poate fi verificata."
    return jsonError(message, 500, "AUTH_SESSION_FAILED", { user: null })
  }
}
