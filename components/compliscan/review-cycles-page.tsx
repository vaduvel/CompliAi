"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CheckCircle2, ChevronRight, Clock3, Loader2, RefreshCw } from "lucide-react"

import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3KpiStrip, type V3KpiItem } from "@/components/compliscan/v3/kpi-strip"
import { V3FilterBar, type V3FilterTab } from "@/components/compliscan/v3/filter-bar"

type ReviewCycleStatus = "upcoming" | "due" | "overdue" | "completed"

type ReviewCycleItem = {
  id: string
  findingId: string
  findingTypeId: string | null
  reviewType: "scheduled" | "drift_triggered" | "expiry_triggered" | "manual"
  status: ReviewCycleStatus
  scheduledAt: string
  completedAt: string | null
  notes: string | null
  triggerType?: string
  triggerDetail?: string
  findingTitle: string
  findingStatus: string | null
  href: string
  isOverdue: boolean
}

type Payload = {
  items: ReviewCycleItem[]
  summary: {
    total: number
    upcoming: number
    due: number
    overdue: number
    completed: number
  }
}

type FilterId = ReviewCycleStatus | "all"

function typeLabel(type: ReviewCycleItem["reviewType"]) {
  switch (type) {
    case "drift_triggered":
      return "drift"
    case "expiry_triggered":
      return "expiry"
    case "manual":
      return "manual"
    default:
      return "scheduled"
  }
}

function StatusPill({ status, isOverdue }: { status: ReviewCycleStatus; isOverdue: boolean }) {
  const tone =
    status === "completed"
      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
      : status === "overdue" || isOverdue
        ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
        : status === "due"
          ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
          : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
  const label =
    status === "completed"
      ? "închis"
      : isOverdue || status === "overdue"
        ? "depășit"
        : status === "due"
          ? "scadent"
          : "programat"
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.05em] ${tone}`}
    >
      {label}
    </span>
  )
}

function TypePill({ type }: { type: ReviewCycleItem["reviewType"] }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-eos-text-tertiary">
      {typeLabel(type)}
    </span>
  )
}

export function ReviewCyclesPage() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [filter, setFilter] = useState<FilterId>("all")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/review-cycles", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Nu am putut încărca review-urile programate.")
      }
      const nextPayload = (await response.json()) as Payload
      setPayload(nextPayload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nu am putut încărca review-urile programate.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const items = useMemo(() => {
    const all = payload?.items ?? []
    if (filter === "all") return all
    return all.filter((item) => {
      if (filter === "overdue") return item.status === "overdue" || item.isOverdue
      return item.status === filter
    })
  }, [payload, filter])

  const tabs: V3FilterTab<FilterId>[] = [
    { id: "all", label: "Toate", count: payload?.summary.total ?? 0 },
    { id: "upcoming", label: "Programate", count: payload?.summary.upcoming ?? 0 },
    { id: "due", label: "Scadente", count: payload?.summary.due ?? 0 },
    { id: "overdue", label: "Depășite", count: payload?.summary.overdue ?? 0 },
    { id: "completed", label: "Închise", count: payload?.summary.completed ?? 0 },
  ]

  const kpiItems: V3KpiItem[] = [
    { id: "upcoming", label: "Programate", value: payload?.summary.upcoming ?? 0 },
    {
      id: "due",
      label: "Scadente",
      value: payload?.summary.due ?? 0,
      stripe: (payload?.summary.due ?? 0) > 0 ? "warning" : undefined,
      valueTone: (payload?.summary.due ?? 0) > 0 ? "warning" : "neutral",
    },
    {
      id: "overdue",
      label: "Depășite",
      value: payload?.summary.overdue ?? 0,
      stripe: (payload?.summary.overdue ?? 0) > 0 ? "critical" : undefined,
      valueTone: (payload?.summary.overdue ?? 0) > 0 ? "critical" : "neutral",
    },
    {
      id: "completed",
      label: "Închise",
      value: payload?.summary.completed ?? 0,
      valueTone: "success",
    },
  ]

  async function completeCycle(item: ReviewCycleItem) {
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/review-cycles/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete: true, outcome: "review_completed" }),
      })
      if (!response.ok) {
        throw new Error("Nu am putut marca review-ul ca finalizat.")
      }
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nu am putut marca review-ul.")
    } finally {
      setBusyId(null)
    }
  }

  async function postponeCycle(item: ReviewCycleItem, days: number) {
    setBusyId(item.id)
    try {
      const next = new Date(item.scheduledAt)
      next.setUTCDate(next.getUTCDate() + days)
      const response = await fetch(`/api/review-cycles/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: next.toISOString() }),
      })
      if (!response.ok) {
        throw new Error("Nu am putut reprograma review-ul.")
      }
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nu am putut reprograma review-ul.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Monitorizare" }, { label: "Review cycles", current: true }]}
        title="Reverificări și cazuri intrate din nou în lucru"
        description="Aici vezi tot ce a intrat în monitorizare, ce cere reverificare și ce poate redeschide automat finding-uri."
        eyebrowBadges={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-sm border border-eos-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              {payload?.summary.total ?? 0} review-uri
            </span>
            {(payload?.summary.overdue ?? 0) > 0 && (
              <span className="inline-flex items-center rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
                {payload?.summary.overdue} depășite
              </span>
            )}
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
          >
            <RefreshCw className="size-3.5" strokeWidth={2} />
            Reîncarcă
          </button>
        }
      />

      <V3KpiStrip items={kpiItems} />

      <div className="overflow-hidden rounded-eos-lg border border-eos-border">
        <V3FilterBar<FilterId> tabs={tabs} activeTab={filter} onTabChange={setFilter} />
      </div>

      {error ? (
        <div className="rounded-eos-lg border border-eos-error/20 bg-eos-error-soft/50 p-4 text-[12.5px] text-eos-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-eos-lg bg-eos-surface-variant" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface py-12 text-center">
          <CalendarClock className="size-10 text-eos-text-tertiary" strokeWidth={1.5} />
          <div className="space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
            >
              Niciun review activ
            </p>
            <p className="text-[12.5px] text-eos-text-muted">
              Review-urile apar automat când un finding intră în monitorizare sau când drift-ul cere reverificare.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const severityStripe =
              item.status === "completed"
                ? "bg-eos-success"
                : item.isOverdue || item.status === "overdue"
                  ? "bg-eos-error"
                  : item.status === "due"
                    ? "bg-eos-warning"
                    : "bg-eos-primary/60"
            return (
              <section
                key={item.id}
                className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${severityStripe}`} aria-hidden />
                <header className="border-b border-eos-border-subtle px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        data-display-text="true"
                        className="font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
                      >
                        {item.findingTitle}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                        {new Date(item.scheduledAt).toLocaleString("ro-RO")} · finding {item.findingTypeId ?? item.findingId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusPill status={item.status} isOverdue={item.isOverdue} />
                      <TypePill type={item.reviewType} />
                    </div>
                  </div>
                </header>
                <div className="space-y-3 px-4 py-3.5">
                  {item.triggerDetail || item.notes ? (
                    <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] px-3 py-2.5 text-[12.5px] leading-[1.5] text-eos-text-muted">
                      {item.triggerDetail ?? item.notes}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={item.href}
                      className="flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
                    >
                      Deschide findingul
                      <ChevronRight className="size-3.5" strokeWidth={2} />
                    </Link>
                    {item.status !== "completed" ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void postponeCycle(item, 7)}
                          className="flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:opacity-40"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                          ) : (
                            <Clock3 className="size-3.5" strokeWidth={2} />
                          )}
                          Amână 7 zile
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void completeCycle(item)}
                          className="flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-primary bg-eos-primary px-2.5 text-[12px] font-semibold text-white transition hover:bg-eos-primary-hover disabled:opacity-40"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                          ) : (
                            <CheckCircle2 className="size-3.5" strokeWidth={2} />
                          )}
                          Marchează completat
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
