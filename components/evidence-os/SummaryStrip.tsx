import * as React from "react"

import { cn } from "@/lib/utils"

type SummaryStripTone = "neutral" | "accent" | "success" | "warning" | "danger"

export interface SummaryStripItem {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  meta?: React.ReactNode
  tone?: SummaryStripTone
}

interface SummaryStripProps {
  eyebrow?: string
  title?: string
  description?: string
  items: SummaryStripItem[]
  className?: string
}

const toneClasses: Record<SummaryStripTone, string> = {
  neutral: "bg-eos-bg-inset",
  accent: "bg-eos-primary-soft",
  success: "bg-eos-success-soft",
  warning: "bg-eos-warning-soft",
  danger: "bg-eos-error-soft",
}

const valueToneClasses: Record<SummaryStripTone, string> = {
  neutral: "text-eos-text",
  accent: "text-eos-primary",
  success: "text-eos-success-text",
  warning: "text-eos-warning-text",
  danger: "text-eos-error-text",
}

export function SummaryStrip({
  eyebrow,
  title,
  description,
  items,
  className,
}: SummaryStripProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {eyebrow || title || description ? (
        <header>
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              {eyebrow}
            </p>
          ) : null}
          {title ? <p className={cn("text-lg font-semibold text-eos-text", eyebrow ? "mt-2" : "")}>{title}</p> : null}
          {description ? (
            <p
              className={cn(
                "max-w-3xl text-sm leading-6 text-eos-text-muted [overflow-wrap:anywhere]",
                title ? "mt-1" : eyebrow ? "mt-2" : ""
              )}
            >
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      <div className="eos-summary-strip-grid">
        {items.map((item, index) => {
          const tone = item.tone ?? "neutral"
          return (
            <div
              key={`${item.label}-${index}`}
              className={cn(
                "rounded-eos-lg border border-eos-border-subtle p-4",
                toneClasses[tone]
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-tertiary">
                  {item.label}
                </p>
                {item.meta ? (
                  <div className="shrink-0 text-xs text-eos-text-muted [overflow-wrap:anywhere]">
                    {item.meta}
                  </div>
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-3 text-sm font-semibold [overflow-wrap:anywhere]",
                  valueToneClasses[tone]
                )}
              >
                {item.value}
              </div>
              {item.hint ? (
                <div className="mt-2 text-xs leading-6 text-eos-text-muted [overflow-wrap:anywhere]">
                  {item.hint}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
