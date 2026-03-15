import { NextResponse } from "next/server"

import { AuthzError, listUserMemberships, readFreshSessionFromRequest } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"

export async function GET(request: Request) {
  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({
        user: null,
        memberships: [],
        currentMembershipId: null,
        currentOrgId: null,
      })
    }

    const memberships = await listUserMemberships(session.userId)

    return NextResponse.json({
      user: {
        email: session.email,
        orgId: session.orgId,
        orgName: session.orgName,
        role: session.role,
        membershipId: session.membershipId ?? null,
      },
      memberships,
      currentMembershipId: session.membershipId ?? null,
      currentOrgId: session.orgId,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca sumarul de sesiune.",
      500,
      "AUTH_SUMMARY_FETCH_FAILED"
    )
  }
}
