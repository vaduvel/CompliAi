"use client"

// Sprint Calendar-Auto — Portfolio cross-client calendar aggregation.
// Cabinetul fiscal vede într-un singur ecran toate termenele aplicabile pe
// întreg portofoliul: D300 Mai cu N clienți, D406 Q1 cu M clienți, etc.
// Sortat după dueISO + grupat per termen pentru priorități clare.

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

type ClientCalendarRow = {
  orgId: string
  orgName: string
  record: {
    id: string
    type: string
    period: string
    status: string
    dueISO: string
    ruleCode: string
    legalReference: string
  }
  daysUntil: number
  urgency: "overdue" | "critical" | "soon" | "future" | "filed"
}

type GroupedDeadline = {
  ruleCode: string
  filingType: string
  period: string
  dueISO: string
  daysUntil: number
  urgency: "overdue" | "critical" | "soon" | "future"
  clients: Array<{ orgId: string; orgName: string; filingId: string; status: string }>
}

type PortfolioCalendarResponse = {
  ok: boolean
  scannedAtISO: string
  summary: {
    totalClients: number
    clientsWithProfile: number
    clientsSkipped: number
    totalDeadlines: number
    overdueCount: number
    criticalCount: number
    soonCount: number
  }
  rows: ClientCalendarRow[]
  grouped: GroupedDeadline[]
  topUrgent: ClientCalendarRow[]
}

const FILING_TYPE_LABELS: Record<string, string> = {
  d300_tva: "D300 Decont TVA",
  d394_local: "D394 Achiziții/livrări",
  d390_recap: "D390 Recapitulativă UE",
  saft: "D406 SAF-T",
  efactura_monthly: "Raport e-Factura B2C",
  etva_precompletata: "e-TVA precompletată",
}

const URGENCY_TONE: Record<string, string> = {
  overdue: "border-eos-error/40 bg-eos-error-soft text-eos-error",
  critical: "border-eos-warning/40 bg-eos-warning-soft text-eos-warning",
  soon: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  future: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

const URGENCY_LABEL: Record<string, string> = {
  overdue: "RESTANT",
  critical: "≤3 zile",
  soon: "≤7 zile",
  future: "Viitor",
}

export function PortfolioCalendarPanel() {
  const [data, setData] = useState<PortfolioCalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grouped" | "rows">("grouped")

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/portfolio/fiscal-calendar", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca calendarul portofoliului.")
        return
      }
      setData((await res.json()) as PortfolioCalendarResponse)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
        <div className="flex items-center gap-2 text-[12.5px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Agregez calendarul cross-client…
        </div>
      </section>
    )
  }

  if (!data) return null

  const { summary, grouped, rows } = data
  const hasActiveDeadlines = grouped.length > 0

  return (
    <section className="space-y-4">
      {/* Provenance + summary */}
      <div className="rounded-eos-lg border border-eos-primary/25 bg-eos-primary-soft/40 p-4">
        <div className="flex items-start gap-3">
          <Wand2 className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
          <div className="flex-1">
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Calendar fiscal agregat — {summary.clientsWithProfile}/
              {summary.totalClients} clienți
            </p>
            <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
              Generat din profilul fiecărui client + 26 reguli ANAF.{" "}
              {summary.clientsSkipped > 0 && (
                <span className="text-eos-warning">
                  {summary.clientsSkipped} clienți fără profil completat (skip).
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CountTile
          label="Restante"
          count={summary.overdueCount}
          tone="critical"
          icon={<XCircle className="size-4" strokeWidth={2} />}
        />
        <CountTile
          label="Critice (≤3 zile)"
          count={summary.criticalCount}
          tone="high"
          icon={<AlertTriangle className="size-4" strokeWidth={2} />}
        />
        <CountTile
          label="În curând (≤7 zile)"
          count={summary.soonCount}
          tone="warning"
          icon={<Clock className="size-4" strokeWidth={2} />}
        />
        <CountTile
          label="Total active"
          count={summary.totalDeadlines}
          tone="info"
          icon={<Sparkles className="size-4" strokeWidth={2} />}
        />
      </div>

      {/* Top urgent panel */}
      {data.topUrgent.length > 0 && (
        <div className="rounded-eos-lg border border-eos-error/30 bg-eos-error-soft/50 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-eos-error" strokeWidth={2} />
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Acțiune urgentă — top {data.topUrgent.length}
            </p>
          </div>
          <ul className="mt-3 space-y-1.5">
            {data.topUrgent.map((row) => (
              <li
                key={`${row.orgId}-${row.record.id}`}
                className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-[12px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-eos-text">
                    {FILING_TYPE_LABELS[row.record.type] ?? row.record.type}{" "}
                    {row.record.period}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-eos-text-muted">
                    <Building2 className="-mt-0.5 mr-1 inline size-3" strokeWidth={2} />
                    {row.orgName}
                  </p>
                </div>
                <Link
                  href={`/portfolio/client/${row.orgId}`}
                  className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-eos-error hover:text-eos-error-strong"
                >
                  {row.urgency === "overdue"
                    ? `RESTANT cu ${Math.abs(row.daysUntil)} zile`
                    : `${row.daysUntil}z`}
                  <ChevronRight className="size-3" strokeWidth={2.5} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode("grouped")}
          className={`rounded-eos-sm border px-3 py-1.5 text-[11.5px] font-medium transition ${
            viewMode === "grouped"
              ? "border-eos-primary bg-eos-primary text-white"
              : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
          }`}
        >
          Grupat pe termen
        </button>
        <button
          type="button"
          onClick={() => setViewMode("rows")}
          className={`rounded-eos-sm border px-3 py-1.5 text-[11.5px] font-medium transition ${
            viewMode === "rows"
              ? "border-eos-primary bg-eos-primary text-white"
              : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
          }`}
        >
          Listă cronologică
        </button>
      </div>

      {/* Main list */}
      {!hasActiveDeadlines && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-eos-lg border border-eos-success/30 bg-eos-success-soft px-6 py-12 text-center">
          <CheckCircle2 className="size-8 text-eos-success" strokeWidth={1.5} />
          <p className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text">
            Niciun termen activ în portofoliu
          </p>
          <p className="max-w-md text-[12px] text-eos-text-muted">
            Toate termenele active au fost depuse sau nu sunt clienți cu profil
            completat.
          </p>
        </div>
      )}

      {hasActiveDeadlines && viewMode === "grouped" && (
        <ul className="space-y-2">
          {grouped.map((group) => {
            const key = `${group.ruleCode}-${group.period}`
            const isExpanded = expandedKey === key
            return (
              <li
                key={key}
                className={`rounded-eos-lg border bg-eos-surface ${URGENCY_TONE[group.urgency]?.split(" ")[0] ?? "border-eos-border"}`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedKey(isExpanded ? null : key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-eos-text">
                      {FILING_TYPE_LABELS[group.filingType] ?? group.filingType}{" "}
                      <span className="text-eos-text-muted">{group.period}</span>
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-eos-text-muted">
                      Termen{" "}
                      {new Date(group.dueISO).toLocaleDateString("ro-RO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      <strong>
                        {group.clients.length}{" "}
                        {group.clients.length === 1 ? "client" : "clienți"}
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-eos-sm border px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] ${URGENCY_TONE[group.urgency]}`}
                    >
                      {group.urgency === "overdue"
                        ? `RESTANT cu ${Math.abs(group.daysUntil)}z`
                        : `${group.daysUntil}z`}
                    </span>
                    <ChevronRight
                      className={`size-4 text-eos-text-muted transition ${isExpanded ? "rotate-90" : ""}`}
                      strokeWidth={2}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-eos-border bg-eos-surface-elevated px-4 py-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                      Clienți afectați
                    </p>
                    <ul className="mt-2 space-y-1">
                      {group.clients.map((client) => (
                        <li
                          key={client.orgId}
                          className="flex items-center justify-between gap-3 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[12px]"
                        >
                          <span className="flex items-center gap-1.5 truncate text-eos-text">
                            <Building2 className="size-3 shrink-0" strokeWidth={2} />
                            <span className="truncate">{client.orgName}</span>
                          </span>
                          <Link
                            href={`/portfolio/client/${client.orgId}/calendar`}
                            className="shrink-0 text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-eos-primary hover:text-eos-primary-strong"
                          >
                            Deschide →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {hasActiveDeadlines && viewMode === "rows" && (
        <ul className="rounded-eos-lg border border-eos-border bg-eos-surface divide-y divide-eos-border">
          {rows.map((row) => (
            <li key={`${row.orgId}-${row.record.id}`}>
              <Link
                href={`/portfolio/client/${row.orgId}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] hover:bg-eos-surface-elevated"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-eos-text">
                    {FILING_TYPE_LABELS[row.record.type] ?? row.record.type}{" "}
                    {row.record.period}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-eos-text-muted">
                    <Building2 className="-mt-0.5 mr-1 inline size-3" strokeWidth={2} />
                    {row.orgName} · Termen{" "}
                    {new Date(row.record.dueISO).toLocaleDateString("ro-RO")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${URGENCY_TONE[row.urgency]}`}
                >
                  {row.urgency === "overdue"
                    ? `RESTANT ${Math.abs(row.daysUntil)}z`
                    : `${row.daysUntil}z`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ── Sub-component ────────────────────────────────────────────────────────────

function CountTile({
  label,
  count,
  tone,
  icon,
}: {
  label: string
  count: number
  tone: "critical" | "high" | "warning" | "info"
  icon: React.ReactNode
}) {
  const toneClass =
    tone === "critical"
      ? "border-eos-error/40 bg-eos-error-soft text-eos-error"
      : tone === "high"
        ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
        : tone === "warning"
          ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
          : "border-eos-border bg-eos-surface text-eos-text"
  return (
    <div
      className={`flex items-center gap-3 rounded-eos-lg border px-4 py-3 ${toneClass}`}
    >
      {icon}
      <div>
        <p className="font-display text-[22px] font-bold leading-none">{count}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
          {label}
        </p>
      </div>
    </div>
  )
}
