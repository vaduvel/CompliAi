"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import type { HealthCheckResult, HealthCheckStatus, HealthCheckItem } from "@/lib/compliance/health-check"

const STATUS_ICON = {
  ok:       CheckCircle2,
  warning:  AlertTriangle,
  critical: XCircle,
} as const

const STATUS_COLOR = {
  ok:       "text-eos-success",
  warning:  "text-eos-warning",
  critical: "text-eos-error",
} as const

const STATUS_BADGE: Record<HealthCheckStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  ok:       "success",
  warning:  "warning",
  critical: "destructive",
}

const STATUS_LABEL: Record<HealthCheckStatus, string> = {
  ok:       "Sănătos",
  warning:  "Atenție",
  critical: "Critic",
}

function HealthItemRow({ item }: { item: HealthCheckItem }) {
  const Icon = STATUS_ICON[item.status]
  const colorClass = STATUS_COLOR[item.status]

  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${colorClass}`} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-eos-text">{item.title}</p>
        <p className="mt-0.5 text-xs text-eos-text-muted">{item.detail}</p>
        {item.daysOverdue != null && item.daysOverdue > 0 && (
          <p className="mt-0.5 text-xs font-medium text-eos-error">
            {item.daysOverdue} zile întârziere
          </p>
        )}
      </div>
      {item.actionHref ? (
        <Link
          href={item.actionHref}
          className="shrink-0 text-xs text-eos-primary hover:underline"
        >
          {item.action}
          <ArrowRight className="ml-0.5 inline size-3" strokeWidth={2} />
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-eos-text-muted">{item.action}</span>
      )}
    </div>
  )
}

export function HealthCheckCard() {
  const [result, setResult] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch("/api/health-check", { cache: "no-store" })
      if (res.ok) {
        const data: HealthCheckResult = await res.json()
        setResult(data)
      }
    } catch {
      // silent fail — dashboard still usable
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <Card className="border-eos-border bg-eos-surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
            Health Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded-eos-md bg-eos-surface-variant" />
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  const criticalItems = result.items.filter((i) => i.status === "critical")
  const warningItems = result.items.filter((i) => i.status === "warning")

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Health Check Conformitate
            </p>
            <CardTitle className="text-base text-eos-text">
              Starea periodică a sistemului
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_BADGE[result.overallStatus]} className="normal-case tracking-normal">
              {STATUS_LABEL[result.overallStatus]} · {result.score}%
            </Badge>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Reîncarcă health check"
              className="rounded-full p-1 text-eos-text-muted hover:bg-eos-surface-variant disabled:opacity-40"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Score bar */}
        <div className="mb-4 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
          <div
            className={`h-full rounded-full transition-all ${
              result.overallStatus === "critical"
                ? "bg-eos-error"
                : result.overallStatus === "warning"
                  ? "bg-eos-warning"
                  : "bg-eos-success"
            }`}
            style={{ width: `${result.score}%` }}
          />
        </div>

        {/* Summary badges */}
        {(criticalItems.length > 0 || warningItems.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {criticalItems.length > 0 && (
              <Badge variant="destructive" className="normal-case tracking-normal text-[11px]">
                {criticalItems.length} critic{criticalItems.length > 1 ? "e" : ""}
              </Badge>
            )}
            {warningItems.length > 0 && (
              <Badge variant="warning" className="normal-case tracking-normal text-[11px]">
                {warningItems.length} avertisment{warningItems.length > 1 ? "e" : ""}
              </Badge>
            )}
          </div>
        )}

        {/* Items list — show criticals + warnings first, then ok */}
        <div className="divide-y divide-eos-border-subtle">
          {[...criticalItems, ...warningItems].map((item) => (
            <HealthItemRow key={item.id} item={item} />
          ))}
          {criticalItems.length === 0 && warningItems.length === 0 && (
            result.items.slice(0, 3).map((item) => (
              <HealthItemRow key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Timestamp */}
        <p className="mt-3 text-right text-[10px] text-eos-text-muted">
          Verificat: {new Date(result.checkedAtISO).toLocaleString("ro-RO", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </CardContent>
    </Card>
  )
}
