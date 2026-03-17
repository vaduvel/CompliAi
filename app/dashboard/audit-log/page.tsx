"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Card } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import type { ComplianceEvent } from "@/lib/compliance/types"

// ─── Event display config ─────────────────────────────────────────────────────

const EVENT_ICON: Record<string, React.ElementType> = {
  "task.updated":          CheckCircle2,
  "task.validated":        ShieldCheck,
  "task.evidence-attached": FileText,
  "alert.auto-resolved":   CheckCircle2,
  "alert.reopened":        AlertTriangle,
  "drift.detected":        AlertTriangle,
  "drift.auto-resolved":   CheckCircle2,
  "drift.sla-breached":    AlertTriangle,
  "drift.reopened":        AlertTriangle,
}

const EVENT_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" | "secondary" }> = {
  "task.updated":           { label: "task",    variant: "default" },
  "task.validated":         { label: "validat", variant: "success" },
  "task.evidence-attached": { label: "dovadă",  variant: "default" },
  "alert.auto-resolved":    { label: "alertă",  variant: "success" },
  "alert.reopened":         { label: "alertă",  variant: "warning" },
  "drift.detected":         { label: "drift",   variant: "warning" },
  "drift.auto-resolved":    { label: "drift",   variant: "success" },
  "drift.sla-breached":     { label: "SLA",     variant: "destructive" },
  "drift.reopened":         { label: "drift",   variant: "warning" },
}

function formatEventDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [events, setEvents] = useState<ComplianceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "task" | "drift" | "alert">("all")

  async function fetchLog() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/audit-log", { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut incarca log-ul.")
      const data = (await res.json()) as { events: ComplianceEvent[] }
      setEvents(data.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchLog() }, [])

  if (error) return <ErrorScreen message={error} variant="section" />
  if (loading) return <LoadingScreen variant="section" />

  const filtered = filter === "all"
    ? events
    : events.filter((e) => e.entityType === filter)

  const taskCount  = events.filter((e) => e.entityType === "task").length
  const driftCount = events.filter((e) => e.entityType === "drift").length
  const alertCount = events.filter((e) => e.entityType === "alert").length

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Audit"
        title="Log de audit"
        description="Toate actiunile inregistrate in sistem — task-uri, dovezi, drift-uri, alerte. Imutabil si exportabil."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {events.length} evenimente
            </Badge>
            <Badge dot variant={events.length > 0 ? "success" : "secondary"} className="normal-case tracking-normal">
              {events.length > 0 ? "Log activ" : "Fara date"}
            </Badge>
          </>
        }
      />

      {/* ── Sumar rapid ── */}
      <div className="grid grid-cols-2 divide-x divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-4">
        {[
          { label: "Total evenimente", value: events.length },
          { label: "Task-uri",         value: taskCount },
          { label: "Drift-uri",        value: driftCount },
          { label: "Alerte",           value: alertCount },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5 px-5 py-3.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
              {m.label}
            </span>
            <span className="text-lg font-semibold text-eos-text">{m.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filtre + Refresh ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "task", "drift", "alert"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toate" : f === "task" ? "Task-uri" : f === "drift" ? "Drift-uri" : "Alerte"}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={() => void fetchLog()} className="gap-2">
          <RefreshCw className="size-3.5" strokeWidth={2} />
          Actualizează
        </Button>
      </div>

      {/* ── Lista evenimente ── */}
      <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
        {filtered.length === 0 ? (
          <EmptyState
            title="Niciun eveniment"
            label="Actiunile din sistem vor aparea aici pe masura ce apar."
            className="px-5 py-10"
            icon={Activity}
          />
        ) : (
          filtered.map((event) => {
            const Icon = EVENT_ICON[event.type] ?? Zap
            const badge = EVENT_BADGE[event.type] ?? { label: event.entityType, variant: "secondary" as const }
            return (
              <DenseListItem key={event.id}>
                <div className="flex items-start gap-3 px-5 py-3">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-eos-md border border-eos-border bg-eos-surface-variant">
                    <Icon className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={badge.variant} className="text-[10px] normal-case tracking-normal">
                        {badge.label}
                      </Badge>
                      <span className="text-xs text-eos-text-muted font-mono">{event.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-eos-text">{event.message}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-eos-text-muted">
                      <span>{formatEventDate(event.createdAtISO)}</span>
                      {event.actorLabel && (
                        <span>· {event.actorLabel}</span>
                      )}
                      {event.actorRole && (
                        <span>· {event.actorRole}</span>
                      )}
                    </div>
                  </div>
                </div>
              </DenseListItem>
            )
          })
        )}
      </Card>
    </div>
  )
}
