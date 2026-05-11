// S2.3 — DSAR CRUD: GET list + POST create
import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { createDsar, readDsarState, updateDsar } from "@/lib/server/dsar-store"
import { generateDsarDraft, generateDsarProcessPack } from "@/lib/compliance/dsar-drafts"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { WRITE_ROLES } from "@/lib/server/rbac"
import type { DsarRequestType } from "@/lib/server/dsar-store"

const VALID_TYPES: DsarRequestType[] = [
  "access", "rectification", "erasure", "portability", "objection", "restriction",
]

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "vizualizarea cererilor DSAR")
    const state = await readDsarState(session.orgId)
    return NextResponse.json({
      requests: state.requests,
      processPack: generateDsarProcessPack({ orgName: session.orgName || session.orgId }),
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut încărca cererile DSAR.", 500, "DSAR_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, WRITE_ROLES, "crearea unei cereri DSAR")
    const body = await request.json()

    const { requesterName, requesterEmail, requestType, receivedAtISO, notes } = body
    if (!requesterName?.trim()) return jsonError("Numele solicitantului este obligatoriu.", 400, "MISSING_FIELD")
    if (!requesterEmail?.trim()) return jsonError("Email-ul solicitantului este obligatoriu.", 400, "MISSING_FIELD")
    if (!VALID_TYPES.includes(requestType)) return jsonError("Tip cerere invalid.", 400, "INVALID_TYPE")

    const requestedReceivedAtISO = typeof receivedAtISO === "string" && receivedAtISO.trim()
      ? receivedAtISO.trim()
      : new Date().toISOString()
    const existingState = await readDsarState(session.orgId)
    const duplicate = existingState.requests.find(
      (request) =>
        request.requesterEmail.trim().toLowerCase() === requesterEmail.trim().toLowerCase() &&
        request.requestType === requestType &&
        isDuplicateWindow(request.receivedAtISO, requestedReceivedAtISO)
    )

    if (duplicate) {
      const draft = generateDsarDraft({
        requestType: duplicate.requestType,
        requesterName: duplicate.requesterName,
        orgName: session.orgName || session.orgId,
      })

      return NextResponse.json({
        request: duplicate,
        draft,
        deduplicated: true,
        message: "Cererea DSAR există deja în registru pentru această fereastră de timp.",
      })
    }

    const dsar = await createDsar(session.orgId, {
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      requestType,
      receivedAtISO: requestedReceivedAtISO,
      notes,
    })

    // A1 — Auto-generate draft on creation
    const draft = generateDsarDraft({
      requestType: dsar.requestType,
      requesterName: dsar.requesterName,
      orgName: session.orgName || session.orgId,
    })
    const updatedDsar = await updateDsar(session.orgId, dsar.id, { draftResponseGenerated: true })
    const eventDsar = updatedDsar ?? dsar

    await mutateFreshStateForOrg(
      session.orgId,
      (state) => ({
        ...state,
        events: appendComplianceEvents(state, [
          createComplianceEvent(
            {
              type: "dsar.created",
              entityType: "system",
              entityId: eventDsar.id,
              message: `DSAR înregistrat: ${eventDsar.requesterName} · termen ${new Date(eventDsar.deadlineISO).toLocaleDateString("ro-RO")}`,
              createdAtISO: new Date().toISOString(),
              metadata: {
                requestType: eventDsar.requestType,
                deadlineISO: eventDsar.deadlineISO,
              },
            },
            {
              id: session.userId,
              label: session.email,
              role: session.role,
              source: "session",
            }
          ),
        ]),
      }),
      session.orgName
    ).catch(() => null)

    return NextResponse.json({ request: updatedDsar ?? dsar, draft }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut crea cererea DSAR.", 500, "DSAR_CREATE_FAILED")
  }
}

function isDuplicateWindow(leftISO: string, rightISO: string) {
  const left = new Date(leftISO).getTime()
  const right = new Date(rightISO).getTime()
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false
  return Math.abs(left - right) <= 5 * 60 * 1000
}
