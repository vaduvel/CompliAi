"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react"

import { ImportWizard } from "@/components/compliscan/import-wizard"
import { toast } from "sonner"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { PARTNER_ACCOUNT_PLAN_LABELS, type PartnerAccountPlan } from "@/lib/shared/plan-constants"
import type { PortfolioOverviewClientSummary } from "@/lib/server/portfolio"
import { BATCH_ACTION_LABELS, type BatchActionType, type BatchResult } from "@/lib/compliance/batch-actions"

type ScoreFilter = "all" | "under50" | "50to75" | "over75"
type AlertFilter = "all" | "withAlerts"
type SortKey = "orgName" | "score" | "alerts" | "tasks"
type SortDir = "asc" | "desc"

type PortfolioPlanResponse = {
  planType: PartnerAccountPlan | null
  maxOrgs: number | null
  currentOrgs: number
  canAddOrg: boolean
  partnerPlanSource: "account" | "legacy_org_partner" | "trial"
}

function formatDate(value: string | null | undefined) {
  if (!value) return "fără scanare"
  return new Date(value).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-eos-success" : score >= 40 ? "bg-eos-warning" : "bg-eos-error"
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-eos-surface-elevated">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  )
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
  className = "",
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = currentKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-150 ${
        active ? "text-eos-text-muted" : "text-eos-text-tertiary hover:text-eos-text-muted"
      } ${className}`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="size-3" strokeWidth={2} />
        ) : (
          <ChevronDown className="size-3" strokeWidth={2} />
        )
      ) : (
        <ChevronDown className="size-3 opacity-40" strokeWidth={2} />
      )}
    </button>
  )
}

function ClientRow({
  client,
  onDrillDown,
  selected,
  onToggleSelect,
  onDelete,
}: {
  client: PortfolioOverviewClientSummary
  onDrillDown: (id: string) => void
  selected: boolean
  onToggleSelect: (id: string) => void
  onDelete: (orgId: string) => void
}) {
  const c = client.compliance
  const hasData = c?.hasData ?? false
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/partner/clients/${client.orgId}`, { method: "DELETE" })
      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        toast.error(d.error ?? "Eroare la eliminare.")
        return
      }
      onDelete(client.orgId)
    } catch {
      toast.error("Eroare la eliminare.")
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  return (
    <div
      className={`group flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-eos-surface-variant ${selected ? "bg-eos-primary/5" : ""}`}
      onClick={() => onDrillDown(client.orgId)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onDrillDown(client.orgId)
        }
      }}
      aria-label={`Deschide ${client.orgName}`}
    >
      {/* ── Checkbox ── */}
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(client.orgId)}
          className="size-4 rounded border-eos-border accent-eos-primary"
          aria-label={`Selectează ${client.orgName}`}
        />
      </div>

      {/* ── Org name + last scan ── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-eos-text">{client.orgName}</p>
          <span className="shrink-0 rounded-full bg-eos-surface-elevated px-2 py-0.5 text-[10px] font-medium text-eos-text-tertiary">
            {client.role}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-eos-text-tertiary">
          Ultima scanare: {formatDate(c?.lastScanAtISO)}
        </p>
      </div>

      {/* ── Score ── */}
      <div className="w-28 shrink-0">
        {hasData && c ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-eos-text">{c.score}%</span>
              <span
                className={`text-[10px] font-medium ${
                  c.score >= 70
                    ? "text-eos-success"
                    : c.score >= 40
                      ? "text-eos-warning"
                      : "text-eos-error"
                }`}
              >
                {c.riskLabel}
              </span>
            </div>
            <ScoreBar score={c.score} />
          </div>
        ) : (
          <span className="text-xs text-eos-text-tertiary">fără date</span>
        )}
      </div>

      {/* ── Alerts + tasks + findings ── */}
      <div className="hidden w-36 shrink-0 space-y-1 sm:block">
        {c && hasData ? (
          <>
            <div className="flex items-center gap-1.5 text-xs">
              {c.redAlerts > 0 ? (
                <AlertTriangle className="size-3 shrink-0 text-eos-error" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="size-3 shrink-0 text-eos-success" strokeWidth={2} />
              )}
              <span className="text-eos-text-muted">
                {c.openAlerts} alert{c.openAlerts !== 1 ? "e" : "ă"}
              </span>
            </div>
            <p className="text-xs text-eos-text-tertiary">{c.totalTasks} taskuri active</p>
            <p className="text-xs text-eos-text-tertiary">{c.criticalFindings} findings critice</p>
          </>
        ) : null}
      </div>

      {/* ── Compliance badges ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {c?.efacturaConnected && (c?.efacturaRiskCount ?? 0) === 0 && (
          <span className="rounded-full bg-eos-success-soft px-2 py-0.5 text-[10px] font-medium text-eos-success">
            e-Factura
          </span>
        )}
        {(c?.efacturaRiskCount ?? 0) > 0 && (
          <span className="rounded-full bg-eos-warning-soft px-2 py-0.5 text-[10px] font-medium text-eos-warning">
            {c!.efacturaRiskCount} e-Factura
          </span>
        )}
        {c && c.gdprProgress >= 70 && (
          <span className="rounded-full bg-eos-primary-soft px-2 py-0.5 text-[10px] font-medium text-eos-primary">
            GDPR
          </span>
        )}
        {c && c.highRisk > 0 && (
          <span className="rounded-full bg-eos-error-soft px-2 py-0.5 text-[10px] font-medium text-eos-error">
            {c.highRisk} high-risk AI
          </span>
        )}
        {c?.nis2RescueNeeded && (
          <span className="rounded-full bg-eos-warning-soft px-2 py-0.5 text-[10px] font-medium text-eos-warning">
            NIS2
          </span>
        )}
        {(c?.urgentDsarCount ?? 0) > 0 && (
          <span className="rounded-full bg-eos-error-soft px-2 py-0.5 text-[10px] font-medium text-eos-error">
            {c!.urgentDsarCount} DSAR urgent
          </span>
        )}
        {(c?.activeDsarCount ?? 0) > 0 && (c?.urgentDsarCount ?? 0) === 0 && (
          <span className="rounded-full bg-eos-surface-elevated px-2 py-0.5 text-[10px] font-medium text-eos-text-tertiary">
            {c!.activeDsarCount} DSAR
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onDrillDown(client.orgId)}
          className="rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-1.5 text-xs font-medium text-eos-text-muted transition-all duration-150 hover:border-eos-border-strong hover:bg-eos-surface-elevated hover:text-eos-text"
        >
          Intră în firmă
        </button>
        <a
          href={`/trust/${client.orgId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-1.5 text-eos-text-tertiary transition-all duration-150 hover:border-eos-border-strong hover:bg-eos-surface-active hover:text-eos-text-muted"
          title="Trust Profile"
        >
          <ExternalLink className="size-3.5" strokeWidth={2} />
        </a>
        {deleteConfirm ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-eos-md border border-eos-error/40 bg-eos-error-soft px-2 py-1.5 text-xs font-medium text-eos-error transition-all hover:bg-eos-error hover:text-white disabled:opacity-50"
            >
              {deleting ? <Loader2 className="size-3 animate-spin" /> : "Confirmi?"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="p-1.5 text-eos-text-tertiary hover:text-eos-text-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-1.5 text-eos-text-tertiary transition-all duration-150 hover:border-eos-error/40 hover:bg-eos-error-soft hover:text-eos-error"
            title="Elimină firma din portofoliu"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── BatchToolbar ──────────────────────────────────────────────────────────────

function BatchToolbar({
  count,
  onClear,
  onAction,
  loading,
}: {
  count: number
  onClear: () => void
  onAction: (type: BatchActionType) => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-eos-xl border border-eos-primary/30 bg-eos-primary/5 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-eos-primary text-xs font-semibold text-white">
          {count}
        </span>
        <span className="text-sm font-medium text-eos-text">
          {count === 1 ? "firmă selectată" : "firme selectate"}
        </span>
      </div>

      <div className="flex flex-1 flex-wrap gap-2">
        {(Object.entries(BATCH_ACTION_LABELS) as [BatchActionType, string][]).map(([type, label]) => (
          <button
            key={type}
            type="button"
            disabled={loading}
            onClick={() => onAction(type)}
            className="flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-1.5 text-xs font-medium text-eos-text-muted transition-all hover:border-eos-primary/30 hover:bg-eos-primary/5 hover:text-eos-text disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-eos-text-tertiary hover:text-eos-text-muted"
      >
        <X className="size-3.5" />
        Deselectează
      </button>
    </div>
  )
}

// ── BatchResultsModal ─────────────────────────────────────────────────────────

function BatchResultsModal({
  results,
  action,
  onClose,
}: {
  results: BatchResult[]
  action: BatchActionType
  onClose: () => void
}) {
  const success = results.filter((r) => r.status === "success").length
  const pending = results.filter((r) => r.status === "pending_approval").length
  const failed = results.filter((r) => r.status === "failed").length

  function formatSummaryKey(key: string) {
    switch (key) {
      case "readiness":
        return "readiness"
      case "blockerCount":
        return "blockers"
      case "complianceScore":
        return "score"
      case "issuesFound":
        return "issues"
      case "policy":
        return "policy"
      case "riskLevel":
        return "risk"
      default:
        return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().toLowerCase()
    }
  }

  function formatSummaryValue(value: string | number | boolean) {
    if (typeof value === "boolean") return value ? "da" : "nu"
    return String(value)
  }

  function resultTone(status: BatchResult["status"]) {
    if (status === "success") {
      return {
        card: "border-eos-success/25 bg-eos-success-soft/60",
        badge: "bg-eos-success/10 text-eos-success border-eos-success/30",
        label: "Executat",
      }
    }
    if (status === "pending_approval") {
      return {
        card: "border-eos-warning/25 bg-eos-warning-soft/50",
        badge: "bg-eos-warning/10 text-eos-warning border-eos-warning/30",
        label: "Așteaptă aprobare",
      }
    }
    return {
      card: "border-eos-error/25 bg-eos-error-soft/60",
      badge: "bg-eos-error/10 text-eos-error border-eos-error/30",
      label: "Necesită intervenție",
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-eos-xl border border-eos-border bg-eos-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-eos-text">{BATCH_ACTION_LABELS[action]}</p>
            <p className="mt-0.5 text-xs text-eos-text-muted">Rezultate operaționale per firmă, cu next step clar.</p>
          </div>
          <button onClick={onClose} className="text-eos-text-tertiary hover:text-eos-text-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 text-xs">
          {success > 0 && <span className="font-medium text-eos-success">{success} executate</span>}
          {pending > 0 && (
            <Link href="/dashboard/approvals" className="font-medium text-eos-warning hover:underline">
              {pending} necesită aprobare →
            </Link>
          )}
          {failed > 0 && <span className="font-medium text-eos-error">{failed} eșuate</span>}
        </div>

        {pending > 0 && (
          <div className="mb-4 rounded-eos-lg border border-eos-warning/20 bg-eos-warning/5 px-4 py-3 text-xs text-eos-text-muted">
            Acțiunile care așteaptă aprobare nu sunt pierdute. Le poți confirma din acest modal sau din pagina Aprobări, apoi continui execuția pe firmă.
          </div>
        )}

        <div className="max-h-[28rem] space-y-2 overflow-y-auto">
          {results.map((r) => {
            const tone = resultTone(r.status)
            return (
              <div
                key={r.orgId}
                className={`rounded-eos-lg border px-4 py-3 ${tone.card}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-eos-text">{r.orgName}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone.badge}`}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-eos-text-muted">{r.detail ?? r.error ?? "Fără detalii suplimentare."}</p>
                  </div>
                  <span className="text-[11px] font-medium text-eos-text-tertiary">{r.orgId}</span>
                </div>

                {r.summary && Object.keys(r.summary).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(r.summary).map(([key, value]) => (
                      <span
                        key={`${r.orgId}-${key}`}
                        className="rounded-full border border-eos-border bg-eos-surface px-2 py-1 text-[10px] font-medium text-eos-text-muted"
                      >
                        {formatSummaryKey(key)}: {formatSummaryValue(value)}
                      </span>
                    ))}
                  </div>
                )}

                {r.nextStep && (
                  <div className="mt-3 rounded-eos-md border border-eos-border/70 bg-eos-surface/70 px-3 py-2 text-xs text-eos-text-muted">
                    <span className="font-medium text-eos-text">Ce urmează:</span> {r.nextStep}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-eos-md border border-eos-border bg-eos-surface-active py-2 text-sm font-medium text-eos-text-muted hover:text-eos-text"
        >
          Închide
        </button>
      </div>
    </div>
  )
}

function SummaryStrip({ clients }: { clients: PortfolioOverviewClientSummary[] }) {
  const active = clients.filter((c) => c.status === "active")
  const withData = active.filter((c) => c.compliance?.hasData)
  const redClients = active.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
  const activeTasks = active.reduce((s, c) => s + (c.compliance?.totalTasks ?? 0), 0)
  const avgScore =
    withData.length > 0
      ? Math.round(withData.reduce((s, c) => s + (c.compliance?.score ?? 0), 0) / withData.length)
      : 0
  const totalEfacturaRisks = active.reduce((s, c) => s + (c.compliance?.efacturaRiskCount ?? 0), 0)

  const stats = [
    { label: "Firme active", value: active.length },
    { label: "Cu date", value: withData.length },
    { label: "Scor mediu", value: withData.length > 0 ? `${avgScore}%` : "—" },
    { label: "Taskuri active", value: activeTasks },
    { label: "Alerte critice", value: redClients.length },
    ...(totalEfacturaRisks > 0 ? [{ label: "Semnale e-Factura", value: totalEfacturaRisks }] : []),
  ]

  return (
    <div className={`grid grid-cols-2 divide-x divide-eos-border-subtle overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface-variant ${stats.length > 5 ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 px-5 py-4">
          <span className="text-[11px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-tertiary">
            {stat.label}
          </span>
          <span className="text-xl font-semibold text-eos-text">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PortfolioOverviewClient() {
  const [clients, setClients] = useState<PortfolioOverviewClientSummary[]>([])
  const [planData, setPlanData] = useState<PortfolioPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null)
  const [batchAction, setBatchAction] = useState<BatchActionType | null>(null)
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all")
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("alerts")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  async function fetchClients() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/portfolio/overview", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut incarca lista de firme din portofoliu.")
      const data = (await response.json()) as { clients: PortfolioOverviewClientSummary[] }
      setClients(data.clients)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlanData() {
    try {
      const response = await fetch("/api/plan", { cache: "no-store" })
      if (!response.ok) return
      const data = (await response.json()) as PortfolioPlanResponse
      setPlanData(data)
    } catch {
      // UI fallback only
    }
  }

  useEffect(() => {
    void fetchClients()
    void fetchPlanData()
  }, [])

  // P2: drilldown navigates to client context page (stays in portfolio mode)
  function handleDrillDown(orgId: string) {
    window.location.assign(`/portfolio/client/${orgId}`)
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function handleExportCsv() {
    const dateLabel = new Date().toISOString().split("T")[0]
    const header = ["orgName", "orgId", "scor", "alerte_critice", "taskuri_active", "status"].join(",")
    const rows = clients.map((c) =>
      [
        `"${c.orgName.replace(/"/g, '""')}"`,
        c.orgId,
        c.compliance?.score ?? 0,
        c.compliance?.redAlerts ?? 0,
        c.compliance?.totalTasks ?? 0,
        c.status,
      ].join(",")
    )
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `portfolio-overview-${dateLabel}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleToggleSelect(orgId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orgId)) next.delete(orgId)
      else next.add(orgId)
      return next
    })
  }

  function handleSelectAll(ids: string[]) {
    setSelectedIds((prev) => {
      if (ids.every((id) => prev.has(id))) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      return new Set([...prev, ...ids])
    })
  }

  async function handleBatchAction(type: BatchActionType) {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const orgNames = Object.fromEntries(
        clients
          .filter((client) => selectedIds.has(client.orgId))
          .map((client) => [client.orgId, client.orgName])
      )
      const res = await fetch("/api/portfolio/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: type,
          orgIds: Array.from(selectedIds),
          config: { orgNames },
        }),
      })
      const data = (await res.json()) as { results?: BatchResult[]; error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la batch.")
      const results = data.results ?? []
      setBatchResults(results)
      setBatchAction(type)
      setSelectedIds(new Set())
      const pendingCount = results.filter((r) => r.status === "pending_approval").length
      const message = data.message ?? (pendingCount > 0
        ? `${pendingCount} acțiuni necesită aprobare.`
        : `${results.length} acțiuni rulate cu succes.`)
      if (pendingCount > 0) toast.info(message)
      else toast.success(message)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la batch.")
    } finally {
      setBatchLoading(false)
    }
  }

  const activeClients = clients.filter((c) => c.status === "active")

  const filteredClients = useMemo(() => {
    let list = activeClients
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.orgName.toLowerCase().includes(q) || c.orgId.toLowerCase().includes(q))
    }
    if (scoreFilter !== "all") {
      list = list.filter((c) => {
        const s = c.compliance?.score ?? -1
        if (scoreFilter === "under50") return s < 50
        if (scoreFilter === "50to75") return s >= 50 && s <= 75
        if (scoreFilter === "over75") return s > 75
        return true
      })
    }
    if (alertFilter === "withAlerts") {
      list = list.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
    }
    return [...list].sort((a, b) => {
      if (sortKey === "orgName") {
        const cmp = a.orgName.localeCompare(b.orgName, "ro")
        return sortDir === "asc" ? cmp : -cmp
      }
      const av = sortKey === "score" ? a.compliance?.score ?? -1 : sortKey === "alerts" ? a.compliance?.redAlerts ?? 0 : a.compliance?.totalTasks ?? 0
      const bv = sortKey === "score" ? b.compliance?.score ?? -1 : sortKey === "alerts" ? b.compliance?.redAlerts ?? 0 : b.compliance?.totalTasks ?? 0
      return sortDir === "asc" ? av - bv : bv - av
    })
  }, [activeClients, alertFilter, scoreFilter, search, sortDir, sortKey])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  const alertClients = activeClients.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)

  return (
    <div className="space-y-6">
      {showImport ? (
        <ImportWizard
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            void fetchClients()
            void fetchPlanData()
          }}
        />
      ) : null}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium font-mono uppercase tracking-[0.14em] text-eos-text-tertiary">Portofoliu</p>
          <h1 className="mt-1 text-2xl font-semibold text-eos-text">Portofoliu firme</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-eos-text-tertiary">
            Aici faci triage cross-client. Intri în firmă doar când trebuie să execuți într-un workspace real.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-eos-border px-2.5 py-0.5 text-xs text-eos-text-muted">
              {activeClients.length} firme active
            </span>
            {planData?.planType && planData.maxOrgs !== null && (
              <span className="rounded-full bg-eos-surface-active px-2.5 py-0.5 text-xs text-eos-text-tertiary">
                {PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]} · {planData.currentOrgs}/{planData.maxOrgs}
              </span>
            )}
            {alertClients.length > 0 && (
              <span className="rounded-full bg-eos-error-soft px-2.5 py-0.5 text-xs font-medium text-eos-error">
                {alertClients.length} cu alerte critice
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            disabled={planData ? !planData.canAddOrg : false}
            className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition-all duration-150 hover:border-eos-border-strong hover:bg-eos-surface-elevated hover:text-eos-text disabled:opacity-40"
          >
            <Upload className="size-4" strokeWidth={2} />
            {planData && !planData.canAddOrg ? "Limita atinsă" : "Import firme"}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition-all duration-150 hover:border-eos-border-strong hover:bg-eos-surface-elevated hover:text-eos-text"
          >
            <Download className="size-4" strokeWidth={2} />
            Exportă CSV
          </button>
          <button
            type="button"
            onClick={() => { void fetchClients(); void fetchPlanData() }}
            className="flex items-center gap-2 rounded-eos-lg px-3 py-2 text-sm font-medium text-eos-text-tertiary transition-all duration-150 hover:bg-eos-surface-active hover:text-eos-text-muted"
          >
            <RefreshCw className="size-4" strokeWidth={2} />
            Actualizează
          </button>
        </div>
      </div>

      {/* ── Capacity warning ── */}
      {planData && !planData.canAddOrg && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-eos-xl border border-eos-warning-border bg-eos-warning-soft px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-eos-text">Capacitatea portofoliului este atinsă</p>
            <p className="mt-1 text-xs leading-5 text-eos-text-muted">
              {planData.partnerPlanSource === "trial"
                ? `Ai atins limita trial (${planData.maxOrgs} firme). Activează un plan Partner din Setări cont pentru a adăuga mai multe.`
                : `Planul ${PARTNER_ACCOUNT_PLAN_LABELS[planData.planType!]} permite până la ${planData.maxOrgs} firme.`}
            </p>
          </div>
          <Link
            href={dashboardRoutes.accountSettings}
            className="rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition-all hover:bg-eos-surface-elevated hover:text-eos-text"
          >
            Setări cont
          </Link>
        </div>
      )}

      {/* ── Urgencies banner ── */}
      {(() => {
        const overdueScans = activeClients.filter((c) => {
          const last = c.compliance?.lastScanAtISO
          if (!last) return false
          return Date.now() - new Date(last).getTime() > 14 * 24 * 60 * 60 * 1000
        })
        const urgencies = [
          alertClients.length > 0 && { label: `${alertClients.length} firme cu alerte critice`, filter: () => setAlertFilter("withAlerts") },
          activeClients.filter((c) => (c.compliance?.totalTasks ?? 0) > 0).length > 0 && {
            label: `${activeClients.filter((c) => (c.compliance?.totalTasks ?? 0) > 0).length} firme cu taskuri active`,
            filter: () => setSortKey("tasks"),
          },
          overdueScans.length > 0 && { label: `${overdueScans.length} firme fără scan recent`, filter: () => setScoreFilter("all") },
          activeClients.filter((c) => (c.compliance?.efacturaRiskCount ?? 0) > 0).length > 0 && {
            label: `${activeClients.filter((c) => (c.compliance?.efacturaRiskCount ?? 0) > 0).length} firme cu semnale e-Factura`,
            filter: () => setSortKey("alerts"),
          },
          activeClients.filter((c) => (c.compliance?.activeDsarCount ?? 0) > 0).length > 0 && {
            label: `${activeClients.reduce((s, c) => s + (c.compliance?.activeDsarCount ?? 0), 0)} DSAR active cross-client`,
            filter: () => setSortKey("alerts"),
          },
        ].filter(Boolean) as Array<{ label: string; filter: () => void }>

        if (urgencies.length === 0) return null
        return (
          <div className="rounded-eos-xl border border-eos-error-border bg-eos-error-soft px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-eos-error" strokeWidth={2} />
              <span className="text-sm font-semibold text-eos-error">Urgențe acum</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {urgencies.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={u.filter}
                  className="flex items-center gap-2 rounded-eos-lg border border-eos-error-border bg-eos-error-soft px-3 py-2 text-left text-sm text-eos-error transition-all hover:bg-eos-error-soft"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-eos-error" />
                  {u.label}
                  <span className="ml-auto text-[10px] text-eos-text-tertiary">Filtrează →</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Batch results modal ── */}
      {batchResults && batchAction && (
        <BatchResultsModal
          results={batchResults}
          action={batchAction}
          onClose={() => { setBatchResults(null); setBatchAction(null) }}
        />
      )}

      {/* ── Summary strip ── */}
      <SummaryStrip clients={activeClients} />

      {/* ── Batch toolbar ── */}
      {selectedIds.size > 0 && (
        <BatchToolbar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onAction={(type) => void handleBatchAction(type)}
          loading={batchLoading}
        />
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-eos-text-tertiary" strokeWidth={2} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume..."
            className="h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active pl-9 pr-3 text-sm text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-border-strong focus:outline-none"
          />
        </div>
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
          className="h-9 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text-muted focus:outline-none"
        >
          <option value="all">Toate scorurile</option>
          <option value="under50">Sub 50%</option>
          <option value="50to75">50–75%</option>
          <option value="over75">Peste 75%</option>
        </select>
        <select
          value={alertFilter}
          onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
          className="h-9 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text-muted focus:outline-none"
        >
          <option value="all">Toate alertele</option>
          <option value="withAlerts">Cu alerte critice</option>
        </select>
      </div>

      {/* ── Client table ── */}
      <div className="overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface-variant">
        {activeClients.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-eos-xl border border-eos-border bg-eos-surface-active">
              <Users className="size-7 text-eos-text-muted" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-eos-text">Niciun client încă în portofoliu</p>
              <p className="max-w-md text-sm leading-6 text-eos-text-tertiary">
                Adaugă prima firmă pe care o gestionezi. Poți importa din CSV, prin CUI ANAF sau introduce manual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              disabled={planData ? !planData.canAddOrg : false}
              className="mt-2 flex items-center gap-2 rounded-eos-lg bg-eos-primary px-5 py-2.5 text-sm font-semibold text-eos-text shadow-lg shadow-eos-primary/20 transition-all hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload className="size-4" strokeWidth={2} />
              Adaugă primul client
            </button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-eos-text-tertiary">
            Nicio firmă nu corespunde filtrelor aplicate.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="flex flex-wrap items-center gap-4 border-b border-eos-border-subtle bg-eos-surface-variant px-5 py-2.5">
              <input
                type="checkbox"
                className="size-4 rounded border-eos-border accent-eos-primary"
                checked={filteredClients.length > 0 && filteredClients.every((c) => selectedIds.has(c.orgId))}
                onChange={() => handleSelectAll(filteredClients.map((c) => c.orgId))}
                aria-label="Selectează toate"
              />
              <div className="flex-1">
                <SortHeader label="Organizație" sortKey="orgName" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="w-28 shrink-0">
                <SortHeader label="Scor" sortKey="score" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="hidden w-36 shrink-0 sm:block">
                <SortHeader label="Alerte" sortKey="alerts" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="hidden w-28 shrink-0 sm:block">
                <SortHeader label="Taskuri" sortKey="tasks" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="hidden w-28 shrink-0 sm:block" />
            </div>

            <div className="divide-y divide-eos-border-subtle">
              {filteredClients.map((client) => (
                <ClientRow
                  key={client.orgId}
                  client={client}
                  onDrillDown={(id) => void handleDrillDown(id)}
                  selected={selectedIds.has(client.orgId)}
                  onToggleSelect={handleToggleSelect}
                  onDelete={(orgId) => setClients((prev) => prev.filter((c) => c.orgId !== orgId))}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Info cards ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-eos-xl border border-eos-border-subtle bg-eos-surface-variant p-4">
          <Building2 className="mb-2 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text-muted">Portofoliu-first, fără switch constant</p>
          <p className="mt-1 text-xs leading-5 text-eos-text-tertiary">
            Triage-ul rămâne aici. Intrarea în firmă deschide doar execuția pe clientul selectat. Poți importa firme în masă și exporta snapshot-ul curent.
          </p>
        </div>
        <div className="rounded-eos-xl border border-eos-border-subtle bg-eos-surface-variant p-4">
          <CalendarClock className="mb-2 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text-muted">Drilldown rapid</p>
          <p className="mt-1 text-xs leading-5 text-eos-text-tertiary">
            Click pe orice firmă ca să intri direct în contextul ei de execuție. Modul portofoliu păstrează ultimul org valid în sesiune.
          </p>
        </div>
      </div>
    </div>
  )
}
