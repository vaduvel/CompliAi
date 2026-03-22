import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole, readSessionFromRequest } from "@/lib/server/auth"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { getOrgContext } from "@/lib/server/org-context"
import { writePolicyAcknowledgment } from "@/lib/server/policy-store"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"

export async function POST(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance"], "confirmarea politicilor")
    const { orgId } = await getOrgContext()

    const session = readSessionFromRequest(request)
    const userEmail = session?.email ?? "unknown"

    const body = (await request.json()) as { policyId?: string }
    const { policyId } = body
    if (!policyId || typeof policyId !== "string") {
      return jsonError("policyId lipsa.", 400, "POLICY_ID_REQUIRED")
    }

    const acknowledgments = await writePolicyAcknowledgment(orgId, policyId, userEmail)

    const actor = session ? eventActorFromSession(session) : undefined
    await mutateState((state) => ({
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
    }))

    return NextResponse.json({ acknowledgments })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Confirmarea politicii a esuat.", 500, "POLICY_ACK_FAILED")
  }
}
