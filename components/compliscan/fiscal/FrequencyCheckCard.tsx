"use client"

// Card detector frecvență declarații — afișează regula aplicabilă
// (lunar/trimestrial) + lista mismatches per filing greșit depus.

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Detection = {
  frequency: "monthly" | "quarterly" | "unknown"
  confidence: "high" | "medium" | "low"
  reason: string
  recommendedAction?: string
}

type Mismatch = {
  filingId: string
  filingType: string
  period: string
  detectedFrequency: string
  filedAsFrequency: string
  severity: string
  message: string
}

export function FrequencyCheckCard() {
  const [data, setData] = useState<{
    expected: Detection
    mismatches: Mismatch[]
    filingsAnalyzed: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/frequency-check", { cache: "no-store" })
      if (!res.ok) {
        toast.error("Nu am putut detecta frecvența.")
        return
      }
      setData(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Detectez frecvența declarațiilor...
      </div>
    )
  }

  if (!data) return null

  const { expected, mismatches } = data
  const Icon =
    expected.frequency === "unknown"
      ? Info
      : mismatches.length === 0
        ? CheckCircle2
        : AlertTriangle
  const tone =
    expected.frequency === "unknown"
      ? "border-eos-border bg-eos-surface text-eos-text-muted"
      : mismatches.length === 0
        ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
        : "border-eos-error/30 bg-eos-error-soft text-eos-error"

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <Info className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Frecvență declarații (lunar vs trimestrial) — previne A9.6 ANAF
        </p>
      </div>

      <div className={`mt-3 flex items-start gap-3 rounded-eos-md border px-4 py-3 ${tone}`}>
        <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]">
            Frecvență așteptată: {expected.frequency === "unknown" ? "necunoscut" : expected.frequency === "monthly" ? "LUNAR" : "TRIMESTRIAL"} ({expected.confidence})
          </p>
          <p className="mt-1 text-[12.5px] text-eos-text">{expected.reason}</p>
          {expected.recommendedAction && (
            <p className="mt-1 text-[11.5px] text-eos-text-muted">{expected.recommendedAction}</p>
          )}
        </div>
      </div>

      {mismatches.length > 0 && (
        <ul className="mt-3 space-y-2">
          {mismatches.map((m) => (
            <li
              key={m.filingId}
              className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12.5px]"
            >
              <p className="font-semibold text-eos-text">
                {m.filingType.toUpperCase()} {m.period}
              </p>
              <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{m.message}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[10.5px] text-eos-text-tertiary">
        {data.filingsAnalyzed === 0
          ? "Niciun istoric de depuneri încă. Frecvența așteptată este estimată din numărul de angajați. Pentru detectare exactă, adaugă cifra de afaceri din profilul organizației sau încarcă declarațiile istorice."
          : `Analizat ${data.filingsAnalyzed} depuneri istorice.`}
      </p>
    </section>
  )
}
