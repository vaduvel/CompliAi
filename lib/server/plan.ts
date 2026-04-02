// lib/server/plan.ts
// Plan management — Free / Pro / Partner
// Stocat în .data/plans.json (local) sau Supabase (cloud).

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import { readSessionFromRequest } from "@/lib/server/auth"

// Re-export client-safe constants so existing imports from lib/server/plan still work
export {
  type OrgPlan,
  type PartnerAccountPlan,
  type PlanFeature,
  LEGACY_PARTNER_ACCOUNT_FALLBACK_PLAN,
  PARTNER_ACCOUNT_PLAN_LABELS,
  PARTNER_ACCOUNT_PLAN_LIMITS,
  PARTNER_TRIAL_LIMIT,
  PLAN_LABELS,
  PLAN_PRICES,
  featureRequiresPlan,
  isPartnerAccountPlan,
  planHasFeature,
} from "@/lib/shared/plan-constants"
import type { OrgPlan, PartnerAccountPlan } from "@/lib/shared/plan-constants"
import {
  LEGACY_PARTNER_ACCOUNT_FALLBACK_PLAN,
  PARTNER_ACCOUNT_PLAN_LIMITS,
  PARTNER_TRIAL_LIMIT,
  PLAN_LABELS,
} from "@/lib/shared/plan-constants"

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgPlanRecord = {
  orgId: string
  plan: OrgPlan
  updatedAtISO: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  trialEndsAtISO?: string   // 14 zile Pro gratuit la înregistrare
}

export type PartnerAccountPlanRecord = {
  userId: string
  planType: PartnerAccountPlan
  updatedAtISO: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export type PartnerAccountPlanStatus = {
  planType: PartnerAccountPlan | null
  maxOrgs: number | null
  currentOrgs: number
  canAddOrg: boolean
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
  updatedAtISO: string | null
  source: "account" | "legacy_org_partner" | "trial"
}

export type PlanHierarchy = Record<OrgPlan, number>

const PLAN_PRIORITY: PlanHierarchy = {
  free: 0,
  pro: 1,
  partner: 2,
}

const PARTNER_ACCOUNT_STORAGE_KEY = "__partner_account_plans__"

// ── Plan Error ────────────────────────────────────────────────────────────────

export class PlanError extends Error {
  readonly code = "PLAN_REQUIRED"
  readonly status = 403
  readonly requiredPlan: OrgPlan
  readonly currentPlan: OrgPlan

  constructor(requiredPlan: OrgPlan, currentPlan: OrgPlan, action?: string) {
    super(
      action
        ? `Funcționalitatea "${action}" necesită planul ${PLAN_LABELS[requiredPlan]}. Planul curent: ${PLAN_LABELS[currentPlan]}.`
        : `Necesită planul ${PLAN_LABELS[requiredPlan]}. Planul curent: ${PLAN_LABELS[currentPlan]}.`
    )
    this.requiredPlan = requiredPlan
    this.currentPlan = currentPlan
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────

const planStorage = createAdaptiveStorage<Record<string, OrgPlanRecord>>("plans", "plans")
const partnerAccountPlanStorage =
  createAdaptiveStorage<Record<string, PartnerAccountPlanRecord>>("plans", "plans")

async function readAllPlans(): Promise<Record<string, OrgPlanRecord>> {
  return (await planStorage.read("global")) ?? {}
}

async function writeAllPlans(plans: Record<string, OrgPlanRecord>): Promise<void> {
  await planStorage.write("global", plans)
}

async function readAllPartnerAccountPlans(): Promise<Record<string, PartnerAccountPlanRecord>> {
  return (await partnerAccountPlanStorage.read(PARTNER_ACCOUNT_STORAGE_KEY)) ?? {}
}

async function writeAllPartnerAccountPlans(
  plans: Record<string, PartnerAccountPlanRecord>
): Promise<void> {
  await partnerAccountPlanStorage.write(PARTNER_ACCOUNT_STORAGE_KEY, plans)
}

export async function getOrgPlan(orgId: string): Promise<OrgPlan> {
  const plans = await readAllPlans()
  const record = plans[orgId]
  if (!record) return "free"

  // Trial activ = pro temporar
  if (record.plan === "free" && record.trialEndsAtISO && record.trialEndsAtISO > new Date().toISOString()) {
    return "pro"
  }

  return record.plan
}

export async function getOrgPlanRecord(orgId: string): Promise<OrgPlanRecord> {
  const plans = await readAllPlans()
  return (
    plans[orgId] ?? {
      orgId,
      plan: "free",
      updatedAtISO: new Date().toISOString(),
    }
  )
}

export async function setOrgPlan(orgId: string, plan: OrgPlan, extras?: Partial<OrgPlanRecord>): Promise<OrgPlanRecord> {
  const plans = await readAllPlans()
  const record: OrgPlanRecord = {
    orgId,
    plan,
    updatedAtISO: new Date().toISOString(),
    ...extras,
  }
  plans[orgId] = record
  await writeAllPlans(plans)
  return record
}

export async function activateTrial(orgId: string): Promise<OrgPlanRecord> {
  const trialEndsAtISO = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  return setOrgPlan(orgId, "free", { trialEndsAtISO })
}

export async function getPartnerAccountPlanRecord(
  userId: string
): Promise<PartnerAccountPlanRecord | null> {
  const plans = await readAllPartnerAccountPlans()
  return plans[userId] ?? null
}

export async function setPartnerAccountPlan(
  userId: string,
  planType: PartnerAccountPlan,
  extras?: Partial<PartnerAccountPlanRecord>
): Promise<PartnerAccountPlanRecord> {
  const plans = await readAllPartnerAccountPlans()
  const record: PartnerAccountPlanRecord = {
    userId,
    planType,
    updatedAtISO: new Date().toISOString(),
    ...extras,
  }
  plans[userId] = record
  await writeAllPartnerAccountPlans(plans)
  return record
}

export async function clearPartnerAccountPlan(userId: string): Promise<void> {
  const plans = await readAllPartnerAccountPlans()
  if (!plans[userId]) return
  delete plans[userId]
  await writeAllPartnerAccountPlans(plans)
}

export async function hasLegacyPartnerOrgPlan(orgIds: string[]): Promise<boolean> {
  const uniqueOrgIds = Array.from(new Set(orgIds.filter(Boolean)))
  for (const orgId of uniqueOrgIds) {
    if ((await getOrgPlan(orgId)) === "partner") {
      return true
    }
  }
  return false
}

export async function getPartnerAccountPlanStatus({
  userId,
  currentOrgs,
  legacyPartnerEnabled = false,
}: {
  userId: string
  currentOrgs: number
  legacyPartnerEnabled?: boolean
}): Promise<PartnerAccountPlanStatus> {
  const record = await getPartnerAccountPlanRecord(userId)

  if (record) {
    const maxOrgs = PARTNER_ACCOUNT_PLAN_LIMITS[record.planType]
    return {
      planType: record.planType,
      maxOrgs,
      currentOrgs,
      canAddOrg: currentOrgs < maxOrgs,
      hasStripeCustomer: Boolean(record.stripeCustomerId),
      hasActiveSubscription: Boolean(record.stripeSubscriptionId),
      updatedAtISO: record.updatedAtISO,
      source: "account",
    }
  }

  if (legacyPartnerEnabled) {
    const planType = LEGACY_PARTNER_ACCOUNT_FALLBACK_PLAN
    const maxOrgs = PARTNER_ACCOUNT_PLAN_LIMITS[planType]
    return {
      planType,
      maxOrgs,
      currentOrgs,
      canAddOrg: currentOrgs < maxOrgs,
      hasStripeCustomer: false,
      hasActiveSubscription: false,
      updatedAtISO: null,
      source: "legacy_org_partner",
    }
  }

  return {
    planType: null,
    maxOrgs: PARTNER_TRIAL_LIMIT,
    currentOrgs,
    canAddOrg: currentOrgs < PARTNER_TRIAL_LIMIT,
    hasStripeCustomer: false,
    hasActiveSubscription: false,
    updatedAtISO: null,
    source: "trial",
  }
}

// ── requirePlan helper ────────────────────────────────────────────────────────

/**
 * Aruncă PlanError dacă planul org-ului e sub minimul cerut.
 * Folosit în API route handlers.
 *
 * @example
 * await requirePlan(request, "pro", "exportul Audit Pack complet")
 */
export async function requirePlan(
  request: Request,
  minPlan: OrgPlan,
  action?: string
): Promise<OrgPlan> {
  // Session truth first. Header fallback remains only for internal/dev calls
  // that still pass org context explicitly.
  const orgId = readSessionFromRequest(request)?.orgId ?? request.headers.get("x-compliscan-org-id")
  if (!orgId) return minPlan // fallback graceful — nu blocăm în dev fără middleware

  const currentPlan = await getOrgPlan(orgId)
  if (PLAN_PRIORITY[currentPlan] < PLAN_PRIORITY[minPlan]) {
    throw new PlanError(minPlan, currentPlan, action)
  }
  return currentPlan
}
