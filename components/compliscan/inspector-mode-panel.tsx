"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Minus,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import type {
  InspectorSimulationResult,
  InspectorVerdict,
  InspectorOverallVerdict,
  InspectorFrameworkResult,
  InspectorCheck,
} from "@/lib/compliance/inspector-mode"

// ── Display helpers ────────────────────────────────────────────────────────────

const VERDICT_ICON = {
  pass:    CheckCircle2,
  partial: AlertTriangle,
  fail:    XCircle,
  na:      Minus,
} as const

const VERDICT_COLOR = {
  pass:    "text-eos-success",
  partial: "text-eos-warning",
  fail:    "text-eos-error",
  na:      "text-eos-text-muted",
} as const

const VERDICT_BADGE: Record<InspectorVerdict, React.ComponentProps<typeof Badge>["variant"]> = {
  pass:    "success",
  partial: "warning",
  fail:    "destructive",
  na:      "secondary",
}

const VERDICT_LABEL: Record<InspectorVerdict, string> = {
  pass:    "Conformitate",
  partial: "Parțial",
  fail:    "Neconform",
  na:      "N/A",
}

const OVERALL_BADGE: Record<InspectorOverallVerdict, React.ComponentProps<typeof Badge>["variant"]> = {
  ready:     "success",
  partial:   "warning",
  "not-ready": "destructive",
}

const OVERALL_LABEL: Record<InspectorOverallVerdict, string> = {
  ready:       "Pregătit pentru control",
  partial:     "Pregătire parțială",
  "not-ready": "Nepreg. control extern",
}

// ── Check row ─────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: InspectorCheck }) {
  const Icon = VERDICT_ICON[check.verdict]
  const color = VERDICT_COLOR[check.verdict]

  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-eos-text">{check.topic}</p>
          {check.critical && check.verdict === "fail" && (
            <Badge variant="destructive" className="normal-case tracking-normal text-[10px]">
              Blocant
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-eos-text-muted">{check.detail}</p>
        {check.evidence && (
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            <span className="font-medium">Dovadă:</span> {check.evidence}
          </p>
        )}
        {check.legalRef && (
          <p className="mt-0.5 text-[11px] text-eos-text-muted opacity-70">{check.legalRef}</p>
        )}
      </div>
      <Badge
        variant={VERDICT_BADGE[check.verdict]}
        className="shrink-0 normal-case tracking-normal text-[10px]"
      >
        {VERDICT_LABEL[check.verdict]}
      </Badge>
    </div>
  )
}

// ── Framework accordion ────────────────────────────────────────────────────────

function FrameworkSection({ fw }: { fw: InspectorFrameworkResult }) {
  const [open, setOpen] = useState(fw.verdict === "fail" || fw.verdict === "partial")
  const Icon = VERDICT_ICON[fw.verdict]
  const color = VERDICT_COLOR[fw.verdict]

  if (!fw.applicable) return null

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <Icon className={`size-4 shrink-0 ${color}`} strokeWidth={2} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-eos-text">{fw.framework}</span>
            <Badge
              variant={VERDICT_BADGE[fw.verdict]}
              className="normal-case tracking-normal text-[10px]"
            >
              {fw.score}%
            </Badge>
          </div>
        </div>
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
        )}
      </button>
      {open && (
        <div className="divide-y divide-eos-border-subtle border-t border-eos-border px-4 pb-2">
          {fw.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function InspectorModePanel() {
  const [result, setResult] = useState<InspectorSimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [run, setRun] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function simulate(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/inspector", { cache: "no-store" })
      if (res.ok) {
        const data: InspectorSimulationResult = await res.json()
        setResult(data)
        setRun(true)
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-run on mount
  useEffect(() => { simulate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Inspector Mode
            </p>
            <CardTitle className="flex items-center gap-2 text-base text-eos-text">
              <Eye className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              Simulare control extern
            </CardTitle>
            <p className="text-xs text-eos-text-muted">
              Ce ar găsi un inspector DNSC / GDPR / AI Act dacă ar audita organizația azi.
            </p>
          </div>
          {run && result && (
            <div className="flex items-center gap-2">
              <Badge
                variant={OVERALL_BADGE[result.overallVerdict]}
                className="normal-case tracking-normal"
              >
                {OVERALL_LABEL[result.overallVerdict]}
              </Badge>
              <button
                onClick={() => simulate(true)}
                disabled={refreshing}
                aria-label="Rerulez simularea"
                className="rounded-full p-1 text-eos-text-muted hover:bg-eos-surface-variant disabled:opacity-40"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-eos-md bg-eos-surface-variant" />
            ))}
          </div>
        ) : !run || !result ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <ShieldAlert className="size-8 text-eos-text-muted" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-eos-text">Simulare control extern</p>
              <p className="text-xs text-eos-text-muted">
                Rulează simularea pentru a vedea ce ar găsi un inspector la un control.
              </p>
            </div>
            <Button onClick={() => simulate()} size="sm" variant="outline">
              <Eye className="mr-2 size-4" strokeWidth={2} />
              Simulează control
            </Button>
          </div>
        ) : (
          <>
            {/* Score + summary */}
            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-eos-text">
                  Scor pregătire control: {result.readinessScore}%
                </p>
              </div>
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-eos-surface-variant">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.overallVerdict === "not-ready"
                      ? "bg-eos-error"
                      : result.overallVerdict === "partial"
                        ? "bg-eos-warning"
                        : "bg-eos-success"
                  }`}
                  style={{ width: `${result.readinessScore}%` }}
                />
              </div>
              <p className="text-xs text-eos-text-muted">{result.summary}</p>
            </div>

            {/* Critical gaps */}
            {result.criticalGaps.length > 0 && (
              <div className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft p-3">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="size-4 shrink-0 text-eos-error" strokeWidth={2} />
                  <p className="text-sm font-semibold text-eos-error">
                    {result.criticalGaps.length} problemă{result.criticalGaps.length > 1 ? "e" : ""} blocantă{result.criticalGaps.length > 1 ? "" : ""}
                  </p>
                </div>
                <ul className="space-y-1">
                  {result.criticalGaps.map((gap) => (
                    <li key={gap.id} className="text-xs text-eos-error">
                      · {gap.topic}: {gap.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Framework sections */}
            <div className="space-y-2">
              {result.frameworks.map((fw) => (
                <FrameworkSection key={fw.framework} fw={fw} />
              ))}
            </div>

            {/* Timestamp + disclaimer */}
            <div className="space-y-1 border-t border-eos-border-subtle pt-3">
              <p className="text-[10px] text-eos-text-muted">
                Simulare la:{" "}
                {new Date(result.simulatedAt).toLocaleString("ro-RO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-[10px] text-eos-text-muted">
                Aceasta este o simulare orientativă. Nu înlocuiește consultanța juridică sau un audit formal.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
