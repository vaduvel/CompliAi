import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const actor = await resolveOptionalEventActor(request)

  const nextState = await mutateState((current) => ({
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
  }))

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message:
      "Alerta a fost marcată ca rezolvată. Rămâne o recomandare AI, verifică uman.",
  })
}
