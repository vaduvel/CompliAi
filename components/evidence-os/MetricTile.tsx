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
    <div className={cn("rounded-eos-md border border-eos-border bg-eos-surface p-5", className)}>
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold", tone)}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-eos-text-muted">{detail}</p>
    </div>
  )
}
