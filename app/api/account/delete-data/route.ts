// POST /api/account/delete-data
// GDPR Art. 17 — Right to Erasure (workspace data)
// Resets all compliance data for the current org to initial state.
// Account itself remains — full account deletion via privacy@compliscan.ro.

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { writeState } from "@/lib/server/mvp-store"

export async function POST(request: Request) {
  try {
    const session = requireRole(request, ["owner"], "ștergerea datelor de conformitate")
    const actor = eventActorFromSession(session)

    const cleanState = normalizeComplianceState({
      ...initialComplianceState,
      events: appendComplianceEvents(initialComplianceState, [
        createComplianceEvent(
          {
            type: "state.reset",
            entityType: "system",
            entityId: "state",
            message:
              "Toate datele de conformitate au fost șterse la cererea utilizatorului (GDPR Art. 17).",
            createdAtISO: new Date().toISOString(),
          },
          actor
        ),
      ]),
    })

    await writeState(cleanState)

    return NextResponse.json({
      ok: true,
      message:
        "Toate datele de conformitate au fost șterse. Contul tău rămâne activ. Pentru ștergerea completă a contului, trimite email la privacy@compliscan.ro.",
      deletedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Ștergerea datelor a eșuat.", 500, "DATA_DELETION_FAILED")
  }
}
