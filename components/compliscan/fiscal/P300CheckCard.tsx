"use client"

// GAP #5 (Sprint 4) — D300 vs P300 preventive check card.
//
// Permite contabilului să introducă valori D300 și P300 (paste din software-ul
// contabil), rulează comparator și afișează:
//   - Diferențe pe câmp (4 fields)
//   - Status (ok / review / rectify)
//   - Countdown 20 zile dacă triggers
//   - Finding generat (link către cockpit)

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Scale,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import type {
  D300P300ComparisonResult,
  VatDeclarationSnapshot,
} from "@/lib/compliance/d300-p300-comparator"

type CheckResponse = {
  ok: boolean
  result?: D300P300ComparisonResult
  finding?: { id: string; title: string } | null
  error?: string
}

type HistoryRow = {
  period: string
  comparedAtISO: string
  triggersAnafNotification: boolean
  worstDeltaAbs: number
}

type HistoryResponse = {
  history: HistoryRow[]
  activeFindings: Array<{ id: string; title: string }>
}

const ACTION_TONE: Record<D300P300ComparisonResult["recommendedAction"], string> = {
  ok: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  review: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  rectify: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  respond_to_notice: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const ACTION_LABEL: Record<D300P300ComparisonResult["recommendedAction"], string> = {
  ok: "Conform — sub pragul ANAF",
  review: "Recomandă revizuire",
  rectify: "Rectificare preventivă",
  respond_to_notice: "Răspuns la notificare",
}

function emptySnap(period: string): VatDeclarationSnapshot {
  return { period, taxableBase: 0, vatCollected: 0, vatDeducted: 0, vatToPay: 0 }
}

function fmtRON(n: number): string {
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 0 })
}

function fmtDate(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

export function P300CheckCard() {
  const [period, setPeriod] = useState("")
  const [d300, setD300] = useState<VatDeclarationSnapshot>(emptySnap(""))
  const [p300, setP300] = useState<VatDeclarationSnapshot>(emptySnap(""))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<D300P300ComparisonResult | null>(null)
  const [finding, setFinding] = useState<{ id: string; title: string } | null>(null)
  const [history, setHistory] = useState<HistoryRow[]>([])

  useEffect(() => {
    void refreshHistory()
  }, [])

  async function refreshHistory() {
    try {
      const res = await fetch("/api/fiscal/p300-check", { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as HistoryResponse
        setHistory(data.history ?? [])
      }
    } catch {
      // ignore — empty history is acceptable
    }
  }

  function setField(target: "d300" | "p300", field: keyof VatDeclarationSnapshot, value: number) {
    if (target === "d300") {
      setD300((prev) => ({ ...prev, [field]: value }))
    } else {
      setP300((prev) => ({ ...prev, [field]: value }))
    }
  }

  async function runComparison() {
    if (!period.trim()) {
      toast.error("Specifică perioada (ex: 2026-04).")
      return
    }
    setBusy(true)
    setResult(null)
    setFinding(null)
    try {
      const res = await fetch("/api/fiscal/p300-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          d300: { ...d300, period },
          p300: { ...p300, period },
        }),
      })
      const data = (await res.json()) as CheckResponse
      if (!res.ok || !data.ok || !data.result) {
        toast.error("Comparator P300 eșuat", { description: data.error ?? "Verifică datele introduse." })
        return
      }
      setResult(data.result)
      setFinding(data.finding ?? null)
      if (data.result.triggersAnafNotification) {
        toast.warning("Diferențe peste pragul ANAF", {
          description: "Acționează preventiv — depune D300 rectificativă.",
        })
      } else {
        toast.success("Sub pragul de notificare ANAF.")
      }
      void refreshHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la comparator.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4 rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <Scale className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Comparator preventiv D300 vs P300 (RO e-TVA)
        </p>
      </div>
      <p className="text-[12px] leading-[1.55] text-eos-text-muted">
        ANAF generează automat P300 pre-completat și trimite notificare doar dacă diferența depășește pragul tehnic
        (&gt;20% ȘI ≥5.000 RON). Folosește acest comparator înainte ca ANAF să trimită notificarea oficială.
      </p>

      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-1">
          <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Perioada
          </label>
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="2026-04"
            className="ring-focus h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 font-mono text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(["d300", "p300"] as const).map((target) => {
            const snap = target === "d300" ? d300 : p300
            const label = target === "d300" ? "D300 (depus de tine)" : "P300 (pre-completat ANAF)"
            return (
              <div
                key={target}
                className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant p-3"
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  {label}
                </p>
                <div className="mt-2 grid gap-2">
                  {(
                    [
                      ["taxableBase", "Bază impozabilă"],
                      ["vatCollected", "TVA colectat"],
                      ["vatDeducted", "TVA dedus"],
                      ["vatToPay", "TVA de plată"],
                    ] as Array<[keyof VatDeclarationSnapshot, string]>
                  ).map(([field, fLabel]) => (
                    <label key={field} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-eos-text-muted">{fLabel}</span>
                      <input
                        type="number"
                        value={Number(snap[field]) || ""}
                        onChange={(e) => setField(target, field, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8 w-32 rounded-eos-sm border border-eos-border bg-eos-surface px-2 text-right font-mono text-[12px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <Button onClick={() => void runComparison()} disabled={busy || !period.trim()} data-testid="p300-check">
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Se compară...
            </>
          ) : (
            <>
              <Scale className="mr-2 size-3.5" strokeWidth={2} /> Rulează comparator
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className={`rounded-eos-md border px-4 py-3 ${ACTION_TONE[result.recommendedAction]}`}>
            <div className="flex items-center gap-2">
              {result.recommendedAction === "ok" ? (
                <CheckCircle2 className="size-4" strokeWidth={2} />
              ) : result.recommendedAction === "review" ? (
                <ShieldCheck className="size-4" strokeWidth={2} />
              ) : (
                <AlertTriangle className="size-4" strokeWidth={2} />
              )}
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">
                {ACTION_LABEL[result.recommendedAction]}
              </p>
            </div>
            {result.countdownDeadlineISO && (
              <p className="mt-2 flex items-center gap-1 font-mono text-[11px]">
                <Clock className="size-3.5" strokeWidth={2} /> Termen 20 zile:{" "}
                {fmtDate(result.countdownDeadlineISO)}
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-eos-md border border-eos-border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                  <th className="px-3 py-2">Câmp</th>
                  <th className="px-3 py-2 text-right">D300</th>
                  <th className="px-3 py-2 text-right">P300</th>
                  <th className="px-3 py-2 text-right">Δ</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2 text-center">Prag ANAF</th>
                </tr>
              </thead>
              <tbody>
                {result.fieldDiffs.map((f) => (
                  <tr key={f.field} className="border-b border-eos-border/50">
                    <td className="px-3 py-2 text-eos-text">{f.fieldLabel}</td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">{fmtRON(f.declared)}</td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">
                      {fmtRON(f.precomputed)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">{fmtRON(f.deltaAbs)}</td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">
                      {f.deltaPercent.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {f.exceedsThreshold ? (
                        <span className="inline-flex rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-2 py-0.5 font-mono text-[10px] uppercase text-eos-error">
                          DEPĂȘIT
                        </span>
                      ) : (
                        <span className="inline-flex rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10px] uppercase text-eos-success">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {finding && (
            <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-error">
                Finding preventiv generat
              </p>
              <p className="mt-1 text-[12.5px] text-eos-text">{finding.title}</p>
              <a
                href={`/dashboard/resolve/${finding.id}`}
                className="mt-2 inline-flex h-[28px] items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 font-mono text-[11px] text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
              >
                Deschide în cockpit →
              </a>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Istoric comparări ({history.length})
          </p>
          <ul className="mt-2 space-y-1.5 text-[12px]">
            {history
              .slice()
              .sort((a, b) => (b.period > a.period ? 1 : -1))
              .slice(0, 6)
              .map((row) => (
                <li
                  key={`${row.period}-${row.comparedAtISO}`}
                  className="flex items-center justify-between gap-2 text-eos-text-muted"
                >
                  <span className="font-mono">{row.period}</span>
                  <span>{fmtDate(row.comparedAtISO)}</span>
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      row.triggersAnafNotification ? "text-eos-error" : "text-eos-success"
                    }`}
                  >
                    {row.triggersAnafNotification ? `Δ ${fmtRON(row.worstDeltaAbs)} RON` : "OK"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  )
}
