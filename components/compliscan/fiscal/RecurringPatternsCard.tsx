"use client"

// Card pentru afișarea pattern-urilor recurrente detectate de Smart Pattern
// Engine. Vizibil pe /dashboard/fiscal. Highlight pe clienții cu probleme
// repetate + fix sugerat preselect.

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

type FixPatternRecord = {
  id: string
  fixLabel: string
  appliedAtISO: string
  success: boolean
}

type RecurringPattern = {
  patternKey: string
  findingTypeId: string
  clientCif: string
  errorCode?: string
  occurrenceCount: number
  windowDays: number
  firstSeenISO: string
  lastSeenISO: string
  suggestedFix: FixPatternRecord | null
  severity: "low" | "medium" | "high" | "critical"
}

type Summary = {
  totalFixesApplied: number
  totalSuccessful: number
  successRate: number
  recurringPatternsCount: number
  topRecurringClients: Array<{ clientCif: string; count: number }>
}

type Response = {
  ok: boolean
  scannedAtISO: string
  windowDays: number
  threshold: number
  summary: Summary
  patterns: RecurringPattern[]
  memorySize: number
}

const SEVERITY_TONE: Record<RecurringPattern["severity"], string> = {
  critical: "border-eos-error/40 bg-eos-error-soft text-eos-error",
  high: "border-eos-warning/40 bg-eos-warning-soft text-eos-warning",
  medium: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  low: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

const SEVERITY_LABEL: Record<RecurringPattern["severity"], string> = {
  critical: "CRITIC",
  high: "RIDICAT",
  medium: "MEDIU",
  low: "INFORMATIV",
}

export function RecurringPatternsCard() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/recurring-patterns", {
        cache: "no-store",
      })
      if (!res.ok) {
        toast.error("Nu am putut încărca pattern-urile recurrente.")
        return
      }
      setData((await res.json()) as Response)
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
          Detectez pattern-uri recurrente…
        </div>
      </section>
    )
  }

  if (!data) return null

  const hasMemory = data.memorySize > 0
  const hasPatterns = data.patterns.length > 0

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Smart Pattern Engine — pattern-uri recurrente
            </h2>
          </div>
          <p className="mt-1 text-[12.5px] text-eos-text-muted">
            Aplicația învață ce fix-uri au funcționat și detectează când o
            problemă se repetă <strong>≥{data.threshold} ori în {data.windowDays} zile</strong>.
            Sugerează automat fix-ul anterior care a mers.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[11.5px] font-medium text-eos-text hover:border-eos-border-strong"
        >
          <RefreshCw className="size-3.5" strokeWidth={2} />
          Reîmprospătează
        </button>
      </header>

      {/* Memory empty state */}
      {!hasMemory && (
        <div className="mt-4 flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12.5px] text-eos-text-muted">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
          <div>
            <p className="font-semibold text-eos-text">Memoria e încă goală</p>
            <p className="mt-0.5 text-[11.5px]">
              Pe măsură ce rezolvi finding-uri în Cockpit, sistemul învață ce
              fix-uri funcționează. După câteva rezolvări, pattern-urile
              recurrente apar aici automat.
            </p>
          </div>
        </div>
      )}

      {/* Summary tiles */}
      {hasMemory && (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Tile
            label="Fix-uri aplicate"
            value={String(data.summary.totalFixesApplied)}
            tone="info"
          />
          <Tile
            label="Rata succes"
            value={`${Math.round(data.summary.successRate * 100)}%`}
            tone={data.summary.successRate >= 0.7 ? "success" : "warning"}
          />
          <Tile
            label="Pattern-uri recurrente"
            value={String(data.summary.recurringPatternsCount)}
            tone={data.summary.recurringPatternsCount > 0 ? "critical" : "success"}
          />
          <Tile
            label="Memorie (90 zile)"
            value={String(data.memorySize)}
            tone="info"
          />
        </div>
      )}

      {/* No patterns yet (memory exists but no recurrence) */}
      {hasMemory && !hasPatterns && (
        <div className="mt-4 flex items-center gap-2 rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-4 py-3 text-[12.5px] text-eos-success">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          Niciun pattern recurrent detectat. Finding-urile sunt izolate, nu
          sistemice.
        </div>
      )}

      {/* Top recurring clients */}
      {hasPatterns && data.summary.topRecurringClients.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Top clienți cu probleme recurrente
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {data.summary.topRecurringClients.map((client) => (
              <li
                key={client.clientCif}
                className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2.5 py-1 text-[11.5px] font-mono"
              >
                {client.clientCif} <strong>×{client.count}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns list */}
      {hasPatterns && (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Pattern-uri detectate ({data.patterns.length})
          </p>
          <ul className="mt-3 space-y-3">
            {data.patterns.map((pattern) => (
              <PatternCard key={pattern.patternKey} pattern={pattern} />
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between text-[10.5px] text-eos-text-tertiary">
        <span>
          Ultimul scan:{" "}
          {new Date(data.scannedAtISO).toLocaleString("ro-RO")}
        </span>
        <span className="font-mono">
          fereastră {data.windowDays}z · threshold ≥{data.threshold}
        </span>
      </footer>
    </section>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "info" | "success" | "warning" | "critical"
}) {
  const toneClass =
    tone === "critical"
      ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
      : tone === "warning"
        ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
        : tone === "success"
          ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
          : "border-eos-border bg-eos-surface-elevated text-eos-text"
  return (
    <div className={`rounded-eos-md border px-3 py-2.5 ${toneClass}`}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[20px] font-bold">{value}</p>
    </div>
  )
}

function PatternCard({ pattern }: { pattern: RecurringPattern }) {
  return (
    <li
      className={`rounded-eos-lg border px-4 py-3 ${SEVERITY_TONE[pattern.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" strokeWidth={2} />
            <p className="font-semibold text-[13px] text-eos-text">
              {pattern.findingTypeId} pe clientul{" "}
              <code className="font-mono text-[12px]">{pattern.clientCif}</code>
            </p>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-[1.55] text-eos-text-muted">
            Apare a{" "}
            <strong className="text-eos-text">{pattern.occurrenceCount}-a oară</strong>{" "}
            în ultimele {pattern.windowDays} zile
            {pattern.errorCode ? ` (cod: ${pattern.errorCode})` : ""}. Prima dată:{" "}
            {new Date(pattern.firstSeenISO).toLocaleDateString("ro-RO")}, ultima:{" "}
            {new Date(pattern.lastSeenISO).toLocaleDateString("ro-RO")}.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-eos-sm border bg-eos-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${SEVERITY_TONE[pattern.severity]}`}
        >
          {SEVERITY_LABEL[pattern.severity]}
        </span>
      </div>

      {pattern.suggestedFix && (
        <div className="mt-3 rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-3 py-2 text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-eos-success" strokeWidth={2} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-success">
              Fix sugerat (a mers anterior)
            </span>
          </div>
          <p className="mt-1 text-eos-text">{pattern.suggestedFix.fixLabel}</p>
          <p className="mt-0.5 text-[10.5px] text-eos-text-muted">
            Aplicat ultima dată pe{" "}
            {new Date(pattern.suggestedFix.appliedAtISO).toLocaleDateString("ro-RO")}{" "}
            cu succes.
          </p>
        </div>
      )}

      {!pattern.suggestedFix && (
        <div className="mt-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11.5px] text-eos-warning">
          <TrendingUp className="-mt-0.5 mr-1.5 inline size-3.5" strokeWidth={2} />
          Niciun fix de succes anterior pe această cheie. Pattern-ul indică o
          problemă sistemică care necesită intervenție umană.
        </div>
      )}
    </li>
  )
}
