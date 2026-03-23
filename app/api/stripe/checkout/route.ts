// app/api/stripe/checkout/route.ts
// Creare sesiune Stripe Checkout — Free→Pro sau Pro→Partner
// Necesită: STRIPE_SECRET_KEY, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PARTNER_MONTHLY

import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, getUserMode, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgPlan, getOrgPlanRecord, isPartnerAccountPlan } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

const STRIPE_PRICES: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  partner: process.env.STRIPE_PRICE_PARTNER_MONTHLY,
  partner_10: process.env.STRIPE_PRICE_PARTNER_10_MONTHLY ?? process.env.STRIPE_PRICE_PARTNER_MONTHLY,
  partner_25: process.env.STRIPE_PRICE_PARTNER_25_MONTHLY ?? process.env.STRIPE_PRICE_PARTNER_MONTHLY,
  partner_50: process.env.STRIPE_PRICE_PARTNER_50_MONTHLY ?? process.env.STRIPE_PRICE_PARTNER_MONTHLY,
}

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/stripe/checkout")

  try {
    const session = await requireFreshAuthenticatedSession(request, "crearea sesiunii de checkout")
    const body = (await request.json()) as {
      targetPlan?: string
      billingScope?: "org" | "account"
    }
    const billingScope = body.billingScope === "account" ? "account" : "org"
    const targetPlan = body.targetPlan

    if (!targetPlan) {
      return jsonError("Plan invalid.", 400, "INVALID_PLAN", undefined, context)
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      // Stripe not configured — dev/staging fallback
      return Response.json({
        url: `/pricing?upgrade=${targetPlan}&scope=${billingScope}&demo=1`,
        demo: true,
      })
    }

    if (billingScope === "org" && !["pro", "partner"].includes(targetPlan)) {
      return jsonError("Plan invalid. Acceptat: pro, partner.", 400, "INVALID_PLAN", undefined, context)
    }

    if (billingScope === "account" && !isPartnerAccountPlan(targetPlan)) {
      return jsonError(
        "Plan invalid. Acceptat: partner_10, partner_25, partner_50.",
        400,
        "INVALID_PLAN",
        undefined,
        context
      )
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

    const userMode = await getUserMode(session.userId)

    if (billingScope === "org" && session.role !== "owner") {
      throw new AuthzError(
        "Doar owner-ul poate modifica billingul firmei.",
        403,
        "ORG_BILLING_FORBIDDEN"
      )
    }

    if (billingScope === "account" && userMode !== "partner") {
      throw new AuthzError(
        "Billingul de cont partner este disponibil doar in modul partner.",
        403,
        "ACCOUNT_BILLING_FORBIDDEN"
      )
    }

    const currentPlan = billingScope === "org" ? await getOrgPlan(session.orgId) : undefined
    const planRecord = billingScope === "org" ? await getOrgPlanRecord(session.orgId) : null

    // Stripe API call
    const stripeBody = new URLSearchParams({
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${
        billingScope === "account" ? dashboardRoutes.accountSettings : dashboardRoutes.settingsBilling
      }?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/pricing?canceled=1`,
      client_reference_id: billingScope === "account" ? session.userId : session.orgId,
      "metadata[billingScope]": billingScope,
      "metadata[targetPlan]": targetPlan,
      "subscription_data[metadata][billingScope]": billingScope,
      "subscription_data[metadata][targetPlan]": targetPlan,
      customer_email: session.email,
      ...(billingScope === "account"
        ? {
            "metadata[userId]": session.userId,
            "subscription_data[metadata][userId]": session.userId,
          }
        : {
            "metadata[orgId]": session.orgId,
            "subscription_data[metadata][orgId]": session.orgId,
          }),
      ...(planRecord?.stripeCustomerId
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
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }
    await logRouteError(context, error, {
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
