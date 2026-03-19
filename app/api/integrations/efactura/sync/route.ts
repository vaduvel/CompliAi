import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"
import { getAnafMode } from "@/lib/server/efactura-anaf-client"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/integrations/efactura/sync")

  try {
    const nowISO = new Date().toISOString()
    const actor = await resolveOptionalEventActor(request)
    const mode = getAnafMode()

    const nextState = await mutateState((current) => ({
      ...current,
      efacturaConnected: true,
      efacturaSyncedAtISO: nowISO,
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "integration.efactura-synced",
          entityType: "integration",
          entityId: "efactura",
          message: mode === "real"
            ? "Sync e-Factura cu ANAF SPV initiat."
            : "Sync e-Factura pornit in mod local (mock).",
          createdAtISO: nowISO,
          metadata: { connected: true, mode },
        }, actor),
      ]),
    }))

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      mode,
      message: mode === "real"
        ? "Conexiunea cu ANAF SPV a fost stabilita. Verifica uman inainte de depunere."
        : "Integrarea e-Factura a fost actualizata in modul local. Seteaza ANAF_CLIENT_ID si ANAF_CLIENT_SECRET pentru modul real.",
    }, withRequestIdHeaders(undefined, context))
  } catch (error) {
    await logRouteError(context, error, {
      code: "EFACTURA_SYNC_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError("Nu am putut porni sync-ul e-Factura.", 500, "EFACTURA_SYNC_FAILED", undefined, context)
  }
}
