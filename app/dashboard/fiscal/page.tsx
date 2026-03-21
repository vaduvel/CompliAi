"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import type { ETVADiscrepancy, ETVADiscrepancyType, ETVADiscrepancyStatus } from "@/lib/compliance/etva-discrepancy"
import { ETVA_TYPE_LABELS, ETVA_STATUS_LABELS } from "@/lib/compliance/etva-discrepancy"
import type { FilingRecord, FilingType, FilingStatus, FilingDisciplineScore } from "@/lib/compliance/filing-discipline"
import { FILING_TYPE_LABELS, FILING_STATUS_LABELS } from "@/lib/compliance/filing-discipline"

// ── Severity badge helpers ───────────────────────────────────────────────────

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

// ── Discrepancies Tab ────────────────────────────────────────────────────────

function DiscrepanciesTab() {
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
      .catch(() => toast.error("Nu am putut incarca discrepantele."))
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
      toast.success("Discrepanta creata.")
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

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se incarca...</div>

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
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {items.map((d) => (
            <CardContent key={d.id} className="space-y-2 py-3">
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
          ))}
        </Card>
      )}
    </div>
  )
}

// ── Filing Records Tab ───────────────────────────────────────────────────────

function FilingRecordsTab() {
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
      .catch(() => toast.error("Nu am putut incarca depunerile."))
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
      toast.success("Depunere adaugata.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la creare.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se incarca...</div>

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
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {records.map((r) => (
            <CardContent key={r.id} className="space-y-1 py-3">
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
          ))}
        </Card>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FiscalPage() {
  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Fiscal"
        title="Monitorizezi conformitatea fiscala"
        description="Discrepante e-TVA, depuneri fiscale si scor de disciplina. Urmaresti termenele ANAF si documentezi raspunsurile."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            ANAF · e-TVA · SAF-T
          </Badge>
        }
      />

      <Tabs defaultValue="discrepante" className="space-y-6">
        <TabsList className="gap-0 border-b border-eos-border text-eos-text-muted">
          <TabsTrigger
            value="discrepante"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <AlertTriangle className="mr-1.5 size-3.5" />
            Discrepante e-TVA
          </TabsTrigger>
          <TabsTrigger
            value="depuneri"
            className="min-h-10 min-w-[140px] px-4 py-2 data-[state=active]:border-eos-primary data-[state=active]:text-eos-text"
          >
            <FileText className="mr-1.5 size-3.5" />
            Depuneri fiscale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discrepante">
          <DiscrepanciesTab />
        </TabsContent>

        <TabsContent value="depuneri">
          <FilingRecordsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
