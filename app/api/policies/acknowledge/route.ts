import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { writePolicyAcknowledgment } from "@/lib/server/policy-store"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { mutateStateForOrg } from "@/lib/server/mvp-store"

async function readJsonBody<T>(request: Request): Promise<T> {
  const rawBody = await request.text()
  return rawBody ? (JSON.parse(rawBody) as T) : ({} as T)
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance"], "confirmarea politicilor")
    const orgId = session.orgId
    const userEmail = session.email

    const body = await readJsonBody<{ policyId?: string }>(request)
    const { policyId } = body
    if (!policyId || typeof policyId !== "string") {
      return jsonError("policyId lipsa.", 400, "POLICY_ID_REQUIRED")
    }

    const acknowledgments = await writePolicyAcknowledgment(orgId, policyId, userEmail)

    const actor = eventActorFromSession(session)
    await mutateStateForOrg(session.orgId, (state) => ({
      ...state,
      events: appendComplianceEvents(state, [
        createComplianceEvent(
          {
            type: "policy.acknowledged",
            entityType: "system",
            entityId: policyId,
            message: `Politica "${policyId}" a fost confirmata de ${userEmail}.`,
            createdAtISO: new Date().toISOString(),
          },
          actor
        ),
      ]),
    }), session.orgName)

    return NextResponse.json({ acknowledgments })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Confirmarea politicii a esuat.", 500, "POLICY_ACK_FAILED")
  }
}
