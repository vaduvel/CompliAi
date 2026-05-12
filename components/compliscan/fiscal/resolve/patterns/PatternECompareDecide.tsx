"use client"

// PatternECompareDecide — Pattern E (compare-decide) pentru ETVA-GAP,
// ERP-SPV-MISMATCH, BANK-SPV-MISMATCH, EF-DUPLICATE, FREQUENCY-MISMATCH.
//
// User vede diff table side-by-side, alege scenariu (A: recunosc / B: contest)
// și apoi tranzitează la Pattern F (generate-doc răspuns ANAF) sau marchează
// rezolvat cu evidence.
//
// Faza 3.3 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import { CheckCircle2, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"
import { CompareDiffBlock } from "@/components/compliscan/fiscal/resolve/CompareDiffBlock"

type PatternEProps = {
  finding: ScanFinding
  onResolved: () => void
}

type CompareData = {
  title: string
  leftLabel: string
  rightLabel: string
  rows: {
    label: string
    left: string | number | null
    right: string | number | null
    diff?: boolean
  }[]
}

export function PatternECompareDecide({ finding, onResolved }: PatternEProps) {
  const [data, setData] = useState<CompareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scenario, setScenario] = useState<"A" | "B" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    // Endpoint dinamic per finding type
    const endpoint = resolveCompareEndpoint(finding)
    fetch(endpoint, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CompareData | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [finding])

  async function handleResolve() {
    if (!scenario) {
      toast.error("Alege scenariul A sau B.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: { type: "compare-decide", scenario, findingTypeId: finding.findingTypeId },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut salva.")
      toast.success(
        scenario === "A"
          ? "Recunoaștere salvată. Pasul următor: depune rectificativă."
          : "Decizie de contestare salvată. Pasul următor: redactează răspuns ANAF.",
      )
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3">
        <Loader2 className="size-4 animate-spin text-eos-primary" strokeWidth={2} />
        <span className="text-[12.5px] text-eos-text-muted">Pregătesc diff…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] px-4 py-3 text-[12.5px] text-eos-text">
        Datele de comparație nu sunt disponibile încă. Folosește workflow-ul dedicat din meniu.
      </div>
    )
  }

  const scenarioConfig = resolveScenarios(finding)

  return (
    <div className="space-y-4">
      <CompareDiffBlock
        title={data.title}
        leftLabel={data.leftLabel}
        rightLabel={data.rightLabel}
        rows={data.rows}
      />

      <div className="space-y-2 rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
          Alege scenariu
        </p>
        <div className="space-y-1.5">
          {scenarioConfig.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-start gap-2 rounded-eos-sm px-2 py-1.5 transition hover:bg-eos-primary/[0.04]"
            >
              <input
                type="radio"
                name="scenario"
                value={s.id}
                checked={scenario === s.id}
                onChange={() => setScenario(s.id)}
                className="mt-0.5 size-3.5 shrink-0 accent-eos-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-eos-text">
                  {s.id}) {s.label}
                </p>
                <p className="text-[11px] leading-[1.5] text-eos-text-muted">{s.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleResolve()}
          disabled={submitting || !scenario}
          className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Salvez…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Salvează decizia
            </>
          )}
        </button>
        {scenario === "B" && (
          <a
            href={`/dashboard/fiscal/tva-declaratii?draft=anaf-response&findingId=${encodeURIComponent(finding.id)}`}
            className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
          >
            <FileText className="size-3.5" strokeWidth={2} />
            Generează draft răspuns ANAF
          </a>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveCompareEndpoint(finding: ScanFinding): string {
  const typeId = finding.findingTypeId ?? ""
  const id = encodeURIComponent(finding.id)
  if (typeId === "ETVA-GAP" || typeId === "ETVA-LATE") {
    return `/api/fiscal/etva-discrepancies?findingId=${id}&format=compare`
  }
  if (typeId === "ERP-SPV-MISMATCH") {
    return `/api/fiscal/erp-spv-reconcile?findingId=${id}&format=compare`
  }
  if (typeId === "BANK-SPV-MISMATCH") {
    return `/api/fiscal/bank-reconcile?findingId=${id}&format=compare`
  }
  // Default: dummy compare
  return `/api/findings/${id}/compare`
}

function resolveScenarios(finding: ScanFinding): {
  id: "A" | "B"
  label: string
  hint: string
}[] {
  const typeId = finding.findingTypeId ?? ""
  if (typeId === "ETVA-GAP" || typeId === "ETVA-LATE") {
    return [
      {
        id: "A",
        label: "Recunosc diferența — depun rectificativă D300",
        hint: "Recalculăm D300 cu valorile corecte și generăm draft pentru depunere.",
      },
      {
        id: "B",
        label: "Contest diferența — atașez explicații + facturi cauzatoare",
        hint: "Generăm draft răspuns ANAF cu bază legală și atașament dovezi.",
      },
    ]
  }
  if (typeId === "ERP-SPV-MISMATCH" || typeId === "BANK-SPV-MISMATCH") {
    return [
      {
        id: "A",
        label: "Sync date din ERP/Bancă la SPV",
        hint: "Marchez înregistrarea ca validă, salvez ca evidence.",
      },
      {
        id: "B",
        label: "Mark ca cash / extra-SPV (necontabilizat)",
        hint: "Salvez ca decizie manuală fără retransmitere.",
      },
    ]
  }
  return [
    {
      id: "A",
      label: "Recunosc",
      hint: "Acceptă diferența + decide corecția offline.",
    },
    {
      id: "B",
      label: "Contest",
      hint: "Generează draft contestație ANAF.",
    },
  ]
}
