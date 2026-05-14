"use client"

// FC-8 (2026-05-14) — Client Burden Index card pentru cabinet.
//
// Afișare:
//   - 5 tile-uri summary (totalClienti, avgBurden, totalHours, totalRisk, %high)
//   - Strategic recommendation banner
//   - Tab-uri: Top Burden / Top Toxic / Top Risk
//   - Listă clienți cu burden score, classification, hours/lună, risk RON, recomandare
//
// Read-only — datele vin din /api/partner/portfolio/client-burden.

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Skull,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

type Classification = "profitable" | "normal" | "toxic" | "high-touch" | "dormant"

type ClientMetrics = {
  orgId: string
  orgName: string
  totalExceptions: number
  exceptionsPerMonth: number
  recurrentExceptions: number
  cabinetHoursPerMonth: number
  activeFiscalRiskRON: number
  filingComplianceRate: number
  problematicFilings: number
  responseBehavior: "fast" | "normal" | "slow" | "non-responsive"
  monthlyFeeRON: number | null
  burdenScore: number
  costToFeeRatio: number | null
  classification: Classification
  recommendation: string
}

type BurdenReport = {
  clients: ClientMetrics[]
  topBurden: ClientMetrics[]
  topToxic: ClientMetrics[]
  topFiscalRisk: ClientMetrics[]
  summary: {
    totalClients: number
    avgBurdenScore: number
    totalCabinetHoursPerMonth: number
    totalActiveRiskRON: number
    byClassification: Record<Classification, number>
    highBurdenPct: number
  }
  topRecommendation: string
}

type Tab = "burden" | "toxic" | "risk"

export function ClientBurdenIndexCard() {
  const [report, setReport] = useState<BurdenReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("burden")

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/partner/portfolio/client-burden")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare la încărcare.")
      }
      const data = await res.json()
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  if (!report && !loading && !error) return null

  const list =
    tab === "burden"
      ? report?.topBurden ?? []
      : tab === "toxic"
        ? report?.topToxic ?? []
        : report?.topFiscalRisk ?? []

  return (
    <section className="space-y-4 rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Profitabilitate client
          </p>
          <h3
            data-display-text="true"
            className="mt-1 font-display text-[20px] font-semibold tracking-[-0.025em] text-eos-text"
          >
            Cine îți consumă cabinetul
          </h3>
          <p className="mt-1 max-w-3xl text-[12.5px] leading-[1.5] text-eos-text-muted">
            Per client: excepții/lună, ore consumate, risc fiscal activ, clasificare. Vezi care e profitabil, care e neprofitabil, care e candidat pentru renegociere fee.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReport}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-[11.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
          {loading ? "..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Strategic banner */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 text-amber-300" strokeWidth={2} />
              <p className="text-[12.5px] font-medium leading-[1.5] text-eos-text">
                {report.topRecommendation}
              </p>
            </div>
          </div>

          {/* 5 summary tiles */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Tile
              icon={<Users className="size-3.5" strokeWidth={2} />}
              label="Total clienți"
              value={String(report.summary.totalClients)}
            />
            <Tile
              icon={<TrendingUp className="size-3.5" strokeWidth={2} />}
              label="Burden mediu"
              value={`${report.summary.avgBurdenScore}/100`}
              tone={report.summary.avgBurdenScore >= 60 ? "danger" : report.summary.avgBurdenScore >= 40 ? "warning" : "ok"}
            />
            <Tile
              icon={<Clock className="size-3.5" strokeWidth={2} />}
              label="Total ore cabinet/lună"
              value={`${report.summary.totalCabinetHoursPerMonth}h`}
            />
            <Tile
              icon={<AlertTriangle className="size-3.5" strokeWidth={2} />}
              label="Risc fiscal portofoliu"
              value={`${Math.round(report.summary.totalActiveRiskRON / 1000)}k RON`}
              tone={report.summary.totalActiveRiskRON > 50000 ? "danger" : "warning"}
            />
            <Tile
              icon={<Skull className="size-3.5" strokeWidth={2} />}
              label="Clienți toxici"
              value={String(report.summary.byClassification.toxic)}
              tone={report.summary.byClassification.toxic > 0 ? "danger" : "ok"}
            />
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 border-b border-eos-border">
            <TabButton
              active={tab === "burden"}
              onClick={() => setTab("burden")}
              label={`Top burden (${report.topBurden.length})`}
            />
            <TabButton
              active={tab === "toxic"}
              onClick={() => setTab("toxic")}
              label={`Top toxic (${report.topToxic.length})`}
            />
            <TabButton
              active={tab === "risk"}
              onClick={() => setTab("risk")}
              label={`Top risc fiscal (${report.topFiscalRisk.length})`}
            />
          </nav>

          {/* List */}
          <ul className="space-y-2">
            {list.length === 0 ? (
              <li className="rounded-lg border border-eos-border bg-eos-surface-subtle px-3 py-4 text-center text-[12.5px] text-eos-text-muted">
                Niciun client în această categorie.
              </li>
            ) : (
              list.map((c, idx) => <ClientRow key={c.orgId} rank={idx + 1} client={c} />)
            )}
          </ul>
        </>
      )}
    </section>
  )
}

function Tile({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "ok" | "warning" | "danger" | "neutral"
}) {
  const toneCls =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10"
        : tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-eos-border bg-eos-surface-subtle"
  return (
    <div className={`rounded-lg border ${toneCls} p-2`}>
      <div className="flex items-center gap-1.5 text-eos-text-muted">
        {icon}
        <p className="text-[10.5px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 font-display text-[16px] font-semibold tracking-[-0.02em] text-eos-text">
        {value}
      </p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-[12px] font-medium transition ${
        active
          ? "border-eos-primary text-eos-text"
          : "border-transparent text-eos-text-muted hover:text-eos-text"
      }`}
    >
      {label}
    </button>
  )
}

function ClientRow({ rank, client }: { rank: number; client: ClientMetrics }) {
  const classBadge =
    client.classification === "toxic"
      ? { cls: "bg-red-500/15 text-red-300 border-red-500/30", label: "NEPROFITABIL" }
      : client.classification === "high-touch"
        ? { cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", label: "EFORT MARE" }
        : client.classification === "profitable"
          ? { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", label: "PROFITABIL" }
          : client.classification === "dormant"
            ? { cls: "bg-eos-surface-elevated text-eos-text-muted border-eos-border", label: "INACTIV" }
            : { cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", label: "NORMAL" }

  const responseBadge =
    client.responseBehavior === "non-responsive"
      ? { cls: "text-red-300", label: "Nu răspunde" }
      : client.responseBehavior === "slow"
        ? { cls: "text-amber-300", label: "Lent" }
        : client.responseBehavior === "fast"
          ? { cls: "text-emerald-300", label: "Rapid" }
          : { cls: "text-eos-text-muted", label: "Normal" }

  const burdenTone =
    client.burdenScore >= 60
      ? "text-red-300"
      : client.burdenScore >= 40
        ? "text-amber-300"
        : "text-emerald-300"

  return (
    <li className="rounded-lg border border-eos-border bg-eos-surface-subtle p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-eos-surface font-mono text-[10.5px] font-semibold text-eos-text-muted">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-mono text-[13px] font-semibold text-eos-text truncate">
              {client.orgName}
            </h4>
            <span
              className={`inline-flex shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase ${classBadge.cls}`}
            >
              {classBadge.label}
            </span>
            <span className={`text-[10.5px] font-medium ${responseBadge.cls}`}>
              · {responseBadge.label}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-5">
            <Stat label="Burden" value={`${client.burdenScore}/100`} valueClass={burdenTone} />
            <Stat label="Excepții/lună" value={String(client.exceptionsPerMonth)} />
            <Stat label="Ore/lună" value={`${client.cabinetHoursPerMonth}h`} />
            <Stat
              label="Risc activ"
              value={`${Math.round(client.activeFiscalRiskRON / 100) / 10}k RON`}
              valueClass={client.activeFiscalRiskRON > 5000 ? "text-red-300" : ""}
            />
            <Stat
              label={client.monthlyFeeRON ? "Cost/Fee" : "Fee"}
              value={
                client.costToFeeRatio !== null
                  ? `${Math.round(client.costToFeeRatio * 100)}%`
                  : client.monthlyFeeRON !== null
                    ? `${client.monthlyFeeRON} RON`
                    : "—"
              }
              valueClass={
                client.costToFeeRatio !== null && client.costToFeeRatio > 0.5 ? "text-red-300" : ""
              }
            />
          </div>

          {client.recurrentExceptions > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-300">
              <TrendingDown className="size-3" strokeWidth={2} />
              {client.recurrentExceptions} excepții recurente
            </p>
          )}

          <p className="mt-2 text-[12px] leading-[1.5] text-eos-text-muted">
            <span className="font-semibold text-eos-text">Recomandare:</span>{" "}
            {client.recommendation}
          </p>
        </div>
      </div>
    </li>
  )
}

function Stat({
  label,
  value,
  valueClass = "",
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-md bg-eos-surface px-2 py-1.5">
      <p className="text-[9.5px] font-medium uppercase tracking-wide text-eos-text-muted">
        {label}
      </p>
      <p className={`font-mono text-[12px] font-semibold text-eos-text ${valueClass}`}>{value}</p>
    </div>
  )
}
