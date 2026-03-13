import { NextResponse } from "next/server"

import { AuthzError, requireRole, listOrganizationMembers } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"

export async function GET(request: Request) {
  try {
    const session = requireRole(request, ["owner", "compliance"], "vizualizarea membrilor organizatiei")
    const members = await listOrganizationMembers(session.orgId)

    return NextResponse.json({
      members,
      orgId: session.orgId,
      orgName: session.orgName,
      actorRole: session.role,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut incarca membrii organizatiei.",
      500,
      "AUTH_MEMBERS_FETCH_FAILED"
    )
  }
}
