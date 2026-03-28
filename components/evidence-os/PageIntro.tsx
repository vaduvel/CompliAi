import * as React from "react"

import { ActionCluster } from "@/components/evidence-os/ActionCluster"
import { cn } from "@/lib/utils"

interface PageIntroProps {
  eyebrow?: React.ReactNode
  title: string
  description?: string
  badges?: React.ReactNode
  actions?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}

export function PageIntro({
  eyebrow,
  title,
  description,
  badges,
  actions,
  aside,
  className,
}: PageIntroProps) {
  const titleId = React.useId()
  const descriptionId = React.useId()

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "rounded-eos-xl border border-eos-border-subtle bg-[linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-primary))] p-5 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              {eyebrow}
            </p>
          ) : null}
          {badges ? <div className="mt-2 flex flex-wrap gap-2">{badges}</div> : null}
          <h1
            id={titleId}
            className={cn(
              "text-2xl font-semibold tracking-tight text-eos-text [overflow-wrap:anywhere] sm:text-3xl",
              eyebrow || badges ? "mt-3" : ""
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              id={descriptionId}
              className="mt-3 max-w-3xl text-sm leading-7 text-eos-text-muted [overflow-wrap:anywhere]"
            >
              {description}
            </p>
          ) : null}
        </div>

        {aside || actions ? (
          <div className="eos-page-cluster w-full shrink-0 xl:max-w-[var(--eos-page-rail-width)]">
            {aside ? (
              <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset p-4">
                {aside}
              </div>
            ) : null}
            {actions ? <ActionCluster actions={actions} /> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
