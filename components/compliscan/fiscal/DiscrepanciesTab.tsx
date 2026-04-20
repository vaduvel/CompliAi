"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { ETVADiscrepancy, ETVADiscrepancyType } from "@/lib/compliance/etva-discrepancy"
import { ETVA_TYPE_LABELS, ETVA_STATUS_LABELS } from "@/lib/compliance/etva-discrepancy"

const SEVERITY_VARIANT: Record<string, "destructive" | "default" | "secondary"> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
}

const STATUS_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  detected: "destructive",
  acknowledged: "default",
  explanation_drafted: "secondary",
  response_sent: "secondary",
  awaiting_anaf: "outline",
  resolved: "default",
  overdue: "destructive",
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

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  const open = items.filter((d) => d.status !== "resolved")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="normal-case tracking-normal">
          {open.length} deschise
        </Badge>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" /> Adauga discrepanta
        </Button>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Tip</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ETVADiscrepancyType }))}
                >
                  {(Object.entries(ETVA_TYPE_LABELS) as [ETVADiscrepancyType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Perioada</span>
                <input
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  placeholder="ex: 2026-Q1"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">Descriere</span>
              <textarea
                className="mt-1 h-16 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">Diferenta suma (RON, optional)</span>
              <input
                type="number"
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                value={form.amountDifference}
                onChange={(e) => setForm((f) => ({ ...f, amountDifference: e.target.value }))}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anuleaza</Button>
              <Button size="sm" disabled={creating || !form.period || !form.description} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Salveaza
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          label="Nicio discrepanta e-TVA. Adauga o discrepanta cand detectezi diferente intre declaratii si e-TVA precompletata."
        />
      ) : (
        <div className="space-y-2">
          {items.map((d) => {
            const discrepancyBorderL =
              d.severity === "critical" || d.severity === "high"
                ? "border-l-eos-error"
                : d.severity === "medium"
                  ? "border-l-eos-warning"
                  : "border-l-eos-border-subtle"
            return (
            <Card key={d.id} className={`border border-l-[3px] ${discrepancyBorderL} ${d.status === "resolved" ? "border-eos-border bg-eos-surface opacity-70" : "border-eos-border bg-eos-surface"}`}>
            <CardContent className="space-y-2 py-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-eos-text">{ETVA_TYPE_LABELS[d.type]}</p>
                <Badge variant={SEVERITY_VARIANT[d.severity] ?? "default"} className="text-[10px] normal-case tracking-normal">
                  {d.severity}
                </Badge>
                <Badge variant={STATUS_VARIANT[d.status] ?? "outline"} className="text-[10px] normal-case tracking-normal">
                  {ETVA_STATUS_LABELS[d.status]}
                </Badge>
                <span className="text-xs text-eos-text-muted">Perioada: {d.period}</span>
              </div>
              <p className="text-xs text-eos-text-muted">{d.description}</p>
              {d.amountDifference != null && (
                <p className="text-xs text-eos-text-muted">
                  Diferenta: <span className="font-semibold text-eos-text">{d.amountDifference.toLocaleString("ro-RO")} RON</span>
                </p>
              )}
              {d.deadlineISO && (
                <p className="flex items-center gap-1 text-xs text-eos-text-muted">
                  <Clock className="size-3" /> Termen: {new Date(d.deadlineISO).toLocaleDateString("ro-RO")}
                </p>
              )}
              {d.status !== "resolved" && (
                <div className="flex gap-2 pt-1">
                  {d.status === "detected" && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "acknowledge")}>Confirma</Button>
                  )}
                  {d.status === "acknowledged" && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "draft_explanation")}>Redacteaza explicatie</Button>
                  )}
                  {(d.status === "explanation_drafted" || d.status === "response_sent") && (
                    <Button size="sm" variant="outline" onClick={() => void handleTransition(d.id, "resolve")}>Marcheaza rezolvat</Button>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
