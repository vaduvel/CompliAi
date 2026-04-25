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
      <div className="flex items-center gap-2 rounded-eos-xl border border-eos-border bg-eos-surface-variant px-4 py-3">
        <Loader2 className="size-4 animate-spin text-eos-text-muted" />
        <span className="text-sm text-eos-text-muted">Calculez trajectoria de risc…</span>
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
  const borderColor =
    data.trend === "degrading" ? "border-eos-warning/40 bg-eos-warning-soft/5" : "border-eos-border bg-eos-surface-variant"

  return (
    <div className={`overflow-hidden rounded-eos-xl border ${borderColor}`}>
      <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3.5">
        <div className="flex items-center gap-2">
          <TrendIcon className={`size-4 ${trendColor}`} />
          <p className="text-[10px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-tertiary">
            Trajectorie risc
          </p>
        </div>
        <span className={`text-xs font-medium ${trendColor}`}>
          {data.trend === "improving" ? "Îmbunătățire" : data.trend === "degrading" ? "Degradare" : "Stabil"}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Score now → 30 days */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-eos-text tabular-nums">{data.currentScore}</p>
            <p className="text-[10px] text-eos-text-muted">acum</p>
          </div>
          <div className="flex-1 flex items-center gap-1.5">
            {/* Mini sparkline using flex bars */}
            {data.trajectory.map((point) => {
              const height = Math.max(20, (point.predictedScore / 100) * 40)
              const barColor =
                point.predictedScore >= data.currentScore - 5
                  ? "bg-eos-primary/40"
                  : "bg-eos-error/40"
              return (
                <div key={point.daysFromNow} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-sm ${barColor}`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[9px] text-eos-text-tertiary">{point.daysFromNow}z</span>
                </div>
              )
            })}
          </div>
          {score30 && (
            <div className="text-center">
              <p className={`text-2xl font-semibold tabular-nums ${delta < -5 ? "text-eos-error" : "text-eos-text"}`}>
                {score30.predictedScore}
              </p>
              <p className="text-[10px] text-eos-text-muted">30 zile</p>
            </div>
          )}
        </div>

        {/* Top risks */}
        {data.iminentRisks.length > 0 && (
          <div className="space-y-1.5">
            {data.iminentRisks.slice(0, 3).map((risk) => (
              <div key={risk.id} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 shrink-0 text-eos-text-muted">
                  {risk.triggerDaysFromNow <= 7 ? "⚠" : "·"}
                </span>
                <span className="flex-1 text-eos-text leading-tight">{risk.label}</span>
                {risk.preventionHref && (
                  <Link
                    href={risk.preventionHref}
                    className="shrink-0 text-eos-primary hover:underline"
                  >
                    acționează
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-eos-text-muted">{data.summaryLabel}</p>
          <Link
            href="/dashboard/agents"
            className="flex items-center gap-1 text-xs text-eos-primary hover:underline"
          >
            Vezi agenți
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
