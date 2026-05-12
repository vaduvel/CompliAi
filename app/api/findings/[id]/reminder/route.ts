// POST /api/findings/[id]/reminder
//
// Setează reminder pentru un finding — emit event în state.events cu
// metadata.remindAtISO calculată ca now + delayHours. Cron-ul existent
// detectează aceste events și trimite notificare la momentul potrivit
// (sau utilizatorul le vede pe /dashboard/notificari în secțiunea
// "Reverificări programate").
//
// Folosit de PatternCSkipWait pentru "Reamintește peste 24h".

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"

type ReminderBody = {
  delayHours?: number
  note?: string
}

const MAX_DELAY_HOURS = 24 * 30 // 30 zile max

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await readFreshSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { id } = await params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) return jsonError("State organizație negăsit.", 404, "NO_STATE")

    const finding = state.findings.find((f) => f.id === id)
    if (!finding) return jsonError("Finding negăsit.", 404, "FINDING_NOT_FOUND")

    const body = (await request.json().catch(() => ({}))) as ReminderBody
    const delayHours = Math.max(1, Math.min(body.delayHours ?? 24, MAX_DELAY_HOURS))
    const remindAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

    const actor = await resolveOptionalEventActor(request)
    const event = createComplianceEvent(
      {
        type: "finding.reminder_scheduled",
        entityType: "finding",
        entityId: finding.id,
        message: `Reminder programat pentru ${remindAt.toLocaleString("ro-RO")} (${delayHours}h)`,
        createdAtISO: new Date().toISOString(),
        metadata: {
          remindAtISO: remindAt.toISOString(),
          delayHours,
          findingTypeId: finding.findingTypeId ?? "",
          note: body.note ?? "",
        },
      },
      actor,
    )

    state.events = appendComplianceEvents(state, [event])
    // Și marcăm finding-ul cu nextMonitoringDateISO
    const findingIdx = state.findings.findIndex((f) => f.id === id)
    if (findingIdx >= 0) {
      state.findings[findingIdx] = {
        ...state.findings[findingIdx],
        nextMonitoringDateISO: remindAt.toISOString(),
      }
    }

    await writeStateForOrg(session.orgId, state, session.orgName)

    return NextResponse.json({
      ok: true,
      remindAtISO: remindAt.toISOString(),
      delayHours,
    })
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Eroare la setare reminder.",
      500,
      "REMINDER_FAILED",
    )
  }
}
