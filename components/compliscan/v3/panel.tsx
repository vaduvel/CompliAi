import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function V3Panel({
  eyebrow,
  title,
  action,
  children,
  padding = "default",
  className,
}: {
  eyebrow?: ReactNode
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  padding?: "default" | "none" | "tight"
  className?: string
}) {
  const pad =
    padding === "none"
      ? ""
      : padding === "tight"
        ? "px-3.5 py-3"
        : "px-4 py-4"
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface",
        pad,
        className
      )}
    >
      {(eyebrow || title || action) && (
        <header className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                {eyebrow}
              </p>
            )}
            {title && (
              <h3
                data-display-text="true"
                className="mt-0.5 font-display text-[14px] font-semibold leading-tight tracking-[-0.01em] text-eos-text"
              >
                {title}
              </h3>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </header>
      )}
      <div className="text-[13px] leading-[1.55] text-eos-text-muted">{children}</div>
    </section>
  )
}

export function V3PanelDivider() {
  return <div className="my-3 h-px w-full bg-eos-border-subtle" aria-hidden />
}
