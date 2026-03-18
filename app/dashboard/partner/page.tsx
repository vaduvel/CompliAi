"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Building2,
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
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import type { PartnerClientSummary } from "@/app/api/partner/clients/route"

// ── Types ─────────────────────────────────────────────────────────────────────

type ScoreFilter = "all" | "under50" | "50to75" | "over75"
type AlertFilter = "all" | "withAlerts"
type Nis2Filter = "all" | "hasNis2"  // simplu: filtrare nu e disponibilă fără endpoint dedicat
type SortKey = "orgName" | "score" | "alerts"
type SortDir = "asc" | "desc"

// ── Client row ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-500"
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-bg-inset">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function ClientRow({ client, onDrillDown }: { client: PartnerClientSummary; onDrillDown: (id: string) => void }) {
  const c = client.compliance
  const hasData = c?.hasData ?? false

  return (
    <div
      className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-eos-surface-variant"
      onClick={() => onDrillDown(client.orgId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onDrillDown(client.orgId) }}
      aria-label={`Detalii ${client.orgName}`}
    >
      {/* Org */}
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
        <p className="text-xs text-eos-text-muted">{client.orgId}</p>
      </div>

      {/* Score */}
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

      {/* Stats */}
      <div className="hidden w-32 shrink-0 sm:block">
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
            <div>{c.scannedDocuments} doc scanate</div>
          </div>
        ) : null}
      </div>

      {/* Status pills */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {c?.efacturaConnected && (
          <Badge variant="success" className="text-[10px] normal-case tracking-normal">
            e-Factura
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
        {/* V3 P0.4 — Accountant Hub urgency signals */}
        {c?.nis2RescueNeeded && (
          <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
            NIS2 neînregistrat
          </Badge>
        )}
        {c && c.efacturaRiskCount > 0 ? (
          <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
            {c.efacturaRiskCount} facturi risc
          </Badge>
        ) : null}
      </div>

      {/* External trust profile link */}
      <a
        href={`/trust/${client.orgId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted transition hover:bg-eos-surface-variant hover:text-eos-text"
        title="Trust Profile"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="size-3.5" strokeWidth={2} />
      </a>
    </div>
  )
}

// ── Summary strip ─────────────────────────────────────────────────────────────

function PortalSummary({ clients }: { clients: PartnerClientSummary[] }) {
  const active = clients.filter((c) => c.status === "active")
  const withData = active.filter((c) => c.compliance?.hasData)
  const redClients = active.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
  const avgScore =
    withData.length > 0
      ? Math.round(withData.reduce((sum, c) => sum + (c.compliance?.score ?? 0), 0) / withData.length)
      : 0

  const stats = [
    { label: "Total clienți", value: active.length },
    { label: "Cu date", value: withData.length },
    { label: "Scor mediu", value: withData.length > 0 ? `${avgScore}%` : "—" },
    { label: "Alerte critice", value: redClients.length },
  ]

  return (
    <div className="grid grid-cols-2 divide-x divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5 px-5 py-3.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
            {s.label}
          </span>
          <span className="text-lg font-semibold text-eos-text">{s.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Sortable header cell ───────────────────────────────────────────────────────

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

// ── CSV Import Modal ──────────────────────────────────────────────────────────

function CsvImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ message: string; errors: string[] } | null>(null)

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    const csvContent = await file.text()
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch("/api/partner/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent }),
      })
      const data = (await res.json()) as { message: string; errors: string[] }
      setResult(data)
      if ((data.errors?.length ?? 0) === 0) {
        setTimeout(() => { onSuccess(); onClose() }, 1500)
      }
    } catch (err) {
      setResult({ message: err instanceof Error ? err.message : "Eroare la import.", errors: [] })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-eos-lg border border-eos-border bg-eos-surface p-6 shadow-xl">
        <h2 className="text-base font-semibold text-eos-text">Import clienți CSV</h2>
        <p className="mt-1 text-xs text-eos-text-muted">
          Format: <code className="rounded bg-eos-bg-inset px-1">orgName,cui,sector,employeeCount,email</code>
        </p>
        <p className="mt-1 text-[10px] text-eos-text-tertiary">
          Sectoare valide: energy, transport, banking, health, digital-infrastructure,
          public-admin, finance, retail, manufacturing, professional-services, other
        </p>
        <p className="mt-0.5 text-[10px] text-eos-text-tertiary">
          Angajați: 1-9 · 10-49 · 50-249 · 250+
        </p>

        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-eos-primary file:px-2 file:py-1 file:text-[11px] file:text-white"
          />
        </div>

        {result && (
          <div className={`mt-3 rounded-eos-md p-3 text-xs ${result.errors.length > 0 ? "bg-eos-warning-soft text-eos-warning-fg" : "bg-eos-success-soft text-eos-success-fg"}`}>
            <p className="font-medium">{result.message}</p>
            {result.errors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Anulează</Button>
          <Button size="sm" onClick={() => void handleImport()} disabled={importing} className="gap-1.5">
            <Upload className="size-3.5" strokeWidth={2} />
            {importing ? "Se importă..." : "Importă"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PartnerPage() {
  const router = useRouter()
  const [clients, setClients] = useState<PartnerClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  // ── Filters + Sort + Search ───────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all")
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("alerts")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function handleExportCSV() {
    const dateLabel = new Date().toISOString().split("T")[0]
    const header = ["orgName", "orgId", "scor", "alerte_critice", "alerte_totale", "status"].join(",")
    const rows = clients.map((c) => [
      `"${c.orgName.replace(/"/g, '""')}"`,
      c.orgId,
      c.compliance?.score ?? 0,
      c.compliance?.redAlerts ?? 0,
      c.compliance?.openAlerts ?? 0,
      c.status,
    ].join(","))
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `partner-clients-${dateLabel}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function fetchClients() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/partner/clients", { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut incarca lista de clienți.")
      const data = (await res.json()) as { clients: PartnerClientSummary[] }
      setClients(data.clients)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchClients() }, [])

  const activeClients = clients.filter((c) => c.status === "active")

  const filteredClients = useMemo(() => {
    let list = activeClients

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.orgName.toLowerCase().includes(q) || c.orgId.includes(q))
    }

    // Score filter
    if (scoreFilter !== "all") {
      list = list.filter((c) => {
        const score = c.compliance?.score ?? -1
        if (scoreFilter === "under50") return score < 50
        if (scoreFilter === "50to75") return score >= 50 && score <= 75
        if (scoreFilter === "over75") return score > 75
        return true
      })
    }

    // Alert filter
    if (alertFilter === "withAlerts") {
      list = list.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
    }

    // Sort
    list = [...list].sort((a, b) => {
      let va = 0, vb = 0
      if (sortKey === "orgName") {
        const cmp = a.orgName.localeCompare(b.orgName, "ro")
        return sortDir === "asc" ? cmp : -cmp
      }
      if (sortKey === "score") {
        va = a.compliance?.score ?? -1
        vb = b.compliance?.score ?? -1
      }
      if (sortKey === "alerts") {
        va = a.compliance?.redAlerts ?? 0
        vb = b.compliance?.redAlerts ?? 0
      }
      return sortDir === "asc" ? va - vb : vb - va
    })

    return list
  }, [activeClients, search, scoreFilter, alertFilter, sortKey, sortDir])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  const alertClients = activeClients.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)

  return (
    <div className="space-y-6">
      {showImport && (
        <CsvImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => void fetchClients()}
        />
      )}

      <PageIntro
        eyebrow="Partner Portal"
        title="Dashboard multi-client"
        description="Vizualizare centralizată a tuturor organizațiilor unde ești înregistrat. Monitorizează conformitatea clienților tăi dintr-un singur loc."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {activeClients.length} clienți activi
            </Badge>
            {alertClients.length > 0 && (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {alertClients.length} cu alerte critice
              </Badge>
            )}
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowImport(true)}
              className="gap-2"
            >
              <Upload className="size-3.5" strokeWidth={2} />
              Import CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="size-3.5" strokeWidth={2} />
              Exportă CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void fetchClients()}
              className="gap-2"
            >
              <RefreshCw className="size-3.5" strokeWidth={2} />
              Actualizează
            </Button>
          </div>
        }
      />

      {/* ── V4.3 URGENTE ACUM ────────────────────────────────────────────── */}
      {(() => {
        const withRejected = activeClients.filter((c) => (c.compliance?.efacturaRiskCount ?? 0) > 0)
        const withCritical = activeClients.filter((c) => (c.compliance?.redAlerts ?? 0) > 0)
        const notDnsc = activeClients.filter((c) => c.compliance?.nis2RescueNeeded)
        const lowScore = activeClients.filter((c) => (c.compliance?.score ?? 100) < 50 && c.compliance?.hasData)
        const urgencies = [
          withRejected.length > 0 && { label: `${withRejected.length} client${withRejected.length > 1 ? "ți" : ""} cu facturi respinse ANAF`, filter: () => setAlertFilter("withAlerts") },
          withCritical.length > 0 && { label: `${withCritical.length} client${withCritical.length > 1 ? "ți" : ""} cu findings critice`, filter: () => setAlertFilter("withAlerts") },
          notDnsc.length > 0 && { label: `${notDnsc.length} client${notDnsc.length > 1 ? "ți" : ""} DNSC neînregistrați`, filter: () => {} },
          lowScore.length > 0 && { label: `${lowScore.length} client${lowScore.length > 1 ? "ți" : ""} cu scor sub 50%`, filter: () => setScoreFilter("under50") },
        ].filter(Boolean) as { label: string; filter: () => void }[]

        if (urgencies.length === 0) return null
        return (
          <div className="rounded-eos-xl border border-eos-error/20 bg-eos-error-soft px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-eos-error" strokeWidth={2} />
              <span className="text-sm font-semibold text-eos-error">Urgențe acum — {urgencies.length} categorii</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {urgencies.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={u.filter}
                  className="flex items-center gap-2 rounded-eos-md border border-eos-error/20 bg-white/60 px-3 py-2 text-left text-sm text-eos-error hover:bg-white/80 dark:bg-black/10 dark:hover:bg-black/20"
                >
                  <span className="size-2 shrink-0 rounded-full bg-eos-error" />
                  {u.label}
                  <span className="ml-auto text-[10px] underline">Filtrează →</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      <PortalSummary clients={activeClients} />

      {/* ── Search + Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-eos-text-muted" strokeWidth={2} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume sau ID..."
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface pl-9 pr-3 py-2 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
          />
        </div>

        {/* Score filter */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate scorurile</option>
          <option value="under50">Sub 50%</option>
          <option value="50to75">50–75%</option>
          <option value="over75">Peste 75%</option>
        </select>

        {/* Alert filter */}
        <select
          value={alertFilter}
          onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
          className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text focus:outline-none"
        >
          <option value="all">Toate alertele</option>
          <option value="withAlerts">Cu alerte critice</option>
        </select>
      </div>

      <Card className="divide-y divide-eos-border-subtle overflow-hidden border-eos-border bg-eos-surface">
        {activeClients.length === 0 ? (
          <EmptyState
            title="Niciun client activ"
            label="Adaugă organizații sau acceptă invitații pentru a vedea clienții."
            icon={Users}
            className="px-5 py-10"
          />
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-eos-text-muted">
            Niciun client nu corespunde filtrelor aplicate.
          </div>
        ) : (
          <>
            {/* Sortable header row */}
            <div className="flex flex-wrap items-center gap-4 bg-eos-bg-inset px-5 py-2">
              <div className="flex-1">
                <SortHeader label="Organizație" sortKey="orgName" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="w-28 shrink-0">
                <SortHeader label="Scor" sortKey="score" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <div className="hidden w-32 shrink-0 sm:block">
                <SortHeader label="Alerte" sortKey="alerts" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
              </div>
              <p className="hidden w-20 shrink-0 text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary sm:block">
                Module
              </p>
              <div className="size-7 shrink-0" />
            </div>

            {filteredClients.map((client) => (
              <ClientRow
                key={client.orgId}
                client={client}
                onDrillDown={(id) => router.push(`/dashboard/partner/${id}`)}
              />
            ))}
          </>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <Building2 className="mb-1.5 size-4 text-eos-text-tertiary" strokeWidth={1.5} />
        <p className="font-medium text-eos-text">Contabil sau DPO consultant?</p>
        <p className="mt-0.5">
          Adaugă clienți noi invitându-i direct din pagina Setări → Echipă a fiecărei organizații.
          Sau folosește butonul <strong>Import CSV</strong> pentru import în masă.
        </p>
      </div>
    </div>
  )
}
