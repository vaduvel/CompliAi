import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { buildDashboardCorePayload } from "@/lib/server/dashboard-response"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "rezumatul dashboardului organizației active"
    )
    const baseWorkspace = await getOrgContext({ request })
    const workspace = {
      ...baseWorkspace,
      orgId: session.orgId,
      orgName: session.orgName ?? baseWorkspace.orgName,
      workspaceLabel: session.orgName ?? baseWorkspace.workspaceLabel,
      workspaceOwner: session.email,
      userRole: session.role,
    }
    const state =
      (await readFreshStateForOrg(workspace.orgId, workspace.orgName)) ??
      normalizeComplianceState(initialComplianceState)

    return NextResponse.json(await buildDashboardCorePayload(state, workspace))
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Nu am putut încărca rezumatul dashboardului.",
      500,
      "DASHBOARD_CORE_FETCH_FAILED"
    )
  }
}
