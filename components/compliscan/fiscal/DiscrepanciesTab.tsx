"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import type { ETVADiscrepancy, ETVADiscrepancyType } from "@/lib/compliance/etva-discrepancy"
import { ETVA_TYPE_LABELS, ETVA_STATUS_LABELS } from "@/lib/compliance/etva-discrepancy"

const SEVERITY_TONE: Record<string, string> = {
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  high: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  medium: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  low: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

const STATUS_TONE: Record<string, string> = {
  detected: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  acknowledged: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  explanation_drafted: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  response_sent: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  awaiting_anaf: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  resolved: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  overdue: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

export function DiscrepanciesTab() {
  const [items, setItems] = useState<ETVADiscrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: "sum_mismatch" as ETVADiscrepancyType,
    period: "",
    description: "",
    amountDifference: "",
  })

  useEffect(() => {
    fetch("/api/fiscal/etva-discrepancies", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { discrepancies?: ETVADiscrepancy[] }) => setItems(data.discrepancies ?? []))
      .catch(() => toast.error("Nu am putut încărca discrepanțele."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.period || !form.description) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/etva-discrepancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          period: form.period,
          description: form.description,
          amountDifference: form.amountDifference ? Number(form.amountDifference) : undefined,
        }),
      })
      const data = (await res.json()) as { discrepancy?: ETVADiscrepancy; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      if (data.discrepancy) setItems((prev) => [data.discrepancy!, ...prev])
      setForm({ type: "sum_mismatch", period: "", description: "", amountDifference: "" })
      setShowForm(false)
      toast.success("Discrepanță creată.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la creare.")
    } finally {
      setCreating(false)
    }
  }

  async function handleTransition(id: string, transition: string) {
    try {
      const res = await fetch("/api/fiscal/etva-discrepancies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, transition }),
      })
      const data = (await res.json()) as { discrepancy?: ETVADiscrepancy; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      if (data.discrepancy) {
        setItems((prev) => prev.map((d) => (d.id === id ? data.discrepancy! : d)))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la actualizare.")
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se incarca...
      </div>
    )

  const open = items.filter((d) => d.status !== "resolved")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
          {open.length} deschise
        </span>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} /> Adauga discrepanta
        </Button>
      </div>

      {showForm && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Adauga discrepanta e-TVA
            </h3>
          </header>
          <div className="space-y-3 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Tip
                </span>
                <select
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ETVADiscrepancyType }))}
                >
                  {(Object.entries(ETVA_TYPE_LABELS) as [ETVADiscrepancyType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Perioada
                </span>
                <input
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
                  placeholder="ex: 2026-Q1"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Descriere
              </span>
              <textarea
                className="mt-1.5 h-16 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Diferenta suma (RON, optional)
              </span>
              <input
                type="number"
                className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                value={form.amountDifference}
                onChange={(e) => setForm((f) => ({ ...f, amountDifference: e.target.value }))}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anuleaza
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.period || !form.description}
                onClick={() => void handleCreate()}
              >
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
                Salveaza
              </Button>
            </div>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-success/30 bg-eos-success-soft">
            <CheckCircle2 className="size-4 text-eos-success" strokeWidth={1.8} />
          </div>
          <div className="max-w-md space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Nicio discrepanta e-TVA
            </p>
            <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
              Adauga o discrepanta cand detectezi diferente intre declaratii si e-TVA precompletata.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((d) => {
            const severityBar =
              d.severity === "critical" || d.severity === "high"
                ? "bg-eos-error"
                : d.severity === "medium"
                  ? "bg-eos-warning"
                  : "bg-eos-border-strong"
            const severityTone = SEVERITY_TONE[d.severity] ?? SEVERITY_TONE.low
            const statusTone = STATUS_TONE[d.status] ?? STATUS_TONE.awaiting_anaf

            return (
              <article
                key={d.id}
                className={`relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface ${d.status === "resolved" ? "opacity-70" : ""}`}
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[3px] ${severityBar}`}
                  aria-hidden
                />
                <div className="space-y-2 py-3 pl-5 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
                      {ETVA_TYPE_LABELS[d.type]}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${severityTone}`}
                    >
                      {d.severity}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${statusTone}`}
                    >
                      {ETVA_STATUS_LABELS[d.status]}
                    </span>
                    <span className="font-mono text-[11px] text-eos-text-muted">Perioada: {d.period}</span>
                  </div>
                  <p className="text-[12px] leading-[1.5] text-eos-text-muted">{d.description}</p>
                  {d.amountDifference != null && (
                    <p className="text-[12px] text-eos-text-muted">
                      Diferenta:{" "}
                      <span className="font-semibold text-eos-text">
                        {d.amountDifference.toLocaleString("ro-RO")} RON
                      </span>
                    </p>
                  )}
                  {d.deadlineISO && (
                    <p className="flex items-center gap-1 font-mono text-[11px] text-eos-text-muted">
                      <Clock className="size-3" strokeWidth={2} /> Termen:{" "}
                      {new Date(d.deadlineISO).toLocaleDateString("ro-RO")}
                    </p>
                  )}
                  {d.status !== "resolved" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {d.status === "detected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleTransition(d.id, "acknowledge")}
                        >
                          Confirma
                        </Button>
                      )}
                      {d.status === "acknowledged" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleTransition(d.id, "draft_explanation")}
                        >
                          Redacteaza explicatie
                        </Button>
                      )}
                      {(d.status === "explanation_drafted" || d.status === "response_sent") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleTransition(d.id, "resolve")}
                        >
                          Marcheaza rezolvat
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
