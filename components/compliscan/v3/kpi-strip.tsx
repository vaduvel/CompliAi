import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type V3KpiTone = "info" | "critical" | "warning" | "success" | "neutral"

export type V3KpiItem = {
  id: string
  label: ReactNode
  value: ReactNode
  valueUnit?: ReactNode
  detail?: ReactNode
  trend?: ReactNode
  trendDirection?: "up" | "down" | "flat"
  stripe?: V3KpiTone
  valueTone?: V3KpiTone
}

const STRIPE_COLOR: Record<V3KpiTone, string> = {
  info: "bg-eos-primary",
  critical: "bg-eos-error",
  warning: "bg-eos-warning",
  success: "bg-eos-success",
  neutral: "bg-eos-border-strong",
}

const VALUE_COLOR: Record<V3KpiTone, string> = {
  info: "text-eos-primary",
  critical: "text-eos-error",
  warning: "text-eos-warning",
  success: "text-eos-success",
  neutral: "text-eos-text",
}

const TREND_COLOR: Record<NonNullable<V3KpiItem["trendDirection"]>, string> = {
  up: "bg-eos-error-soft text-eos-error",
  down: "bg-eos-success-soft text-eos-success",
  flat: "bg-white/[0.04] text-eos-text-tertiary",
}

export function V3KpiStrip({ items, className }: { items: V3KpiItem[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <div
      className={cn(
        "grid divide-x divide-eos-border overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface",
        items.length === 2 && "grid-cols-2",
        items.length === 3 && "grid-cols-3",
        items.length === 4 && "grid-cols-2 md:grid-cols-4",
        items.length >= 5 && "grid-cols-2 md:grid-cols-5",
        className
      )}
    >
      {items.map((kpi) => {
        const stripe = kpi.stripe ? STRIPE_COLOR[kpi.stripe] : null
        const valueTone = kpi.valueTone ? VALUE_COLOR[kpi.valueTone] : "text-eos-text"
        return (
          <div key={kpi.id} className="relative overflow-hidden bg-eos-surface px-4 py-3">
            {stripe && (
              <span
                className={cn("absolute left-0 top-3 bottom-3 w-[2px] rounded-r-sm", stripe)}
                aria-hidden
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                {kpi.label}
              </span>
              {kpi.trend && (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-px font-mono text-[9.5px] font-medium tracking-[0.02em]",
                    kpi.trendDirection ? TREND_COLOR[kpi.trendDirection] : "bg-white/[0.04] text-eos-text-tertiary"
                  )}
                >
                  {kpi.trend}
                </span>
              )}
            </div>
            <div
              className={cn(
                "mt-1.5 flex items-baseline gap-1 font-display text-[24px] font-medium leading-none tabular-nums tracking-[-0.025em]",
                valueTone
              )}
            >
              <span>{kpi.value}</span>
              {kpi.valueUnit && (
                <span className="font-sans text-[13px] font-normal text-eos-text-tertiary">
                  {kpi.valueUnit}
                </span>
              )}
            </div>
            {kpi.detail && (
              <p className="mt-1.5 font-mono text-[10.5px] leading-[1.35] tracking-[0.01em] text-eos-text-muted">
                {kpi.detail}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
