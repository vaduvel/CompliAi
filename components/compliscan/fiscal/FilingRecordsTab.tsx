"use client"

import { useEffect, useState } from "react"
import { Clock, FileText, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import type {
  FilingRecord,
  FilingType,
  FilingStatus,
  FilingDisciplineScore,
} from "@/lib/compliance/filing-discipline"
import { FILING_TYPE_LABELS, FILING_STATUS_LABELS } from "@/lib/compliance/filing-discipline"

const FILING_STATUS_TONE: Record<FilingStatus, string> = {
  on_time: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  late: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  missing: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  rectified: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  upcoming: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

export function FilingRecordsTab() {
  const [records, setRecords] = useState<FilingRecord[]>([])
  const [score, setScore] = useState<FilingDisciplineScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: "d300_tva" as FilingType,
    period: "",
    status: "on_time" as FilingStatus,
    dueISO: "",
  })

  useEffect(() => {
    fetch("/api/fiscal/filing-records", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { records?: FilingRecord[]; disciplineScore?: FilingDisciplineScore }) => {
        setRecords(data.records ?? [])
        setScore(data.disciplineScore ?? null)
      })
      .catch(() => toast.error("Nu am putut încărca depunerile."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.period || !form.dueISO) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/filing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { record?: FilingRecord; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      if (data.record) setRecords((prev) => [data.record!, ...prev])
      setForm({ type: "d300_tva", period: "", status: "on_time", dueISO: "" })
      setShowForm(false)
      toast.success("Depunere adăugată.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la creare.")
    } finally {
      setCreating(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se incarca...
      </div>
    )

  const scoreTone =
    score == null
      ? "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
      : score.score >= 80
        ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
        : score.score >= 50
          ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
          : "border-eos-error/30 bg-eos-error-soft text-eos-error"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {score ? (
          <span
            className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${scoreTone}`}
          >
            Disciplina: {score.score}/100 ({score.label})
          </span>
        ) : (
          <span />
        )}
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} /> Adauga depunere
        </Button>
      </div>

      {showForm && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Adauga depunere fiscala
            </h3>
          </header>
          <div className="space-y-3 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Tip declaratie
                </span>
                <select
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FilingType }))}
                >
                  {(Object.entries(FILING_TYPE_LABELS) as [FilingType, string][]).map(([v, l]) => (
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
                  placeholder="ex: 2026-02"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Status
                </span>
                <select
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FilingStatus }))}
                >
                  {(Object.entries(FILING_STATUS_LABELS) as [FilingStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Termen limita
                </span>
                <input
                  type="date"
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                  value={form.dueISO.split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, dueISO: new Date(e.target.value).toISOString() }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anuleaza
              </Button>
              <Button size="sm" disabled={creating || !form.period || !form.dueISO} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
                Salveaza
              </Button>
            </div>
          </div>
        </section>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
            <FileText className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
          </div>
          <div className="max-w-md space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Nicio depunere inregistrata
            </p>
            <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
              Adauga declaratiile si depunerile fiscale pentru a calcula scorul de disciplina.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const severityBar =
              r.status === "late" || r.status === "missing"
                ? "bg-eos-error"
                : r.status === "upcoming"
                  ? "bg-eos-warning"
                  : r.status === "on_time" || r.status === "rectified"
                    ? "bg-eos-success"
                    : "bg-eos-border-strong"
            const statusTone = FILING_STATUS_TONE[r.status]

            return (
              <article
                key={r.id}
                className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface"
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[3px] ${severityBar}`}
                  aria-hidden
                />
                <div className="space-y-1.5 py-3 pl-5 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
                      {FILING_TYPE_LABELS[r.type]}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${statusTone}`}
                    >
                      {FILING_STATUS_LABELS[r.status]}
                    </span>
                    <span className="font-mono text-[11px] text-eos-text-muted">Perioada: {r.period}</span>
                  </div>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-eos-text-muted">
                    <Clock className="size-3" strokeWidth={2} /> Termen:{" "}
                    {new Date(r.dueISO).toLocaleDateString("ro-RO")}
                    {r.filedAtISO && <> · Depus: {new Date(r.filedAtISO).toLocaleDateString("ro-RO")}</>}
                  </p>
                  {r.note && <p className="text-[12px] leading-[1.5] text-eos-text-muted">{r.note}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
