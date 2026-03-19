// app/api/stripe/checkout/route.ts
// Creare sesiune Stripe Checkout — Free→Pro sau Pro→Partner
// Necesită: STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PARTNER_MONTHLY

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgPlan, getOrgPlanRecord } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"
import type { OrgPlan } from "@/lib/server/plan"

const STRIPE_PRICES: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  partner: process.env.STRIPE_PRICE_PARTNER_MONTHLY,
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/stripe/checkout")

  try {
    const session = await requireFreshAuthenticatedSession(request, "crearea sesiunii de checkout")
    const body = (await request.json()) as { targetPlan?: string }
    const targetPlan = body.targetPlan as OrgPlan | undefined

    if (!targetPlan || !["pro", "partner"].includes(targetPlan)) {
      return jsonError("Plan invalid. Acceptat: pro, partner.", 400, "INVALID_PLAN", undefined, context)
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      // Stripe not configured — dev/staging fallback
      return Response.json({
        url: `/pricing?upgrade=${targetPlan}&demo=1`,
        demo: true,
      })
    }

    const priceId = STRIPE_PRICES[targetPlan]
    if (!priceId) {
      return jsonError(
        `STRIPE_PRICE_${targetPlan.toUpperCase()}_MONTHLY nu este configurat.`,
        500,
        "STRIPE_PRICE_NOT_CONFIGURED",
        undefined,
        context
      )
    }

    const currentPlan = await getOrgPlan(session.orgId)
    const planRecord = await getOrgPlanRecord(session.orgId)

    // Stripe API call
    const stripeBody = new URLSearchParams({
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/setari/abonament?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/pricing?canceled=1`,
      client_reference_id: session.orgId,
      "metadata[orgId]": session.orgId,
      "metadata[targetPlan]": targetPlan,
      "subscription_data[metadata][orgId]": session.orgId,
      "subscription_data[metadata][targetPlan]": targetPlan,
      customer_email: session.email,
      ...(planRecord.stripeCustomerId
        ? { customer: planRecord.stripeCustomerId }
        : { "customer_email": session.email }),
    })

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    })

    if (!stripeResponse.ok) {
      const errBody = (await stripeResponse.json()) as { error?: { message?: string } }
      return jsonError(
        errBody.error?.message ?? "Stripe checkout a eșuat.",
        500,
        "STRIPE_CHECKOUT_FAILED",
        undefined,
        context
      )
    }

    const checkoutSession = (await stripeResponse.json()) as { url: string; id: string }

    void currentPlan // used for potential upgrade validation — kept for future guards
    return Response.json({ url: checkoutSession.url })
  } catch (error) {
    logRouteError(context, error, {
      code: "STRIPE_CHECKOUT_ERROR",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      error instanceof Error ? error.message : "Checkout Stripe a eșuat.",
      500,
      "STRIPE_CHECKOUT_ERROR",
      undefined,
      context
    )
  }
}
