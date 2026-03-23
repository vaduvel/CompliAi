// app/api/stripe/portal/route.ts
// Redirect la Stripe Customer Portal pentru gestionare abonament

import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession, resolveUserMode } from "@/lib/server/auth"
import { getOrgPlanRecord, getPartnerAccountPlanRecord } from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/stripe/portal")

  try {
    const session = await requireFreshAuthenticatedSession(request, "portalul de abonament")
    const body = (await request.json().catch(() => ({}))) as {
      billingScope?: "org" | "account"
    }
    const billingScope = body.billingScope === "account" ? "account" : "org"

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return jsonError("Stripe nu este configurat.", 501, "STRIPE_NOT_CONFIGURED", undefined, context)
    }

    if (billingScope === "org" && session.role !== "owner") {
      throw new AuthzError(
        "Doar owner-ul poate gestiona billingul firmei.",
        403,
        "ORG_BILLING_FORBIDDEN"
      )
    }

    if (billingScope === "account") {
      const userMode = await resolveUserMode(session)
      if (userMode !== "partner") {
        throw new AuthzError(
          "Billingul de cont partner este disponibil doar in modul partner.",
          403,
          "ACCOUNT_BILLING_FORBIDDEN"
        )
      }
    }

    const planRecord =
      billingScope === "account"
        ? await getPartnerAccountPlanRecord(session.userId)
        : await getOrgPlanRecord(session.orgId)
    if (!planRecord?.stripeCustomerId) {
      return jsonError(
        billingScope === "account"
          ? "Nu există un client Stripe asociat contului partner."
          : "Nu există un client Stripe asociat acestei organizații.",
        400,
        "NO_STRIPE_CUSTOMER",
        undefined,
        context
      )
    }

    const returnUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "") +
      (billingScope === "account" ? dashboardRoutes.accountSettings : dashboardRoutes.settingsBilling)

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
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code, undefined, context)
    }
    await logRouteError(context, error, {
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
