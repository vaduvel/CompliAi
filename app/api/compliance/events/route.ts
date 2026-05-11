// Endpoint pentru log de events ad-hoc din UI client-side.
// Folosit pentru audit log per acțiuni critice (ex: GAP #2 — auto-repair UX
// disclaimer + click apply per fix CECCAR).
//
// Pattern: client trimite event payload, server-side rulează prin
// appendComplianceEvents (util existent) ca să adauge hash chain integrity.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"

// Valid entity types per ComplianceEvent type definition (lib/compliance/types.ts)
const VALID_ENTITY_TYPES = new Set([
  "scan",
  "finding",
  "alert",
  "task",
  "integration",
  "system",
  "drift",
])

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "log audit event",
    )

    const body = (await request.json()) as {
      type?: string
      entityType?: string
      entityId?: string
      message?: string
      // ComplianceEvent.metadata accepts only primitives — client-side trebuie
      // să flatten complex objects (ex: arrays → JSON string).
      metadata?: Record<string, string | number | boolean>
    }

    if (!body.type || typeof body.type !== "string") {
      return jsonError("Câmpul 'type' este obligatoriu.", 400, "INVALID_TYPE")
    }
    if (
      !body.entityType ||
      !VALID_ENTITY_TYPES.has(body.entityType)
    ) {
      return jsonError(
        "Câmpul 'entityType' invalid. Valori acceptate: " +
          Array.from(VALID_ENTITY_TYPES).join(", "),
        400,
        "INVALID_ENTITY_TYPE",
      )
    }
    if (!body.entityId || typeof body.entityId !== "string") {
      return jsonError("Câmpul 'entityId' este obligatoriu.", 400, "INVALID_ENTITY_ID")
    }
    if (!body.message || typeof body.message !== "string") {
      return jsonError("Câmpul 'message' este obligatoriu.", 400, "INVALID_MESSAGE")
    }

    const actor = await resolveOptionalEventActor(request)
    const nowISO = new Date().toISOString()

    await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      events: appendComplianceEvents(current, [
        createComplianceEvent(
          {
            type: body.type as string,
            entityType: body.entityType as
              | "scan"
              | "finding"
              | "alert"
              | "task"
              | "integration"
              | "system"
              | "drift",
            entityId: body.entityId as string,
            message: body.message as string,
            createdAtISO: nowISO,
            ...(body.metadata && typeof body.metadata === "object"
              ? { metadata: body.metadata }
              : {}),
          },
          actor,
        ),
      ]),
    }))

    return NextResponse.json({ ok: true, loggedAtISO: nowISO })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la salvarea evenimentului.", 500, "EVENT_LOG_FAILED")
  }
}
