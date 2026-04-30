"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, GraduationCap, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { GdprTrainingAudience, GdprTrainingRecord } from "@/lib/compliance/types"

const AUDIENCE_LABELS: Record<GdprTrainingAudience, string> = {
  all_staff: "Toți angajații",
  management: "Management",
  new_hires: "Angajați noi",
  specific_roles: "Roluri specifice",
}

type TrainingResponse = {
  records: GdprTrainingRecord[]
  summary: {
    total: number
    completed: number
    open: number
    evidenceRequired: number
    participantsCovered: number
  }
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toIsoFromInput(value: string) {
  if (!value) return undefined
  return new Date(`${value}T12:00:00.000Z`).toISOString()
}

export default function GdprTrainingPage() {
  const [records, setRecords] = useState<GdprTrainingRecord[]>([])
  const [summary, setSummary] = useState<TrainingResponse["summary"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "Training GDPR anual pentru angajați",
    audience: "all_staff" as GdprTrainingAudience,
    participantCount: "0",
    dueDate: todayInputValue(),
  })

  function refresh() {
    setLoading(true)
    fetch("/api/gdpr/training", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: TrainingResponse | null) => {
        setRecords(payload?.records ?? [])
        setSummary(payload?.summary ?? null)
      })
      .catch(() => toast.error("Nu am putut încărca trainingul GDPR."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createRecord() {
    if (!form.title.trim()) {
      toast.error("Titlul este obligatoriu.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/gdpr/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          audience: form.audience,
          participantCount: Number.parseInt(form.participantCount, 10) || 0,
          status: "evidence_required",
          dueAtISO: toIsoFromInput(form.dueDate),
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? "Salvare eșuată.")
      setRecords((prev) => [payload.record, ...prev])
      setSummary(payload.summary)
      toast.success("Training GDPR adăugat în tracker.")
    } catch (error) {
      toast.error("Nu am putut salva trainingul.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function markCompleted(record: GdprTrainingRecord) {
    try {
      const res = await fetch("/api/gdpr/training", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          status: "completed",
          completedAtISO: new Date().toISOString(),
          evidenceNote: record.evidenceNote || "Training GDPR completat. Lista participanților / dovada comunicării trebuie păstrată în Dosar.",
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? "Actualizare eșuată.")
      setRecords((prev) => prev.map((item) => (item.id === record.id ? payload.record : item)))
      setSummary(payload.summary)
      toast.success("Training marcat completat.")
    } catch (error) {
      toast.error("Nu am putut actualiza trainingul.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "Training GDPR", current: true }]}
        eyebrowBadges={
          <span className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            GDPR accountability
          </span>
        }
        title="Training GDPR angajați"
        description="Tracker simplu pentru trainingurile privacy pe care consultantul DPO trebuie să le poată arăta în raport lunar sau la control: audiență, participanți, termen, dovadă."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Total", summary?.total ?? 0],
          ["Completate", summary?.completed ?? 0],
          ["Deschise", summary?.open ?? 0],
          ["Participanți acoperiți", summary?.participantsCovered ?? 0],
        ].map(([label, value]) => (
          <Card key={label} className="border-eos-border bg-eos-surface">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-eos-text-tertiary">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-eos-text">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4 text-eos-primary" strokeWidth={2} />
            Adaugă training în tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.6fr_0.7fr_auto]">
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            placeholder="Titlu training"
          />
          <select
            value={form.audience}
            onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value as GdprTrainingAudience }))}
            className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
          >
            {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            value={form.participantCount}
            onChange={(event) => setForm((prev) => ({ ...prev, participantCount: event.target.value }))}
            className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            inputMode="numeric"
            placeholder="Participanți"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
          />
          <Button onClick={() => void createRecord()} disabled={saving} className="h-10 gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <GraduationCap className="size-4" strokeWidth={2} />}
            Salvează
          </Button>
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader>
          <CardTitle className="text-base">Registru training GDPR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-eos-text-muted">
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Se încarcă...
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-eos-sm border border-dashed border-eos-border p-6 text-center text-sm text-eos-text-muted">
              Nu există traininguri încă. Adaugă primul training GDPR pentru client.
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-eos-sm border border-eos-border bg-eos-bg px-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-eos-text">{record.title}</p>
                    <Badge variant={record.status === "completed" ? "success" : "warning"} className="normal-case">
                      {record.status === "completed" ? "Completat" : "Dovadă necesară"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    {AUDIENCE_LABELS[record.audience]} · {record.participantCount} participanți
                    {record.dueAtISO ? ` · termen ${new Date(record.dueAtISO).toLocaleDateString("ro-RO")}` : ""}
                  </p>
                  {record.evidenceNote ? (
                    <p className="mt-1 text-xs text-eos-text-tertiary">{record.evidenceNote}</p>
                  ) : null}
                </div>
                {record.status !== "completed" ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void markCompleted(record)}>
                    <CheckCircle2 className="size-3.5" strokeWidth={2} />
                    Marchează completat
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
