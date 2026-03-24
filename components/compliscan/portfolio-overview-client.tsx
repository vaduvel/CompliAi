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

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { ImportWizard } from "@/components/compliscan/import-wizard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
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
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-bg-inset">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
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
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary hover:text-eos-text ${className}`}
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="size-3" strokeWidth={2} /> : <ChevronDown className="size-3" strokeWidth={2} />
      ) : (
        <ChevronDown className="size-3 opacity-30" strokeWidth={2} />
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
      className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-eos-surface-variant"
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-eos-text">{client.orgName}</p>
          <Badge
            variant={client.role === "owner" ? "default" : "secondary"}
            className="shrink-0 text-[10px] normal-case tracking-normal"
          >
            {client.role}
          </Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-eos-text-muted">
          <span>{client.orgId}</span>
          <span>•</span>
          <span>Ultima scanare: {formatDate(c?.lastScanAtISO)}</span>
        </div>
      </div>

      <div className="w-28 shrink-0">
        {hasData && c ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-eos-text">{c.score}%</span>
              <span className="text-[10px] text-eos-text-muted">{c.riskLabel}</span>
            </div>
            <ScoreBar score={c.score} />
          </div>
        ) : (
          <span className="text-xs text-eos-text-muted">fără date</span>
        )}
      </div>

      <div className="hidden w-36 shrink-0 sm:block">
        {c && hasData ? (
          <div className="space-y-0.5 text-xs text-eos-text-muted">
            <div className="flex items-center gap-1.5">
              {c.redAlerts > 0 ? (
                <AlertTriangle className="size-3 text-red-500" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="size-3 text-emerald-500" strokeWidth={2} />
              )}
              {c.openAlerts} alert{c.openAlerts !== 1 ? "e" : "ă"}
            </div>
            <div>{c.totalTasks} task{c.totalTasks !== 1 ? "uri" : ""} active</div>
            <div>{c.criticalFindings} findings critice/high</div>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {c?.efacturaConnected && (c?.efacturaRiskCount ?? 0) === 0 && (
          <Badge variant="success" className="text-[10px] normal-case tracking-normal">
            e-Factura
          </Badge>
        )}
        {(c?.efacturaRiskCount ?? 0) > 0 && (
          <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
            {c!.efacturaRiskCount} semnale e-Factura
          </Badge>
        )}
        {c && c.gdprProgress >= 70 && (
          <Badge variant="success" className="text-[10px] normal-case tracking-normal">
            GDPR
          </Badge>
        )}
        {c && c.highRisk > 0 ? (
          <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
            {c.highRisk} high-risk AI
          </Badge>
        ) : null}
        {c?.nis2RescueNeeded && (
          <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
            NIS2 neînregistrat
          </Badge>
        )}
        {(c?.urgentDsarCount ?? 0) > 0 && (
          <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
            {c!.urgentDsarCount} DSAR urgente
          </Badge>
        )}
        {(c?.activeDsarCount ?? 0) > 0 && (c?.urgentDsarCount ?? 0) === 0 && (
          <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
            {c!.activeDsarCount} DSAR
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
          Intră în firmă
        </Badge>
        <a
          href={`/trust/${client.orgId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted transition hover:bg-eos-surface-variant hover:text-eos-text"
          title="Trust Profile"
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="size-3.5" strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}

function SummaryStrip({ clients }: { clients: PortfolioOverviewClientSummary[] }) {
  const active = clients.filter((client) => client.status === "active")
  const withData = active.filter((client) => client.compliance?.hasData)
  const redClients = active.filter((client) => (client.compliance?.redAlerts ?? 0) > 0)
  const activeTasks = active.reduce((sum, client) => sum + (client.compliance?.totalTasks ?? 0), 0)
  const avgScore =
    withData.length > 0
      ? Math.round(
          withData.reduce((sum, client) => sum + (client.compliance?.score ?? 0), 0) / withData.length
        )
      : 0

  const efacturaRiskClients = active.filter((client) => (client.compliance?.efacturaRiskCount ?? 0) > 0)
  const totalEfacturaRisks = active.reduce((sum, client) => sum + (client.compliance?.efacturaRiskCount ?? 0), 0)

  const stats = [
    { label: "Total firme", value: active.length },
    { label: "Cu date", value: withData.length },
    { label: "Scor mediu", value: withData.length > 0 ? `${avgScore}%` : "—" },
    { label: "Taskuri active", value: activeTasks },
    { label: "Alerte critice", value: redClients.length },
    ...(totalEfacturaRisks > 0
      ? [{ label: "Semnale e-Factura", value: `${totalEfacturaRisks} (${efacturaRiskClients.length} firme)` }]
      : []),
  ]

  return (
    <div className={`grid grid-cols-2 divide-x divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface ${stats.length > 5 ? "md:grid-cols-6" : "md:grid-cols-5"}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5 px-5 py-3.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
            {stat.label}
          </span>
          <span className="text-lg font-semibold text-eos-text">{stat.value}</span>
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
      if (!response.ok) {
        throw new Error("Nu am putut incarca lista de firme din portofoliu.")
      }
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
      // UI fallback only — API will still enforce capacity server-side.
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
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function handleExportCsv() {
    const dateLabel = new Date().toISOString().split("T")[0]
    const header = ["orgName", "orgId", "scor", "alerte_critice", "taskuri_active", "status"].join(",")
    const rows = clients.map((client) =>
      [
        `"${client.orgName.replace(/"/g, '""')}"`,
        client.orgId,
        client.compliance?.score ?? 0,
        client.compliance?.redAlerts ?? 0,
        client.compliance?.totalTasks ?? 0,
        client.status,
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

  const activeClients = clients.filter((client) => client.status === "active")

  const filteredClients = useMemo(() => {
    let list = activeClients

    if (search.trim()) {
      const query = search.toLowerCase()
      list = list.filter(
        (client) => client.orgName.toLowerCase().includes(query) || client.orgId.toLowerCase().includes(query)
      )
    }

    if (scoreFilter !== "all") {
      list = list.filter((client) => {
        const score = client.compliance?.score ?? -1
        if (scoreFilter === "under50") return score < 50
        if (scoreFilter === "50to75") return score >= 50 && score <= 75
        if (scoreFilter === "over75") return score > 75
        return true
      })
    }

    if (alertFilter === "withAlerts") {
      list = list.filter((client) => (client.compliance?.redAlerts ?? 0) > 0)
    }

    const sorted = [...list].sort((left, right) => {
      if (sortKey === "orgName") {
        const compare = left.orgName.localeCompare(right.orgName, "ro")
        return sortDir === "asc" ? compare : -compare
      }

      const leftValue =
        sortKey === "score"
          ? left.compliance?.score ?? -1
          : sortKey === "alerts"
            ? left.compliance?.redAlerts ?? 0
            : left.compliance?.totalTasks ?? 0

      const rightValue =
        sortKey === "score"
          ? right.compliance?.score ?? -1
          : sortKey === "alerts"
            ? right.compliance?.redAlerts ?? 0
            : right.compliance?.totalTasks ?? 0

      return sortDir === "asc" ? leftValue - rightValue : rightValue - leftValue
    })

    return sorted
  }, [activeClients, alertFilter, scoreFilter, search, sortDir, sortKey])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  const alertClients = activeClients.filter((client) => (client.compliance?.redAlerts ?? 0) > 0)

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

      <PageIntro
        eyebrow="Portofoliu"
        title="Portofoliu firme"
        description="Lucrezi cross-client dintr-un singur loc. Vezi cine arde, apoi intri în firmă doar pentru drilldown și execuție."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {activeClients.length} firme active
            </Badge>
            {planData?.planType && planData.maxOrgs !== null ? (
              <Badge variant="secondary" className="normal-case tracking-normal">
                {PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]} · {planData.currentOrgs}/{planData.maxOrgs}
              </Badge>
            ) : null}
            {alertClients.length > 0 ? (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {alertClients.length} cu alerte critice
              </Badge>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowImport(true)}
              disabled={planData ? !planData.canAddOrg : false}
              className="gap-2"
            >
              <Upload className="size-3.5" strokeWidth={2} />
              {planData && !planData.canAddOrg ? "Limita atinsă" : "Import firme"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCsv} className="gap-2">
              <Download className="size-3.5" strokeWidth={2} />
              Exportă CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void fetchClients()
                void fetchPlanData()
              }}
              className="gap-2"
            >
              <RefreshCw className="size-3.5" strokeWidth={2} />
              Actualizează
            </Button>
          </div>
        }
      />

      {planData && !planData.canAddOrg ? (
        <div className="rounded-eos-xl border border-eos-warning-border bg-eos-warning-soft px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-eos-text">Capacitatea portofoliului este atinsă</p>
              <p className="mt-1 text-xs leading-5 text-eos-warning/90">
                {planData.planType
                  ? `Planul ${PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]} permite până la ${planData.maxOrgs} firme.`
                  : "Ai nevoie de un plan Partner pe cont pentru a adăuga firme noi."}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={dashboardRoutes.accountSettings}>Deschide Setări cont</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {(() => {
        const overdueScans = activeClients.filter((client) => {
          const lastScan = client.compliance?.lastScanAtISO
          if (!lastScan) return false
          return Date.now() - new Date(lastScan).getTime() > 14 * 24 * 60 * 60 * 1000
        })
        const urgencies = [
          alertClients.length > 0 && {
            label: `${alertClients.length} firme cu alerte critice`,
            filter: () => setAlertFilter("withAlerts"),
          },
          activeClients.filter((client) => (client.compliance?.totalTasks ?? 0) > 0).length > 0 && {
            label: `${activeClients.filter((client) => (client.compliance?.totalTasks ?? 0) > 0).length} firme cu taskuri active`,
            filter: () => setSortKey("tasks"),
          },
          overdueScans.length > 0 && {
            label: `${overdueScans.length} firme fără scan recent`,
            filter: () => setScoreFilter("all"),
          },
          activeClients.filter((client) => (client.compliance?.efacturaRiskCount ?? 0) > 0).length > 0 && {
            label: `${activeClients.filter((client) => (client.compliance?.efacturaRiskCount ?? 0) > 0).length} firme cu semnale e-Factura`,
            filter: () => setSortKey("alerts"),
          },
          activeClients.filter((client) => (client.compliance?.activeDsarCount ?? 0) > 0).length > 0 && {
            label: `${activeClients.reduce((sum, c) => sum + (c.compliance?.activeDsarCount ?? 0), 0)} DSAR active cross-client`,
            filter: () => setSortKey("alerts"),
          },
        ].filter(Boolean) as Array<{ label: string; filter: () => void }>

        if (urgencies.length === 0) return null
        return (
          <div className="rounded-eos-xl border border-eos-error/20 bg-eos-error-soft px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-eos-error" strokeWidth={2} />
              <span className="text-sm font-semibold text-eos-error">Urgențe acum</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {urgencies.map((urgency) => (
                <button
                  key={urgency.label}
                  type="button"
                  onClick={urgency.filter}
                  className="flex items-center gap-2 rounded-eos-md border border-eos-error/20 bg-white/60 px-3 py-2 text-left text-sm text-eos-error hover:bg-white/80 dark:bg-black/10 dark:hover:bg-black/20"
                >
                  <span className="size-2 shrink-0 rounded-full bg-eos-error" />
                  {urgency.label}
                  <span className="ml-auto text-[10px] underline">Filtrează →</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      <SummaryStrip clients={activeClients} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-eos-text-muted" strokeWidth={2} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Caută după nume sau ID..."
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface py-2 pl-9 pr-3 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
          />
        </div>

        <select
          value={scoreFilter}
          onChange={(event) => setScoreFilter(event.target.value as ScoreFilter)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate scorurile</option>
          <option value="under50">Sub 50%</option>
          <option value="50to75">50–75%</option>
          <option value="over75">Peste 75%</option>
        </select>

        <select
          value={alertFilter}
          onChange={(event) => setAlertFilter(event.target.value as AlertFilter)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate alertele</option>
          <option value="withAlerts">Cu alerte critice</option>
        </select>
      </div>

      <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
        {activeClients.length === 0 ? (
          <EmptyState
            title="Nicio firmă activă"
            label="Adaugă organizații sau acceptă invitații pentru a popula portofoliul."
            icon={Users}
            className="px-5 py-10"
          />
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-eos-text-muted">
            Nicio firmă nu corespunde filtrelor aplicate.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 bg-eos-bg-inset px-5 py-2">
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
              <div className="hidden w-16 shrink-0 sm:block" />
            </div>

            {filteredClients.map((client) => (
              <ClientRow
                key={client.orgId}
                client={client}
                onDrillDown={(orgId) => {
                  void handleDrillDown(orgId)
                }}
              />
            ))}
          </>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <Building2 className="mb-1.5 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
        <p className="font-medium text-eos-text">Portofoliu-first, fără org switch pe bandă</p>
        <p className="mt-0.5">
          Lucrezi cross-client din portofoliu și intri pe firmă doar când ai nevoie de execuție.
          În continuare poți importa firme în masă și exporta snapshot-ul curent al portofoliului.
        </p>
      </div>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <CalendarClock className="mb-1.5 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
        <p className="font-medium text-eos-text">Drilldown rapid</p>
        <p className="mt-0.5">
          Click pe orice firmă ca să intri direct în contextul ei. În modul portfolio păstrăm ultimul org valid în sesiune și îl refolosim pentru executarea din `/dashboard`.
        </p>
      </div>
    </div>
  )
}
