import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"

export async function POST() {
  const nowISO = new Date().toISOString()
  const nextState = await mutateState((current) => ({
    ...current,
    efacturaConnected: true,
    efacturaSyncedAtISO: nowISO,
    events: appendComplianceEvents(current, [
      createComplianceEvent({
        type: "integration.efactura-synced",
        entityType: "integration",
        entityId: "efactura",
        message: "Sync e-Factura pornit in mod demo.",
        createdAtISO: nowISO,
        metadata: { connected: true },
      }),
    ]),
  }))

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message:
      "Integrarea e-Factura a fost actualizată (simulare MVP). Verifică uman datele înainte de depunere oficială.",
  })
}
