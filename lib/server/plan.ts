// lib/server/plan.ts
// Plan management — Free / Pro / Partner
// Stocat în .data/plans.json (local) sau Supabase (cloud).

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

// Re-export client-safe constants so existing imports from lib/server/plan still work
export {
  type OrgPlan,
  type PlanFeature,
  PLAN_LABELS,
  PLAN_PRICES,
  featureRequiresPlan,
  planHasFeature,
} from "@/lib/shared/plan-constants"
import type { OrgPlan } from "@/lib/shared/plan-constants"
import { PLAN_LABELS } from "@/lib/shared/plan-constants"

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgPlanRecord = {
  orgId: string
  plan: OrgPlan
  updatedAtISO: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  trialEndsAtISO?: string   // 14 zile Pro gratuit la înregistrare
}

export type PlanHierarchy = Record<OrgPlan, number>

const PLAN_PRIORITY: PlanHierarchy = {
  free: 0,
  pro: 1,
  partner: 2,
}

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

async function readAllPlans(): Promise<Record<string, OrgPlanRecord>> {
  return (await planStorage.read("global")) ?? {}
}

async function writeAllPlans(plans: Record<string, OrgPlanRecord>): Promise<void> {
  await planStorage.write("global", plans)
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
  // Citim orgId din header (setat de middleware)
  const orgId = request.headers.get("x-compliscan-org-id")
  if (!orgId) return minPlan // fallback graceful — nu blocăm în dev fără middleware

  const currentPlan = await getOrgPlan(orgId)
  if (PLAN_PRIORITY[currentPlan] < PLAN_PRIORITY[minPlan]) {
    throw new PlanError(minPlan, currentPlan, action)
  }
  return currentPlan
}

