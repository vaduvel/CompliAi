// lib/shared/plan-constants.ts
// Client-safe plan constants — importable from "use client" components.
// Server-side logic stays in lib/server/plan.ts.

export type OrgPlan = "free" | "pro" | "partner"

export const PLAN_LABELS: Record<OrgPlan, string> = {
  free: "Gratuit",
  pro: "Pro",
  partner: "Partner",
}

export const PLAN_PRICES: Record<OrgPlan, string> = {
  free: "€0 / lună",
  pro: "€99 / lună",
  partner: "€249 / lună",
}

// ── Plan feature gates (pentru UI) ───────────────────────────────────────────

export type PlanFeature =
  | "audit-pack-full"
  | "findings-resolution"
  | "efactura-signal"
  | "partner-hub"
  | "all-documents"
  | "health-check"
  | "inspector-mode"
  | "weekly-digest"
  | "nis2-full"
  | "ai-act-full"
  | "multi-client"
  | "csv-import"
  | "client-drilldown"

const PLAN_PRIORITY: Record<OrgPlan, number> = {
  free: 0,
  pro: 1,
  partner: 2,
}

const FEATURE_PLAN: Record<PlanFeature, OrgPlan> = {
  "audit-pack-full": "pro",
  "findings-resolution": "pro",
  "efactura-signal": "pro",
  "partner-hub": "partner",
  "all-documents": "pro",
  "health-check": "pro",
  "inspector-mode": "pro",
  "weekly-digest": "pro",
  "nis2-full": "pro",
  "ai-act-full": "pro",
  "multi-client": "partner",
  "csv-import": "partner",
  "client-drilldown": "partner",
}

export function featureRequiresPlan(feature: PlanFeature): OrgPlan {
  return FEATURE_PLAN[feature]
}

export function planHasFeature(currentPlan: OrgPlan, feature: PlanFeature): boolean {
  return PLAN_PRIORITY[currentPlan] >= PLAN_PRIORITY[FEATURE_PLAN[feature]]
}
