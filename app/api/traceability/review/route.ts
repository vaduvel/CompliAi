import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState, readState } from "@/lib/server/mvp-store"

type TraceabilityReviewPayload = {
  scope?: "record" | "law_reference" | "family"
  traceId?: string
  lawReference?: string
  familyKey?: string
  action?: "confirm" | "clear"
  note?: string | null
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TraceabilityReviewPayload
  const scope =
    body.scope ?? (body.familyKey?.trim() ? "family" : body.lawReference?.trim() ? "law_reference" : "record")

  if (scope === "record" && !body.traceId?.trim()) {
    return NextResponse.json({ error: "Trace ID este obligatoriu." }, { status: 400 })
  }

  if (scope === "law_reference" && !body.lawReference?.trim()) {
    return NextResponse.json({ error: "Referința legală este obligatorie." }, { status: 400 })
  }

  if (scope === "family" && !body.familyKey?.trim()) {
    return NextResponse.json({ error: "Familia de controale este obligatorie." }, { status: 400 })
  }

  const action = body.action ?? "confirm"
  const note = typeof body.note === "string" ? body.note.trim() || null : null
  const nowISO = new Date().toISOString()
  const traceIds =
    scope === "record"
      ? [body.traceId!.trim()]
      : scope === "law_reference"
        ? await resolveTraceIdsForLawReference(body.lawReference!.trim())
        : await resolveTraceIdsForFamily(body.familyKey!.trim())

  if (traceIds.length === 0) {
    return NextResponse.json(
      { error: "Nu am găsit controale legate de această referință legală." },
      { status: 404 }
    )
  }

  const nextState = await mutateState((current) => {
    const traceabilityReviews = {
      ...(current.traceabilityReviews ?? {}),
    }

    if (action === "clear") {
      for (const traceId of traceIds) delete traceabilityReviews[traceId]
    } else {
      for (const traceId of traceIds) {
        traceabilityReviews[traceId] = {
          confirmedByUser: true,
          note,
          updatedAtISO: nowISO,
        }
      }
    }

    const entityId =
      scope === "law_reference"
        ? body.lawReference!.trim()
        : scope === "family"
          ? body.familyKey!.trim()
          : body.traceId!.trim()
    const message =
      scope === "law_reference"
        ? action === "clear"
          ? `Confirmarea pentru grupul ${body.lawReference} a fost eliminată pentru ${traceIds.length} controale.`
          : `Grupul ${body.lawReference} a fost confirmat pentru audit (${traceIds.length} controale).`
        : scope === "family"
          ? action === "clear"
            ? `Confirmarea pentru familia ${body.familyKey} a fost eliminată pentru ${traceIds.length} controale.`
            : `Familia ${body.familyKey} a fost confirmată pentru audit (${traceIds.length} controale).`
        : action === "clear"
          ? `Confirmarea pentru controlul ${body.traceId} a fost eliminată.`
          : `Controlul ${body.traceId} a fost confirmat pentru audit.`

    return {
      ...current,
      traceabilityReviews,
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: action === "clear" ? "trace.review-cleared" : "trace.review-confirmed",
          entityType: "system",
          entityId,
          message,
          createdAtISO: nowISO,
          metadata: {
            scope,
            traceId: body.traceId?.trim() ?? "",
            lawReference: body.lawReference?.trim() ?? "",
            familyKey: body.familyKey?.trim() ?? "",
            affectedControls: traceIds.length,
            hasNote: Boolean(note),
          },
        }),
      ]),
    }
  })

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    message:
      scope === "law_reference"
        ? action === "clear"
          ? `Confirmarea a fost eliminată pentru ${traceIds.length} controale din grupul ${body.lawReference}.`
          : `Au fost confirmate ${traceIds.length} controale pentru articolul ${body.lawReference}.`
        : scope === "family"
          ? action === "clear"
            ? `Confirmarea a fost eliminată pentru ${traceIds.length} controale din familia ${body.familyKey}.`
            : `Au fost confirmate ${traceIds.length} controale pentru familia ${body.familyKey}.`
        : action === "clear"
          ? "Confirmarea controlului a fost eliminată."
          : "Controlul a fost confirmat pentru audit.",
  })
}

async function resolveTraceIdsForLawReference(lawReference: string) {
  const current = await readState()
  const payload = await buildDashboardPayload(current)

  return payload.traceabilityMatrix
    .filter((record) => record.lawReferences.includes(lawReference))
    .map((record) => record.id)
}

async function resolveTraceIdsForFamily(familyKey: string) {
  const current = await readState()
  const payload = await buildDashboardPayload(current)

  return payload.traceabilityMatrix
    .filter((record) => record.controlFamily.key === familyKey)
    .map((record) => record.id)
}
