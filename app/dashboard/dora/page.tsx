"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { DoraIncident, DoraTprmEntry, DoraState, DoraIncidentSeverity, DoraIncidentStatus, TprmCriticality } from "@/lib/server/dora-store"

// ─── Label maps ───────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<DoraIncidentSeverity, string> = {
  major: "Major",
  significant: "Semnificativ",
  minor: "Minor",
}

const SEVERITY_BADGE: Record<DoraIncidentSeverity, "destructive" | "warning" | "outline"> = {
  major: "destructive",
  significant: "warning",
  minor: "outline",
}

const STATUS_LABELS: Record<DoraIncidentStatus, string> = {
  detected: "Detectat",
  "under-analysis": "În analiză",
  "notified-authority": "Raportat la autoritate",
  resolved: "Rezolvat",
  closed: "Închis",
}

const STATUS_BADGE: Record<DoraIncidentStatus, "warning" | "default" | "success" | "outline" | "destructive"> = {
  detected: "destructive",
  "under-analysis": "warning",
  "notified-authority": "default",
  resolved: "success",
  closed: "outline",
}

const CRITICALITY_LABELS: Record<TprmCriticality, string> = {
  critical: "Critic",
  important: "Important",
  standard: "Standard",
}

const CRITICALITY_BADGE: Record<TprmCriticality, "destructive" | "warning" | "outline"> = {
  critical: "destructive",
  important: "warning",
  standard: "outline",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeLeft(isoDate: string) {
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff < 0) return { label: "Depășit", urgent: true }
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return { label: `${hours}h rămase`, urgent: hours < 4 }
  const days = Math.ceil(diff / 86_400_000)
  return { label: `${days} zile rămase`, urgent: days <= 7 }
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DoraPage() {
  const [state, setState] = useState<DoraState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [showTprmForm, setShowTprmForm] = useState(false)
  const [activeTab, setActiveTab] = useState<"incidents" | "tprm">("incidents")

  useEffect(() => {
    fetch("/api/dora", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: DoraState) => setState(d))
      .catch(() => toast.error("Eroare la încărcare DORA"))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdateIncident(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/dora/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error("Eroare la actualizare"); return }
    const { incident } = await res.json() as { incident: DoraIncident }
    setState((prev) => prev ? { ...prev, incidents: prev.incidents.map((i) => i.id === id ? incident : i) } : prev)
    toast.success("Incident actualizat")
  }

  async function handleUpdateTprm(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/dora/tprm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error("Eroare la actualizare"); return }
    const { entry } = await res.json() as { entry: DoraTprmEntry }
    setState((prev) => prev ? { ...prev, tprm: prev.tprm.map((t) => t.id === id ? entry : t) } : prev)
    toast.success("Furnizor actualizat")
  }

  function onIncidentCreated(incident: DoraIncident) {
    setState((prev) => prev ? { ...prev, incidents: [incident, ...prev.incidents] } : prev)
    setShowIncidentForm(false)
    toast.success("Incident înregistrat")
  }

  function onTprmCreated(entry: DoraTprmEntry) {
    setState((prev) => prev ? { ...prev, tprm: [entry, ...prev.tprm] } : prev)
    setShowTprmForm(false)
    toast.success("Furnizor ICT adăugat")
  }

  if (loading) return <LoadingScreen />

  const incidents = state?.incidents ?? []
  const tprm = state?.tprm ?? []
  const openIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status))
  const majorOpen = openIncidents.filter((i) => i.severity === "major")
  const criticalProviders = tprm.filter((t) => t.criticality === "critical" && t.status === "active")

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageIntro
        title="DORA — Reziliență Operațională Digitală"
        description="Regulamentul EU 2022/2554 (DORA) — obligatoriu pentru instituții financiare. Gestionează incidentele ICT, furnizorii terți critici și testele de reziliență."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`border-eos-border ${majorOpen.length > 0 ? "border-red-300 bg-red-50/20" : ""}`}>
          <CardContent className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Incidente majore</p>
            <p className={`mt-1 text-2xl font-bold ${majorOpen.length > 0 ? "text-red-600" : "text-eos-text"}`}>
              {majorOpen.length}
            </p>
            <p className="text-[10px] text-eos-text-muted">{openIncidents.length} deschise total</p>
          </CardContent>
        </Card>
        <Card className="border-eos-border">
          <CardContent className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Furnizori critici</p>
            <p className="mt-1 text-2xl font-bold text-eos-text">{criticalProviders.length}</p>
            <p className="text-[10px] text-eos-text-muted">{tprm.length} furnizori total</p>
          </CardContent>
        </Card>
        <Card className="border-eos-border">
          <CardContent className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Teste reziliență</p>
            <p className="mt-1 text-2xl font-bold text-eos-text">{state?.resilienceTests.length ?? 0}</p>
            <p className="text-[10px] text-eos-text-muted">
              {(state?.resilienceTests ?? []).filter((t) => t.status === "completed").length} completate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DORA context banner */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="flex items-start gap-3 px-5 py-4">
          <Shield className="mt-0.5 size-4 shrink-0 text-blue-500" />
          <div className="text-xs text-eos-text-muted space-y-1">
            <p><span className="font-semibold text-eos-text">Termene DORA:</span> Incidente majore → raportare inițială la autoritate în <span className="font-semibold">4 ore</span>, raport detaliat în <span className="font-semibold">72 ore</span>, raport final în <span className="font-semibold">1 lună</span>.</p>
            <p>Furnizori ICT critici trebuie evaluați anual. Contractele trebuie să includă clauze DORA (Art. 30).</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-eos-border">
        {(["incidents", "tprm"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-eos-primary text-eos-primary"
                : "border-transparent text-eos-text-muted hover:text-eos-text"
            }`}
          >
            {tab === "incidents" ? `Incidente ICT (${incidents.length})` : `Furnizori TPRM (${tprm.length})`}
          </button>
        ))}
      </div>

      {/* ── Incidents tab ── */}
      {activeTab === "incidents" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setShowIncidentForm(true)}>
              <Plus className="size-3.5" />
              Raportează incident
            </Button>
          </div>

          {showIncidentForm && (
            <IncidentForm
              onCreated={onIncidentCreated}
              onCancel={() => setShowIncidentForm(false)}
            />
          )}

          {incidents.length === 0 && !showIncidentForm && (
            <EmptyState
              icon={ShieldAlert}
              title="Niciun incident ICT"
              label="Înregistrează incidentele ICT conform obligațiilor DORA Art. 17-23."
            />
          )}

          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} onUpdate={handleUpdateIncident} />
          ))}
        </div>
      )}

      {/* ── TPRM tab ── */}
      {activeTab === "tprm" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setShowTprmForm(true)}>
              <Plus className="size-3.5" />
              Adaugă furnizor ICT
            </Button>
          </div>

          {showTprmForm && (
            <TprmForm
              onCreated={onTprmCreated}
              onCancel={() => setShowTprmForm(false)}
            />
          )}

          {tprm.length === 0 && !showTprmForm && (
            <EmptyState
              icon={Shield}
              title="Niciun furnizor ICT înregistrat"
              label="Adaugă furnizorii ICT terți. Cei critici necesită evaluare anuală conform DORA Art. 28-30."
            />
          )}

          {tprm.map((entry) => (
            <TprmRow key={entry.id} entry={entry} onUpdate={handleUpdateTprm} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Incident Row ─────────────────────────────────────────────────────────────

function IncidentRow({
  incident: i,
  onUpdate,
}: {
  incident: DoraIncident
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [rootCause, setRootCause] = useState(i.rootCause ?? "")
  const [mitigation, setMitigation] = useState(i.mitigation ?? "")
  const isClosed = i.status === "resolved" || i.status === "closed"
  const dl = !isClosed ? timeLeft(i.initialReportDeadlineISO) : null

  const nextStatuses: DoraIncidentStatus[] = ({
    detected: ["under-analysis", "closed"],
    "under-analysis": ["notified-authority", "resolved", "closed"],
    "notified-authority": ["resolved", "closed"],
    resolved: ["closed"],
    closed: [],
  } as Record<DoraIncidentStatus, DoraIncidentStatus[]>)[i.status]

  return (
    <Card className={`border-eos-border ${i.severity === "major" && !isClosed ? "border-red-300 bg-red-50/20" : ""}`}>
      <CardContent className="px-5 py-4 space-y-3">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 min-w-0">
            {expanded ? <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" /> : <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-eos-text truncate">{i.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_BADGE[i.status]} className="text-[10px] normal-case tracking-normal">
                  {STATUS_LABELS[i.status]}
                </Badge>
                <Badge variant={SEVERITY_BADGE[i.severity]} className="text-[10px] normal-case tracking-normal">
                  {SEVERITY_LABELS[i.severity]}
                </Badge>
                {dl && (
                  <Badge variant={dl.urgent ? "destructive" : "outline"} className="text-[10px] normal-case tracking-normal gap-1">
                    <Clock className="size-2.5" />
                    {dl.label}
                  </Badge>
                )}
                <span className="text-xs text-eos-text-muted">
                  Detectat: {new Date(i.detectedAtISO).toLocaleDateString("ro-RO")}
                </span>
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Descriere</p>
              <p className="mt-1 text-sm text-eos-text whitespace-pre-wrap">{i.description}</p>
            </div>

            {i.affectedSystems.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Sisteme afectate</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {i.affectedSystems.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] normal-case">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {i.estimatedImpact && (
              <p className="text-xs text-eos-text-muted">Impact estimat: {i.estimatedImpact}</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Cauza rădăcină</label>
                <textarea
                  className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Cauza identificată..."
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Măsuri de remediere</label>
                <textarea
                  className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  rows={2}
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="Acțiuni întreprinse..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onUpdate(i.id, { rootCause, mitigation })}
              >
                Salvează
              </Button>
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "resolved" ? "default" : "outline"}
                  className="text-xs gap-1.5"
                  onClick={() => {
                    const patch: Record<string, unknown> = { status: s }
                    if (s === "notified-authority") patch.notifiedAuthorityAtISO = new Date().toISOString()
                    onUpdate(i.id, patch)
                  }}
                >
                  {s === "resolved" && <CheckCircle2 className="size-3.5" />}
                  {s === "notified-authority" && <ExternalLink className="size-3.5" />}
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>

            <div className="text-[10px] text-eos-text-muted space-y-0.5">
              <p>Termen raportare inițial: <span className={timeLeft(i.initialReportDeadlineISO).urgent ? "text-red-600 font-semibold" : ""}>{new Date(i.initialReportDeadlineISO).toLocaleString("ro-RO")}</span></p>
              <p>Termen raport final: {new Date(i.finalReportDeadlineISO).toLocaleDateString("ro-RO")}</p>
              {i.notifiedAuthorityAtISO && (
                <p>Raportat la autoritate: {new Date(i.notifiedAuthorityAtISO).toLocaleString("ro-RO")}</p>
              )}
              {i.resolvedAtISO && (
                <p>Rezolvat: {new Date(i.resolvedAtISO).toLocaleDateString("ro-RO")}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── TPRM Row ─────────────────────────────────────────────────────────────────

function TprmRow({
  entry: e,
  onUpdate,
}: {
  entry: DoraTprmEntry
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(e.notes ?? "")
  const contractEnd = timeLeft(e.contractEndISO)
  const isActive = e.status === "active"

  return (
    <Card className={`border-eos-border ${e.criticality === "critical" && e.riskLevel === "high" ? "border-orange-300 bg-orange-50/20" : ""}`}>
      <CardContent className="px-5 py-4 space-y-3">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-2 min-w-0">
            {expanded ? <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" /> : <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-eos-text">{e.providerName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={CRITICALITY_BADGE[e.criticality]} className="text-[10px] normal-case tracking-normal">
                  {CRITICALITY_LABELS[e.criticality]}
                </Badge>
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {e.serviceType}
                </Badge>
                <Badge
                  variant={e.riskLevel === "high" ? "destructive" : e.riskLevel === "medium" ? "warning" : "outline"}
                  className="text-[10px] normal-case tracking-normal"
                >
                  Risc {e.riskLevel === "high" ? "ridicat" : e.riskLevel === "medium" ? "mediu" : "scăzut"}
                </Badge>
                {isActive && contractEnd.urgent && (
                  <Badge variant="warning" className="text-[10px] normal-case tracking-normal gap-1">
                    <Clock className="size-2.5" />
                    Contract: {contractEnd.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs text-eos-text-muted">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider">Contract</p>
                <p>{new Date(e.contractStartISO).toLocaleDateString("ro-RO")} — {new Date(e.contractEndISO).toLocaleDateString("ro-RO")}</p>
              </div>
              {e.lastAssessmentISO && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Ultima evaluare</p>
                  <p>{new Date(e.lastAssessmentISO).toLocaleDateString("ro-RO")}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-eos-text-muted">Note</label>
              <textarea
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                rows={2}
                value={notes}
                onChange={(e2) => setNotes(e2.target.value)}
                placeholder="Observații, clauze speciale, riscuri identificate..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onUpdate(e.id, {
                  notes,
                  lastAssessmentISO: new Date().toISOString(),
                  nextAssessmentISO: new Date(Date.now() + 365 * 86_400_000).toISOString(),
                })}
              >
                Marchează evaluat azi
              </Button>
              {e.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdate(e.id, { status: "under-review" })}
                >
                  Pune sub revizuire
                </Button>
              )}
              {e.status === "under-review" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdate(e.id, { status: "active" })}
                >
                  Marchează activ
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Incident Form ────────────────────────────────────────────────────────────

function IncidentForm({
  onCreated,
  onCancel,
}: {
  onCreated: (incident: DoraIncident) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<DoraIncidentSeverity>("significant")
  const [occurredAt, setOccurredAt] = useState("")
  const [detectedAt, setDetectedAt] = useState(new Date().toISOString().slice(0, 16))
  const [affectedSystems, setAffectedSystems] = useState("")
  const [estimatedImpact, setEstimatedImpact] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !occurredAt || !detectedAt) {
      toast.error("Completează câmpurile obligatorii")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/dora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          occurredAtISO: new Date(occurredAt).toISOString(),
          detectedAtISO: new Date(detectedAt).toISOString(),
          affectedSystems: affectedSystems.split(",").map((s) => s.trim()).filter(Boolean),
          estimatedImpact: estimatedImpact.trim(),
        }),
      })
      if (!res.ok) throw new Error("Eroare")
      const { incident } = await res.json() as { incident: DoraIncident }
      onCreated(incident)
    } catch {
      toast.error("Nu am putut crea incidentul")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-eos-primary/30 bg-eos-primary/5">
      <CardHeader className="px-5 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Raportează incident ICT nou</CardTitle>
          <button type="button" onClick={onCancel} className="text-eos-text-muted hover:text-eos-text">
            <X className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Titlu incident *</label>
            <input
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary focus:ring-1 focus:ring-eos-primary"
              placeholder="ex: Atac ransomware pe serverul de producție"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Severitate *</label>
            <select
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as DoraIncidentSeverity)}
            >
              <option value="major">Major — raportare în 4h</option>
              <option value="significant">Semnificativ — raportare în 24h</option>
              <option value="minor">Minor — raportare în 72h</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Sisteme afectate</label>
            <input
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="Core banking, CRM, ... (separate prin virgulă)"
              value={affectedSystems}
              onChange={(e) => setAffectedSystems(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Data producerii *</label>
            <input
              type="datetime-local"
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Data detectării *</label>
            <input
              type="datetime-local"
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={detectedAt}
              onChange={(e) => setDetectedAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Descriere *</label>
            <textarea
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              rows={3}
              placeholder="Descrie incidentul: ce s-a întâmplat, impactul operațional, datele afectate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Impact estimat</label>
            <input
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: Indisponibilitate 2h, ~5000 clienți afectați"
              value={estimatedImpact}
              onChange={(e) => setEstimatedImpact(e.target.value)}
            />
          </div>
        </div>

        {severity === "major" && (
          <div className="rounded-eos-md border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">Incident major — trebuie raportat la autoritatea competentă (ASF/BNR) în <strong>4 ore</strong> de la detectare.</p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>Anulează</Button>
          <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()} className="gap-1.5">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Înregistrează incident
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── TPRM Form ────────────────────────────────────────────────────────────────

function TprmForm({
  onCreated,
  onCancel,
}: {
  onCreated: (entry: DoraTprmEntry) => void
  onCancel: () => void
}) {
  const [providerName, setProviderName] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [criticality, setCriticality] = useState<TprmCriticality>("important")
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium")
  const [contractStart, setContractStart] = useState("")
  const [contractEnd, setContractEnd] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!providerName.trim() || !serviceType.trim() || !contractStart || !contractEnd) {
      toast.error("Completează câmpurile obligatorii")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/dora/tprm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: providerName.trim(),
          serviceType: serviceType.trim(),
          criticality,
          riskLevel,
          contractStartISO: new Date(contractStart).toISOString(),
          contractEndISO: new Date(contractEnd).toISOString(),
        }),
      })
      if (!res.ok) throw new Error("Eroare")
      const { entry } = await res.json() as { entry: DoraTprmEntry }
      onCreated(entry)
    } catch {
      toast.error("Nu am putut adăuga furnizorul")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-eos-primary/30 bg-eos-primary/5">
      <CardHeader className="px-5 pt-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Adaugă furnizor ICT terț</CardTitle>
          <button type="button" onClick={onCancel} className="text-eos-text-muted hover:text-eos-text">
            <X className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Denumire furnizor *</label>
            <input
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: AWS, Microsoft Azure, Oracle..."
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Tip serviciu *</label>
            <input
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: Cloud hosting, Payment processing..."
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Criticitate DORA *</label>
            <select
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as TprmCriticality)}
            >
              <option value="critical">Critic — evaluare obligatorie anuală</option>
              <option value="important">Important</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Nivel de risc</label>
            <select
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as "low" | "medium" | "high")}
            >
              <option value="low">Scăzut</option>
              <option value="medium">Mediu</option>
              <option value="high">Ridicat</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Contract de la *</label>
            <input
              type="date"
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-eos-text-muted mb-1">Contract până la *</label>
            <input
              type="date"
              className="w-full rounded-eos-md border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>Anulează</Button>
          <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()} className="gap-1.5">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Adaugă furnizor
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
