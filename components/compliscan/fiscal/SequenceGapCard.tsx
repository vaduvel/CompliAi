"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type Entry = { invoiceNumber: string; issueDateISO: string; source?: string }
type SeriesAnalysis = {
  series: string
  minNumber: number
  maxNumber: number
  gaps: number[]
  duplicates: number[]
  outOfOrderDates: Array<{
    earlierNumber: number
    earlierDateISO: string
    laterNumber: number
    laterDateISO: string
  }>
  totalEntries: number
}
type AnalysisResult = {
  series: SeriesAnalysis[]
  unparsed: string[]
  hasGaps: boolean
  hasDuplicates: boolean
  hasDateAnomalies: boolean
}

const DEMO_JSON = JSON.stringify(
  [
    { invoiceNumber: "F2026-1", issueDateISO: "2026-04-01" },
    { invoiceNumber: "F2026-2", issueDateISO: "2026-04-02" },
    { invoiceNumber: "F2026-5", issueDateISO: "2026-04-05" },
    { invoiceNumber: "F2026-5", issueDateISO: "2026-04-06" },
    { invoiceNumber: "F2026-7", issueDateISO: "2026-04-04" },
  ],
  null,
  2,
)

export function SequenceGapCard() {
  const [input, setInput] = useState(DEMO_JSON)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function runAnalysis() {
    setBusy(true)
    try {
      const parsed = JSON.parse(input) as Entry[]
      if (!Array.isArray(parsed)) throw new Error("Trebuie să fie un array JSON.")
      const res = await fetch("/api/fiscal/sequence-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: parsed, generateFindings: false }),
      })
      if (!res.ok) throw new Error("Server error: " + res.status)
      const payload = (await res.json()) as { analysis: AnalysisResult }
      setResult(payload.analysis)
      if (
        !payload.analysis.hasGaps &&
        !payload.analysis.hasDuplicates &&
        !payload.analysis.hasDateAnomalies
      ) {
        toast.success("Toate seriile sunt curate — fără goluri, duplicate sau cronologie inversă.")
      } else {
        toast.warning("Anomalii detectate. Verifică detaliile mai jos.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "JSON invalid.")
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-eos-primary" strokeWidth={2} />
          <span>
            <strong>Audit numerotare facturi (CECCAR Art. 14 / Cod Fiscal Art. 319):</strong>{" "}
            inspectorul fiscal verifică unicitatea + secvențialitatea. Detector caută goluri,
            duplicate și date neordonate per serie (F2026-, INV-, etc.).
          </span>
        </p>
      </section>

      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
        <p
          data-display-text="true"
          className="mb-3 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Lipește lista facturi (JSON)
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[11px] text-eos-text outline-none focus:border-eos-border-strong"
          placeholder='[ { "invoiceNumber": "F2026-100", "issueDateISO": "2026-04-15" } ]'
        />
        <div className="mt-3">
          <Button size="sm" onClick={runAnalysis} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Analizează secvențele
          </Button>
        </div>
      </section>

      {result && (
        <section className="space-y-3">
          {result.series.length === 0 ? (
            <p className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12px] text-eos-text">
              Nu am putut extrage nicio serie din lista de facturi.{" "}
              {result.unparsed.length > 0
                ? `${result.unparsed.length} numere nu au putut fi parsate.`
                : ""}
            </p>
          ) : (
            result.series.map((series) => (
              <SeriesBlock key={series.series || "(default)"} series={series} />
            ))
          )}
          {result.unparsed.length > 0 && (
            <p className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[11px] text-eos-text-muted">
              {result.unparsed.length} numere fără format recognoscut:{" "}
              <span className="font-mono">{result.unparsed.slice(0, 5).join(", ")}</span>
              {result.unparsed.length > 5 ? "…" : ""}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function SeriesBlock({ series }: { series: SeriesAnalysis }) {
  const isClean =
    series.gaps.length === 0 &&
    series.duplicates.length === 0 &&
    series.outOfOrderDates.length === 0

  return (
    <div
      className={`rounded-eos-md border p-3 ${
        isClean
          ? "border-eos-success/30 bg-eos-success-soft"
          : "border-eos-error/30 bg-eos-error-soft"
      }`}
    >
      <div className="flex items-start gap-2">
        {isClean ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-error" strokeWidth={2} />
        )}
        <div className="min-w-0 flex-1">
          <p
            data-display-text="true"
            className="font-display text-[12.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Seria <span className="font-mono">{series.series || "(fără prefix)"}</span> ·{" "}
            <span className="font-mono">{series.minNumber}–{series.maxNumber}</span> ·{" "}
            {series.totalEntries} facturi
          </p>
          {!isClean && (
            <div className="mt-2 space-y-1 text-[11.5px] text-eos-text">
              {series.gaps.length > 0 && (
                <p>
                  🔴 <strong>{series.gaps.length} goluri:</strong>{" "}
                  <span className="font-mono">{series.gaps.slice(0, 10).join(", ")}</span>
                  {series.gaps.length > 10 ? "…" : ""}
                </p>
              )}
              {series.duplicates.length > 0 && (
                <p>
                  🔴 <strong>{series.duplicates.length} duplicate:</strong>{" "}
                  <span className="font-mono">{series.duplicates.slice(0, 10).join(", ")}</span>
                </p>
              )}
              {series.outOfOrderDates.length > 0 && (
                <p>
                  🟡 <strong>{series.outOfOrderDates.length} cronologie inversă:</strong>{" "}
                  ex. #{series.outOfOrderDates[0]!.earlierNumber} (
                  {series.outOfOrderDates[0]!.earlierDateISO}) vs #
                  {series.outOfOrderDates[0]!.laterNumber} (
                  {series.outOfOrderDates[0]!.laterDateISO})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
