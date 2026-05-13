"use client"

// FC-3 Pas 10 — Cross-correlation cross-client pe /portfolio/fiscal.
// Tabel cu un rând per client din portofoliu cu counts errors/warnings/ok
// per regulă (R1+R2+R3+R5). Click rând → drawer cu findings complete pentru
// acel client (folosește același vizual ca CrossCorrelationCard).

import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "ok" | "warning" | "critical"

type Severity = "ok" | "info" | "warning" | "error"

type ClientRow = {
  orgId: string
  orgName: string
  lastReportAtISO: string | null
  totalChecks: number
  errors: number
  warnings: number
  ok: number
  info: number
  byRule: { R1: number; R2: number; R3: number; R5: number }
  riskLevel: RiskLevel
  inputs: { declarations: number; aga: number; invoices: number; onrc: number }
  topFindings: Array<{
    id: string
    rule: string
    severity: string
    title: string
    period: string | null
  }>
}

type Summary = {
  totalClients: number
  criticalClients: number
  warningClients: number
  okClients: number
  totalErrors: number
  totalWarnings: number
  clientsWithInputs: number
}

type SourceRef = {
  type: "d300" | "d205" | "d100" | "aga" | "invoice" | "onrc"
  id: string
  label: string
  period?: string | null
  value?: number
  valueLabel?: string
}

type DiffData = {
  expected: number
  actual: number
  diff: number
  diffPercent: number
  label?: string
}

type Finding = {
  id: string
  rule: "R1" | "R2" | "R3" | "R5"
  ruleName: string
  severity: Severity
  title: string
  summary: string
  detail: string
  period: string | null
  sources: SourceRef[]
  diff?: DiffData
  legalReference?: string
  suggestion?: string
}

type ClientDetail = {
  client: { orgId: string; orgName: string }
  report: {
    generatedAtISO: string
    findings: Finding[]
    summary: { totalChecks: number; errors: number; warnings: number; ok: number; info: number }
  }
}

// ── Visual config ───────────────────────────────────────────────────────────

const RISK_TONE: Record<RiskLevel, string> = {
  ok: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  warning: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const RISK_LABEL: Record<RiskLevel, string> = {
  ok: "OK",
  warning: "Atenție",
  critical: "Critic",
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  error: {
    label: "Eroare",
    tone: "border-eos-error/30 bg-eos-error-soft text-eos-error",
    icon: AlertCircle,
  },
  warning: {
    label: "Avertisment",
    tone: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    tone: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
    icon: Info,
  },
  ok: {
    label: "OK",
    tone: "border-eos-success/30 bg-eos-success-soft text-eos-success",
    icon: CheckCircle2,
  },
}

const SOURCE_LABELS: Record<SourceRef["type"], string> = {
  d300: "D300",
  d205: "D205",
  d100: "D100",
  aga: "AGA",
  invoice: "Factură",
  onrc: "ONRC",
}

const SOURCE_TONES: Record<SourceRef["type"], string> = {
  d300: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  d205: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  d100: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  aga: "border-eos-border bg-eos-surface-elevated text-eos-text",
  invoice: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  onrc: "border-eos-border bg-eos-surface-elevated text-eos-text",
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function PortfolioCrossCorrelationPanel() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<ClientDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | RiskLevel>("all")

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/partner/portfolio/cross-correlation", {
        cache: "no-store",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca cross-correlation cross-client.")
        return
      }
      const data = await res.json()
      setSummary(data.summary ?? null)
      setClients(data.clients ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function openDetail(orgId: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(
        `/api/partner/portfolio/cross-correlation?orgId=${encodeURIComponent(orgId)}`,
        { cache: "no-store" },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca detaliul clientului.")
        return
      }
      const data = await res.json()
      setSelectedDetail({ client: data.client, report: data.report })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredClients =
    filter === "all" ? clients : clients.filter((c) => c.riskLevel === filter)

  return (
    <>
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-eos-primary" strokeWidth={2} />
              <h2
                data-display-text="true"
                className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                Cross-Correlation — vedere cross-client
              </h2>
              <span className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                R1 · R2 · R3 · R5
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
              Motorul de cross-correlation rulează live pe state-ul fiecărui client din portofoliu.
              Tabelul de mai jos arată câte erori/warnings au fost detectate per client per regulă.
              Click pe orice rând pentru a vedea findings complete cu drawer diff.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[12px] font-medium text-eos-text hover:border-eos-primary disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : "Reîmprospătează"}
          </button>
        </header>

        {/* Summary tiles */}
        {summary && (
          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-6">
            <SummaryTile label="Clienți" value={summary.totalClients} tone="border-eos-border bg-eos-surface-elevated text-eos-text" />
            <SummaryTile label="Critici" value={summary.criticalClients} tone={RISK_TONE.critical} />
            <SummaryTile label="Atenție" value={summary.warningClients} tone={RISK_TONE.warning} />
            <SummaryTile label="OK" value={summary.okClients} tone={RISK_TONE.ok} />
            <SummaryTile label="Σ Erori" value={summary.totalErrors} tone="border-eos-error/30 bg-eos-error-soft text-eos-error" />
            <SummaryTile label="Σ Warnings" value={summary.totalWarnings} tone="border-eos-warning/30 bg-eos-warning-soft text-eos-warning" />
          </div>
        )}

        {/* Risk filter */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
            Filtru
          </span>
          {(["all", "critical", "warning", "ok"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-eos-sm border px-2 py-1 text-[10.5px] font-medium ${
                filter === f
                  ? "border-eos-primary bg-eos-primary text-white"
                  : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
              }`}
            >
              {f === "all"
                ? `Toate (${clients.length})`
                : f === "critical"
                  ? `Critici (${summary?.criticalClients ?? 0})`
                  : f === "warning"
                    ? `Atenție (${summary?.warningClients ?? 0})`
                    : `OK (${summary?.okClients ?? 0})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Încarc clienții din portofoliu...
          </div>
        ) : clients.length === 0 ? (
          <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
            Nu există clienți în portofoliu sau date pentru cross-correlation.
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
            Niciun client pentru filtrul selectat.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-eos-surface text-left">
                <tr className="text-eos-text-tertiary">
                  <th className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Client
                  </th>
                  <th className="px-2 py-2.5 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Risc
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    R1
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    R2
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    R3
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    R5
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Erori
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Warn
                  </th>
                  <th className="px-2 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    OK
                  </th>
                  <th className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Top finding
                  </th>
                  <th className="px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => (
                  <tr
                    key={c.orgId}
                    onClick={() => openDetail(c.orgId)}
                    className="cursor-pointer border-t border-eos-border transition hover:bg-eos-surface"
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-eos-text">{c.orgName}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-eos-text-tertiary">
                        {c.inputs.declarations} decl · {c.inputs.aga} AGA · {c.inputs.invoices} facturi · {c.inputs.onrc} ONRC
                      </p>
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-eos-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] ${RISK_TONE[c.riskLevel]}`}
                      >
                        {RISK_LABEL[c.riskLevel]}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      <RuleBadge n={c.byRule.R1} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      <RuleBadge n={c.byRule.R2} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      <RuleBadge n={c.byRule.R3} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono">
                      <RuleBadge n={c.byRule.R5} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono font-semibold">
                      <span className={c.errors > 0 ? "text-eos-error" : "text-eos-text-tertiary"}>
                        {c.errors}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono font-semibold">
                      <span className={c.warnings > 0 ? "text-eos-warning" : "text-eos-text-tertiary"}>
                        {c.warnings}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-eos-text-tertiary">
                      {c.ok}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.topFindings.length === 0 ? (
                        <span className="text-[10.5px] text-eos-text-tertiary">—</span>
                      ) : (
                        <p className="truncate text-[11px] text-eos-text-muted">
                          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                            {c.topFindings[0]!.rule}
                          </span>{" "}
                          {c.topFindings[0]!.title}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <ChevronRight className="ml-auto size-4 text-eos-text-tertiary" strokeWidth={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail drawer */}
      {(selectedDetail || detailLoading) && (
        <ClientDetailDrawer
          detail={selectedDetail}
          loading={detailLoading}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </>
  )
}

// ── Drawer detaliu client ───────────────────────────────────────────────────

function ClientDetailDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: ClientDetail | null
  loading: boolean
  onClose: () => void
}) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [ruleFilter, setRuleFilter] = useState<"all" | Finding["rule"]>("all")

  useEffect(() => {
    setSelectedFinding(null)
    setRuleFilter("all")
  }, [detail?.client.orgId])

  const findings = detail?.report.findings ?? []
  const filteredFindings =
    ruleFilter === "all" ? findings : findings.filter((f) => f.rule === ruleFilter)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-eos-border bg-eos-surface shadow-eos-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-eos-border bg-eos-surface-elevated px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Detaliu cross-correlation
            </p>
            <p
              data-display-text="true"
              className="mt-1 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              {detail?.client.orgName ?? "Se încarcă..."}
            </p>
            {detail && (
              <p className="mt-1 text-[11px] text-eos-text-muted">
                {detail.report.findings.length} findings · {detail.report.summary.errors} erori ·{" "}
                {detail.report.summary.warnings} warnings · {detail.report.summary.ok} OK
              </p>
            )}
          </div>
          {detail && (
            <Link
              href={`/portfolio/client/${detail.client.orgId}`}
              className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1.5 text-[11px] text-eos-text-muted hover:border-eos-primary hover:text-eos-primary"
            >
              <ExternalLink className="size-3" strokeWidth={2} />
              Deschide client
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-eos-sm border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Lista findings */}
          <div className="w-1/2 overflow-y-auto border-r border-eos-border">
            <div className="border-b border-eos-border bg-eos-surface-elevated px-3 py-2">
              <div className="flex flex-wrap gap-1">
                {(["all", "R1", "R2", "R3", "R5"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRuleFilter(r)}
                    className={`rounded-eos-sm border px-2 py-0.5 text-[10px] font-medium ${
                      ruleFilter === r
                        ? "border-eos-primary bg-eos-primary text-white"
                        : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
                    }`}
                  >
                    {r === "all" ? "Toate" : r}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-[12px] text-eos-text-muted">
                <Loader2 className="-mt-0.5 mr-1.5 inline size-3.5 animate-spin" strokeWidth={2} />
                Se încarcă...
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-4 text-[12px] text-eos-text-muted">
                Niciun finding pentru filtrul selectat.
              </div>
            ) : (
              <ul className="divide-y divide-eos-border">
                {filteredFindings.map((f) => {
                  const cfg = SEVERITY_CONFIG[f.severity]
                  const Icon = cfg.icon
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedFinding(f)}
                        className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-eos-surface ${
                          selectedFinding?.id === f.id ? "bg-eos-surface" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-eos-sm border ${cfg.tone}`}
                        >
                          <Icon className="size-3" strokeWidth={2.5} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-semibold text-eos-text">
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                              {f.rule}
                            </span>{" "}
                            {f.title}
                          </p>
                          <p className="mt-0.5 text-[10.5px] leading-[1.45] text-eos-text-muted">
                            {f.summary}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Detail panel */}
          <div className="w-1/2 overflow-y-auto bg-eos-surface-elevated/30 p-4">
            {selectedFinding ? (
              <FindingDetailContent finding={selectedFinding} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-eos-text-tertiary">
                <Info className="size-6" strokeWidth={1.8} />
                <p className="text-[12px]">
                  Selectează un finding din lista din stânga pentru a vedea detaliile cu surse și diff.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Finding detail content (reused with CrossCorrelationCard drawer) ────────

function FindingDetailContent({ finding }: { finding: Finding }) {
  const cfg = SEVERITY_CONFIG[finding.severity]
  const Icon = cfg.icon
  return (
    <div className="space-y-3 text-[12px] leading-[1.55] text-eos-text">
      <div className="flex items-start gap-2">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-eos-sm border ${cfg.tone}`}>
          <Icon className="size-4" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
            {finding.ruleName} · {cfg.label}
            {finding.period && ` · ${finding.period}`}
          </p>
          <p
            data-display-text="true"
            className="mt-0.5 font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            {finding.title}
          </p>
        </div>
      </div>

      <p>{finding.detail}</p>

      {finding.diff && (
        <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            Diff numeric{finding.diff.label ? ` · ${finding.diff.label}` : ""}
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <DiffTile label="Așteptat" value={fmtNumber(finding.diff.expected)} />
            <DiffTile label="Găsit" value={fmtNumber(finding.diff.actual)} />
            <DiffTile
              label="Diferență"
              value={`${finding.diff.diff >= 0 ? "+" : ""}${fmtNumber(finding.diff.diff)}`}
              sub={`${(finding.diff.diffPercent * 100).toFixed(1)}%`}
              highlight
            />
          </div>
        </div>
      )}

      {finding.sources.length > 0 && (
        <div>
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Surse referințe ({finding.sources.length})
          </p>
          <ul className="mt-1.5 space-y-1">
            {finding.sources.slice(0, 20).map((s, idx) => (
              <li
                key={`${s.id}-${idx}`}
                className="flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1.5 text-[10.5px]"
              >
                <span
                  className={`shrink-0 rounded-eos-sm border px-1 py-0 font-mono text-[9px] font-semibold uppercase ${SOURCE_TONES[s.type]}`}
                >
                  {SOURCE_LABELS[s.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-eos-text">{s.label}</p>
                  {s.value !== undefined && (
                    <p className="text-[10px] text-eos-text-muted">
                      {s.valueLabel ?? "Val"}:{" "}
                      <strong>{typeof s.value === "number" ? fmtNumber(s.value) : s.value}</strong>
                      {s.period && (
                        <span className="ml-1 font-mono text-[9px] text-eos-text-tertiary">
                          · {s.period}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            ))}
            {finding.sources.length > 20 && (
              <li className="text-center text-[10px] text-eos-text-tertiary">
                + încă {finding.sources.length - 20} surse...
              </li>
            )}
          </ul>
        </div>
      )}

      {finding.suggestion && (
        <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary-soft px-3 py-2 text-eos-primary">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em]">Recomandare</p>
          <p className="mt-0.5 text-[11px] leading-[1.5]">{finding.suggestion}</p>
        </div>
      )}

      {finding.legalReference && (
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[10.5px] text-eos-text-muted">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-eos-text-tertiary">
            Referință legală
          </span>
          <p className="mt-0.5">{finding.legalReference}</p>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className={`rounded-eos-sm border px-3 py-2 ${tone}`}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </p>
      <p data-display-text="true" className="mt-0.5 font-display text-[18px] font-bold">
        {value}
      </p>
    </div>
  )
}

function RuleBadge({ n }: { n: number }) {
  if (n === 0) return <span className="text-eos-text-tertiary">·</span>
  return (
    <span
      className={`inline-block rounded-eos-sm border px-1.5 py-0 font-mono text-[10.5px] font-bold ${
        n > 0 ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" : ""
      }`}
    >
      {n}
    </span>
  )
}

function DiffTile({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-eos-sm border px-2 py-1 ${
        highlight
          ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
          : "border-eos-border bg-eos-surface text-eos-text"
      }`}
    >
      <p
        className={`font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${highlight ? "opacity-80" : "text-eos-text-muted"}`}
      >
        {label}
      </p>
      <p data-display-text="true" className="mt-0.5 font-display text-[12px] font-bold">
        {value}
      </p>
      {sub && (
        <p
          className={`mt-0.5 font-mono text-[9px] ${highlight ? "opacity-70" : "text-eos-text-tertiary"}`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
