"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/evidence-os/Button"
import { PLAN_LABELS, planHasFeature } from "@/lib/server/plan"
import type { OrgPlan, PlanFeature } from "@/lib/server/plan"

// ── PlanGate ──────────────────────────────────────────────────────────────────
//
// Wraps content that requires a specific plan.
// If the current org plan is insufficient, shows a locked overlay.
//
// Usage:
//   <PlanGate feature="health-check" currentPlan={plan}>
//     <HealthCheckCard />
//   </PlanGate>
//
// Props:
//   feature        — which PlanFeature to gate
//   currentPlan    — the org's current plan (from server)
//   children       — the locked content (always rendered but blurred/covered)
//   compact        — smaller overlay variant for inline use
//   customMessage  — override the default "Disponibil în planul X" message

interface PlanGateProps {
  feature: PlanFeature
  currentPlan: OrgPlan
  children: React.ReactNode
  compact?: boolean
  customMessage?: string
}

export function PlanGate({
  feature,
  currentPlan,
  children,
  compact = false,
  customMessage,
}: PlanGateProps) {
  if (planHasFeature(currentPlan, feature)) {
    return <>{children}</>
  }

  // Determine required plan label
  const requiredLabels: Record<PlanFeature, OrgPlan> = {
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
  const requiredPlan = requiredLabels[feature]
  const requiredLabel = PLAN_LABELS[requiredPlan]
  const message = customMessage ?? `Disponibil în planul ${requiredLabel}`

  if (compact) {
    return (
      <div className="relative">
        {/* Blurred content */}
        <div className="pointer-events-none select-none blur-[3px] brightness-75" aria-hidden>
          {children}
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-eos-lg bg-eos-surface/60 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface-primary px-3 py-2 shadow-[var(--eos-shadow-md)]">
            <Lock className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
            <span className="text-xs font-medium text-eos-text">{message}</span>
            <Button asChild size="sm" className="ml-1">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm brightness-75" aria-hidden>
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-eos-xl bg-eos-surface/70 backdrop-blur-[2px]">
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <div className="grid size-10 place-items-center rounded-full border border-eos-border bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]">
            <Lock className="size-5 text-eos-text-muted" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-eos-text">{message}</p>
            <p className="mt-1 text-sm text-eos-text-muted">
              Fă upgrade pentru a debloca această funcționalitate și toate celelalte din planul{" "}
              {requiredLabel}.
            </p>
          </div>
          <Button asChild>
            <Link href="/pricing">
              Vezi planurile →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── PlanBadge ─────────────────────────────────────────────────────────────────
//
// Small inline badge showing that a feature requires a specific plan.
// Used in nav items, tab headers, feature descriptions.

interface PlanBadgeProps {
  plan: OrgPlan
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const colors: Record<OrgPlan, string> = {
    free: "bg-eos-surface-variant border-eos-border text-eos-text-muted",
    pro: "bg-eos-primary-soft border-eos-primary/30 text-eos-primary",
    partner: "bg-eos-warning-soft border-eos-warning/30 text-eos-warning",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${colors[plan]} ${className ?? ""}`}
    >
      {PLAN_LABELS[plan]}
    </span>
  )
}
