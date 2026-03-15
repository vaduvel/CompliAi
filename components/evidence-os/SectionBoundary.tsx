import * as React from "react"

import { cn } from "@/lib/utils"

interface SectionBoundaryProps {
  eyebrow?: string
  title: string
  description?: string
  badges?: React.ReactNode
  actions?: React.ReactNode
  support?: React.ReactNode
  className?: string
}

export function SectionBoundary({
  eyebrow,
  title,
  description,
  badges,
  actions,
  support,
  className,
}: SectionBoundaryProps) {
  return (
    <section
      className={cn(
        "rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset px-5 py-4",
        className
      )}
    >
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
          {eyebrow}
        </p>
      ) : null}
      <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between", eyebrow ? "mt-2" : "")}>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-eos-text [overflow-wrap:anywhere]">{title}</p>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]">
              {description}
            </p>
          ) : null}
        </div>

        {badges || actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {badges}
            {actions}
          </div>
        ) : null}
      </div>

      {support ? <div className="mt-4">{support}</div> : null}
    </section>
  )
}
