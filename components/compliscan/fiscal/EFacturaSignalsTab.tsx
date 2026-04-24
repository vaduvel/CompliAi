"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Radio } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

// ── eFactura Signals Tab with Filters ────────────────────────────────────────

type EFSignal = {
  id: string
  vendorName: string
  invoiceNumber?: string
  date: string
  status: "rejected" | "xml-error" | "processing-delayed" | "unsubmitted"
  amount?: number
  currency?: string
  reason?: string
  isTechVendor?: boolean
}

type SignalFilter = "all" | "rejected" | "xml-error" | "processing-delayed" | "unsubmitted"

const SIGNAL_FILTER_LABELS: Record<SignalFilter, string> = {
  all: "Toate",
  rejected: "Respinse",
  "xml-error": "Erori XML",
  "processing-delayed": "Blocate",
  unsubmitted: "Netransmise",
}

const SIGNAL_STATUS_TONE: Record<string, string> = {
  rejected: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  "xml-error": "border-eos-error/30 bg-eos-error-soft text-eos-error",
  "processing-delayed": "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  unsubmitted: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

const SIGNAL_STATUS_LABELS: Record<string, string> = {
  rejected: "Respinsa ANAF",
  "xml-error": "Eroare XML",
  "processing-delayed": "Blocat prelucrare",
  unsubmitted: "Netransmisa",
}

export function EFacturaSignalsTab() {
  const [signals, setSignals] = useState<EFSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SignalFilter>("all")
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch("/api/efactura/signals", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { signals?: EFSignal[] }) => setSignals(data.signals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerateFindings() {
    setGenerating(true)
    try {
      const res = await fetch("/api/efactura/signals", { method: "POST" })
      const data = (await res.json()) as { generated: number }
      if (data.generated > 0) {
        toast.success(`${data.generated} finding(s) generate din semnale.`)
      }
    } catch {
      toast.error("Eroare la generare findings.")
    } finally {
      setGenerating(false)
    }
  }

  const filtered = filter === "all" ? signals : signals.filter((s) => s.status === filter)
  const counts: Record<SignalFilter, number> = {
    all: signals.length,
    rejected: signals.filter((s) => s.status === "rejected").length,
    "xml-error": signals.filter((s) => s.status === "xml-error").length,
    "processing-delayed": signals.filter((s) => s.status === "processing-delayed").length,
    unsubmitted: signals.filter((s) => s.status === "unsubmitted").length,
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se incarca...
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-eos-lg border border-eos-border bg-eos-surface/80 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-4 md:px-4">
        <div className="flex flex-wrap items-center gap-1 rounded-eos-sm bg-white/[0.03] p-0.5">
          {(Object.keys(SIGNAL_FILTER_LABELS) as SignalFilter[]).map((f) => {
            const active = filter === f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 rounded-eos-sm px-2.5 py-1 text-[12px] font-medium transition-all duration-100 ${
                  active
                    ? "bg-white/[0.06] font-semibold text-eos-text"
                    : "text-eos-text-muted hover:text-eos-text"
                }`}
              >
                {SIGNAL_FILTER_LABELS[f]}
                {counts[f] > 0 && (
                  <span
                    className={`font-mono text-[10px] font-medium tabular-nums ${
                      active ? "text-eos-text-muted" : "text-eos-text-tertiary"
                    }`}
                  >
                    {counts[f]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleGenerateFindings()}
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Radio className="size-3.5" strokeWidth={2} />
          )}
          Genereaza findings
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-success/30 bg-eos-success-soft">
            <CheckCircle2 className="size-4 text-eos-success" strokeWidth={1.8} />
          </div>
          <div className="max-w-md space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Fara semnale
            </p>
            <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
              {filter === "all"
                ? "Nu sunt semnale e-Factura active."
                : `Niciun semnal de tip ${SIGNAL_FILTER_LABELS[filter]}.`}
            </p>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <ul className="divide-y divide-eos-border-subtle">
            {filtered.map((signal) => {
              const statusTone = SIGNAL_STATUS_TONE[signal.status] ?? SIGNAL_STATUS_TONE.unsubmitted
              return (
                <li key={signal.id} className="space-y-1.5 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
                      {signal.vendorName}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${statusTone}`}
                    >
                      {SIGNAL_STATUS_LABELS[signal.status]}
                    </span>
                    {signal.isTechVendor && (
                      <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                        Tech vendor
                      </span>
                    )}
                    {signal.invoiceNumber && (
                      <span className="font-mono text-[11px] text-eos-text-muted">#{signal.invoiceNumber}</span>
                    )}
                  </div>
                  {signal.reason && (
                    <p className="text-[12px] leading-[1.5] text-eos-text-muted">{signal.reason}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-eos-text-muted">
                    <span>{new Date(signal.date).toLocaleDateString("ro-RO")}</span>
                    {signal.amount != null && (
                      <span className="font-semibold text-eos-text">
                        {signal.amount.toLocaleString("ro-RO")} {signal.currency ?? "RON"}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
