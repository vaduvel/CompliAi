"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Badge } from "@/components/evidence-os/Badge"
import type { CalendarEvent, CalendarEventGroup } from "@/app/api/dashboard/calendar/route"

type CalendarData = {
  events: CalendarEvent[]
  grouped: Record<CalendarEventGroup, CalendarEvent[]>
  total: number
  overdueCount: number
  todayCount: number
  thisWeekCount: number
}

const GROUP_LABELS: Record<CalendarEventGroup, string> = {
  overdue: "Depășite",
  today: "Azi",
  "this-week": "Săptămâna aceasta",
  "this-month": "Luna aceasta",
  later: "Ulterior",
}

const GROUP_ORDER: CalendarEventGroup[] = ["overdue", "today", "this-week", "this-month", "later"]

const TYPE_LABELS: Record<string, string> = {
  "dsar-deadline": "DSAR",
  "nis2-early-warning": "NIS2 · 24h",
  "nis2-72h": "NIS2 · 72h",
  "nis2-final": "NIS2 · Final",
  "anspdcp-breach": "ANSPDCP",
  "vendor-revalidation": "Vendor",
  "vendor-overdue": "Vendor",
}

function severityColors(severity: CalendarEvent["severity"]) {
  if (severity === "critical") return "bg-eos-error-soft text-eos-error border-eos-error/20"
  if (severity === "high") return "bg-eos-warning-soft text-eos-warning border-eos-warning/20"
  if (severity === "medium") return "bg-eos-primary-soft text-eos-primary border-eos-primary/20"
  return "bg-eos-surface-variant text-eos-text-muted border-eos-border"
}

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-eos-error">
        <AlertTriangle className="size-3" strokeWidth={2} />
        Depășit cu {Math.abs(days)}z
      </span>
    )
  if (days === 0)
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-eos-error">
        <Clock className="size-3" strokeWidth={2} />
        Azi
      </span>
    )
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${days <= 3 ? "text-eos-error" : days <= 7 ? "text-eos-warning" : "text-eos-text-muted"}`}>
      <Clock className="size-3" strokeWidth={2} />
      {days}z rămase
    </span>
  )
}

function EventCard({ event }: { event: CalendarEvent }) {
  const dateLabel = new Date(event.deadlineISO).toLocaleDateString("ro-RO", {
    day: "numeric", month: "short", year: "numeric",
  })
  const calBorderL =
    event.severity === "critical" || event.severity === "high"
      ? "border-l-[3px] border-l-eos-error"
      : event.severity === "medium"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"
  const calUrgentBg =
    event.daysLeft < 0 && (event.severity === "critical" || event.severity === "high")
      ? "bg-eos-error-soft/30 border-eos-error/20"
      : "bg-eos-surface border-eos-border"
  return (
    <Link
      href={event.href}
      className={`flex items-start gap-3 rounded-eos-md border ${calBorderL} ${calUrgentBg} p-3 hover:bg-eos-surface-variant transition-colors`}
    >
      <div className="mt-0.5 flex flex-col items-center gap-1">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityColors(event.severity)}`}>
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-eos-text">{event.title}</p>
        <p className="text-xs text-eos-text-muted">{event.detail}</p>
        {event.legalBasis && (
          <p className="text-[11px] text-eos-text-muted opacity-70">{event.legalBasis}</p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-1">
        <DaysLeftBadge days={event.daysLeft} />
        <p className="text-[11px] text-eos-text-muted">{dateLabel}</p>
      </div>
    </Link>
  )
}

function GroupSection({ group, events }: { group: CalendarEventGroup; events: CalendarEvent[] }) {
  if (events.length === 0) return null
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        {group === "overdue" && <AlertTriangle className="size-4 text-eos-error" strokeWidth={2} />}
        {group === "today" && <Clock className="size-4 text-eos-warning" strokeWidth={2} />}
        {(group === "this-week" || group === "this-month" || group === "later") && (
          <Calendar className="size-4 text-eos-text-muted" strokeWidth={2} />
        )}
        <p className={`text-[11px] font-medium uppercase tracking-[0.2em] ${group === "overdue" ? "text-eos-error" : "text-eos-text-muted"}`}>
          {GROUP_LABELS[group]} · {events.length}
        </p>
      </div>
      <div className="space-y-2">
        {events.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </section>
  )
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minute

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = () => {
    fetch("/api/dashboard/calendar")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLastUpdated(new Date()) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasEvents = data && data.total > 0

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Calendar conformitate"
        title="Ce arde — deadlines active"
        description="Toate termenele din DSAR, NIS2, ANSPDCP și Vendor Review într-un singur loc. Fără să vanezi prin pagini."
        badges={
          <>
            {data?.overdueCount ? (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {data.overdueCount} depășite
              </Badge>
            ) : null}
            {data?.todayCount ? (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {data.todayCount} azi
              </Badge>
            ) : null}
            {data?.thisWeekCount ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                {data.thisWeekCount} săptămâna asta
              </Badge>
            ) : null}
            {lastUpdated && (
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center gap-1 text-xs text-eos-text-muted hover:text-eos-text"
                title="Actualizează manual"
              >
                <RefreshCw className="size-3" strokeWidth={2} />
                {lastUpdated.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
              </button>
            )}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/review">Review-uri programate</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/dashboard/setari/scheduled-reports">Rapoarte programate</Link>
            </Button>
          </>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-eos-md bg-eos-surface-variant" />
          ))}
        </div>
      )}

      {!loading && !hasEvents && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-eos-success" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-base font-medium text-eos-text">Niciun deadline activ</p>
              <p className="text-sm text-eos-text-muted">
                Deadlines-urile apar automat când ai cereri DSAR active, incidente NIS2, notificări ANSPDCP sau vendori care cer revalidare.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild className="gap-2">
                <Link href="/dashboard/scan">Scanează primul document</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/actiuni/remediere">Deschide De rezolvat</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && hasEvents && (
        <div className="space-y-6">
          {GROUP_ORDER.map((group) => (
            <GroupSection
              key={group}
              group={group}
              events={data.grouped[group]}
            />
          ))}
        </div>
      )}

      {/* Summary card */}
      {!loading && data && data.total > 0 && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-eos-text-muted">Surse monitorizate</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs text-eos-text-muted sm:grid-cols-4">
            <div>DSAR · GDPR Art. 12</div>
            <div>NIS2 · Art. 23 (24h/72h)</div>
            <div>ANSPDCP · GDPR Art. 33</div>
            <div>Vendor Review DPA</div>
            <div>Review cycles · monitorizare</div>
            <div>Scheduled reports · handoff partener</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
