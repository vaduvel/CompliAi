"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CheckCircle2, ChevronRight, Clock3, RefreshCw } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"

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

const FILTERS: Array<{ id: ReviewCycleStatus | "all"; label: string }> = [
  { id: "all", label: "Toate" },
  { id: "upcoming", label: "Programate" },
  { id: "due", label: "Scadente" },
  { id: "overdue", label: "Depășite" },
  { id: "completed", label: "Închise" },
]

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

function statusVariant(status: ReviewCycleStatus, isOverdue: boolean) {
  if (status === "completed") return "success" as const
  if (status === "overdue" || isOverdue) return "warning" as const
  if (status === "due") return "warning" as const
  return "outline" as const
}

export function ReviewCyclesPage() {
  const [payload, setPayload] = useState<Payload | null>(null)
  const [filter, setFilter] = useState<ReviewCycleStatus | "all">("all")
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
      <PageIntro
        eyebrow="Review cycles"
        title="Reverificări și cazuri intrate din nou în lucru"
        description="Aici vezi tot ce a intrat în monitorizare, ce cere reverificare și ce poate redeschide automat finding-uri."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {payload?.summary.total ?? 0} review-uri
            </Badge>
            <Badge variant={(payload?.summary.overdue ?? 0) > 0 ? "warning" : "outline"} className="normal-case tracking-normal">
              {payload?.summary.overdue ?? 0} depășite
            </Badge>
          </>
        }
        actions={
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="size-4" strokeWidth={2} />
            Reîncarcă
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Programate" value={String(payload?.summary.upcoming ?? 0)} />
        <Metric label="Scadente" value={String(payload?.summary.due ?? 0)} tone="warning" />
        <Metric label="Depășite" value={String(payload?.summary.overdue ?? 0)} tone="warning" />
        <Metric label="Închise" value={String(payload?.summary.completed ?? 0)} tone="success" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-eos-md border px-3 py-1.5 text-sm transition ${
              filter === item.id
                ? "border-eos-primary bg-eos-primary-soft text-eos-primary"
                : "border-eos-border bg-eos-surface text-eos-text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft/50 p-4 text-sm text-eos-error">
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
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarClock className="size-10 text-eos-text-tertiary" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-base font-medium text-eos-text">Niciun review activ</p>
              <p className="text-sm text-eos-text-muted">
                Review-urile apar automat când un finding intră în monitorizare sau când drift-ul cere reverificare.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-eos-border bg-eos-surface">
              <CardHeader className="border-b border-eos-border pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{item.findingTitle}</CardTitle>
                    <p className="mt-1 text-sm text-eos-text-muted">
                      {new Date(item.scheduledAt).toLocaleString("ro-RO")} · finding {item.findingTypeId ?? item.findingId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusVariant(item.status, item.isOverdue)} className="normal-case tracking-normal">
                      {item.status === "completed"
                        ? "închis"
                        : item.isOverdue || item.status === "overdue"
                          ? "depășit"
                          : item.status === "due"
                            ? "scadent"
                            : "programat"}
                    </Badge>
                    <Badge variant="outline" className="normal-case tracking-normal">
                      {typeLabel(item.reviewType)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {item.triggerDetail || item.notes ? (
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                    {item.triggerDetail ?? item.notes}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={item.href}>
                      Deschide findingul
                      <ChevronRight className="size-4" strokeWidth={2} />
                    </Link>
                  </Button>
                  {item.status !== "completed" ? (
                    <>
                      <Button variant="outline" disabled={busyId === item.id} onClick={() => void postponeCycle(item, 7)}>
                        <Clock3 className="size-4" strokeWidth={2} />
                        Amână 7 zile
                      </Button>
                      <Button disabled={busyId === item.id} onClick={() => void completeCycle(item)}>
                        <CheckCircle2 className="size-4" strokeWidth={2} />
                        Marchează completat
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "warning" | "success"
}) {
  const className =
    tone === "warning"
      ? "text-eos-warning"
      : tone === "success"
        ? "text-eos-success"
        : "text-eos-text"

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${className}`}>{value}</p>
    </div>
  )
}
