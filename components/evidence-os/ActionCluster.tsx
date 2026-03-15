import * as React from "react"

import { cn } from "@/lib/utils"

interface ActionClusterProps {
  eyebrow?: string
  title?: string
  description?: string
  actions: React.ReactNode
  note?: React.ReactNode
  className?: string
}

export function ActionCluster({
  eyebrow,
  title,
  description,
  actions,
  note,
  className,
}: ActionClusterProps) {
  return (
    <section
      className={cn(
        "rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset p-4",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <p className={cn("text-base font-semibold text-eos-text", eyebrow ? "mt-2" : "")}>
          {title}
        </p>
      ) : null}
      {description ? (
        <p
          className={cn(
            "text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]",
            title ? "mt-1" : eyebrow ? "mt-2" : ""
          )}
        >
          {description}
        </p>
      ) : null}
      <div className={cn("flex flex-wrap gap-2", title || description || eyebrow ? "mt-4" : "")}>
        {actions}
      </div>
      {note ? (
        <div className="mt-3 text-xs leading-5 text-eos-text-tertiary [overflow-wrap:anywhere]">
          {note}
        </div>
      ) : null}
    </section>
  )
}
