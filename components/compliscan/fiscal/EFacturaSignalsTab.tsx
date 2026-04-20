"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, Loader2, Radio } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"

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

const SIGNAL_STATUS_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  rejected: "destructive",
  "xml-error": "destructive",
  "processing-delayed": "default",
  unsubmitted: "secondary",
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

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SIGNAL_FILTER_LABELS) as SignalFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-eos-md px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? "bg-eos-primary text-eos-text"
                  : "bg-eos-bg-inset text-eos-text-muted hover:text-eos-text"
              }`}
            >
              {SIGNAL_FILTER_LABELS[f]}
              {counts[f] > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleGenerateFindings()}
          disabled={generating}
          className="gap-1.5"
        >
          {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Radio className="size-3.5" />}
          Genereaza findings
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Fără semnale"
          label={filter === "all" ? "Nu sunt semnale e-Factura active." : `Niciun semnal de tip ${SIGNAL_FILTER_LABELS[filter]}.`}
        />
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {filtered.map((signal) => (
            <CardContent key={signal.id} className="space-y-1.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-eos-text">{signal.vendorName}</p>
                <Badge
                  variant={SIGNAL_STATUS_VARIANT[signal.status] ?? "outline"}
                  className="text-[10px] normal-case tracking-normal"
                >
                  {SIGNAL_STATUS_LABELS[signal.status]}
                </Badge>
                {signal.isTechVendor && (
                  <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                    Tech vendor
                  </Badge>
                )}
                {signal.invoiceNumber && (
                  <span className="text-xs text-eos-text-muted">#{signal.invoiceNumber}</span>
                )}
              </div>
              {signal.reason && (
                <p className="text-xs text-eos-text-muted">{signal.reason}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
                <span>{new Date(signal.date).toLocaleDateString("ro-RO")}</span>
                {signal.amount != null && (
                  <span className="font-semibold text-eos-text">
                    {signal.amount.toLocaleString("ro-RO")} {signal.currency ?? "RON"}
                  </span>
                )}
              </div>
            </CardContent>
          ))}
        </Card>
      )}
    </div>
  )
}
