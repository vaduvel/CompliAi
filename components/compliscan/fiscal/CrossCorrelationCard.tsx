"use client"

// Cross-Correlation Card — UI principală pe /dashboard/fiscal pentru Pas 7-9.
// Afișează: ultimul raport (cu summary tiles + listă findings), buton
// "Rulează acum", drawer detaliu cu diff vizual (Pas 9).

import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Play,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ── Types (mirror engine output) ────────────────────────────────────────────

type Rule = "R1" | "R2" | "R3" | "R5" | "R6" | "R7"
type Severity = "ok" | "info" | "warning" | "error"

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
  rule: Rule
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
  economicImpact?: EconomicImpactData
}

type EconomicImpactData = {
  affectedAmountRON: number | null
  penaltyMinRON: number
  penaltyMaxRON: number
  remediationHours: number
  retransmissions: number
  totalCostMinRON: number
  totalCostMaxRON: number
  legalReferences: string[]
  computationNote: string
}

type Report = {
  generatedAtISO: string
  findings: Finding[]
  summary: {
    totalChecks: number
    ok: number
    info: number
    warnings: number
    errors: number
    economic?: {
      totalAffectedRON: number
      totalPenaltyMinRON: number
      totalPenaltyMaxRON: number
      totalRemediationHours: number
      totalRetransmissions: number
      totalCostMinRON: number
      totalCostMaxRON: number
      impactfulFindingsCount: number
    }
    byRule: Record<
      Rule,
      { ok: number; warning: number; error: number; info: number }
    >
  }
  inputs: {
    d300Count: number
    d205Count: number
    d100Count: number
    agaCount: number
    invoicesCount: number
    onrcCount: number
  }
}

type HasInputs = {
  declarations: number
  aga: number
  invoices: number
  onrc: number
}

const RULE_LABELS: Record<Rule, string> = {
  R6: "R6 · Termen ↔ Depunere",
  R7: "R7 · Frecvență TVA",
  R1: "R1 · Facturi ↔ D300",
  R2: "R2 · AGA ↔ D205",
  R3: "R3 · AGA ↔ ONRC",
  R5: "R5 · D205 ↔ D100",
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

function fmtRON(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })
}

// ── Component ────────────────────────────────────────────────────────────────

export function CrossCorrelationCard() {
  const [report, setReport] = useState<Report | null>(null)
  const [hasInputs, setHasInputs] = useState<HasInputs>({
    declarations: 0,
    aga: 0,
    invoices: 0,
    onrc: 0,
  })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [ruleFilter, setRuleFilter] = useState<Rule | "ALL">("ALL")

  useEffect(() => {
    void loadReport()
  }, [])

  async function loadReport() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/cross-correlation", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca raportul.")
        return
      }
      const data = await res.json()
      setReport(data.report ?? null)
      if (data.hasInputs) setHasInputs(data.hasInputs)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function runEngine() {
    setRunning(true)
    try {
      const res = await fetch("/api/fiscal/cross-correlation", { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Rulare eșuată.")
        return
      }
      const r = body.report as Report
      toast.success(
        `Cross-correlation rulat: ${r.summary.errors} erori · ${r.summary.warnings} warnings · ${r.summary.ok} OK.`,
      )
      setReport(r)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setRunning(false)
    }
  }

  const hasAnyData =
    hasInputs.declarations > 0 ||
    hasInputs.aga > 0 ||
    hasInputs.invoices > 0 ||
    hasInputs.onrc > 0

  const filteredFindings = report
    ? ruleFilter === "ALL"
      ? report.findings
      : report.findings.filter((f) => f.rule === ruleFilter)
    : []

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
                Cross-Correlation — 4 reguli FC-3
              </h2>
              <span className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                R1 · R2 · R3 · R5
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
              Motor automat care detectează neconcordanțe între declarații fiscale (D300/D205/D100),
              hotărâri AGA, facturi OCR-ate și date ONRC. Click pe orice finding pentru detalii cu
              surse alăturate.
            </p>
          </div>
          <button
            type="button"
            onClick={runEngine}
            disabled={running || !hasAnyData}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Play className="size-3.5" strokeWidth={2.5} />
            )}
            {running ? "Rulez..." : "Rulează acum"}
          </button>
        </header>

        {/* Inputs status */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <InputTile label="Declarații" value={hasInputs.declarations} hint="D300/D205/D100" />
          <InputTile label="Hotărâri AGA" value={hasInputs.aga} />
          <InputTile label="Facturi OCR" value={hasInputs.invoices} />
          <InputTile label="Snapshot-uri ONRC" value={hasInputs.onrc} />
        </div>

        {!hasAnyData && (
          <div className="mt-4 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11.5px] text-eos-warning">
            <AlertTriangle className="-mt-0.5 mr-1 inline size-3.5" strokeWidth={2.5} />
            Nu există date încărcate. Încarcă declarații, AGA-uri, facturi OCR sau snapshot-uri
            ONRC din sub-paginile fiscale pentru a putea rula cross-correlation.
          </div>
        )}

        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Încarc ultimul raport...
          </div>
        ) : !report ? (
          <div className="mt-5 rounded-eos-md border border-dashed border-eos-border bg-eos-surface-elevated px-4 py-4 text-center text-[12px] text-eos-text-muted">
            Nu există încă un raport. Apasă <strong>Rulează acum</strong> pentru a porni motorul.
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
              <SummaryTile
                label="Total verificări"
                value={report.summary.totalChecks}
                tone="border-eos-border bg-eos-surface-elevated text-eos-text"
              />
              <SummaryTile
                label="Erori"
                value={report.summary.errors}
                tone="border-eos-error/30 bg-eos-error-soft text-eos-error"
              />
              <SummaryTile
                label="Warnings"
                value={report.summary.warnings}
                tone="border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
              />
              <SummaryTile
                label="OK"
                value={report.summary.ok}
                tone="border-eos-success/30 bg-eos-success-soft text-eos-success"
              />
              <SummaryTile
                label="Info"
                value={report.summary.info}
                tone="border-eos-border bg-eos-surface-elevated text-eos-text-muted"
              />
            </div>

            <p className="mt-2 text-[10.5px] text-eos-text-tertiary">
              Generat la {new Date(report.generatedAtISO).toLocaleString("ro-RO")}.
              Sursă: {report.inputs.d300Count} D300 · {report.inputs.d205Count} D205 ·{" "}
              {report.inputs.d100Count} D100 · {report.inputs.agaCount} AGA ·{" "}
              {report.inputs.invoicesCount} facturi · {report.inputs.onrcCount} ONRC.
            </p>

            {/* [FC-5] Economic Impact Summary — cost estimat în LEI */}
            {report.summary.economic &&
              report.summary.economic.impactfulFindingsCount > 0 && (
                <div className="mt-4 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                        💰 Impact economic estimat
                      </p>
                      <p
                        data-display-text="true"
                        className="mt-1 font-display text-[20px] font-bold text-eos-warning"
                      >
                        {fmtRON(report.summary.economic.totalCostMinRON)} –{" "}
                        {fmtRON(report.summary.economic.totalCostMaxRON)} RON
                      </p>
                      <p className="mt-1 text-[11.5px] text-eos-text-muted">
                        Cost total expunere: penalități{" "}
                        {fmtRON(report.summary.economic.totalPenaltyMinRON)}–
                        {fmtRON(report.summary.economic.totalPenaltyMaxRON)} RON +{" "}
                        {report.summary.economic.totalRemediationHours.toFixed(1)}h cabinet ·{" "}
                        {report.summary.economic.totalRetransmissions} retransmiteri ·{" "}
                        {report.summary.economic.impactfulFindingsCount} findings cu impact
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Rule filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                Filtru
              </span>
              <button
                type="button"
                onClick={() => setRuleFilter("ALL")}
                className={`rounded-eos-sm border px-2 py-1 text-[10.5px] font-medium ${
                  ruleFilter === "ALL"
                    ? "border-eos-primary bg-eos-primary text-white"
                    : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
                }`}
              >
                Toate ({report.findings.length})
              </button>
              {(["R1", "R2", "R3", "R5", "R6", "R7"] as Rule[]).map((rule) => {
                const stats = report.summary.byRule[rule]
                const total = stats.ok + stats.warning + stats.error + stats.info
                if (total === 0) return null
                return (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => setRuleFilter(rule)}
                    className={`rounded-eos-sm border px-2 py-1 text-[10.5px] font-medium ${
                      ruleFilter === rule
                        ? "border-eos-primary bg-eos-primary text-white"
                        : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong"
                    }`}
                  >
                    {RULE_LABELS[rule]} ({total})
                  </button>
                )
              })}
            </div>

            {/* Findings list */}
            <div className="mt-3">
              {filteredFindings.length === 0 ? (
                <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
                  Niciun finding pentru filtrul selectat.
                </div>
              ) : (
                <ul className="divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
                  {filteredFindings.map((f) => {
                    const cfg = SEVERITY_CONFIG[f.severity]
                    const Icon = cfg.icon
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedFinding(f)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-eos-surface"
                        >
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-eos-sm border ${cfg.tone}`}
                          >
                            <Icon className="size-3.5" strokeWidth={2.5} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-semibold text-eos-text">
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                                {f.rule}
                              </span>{" "}
                              · {f.title}
                              {f.period && (
                                <span className="ml-1.5 inline-block rounded-eos-sm border border-eos-border bg-eos-surface px-1.5 py-0 font-mono text-[9.5px] text-eos-text-muted">
                                  {f.period}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-[1.5] text-eos-text-muted">
                              {f.summary}
                            </p>
                          </div>
                          <ChevronRight
                            className="size-4 shrink-0 text-eos-text-tertiary"
                            strokeWidth={2}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      {/* Drawer (Pas 9) */}
      {selectedFinding && (
        <FindingDrawer
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </>
  )
}

// ── Drawer cu diff vizual (Pas 9) ───────────────────────────────────────────

function FindingDrawer({
  finding,
  onClose,
}: {
  finding: Finding
  onClose: () => void
}) {
  const cfg = SEVERITY_CONFIG[finding.severity]
  const Icon = cfg.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-eos-border bg-eos-surface shadow-eos-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-eos-border bg-eos-surface-elevated px-5 py-4">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-eos-sm border ${cfg.tone}`}
          >
            <Icon className="size-4" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              <span>{finding.ruleName}</span>
              <span
                className={`rounded-eos-sm border px-1.5 py-0 text-[9.5px] font-bold ${cfg.tone}`}
              >
                {cfg.label}
              </span>
              {finding.period && (
                <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-1.5 py-0 text-[9.5px] text-eos-text-muted">
                  {finding.period}
                </span>
              )}
            </p>
            <p
              data-display-text="true"
              className="mt-1 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              {finding.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-eos-sm border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4 text-[12.5px] leading-[1.6] text-eos-text">
            <p className="text-eos-text">{finding.detail}</p>

            {/* Diff visual */}
            {finding.diff && (
              <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                  Diff numeric{finding.diff.label ? ` · ${finding.diff.label}` : ""}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
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

            {/* Sources side-by-side */}
            {finding.sources.length > 0 && (
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Surse referințe ({finding.sources.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {finding.sources.map((s, idx) => (
                    <li
                      key={`${s.id}-${idx}`}
                      className="flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[11.5px]"
                    >
                      <span
                        className={`shrink-0 rounded-eos-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${SOURCE_TONES[s.type]}`}
                      >
                        {SOURCE_LABELS[s.type]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-eos-text">{s.label}</p>
                        {s.value !== undefined && (
                          <p className="text-[10.5px] text-eos-text-muted">
                            {s.valueLabel ?? "Valoare"}:{" "}
                            <strong className="text-eos-text">
                              {typeof s.value === "number" ? fmtRON(s.value) : s.value}
                            </strong>
                            {s.period && (
                              <span className="ml-1.5 font-mono text-[9.5px] text-eos-text-tertiary">
                                · {s.period}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* [FC-5] Economic Impact pe finding */}
            {finding.economicImpact &&
              finding.economicImpact.totalCostMaxRON > 0 && (
                <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft px-4 py-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                    💰 Cât te poate costa
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-1 font-display text-[16px] font-bold text-eos-warning"
                  >
                    {fmtRON(finding.economicImpact.totalCostMinRON)} –{" "}
                    {fmtRON(finding.economicImpact.totalCostMaxRON)} RON
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-eos-warning">
                    <div>
                      <span className="opacity-70">Penalitate:</span>{" "}
                      <strong>
                        {fmtRON(finding.economicImpact.penaltyMinRON)}–
                        {fmtRON(finding.economicImpact.penaltyMaxRON)} RON
                      </strong>
                    </div>
                    <div>
                      <span className="opacity-70">Manoperă cabinet:</span>{" "}
                      <strong>
                        {finding.economicImpact.remediationHours.toFixed(1)}h
                      </strong>
                    </div>
                    {finding.economicImpact.affectedAmountRON !== null && (
                      <div>
                        <span className="opacity-70">Sumă fiscală afectată:</span>{" "}
                        <strong>
                          {fmtRON(finding.economicImpact.affectedAmountRON)} RON
                        </strong>
                      </div>
                    )}
                    {finding.economicImpact.retransmissions > 0 && (
                      <div>
                        <span className="opacity-70">Retransmiteri:</span>{" "}
                        <strong>{finding.economicImpact.retransmissions}</strong>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[10.5px] text-eos-warning/80 italic">
                    {finding.economicImpact.computationNote}
                  </p>
                </div>
              )}

            {/* Suggestion */}
            {finding.suggestion && (
              <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary-soft px-4 py-3 text-eos-primary">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Recomandare
                </p>
                <p className="mt-1 text-[12px] leading-[1.55]">{finding.suggestion}</p>
              </div>
            )}

            {/* Legal reference */}
            {finding.legalReference && (
              <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[11px] text-eos-text-muted">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Referință legală
                </span>
                <p className="mt-0.5">{finding.legalReference}</p>
              </div>
            )}

            {/* [FC-5] Referințe legale economic — list */}
            {finding.economicImpact &&
              finding.economicImpact.legalReferences.length > 0 && (
                <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[10.5px] text-eos-text-muted">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                    Bază legală penalitate
                  </span>
                  <ul className="mt-0.5 ml-3 list-disc">
                    {finding.economicImpact.legalReferences.map((ref, i) => (
                      <li key={i}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-eos-border bg-eos-surface-elevated px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-4 py-2 text-[12px] font-medium text-eos-text hover:border-eos-border-strong"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function InputTile({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
        {label}
      </p>
      <p
        data-display-text="true"
        className="mt-0.5 font-display text-[16px] font-bold text-eos-text"
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 font-mono text-[9px] text-eos-text-tertiary">{hint}</p>
      )}
    </div>
  )
}

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
      <p
        data-display-text="true"
        className="mt-0.5 font-display text-[18px] font-bold"
      >
        {value}
      </p>
    </div>
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
      className={`rounded-eos-sm border px-2 py-1.5 ${
        highlight
          ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
          : "border-eos-border bg-eos-surface text-eos-text"
      }`}
    >
      <p
        className={`font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${
          highlight ? "opacity-80" : "text-eos-text-muted"
        }`}
      >
        {label}
      </p>
      <p
        data-display-text="true"
        className="mt-0.5 font-display text-[13px] font-bold"
      >
        {value}
      </p>
      {sub && (
        <p
          className={`mt-0.5 font-mono text-[9.5px] ${
            highlight ? "opacity-70" : "text-eos-text-tertiary"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
