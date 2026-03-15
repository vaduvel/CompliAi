import { NextResponse } from "next/server"

import {
  AuthzError,
  listUserMemberships,
  requireFreshAuthenticatedSession,
} from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "vizualizarea organizatiilor disponibile"
    )
    const memberships = await listUserMemberships(session.userId)

    return NextResponse.json({
      memberships,
      currentMembershipId: session.membershipId ?? null,
      currentOrgId: session.orgId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca organizatiile disponibile.",
      500,
      "AUTH_MEMBERSHIPS_FETCH_FAILED"
    )
  }
}
