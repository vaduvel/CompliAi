"use client"

import { useEffect, useState } from "react"
import { Clock, FileText, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type {
  FilingRecord,
  FilingType,
  FilingStatus,
  FilingDisciplineScore,
} from "@/lib/compliance/filing-discipline"
import { FILING_TYPE_LABELS, FILING_STATUS_LABELS } from "@/lib/compliance/filing-discipline"

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

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  const FILING_STATUS_VARIANT: Record<FilingStatus, "default" | "destructive" | "secondary" | "outline"> = {
    on_time: "default",
    late: "destructive",
    missing: "destructive",
    rectified: "secondary",
    upcoming: "outline",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {score && (
          <Badge variant={score.score >= 80 ? "default" : score.score >= 50 ? "secondary" : "destructive"} className="normal-case tracking-normal">
            Disciplina: {score.score}/100 ({score.label})
          </Badge>
        )}
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" /> Adauga depunere
        </Button>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Tip declaratie</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FilingType }))}
                >
                  {(Object.entries(FILING_TYPE_LABELS) as [FilingType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Perioada</span>
                <input
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  placeholder="ex: 2026-02"
                  value={form.period}
                  onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Status</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FilingStatus }))}
                >
                  {(Object.entries(FILING_STATUS_LABELS) as [FilingStatus, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Termen limita</span>
                <input
                  type="date"
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.dueISO.split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, dueISO: new Date(e.target.value).toISOString() }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anuleaza</Button>
              <Button size="sm" disabled={creating || !form.period || !form.dueISO} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Salveaza
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          label="Nicio depunere inregistrata. Adauga declaratiile si depunerile fiscale pentru a calcula scorul de disciplina."
        />
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const filingBorderL =
              r.status === "late" || r.status === "missing"
                ? "border-l-eos-error"
                : r.status === "upcoming"
                  ? "border-l-eos-warning"
                  : r.status === "on_time" || r.status === "rectified"
                    ? "border-l-eos-success"
                    : "border-l-eos-border-subtle"
            return (
              <Card key={r.id} className={`border border-l-[3px] ${filingBorderL} border-eos-border bg-eos-surface`}>
                <CardContent className="space-y-1 py-3 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{FILING_TYPE_LABELS[r.type]}</p>
                    <Badge variant={FILING_STATUS_VARIANT[r.status]} className="text-[10px] normal-case tracking-normal">
                      {FILING_STATUS_LABELS[r.status]}
                    </Badge>
                    <span className="text-xs text-eos-text-muted">Perioada: {r.period}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-eos-text-muted">
                    <Clock className="size-3" /> Termen: {new Date(r.dueISO).toLocaleDateString("ro-RO")}
                    {r.filedAtISO && <> · Depus: {new Date(r.filedAtISO).toLocaleDateString("ro-RO")}</>}
                  </p>
                  {r.note && <p className="text-xs text-eos-text-muted">{r.note}</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
