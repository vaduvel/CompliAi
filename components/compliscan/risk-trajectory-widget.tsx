"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingDown, TrendingUp, Minus, ArrowRight, Loader2 } from "lucide-react"

import type { RiskTrajectory } from "@/lib/compliance/risk-trajectory"

export function RiskTrajectoryWidget() {
  const [data, setData] = useState<RiskTrajectory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/risk/trajectory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d as RiskTrajectory) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-2.5">
        <Loader2 className="size-3.5 animate-spin text-eos-text-muted" />
        <span className="font-mono text-[11px] text-eos-text-muted">Calculez trajectoria de risc…</span>
      </div>
    )
  }

  if (!data || data.trajectory.length === 0) return null

  const score30 = data.trajectory.find((t) => t.daysFromNow === 30)
  const delta = score30 ? Math.round(score30.predictedScore - data.currentScore) : 0

  const TrendIcon =
    data.trend === "improving" ? TrendingUp : data.trend === "degrading" ? TrendingDown : Minus
  const trendColor =
    data.trend === "improving"
      ? "text-eos-success"
      : data.trend === "degrading"
        ? "text-eos-error"
        : "text-eos-text-muted"
  const stripeColor =
    data.trend === "degrading" ? "bg-eos-warning" : data.trend === "improving" ? "bg-eos-success" : "bg-eos-primary"

  return (
    <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${stripeColor}`} aria-hidden />
      <header className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <TrendIcon className={`size-3.5 ${trendColor}`} strokeWidth={2} />
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Trajectorie risc
          </p>
        </div>
        <span className={`font-mono text-[11px] font-semibold uppercase tracking-[0.06em] ${trendColor}`}>
          {data.trend === "improving" ? "Îmbunătățire" : data.trend === "degrading" ? "Degradare" : "Stabil"}
        </span>
      </header>

      <div className="space-y-3 px-4 py-3">
        {/* Score now → 30 days */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p
              data-display-text="true"
              className="font-display text-[22px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
            >
              {data.currentScore}
            </p>
            <p className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              acum
            </p>
          </div>
          <div className="flex flex-1 items-end gap-1">
            {data.trajectory.map((point) => {
              const height = Math.max(16, (point.predictedScore / 100) * 36)
              const barColor =
                point.predictedScore >= data.currentScore - 5 ? "bg-eos-primary/40" : "bg-eos-error/40"
              return (
                <div key={point.daysFromNow} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`w-full rounded-sm ${barColor}`} style={{ height: `${height}px` }} />
                  <span className="font-mono text-[9px] text-eos-text-tertiary">{point.daysFromNow}z</span>
                </div>
              )
            })}
          </div>
          {score30 && (
            <div className="text-center">
              <p
                data-display-text="true"
                className={`font-display text-[22px] font-medium leading-none tabular-nums tracking-[-0.025em] ${delta < -5 ? "text-eos-error" : "text-eos-text"}`}
              >
                {score30.predictedScore}
              </p>
              <p className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                30 zile
              </p>
            </div>
          )}
        </div>

        {/* Top risks */}
        {data.iminentRisks.length > 0 && (
          <div className="space-y-1.5 border-t border-eos-border-subtle pt-3">
            {data.iminentRisks.slice(0, 3).map((risk) => (
              <div key={risk.id} className="flex items-start gap-2 text-[12.5px]">
                <span
                  className={`mt-[7px] size-1.5 shrink-0 rounded-full ${
                    risk.triggerDaysFromNow <= 7 ? "bg-eos-error" : "bg-eos-border-strong"
                  }`}
                  aria-hidden
                />
                <span className="flex-1 leading-snug text-eos-text">{risk.label}</span>
                {risk.preventionHref && (
                  <Link
                    href={risk.preventionHref}
                    className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-primary hover:underline"
                  >
                    acționează
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-eos-border-subtle pt-2.5">
          <p className="font-mono text-[10.5px] text-eos-text-muted">{data.summaryLabel}</p>
          <Link
            href="/dashboard/agents"
            className="flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-eos-primary hover:text-eos-text"
          >
            Vezi agenți
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
