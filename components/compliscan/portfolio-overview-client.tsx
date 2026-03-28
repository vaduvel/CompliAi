"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  Upload,
  Users,
} from "lucide-react"

import { ImportWizard } from "@/components/compliscan/import-wizard"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { PARTNER_ACCOUNT_PLAN_LABELS, type PartnerAccountPlan } from "@/lib/shared/plan-constants"
import type { PortfolioOverviewClientSummary } from "@/lib/server/portfolio"

type ScoreFilter = "all" | "under50" | "50to75" | "over75"
type AlertFilter = "all" | "withAlerts"
type SortKey = "orgName" | "score" | "alerts" | "tasks"
type SortDir = "asc" | "desc"

type PortfolioPlanResponse = {
  planType: PartnerAccountPlan | null
  maxOrgs: number | null
  currentOrgs: number
  canAddOrg: boolean
  partnerPlanSource: "account" | "legacy_org_partner" | "none"
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
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500"
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
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
      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-150 ${
        active ? "text-white/60" : "text-white/25 hover:text-white/45"
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
}: {
  client: PortfolioOverviewClientSummary
  onDrillDown: (id: string) => void
}) {
  const c = client.compliance
  const hasData = c?.hasData ?? false

  return (
    <div
      className="group flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-white/[0.03]"
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
      {/* ── Org name + last scan ── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white/85">{client.orgName}</p>
          <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/40">
            {client.role}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-white/30">
          Ultima scanare: {formatDate(c?.lastScanAtISO)}
        </p>
      </div>

      {/* ── Score ── */}
      <div className="w-28 shrink-0">
        {hasData && c ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-white/80">{c.score}%</span>
              <span
                className={`text-[10px] font-medium ${
                  c.score >= 70
                    ? "text-emerald-400"
                    : c.score >= 40
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {c.riskLabel}
              </span>
            </div>
            <ScoreBar score={c.score} />
          </div>
        ) : (
          <span className="text-xs text-white/25">fără date</span>
        )}
      </div>

      {/* ── Alerts + tasks + findings ── */}
      <div className="hidden w-36 shrink-0 space-y-1 sm:block">
        {c && hasData ? (
          <>
            <div className="flex items-center gap-1.5 text-xs">
              {c.redAlerts > 0 ? (
                <AlertTriangle className="size-3 shrink-0 text-red-400" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="size-3 shrink-0 text-emerald-500" strokeWidth={2} />
              )}
              <span className="text-white/50">
                {c.openAlerts} alert{c.openAlerts !== 1 ? "e" : "ă"}
              </span>
            </div>
            <p className="text-xs text-white/35">{c.totalTasks} taskuri active</p>
            <p className="text-xs text-white/35">{c.criticalFindings} findings critice</p>
          </>
        ) : null}
      </div>

      {/* ── Compliance badges ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {c?.efacturaConnected && (c?.efacturaRiskCount ?? 0) === 0 && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            e-Factura
          </span>
        )}
        {(c?.efacturaRiskCount ?? 0) > 0 && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            {c!.efacturaRiskCount} e-Factura
          </span>
        )}
        {c && c.gdprProgress >= 70 && (
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
            GDPR
          </span>
        )}
        {c && c.highRisk > 0 && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
            {c.highRisk} high-risk AI
          </span>
        )}
        {c?.nis2RescueNeeded && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            NIS2
          </span>
        )}
        {(c?.urgentDsarCount ?? 0) > 0 && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
            {c!.urgentDsarCount} DSAR urgent
          </span>
        )}
        {(c?.activeDsarCount ?? 0) > 0 && (c?.urgentDsarCount ?? 0) === 0 && (
          <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/40">
            {c!.activeDsarCount} DSAR
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onDrillDown(client.orgId)}
          className="rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/85"
        >
          Intră în firmă
        </button>
        <a
          href={`/trust/${client.orgId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-1.5 text-white/35 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white/65"
          title="Trust Profile"
        >
          <ExternalLink className="size-3.5" strokeWidth={2} />
        </a>
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
    <div className={`grid grid-cols-2 divide-x divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] ${stats.length > 5 ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
            {stat.label}
          </span>
          <span className="text-xl font-bold text-white/80">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}

export function PortfolioOverviewClient() {
  const router = useRouter()
  const [clients, setClients] = useState<PortfolioOverviewClientSummary[]>([])
  const [planData, setPlanData] = useState<PortfolioPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [search, setSearch] = useState("")
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

  async function handleDrillDown(orgId: string) {
    const response = await fetch("/api/auth/select-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceMode: "org", orgId }),
    })
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string }
      setError(payload.error ?? "Nu am putut intra în firma selectată.")
      return
    }
    router.replace("/dashboard")
    router.refresh()
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
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Portofoliu</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Portofoliu firme</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/40">
            Lucrezi cross-client dintr-un singur loc. Vezi cine arde, apoi intri în firmă doar pentru drilldown.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/[0.09] px-2.5 py-0.5 text-xs text-white/45">
              {activeClients.length} firme active
            </span>
            {planData?.planType && planData.maxOrgs !== null && (
              <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs text-white/35">
                {PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]} · {planData.currentOrgs}/{planData.maxOrgs}
              </span>
            )}
            {alertClients.length > 0 && (
              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
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
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white/60 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white/85 disabled:opacity-40"
          >
            <Upload className="size-3.5" strokeWidth={2} />
            {planData && !planData.canAddOrg ? "Limita atinsă" : "Import firme"}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white/60 transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.07] hover:text-white/85"
          >
            <Download className="size-3.5" strokeWidth={2} />
            Exportă CSV
          </button>
          <button
            type="button"
            onClick={() => { void fetchClients(); void fetchPlanData() }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/35 transition-all duration-150 hover:bg-white/[0.05] hover:text-white/60"
          >
            <RefreshCw className="size-3.5" strokeWidth={2} />
            Actualizează
          </button>
        </div>
      </div>

      {/* ── Capacity warning ── */}
      {planData && !planData.canAddOrg && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white/80">Capacitatea portofoliului este atinsă</p>
            <p className="mt-1 text-xs leading-5 text-amber-400/75">
              {planData.planType
                ? `Planul ${PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]} permite până la ${planData.maxOrgs} firme.`
                : "Ai nevoie de un plan Partner pe cont pentru a adăuga firme noi."}
            </p>
          </div>
          <Link
            href={dashboardRoutes.accountSettings}
            className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white/60 transition-all hover:bg-white/[0.07] hover:text-white/85"
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
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-400" strokeWidth={2} />
              <span className="text-sm font-semibold text-red-400">Urgențe acum</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {urgencies.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={u.filter}
                  className="flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-left text-sm text-red-400 transition-all hover:bg-red-500/[0.10]"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                  {u.label}
                  <span className="ml-auto text-[10px] text-red-400/60">Filtrează →</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Summary strip ── */}
      <SummaryStrip clients={activeClients} />

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" strokeWidth={2} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume..."
            className="h-9 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-white/[0.18] focus:outline-none"
          />
        </div>
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
          className="h-9 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-sm text-white/60 focus:outline-none"
        >
          <option value="all">Toate scorurile</option>
          <option value="under50">Sub 50%</option>
          <option value="50to75">50–75%</option>
          <option value="over75">Peste 75%</option>
        </select>
        <select
          value={alertFilter}
          onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
          className="h-9 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-sm text-white/60 focus:outline-none"
        >
          <option value="all">Toate alertele</option>
          <option value="withAlerts">Cu alerte critice</option>
        </select>
      </div>

      {/* ── Client table ── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        {activeClients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <Users className="size-8 text-white/15" strokeWidth={1.5} />
            <p className="text-sm font-medium text-white/40">Nicio firmă activă</p>
            <p className="text-xs text-white/25">Adaugă organizații sau acceptă invitații pentru a popula portofoliul.</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-white/35">
            Nicio firmă nu corespunde filtrelor aplicate.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
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

            <div className="divide-y divide-white/[0.04]">
              {filteredClients.map((client) => (
                <ClientRow
                  key={client.orgId}
                  client={client}
                  onDrillDown={(id) => void handleDrillDown(id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Info cards ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Building2 className="mb-2 size-4 text-white/25" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-white/70">Portofoliu-first, fără switch constant</p>
          <p className="mt-1 text-xs leading-5 text-white/35">
            Lucrezi cross-client din portofoliu și intri pe firmă doar când ai nevoie de execuție. Poți importa firme în masă și exporta snapshot-ul curent.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <CalendarClock className="mb-2 size-4 text-white/25" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-white/70">Drilldown rapid</p>
          <p className="mt-1 text-xs leading-5 text-white/35">
            Click pe orice firmă ca să intri direct în contextul ei. Modul portofoliu păstrează ultimul org valid în sesiune.
          </p>
        </div>
      </div>
    </div>
  )
}
