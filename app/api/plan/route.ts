// app/api/plan/route.ts
// GET — returnează planul curent al org-ului din sesiune

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgPlan, getOrgPlanRecord } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/plan")

  try {
    const session = await requireFreshAuthenticatedSession(request, "planul organizației")
    const [plan, record] = await Promise.all([
      getOrgPlan(session.orgId),
      getOrgPlanRecord(session.orgId),
    ])

    return Response.json({
      plan,
      updatedAtISO: record.updatedAtISO,
      trialEndsAtISO: record.trialEndsAtISO ?? null,
      hasStripeCustomer: !!record.stripeCustomerId,
      hasActiveSubscription: !!record.stripeSubscriptionId,
    })
  } catch (error) {
    await logRouteError(context, error, {
      code: "PLAN_FETCH_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      error instanceof Error ? error.message : "Nu am putut citi planul organizației.",
      500,
      "PLAN_FETCH_FAILED",
      undefined,
      context
    )
  }
}
