import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"

export async function POST(request: Request) {
  const nowISO = new Date().toISOString()
  const actor = await resolveOptionalEventActor(request)
  const nextState = await mutateState((current) => ({
    ...current,
    efacturaConnected: true,
    efacturaSyncedAtISO: nowISO,
    events: appendComplianceEvents(current, [
      createComplianceEvent({
        type: "integration.efactura-synced",
        entityType: "integration",
        entityId: "efactura",
        message: "Sync e-Factura pornit in mod local.",
        createdAtISO: nowISO,
        metadata: { connected: true },
      }, actor),
    ]),
  }))

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message:
      "Integrarea e-Factura a fost actualizata in modul local de lucru. Verifica uman datele inainte de depunere oficiala.",
  })
}
