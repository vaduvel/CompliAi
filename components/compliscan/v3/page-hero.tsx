import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type HeroBreadcrumbItem = {
  label: ReactNode
  current?: boolean
}

export function V3PageHero({
  breadcrumbs,
  eyebrowBadges,
  title,
  description,
  actions,
  compact = false,
  className,
}: {
  breadcrumbs?: HeroBreadcrumbItem[]
  eyebrowBadges?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <section
      className={cn(
        "relative -mx-4 border-b border-eos-border bg-gradient-to-b from-white/[0.02] to-transparent md:-mx-6 lg:-mx-8",
        compact ? "px-4 pb-4 pt-5 md:px-6 lg:px-8" : "px-4 pb-5 pt-6 md:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 max-w-3xl">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
            >
              {breadcrumbs.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-white/10">/</span>}
                  <span className={cn(item.current ? "text-eos-text-muted" : undefined)}>{item.label}</span>
                </span>
              ))}
            </nav>
          )}
          {eyebrowBadges && <div className="mb-2 flex flex-wrap items-center gap-2">{eyebrowBadges}</div>}
          <h1
            data-display-text="true"
            className={cn(
              "font-display font-semibold text-eos-text",
              compact
                ? "text-[22px] leading-[1.15] tracking-[-0.025em]"
                : "text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "mt-2 max-w-2xl leading-relaxed text-eos-text-muted",
                compact ? "text-[12.5px]" : "text-[13.5px]"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  )
}
