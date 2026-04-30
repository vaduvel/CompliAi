"use client"

import { useEffect, useState } from "react"
import { Download, FileCheck2, Loader2, Plus, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { DpiaRecord, DpiaRecordStatus, DpiaRiskLevel } from "@/lib/compliance/types"

type DpiaResponse = {
  records: DpiaRecord[]
  summary: {
    total: number
    open: number
    approved: number
    completed: number
    highResidual: number
  }
}

const STATUS_LABELS: Record<DpiaRecordStatus, string> = {
  draft: "Draft",
  in_review: "În review",
  approved: "Aprobat",
  mitigations_in_progress: "Măsuri în lucru",
  completed: "Finalizat",
  archived: "Arhivat",
}

const RISK_LABELS: Record<DpiaRiskLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toIsoFromInput(value: string) {
  if (!value) return undefined
  return new Date(`${value}T12:00:00.000Z`).toISOString()
}

function joinLines(value: string) {
  return value
    .split(/\r?\n|[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function downloadBlob(blob: Blob, fallbackName: string, response: Response) {
  const fileName =
    response.headers.get("content-disposition")?.match(/filename=\"?([^\";]+)\"?/)?.[1] ??
    fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function DpiaPage() {
  const [records, setRecords] = useState<DpiaRecord[]>([])
  const [summary, setSummary] = useState<DpiaResponse["summary"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "DPIA portal / sistem nou",
    processingPurpose: "Gestionarea serviciilor clientului și răspuns operațional.",
    processingDescription: "Descrie sistemul, fluxul de date și persoanele implicate.",
    dataCategories: "date identificare, date contact",
    dataSubjects: "clienți, angajați",
    legalBasis: "GDPR Art. 6(1)(b)/(c)/(f) — de validat",
    linkedRopaEntryLabel: "RoPA — activitate de completat",
    necessityAssessment: "Prelucrarea este necesară pentru furnizarea serviciului și obligații operaționale.",
    proportionalityAssessment: "Se colectează doar datele necesare; accesul este limitat pe roluri.",
    risks: "acces neautorizat\nretenție excesivă\nrăspuns întârziat la DSAR",
    mitigationMeasures: "RBAC\nlog acces\nretenție documentată\nprocedură DSAR",
    residualRisk: "medium" as DpiaRiskLevel,
    dueDate: todayInputValue(),
    specialCategories: false,
    automatedDecisionMaking: false,
    largeScaleProcessing: false,
  })

  function refresh() {
    setLoading(true)
    fetch("/api/gdpr/dpia", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: DpiaResponse | null) => {
        setRecords(payload?.records ?? [])
        setSummary(payload?.summary ?? null)
      })
      .catch(() => toast.error("Nu am putut încărca registrul DPIA."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createRecord() {
    if (!form.title.trim()) {
      toast.error("Titlul DPIA este obligatoriu.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/gdpr/dpia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          processingPurpose: form.processingPurpose,
          processingDescription: form.processingDescription,
          dataCategories: joinLines(form.dataCategories),
          dataSubjects: joinLines(form.dataSubjects),
          legalBasis: form.legalBasis,
          linkedRopaEntryLabel: form.linkedRopaEntryLabel,
          necessityAssessment: form.necessityAssessment,
          proportionalityAssessment: form.proportionalityAssessment,
          risks: joinLines(form.risks),
          mitigationMeasures: joinLines(form.mitigationMeasures),
          residualRisk: form.residualRisk,
          dueAtISO: toIsoFromInput(form.dueDate),
          specialCategories: form.specialCategories,
          automatedDecisionMaking: form.automatedDecisionMaking,
          largeScaleProcessing: form.largeScaleProcessing,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? "Salvare eșuată.")
      setRecords((prev) => [payload.record, ...prev])
      setSummary(payload.summary)
      toast.success("DPIA creată.")
    } catch (error) {
      toast.error("Nu am putut crea DPIA.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function updateRecord(record: DpiaRecord, patch: Partial<DpiaRecord>, success: string) {
    setBusyId(record.id)
    try {
      const res = await fetch("/api/gdpr/dpia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, ...patch }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error ?? "Actualizare eșuată.")
      setRecords((prev) => prev.map((item) => (item.id === record.id ? payload.record : item)))
      setSummary(payload.summary)
      toast.success(success)
    } catch (error) {
      toast.error("Nu am putut actualiza DPIA.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function exportRecord(record: DpiaRecord) {
    setBusyId(record.id)
    try {
      const res = await fetch(`/api/gdpr/dpia/${encodeURIComponent(record.id)}/export`, {
        cache: "no-store",
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? "Export eșuat.")
      }
      const blob = await res.blob()
      downloadBlob(blob, `dpia-${record.id}.pdf`, res)
      toast.success("DPIA exportată în PDF.")
    } catch (error) {
      toast.error("Nu am putut exporta DPIA.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "DPIA", current: true }]}
        eyebrowBadges={
          <span className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            GDPR Art. 35
          </span>
        }
        title="DPIA — Analiză de impact"
        description="Workflow complet pentru prelucrări cu risc ridicat: scop, RoPA, necesitate, proporționalitate, riscuri, măsuri, dovadă și export PDF."
      />

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Total", summary?.total ?? 0],
          ["Deschise", summary?.open ?? 0],
          ["Aprobate", summary?.approved ?? 0],
          ["Finalizate", summary?.completed ?? 0],
          ["Risc high+", summary?.highResidual ?? 0],
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
            Creează DPIA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            <input className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none" value={form.linkedRopaEntryLabel} onChange={(event) => setForm((prev) => ({ ...prev, linkedRopaEntryLabel: event.target.value }))} placeholder="Legătură RoPA" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.processingPurpose} onChange={(event) => setForm((prev) => ({ ...prev, processingPurpose: event.target.value }))} placeholder="Scop prelucrare" />
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.processingDescription} onChange={(event) => setForm((prev) => ({ ...prev, processingDescription: event.target.value }))} placeholder="Descriere prelucrare" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.dataCategories} onChange={(event) => setForm((prev) => ({ ...prev, dataCategories: event.target.value }))} placeholder="Categorii date" />
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.dataSubjects} onChange={(event) => setForm((prev) => ({ ...prev, dataSubjects: event.target.value }))} placeholder="Persoane vizate" />
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.legalBasis} onChange={(event) => setForm((prev) => ({ ...prev, legalBasis: event.target.value }))} placeholder="Temei legal" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.necessityAssessment} onChange={(event) => setForm((prev) => ({ ...prev, necessityAssessment: event.target.value }))} placeholder="Necesitate" />
            <textarea rows={3} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.proportionalityAssessment} onChange={(event) => setForm((prev) => ({ ...prev, proportionalityAssessment: event.target.value }))} placeholder="Proporționalitate" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea rows={4} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.risks} onChange={(event) => setForm((prev) => ({ ...prev, risks: event.target.value }))} placeholder="Riscuri, câte unul pe linie" />
            <textarea rows={4} className="rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none" value={form.mitigationMeasures} onChange={(event) => setForm((prev) => ({ ...prev, mitigationMeasures: event.target.value }))} placeholder="Măsuri, câte una pe linie" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={form.residualRisk} onChange={(event) => setForm((prev) => ({ ...prev, residualRisk: event.target.value as DpiaRiskLevel }))} className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none">
              {(Object.keys(RISK_LABELS) as DpiaRiskLevel[]).map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className="h-10 rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none" />
            {[
              ["specialCategories", "Categorii speciale"],
              ["automatedDecisionMaking", "Decizii automate"],
              ["largeScaleProcessing", "Scară largă"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-eos-text-muted">
                <input type="checkbox" checked={Boolean(form[key as keyof typeof form])} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.checked }))} className="size-4 rounded border-eos-border accent-eos-primary" />
                {label}
              </label>
            ))}
            <Button onClick={() => void createRecord()} disabled={saving} className="ml-auto gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
              Salvează DPIA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-eos-border bg-eos-surface">
        <CardHeader>
          <CardTitle className="text-base">Registru DPIA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>
          ) : records.length === 0 ? (
            <div className="rounded-eos-sm border border-dashed border-eos-border p-6 text-center text-sm text-eos-text-muted">
              Nu există DPIA încă. Creează prima analiză pentru prelucrarea cu risc ridicat.
            </div>
          ) : (
            records.map((record) => (
              <article key={record.id} className="rounded-eos-lg border border-eos-border bg-eos-bg px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-eos-text">{record.title}</p>
                      <Badge variant={record.status === "completed" ? "success" : "warning"} className="normal-case">{STATUS_LABELS[record.status]}</Badge>
                      <Badge variant={record.residualRisk === "critical" || record.residualRisk === "high" ? "destructive" : "secondary"} className="normal-case">risc {record.residualRisk}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-eos-text-muted">{record.processingPurpose}</p>
                    <p className="mt-1 font-mono text-[11px] text-eos-text-tertiary">
                      RoPA: {record.linkedRopaEntryLabel ?? "nelegat"} · date: {record.dataCategories.slice(0, 3).join(", ") || "de completat"}
                    </p>
                    {record.evidenceNote ? <p className="mt-2 text-xs text-eos-text-muted">{record.evidenceNote}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === record.id} onClick={() => void updateRecord(record, { status: "in_review" }, "DPIA trimisă în review.")}>
                      Review
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === record.id} onClick={() => void updateRecord(record, { status: "approved", approvedBy: "consultant DPO" }, "DPIA aprobată.")}>
                      Aprobă
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === record.id} onClick={() => void updateRecord(record, { status: "completed", evidenceNote: record.evidenceNote || "DPIA finalizată, măsuri documentate și dovadă atașată în Dosar." }, "DPIA finalizată.")}>
                      Finalizează
                    </Button>
                    <Button size="sm" disabled={busyId === record.id} onClick={() => void exportRecord(record)} className="gap-1.5">
                      {busyId === record.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                      PDF
                    </Button>
                  </div>
                </div>
                {(record.specialCategories || record.automatedDecisionMaking || record.largeScaleProcessing) ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-eos-warning">
                    <ShieldAlert className="size-3.5" />
                    {record.specialCategories ? <span>Categorii speciale</span> : null}
                    {record.automatedDecisionMaking ? <span>Decizii automate</span> : null}
                    {record.largeScaleProcessing ? <span>Scară largă</span> : null}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
