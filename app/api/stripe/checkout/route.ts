// app/api/stripe/checkout/route.ts
// S2A.1 — Creare sesiune Stripe Checkout cu support 14 ICP SKU (Doc 06).
// Tier-urile sunt definite în lib/server/stripe-tier-config.ts.
// Env vars per tier: STRIPE_PRICE_{TIER_ID_UPPERCASE}_MONTHLY

import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import { getOrgPlan, getOrgPlanRecord, isPartnerAccountPlan } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"
import {
  getStripePriceId,
  isAccountScopedTier,
  isOrgScopedTier,
  isValidTier,
} from "@/lib/server/stripe-tier-config"

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

    if (!isValidTier(targetPlan)) {
      return jsonError(
        `Plan invalid: ${targetPlan}. Vezi /pricing pentru lista completă.`,
        400,
        "INVALID_PLAN",
        undefined,
        context
      )
    }

    // Validate billingScope-tier consistency. Backward-compat: legacy "pro"/"partner"
    // sunt acceptate (mapping în registry), partner_10/25/50 cer scope "account".
    if (billingScope === "org" && !isOrgScopedTier(targetPlan)) {
      return jsonError(
        "Acest plan necesită billingScope=account (cabinet partner).",
        400,
        "INVALID_PLAN_SCOPE",
        undefined,
        context
      )
    }
    if (billingScope === "account" && !isAccountScopedTier(targetPlan)) {
      // Permitem și legacy partner_* prin isPartnerAccountPlan
      if (!isPartnerAccountPlan(targetPlan)) {
        return jsonError(
          "Acest plan necesită billingScope=org (org-level subscription).",
          400,
          "INVALID_PLAN_SCOPE",
          undefined,
          context
        )
      }
    }

    const priceId = getStripePriceId(targetPlan)
    if (!priceId) {
      return jsonError(
        `STRIPE_PRICE pentru tier ${targetPlan} nu este configurat (env var lipsă).`,
        500,
        "STRIPE_PRICE_NOT_CONFIGURED",
        undefined,
        context
      )
    }

    const userMode = await resolveUserMode(session)

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
