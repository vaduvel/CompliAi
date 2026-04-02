import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { writeStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

const RESET_HEADER = "x-compliscan-reset-key"

function hasValidResetKey(request: Request) {
  const configuredKey = process.env.COMPLISCAN_RESET_KEY?.trim()
  const providedKey = request.headers.get(RESET_HEADER)?.trim()
  if (!providedKey) return false
  if (!configuredKey) return false
  return configuredKey === providedKey
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner"], "resetarea starii workspace-ului")
    const actor = eventActorFromSession(session)

    // UI reset is allowed for authenticated owners. The optional reset key
    // remains available only for scripted/admin flows outside the browser.
    if (request.headers.get(RESET_HEADER)?.trim() && !hasValidResetKey(request)) {
      return jsonError(
        "Cheia de reset furnizata este invalida.",
        403,
        "RESET_BLOCKED"
      )
    }

    const cleanState = normalizeComplianceState({
      ...initialComplianceState,
      events: appendComplianceEvents(initialComplianceState, [
        createComplianceEvent({
          type: "state.reset",
          entityType: "system",
          entityId: "state",
          message: "Starea CompliScan a fost resetata.",
          createdAtISO: new Date().toISOString(),
        }, actor),
      ]),
    })
    await writeStateForOrg(session.orgId, cleanState, session.orgName)
    const workspace = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      workspaceOwner: session.email,
      userRole: session.role,
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(cleanState, workspace)),
      message: "Starea a fost resetată. Metricii vor fi populați doar din scanările reale noi.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Resetarea starii a esuat.",
      500,
      "STATE_RESET_FAILED"
    )
  }
}
