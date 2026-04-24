import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type V3SeverityTone = "critical" | "high" | "medium" | "low" | "info" | "ok"

const SEVERITY_BAR: Record<V3SeverityTone, string> = {
  critical: "bg-eos-error",
  high: "bg-eos-warning",
  medium: "bg-eos-primary/70",
  low: "bg-eos-border-strong",
  info: "bg-eos-primary",
  ok: "bg-eos-success",
}

export function V3FindingRow({
  href,
  onClick,
  severity,
  title,
  subtitle,
  meta,
  badges,
  ctaLabel,
  trailing,
}: {
  href?: string
  onClick?: () => void
  severity: V3SeverityTone
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  badges?: ReactNode
  ctaLabel?: ReactNode
  trailing?: ReactNode
}) {
  const body = (
    <article
      className={cn(
        "group relative flex items-stretch overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface transition-all duration-150",
        "hover:border-eos-border-strong hover:bg-white/[0.02]"
      )}
    >
      <span
        className={cn("absolute left-0 top-0 bottom-0 w-[3px]", SEVERITY_BAR[severity])}
        aria-hidden
      />
      <div className="flex w-full items-center gap-3 py-3 pl-5 pr-3 md:gap-4 md:pr-4">
        <div className="min-w-0 flex-1 space-y-1">
          {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
          <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
            {title}
          </p>
          {subtitle && (
            <p className="line-clamp-2 text-[12px] leading-[1.5] text-eos-text-muted">{subtitle}</p>
          )}
          {meta && (
            <p className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-eos-text-muted">
              {meta}
            </p>
          )}
        </div>
        {trailing}
        {ctaLabel && (
          <span
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 text-[12px] font-semibold text-eos-text-muted transition-all duration-100",
              "group-hover:border-transparent group-hover:bg-eos-primary group-hover:text-white"
            )}
          >
            {ctaLabel}
            <ChevronRight className="size-3.5" strokeWidth={2.5} />
          </span>
        )}
      </div>
    </article>
  )

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block">
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  )
}

export function V3FrameworkTag({
  label,
  count,
  tone = "neutral",
  className,
}: {
  label: ReactNode
  count?: ReactNode
  tone?: V3SeverityTone | "neutral"
  className?: string
}) {
  const toneClass = {
    critical: "border-eos-error/25 bg-eos-error-soft text-eos-error",
    high: "border-eos-warning/25 bg-eos-warning-soft text-eos-warning",
    medium: "border-eos-primary/25 bg-eos-primary/10 text-eos-primary",
    low: "border-eos-border-subtle bg-white/[0.04] text-eos-text-muted",
    info: "border-eos-primary/25 bg-eos-primary/10 text-eos-primary",
    ok: "border-eos-success/25 bg-eos-success-soft text-eos-success",
    neutral: "border-eos-border-subtle bg-white/[0.04] text-eos-text-muted",
  }[tone]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]",
        toneClass,
        className
      )}
    >
      <span>{label}</span>
      {count !== undefined && count !== null && (
        <>
          <span className="mx-0.5 h-3 w-px bg-current opacity-30" aria-hidden />
          <span className="font-bold tabular-nums">{count}</span>
        </>
      )}
    </span>
  )
}

export function V3RiskPill({
  tone,
  children,
  className,
}: {
  tone: V3SeverityTone
  children: ReactNode
  className?: string
}) {
  const toneClass = {
    critical: "border-eos-error/35 bg-eos-error-soft text-eos-error",
    high: "border-eos-warning/35 bg-eos-warning-soft text-eos-warning",
    medium: "border-eos-primary/35 bg-eos-primary/10 text-eos-primary",
    low: "border-eos-border-subtle bg-white/[0.04] text-eos-text-muted",
    info: "border-eos-primary/35 bg-eos-primary/10 text-eos-primary",
    ok: "border-eos-success/35 bg-eos-success-soft text-eos-success",
  }[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[2px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em]",
        toneClass,
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", SEVERITY_BAR[tone])}
        aria-hidden
      />
      {children}
    </span>
  )
}
