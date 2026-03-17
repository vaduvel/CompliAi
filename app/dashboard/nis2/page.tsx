"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import {
  NIS2_QUESTIONS,
  NIS2_CATEGORY_LABELS,
  SECTOR_LABELS,
  scoreNis2Assessment,
  type Nis2Answer,
  type Nis2Answers,
  type Nis2Result,
  type Nis2Sector,
  type Nis2Category,
} from "@/lib/compliance/nis2-rules"
import type {
  Nis2AssessmentRecord,
  Nis2AttackType,
  Nis2Incident,
  Nis2IncidentSeverity,
  Nis2IncidentStatus,
  Nis2OperationalImpact,
  Nis2Vendor,
  Nis2VendorRiskLevel,
} from "@/lib/server/nis2-store"
import { buildDNSCReport, ATTACK_TYPE_LABELS, OPERATIONAL_IMPACT_LABELS } from "@/lib/compliance/dnsc-report"

// ── DNSC download helper ───────────────────────────────────────────────────────

function downloadDNSCReport(incident: Nis2Incident, orgName?: string) {
  const content = buildDNSCReport(incident, orgName)
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `raport-dnsc-${incident.id}-${new Date().toISOString().split("T")[0]}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

const SEVERITY_BADGE: Record<string, "default" | "warning" | "destructive" | "success" | "outline"> = {
  low: "outline",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
}

const ANSWER_OPTIONS: { value: Nis2Answer; label: string }[] = [
  { value: "yes", label: "Da" },
  { value: "partial", label: "Parțial" },
  { value: "no", label: "Nu" },
  { value: "na", label: "N/A" },
]

function slaLabel(deadlineISO: string): { label: string; urgent: boolean } {
  const diff = new Date(deadlineISO).getTime() - Date.now()
  if (diff < 0) return { label: "Termen depășit", urgent: true }
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return { label: "< 1h", urgent: true }
  if (h < 24) return { label: `${h}h`, urgent: h < 6 }
  const d = Math.floor(h / 24)
  return { label: `${d}z`, urgent: false }
}

// ── Assessment tab ─────────────────────────────────────────────────────────────

function MaturityBadge({ label }: { label: Nis2Result["maturityLabel"] }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "outline"; text: string }> = {
    robust: { variant: "success", text: "Robust" },
    partial: { variant: "warning", text: "Parțial" },
    initial: { variant: "destructive", text: "Inițial" },
    "non-conform": { variant: "destructive", text: "Neconform" },
  }
  const { variant, text } = map[label]
  return <Badge variant={variant}>{text}</Badge>
}

function AssessmentTab({ orgName }: { orgName?: string }) {
  const [sector, setSector] = useState<Nis2Sector>("general")
  const [answers, setAnswers] = useState<Nis2Answers>({})
  const [saving, setSaving] = useState(false)
  const [generatingIR, setGeneratingIR] = useState(false)
  const [savedRecord, setSavedRecord] = useState<Nis2AssessmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<Nis2Category>>(
    new Set(["risk-management", "incident-response"])
  )

  useEffect(() => {
    fetch("/api/nis2/assessment", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: Nis2AssessmentRecord | null }) => {
        if (d.assessment) {
          setSavedRecord(d.assessment)
          setSector(d.assessment.sector)
          setAnswers(d.assessment.answers)
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const applicable = NIS2_QUESTIONS.filter(
    (q) => q.sectors === "all" || q.sectors.includes(sector)
  )

  const liveResult = scoreNis2Assessment(answers, sector)
  const answeredCount = applicable.filter((q) => answers[q.id]).length

  // Group by category
  const byCategory = applicable.reduce<Record<Nis2Category, typeof applicable>>(
    (acc, q) => {
      const cat = q.category
      acc[cat] = acc[cat] ?? []
      acc[cat].push(q)
      return acc
    },
    {} as Record<Nis2Category, typeof applicable>
  )

  async function handleGenerateIR() {
    setGeneratingIR(true)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "nis2-incident-response",
          orgName: orgName ?? "Organizația mea",
          orgSector: sector !== "general" ? sector : undefined,
        }),
      })
      if (!res.ok) throw new Error("Generarea a eșuat.")
      const doc = (await res.json()) as { content: string; title: string }
      const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `plan-ir-nis2-${new Date().toISOString().split("T")[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Plan IR NIS2 generat și descărcat")
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGeneratingIR(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/nis2/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, answers }),
      })
      const data = (await res.json()) as { result?: Nis2Result; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Salvarea a eșuat.")
      setSavedRecord({
        sector,
        answers,
        savedAtISO: new Date().toISOString(),
        score: data.result!.score,
        maturityLabel: data.result!.maturityLabel,
      })
      toast.success("Evaluare NIS2 salvată", {
        description: `Scor: ${data.result!.score}% — ${data.result!.maturityLabel}`,
      })
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(cat: Nis2Category) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (loading) return <LoadingScreen variant="section" />

  const sectorOpts = Object.entries(SECTOR_LABELS()) as [Nis2Sector, string][]

  return (
    <div className="space-y-5">
      {/* Sector selector */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
            Sector organizație
          </p>
          <div className="flex flex-wrap gap-2">
            {sectorOpts.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setSector(val)
                  setAnswers({})
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  sector === val
                    ? "border-eos-primary bg-eos-primary/10 text-eos-primary"
                    : "border-eos-border bg-eos-surface text-eos-text-muted hover:bg-eos-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live score */}
      {answeredCount > 0 && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
                  Scor curent ({answeredCount}/{applicable.length} răspunsuri)
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <span className={`text-4xl font-bold ${
                    liveResult.score >= 75 ? "text-emerald-600" : liveResult.score >= 50 ? "text-amber-600" : "text-red-600"
                  }`}>
                    {liveResult.score}%
                  </span>
                  <div className="mb-1">
                    <MaturityBadge label={liveResult.maturityLabel} />
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="normal-case tracking-normal">
                {liveResult.entityType === "essential" ? "Entitate esențială" : "Entitate importantă"}
              </Badge>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-eos-bg-inset">
              <div
                className={`h-full rounded-full transition-all ${
                  liveResult.score >= 75 ? "bg-emerald-500" : liveResult.score >= 50 ? "bg-amber-400" : "bg-red-500"
                }`}
                style={{ width: `${liveResult.score}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions by category */}
      {(Object.entries(byCategory) as [Nis2Category, typeof applicable][]).map(([cat, qs]) => {
        const expanded = expandedCategories.has(cat)
        const catAnswered = qs.filter((q) => answers[q.id]).length
        return (
          <Card key={cat} className="border-eos-border bg-eos-surface">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-eos-text">{NIS2_CATEGORY_LABELS[cat]}</p>
                <span className="text-xs text-eos-text-muted">{catAnswered}/{qs.length}</span>
              </div>
              {expanded ? (
                <ChevronUp className="size-4 text-eos-text-muted" strokeWidth={2} />
              ) : (
                <ChevronDown className="size-4 text-eos-text-muted" strokeWidth={2} />
              )}
            </button>
            {expanded && (
              <CardContent className="space-y-3 px-5 pb-5 pt-0">
                {qs.map((q, idx) => {
                  const ans = answers[q.id]
                  return (
                    <div key={q.id} className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-eos-bg-inset text-[10px] font-bold text-eos-text-muted">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-eos-text">{q.text}</p>
                              {q.weight === 3 && (
                                <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                                  obligatoriu
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-eos-text-muted">{q.hint}</p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-eos-text-tertiary">
                              {q.article}{q.dnscRef ? ` · ${q.dnscRef}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ANSWER_OPTIONS.map((opt) => {
                              const selected = ans === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                    selected
                                      ? opt.value === "yes"
                                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                        : opt.value === "partial"
                                        ? "border-amber-400 bg-amber-50 text-amber-700"
                                        : opt.value === "no"
                                        ? "border-red-400 bg-red-50 text-red-700"
                                        : "border-gray-400 bg-gray-100 text-gray-700"
                                      : "border-eos-border text-eos-text-muted hover:bg-eos-surface"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                          {ans && ans !== "yes" && ans !== "na" && (
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" strokeWidth={2} />
                              <p className="text-xs text-eos-text-muted">{q.hint}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Save + gaps */}
      <div className="space-y-4">
        <Button
          onClick={() => void handleSave()}
          disabled={saving || answeredCount === 0}
          className="w-full gap-2"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se salvează…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Salvează evaluarea NIS2{answeredCount < applicable.length ? ` (${answeredCount}/${applicable.length})` : ""}
            </>
          )}
        </Button>

        {/* Gap analysis */}
        {liveResult.gaps.length > 0 && answeredCount > 0 && (
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Gap analysis — {liveResult.gaps.length} lacun{liveResult.gaps.length !== 1 ? "e" : "ă"} identificat{liveResult.gaps.length !== 1 ? "e" : "ă"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {liveResult.gaps.map((gap) => {
                const Icon = gap.severity === "critical" ? XCircle : AlertTriangle
                const color = gap.severity === "critical" ? "text-red-500" : gap.severity === "high" ? "text-orange-500" : "text-amber-500"
                return (
                  <div key={gap.questionId} className="flex gap-3 rounded-eos-md border border-eos-border bg-eos-surface p-3">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-eos-text">{gap.question}</p>
                      <p className="mt-0.5 text-xs text-eos-text-muted">{gap.article}</p>
                      <p className="mt-1.5 text-xs leading-5 text-eos-text-muted">{gap.remediationHint}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {savedRecord && (
          <p className="text-center text-xs text-eos-text-muted">
            Ultima salvare: {new Date(savedRecord.savedAtISO).toLocaleString("ro-RO")} · Scor: {savedRecord.score}%
          </p>
        )}

        {/* R-3: Generează Plan IR */}
        {answeredCount > 0 && (
          <Button
            variant="outline"
            onClick={() => void handleGenerateIR()}
            disabled={generatingIR}
            className="w-full gap-2"
          >
            {generatingIR ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se generează planul IR…
              </>
            ) : (
              <>
                <FileText className="size-4" strokeWidth={2} />
                Generează Plan de Răspuns la Incidente (NIS2)
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Incident tab ───────────────────────────────────────────────────────────────

const INCIDENT_STATUS_LABELS: Record<Nis2IncidentStatus, string> = {
  "open": "Deschis",
  "reported-24h": "Raportat 24h",
  "reported-72h": "Raportat 72h",
  "closed": "Închis",
}

function IncidentRow({
  incident,
  orgName,
  onUpdate,
  onDelete,
}: {
  incident: Nis2Incident
  orgName?: string
  onUpdate: (id: string, patch: Partial<Nis2Incident>) => void
  onDelete: (id: string) => void
}) {
  const sla24 = slaLabel(incident.deadline24hISO)
  const sla72 = slaLabel(incident.deadline72hISO)
  const isOpen = incident.status !== "closed"

  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-eos-text">{incident.title}</p>
            <Badge variant={SEVERITY_BADGE[incident.severity]} className="text-[10px] normal-case tracking-normal">
              {incident.severity}
            </Badge>
            <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
              {INCIDENT_STATUS_LABELS[incident.status]}
            </Badge>
          </div>
          {incident.description && (
            <p className="mt-1 text-xs text-eos-text-muted">{incident.description}</p>
          )}
          <p className="mt-1 text-xs text-eos-text-tertiary">
            Detectat: {new Date(incident.detectedAtISO).toLocaleString("ro-RO")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOpen && (
            <select
              className="h-8 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 text-xs text-eos-text outline-none"
              value={incident.status}
              aria-label="Schimbă status"
              onChange={(e) =>
                onUpdate(incident.id, { status: e.target.value as Nis2IncidentStatus })
              }
            >
              {(Object.entries(INCIDENT_STATUS_LABELS) as [Nis2IncidentStatus, string][]).map(
                ([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                )
              )}
            </select>
          )}
          <button
            type="button"
            onClick={() => downloadDNSCReport(incident, orgName)}
            title="Generează raport DNSC"
            className="flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs font-medium text-eos-text-muted hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Export raport DNSC"
          >
            <Download className="size-3.5" strokeWidth={2} />
            DNSC
          </button>
          <button
            type="button"
            onClick={() => onDelete(incident.id)}
            className="rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-red-50 hover:text-red-600"
            aria-label="Șterge incident"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* SLA timers */}
      {isOpen && (
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            sla24.urgent ? "border-red-300 bg-red-50 text-red-700" : "border-eos-border bg-eos-surface text-eos-text-muted"
          }`}>
            <span>Alertă 24h DNSC:</span>
            <span className="font-bold">{sla24.label}</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            sla72.urgent ? "border-orange-300 bg-orange-50 text-orange-700" : "border-eos-border bg-eos-surface text-eos-text-muted"
          }`}>
            <span>Raport complet 72h:</span>
            <span className="font-bold">{sla72.label}</span>
          </div>
        </div>
      )}

      {/* Câmpuri DNSC completate */}
      {(incident.attackType || incident.operationalImpact) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eos-text-muted">
          {incident.attackType && (
            <span>
              <span className="font-medium text-eos-text">Tip atac:</span>{" "}
              {ATTACK_TYPE_LABELS[incident.attackType]}
            </span>
          )}
          {incident.operationalImpact && (
            <span>
              <span className="font-medium text-eos-text">Impact:</span>{" "}
              {OPERATIONAL_IMPACT_LABELS[incident.operationalImpact]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function IncidentsTab({ orgName }: { orgName?: string }) {
  const [incidents, setIncidents] = useState<Nis2Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high" as Nis2IncidentSeverity,
    affectedSystems: "",
    attackType: "" as Nis2AttackType | "",
    attackVector: "",
    operationalImpact: "" as Nis2OperationalImpact | "",
    operationalImpactDetails: "",
    measuresTaken: "",
  })

  useEffect(() => {
    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { incidents: Nis2Incident[] }) => setIncidents(d.incidents ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          severity: form.severity,
          affectedSystems: form.affectedSystems.split(",").map((s) => s.trim()).filter(Boolean),
          ...(form.attackType && { attackType: form.attackType }),
          ...(form.attackVector.trim() && { attackVector: form.attackVector.trim() }),
          ...(form.operationalImpact && { operationalImpact: form.operationalImpact }),
          ...(form.operationalImpactDetails.trim() && { operationalImpactDetails: form.operationalImpactDetails.trim() }),
          ...(form.measuresTaken.trim() && { measuresTaken: form.measuresTaken.trim() }),
        }),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setIncidents((prev) => [data.incident!, ...prev])
      setForm({
        title: "", description: "", severity: "high", affectedSystems: "",
        attackType: "", attackVector: "", operationalImpact: "",
        operationalImpactDetails: "", measuresTaken: "",
      })
      setShowForm(false)
      toast.success("Incident înregistrat", { description: "Termenele SLA au fost calculate automat." })
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, patch: Partial<Nis2Incident>) {
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      setIncidents((prev) => prev.map((i) => (i.id === id ? data.incident! : i)))
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest incident NIS2?")) return
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Eroare la ștergere.")
      setIncidents((prev) => prev.filter((i) => i.id !== id))
      toast.success("Incident șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  const openCount = incidents.filter((i) => i.status !== "closed").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <Badge variant="destructive" dot className="normal-case tracking-normal">
              {openCount} deschis{openCount !== 1 ? "e" : ""}
            </Badge>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} />
          Înregistrează incident
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="text-sm">Incident nou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="text"
              placeholder="Titlu incident *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Descriere (opțional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Severitate</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Nis2IncidentSeverity }))}
                >
                  {(["low", "medium", "high", "critical"] as Nis2IncidentSeverity[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Sisteme afectate (virgulă)</label>
                <input
                  type="text"
                  placeholder="ERP, email, VPN"
                  value={form.affectedSystems}
                  onChange={(e) => setForm((f) => ({ ...f, affectedSystems: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
            </div>
            {/* Câmpuri DNSC opționale */}
            <p className="text-xs font-medium text-eos-text-muted pt-1">Câmpuri raportare DNSC (opționale)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Tip atac</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.attackType}
                  onChange={(e) => setForm((f) => ({ ...f, attackType: e.target.value as Nis2AttackType | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(ATTACK_TYPE_LABELS) as [Nis2AttackType, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Impact operațional</label>
                <select
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.operationalImpact}
                  onChange={(e) => setForm((f) => ({ ...f, operationalImpact: e.target.value as Nis2OperationalImpact | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(OPERATIONAL_IMPACT_LABELS) as [Nis2OperationalImpact, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Vector de atac (ex: email phishing cu .exe atașat)"
              value={form.attackVector}
              onChange={(e) => setForm((f) => ({ ...f, attackVector: e.target.value }))}
              className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Măsuri luate (containment, remediere)"
              value={form.measuresTaken}
              onChange={(e) => setForm((f) => ({ ...f, measuresTaken: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.title.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează incident
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : incidents.length === 0 ? (
        <EmptyState
          title="Niciun incident înregistrat"
          label="Înregistrează incidente de securitate pentru a monitoriza termenele SLA de raportare DNSC."
          icon={ShieldAlert}
          className="rounded-eos-md border border-eos-border"
        />
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {incidents.map((inc) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              orgName={orgName}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </Card>
      )}

      {/* DNSC info */}
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">Obligații raportare NIS2 (Art. 23)</p>
        <p className="mt-1">
          <span className="font-semibold text-amber-600">24h</span> — Alertă inițială la DNSC (confirmare incident semnificativ).{" "}
          <span className="font-semibold text-red-600">72h</span> — Raport complet (impact, cauze, măsuri luate).{" "}
          1 lună — Raport final cu lecțiile învățate.
        </p>
      </div>
    </div>
  )
}

// ── Vendors tab ────────────────────────────────────────────────────────────────

function VendorRow({
  vendor,
  onDelete,
}: {
  vendor: Nis2Vendor
  onDelete: (id: string) => void
}) {
  const clauses = [
    { ok: vendor.hasSecurityClause, label: "Clauze securitate" },
    { ok: vendor.hasIncidentNotification, label: "Notificare incident" },
    { ok: vendor.hasAuditRight, label: "Drept audit" },
  ]
  return (
    <div className="flex flex-wrap items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-eos-text">{vendor.name}</p>
          <Badge variant={SEVERITY_BADGE[vendor.riskLevel]} className="text-[10px] normal-case tracking-normal">
            risc {vendor.riskLevel}
          </Badge>
        </div>
        {vendor.service && <p className="text-xs text-eos-text-muted">{vendor.service}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {clauses.map((c) => (
          <span
            key={c.label}
            className={`flex items-center gap-1 text-xs ${c.ok ? "text-emerald-600" : "text-eos-text-muted line-through"}`}
          >
            {c.ok ? (
              <CheckCircle2 className="size-3" strokeWidth={2} />
            ) : (
              <XCircle className="size-3" strokeWidth={2} />
            )}
            {c.label}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onDelete(vendor.id)}
        className="shrink-0 rounded-eos-md border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-red-50 hover:text-red-600"
        aria-label="Șterge vendor"
      >
        <Trash2 className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}

function VendorsTab() {
  const [vendors, setVendors] = useState<Nis2Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    service: "",
    riskLevel: "medium" as Nis2VendorRiskLevel,
    hasSecurityClause: false,
    hasIncidentNotification: false,
    hasAuditRight: false,
    notes: "",
  })

  useEffect(() => {
    fetch("/api/nis2/vendors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { vendors: Nis2Vendor[] }) => setVendors(d.vendors ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { vendor?: Nis2Vendor; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setVendors((prev) => [data.vendor!, ...prev])
      setForm({ name: "", service: "", riskLevel: "medium", hasSecurityClause: false, hasIncidentNotification: false, hasAuditRight: false, notes: "" })
      setShowForm(false)
      toast.success("Furnizor adăugat")
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleImportFromEfactura() {
    setImporting(true)
    try {
      const res = await fetch("/api/nis2/vendors/import-efactura", { method: "POST" })
      const data = (await res.json()) as { added: number; skipped: number; message: string; demoMode?: boolean }
      if (!res.ok) throw new Error(data.message ?? "Import eșuat.")
      if (data.added > 0) {
        // reload vendors
        const updated = await fetch("/api/nis2/vendors", { cache: "no-store" }).then((r) => r.json()) as { vendors: Nis2Vendor[] }
        setVendors(updated.vendors ?? [])
        if (data.demoMode) {
          toast.warning(data.message, {
            description: "Conectează contul ANAF din Setări pentru date reale.",
            duration: 6000,
          })
        } else {
          toast.success(data.message)
        }
      } else {
        toast.info(data.message)
      }
    } catch (err) {
      toast.error("Eroare la import", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest furnizor din registru?")) return
    try {
      const res = await fetch(`/api/nis2/vendors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVendors((prev) => prev.filter((v) => v.id !== id))
      toast.success("Furnizor șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  const highRiskCount = vendors.filter((v) => v.riskLevel === "high" || v.riskLevel === "critical").length
  const missingClausesCount = vendors.filter((v) => !v.hasSecurityClause || !v.hasIncidentNotification).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {highRiskCount > 0 && (
            <Badge variant="destructive" className="normal-case tracking-normal">
              {highRiskCount} risc înalt/critic
            </Badge>
          )}
          {missingClausesCount > 0 && (
            <Badge variant="warning" className="normal-case tracking-normal">
              {missingClausesCount} fără clauze complete
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => void handleImportFromEfactura()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" strokeWidth={2} />
            )}
            Importă din e-Factura
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-3.5" strokeWidth={2} />
            Adaugă furnizor
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="text-sm">Furnizor ICT nou</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nume furnizor *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
              <input
                type="text"
                placeholder="Serviciu (ex: hosting, ERP, email)"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                className="h-9 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-eos-text-muted">Nivel risc</label>
              <select
                className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none sm:w-48"
                value={form.riskLevel}
                onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as Nis2VendorRiskLevel }))}
              >
                {(["low", "medium", "high", "critical"] as Nis2VendorRiskLevel[]).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "hasSecurityClause" as const, label: "Clauze securitate în contract" },
                { key: "hasIncidentNotification" as const, label: "Notificare incidente" },
                { key: "hasAuditRight" as const, label: "Drept de audit" },
              ].map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm text-eos-text">
                  <input
                    type="checkbox"
                    checked={form[c.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.checked }))}
                    className="size-4 accent-eos-primary"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.name.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează furnizor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : vendors.length === 0 ? (
        <EmptyState
          title="Niciun furnizor ICT înregistrat"
          label="Adaugă furnizorii IT și cloud care procesează date sau susțin sisteme critice ale organizației tale."
          icon={Shield}
          className="rounded-eos-md border border-eos-border"
        />
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {vendors.map((v) => (
            <VendorRow key={v.id} vendor={v} onDelete={handleDelete} />
          ))}
        </Card>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">De ce registrul furnizorilor ICT?</p>
        <p className="mt-1">
          NIS2 Art. 21(2)(d) obligă evaluarea riscurilor din lanțul de aprovizionare. La audit, DNSC verifică dacă ai clauze de securitate,
          notificare incidente și drept de audit în contractele cu furnizorii critici.
        </p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Nis2Page() {
  // orgName pentru rapoartele DNSC — citit din session header via fetch minimal
  const [orgName, setOrgName] = useState<string | undefined>()
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { orgName?: string }) => { if (d.orgName) setOrgName(d.orgName) })
      .catch(() => null)
  }, [])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="NIS2"
        title="Directiva NIS2 — Securitate cibernetică"
        description="Instrument de evaluare și monitorizare pentru conformitatea cu Directiva NIS2 (2022/2555) și ghidul DNSC. Evaluare, incident log cu SLA tracking și registrul furnizorilor ICT."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Directiva (UE) 2022/2555
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              DNSC Romania
            </Badge>
          </>
        }
      />

      <Tabs defaultValue="assessment" className="space-y-5">
        <TabsList className="border-b border-eos-border">
          <TabsTrigger value="assessment" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Evaluare</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Gap analysis NIS2</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Incidente</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">SLA 24h / 72h DNSC</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="min-h-12 flex-col items-start px-4 py-3 text-left">
            <span className="text-sm font-medium">Furnizori ICT</span>
            <span className="mt-0.5 text-xs font-normal text-eos-text-muted">Registru lanț aprovizionare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <AssessmentTab orgName={orgName} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab orgName={orgName} />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
