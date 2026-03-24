// app/api/plan/route.ts
// GET — returnează planul curent al org-ului din sesiune

import { jsonError } from "@/lib/server/api-response"
import {
  listUserMemberships,
  requireFreshAuthenticatedSession,
  resolveUserMode,
} from "@/lib/server/auth"
import { deriveAccountState } from "@/lib/billing/account-state"
import {
  getOrgPlan,
  getOrgPlanRecord,
  getPartnerAccountPlanStatus,
  hasLegacyPartnerOrgPlan,
} from "@/lib/server/plan"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import { logRouteError } from "@/lib/server/operational-logger"

export async function GET(request: Request) {
  const context = createRequestContext(request, "/api/plan")

  try {
    const session = await requireFreshAuthenticatedSession(request, "planul organizației")
    const [plan, record, userMode, memberships] = await Promise.all([
      getOrgPlan(session.orgId),
      getOrgPlanRecord(session.orgId),
      resolveUserMode(session),
      listUserMemberships(session.userId),
    ])
    const activeMemberships = memberships.filter((membership) => membership.status === "active")
    const currentOrgs = new Set(activeMemberships.map((membership) => membership.orgId)).size
    const legacyPartnerEnabled = await hasLegacyPartnerOrgPlan(
      activeMemberships.map((membership) => membership.orgId)
    )
    const partnerPlanStatus = await getPartnerAccountPlanStatus({
      userId: session.userId,
      currentOrgs,
      legacyPartnerEnabled,
    })

    const accountState = deriveAccountState(plan, record.trialEndsAtISO)

    return Response.json({
      plan,
      updatedAtISO: record.updatedAtISO,
      trialEndsAtISO: record.trialEndsAtISO ?? null,
      accountState: accountState.state,
      isReadOnly: accountState.isReadOnly,
      hasStripeCustomer: !!record.stripeCustomerId,
      hasActiveSubscription: !!record.stripeSubscriptionId,
      userMode: userMode ?? null,
      billingScope: userMode === "partner" ? "partner_account" : "org",
      planType: partnerPlanStatus.planType,
      maxOrgs: partnerPlanStatus.maxOrgs,
      currentOrgs: partnerPlanStatus.currentOrgs,
      canAddOrg: partnerPlanStatus.canAddOrg,
      partnerPlanSource: partnerPlanStatus.source,
      partnerHasStripeCustomer: partnerPlanStatus.hasStripeCustomer,
      partnerHasActiveSubscription: partnerPlanStatus.hasActiveSubscription,
      partnerUpdatedAtISO: partnerPlanStatus.updatedAtISO,
      canManageOrgBilling: session.role === "owner",
      canManagePartnerBilling: userMode === "partner",
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
