// app/api/stripe/portal/route.ts
// Redirect la Stripe Customer Portal pentru gestionare abonament

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgPlanRecord } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/stripe/portal")

  try {
    const session = await requireFreshAuthenticatedSession(request, "portalul de abonament")

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return jsonError("Stripe nu este configurat.", 501, "STRIPE_NOT_CONFIGURED", undefined, context)
    }

    const planRecord = await getOrgPlanRecord(session.orgId)
    if (!planRecord.stripeCustomerId) {
      return jsonError(
        "Nu există un client Stripe asociat acestei organizații.",
        400,
        "NO_STRIPE_CUSTOMER",
        undefined,
        context
      )
    }

    const returnUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "") + "/dashboard/setari/abonament"

    const portalBody = new URLSearchParams({
      customer: planRecord.stripeCustomerId,
      return_url: returnUrl,
    })

    const portalResponse = await fetch(
      "https://api.stripe.com/v1/billing_portal/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: portalBody.toString(),
      }
    )

    if (!portalResponse.ok) {
      const errBody = (await portalResponse.json()) as { error?: { message?: string } }
      return jsonError(
        errBody.error?.message ?? "Portalul Stripe a eșuat.",
        500,
        "STRIPE_PORTAL_FAILED",
        undefined,
        context
      )
    }

    const portalSession = (await portalResponse.json()) as { url: string }
    return Response.json({ url: portalSession.url })
  } catch (error) {
    logRouteError(context, error, {
      code: "STRIPE_PORTAL_ERROR",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      error instanceof Error ? error.message : "Portalul Stripe a eșuat.",
      500,
      "STRIPE_PORTAL_ERROR",
      undefined,
      context
    )
  }
}
