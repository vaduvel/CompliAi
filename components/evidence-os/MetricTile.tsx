import * as React from "react"

import { cn } from "@/lib/utils"

interface MetricTileProps {
  label: string
  value: React.ReactNode
  detail: React.ReactNode
  tone?: string
  className?: string
}

export function MetricTile({
  label,
  value,
  detail,
  tone = "text-eos-text",
  className,
}: MetricTileProps) {
  return (
    <div className={cn("rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3", className)}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-[24px] font-medium leading-none tracking-[-0.025em] tabular-nums",
          tone
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[10.5px] leading-[1.35] tracking-[0.01em] text-eos-text-muted">
        {detail}
      </p>
    </div>
  )
}
