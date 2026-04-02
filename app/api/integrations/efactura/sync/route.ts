import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getAnafEnvironment, getAnafMode } from "@/lib/server/efactura-anaf-client"
import { readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/integrations/efactura/sync")

  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED", undefined, context)
    }
    const nowISO = new Date().toISOString()
    const actor = await resolveOptionalEventActor(request)
    const mode = getAnafMode()
    const environment = getAnafEnvironment()

    const nextState = await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      efacturaConnected: true,
      efacturaSyncedAtISO: nowISO,
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "integration.efactura-synced",
          entityType: "integration",
          entityId: "efactura",
          message: mode === "real"
            ? "Sync e-Factura cu ANAF SPV initiat in producție."
            : mode === "test"
              ? "Sync e-Factura pornit in sandbox-ul oficial ANAF."
              : "Sync e-Factura pornit in mod local (mock).",
          createdAtISO: nowISO,
          metadata: { connected: true, mode, environment },
        }, actor),
      ]),
    }), session.orgName)
    const workspaceOverride = {
      ...(await getOrgContext()),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspaceOverride)),
      mode,
      environment,
      message: mode === "real"
        ? "Conexiunea cu ANAF SPV a fost stabilită în producție. Verifică uman înainte de depunere."
        : mode === "test"
          ? "Conexiunea cu ANAF SPV folosește sandbox-ul oficial. Trimiterile reale rămân blocate."
          : "Integrarea e-Factura a fost actualizată în modul local. Setează ANAF_CLIENT_ID și ANAF_CLIENT_SECRET pentru sandbox-ul ANAF.",
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
