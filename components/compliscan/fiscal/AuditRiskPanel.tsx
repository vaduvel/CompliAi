"use client"

// F#1 — Predictive Audit Risk Scoring UI Panel.
// Calculează scorul de risc audit ANAF pe baza stării org curente.
// CECCAR Art. 14 explainability: fiecare factor are reason + recomandare.

import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gauge,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type RiskCategory = "low" | "medium" | "high" | "critical"

type RiskFactor = {
  id: string
  label: string
  category: "filing" | "etva" | "efactura" | "findings" | "hygiene" | "anomalies"
  weight: number
  contribution: number
  reason: string
  recommendation?: string
  severity: "high" | "medium" | "low"
}

type AuditRiskResult = {
  score: number
  category: RiskCategory
  topContributors: RiskFactor[]
  factors: RiskFactor[]
  summary: string
  scoredAtISO: string
  ceccarDisclaimer: string
}

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; bgClass: string; ringClass: string; iconClass: string }
> = {
  low: {
    label: "Risc scăzut",
    bgClass: "bg-eos-success-soft border-eos-success/30",
    ringClass: "ring-eos-success/30",
    iconClass: "text-eos-success",
  },
  medium: {
    label: "Risc moderat",
    bgClass: "bg-eos-warning-soft border-eos-warning/30",
    ringClass: "ring-eos-warning/30",
    iconClass: "text-eos-warning",
  },
  high: {
    label: "Risc ridicat",
    bgClass: "bg-eos-warning-soft border-eos-warning/40",
    ringClass: "ring-eos-warning/40",
    iconClass: "text-eos-warning",
  },
  critical: {
    label: "Risc critic",
    bgClass: "bg-eos-error-soft border-eos-error/40",
    ringClass: "ring-eos-error/40",
    iconClass: "text-eos-error",
  },
}

const CATEGORY_LABELS: Record<RiskFactor["category"], string> = {
  filing: "Declarații",
  etva: "RO e-TVA",
  efactura: "e-Factura",
  findings: "Findings",
  hygiene: "SAF-T",
  anomalies: "Alerte",
}

export function AuditRiskPanel() {
  const [busy, setBusy] = useState(true)
  const [result, setResult] = useState<AuditRiskResult | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (showToast = false) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/audit-risk", { method: "GET" })
      const data = (await res.json()) as { ok: boolean; result?: AuditRiskResult; error?: string }
      if (!res.ok || !data.ok || !data.result) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      setResult(data.result)
      if (showToast) {
        toast.success(`Risc audit recalculat: ${data.result.score}/100`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare la calcul risc."
      setError(msg)
      if (showToast) toast.error(msg)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  if (busy && !result) {
    return (
      <div className="flex items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface p-6 text-[12px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin text-eos-primary" strokeWidth={2} />
        Calculăm scorul de risc audit…
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="space-y-3 rounded-eos-lg border border-eos-error/30 bg-eos-error-soft p-4 text-[12px] text-eos-text">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-error" strokeWidth={2} />
          <span>
            <strong>Nu am putut calcula scorul:</strong> {error ?? "rezultat lipsă"}
          </span>
        </p>
        <Button size="sm" variant="outline" onClick={() => void load(true)}>
          <RefreshCw className="mr-1.5 size-3.5" strokeWidth={2} />
          Reîncearcă
        </Button>
      </div>
    )
  }

  const meta = CATEGORY_META[result.category]

  return (
    <div className="space-y-4">
      {/* Hero score card */}
      <section className={`rounded-eos-lg border p-5 ${meta.bgClass} ring-1 ${meta.ringClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
              <Gauge className={`size-6 ${meta.iconClass}`} strokeWidth={2} />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-eos-text-tertiary">
                Risc audit ANAF — F#1 Predictive
              </p>
              <h3
                data-display-text="true"
                className="mt-1 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] text-eos-text"
              >
                {result.score}/100 · {meta.label}
              </h3>
              <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">{result.summary}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load(true)} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <RefreshCw className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Recalculează
          </Button>
        </div>

        {/* Score progress bar */}
        <div className="mt-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-eos-surface">
            <div
              className={`absolute inset-y-0 left-0 transition-[width] ${
                result.category === "critical"
                  ? "bg-eos-error"
                  : result.category === "high"
                    ? "bg-eos-warning"
                    : result.category === "medium"
                      ? "bg-eos-warning"
                      : "bg-eos-success"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
            <span>0 — scăzut</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100 — critic</span>
          </div>
        </div>
      </section>

      {/* Top contributors */}
      {result.topContributors.length > 0 && (
        <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <header className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-eos-primary" strokeWidth={2} />
            <p
              data-display-text="true"
              className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Factori dominanți (top {result.topContributors.length})
            </p>
          </header>
          <div className="space-y-2">
            {result.topContributors.map((f) => (
              <FactorCard key={f.id} factor={f} />
            ))}
          </div>
        </section>
      )}

      {/* Full breakdown (expandable) */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-eos-surface-elevated"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-eos-primary" strokeWidth={2} />
            <p
              data-display-text="true"
              className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Breakdown complet ({result.factors.length} factori)
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="size-4 text-eos-text-muted" strokeWidth={2} />
          ) : (
            <ChevronDown className="size-4 text-eos-text-muted" strokeWidth={2} />
          )}
        </button>
        {expanded && (
          <div className="space-y-2 border-t border-eos-border-subtle p-4">
            {result.factors.map((f) => (
              <FactorCard key={f.id} factor={f} />
            ))}
          </div>
        )}
      </section>

      {/* CECCAR disclaimer */}
      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[11.5px] text-eos-text">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
          <span>{result.ceccarDisclaimer}</span>
        </p>
      </div>

      <p className="font-mono text-[10px] text-eos-text-tertiary">
        Calculat la {new Date(result.scoredAtISO).toLocaleString("ro-RO")}
      </p>
    </div>
  )
}

function FactorCard({ factor }: { factor: RiskFactor }) {
  const tone =
    factor.severity === "high"
      ? "border-eos-error/30 bg-eos-error-soft"
      : factor.severity === "medium"
        ? "border-eos-warning/30 bg-eos-warning-soft"
        : "border-eos-border bg-eos-surface-elevated"
  const ratio = factor.weight > 0 ? Math.round((factor.contribution / factor.weight) * 100) : 0
  return (
    <div className={`rounded-eos-md border p-3 text-[11.5px] ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              {CATEGORY_LABELS[factor.category]}
            </span>
            <p
              data-display-text="true"
              className="font-display text-[12.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              {factor.label}
            </p>
          </div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text">{factor.reason}</p>
          {factor.recommendation && (
            <p className="mt-1.5 flex items-start gap-1.5 rounded-eos-sm border border-eos-primary/20 bg-eos-primary/[0.05] px-2 py-1.5 text-[11px] leading-[1.45] text-eos-text">
              <CheckCircle2
                className="mt-0.5 size-3 shrink-0 text-eos-primary"
                strokeWidth={2}
              />
              <span>
                <strong>Recomandare:</strong> {factor.recommendation}
              </span>
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
            Contribuție
          </p>
          <p
            data-display-text="true"
            className="font-display text-[16px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
          >
            +{factor.contribution}
            <span className="ml-1 text-[10px] font-mono text-eos-text-tertiary">/{factor.weight}</span>
          </p>
          <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-eos-surface">
            <div
              className={`h-full ${
                factor.severity === "high"
                  ? "bg-eos-error"
                  : factor.severity === "medium"
                    ? "bg-eos-warning"
                    : "bg-eos-success"
              }`}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
