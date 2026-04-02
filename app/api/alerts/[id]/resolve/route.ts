import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { jsonError } from "@/lib/server/api-response"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "rezolvarea alertelor"
    )
    const actor = await resolveOptionalEventActor(request)

    const nextState = await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      alerts: current.alerts.map((alert) =>
        alert.id === id ? { ...alert, open: false } : alert
      ),
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "alert.resolved",
          entityType: "alert",
          entityId: id,
          message: `Alerta a fost marcata ca rezolvata: ${id}.`,
          createdAtISO: new Date().toISOString(),
        }, actor),
      ]),
    }), session.orgName)

    const workspace = {
      ...(await getOrgContext()),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      message:
        "Alerta a fost marcată ca rezolvată. Rămâne o recomandare AI, verifică uman.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Alerta nu a putut fi actualizată.",
      500,
      "ALERT_RESOLVE_FAILED"
    )
  }
}
