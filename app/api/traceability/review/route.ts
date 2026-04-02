import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

type TraceabilityReviewPayload = {
  scope?: "record" | "law_reference" | "family"
  traceId?: string
  lawReference?: string
  familyKey?: string
  action?: "confirm" | "clear"
  note?: string | null
}

class TraceabilityReviewError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function POST(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "revizuirea traceability pentru audit"
    )
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
    const actor = await resolveOptionalEventActor(request)
    let affectedControls = 0
    const workspace = {
      ...(await getOrgContext()),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    const nextState = await mutateStateForOrg(session.orgId, async (current) => {
      const payload = await buildDashboardPayload(current, workspace)
      const traceIds = resolveTraceIds(payload.traceabilityMatrix, scope, body)

      if (traceIds.length === 0) {
        throw new TraceabilityReviewError(
          404,
          scope === "family"
            ? "Nu am găsit controale legate de această familie."
            : scope === "law_reference"
              ? "Nu am găsit controale legate de această referință legală."
              : "Nu am găsit controlul cerut în traceability matrix."
        )
      }

      if (action === "confirm") {
        const selectedRecords = payload.traceabilityMatrix.filter((record) => traceIds.includes(record.id))
        const blockedRecords = selectedRecords.filter((record) => !isRecordAuditConfirmable(record))
        if (blockedRecords.length > 0) {
          const sampleTitles = blockedRecords
            .slice(0, 2)
            .map((record) => record.title)
            .join(" · ")
          const suffix =
            blockedRecords.length > 2
              ? ` și încă ${blockedRecords.length - 2} controale`
              : ""
          throw new TraceabilityReviewError(
            409,
            `Nu poți confirma pentru audit controale care încă au dovadă slabă sau validare nefinalizată. Verifică întâi: ${sampleTitles}${suffix}.`
          )
        }
      }

      affectedControls = traceIds.length
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
          createComplianceEvent(
            {
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
            },
            actor
          ),
        ]),
      }
    }, session.orgName)

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      message:
        scope === "law_reference"
          ? action === "clear"
            ? `Confirmarea a fost eliminată pentru ${affectedControls} controale din grupul ${body.lawReference}.`
            : `Au fost confirmate ${affectedControls} controale pentru articolul ${body.lawReference}.`
          : scope === "family"
            ? action === "clear"
              ? `Confirmarea a fost eliminată pentru ${affectedControls} controale din familia ${body.familyKey}.`
              : `Au fost confirmate ${affectedControls} controale pentru familia ${body.familyKey}.`
          : action === "clear"
            ? "Confirmarea controlului a fost eliminată."
            : "Controlul a fost confirmat pentru audit.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error instanceof TraceabilityReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }
}

function isRecordAuditConfirmable(record: ComplianceTraceRecord) {
  return record.auditDecision ? record.auditDecision === "pass" : record.traceStatus === "validated"
}

function resolveTraceIds(
  traceabilityMatrix: ComplianceTraceRecord[],
  scope: "record" | "law_reference" | "family",
  body: TraceabilityReviewPayload
) {
  if (scope === "record") return [body.traceId!.trim()]

  if (scope === "law_reference") {
    return traceabilityMatrix
      .filter((record) => record.lawReferences.includes(body.lawReference!.trim()))
      .map((record) => record.id)
  }

  return traceabilityMatrix
    .filter((record) => record.controlFamily.key === body.familyKey!.trim())
    .map((record) => record.id)
}
