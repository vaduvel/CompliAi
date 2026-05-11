import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { V3FrameworkTag, V3RiskPill, type V3SeverityTone } from "./finding-row"

/**
 * V3 Framework Coverage Card — panel cu:
 *  ▸ framework tag + risk pill stivuite
 *  ▸ procentaj mare (display font, tabular nums)
 *  ▸ progress bar 4px colorat după severity
 *  ▸ footer: findings deschise + deadline (opțional)
 *
 * Pattern frozen: din `screen-context-client.jsx` — FrameworkCoverageCard.
 */
const BAR_TONE: Record<V3SeverityTone, string> = {
  critical: "bg-eos-error",
  high: "bg-eos-warning",
  medium: "bg-eos-primary/70",
  low: "bg-eos-border-strong",
  info: "bg-eos-primary",
  ok: "bg-eos-success",
}

const VALUE_TONE: Record<V3SeverityTone, string> = {
  critical: "text-eos-error",
  high: "text-eos-warning",
  medium: "text-eos-primary",
  low: "text-eos-text",
  info: "text-eos-primary",
  ok: "text-eos-success",
}

const RISK_LABEL: Record<V3SeverityTone, string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
  low: "Scăzut",
  info: "Info",
  ok: "OK",
}

export function V3FrameworkCoverageCard({
  framework,
  coveragePercent,
  tone,
  riskLabel,
  findingsOpen,
  deadline,
  unit = "%",
  description,
  action,
  className,
}: {
  framework: ReactNode
  coveragePercent: number
  tone: V3SeverityTone
  riskLabel?: ReactNode
  findingsOpen?: number
  deadline?: ReactNode
  unit?: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, coveragePercent))

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface transition-colors duration-150 hover:border-eos-border-strong",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <V3FrameworkTag tone={tone} label={framework} />
          <V3RiskPill tone={tone}>{riskLabel ?? RISK_LABEL[tone]}</V3RiskPill>
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "font-display text-[26px] font-medium leading-none tabular-nums tracking-[-0.025em]",
              VALUE_TONE[tone]
            )}
          >
            {clamped}
          </span>
          {unit && (
            <span className="text-[13px] text-eos-text-tertiary">{unit}</span>
          )}
        </div>
        <p className="font-mono text-[10.5px] leading-tight text-eos-text-muted">
          {description ?? "acoperire implementată"}
        </p>
      </div>

      <div className="h-1 w-full bg-eos-border-strong/30" aria-hidden>
        <div className={cn("h-full", BAR_TONE[tone])} style={{ width: `${clamped}%` }} />
      </div>

      {(typeof findingsOpen === "number" || deadline || action) && (
        <div className="flex items-center gap-3 border-t border-eos-border px-4 py-2.5 font-mono text-[10.5px] text-eos-text-muted">
          {typeof findingsOpen === "number" && (
            <span>
              <span className="font-bold tabular-nums text-eos-text">{findingsOpen}</span>{" "}
              findings deschise
            </span>
          )}
          {deadline && (
            <span className="text-eos-error">· deadline {deadline}</span>
          )}
          {action && <span className="ml-auto">{action}</span>}
        </div>
      )}
    </article>
  )
}
